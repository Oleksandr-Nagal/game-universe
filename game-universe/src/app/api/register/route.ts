// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Електронна пошта та пароль є обов\'язковими.' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Користувач з такою електронною поштою вже зареєстрований.' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: name || null,
                email,
                password: hashedPassword,
                role: UserRole.USER,
                emailVerified: new Date(),
            },
        });

        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json({ message: 'Користувача успішно зареєстровано!', user: userWithoutPassword }, { status: 201 });
    } catch (error) {
        console.error('Помилка реєстрації користувача:', error);
        return NextResponse.json({ error: 'Помилка сервера під час реєстрації.' }, { status: 500 });
    }
}
