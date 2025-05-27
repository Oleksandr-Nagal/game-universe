'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError('Паролі не співпадають.');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Не вдалося зареєструватись.');
                setIsLoading(false);
                return;
            }

            setSuccess('Реєстрація успішна! Перенаправлення до входу...');
            const signInResult = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (signInResult?.error) {
                setError('Реєстрація успішна, але автоматичний вхід не вдався: ' + signInResult.error);
                setIsLoading(false);
                return;
            }

            if (signInResult?.ok) {
                router.push('/');
            }
        } catch (err) {
            console.error('Помилка реєстрації:', err);
            setError('Виникла неочікувана помилка під час реєстрації.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center text-white p-4">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
                <h1 className="text-3xl font-bold text-center text-purple-400 mb-6">Зареєструватись</h1>
                <form onSubmit={handleSubmit} className="space-y-4" aria-label="registration form">
                    <div>
                        <label htmlFor="name" className="block text-gray-300 text-sm font-bold mb-2">Ім&#39;я:</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ваше ім'я"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline bg-white border-gray-600 focus:border-purple-500 mb-3"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">Електронна пошта:</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@example.com"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline bg-white border-gray-600 focus:border-purple-500 mb-3"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">Пароль:</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 pr-10 leading-tight focus:outline-none focus:shadow-outline bg-white border-gray-600 focus:border-purple-500 mb-3"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
                                style={{ bottom: '12px' }}
                                aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-bold mb-2">Підтвердіть пароль:</label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="********"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 pr-10 leading-tight focus:outline-none focus:shadow-outline bg-white border-gray-600 focus:border-purple-500 mb-3"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
                                style={{ bottom: '12px' }}
                                aria-label={showConfirmPassword ? 'Сховати пароль' : 'Показати пароль'}
                            >
                                <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} />
                            </button>
                        </div>
                    </div>
                    {error && (
                        <div role="alert" className="bg-red-500 text-white p-3 rounded mb-4 text-center" data-testid="error-message">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div role="alert" className="bg-green-500 text-white p-3 rounded mb-4 text-center" data-testid="success-message">
                            {success}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                        disabled={isLoading}
                        aria-busy={isLoading}
                    >
                        {isLoading ? 'Реєстрація...' : 'Зареєструватись'}
                    </button>
                </form>
                <p className="mt-8 text-center text-gray-400">
                    Вже маєте обліковий запис?{' '}
                    <Link href="/auth/signin" className="text-blue-400 hover:underline">
                        Увійти
                    </Link>
                </p>
            </div>
        </main>
    );
}
