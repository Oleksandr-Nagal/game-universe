import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/prisma';
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();

    if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid name provided' }, { status: 400 });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { name: name.trim() },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
            },
        });
        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error('Error updating user name:', error);
        return NextResponse.json({ error: 'Failed to update user name' }, { status: 500 });
    }
}