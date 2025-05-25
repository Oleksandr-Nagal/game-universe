// src/app/auth/signin/page.tsx
'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation'; // Додано useSearchParams
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SignInPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams(); // Отримуємо параметри URL
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/'); // Перенаправлення на домашню сторінку або дашборд, якщо користувач вже увійшов
        }
    }, [status, router]);

    useEffect(() => {
        // Перевіряємо наявність параметра 'error' у URL
        const authError = searchParams.get('error');
        if (authError === 'OAuthAccountNotLinked') {
            setError('Обліковий запис з такою електронною поштою вже існує, але він пов\'язаний з іншим способом входу. Будь ласка, увійдіть за допомогою свого початкового методу або зверніться до підтримки.');
        } else if (authError) {
            // Обробка інших можливих помилок NextAuth.js
            setError(`Помилка входу: ${authError.replace(/([A-Z])/g, ' $1').trim()}.`);
        }
    }, [searchParams]); // Залежність від searchParams

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Очищаємо попередні помилки
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false, // Запобігає перенаправленню NextAuth.js
                email,
                password,
            });

            if (result?.error) {
                setError(result.error);
            } else if (result?.ok) {
                // Успіх, NextAuth.js автоматично оновить сесію
                router.push('/'); // Або на дашборд
            }
        } catch (err) {
            setError('Виникла неочікувана помилка.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                Завантаження...
            </div>
        );
    }

    if (status === 'authenticated') {
        return null; // Має перенаправити через useEffect
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-4">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
                <h1 className="text-3xl font-bold text-center text-purple-400 mb-6">Увійти</h1>
                {error && (
                    <div className="bg-red-500 text-white p-3 rounded mb-4 text-center">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
                            Електронна пошта:
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 focus:border-purple-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
                            Пароль:
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 mb-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 focus:border-purple-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Вхід...' : 'Увійти'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-400">
                        Або увійдіть за допомогою:
                    </p>
                    <button
                        onClick={() => signIn('github')}
                        className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
                    >
                        Увійти за допомогою GitHub
                    </button>
                    <button
                        onClick={() => signIn('google')}
                        className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
                    >
                        Увійти за допомогою Google
                    </button>
                </div>

                <p className="mt-8 text-center text-gray-400">
                    Немає облікового запису? <Link href="/auth/register" className="text-blue-400 hover:underline">Зареєструватися</Link> (ще не реалізовано)
                </p>
            </div>
        </main>
    );
}
