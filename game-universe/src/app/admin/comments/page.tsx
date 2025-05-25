// src/app/admin/comments/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user: {
        id: string;
        name?: string | null;
        email: string;
        image?: string | null;
    };
    game: {
        id: string;
        title: string;
    };
}

export default function AdminCommentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        if (status === 'loading') return;

        if (!session || session.user?.role !== 'ADMIN') {
            router.push('/');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/comments');
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Помилка отримання коментарів: ${res.statusText}`);
            }
            const data: Comment[] = await res.json();
            setComments(data);
        } catch (err: any) {
            setError(err.message || 'Виникла неочікувана помилка при завантаженні коментарів.');
            console.error('Error fetching comments:', err);
        } finally {
            setLoading(false);
        }
    }, [session, status, router]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Ви впевнені, що хочете видалити цей коментар? Цю дію не можна скасувати.')) {
            return;
        }

        setDeletingCommentId(commentId);
        try {
            const res = await fetch(`/api/admin/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
                alert('Коментар успішно видалено.');
            } else {
                const errorData = await res.json();
                alert(`Помилка видалення: ${errorData.error || res.statusText}`);
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
            alert('Виникла помилка під час видалення коментаря.');
        } finally {
            setDeletingCommentId(null);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                Завантаження коментарів...
            </div>
        );
    }

    if (!session || session.user?.role !== 'ADMIN') {
        return null;
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                <p className="text-red-500 text-xl">Помилка: {error}</p>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-6 text-white">
            <div className="w-full max-w-6xl bg-gray-800/80 p-8 rounded-lg shadow-2xl border border-gray-700 mt-12 backdrop-blur-sm">
                <h1 className="text-4xl font-bold text-center text-yellow-400 mb-8">Керування Коментарями</h1>

                {comments.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg">Коментарів не знайдено.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-700/70 rounded-lg shadow-md border border-gray-600">
                            <thead>
                            <tr className="bg-gray-600/70">
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Користувач</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Гра</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Коментар</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Дата</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Дії</th>
                            </tr>
                            </thead>
                            <tbody>
                            {comments.map((comment) => (
                                <tr key={comment.id} className="border-b border-gray-600 hover:bg-gray-700">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            {comment.user?.image ? (
                                                <Image
                                                    src={comment.user.image}
                                                    alt={comment.user.name || 'User Avatar'}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full mr-2"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-xs mr-2">
                                                    {comment.user?.name ? comment.user.name[0].toUpperCase() : comment.user.email[0].toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-gray-300 text-sm">{comment.user?.name || comment.user.email}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-300">
                                        <Link href={`/games/${comment.game.id}`} className="text-blue-400 hover:underline">
                                            {comment.game.title}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4 text-gray-300 text-sm max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                                        {comment.content}
                                    </td>
                                    <td className="py-3 px-4 text-gray-400 text-sm">{new Date(comment.createdAt).toLocaleDateString()}</td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            disabled={deletingCommentId === comment.id}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition duration-300 disabled:opacity-50"
                                        >
                                            {deletingCommentId === comment.id ? 'Видалення...' : 'Видалити'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="text-center mt-8">
                    <Link href="/admin" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                        Назад до Панелі Адміністратора
                    </Link>
                </div>
            </div>
        </main>
    );
}
