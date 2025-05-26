import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ заборонено. Потрібні права адміністратора.' }, { status: 403 });
    }

    // Очікуємо Promise для params
    const resolvedParams = await params;
    const gameIdToUpdate = resolvedParams.id;

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
    // Змінюємо тип context, щоб явно вказати, що params може бути Promise
    { params }: { params: Promise<{ id: string }> } // <-- Змінено тут
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ заборонено. Потрібні права адміністратора.' }, { status: 403 });
    }

    // Очікуємо Promise для params
    const resolvedParams = await params;
    const gameIdToDelete = resolvedParams.id;

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