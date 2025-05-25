// src/app/api/admin/comments/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    request: Request,
    context: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ заборонено. Потрібні права адміністратора.' }, { status: 403 });
    }

    const commentIdToDelete = context.params.id;

    try {
        const existingComment = await prisma.comment.findUnique({
            where: { id: commentIdToDelete },
        });

        if (!existingComment) {
            return NextResponse.json({ error: 'Коментар не знайдено.' }, { status: 404 });
        }

        await prisma.comment.delete({
            where: { id: commentIdToDelete },
        });

        return NextResponse.json({ message: 'Коментар успішно видалено.' });
    } catch (error) {
        console.error('Помилка видалення коментаря:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return NextResponse.json({ error: 'Коментар не знайдено.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}
