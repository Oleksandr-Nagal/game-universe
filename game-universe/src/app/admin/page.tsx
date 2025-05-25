// src/app/admin/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/signin');
    }

    if (session.user?.role !== 'ADMIN') {
        redirect('/');
    }

    let totalUsers = 0;
    let totalGames = 0;
    let totalComments = 0;

    try {
        totalUsers = await prisma.user.count();
        totalGames = await prisma.game.count();
        totalComments = await prisma.comment.count();
    } catch (error) {
        console.error('Помилка завантаження даних для панелі адміністратора:', error);
        // Можна перенаправити на сторінку помилки: redirect('/error');
        // Або показати повідомлення про помилку на сторінці
        // Тут ми просто залишаємо значення 0
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-6 text-white">
            <div className="w-full max-w-4xl bg-gray-800/80 p-8 rounded-lg shadow-2xl border border-gray-700 mt-12 backdrop-blur-sm">
                <h1 className="text-4xl font-bold text-center text-red-400 mb-8">Панель Адміністратора</h1>
                <p className="text-lg text-gray-300 text-center mb-10">
                    Ласкаво просимо, {session.user.name || session.user.email}! Ви маєте адміністративні привілеї.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gray-700/70 p-6 rounded-lg shadow-md text-center border border-gray-600">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-2">Всього Користувачів</h2>
                        <p className="text-5xl font-extrabold text-blue-200">{totalUsers}</p>
                    </div>
                    <div className="bg-gray-700/70 p-6 rounded-lg shadow-md text-center border border-gray-600">
                        <h2 className="text-2xl font-semibold text-green-300 mb-2">Всього Ігор</h2>
                        <p className="text-5xl font-extrabold text-green-200">{totalGames}</p>
                    </div>
                    <div className="bg-gray-700/70 p-6 rounded-lg shadow-md text-center border border-gray-600">
                        <h2 className="text-2xl font-semibold text-yellow-300 mb-2">Всього Коментарів</h2>
                        <p className="text-5xl font-extrabold text-yellow-200">{totalComments}</p>
                    </div>
                </div>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-purple-400 mb-4">Дії Адміністратора</h2>
                    <div className="flex flex-col gap-4">
                        <Link href="/admin/users" className="block p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold text-center transition duration-300 shadow-md">
                            Керувати Користувачами
                        </Link>
                        <Link href="/admin/games" className="block p-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold text-center transition duration-300 shadow-md">
                            Керувати Іграми
                        </Link>
                        <Link href="/admin/comments" className="block p-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold text-center transition duration-300 shadow-md">
                            Керувати Коментарями
                        </Link>
                    </div>
                </section>

                <div className="text-center mt-8">
                    <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                        На головну
                    </Link>
                </div>
            </div>
        </main>
    );
}