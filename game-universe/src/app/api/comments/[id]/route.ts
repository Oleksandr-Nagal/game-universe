// src/app/api/comments/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/comments/[id] - Update a comment
export async function PATCH(
    request: Request,
    context: { params: { id: string } } // Використовуємо 'context' для доступу до params
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Authentication required to update a comment.' }, { status: 401 });
    }

    const commentIdToUpdate = context.params.id;
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim() === '') {
        return NextResponse.json({ error: 'Comment content is required and must be a non-empty string.' }, { status: 400 });
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentIdToUpdate },
        });

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
        }

        // Ensure only the owner or an admin can update the comment
        if (comment.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized to update this comment.' }, { status: 403 });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentIdToUpdate },
            data: { content: content.trim(), updatedAt: new Date() },
        });

        return NextResponse.json(updatedComment);
    } catch (error) {
        console.error('Error updating comment:', error);
        if (error instanceof Error && error.message.includes('Record to update does not exist')) {
            return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(
    request: Request,
    context: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Authentication required to delete a comment.' }, { status: 401 });
    }

    const commentIdToDelete = context.params.id;

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentIdToDelete },
        });

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
        }

        // Ensure only the owner or an admin can delete the comment
        if (comment.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized to delete this comment.' }, { status: 403 });
        }

        await prisma.comment.delete({
            where: { id: commentIdToDelete },
        });

        return NextResponse.json({ message: 'Comment successfully deleted.' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
