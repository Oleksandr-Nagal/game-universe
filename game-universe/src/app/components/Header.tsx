// src/components/Header.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Suspense } from 'react';

function AuthButtons() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div className="w-24 text-gray-400">Завантаження...</div>;
    }

    if (session) {
        return (
            <div className="flex items-center space-x-4">
                <Link href="/profile" className="text-blue-400 hover:underline font-semibold transition-colors">
                    Привіт, {session.user?.name || session.user?.email}
                </Link>
                {session.user?.role === 'ADMIN' && (
                    <Link href="/admin" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                        Адмін Панель
                    </Link>
                )}
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-4 py-2 rounded-lg font-semibold text-white transition duration-300
                               bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-md"
                >
                    Вийти
                </button>
            </div>
        );
    }

    return (
        <div className="flex space-x-4">
            <Link href="/auth/signin" className="px-4 py-2 rounded-lg font-semibold text-white transition duration-300
                               bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md">
                Увійти
            </Link>
            <Link href="/auth/register" className="px-4 py-2 rounded-lg font-semibold text-white transition duration-300
                               bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-md">
                Зареєструватись
            </Link>
        </div>
    );
}

export const Header = () => (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-lg rounded-b-lg">
        <h1 className="text-2xl font-bold">
            <Link href="/" className="text-orange-400 hover:text-orange-300 transition-colors">
                GameUniverse
            </Link>
        </h1>
        <nav className="space-x-6 text-lg flex items-center">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Головна</Link>
            <Link href="/games" className="text-gray-300 hover:text-white transition-colors">Ігри</Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition-colors">Про нас</Link>
        </nav>
        <Suspense fallback={<div className="w-24"></div>}>
            <AuthButtons />
        </Suspense>
    </header>
);
