// src/app/api/genres/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const genres = await prisma.genre.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return NextResponse.json(genres);
    } catch (error) {
        console.error('Помилка отримання жанрів:', error);
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}
