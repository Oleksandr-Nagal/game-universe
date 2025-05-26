import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // імпортуємо типи

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const title = searchParams.get('title');
        const developer = searchParams.get('developer');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const genres = searchParams.getAll('genres');
        const platforms = searchParams.getAll('platforms');

        const where: Prisma.GameWhereInput = {}; // ✅ типізовано

        if (title) {
            where.title = {
                contains: title,
                mode: 'insensitive',
            };
        }

        if (developer) {
            where.developer = {
                name: {
                    contains: developer,
                    mode: 'insensitive',
                },
            };
        }

        if (startDate || endDate) {
            where.releaseDate = {};
            if (startDate) {
                where.releaseDate.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1);
                where.releaseDate.lt = end;
            }
        }

        if (genres.length > 0) {
            where.genres = {
                some: {
                    genre: {
                        name: {
                            in: genres,
                        },
                    },
                },
            };
        }

        if (platforms.length > 0) {
            where.platforms = {
                some: {
                    platform: {
                        name: {
                            in: platforms,
                        },
                    },
                },
            };
        }

        const games = await prisma.game.findMany({
            where,
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

        return NextResponse.json(games);
    } catch (error) {
        console.error('Error fetching games with filters:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
