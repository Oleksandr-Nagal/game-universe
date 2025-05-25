// src/app/games/page.tsx
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
};

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
        <main className="flex min-h-screen flex-col items-center p-6 text-white"> {/* Видалено bg-gray-900 */}
            <div className="w-full max-w-6xl mt-12 mb-12">
                <h1 className="text-4xl font-bold text-center text-teal-400 mb-10">Наша Колекція Ігор</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {games.map((game) => (
                        <div key={game.id} className="bg-gray-800/80 rounded-lg shadow-xl overflow-hidden border border-gray-700 transform hover:scale-105 transition-transform duration-300 backdrop-blur-sm">
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
                                    <p className="text-gray-300 text-sm mb-4">
                                        {truncateText(game.description, 120)} {/* Скорочений опис */}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        Дата випуску: {new Date(game.releaseDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
