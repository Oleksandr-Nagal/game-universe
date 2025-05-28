// src/app/profile/components/AvatarEditor.tsx

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

const CLOUDINARY_CLOUD_NAME = 'dqordf8f5';

const defaultAvatars = [
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411202/avatar1.png`,
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411202/avatar2.png`,
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411202/avatar3.png`,
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411202/avatar4.jpg`,
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411202/avatar5.png`,
];

export function AvatarEditor({ currentImage }: { currentImage: string | null }) {
    const { update } = useSession();
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setMessage(null);
        } else {
            setSelectedFile(null);
            setPreviewUrl(null);
        }
    };

    const handleUploadImage = async () => {
        if (!selectedFile) {
            setMessage('Будь ласка, виберіть файл зображення для завантаження.');
            return;
        }

        setMessage(null);
        setIsUpdating(true);

        const formData = new FormData();
        formData.append('avatar', selectedFile);

        try {

            const res = await fetch('/api/user/update-avatar', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const updatedUser = await res.json();
                await update({ image: updatedUser.image });
                setMessage('Аватар успішно завантажено та оновлено!');
                setSelectedFile(null);
                setPreviewUrl(null);
            } else {
                const errorData = await res.json();
                setMessage(`Помилка: ${errorData.error || 'Не вдалося завантажити аватар.'}`);
            }
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            setMessage('Помилка сервера при завантаженні аватара.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSelectAvatar = async (imageUrl: string) => {
        setMessage(null);
        setIsUpdating(true);
        setSelectedFile(null);
        setPreviewUrl(null);

        try {
            const res = await fetch('/api/user/update-avatar', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl }),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                await update({ image: updatedUser.image });
                setMessage('Аватар успішно оновлено!');
            } else {
                const errorData = await res.json();
                setMessage(`Помилка: ${errorData.error || 'Не вдалося оновити аватар.'}`);
            }
        } catch (error) {
            console.error('Failed to update avatar:', error);
            setMessage('Помилка сервера при оновленні аватара.');
        } finally {
            setIsUpdating(false);
        }
    };


    return (
        <div className="mt-8 p-6 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4 text-center">Змінити Аватар</h3>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
                {defaultAvatars.map((url, index) => (
                    <div
                        key={index}
                        className={`relative w-20 h-20 rounded-full cursor-pointer overflow-hidden border-2 transition-all duration-200
                                ${currentImage === url ? 'border-yellow-400 shadow-xl' : 'border-gray-500 hover:border-yellow-300'}`}
                        onClick={() => handleSelectAvatar(url)}
                    >
                        <Image
                            src={url}
                            alt={`Avatar ${index + 1}`}
                            fill
                            sizes="80px"
                            style={{ objectFit: 'cover' }}
                            className="rounded-full"
                        />
                    </div>
                ))}
            </div>

            <div className="mt-6 border-t border-gray-600 pt-6">
                <h4 className="text-xl font-bold text-blue-400 mb-3 text-center">Завантажити свій аватар</h4>
                <div className="flex flex-col items-center gap-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        data-testid="file-input"
                        className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-purple-50 file:text-purple-700
                                  hover:file:bg-purple-100"
                        disabled={isUpdating}
                    />
                    {previewUrl && (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 shadow-md">
                            <Image
                                src={previewUrl}
                                alt="Preview"
                                fill
                                sizes="96px"
                                style={{ objectFit: 'cover' }}
                                className="rounded-full"
                            />
                        </div>
                    )}
                    <button
                        onClick={handleUploadImage}
                        disabled={!selectedFile || isUpdating}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300 disabled:opacity-50"
                    >
                        {isUpdating ? 'Завантаження...' : 'Завантажити'}
                    </button>
                </div>
            </div>


            {message && (
                <p className={`text-center mt-4 ${message.includes('Помилка') ? 'text-red-400' : 'text-green-400'}`}>
                    {message}
                </p>
            )}
            {isUpdating && <p className="text-center text-gray-400 mt-2">Оновлення аватара...</p>}
        </div>
    );
}
