// src/app/api/comments/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const userId = searchParams.get('userId');

    if (!gameId && !userId) {
        return NextResponse.json({ error: 'Game ID or User ID is required to fetch comments.' }, { status: 400 });
    }

    try {
        let comments;
        if (gameId) {
            comments = await prisma.comment.findMany({
                where: { gameId: gameId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        } else if (userId) {
            const session = await getServerSession(authOptions);
            if (!session || session.user?.id !== userId) {
                return NextResponse.json({ error: 'Unauthorized to view these comments.' }, { status: 403 });
            }
            comments = await prisma.comment.findMany({
                where: { userId: userId },
                include: {
                    game: {
                        select: {
                            id: true,
                            title: true,
                            imageUrl: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        }

        return NextResponse.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Authentication required to post a comment.' }, { status: 401 });
    }

    try {
        const { gameId, content } = await request.json();

        if (!gameId || !content) {
            return NextResponse.json({ error: 'Game ID and content are required for a comment.' }, { status: 400 });
        }

        const newComment = await prisma.comment.create({
            data: {
                userId: session.user.id,
                gameId: gameId,
                content: content,
            },
        });

        return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
        console.error('Error posting comment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
