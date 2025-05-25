// src/app/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
        <h1 className="text-6xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Welcome to GameUniverse!
        </h1>
        <p className="text-xl text-center mb-12 max-w-2xl">
          Discover, explore, and connect with your favorite video games.
        </p>

        <div className="flex gap-4">
          <Link href="/games" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
            Explore Games
          </Link>
          <Link href="/about" className="px-6 py-3 border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 font-semibold rounded-lg shadow-md transition duration-300">
            Learn More
          </Link>
          {session ? (
              <Link href="/dashboard" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                Go to Dashboard
              </Link>
          ) : (
              <Link href="/auth/signin" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                Sign In
              </Link>
          )}
        </div>

        {session && session.user?.role === 'ADMIN' && (
            <div className="mt-12 p-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
              <h2 className="text-3xl font-semibold text-red-400 mb-4">Admin Access</h2>
              <p className="text-lg text-gray-300 mb-6">
                You are logged in as an administrator. You can access the admin dashboard.
              </p>
              <Link href="/admin" className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                Admin Panel
              </Link>
            </div>
        )}
      </main>
  );
}
