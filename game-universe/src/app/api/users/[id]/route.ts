// src/app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id] - Отримати дані про конкретного користувача
export async function GET(
    request: Request,
    context: { params: { id: string } } // Залишаємо context для сумісності, але id отримуємо з URL
) {
    const session = await getServerSession(authOptions);

    // Перевірка автентифікації. Користувач повинен бути авторизований, щоб отримати дані.
    // Або це адміністратор, або користувач запитує власні дані.
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Аутентифікація потрібна для отримання даних користувача.' }, { status: 401 });
    }

    // Отримуємо ID користувача з URL
    const url = new URL(request.url);
    const userIdToFetch = url.pathname.split('/').pop();

    if (!userIdToFetch) {
        return NextResponse.json({ error: 'User ID is missing.' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userIdToFetch },
            select: { // Вибираємо лише необхідні поля для безпеки
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

        // Дозволяємо отримати дані, якщо це адміністратор або якщо користувач запитує власні дані
        if (session.user.id !== userIdToFetch && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Доступ заборонено. Ви можете переглядати лише власні дані або мати права адміністратора.' }, { status: 403 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Помилка отримання даних користувача:', error);
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}


// DELETE /api/users/[id] - Видалити користувача (тільки для адміністраторів)
export async function DELETE(
    request: Request,
    context: { params: { id: string } } // Залишаємо context для сумісності, але id отримуємо з URL
) {
    const session = await getServerSession(authOptions);

    // Перевірка автентифікації та ролі адміністратора
    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ заборонено. Потрібні права адміністратора.' }, { status: 403 });
    }

    // Отримуємо ID користувача з URL
    const url = new URL(request.url);
    const userIdToDelete = url.pathname.split('/').pop();

    if (!userIdToDelete) {
        return NextResponse.json({ error: 'User ID is missing.' }, { status: 400 });
    }

    // Запобігаємо видаленню самого себе
    if (session.user.id === userIdToDelete) {
        return NextResponse.json({ error: 'Ви не можете видалити власний обліковий запис через цю панель.' }, { status: 403 });
    }

    try {
        // Перевіряємо, чи існує користувач
        const existingUser = await prisma.user.findUnique({
            where: { id: userIdToDelete },
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'Користувача не знайдено.' }, { status: 404 });
        }

        // Видаляємо користувача
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
