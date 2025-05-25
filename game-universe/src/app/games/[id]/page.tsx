// src/app/games/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Game {
    id: string;
    title: string;
    description: string;
    releaseDate: string;
    imageUrl: string | null;
    developer?: { name: string };
    publisher?: { name: string };
    genres: { genre: { name: string } }[];
    platforms: { platform: { name: string } }[];
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string; // Додано updatedAt
    userId: string;
    user: {
        id: string;
        name?: string | null;
        image?: string | null;
    };
}

export default function GameDetailPage() {
    const { id } = useParams();
    const { data: session, status } = useSession();
    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    const [comments, setComments] = useState<Comment[]>([]);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null); // Стан для редагування
    const [editingCommentContent, setEditingCommentContent] = useState(''); // Стан для вмісту редагованого коментаря

    const fetchGame = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/games/${id}`);
            if (!res.ok) {
                throw new Error(`Failed to fetch game: ${res.statusText}`);
            }
            const data = await res.json();
            setGame(data);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const checkWishlistStatus = useCallback(async () => {
        if (!session?.user?.id || !game?.id) {
            setIsInWishlist(false);
            return;
        }
        try {
            const res = await fetch(`/api/wishlist/status?gameId=${game.id}`);
            if (res.ok) {
                const data = await res.json();
                setIsInWishlist(data.isInWishlist);
            } else {
                console.error('Failed to fetch wishlist status');
                setIsInWishlist(false);
            }
        } catch (error) {
            console.error('Error checking wishlist status:', error);
            setIsInWishlist(false);
        }
    }, [session?.user?.id, game?.id]);

    const fetchComments = useCallback(async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/comments?gameId=${id}`);
            if (!res.ok) {
                throw new Error(`Failed to fetch comments: ${res.statusText}`);
            }
            const data: Comment[] = await res.json();
            setComments(data);
        } catch (err: any) {
            setCommentError(err.message || 'Помилка завантаження коментарів.');
            console.error('Error fetching comments:', err);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchGame();
            fetchComments(); // Fetch comments when game ID is available
        }
    }, [id, fetchGame, fetchComments]);

    useEffect(() => {
        if (game?.id && status === 'authenticated') {
            checkWishlistStatus();
        }
    }, [game?.id, status, checkWishlistStatus]);

    const handleToggleWishlist = async () => {
        if (!session?.user?.id || !game?.id) {
            alert('Вам потрібно увійти, щоб додати ігри до списку бажань.');
            return;
        }

        setWishlistLoading(true);
        try {
            const method = isInWishlist ? 'DELETE' : 'POST';
            const res = await fetch('/api/wishlist', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gameId: game.id }),
            });

            if (res.ok) {
                setIsInWishlist(!isInWishlist);
            } else {
                const errData = await res.json();
                alert(`Не вдалося оновити список бажань: ${errData.error || res.statusText}`);
            }
        } catch (err) {
            alert('Виникла помилка під час оновлення списку бажань.');
            console.error(err);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id || !game?.id) {
            alert('Вам потрібно увійти, щоб залишити коментар.');
            return;
        }
        if (!newCommentContent.trim()) {
            alert('Коментар не може бути порожнім.');
            return;
        }

        setCommentLoading(true);
        setCommentError(null);

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gameId: game.id, content: newCommentContent }),
            });

            if (res.ok) {
                const addedComment: Comment = await res.json();
                // Fetch the user data for the newly added comment
                const userRes = await fetch(`/api/users/${session.user.id}`); // Assuming you have a user API endpoint
                const userData = userRes.ok ? await userRes.json() : null;

                setComments(prev => [
                    {
                        ...addedComment,
                        user: {
                            id: session.user!.id,
                            name: userData?.name || session.user!.name,
                            image: userData?.image || session.user!.image,
                        }
                    },
                    ...prev
                ]);
                setNewCommentContent('');
            } else {
                const errData = await res.json();
                setCommentError(errData.error || 'Не вдалося додати коментар.');
            }
        } catch (err) {
            setCommentError('Виникла помилка під час додавання коментаря.');
            console.error(err);
        } finally {
            setCommentLoading(false);
        }
    };

    const handleEditClick = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingCommentContent('');
        setCommentError(null);
    };

    const handleUpdateComment = async (commentId: string) => {
        if (!editingCommentContent.trim()) {
            setCommentError('Коментар не може бути порожнім.');
            return;
        }

        setCommentLoading(true);
        setCommentError(null);

        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: editingCommentContent }),
            });

            if (res.ok) {
                const updatedComment: Comment = await res.json();
                setComments(prev => prev.map(c =>
                    c.id === commentId ? { ...c, content: updatedComment.content, updatedAt: updatedComment.updatedAt } : c
                ));
                setEditingCommentId(null);
                setEditingCommentContent('');
            } else {
                const errData = await res.json();
                setCommentError(errData.error || 'Не вдалося оновити коментар.');
            }
        } catch (err) {
            setCommentError('Виникла помилка під час оновлення коментаря.');
            console.error(err);
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Ви впевнені, що хочете видалити цей коментар?')) {
            return;
        }

        setCommentLoading(true);
        setCommentError(null);

        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId));
            } else {
                const errData = await res.json();
                setCommentError(errData.error || 'Не вдалося видалити коментар.');
            }
        } catch (err) {
            setCommentError('Виникла помилка під час видалення коментаря.');
            console.error(err);
        } finally {
            setCommentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                Завантаження деталей гри...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                <p className="text-red-500 text-xl">Помилка: {error}</p>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                <p className="text-yellow-500 text-xl">Гру не знайдено.</p>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-6  text-white">
            <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 mt-12">
                <h1 className="text-4xl font-bold text-center text-orange-400 mb-6">{game.title}</h1>

                {game.imageUrl && (
                    <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
                        <Image
                            src={game.imageUrl}
                            alt={game.title}
                            fill
                            sizes="100vw"
                            style={{ objectFit: 'cover' }}
                            className="rounded-lg"
                        />
                    </div>
                )}

                <div className="mb-6">
                    <p className="text-gray-300 text-lg leading-relaxed">{game.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg mb-8">
                    <p className="text-gray-400"><span className="font-semibold text-white">Дата випуску:</span> {new Date(game.releaseDate).toLocaleDateString()}</p>
                    {game.developer && <p className="text-gray-400"><span className="font-semibold text-white">Розробник:</span> {game.developer.name}</p>}
                    {game.publisher && <p className="text-gray-400"><span className="font-semibold text-white">Видавець:</span> {game.publisher.name}</p>}
                    {game.genres.length > 0 && (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Жанри:</span>{' '}
                            {game.genres.map((gg) => gg.genre.name).join(', ')}
                        </p>
                    )}
                    {game.platforms.length > 0 && (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Платформи:</span>{' '}
                            {game.platforms.map((gp) => gp.platform.name).join(', ')}
                        </p>
                    )}
                </div>

                {status === 'authenticated' && (
                    <button
                        onClick={handleToggleWishlist}
                        disabled={wishlistLoading}
                        className={`w-full py-3 rounded-lg font-bold text-white transition duration-300 ${
                            isInWishlist ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                        } disabled:opacity-50`}
                    >
                        {wishlistLoading ? 'Оновлення списку бажань...' : isInWishlist ? 'Видалити зі списку бажань' : 'Додати до списку бажань'}
                    </button>
                )}
                {status === 'unauthenticated' && (
                    <p className="text-center text-gray-400 mt-4">
                        <Link href="/auth/signin" className="text-blue-400 hover:underline">Увійдіть</Link>, щоб додати до списку бажань.
                    </p>
                )}

                {/* Секція коментарів */}
                <section className="mt-10 p-6 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
                    <h2 className="text-3xl font-bold text-yellow-300 mb-6 text-center">Коментарі</h2>

                    {/* Форма для додавання коментарів */}
                    {status === 'authenticated' ? (
                        <form onSubmit={handleAddComment} className="mb-8 space-y-4">
                            <textarea
                                value={newCommentContent}
                                onChange={(e) => setNewCommentContent(e.target.value)}
                                placeholder="Напишіть свій коментар..."
                                rows={4}
                                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-400"
                                disabled={commentLoading}
                            ></textarea>
                            {commentError && <p className="text-red-400 text-sm">{commentError}</p>}
                            <button
                                type="submit"
                                disabled={commentLoading || !newCommentContent.trim()}
                                className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition duration-300 disabled:opacity-50"
                            >
                                {commentLoading ? 'Відправлення...' : 'Додати коментар'}
                            </button>
                        </form>
                    ) : (
                        <p className="text-center text-gray-400 mb-8">
                            <Link href="/auth/signin" className="text-blue-400 hover:underline">Увійдіть</Link>, щоб залишити коментар.
                        </p>
                    )}

                    {/* Список коментарів */}
                    {comments.length === 0 ? (
                        <p className="text-center text-gray-400">Ще немає коментарів. Будьте першим!</p>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
                                    <div className="flex items-center mb-2">
                                        {comment.user?.image && (
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden mr-3">
                                                <Image
                                                    src={comment.user.image}
                                                    alt={comment.user.name || 'User'}
                                                    fill
                                                    sizes="32px"
                                                    style={{ objectFit: 'cover' }}
                                                    className="rounded-full"
                                                />
                                            </div>
                                        )}
                                        <p className="font-semibold text-white">{comment.user?.name || comment.user?.id || 'Невідомий користувач'}</p>
                                        <p className="text-gray-500 text-sm ml-auto">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                            {comment.createdAt !== comment.updatedAt && (
                                                <span className="ml-2">(відредаговано)</span>
                                            )}
                                        </p>
                                    </div>
                                    {editingCommentId === comment.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={editingCommentContent}
                                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                                rows={3}
                                                className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-500 focus:outline-none focus:border-blue-400"
                                                disabled={commentLoading}
                                            ></textarea>
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleUpdateComment(comment.id)}
                                                    disabled={commentLoading || !editingCommentContent.trim()}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition duration-300 disabled:opacity-50"
                                                >
                                                    {commentLoading ? 'Збереження...' : 'Зберегти'}
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={commentLoading}
                                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg text-sm transition duration-300 disabled:opacity-50"
                                                >
                                                    Скасувати
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-gray-300">{comment.content}</p>
                                            {session?.user?.id === comment.userId || session?.user?.role === 'ADMIN' ? (
                                                <div className="flex space-x-2 mt-2">
                                                    <button
                                                        onClick={() => handleEditClick(comment)}
                                                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg text-xs transition duration-300"
                                                    >
                                                        Редагувати
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition duration-300"
                                                    >
                                                        Видалити
                                                    </button>
                                                </div>
                                            ) : null}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="text-center mt-8">
                    <Link href="/games" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                        Повернутися до всіх ігор
                    </Link>
                </div>
            </div>
        </main>
    );
}
