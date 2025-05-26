'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    game: {
        id: string;
        title: string;
        imageUrl: string | null;
    };
}

export default function UserCommentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session || !session.user?.id) {
            router.push('/auth/signin');
            return;
        }

        const fetchComments = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/comments?userId=${session.user.id}`);
                if (!res.ok) {
                    const errorMsg = `Failed to fetch comments: ${res.statusText}`;
                    setError(errorMsg);
                    console.error(errorMsg);
                    return;
                }
                const data: Comment[] = await res.json();
                setComments(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message || 'Помилка завантаження коментарів.');
                } else {
                    setError('Невідома помилка при завантаженні коментарів.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchComments().catch(err => {
            console.error('Unhandled fetchComments error:', err);
        });
    }, [session, status, router]);

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Ви впевнені, що хочете видалити цей коментар?')) {
            return;
        }

        setDeletingId(commentId);
        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setComments(prev => prev.filter(comment => comment.id !== commentId));
                alert('Коментар успішно видалено.');
            } else {
                const errorData = await res.json();
                alert(`Помилка: ${errorData.error || 'Не вдалося видалити коментар.'}`);
            }
        } catch (err: unknown) {
            console.error('Error deleting comment:', err);
            alert('Помилка сервера при видаленні коментаря.');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                Завантаження коментарів...
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

    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-gray-900 text-white">
            <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 mt-12">
                <h1 className="text-4xl font-bold text-center text-green-400 mb-8">Мої Коментарі</h1>

                {comments.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg">
                        У вас ще немає коментарів.{' '}
                        <Link href="/games" className="text-blue-400 hover:underline">
                            Знайдіть гру
                        </Link>{' '}
                        та залиште свій перший коментар!
                    </p>
                ) : (
                    <div className="space-y-6">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <Link
                                        href={`/games/${comment.game.id}`}
                                        className="text-xl font-semibold text-purple-300 hover:underline"
                                    >
                                        {comment.game.title}
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        disabled={deletingId === comment.id}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition duration-300 disabled:opacity-50"
                                    >
                                        {deletingId === comment.id ? 'Видалення...' : 'Видалити'}
                                    </button>
                                </div>
                                <p className="text-gray-300 text-md leading-relaxed mb-2">
                                    {comment.content}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Опубліковано:{' '}
                                    {new Date(comment.createdAt).toLocaleDateString()}{' '}
                                    {new Date(comment.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-center mt-8">
                    <Link
                        href="/profile"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
                    >
                        Назад до Профілю
                    </Link>
                </div>
            </div>
        </main>
    );
}
