// src/app/profile/wishlist/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface WishlistItem {
    id: string;
    gameId: string;
    addedAt: string;
    game: {
        id: string;
        title: string;
        imageUrl: string | null;
        description: string;
    };
}

export default function UserWishlistPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session || !session.user?.id) {
            router.push('/auth/signin');
            return;
        }

        const fetchWishlist = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/wishlist`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch wishlist: ${res.statusText}`);
                }
                const data: WishlistItem[] = await res.json();
                setWishlist(data);
            } catch (err: any) {
                setError(err.message || 'Помилка завантаження списку бажань.');
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [session, status, router]);

    const handleRemoveFromWishlist = async (gameId: string) => {
        if (!confirm('Ви впевнені, що хочете видалити цю гру зі списку бажань?')) {
            return;
        }

        setDeletingId(gameId);
        try {
            const res = await fetch('/api/wishlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId }),
            });

            if (res.ok) {
                setWishlist(prev => prev.filter(item => item.gameId !== gameId));
                alert('Гру успішно видалено зі списку бажань.');
            } else {
                const errorData = await res.json();
                alert(`Помилка: ${errorData.error || 'Не вдалося видалити гру зі списку бажань.'}`);
            }
        } catch (err) {
            console.error('Error removing from wishlist:', err);
            alert('Помилка сервера при видаленні зі списку бажань.');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                Завантаження списку бажань...
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
                <h1 className="text-4xl font-bold text-center text-blue-400 mb-8">Мій Список Бажань</h1>

                {wishlist.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg">
                        Ваш список бажань порожній. <Link href="/games" className="text-blue-400 hover:underline">Додайте ігри!</Link>
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {wishlist.map((item) => (
                            <div key={item.id} className="bg-gray-700 rounded-lg shadow-md overflow-hidden flex flex-col sm:flex-row items-center p-4">
                                <div className="relative w-24 h-24 flex-shrink-0 mr-4 rounded-lg overflow-hidden">
                                    <Image
                                        src={item.game.imageUrl || '/placeholder-game.jpg'}
                                        alt={item.game.title}
                                        fill
                                        sizes="96px"
                                        style={{ objectFit: 'cover' }}
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="flex-grow text-center sm:text-left mt-3 sm:mt-0">
                                    <Link href={`/games/${item.game.id}`} className="text-xl font-semibold text-purple-300 hover:underline">
                                        {item.game.title}
                                    </Link>
                                    <p className="text-gray-400 text-sm mt-1">Додано: {new Date(item.addedAt).toLocaleDateString()}</p>
                                    <p className="text-gray-500 text-xs line-clamp-2">{item.game.description}</p>
                                    <button
                                        onClick={() => handleRemoveFromWishlist(item.gameId)}
                                        disabled={deletingId === item.gameId}
                                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition duration-300 disabled:opacity-50"
                                    >
                                        {deletingId === item.gameId ? 'Видалення...' : 'Видалити'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-center mt-8">
                    <Link href="/profile" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                        Назад до Профілю
                    </Link>
                </div>
            </div>
        </main>
    );
}
