// src/app/api/games/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const title = searchParams.get('title');
        const developer = searchParams.get('developer');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        // Отримуємо масиви жанрів та платформ
        const genres = searchParams.getAll('genres');
        const platforms = searchParams.getAll('platforms');

        const where: any = {};

        if (title) {
            where.title = {
                contains: title,
                mode: 'insensitive', // Для пошуку без урахування регістру
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
                // Додаємо 1 день до кінцевої дати, щоб включити весь день
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
                            in: genres, // Пошук ігор, що належать до будь-якого з вибраних жанрів
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
                            in: platforms, // Пошук ігор, що доступні на будь-якій з вибраних платформ
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
