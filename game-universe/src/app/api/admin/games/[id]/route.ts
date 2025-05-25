// src/app/api/admin/games/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: Request,
    context: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ заборонено. Потрібні права адміністратора.' }, { status: 403 });
    }

    const gameIdToUpdate = context.params.id;
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

    try {
        let developerId = undefined;
        if (developerName) {
            const developer = await prisma.developer.upsert({
                where: { name: developerName },
                update: {},
                create: { name: developerName },
            });
            developerId = developer.id;
        }

        let publisherId = undefined;
        if (publisherName) {
            const publisher = await prisma.publisher.upsert({
                where: { name: publisherName },
                update: {},
                create: { name: publisherName },
            });
            publisherId = publisher.id;
        }

        const updatedGame = await prisma.game.update({
            where: { id: gameIdToUpdate },
            data: {
                title: title || undefined,
                description: description || undefined,
                releaseDate: releaseDate ? new Date(releaseDate) : undefined,
                imageUrl: imageUrl === '' ? null : imageUrl || undefined,
                developerId: developerId,
                publisherId: publisherId,
                genres: genreNames ? {
                    deleteMany: {},
                    create: genreNames.map((name: string) => ({
                        genre: {
                            connectOrCreate: {
                                where: { name },
                                create: { name },
                            },
                        },
                    })),
                } : undefined,
                platforms: platformNames ? {
                    deleteMany: {},
                    create: platformNames.map((name: string) => ({
                        platform: {
                            connectOrCreate: {
                                where: { name },
                                create: { name },
                            },
                        },
                    })),
                } : undefined,
            },
            include: {
                developer: true,
                publisher: true,
                genres: { include: { genre: true } },
                platforms: { include: { platform: true } },
            },
        });

        return NextResponse.json(updatedGame);
    } catch (error) {
        console.error('Помилка оновлення гри:', error);
        if (error instanceof Error && error.message.includes('Record to update does not exist')) {
            return NextResponse.json({ error: 'Гру не знайдено.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ заборонено. Потрібні права адміністратора.' }, { status: 403 });
    }

    const gameIdToDelete = context.params.id;

    try {
        const existingGame = await prisma.game.findUnique({
            where: { id: gameIdToDelete },
        });

        if (!existingGame) {
            return NextResponse.json({ error: 'Гру не знайдено.' }, { status: 404 });
        }

        await prisma.game.delete({
            where: { id: gameIdToDelete },
        });

        return NextResponse.json({ message: 'Гру успішно видалено.' });
    } catch (error) {
        console.error('Помилка видалення гри:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return NextResponse.json({ error: 'Гру не знайдено.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}
