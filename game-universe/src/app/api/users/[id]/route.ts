// src/app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Аутентифікація потрібна для отримання даних користувача.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userIdToFetch = url.pathname.split('/').pop();

    if (!userIdToFetch) {
        return NextResponse.json({ error: 'User ID is missing.' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userIdToFetch },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'Користувача не знайдено.' }, { status: 404 });
        }

        if (session.user.id !== userIdToFetch && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Доступ заборонено. Ви можете переглядати лише власні дані або мати права адміністратора.' }, { status: 403 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Помилка отримання даних користувача:', error);
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}


export async function DELETE(
    request: Request
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ заборонено. Потрібні права адміністратора.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const userIdToDelete = url.pathname.split('/').pop();

    if (!userIdToDelete) {
        return NextResponse.json({ error: 'User ID is missing.' }, { status: 400 });
    }

    if (session.user.id === userIdToDelete) {
        return NextResponse.json({ error: 'Ви не можете видалити власний обліковий запис через цю панель.' }, { status: 403 });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: userIdToDelete },
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'Користувача не знайдено.' }, { status: 404 });
        }

        await prisma.user.delete({
            where: { id: userIdToDelete },
        });

        return NextResponse.json({ message: 'Користувача успішно видалено.' });
    } catch (error) {
        console.error('Помилка видалення користувача:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return NextResponse.json({ error: 'Користувача не знайдено.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}
