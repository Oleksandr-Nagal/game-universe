// src/app/api/wishlist/status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ isInWishlist: false }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
        return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }

    try {
        const wishlistItem = await prisma.wishlist.findUnique({
            where: {
                userId_gameId: {
                    userId: session.user.id,
                    gameId: gameId,
                },
            },
        });

        return NextResponse.json({ isInWishlist: !!wishlistItem });
    } catch (error) {
        console.error('Error checking wishlist status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}