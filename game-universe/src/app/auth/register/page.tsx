// app/auth/register/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

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
                setError(data.error || 'Failed to register.');
                return;
            }

            setSuccess('Registration successful! Redirecting to login...');
            const signInResult = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (signInResult?.error) {
                setError('Registration successful, but failed to log in automatically: ' + signInResult.error);
            } else if (signInResult?.ok) {
                router.push('/profile');
            }

        } catch (err) {
            console.error('Registration error:', err);
            setError('An unexpected error occurred during registration.');
        }
    };

    return (
        <main className="flex items-center justify-center min-h-[calc(100vh-100px)] bg-gray-900">
            <div className="content-card bg-white text-gray-800"> {/* Змінено фон форми на світлий */}
                <h1 className="text-3xl font-bold text-center text-orange-600 mb-6">Зареєструватись</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Ім&#39;я</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ваше ім'я"
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@example.com"
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            className="input"
                            required
                        />
                    </div>
                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md border border-red-300">{error}</p>
                    )}
                    {success && (
                        <p className="text-green-500 text-sm text-center bg-green-100 p-2 rounded-md border border-green-300">{success}</p>
                    )}
                    <button
                        type="submit"
                        className="btn w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                    >
                        Зареєструватись
                    </button>
                </form>
                <p className="text-center text-gray-600 mt-4">
                    Вже маєте аккаунт?{' '}
                    <Link href="/auth/signin" className="text-blue-500 hover:underline nav-link">
                        Увійти
                    </Link>
                </p>
            </div>
        </main>
    );
}
