// src/app/api/admin/games/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ заборонено. Потрібні права адміністратора.' }, { status: 403 });
    }

    try {
        const games = await prisma.game.findMany({
            include: {
                developer: true,
                publisher: true,
                genres: { include: { genre: true } },
                platforms: { include: { platform: true } },
            },
            orderBy: {
                releaseDate: 'desc',
            },
        });
        return NextResponse.json(games);
    } catch (error) {
        console.error('Помилка отримання ігор для адмін-панелі:', error);
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ заборонено. Потрібні права адміністратора.' }, { status: 403 });
    }

    try {
        const {
            title,
            description,
            releaseDate,
            imageUrl,
            developerName,
            publisherName,
            genreNames,
            platformNames,
        } = await request.json();

        if (!title || !description || !releaseDate || !developerName || !publisherName || !genreNames || !platformNames) {
            return NextResponse.json({ error: 'Будь ласка, заповніть усі обов\'язкові поля.' }, { status: 400 });
        }

        const existingGame = await prisma.game.findUnique({
            where: { title },
        });

        if (existingGame) {
            return NextResponse.json({ error: 'Гра з такою назвою вже існує.' }, { status: 409 });
        }

        const developer = await prisma.developer.upsert({
            where: { name: developerName },
            update: {},
            create: { name: developerName },
        });

        const publisher = await prisma.publisher.upsert({
            where: { name: publisherName },
            update: {},
            create: { name: publisherName },
        });

        const newGame = await prisma.game.create({
            data: {
                title,
                description,
                releaseDate: new Date(releaseDate),
                imageUrl: imageUrl || null,
                developerId: developer.id,
                publisherId: publisher.id,
                genres: {
                    create: genreNames.map((name: string) => ({
                        genre: {
                            connectOrCreate: {
                                where: { name },
                                create: { name },
                            },
                        },
                    })),
                },
                platforms: {
                    create: platformNames.map((name: string) => ({
                        platform: {
                            connectOrCreate: {
                                where: { name },
                                create: { name },
                            },
                        },
                    })),
                },
            },
        });

        return NextResponse.json(newGame, { status: 201 });
    } catch (error) {
        console.error('Помилка додавання гри:', error);
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}
