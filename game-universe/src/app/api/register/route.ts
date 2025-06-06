// src/app/api/register/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        const MIN_NAME_LENGTH = 3;
        const MAX_NAME_LENGTH = 50;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Електронна пошта та пароль є обов\'язковими.' },
                { status: 400 }
            );
        }

        if (name && (typeof name !== 'string' || name.trim().length < MIN_NAME_LENGTH || name.trim().length > MAX_NAME_LENGTH)) {
            return NextResponse.json(
                { error: `Ім'я повинно містити від ${MIN_NAME_LENGTH} до ${MAX_NAME_LENGTH} символів.` },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Користувач з такою електронною поштою вже зареєстрований.' },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        if (!CLOUDINARY_CLOUD_NAME) {
            console.error('CLOUDINARY_CLOUD_NAME is not defined in environment variables.');
            return NextResponse.json(
                { error: 'Server configuration error: Cloudinary cloud name missing.' },
                { status: 500 }
            );
        }
        const defaultAvatarUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411203/avatar6.png`;

        const newUser = await prisma.user.create({
            data: {
                name: name ? name.trim() : null,
                email,
                password: hashedPassword,
                role: UserRole.USER,
                emailVerified: new Date(),
                image: defaultAvatarUrl,
            },
        });

        const userWithoutPassword = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            emailVerified: newUser.emailVerified,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
            image: newUser.image,
        };

        return NextResponse.json(
            { message: 'Користувача успішно зареєстровано!', user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error) {
        console.error('Помилка реєстрації користувача:', error);
        return NextResponse.json(
            { error: 'Помилка сервера під час реєстрації.' },
            { status: 500 }
        );
    }
}