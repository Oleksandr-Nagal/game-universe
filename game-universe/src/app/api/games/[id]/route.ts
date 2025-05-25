// src/app/api/games/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
        return NextResponse.json({ error: 'Game ID is missing' }, { status: 400 });
    }

    try {
        const game = await prisma.game.findUnique({
            where: { id },
            include: {
                developer: true,
                publisher: true,
                genres: {
                    include: {
                        genre: true,
                    },
                },
                platforms: {
                    include: {
                        platform: true,
                    },
                },
            },
        });

        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        return NextResponse.json(game);
    } catch (error) {
        console.error('Error fetching game:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
