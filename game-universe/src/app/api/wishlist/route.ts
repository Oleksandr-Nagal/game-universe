// src/app/api/wishlist/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        const wishlistItems = await prisma.wishlist.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                game: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                        description: true,
                    },
                },
            },
            orderBy: {
                addedAt: 'desc',
            },
        });

        return NextResponse.json(wishlistItems);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        const { gameId } = await request.json();

        if (!gameId) {
            return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
        }

        const existingWishlistItem = await prisma.wishlist.findUnique({
            where: {
                userId_gameId: {
                    userId: session.user.id,
                    gameId: gameId,
                },
            },
        });

        if (existingWishlistItem) {
            return NextResponse.json({ error: 'Game already in wishlist' }, { status: 409 });
        }

        const newWishlistItem = await prisma.wishlist.create({
            data: {
                userId: session.user.id,
                gameId: gameId,
            },
        });

        return NextResponse.json(newWishlistItem, { status: 201 });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        const { gameId } = await request.json();

        if (!gameId) {
            return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
        }

        const deletedItem = await prisma.wishlist.delete({
            where: {
                userId_gameId: {
                    userId: session.user.id,
                    gameId: gameId,
                },
            },
        });

        return NextResponse.json({ message: 'Game successfully removed from wishlist.', deletedItem });
    } catch (error: any) {
        console.error('Error deleting from wishlist:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Game not found in your wishlist.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
