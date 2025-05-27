'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@prisma/client';

interface CustomUser {
    id: string;
    name?: string | null;
    image?: string | null;
    email?: string | null;
    role: UserRole;
    provider?: string;
}

interface CustomSession extends Session {
    user: CustomUser;
}

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
    updatedAt: string;
    userId: string;
    user: {
        id: string;
        name?: string | null;
        image?: string | null;
        email?: string | null;
    };
}

const MessageModal = ({ message, type, onConfirm, onCancel, onClose }: {
    message: string;
    type: 'alert' | 'confirm' | 'error';
    onConfirm?: () => void;
    onCancel?: () => void;
    onClose: () => void;
}) => {
    if (!message) return null;

    const isConfirm = type === 'confirm';
    const isError = type === 'error';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-sm w-full">
                <p className={`text-lg font-semibold mb-4 ${isError ? 'text-red-400' : 'text-white'}`}>
                    {message}
                </p>
                <div className="flex justify-end space-x-3">
                    {isConfirm && (
                        <button
                            onClick={() => { if (onCancel) onCancel(); onClose(); }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                        >
                            Скасувати
                        </button>
                    )}
                    <button
                        onClick={() => { if (onConfirm) onConfirm(); onClose(); }}
                        className={`px-4 py-2 rounded-md transition-colors ${
                            isConfirm ? 'bg-blue-600 hover:bg-blue-700' : (isError ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700')
                        } text-white`}
                    >
                        {isConfirm ? 'Підтвердити' : 'ОК'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function GameDetailPage() {
    const { id } = useParams();
    const { data: session, status } = useSession() as { data: CustomSession | null, status: 'loading' | 'authenticated' | 'unauthenticated' };

    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    const [comments, setComments] = useState<Comment[]>([]);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');

    const [modal, setModal] = useState<{
        message: string;
        type: 'alert' | 'confirm' | 'error';
        onConfirm?: () => void;
        onCancel?: () => void;
    } | null>(null);

    const showModal = useCallback((message: string, type: 'alert' | 'confirm' | 'error', onConfirm?: () => void, onCancel?: () => void) => {
        setModal({ message, type, onConfirm, onCancel });
    }, []);

    const closeModal = useCallback(() => {
        setModal(null);
    }, []);

    const fetchGame = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/games/${id}`);
            if (!res.ok) {
                const errorData = await res.json();
                const errorMsg = `Failed to fetch game: ${errorData.error || res.statusText}`;
                setError(errorMsg);
                console.error(errorMsg);
                return;
            }
            const data: Game = await res.json();
            setGame(data);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
                console.error('Error fetching game:', err);
            } else {
                setError('An unknown error occurred');
                console.error('Unknown error fetching game:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    const checkWishlistStatus = useCallback(async () => {
        if (!session?.user?.id || !game?.id) {
            setIsInWishlist(false);
            return;
        }
        setWishlistLoading(true);
        try {
            const res = await fetch(`/api/wishlist/status?gameId=${game.id}`);
            if (!res.ok) {
                console.error('Failed to fetch wishlist status');
                setIsInWishlist(false);
                return;
            }
            const data = await res.json();
            setIsInWishlist(data.isInWishlist);
        } catch (error) {
            console.error('Error checking wishlist status:', error);
            setIsInWishlist(false);
        } finally {
            setWishlistLoading(false);
        }
    }, [session?.user?.id, game?.id]);

    const fetchComments = useCallback(async () => {
        if (!id) return;
        setCommentLoading(true);
        setCommentError(null);
        try {
            const res = await fetch(`/api/comments?gameId=${id}`);
            if (!res.ok) {
                const errorData = await res.json();
                const errorMsg = `Failed to fetch comments: ${errorData.error || res.statusText}`;
                setCommentError(errorMsg);
                console.error(errorMsg);
                return;
            }
            const data: Comment[] = await res.json();
            setComments(data);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setCommentError(err.message);
                console.error('Error fetching comments:', err);
            } else {
                setCommentError('Помилка завантаження коментарів.');
                console.error('Unknown error fetching comments:', err);
            }
        } finally {
            setCommentLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            await fetchGame();
            await fetchComments();
        };

        void loadData();
    }, [id, fetchGame, fetchComments]);

    useEffect(() => {
        if (game?.id && status === 'authenticated') {
            const checkStatus = async () => {
                await checkWishlistStatus();
            };

            void checkStatus();
        }
    }, [game?.id, status, checkWishlistStatus]);

    const handleToggleWishlist = async () => {
        if (!session?.user?.id || !game?.id) {
            showModal('Вам потрібно увійти, щоб додати ігри до списку бажань.', 'alert');
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
                showModal(`Не вдалося оновити список бажань: ${errData.error || res.statusText}`, 'error');
            }
        } catch (err) {
            showModal('Виникла помилка під час оновлення списку бажань.', 'error');
            console.error(err);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id || !game?.id) {
            showModal('Вам потрібно увійти, щоб залишити коментар.', 'alert');
            return;
        }
        if (!newCommentContent.trim()) {
            showModal('Коментар не може бути порожнім.', 'alert');
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
                setComments(prev => [
                    {
                        ...addedComment,
                        user: {
                            id: session.user!.id,
                            name: session.user!.name,
                            image: session.user!.image,
                            email: session.user!.email,
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

    const handleEditClick = useCallback((comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentContent(comment.content);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingCommentId(null);
        setEditingCommentContent('');
        setCommentError(null);
    }, []);

    const handleUpdateComment = useCallback(async (commentId: string) => {
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
    }, [editingCommentContent]);

    const handleDeleteCommentConfirmed = useCallback(async (commentId: string) => {
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
    }, []);

    const handleDeleteComment = useCallback((commentId: string) => {
        showModal(
            'Ви впевнені, що хочете видалити цей коментар? Цю дію не можна скасувати.',
            'confirm',
            () => handleDeleteCommentConfirmed(commentId)
        );
    }, [showModal, handleDeleteCommentConfirmed]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                Завантаження деталей гри...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                <p className="text-red-500 text-xl">Помилка: {error}</p>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                <p className="text-yellow-500 text-xl">Гру не знайдено.</p>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-6 text-white">
            <div className="w-full max-w-4xl bg-gray-800/80 p-8 rounded-lg shadow-2xl border border-gray-700 mt-12 backdrop-blur-sm">
                <h1 className="text-4xl font-bold text-center text-orange-400 mb-6 break-words">{game.title}</h1>

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
                {!game.imageUrl && (
                    <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden shadow-lg bg-gray-700 flex items-center justify-center text-gray-400 text-xl">
                        Зображення недоступне
                    </div>
                )}

                <div className="mb-6 bg-gray-700/70 p-4 rounded-lg border border-gray-600">
                    <h2 className="text-2xl font-semibold text-white mb-3">Опис гри</h2>
                    <p className="text-gray-300 text-lg leading-relaxed break-words">{game.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg mb-8 bg-gray-700/70 p-4 rounded-lg border border-gray-600">
                    <p className="text-gray-400">
                        <span className="font-semibold text-white">Дата випуску:</span>{' '}
                        {game.releaseDate ? new Date(game.releaseDate).toLocaleDateString() : 'Невідомо'}
                    </p>
                    {game.developer?.name ? (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Розробник:</span> {game.developer.name}
                        </p>
                    ) : (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Розробник:</span> Невідомо
                        </p>
                    )}
                    {game.publisher?.name ? (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Видавець:</span> {game.publisher.name}
                        </p>
                    ) : (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Видавець:</span> Невідомо
                        </p>
                    )}
                    {Array.isArray(game.genres) && game.genres.length > 0 ? (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Жанри:</span>{' '}
                            {game.genres.map((g) => g.genre.name).join(', ')}
                        </p>
                    ) : (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Жанри:</span> Невідомо
                        </p>
                    )}
                    {Array.isArray(game.platforms) && game.platforms.length > 0 ? (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Платформи:</span>{' '}
                            {game.platforms.map((p) => p.platform.name).join(', ')}
                        </p>
                    ) : (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Платформи:</span> Невідомо
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
                        <Link href="/auth/signin" className="text-blue-400 hover:underline">Увійти</Link>, щоб додати до списку бажань.
                    </p>
                )}

                <section className="mt-10 p-6 bg-gray-700/70 rounded-lg shadow-inner border border-gray-600 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-yellow-300 mb-6 text-center">Коментарі</h2>

                    {status === 'authenticated' ? (
                        <form onSubmit={handleAddComment} className="mb-8 space-y-4">
                            <textarea
                                value={newCommentContent}
                                onChange={(e) => setNewCommentContent(e.target.value)}
                                placeholder="Напишіть свій коментар..."
                                rows={4}
                                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-400 min-h-[100px] resize-y"
                                disabled={commentLoading}
                            />
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
                            <Link href="/auth/signin" className="text-blue-400 hover:underline">Увійти</Link>, щоб залишити коментар.
                        </p>
                    )}

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
                                        <div>
                                            <p className="font-semibold text-white">
                                                {comment.user?.name || comment.user?.id || 'Невідомий користувач'}
                                            </p>
                                            {comment.user?.email && (
                                                <p className="text-gray-400 text-sm">{comment.user.email}</p>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-sm ml-auto">
                                            {new Date(comment.createdAt).toLocaleDateString()} о {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                                className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-500 focus:outline-none focus:border-blue-400 min-h-[80px] resize-y"
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
                    <Link
                        href="/games"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
                    >
                        Повернутися до всіх ігор
                    </Link>
                </div>
            </div>
            {modal && (
                <MessageModal
                    message={modal.message}
                    type={modal.type}
                    onConfirm={modal.onConfirm}
                    onCancel={modal.onCancel}
                    onClose={closeModal}
                />
            )}
        </main>
    );
}
