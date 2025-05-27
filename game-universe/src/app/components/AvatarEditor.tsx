'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

const defaultAvatars = [
    '/avatars/avatar1.png',
    '/avatars/avatar2.png',
    '/avatars/avatar3.png',
    '/avatars/avatar4.png',
    '/avatars/avatar5.png',
];

// Ensure the component is exported
export function AvatarEditor({ currentImage }: { currentImage: string | null }) {
    const { data: session, update } = useSession();
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSelectAvatar = async (imageUrl: string) => {
        setMessage(null);
        setIsUpdating(true);

        try {
            const res = await fetch('/api/user/update-avatar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: session?.user?.id, imageUrl }),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                const updatedSession = await update({ image: updatedUser.image });
                console.log('AvatarEditor: Session updated after avatar change:', updatedSession);
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
            {message && (
                <p className={`text-center mt-4 ${message.includes('Помилка') ? 'text-red-400' : 'text-green-400'}`}>
                    {message}
                </p>
            )}
            {isUpdating && <p className="text-center text-gray-400 mt-2">Оновлення аватара...</p>}
        </div>
    );
}
