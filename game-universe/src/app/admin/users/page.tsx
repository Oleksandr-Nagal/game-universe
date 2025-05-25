// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
    image: string | null;
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        if (status === 'loading') return;

        if (!session || session.user?.role !== 'ADMIN') {
            router.push('/');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/users');
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Помилка отримання користувачів: ${res.statusText}`);
            }
            const data: User[] = await res.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Виникла неочікувана помилка при завантаженні користувачів.');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, [session, status, router]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Ви впевнені, що хочете видалити цього користувача? Цю дію не можна скасувати.')) {
            return;
        }

        setDeletingUserId(userId);
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
                alert('Користувача успішно видалено.');
            } else {
                const errorData = await res.json();
                alert(`Помилка видалення: ${errorData.error || res.statusText}`);
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Виникла помилка під час видалення користувача.');
        } finally {
            setDeletingUserId(null);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                Завантаження користувачів...
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
                <h1 className="text-4xl font-bold text-center text-purple-400 mb-8">Керування Користувачами</h1>

                {users.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg">Користувачів не знайдено.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-700/70 rounded-lg shadow-md border border-gray-600">
                            <thead>
                            <tr className="bg-gray-600/70">
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Аватар</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Ім'я</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Email</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Роль</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Зареєстрований</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Дії</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-600 hover:bg-gray-700">
                                    <td className="py-3 px-4">
                                        {user.image ? (
                                            <Image
                                                src={user.image}
                                                alt={user.name || 'User Avatar'}
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-xs">
                                                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-300">{user.name || 'N/A'}</td>
                                    <td className="py-3 px-4 text-gray-300">{user.email}</td>
                                    <td className="py-3 px-4 text-gray-300">{user.role}</td>
                                    <td className="py-3 px-4 text-gray-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="py-3 px-4">
                                        {session.user?.id !== user.id ? (
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={deletingUserId === user.id}
                                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition duration-300 disabled:opacity-50"
                                            >
                                                {deletingUserId === user.id ? 'Видалення...' : 'Видалити'}
                                            </button>
                                        ) : (
                                            <span className="text-gray-500 text-sm">Ваш обліковий запис</span>
                                        )}
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
