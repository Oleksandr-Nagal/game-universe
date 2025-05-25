// src/components/Navbar.tsx
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export function Navbar() {
    const { data: session, status } = useSession();

    return (
        <nav className="bg-gray-800 p-4 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-white text-2xl font-bold hover:text-purple-400 transition-colors">
                    GameUniverse
                </Link>

                <div className="flex items-center space-x-6">
                    <Link href="/games" className="text-gray-300 hover:text-white transition-colors">
                        Games
                    </Link>
                    <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                        About
                    </Link>

                    {status === 'authenticated' && session.user?.role === 'ADMIN' && (
                        <Link href="/admin" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                            Admin
                        </Link>
                    )}

                    {status === 'authenticated' ? (
                        <>
                            <span className="text-gray-300">Hello, {session.user?.name || session.user?.email}!</span>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => signIn()}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}