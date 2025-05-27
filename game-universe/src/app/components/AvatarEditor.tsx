'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Session } from 'next-auth';

interface AvatarEditorProps {
    currentImage: string | null;
    updateSessionAction: (data?: Partial<Session['user']> | undefined) => Promise<Session | null>;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ currentImage, updateSessionAction }) => {
    const defaultAvatars = [
        '/avatars/avatar1.png',
        '/avatars/avatar2.png',
        '/avatars/avatar3.png',
        '/avatars/avatar4.png',
        '/avatars/avatar5.png',
    ];

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleAvatarSelect = async (newImageUrl: string) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('/api/user/update-avatar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl: newImageUrl }),
            });

            if (res.ok) {
                await updateSessionAction({ image: newImageUrl });
                setSuccess('Аватар успішно оновлено!');
            } else {
                const errorData = await res.json();
                setError(errorData.error || 'Не вдалося оновити аватар.');
            }
        } catch (err) {
            console.error('Помилка оновлення аватара:', err);
            setError('Виникла помилка під час оновлення аватара.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="mt-8 p-6 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
            <h3 className="text-2xl font-bold text-blue-400 mb-4 text-center">Змінити Аватар</h3>
            <p className="text-lg text-gray-300 text-center mb-6">
                Оберіть новий аватар зі списку за замовчуванням.
            </p>

            <div className="flex justify-center mb-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-3 border-purple-400 shadow-lg">
                    <Image
                        src={currentImage || '/avatars/default.png'}
                        alt="Поточний аватар"
                        fill
                        sizes="96px"
                        style={{ objectFit: 'cover' }}
                        className="rounded-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 justify-items-center">
                {defaultAvatars.map((avatarUrl, index) => (
                    <button
                        key={index}
                        onClick={() => handleAvatarSelect(avatarUrl)}
                        disabled={loading}
                        className={`relative w-20 h-20 rounded-full overflow-hidden border-2 transition-all duration-300 ease-in-out
                                   ${currentImage === avatarUrl ? 'border-green-500 ring-2 ring-green-500' : 'border-gray-500 hover:border-blue-400'}
                                   ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                    >
                        <Image
                            src={avatarUrl}
                            alt={`Аватар ${index + 1}`}
                            fill
                            sizes="80px"
                            style={{ objectFit: 'cover' }}
                            className="rounded-full"
                        />
                    </button>
                ))}
            </div>

            {loading && (
                <p className="text-center text-blue-300 mt-4">Оновлення аватара...</p>
            )}
            {error && (
                <p className="text-center text-red-400 mt-4">{error}</p>
            )}
            {success && (
                <p className="text-center text-green-400 mt-4">{success}</p>
            )}
        </section>
    );
};
