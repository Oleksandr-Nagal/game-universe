// src/app/api/user/update-avatar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

function extractCloudinaryPublicId(imageUrl: string): string | null {

    try {
        const parts = imageUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) {
            return null;
        }

        const pathAfterUpload = parts.slice(uploadIndex + 1).join('/');

        const versionRegex = /^v\d+\//;
        const publicIdWithPath = pathAfterUpload.replace(versionRegex, '');

        const lastDotIndex = publicIdWithPath.lastIndexOf('.');
        if (lastDotIndex > -1) {
            return publicIdWithPath.substring(0, lastDotIndex);
        }
        return publicIdWithPath;
    } catch (e) {
        console.error("Помилка при вилученні public_id з URL:", imageUrl, e);
        return null;
    }
}


export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const avatarFile = formData.get('avatar') as File | null;

        if (!avatarFile) {
            return NextResponse.json({ error: 'Файл аватара не надано.' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(avatarFile.type)) {
            return NextResponse.json({ error: 'Неприпустимий тип файлу. Дозволено: JPG, PNG, WEBP, GIF.' }, { status: 400 });
        }

        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (avatarFile.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'Розмір файлу перевищує 5MB.' }, { status: 400 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { image: true },
        });

        const oldImageUrl = currentUser?.image;
        let publicIdToDelete: string | null = null;

        if (oldImageUrl && oldImageUrl.includes('res.cloudinary.com')) {

            publicIdToDelete = extractCloudinaryPublicId(oldImageUrl);
        }
        const arrayBuffer = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = `data:${avatarFile.type};base64,${buffer.toString('base64')}`;
        const newPublicId = `avatar_${session.user.id}_${Date.now()}`;
        const uploadResult = await cloudinary.uploader.upload(base64, {
            folder: 'game-universe-avatars',
            public_id: newPublicId,
            overwrite: false,
            transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                { quality: 'auto:eco' }
            ]
        });

        const publicImageUrl = uploadResult.secure_url;

        if (publicIdToDelete) {
            try {
                const folderPrefix = 'game-universe-avatars/';
                if (publicIdToDelete.startsWith(folderPrefix)) {
                    const expectedCloudName = process.env.CLOUDINARY_CLOUD_NAME;
                    if (oldImageUrl?.includes(`res.cloudinary.com/${expectedCloudName}`)) {
                        console.log(`Видалення старого аватара з Cloudinary: ${publicIdToDelete}`);
                        await cloudinary.uploader.destroy(publicIdToDelete);
                    } else {
                        console.log(`Старий аватар не є аватаром Cloudinary з правильним Cloud Name або з іншої папки, пропуск видалення: ${oldImageUrl}`);
                    }
                } else {
                    console.log(`Старий аватар не знаходиться в папці '${folderPrefix}', пропуск видалення: ${oldImageUrl}`);
                }
            } catch (deleteError) {
                console.error(`Помилка при видаленні старого аватара (${publicIdToDelete}) з Cloudinary:`, deleteError);
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { image: publicImageUrl },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
            },
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('Помилка завантаження/оновлення аватара на Cloudinary або оновлення користувача:', error);
        return NextResponse.json({ error: 'Помилка сервера під час завантаження/оновлення аватара.' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    try {
        const { imageUrl } = await req.json();

        if (typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
            return NextResponse.json({ error: 'Некоректний URL зображення.' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { image: imageUrl },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
            },
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('Помилка оновлення аватара за URL:', error);
        return NextResponse.json({ error: 'Помилка сервера під час оновлення аватара.' }, { status: 500 });
    }
}