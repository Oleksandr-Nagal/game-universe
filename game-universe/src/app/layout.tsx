// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Переконайтеся, що ви імпортуєте глобальні стилі
import { Providers } from "./components/providers"; // Ваш Providers компонент для NextAuth
import Image from 'next/image'; // Імпортуємо Image компонент
import { Header } from './components/Header'; // Імпортуємо Header
import { Footer } from './components/Footer'; // Імпортуємо Footer
import React from "react"; // React потрібен для JSX

// Конфігурація Font Awesome
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'; // Імпорт CSS стилів
config.autoAddCss = false; // Запобігає автоматичному додаванню CSS Font Awesome

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
        {/* Глобальне фонове зображення з напівпрозорим оверлеєм */}
        <div className="fixed inset-0 z-0 overflow-hidden"> {/* Використовуйте fixed для покриття всього вікна */}
            <Image
                src="https://img.freepik.com/free-vector/dark-hexagonal-background-with-gradient-color_79603-1409.jpg?semt=ais_hybrid&w=740"
                alt="Фон GameUniverse"
                fill
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                className="opacity-40" // Зробіть його трохи менш прозорим для кращого вигляду
            />
            {/* Темний оверлей для кращої читабельності тексту */}
            <div className="absolute inset-0 bg-gray-900 opacity-80"></div> {/* Збільшимо непрозорість фону для читабельності */}
        </div>

        {/* Контент сторінок: Header, children (основний контент) та Footer */}
        {/* Розміщуємо їх у відносному контейнері з z-index, щоб вони були над фоном */}
        <div className="relative z-10 flex flex-col min-h-screen w-full">
            <Providers>
                <Header />
                <div className="flex-grow"> {/* Цей div буде розтягуватися, щоб Footer був унизу */}
                    {children}
                </div>
                <Footer />
            </Providers>
        </div>
        </body>
        </html>
    );
}
