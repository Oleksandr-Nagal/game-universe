// src/app/admin/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // Import prisma client

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/signin'); // Redirect unauthenticated users
    }

    if (session.user?.role !== 'ADMIN') {
        redirect('/'); // Redirect non-admin users
    }

    // Example: Fetch some admin-specific data
    const totalUsers = await prisma.user.count();
    const totalGames = await prisma.game.count();
    const totalComments = await prisma.comment.count();

    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-gray-900 text-white">
            <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 mt-12">
                <h1 className="text-4xl font-bold text-center text-red-400 mb-8">Admin Dashboard</h1>
                <p className="text-lg text-gray-300 text-center mb-10">
                    Welcome, {session.user.name || session.user.email}! You have administrative privileges.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gray-700 p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-2">Total Users</h2>
                        <p className="text-5xl font-extrabold text-blue-200">{totalUsers}</p>
                    </div>
                    <div className="bg-gray-700 p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-2xl font-semibold text-green-300 mb-2">Total Games</h2>
                        <p className="text-5xl font-extrabold text-green-200">{totalGames}</p>
                    </div>
                    <div className="bg-gray-700 p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-2xl font-semibold text-yellow-300 mb-2">Total Comments</h2>
                        <p className="text-5xl font-extrabold text-yellow-200">{totalComments}</p>
                    </div>
                </div>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-purple-400 mb-4">Admin Actions</h2>
                    <div className="flex flex-col gap-4">
                        <Link href="/admin/users" className="block p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold text-center transition duration-300">
                            Manage Users (Not implemented yet)
                        </Link>
                        <Link href="/admin/games" className="block p-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold text-center transition duration-300">
                            Manage Games (Not implemented yet)
                        </Link>
                    </div>
                </section>

                <div className="text-center mt-8">
                    <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                        Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}