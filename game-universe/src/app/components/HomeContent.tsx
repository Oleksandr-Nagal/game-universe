// src/app/HomeContent.tsx
'use client';

import Link from 'next/link';

type Props = {
    isAdmin: boolean;
    isAuthenticated: boolean;
};

export default function HomeContent({ isAdmin, isAuthenticated }: Props) {
    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 md:p-24 text-white overflow-hidden">
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-lg">
                    Ласкаво просимо до GameUniverse!
                </h1>
                <p className="text-lg sm:text-xl text-center mb-8 sm:mb-12 max-w-xl sm:max-w-2xl leading-relaxed">
                    Відкривайте, досліджуйте та поєднуйтесь зі своїми улюбленими відеоіграми.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <Link href="/games" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105">
                        Досліджуйте ігри
                    </Link>
                    <Link href="/about" className="px-6 py-3 border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105">
                        Про нас
                    </Link>
                    {isAuthenticated ? (
                        <Link href="/profile" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105">
                            Мій Профіль
                        </Link>
                    ) : (
                        <Link href="/auth/signin" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105">
                            Увійти
                        </Link>
                    )}
                </div>

                {isAdmin && (
                    <div className="mt-12 p-6 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 max-w-sm sm:max-w-md">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-red-400 mb-4">Доступ Адміністратора</h2>
                        <p className="text-md sm:text-lg text-gray-300 mb-6">
                            Ви увійшли як адміністратор. Ви можете отримати доступ до панелі адміністратора.
                        </p>
                        <Link href="/admin" className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105">
                            Панель Адміністратора
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
