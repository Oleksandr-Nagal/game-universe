import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json(
            { error: 'Доступ заборонено. Потрібні права адміністратора.' },
            { status: 403 }
        );
    }

    // Розпаковуємо асинхронний params, отримуємо id
    const { id: commentIdToDelete } = await params;

    if (!commentIdToDelete) {
        return NextResponse.json(
            { error: 'ID коментаря не передано в параметрах.' },
            { status: 400 }
        );
    }

    try {
        const existingComment = await prisma.comment.findUnique({
            where: { id: commentIdToDelete },
        });

        if (!existingComment) {
            return NextResponse.json(
                { error: 'Коментар не знайдено.' },
                { status: 404 }
            );
        }

        await prisma.comment.delete({
            where: { id: commentIdToDelete },
        });

        return NextResponse.json({ message: 'Коментар успішно видалено.' });
    } catch (error) {
        console.error('Помилка видалення коментаря:', error);
        return NextResponse.json(
            { error: 'Внутрішня помилка сервера.' },
            { status: 500 }
        );
    }
}
