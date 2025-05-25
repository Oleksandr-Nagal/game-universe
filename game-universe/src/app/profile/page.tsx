// src/app/profile/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AvatarEditor } from '../components/AvatarEditor';

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect('/auth/signin');
        return null; // Зупиняємо рендеринг
    }


    const user = session.user;

    return (
        <main className="flex min-h-screen flex-col items-center p-6  text-white">
            <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 mt-12">
                <h1 className="text-4xl font-bold text-center text-blue-400 mb-8">Мій Профіль</h1>

                <div className="flex flex-col items-center mb-8">
                    {user.image && (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 shadow-lg mb-4">
                            <Image
                                src={user.image}
                                alt={user.name || 'User Avatar'}
                                fill
                                sizes="128px"
                                style={{ objectFit: 'cover' }}
                                className="rounded-full"
                            />
                        </div>
                    )}
                    <h2 className="text-3xl font-semibold text-white mb-2">{user.name || 'Користувач GameUniverse'}</h2>
                    <p className="text-lg text-gray-400 mb-4">{user.email}</p>
                    <p className="text-md text-gray-300">
                        <span className="font-semibold text-purple-300">Роль:</span> {user.role || 'USER'}
                    </p>
                    {user.provider && (
                        <p className="text-md text-gray-300">
                            <span className="font-semibold text-purple-300">Увійшов через:</span> {user.provider}
                        </p>
                    )}
                </div>

                <AvatarEditor currentImage={user.image ?? null} />

                <section className="mt-10 p-6 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
                    <h3 className="text-2xl font-bold text-green-400 mb-4 text-center">Мої Ігрові Дані</h3>
                    <p className="text-lg text-gray-300 text-center mb-6">
                        Тут ви можете переглядати та керувати своїм списком бажань, коментарями.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/profile/wishlist" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                            Мій Список Бажань
                        </Link>
                        <Link href="/profile/comments" className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                            Мої Коментарі
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