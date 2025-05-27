import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    const { imageUrl } = await req.json();

    if (!imageUrl) {
        return NextResponse.json({ error: 'URL зображення не надано' }, { status: 400 });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { image: imageUrl },
        });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = updatedUser;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Error updating user avatar:', error);
        return NextResponse.json({ error: 'Помилка оновлення аватара' }, { status: 500 });
    }
}