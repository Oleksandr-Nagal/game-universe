// src/app/api/admin/comments/route.ts
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
        const comments = await prisma.comment.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                game: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(comments);
    } catch (error) {
        console.error('Помилка отримання коментарів для адмін-панелі:', error);
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}
