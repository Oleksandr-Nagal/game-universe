'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AvatarEditor } from '../components/AvatarEditor';

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const [isEditingName, setIsEditingName] = useState(false);
    const [userName, setUserName] = useState(session?.user?.name || '');
    const [loadingNameUpdate, setLoadingNameUpdate] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [nameSuccess, setNameSuccess] = useState<string | null>(null);

    useEffect(() => {
        console.log('ProfilePage: useEffect - session.user.name changed to:', session?.user?.name);
        if (session?.user?.name) {
            setUserName(session.user.name);
        }
    }, [session?.user?.name]);

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                Завантаження профілю...
            </div>
        );
    }

    if (!session || !session.user) {
        redirect('/auth/signin');
    }

    const user = session.user;

    const handleSaveName = async () => {
        const trimmedName = userName.trim();

        setNameError(null);
        setNameSuccess(null);
        setLoadingNameUpdate(true);

        const MIN_NAME_LENGTH = 3;
        const MAX_NAME_LENGTH = 50;

        if (!trimmedName) {
            setNameError("Ім'я не може бути порожнім.");
            setLoadingNameUpdate(false);
            return;
        }

        if (trimmedName.length < MIN_NAME_LENGTH || trimmedName.length > MAX_NAME_LENGTH) {
            setNameError(`Ім'я повинно містити від ${MIN_NAME_LENGTH} до ${MAX_NAME_LENGTH} символів.`);
            setLoadingNameUpdate(false);
            return;
        }

        if (trimmedName === user.name) {
            setNameError("Ім'я не змінилося.");
            setLoadingNameUpdate(false);
            return;
        }

        try {
            const res = await fetch('/api/user', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: trimmedName }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                setNameError(errorData.error || "Не вдалося оновити ім'я.");
                return;
            }

            const updatedSession = await update({ name: trimmedName });
            console.log('ProfilePage: Session updated after name change:', updatedSession);

            setNameSuccess("Ім'я успішно оновлено!");
            setIsEditingName(false);
        } catch (err: unknown) {
            console.error('Непередбачена помилка оновлення імені:', err);
            setNameError(err instanceof Error ? err.message : "Виникла непередбачена помилка під час оновлення імені.");
        } finally {
            setLoadingNameUpdate(false);
        }
    };

    const handleCancelEditName = () => {
        setUserName(user.name || '');
        setIsEditingName(false);
        setNameError(null);
        setNameSuccess(null);
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-6 text-white">
            <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 mt-12">
                <h1 className="text-4xl font-bold text-center text-blue-400 mb-8">Мій Профіль</h1>

                <div className="flex flex-col items-center mb-8">
                    {user.image && (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 shadow-lg mb-4">
                            <Image
                                key={user.image}
                                src={user.image}
                                alt={user.name || 'User Avatar'}
                                fill
                                sizes="128px"
                                style={{ objectFit: 'cover' }}
                                className="rounded-full"
                            />
                        </div>
                    )}

                    {isEditingName ? (
                        <div className="flex flex-col items-center gap-2 mb-2 w-full max-w-sm">
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Введіть нове ім'я"
                                disabled={loadingNameUpdate}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveName}
                                    disabled={loadingNameUpdate || !userName.trim() || userName.trim() === user.name}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-300 disabled:opacity-50"
                                >
                                    {loadingNameUpdate ? 'Збереження...' : 'Зберегти'}
                                </button>
                                <button
                                    onClick={handleCancelEditName}
                                    disabled={loadingNameUpdate}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition duration-300 disabled:opacity-50"
                                >
                                    Скасувати
                                </button>
                            </div>
                            {nameError && <p className="text-red-400 text-sm mt-2">{nameError}</p>}
                            {nameSuccess && <p className="text-green-400 text-sm mt-2">{nameSuccess}</p>}
                        </div>
                    ) : (
                        <>
                            <h2 className="text-3xl font-semibold text-white mb-2">
                                {user.name || 'Користувач GameUniverse'}
                            </h2>
                            <p className="text-lg text-gray-400 mb-4">{user.email}</p>
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300 mb-4"
                            >
                                Редагувати ім&#39;я
                            </button>
                        </>
                    )}

                    <p className="text-md text-gray-300">
                        <span className="font-semibold text-purple-300">Роль:</span> {user.role || 'USER'}
                    </p>
                    {user.provider && (
                        <p className="text-md text-gray-300">
                            <span className="font-semibold text-purple-300">Увійшов через:</span> {user.provider}
                        </p>
                    )}
                </div>

                <AvatarEditor key={user.image || 'default-avatar'} currentImage={user.image ?? null} />

                <section className="mt-10 p-6 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
                    <h3 className="text-2xl font-bold text-green-400 mb-4 text-center">Мої Ігрові Дані</h3>
                    <p className="text-lg text-gray-300 text-center mb-6">
                        Тут ви можете переглядати та керувати своїм списком бажань, коментарями.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/profile/wishlist"
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
                        >
                            Мій Список Бажань
                        </Link>
                        <Link
                            href="/profile/comments"
                            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
                        >
                            Мої Коментарі
                        </Link>
                    </div>
                </section>

                <div className="text-center mt-8">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
                    >
                        На головну
                    </Link>
                </div>
            </div>
        </main>
    );
}
