// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";
import Image from 'next/image';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import React from "react";

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "GameUniverse",
    description: "Discover, explore, and connect with your favorite video games.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="uk">
        <body className={`${inter.className} flex flex-col min-h-screen`}>
        <div className="fixed inset-0 z-0 overflow-hidden">
            <Image
                src="https://img.freepik.com/free-vector/dark-hexagonal-background-with-gradient-color_79603-1409.jpg?semt=ais_hybrid&w=740"
                alt="Фон GameUniverse"
                fill
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                className="opacity-40"
            />
            <div className="absolute inset-0 bg-gray-900 opacity-80"></div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen w-full">
            <Providers>
                <Header />
                <div className="flex-grow">
                    {children}
                </div>
                <Footer />
            </Providers>
        </div>
        </body>
        </html>
    );
}
