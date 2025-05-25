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

export default function GameDetailPage() {
    const { id } = useParams();
    const { data: session, status } = useSession();
    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

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

    useEffect(() => {
        if (id) {
            fetchGame();
        }
    }, [id, fetchGame]);

    useEffect(() => {
        if (game?.id && status === 'authenticated') {
            checkWishlistStatus();
        }
    }, [game?.id, status, checkWishlistStatus]);

    const handleToggleWishlist = async () => {
        if (!session?.user?.id || !game?.id) {
            alert('You need to be logged in to add games to your wishlist.');
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
                alert(`Failed to update wishlist: ${errData.error || res.statusText}`);
            }
        } catch (err) {
            alert('An error occurred while updating wishlist.');
            console.error(err);
        } finally {
            setWishlistLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                Loading game details...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                <p className="text-red-500 text-xl">Error: {error}</p>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                <p className="text-yellow-500 text-xl">Game not found.</p>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-gray-900 text-white">
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
                    <p className="text-gray-400"><span className="font-semibold text-white">Release Date:</span> {new Date(game.releaseDate).toLocaleDateString()}</p>
                    {game.developer && <p className="text-gray-400"><span className="font-semibold text-white">Developer:</span> {game.developer.name}</p>}
                    {game.publisher && <p className="text-gray-400"><span className="font-semibold text-white">Publisher:</span> {game.publisher.name}</p>}
                    {game.genres.length > 0 && (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Genres:</span>{' '}
                            {game.genres.map((gg) => gg.genre.name).join(', ')}
                        </p>
                    )}
                    {game.platforms.length > 0 && (
                        <p className="text-gray-400">
                            <span className="font-semibold text-white">Platforms:</span>{' '}
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
                        {wishlistLoading ? 'Updating Wishlist...' : isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </button>
                )}
                {status === 'unauthenticated' && (
                    <p className="text-center text-gray-400 mt-4">
                        <Link href="/auth/signin" className="text-blue-400 hover:underline">Sign in</Link> to add to wishlist.
                    </p>
                )}

                <div className="text-center mt-8">
                    <Link href="/games" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                        Back to All Games
                    </Link>
                </div>
            </div>
        </main>
    );
}