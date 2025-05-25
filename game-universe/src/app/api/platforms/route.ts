// src/app/api/platforms/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const platforms = await prisma.platform.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return NextResponse.json(platforms);
    } catch (error) {
        console.error('Помилка отримання платформ:', error);
        return NextResponse.json({ error: 'Внутрішня помилка сервера.' }, { status: 500 });
    }
}
