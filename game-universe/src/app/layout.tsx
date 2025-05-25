// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './components/providers';
import React from "react"; // Import the Providers component

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'GameUniverse',
    description: 'Discover your next favorite game!',
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <Providers> {/* Wrap children with Providers */}
            {children}
        </Providers>
        </body>
        </html>
    );
}