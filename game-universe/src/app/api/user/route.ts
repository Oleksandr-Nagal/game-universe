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

    const MAX_NAME_LENGTH = 50;
    if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > MAX_NAME_LENGTH) {
        return NextResponse.json({ error: `Некоректне ім'я. Ім'я не може бути порожнім і має містити щонайбільше ${MAX_NAME_LENGTH} символів.` }, { status: 400 });
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
        return NextResponse.json({ error: 'Не вдалося оновити ім\'я користувача' }, { status: 500 });
    }
}
