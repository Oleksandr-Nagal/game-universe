// src/app/games/page.tsx
import { prisma } from '@/lib/prisma';
import Image from 'next/image'; // Use Next.js Image component
import Link from 'next/link';

export default async function GamesPage() {
    const games = await prisma.game.findMany({
        include: {
            developer: true,
            publisher: true,
            genres: {
                include: {
                    genre: true,
                },
            },
            platforms: {
                include: {
                    platform: true,
                },
            },
        },
        orderBy: {
            releaseDate: 'desc',
        },
    });

    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-gray-900 text-white">
            <div className="w-full max-w-6xl mt-12">
                <h1 className="text-4xl font-bold text-center text-teal-400 mb-10">Our Game Collection</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {games.map((game) => (
                        <div key={game.id} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                            <Link href={`/games/${game.id}`}>
                                {game.imageUrl && (
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={game.imageUrl}
                                            alt={game.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            style={{ objectFit: 'cover' }}
                                            className="rounded-t-lg"
                                        />
                                    </div>
                                )}
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-purple-400 mb-2">{game.title}</h2>
                                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">{game.description}</p>
                                    <p className="text-gray-400 text-sm">
                                        Release Date: {new Date(game.releaseDate).toLocaleDateString()}
                                    </p>
                                    {game.developer && (
                                        <p className="text-gray-400 text-sm">Developer: {game.developer.name}</p>
                                    )}
                                    {game.publisher && (
                                        <p className="text-gray-400 text-sm">Publisher: {game.publisher.name}</p>
                                    )}
                                    {game.genres.length > 0 && (
                                        <p className="text-gray-400 text-sm">
                                            Genres: {game.genres.map((gg) => gg.genre.name).join(', ')}
                                        </p>
                                    )}
                                    {game.platforms.length > 0 && (
                                        <p className="text-gray-400 text-sm">
                                            Platforms: {game.platforms.map((gp) => gp.platform.name).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}