import type { NextConfig } from 'next';
import type { Configuration as WebpackConfig } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
    // Конфігурація Webpack (якщо вона все ще потрібна)
    // Переконайтеся, що ви встановили @types/webpack, якщо отримуєте помилки TypeScript тут.
    webpack: (config: WebpackConfig) => {
        if (Array.isArray(config.externals)) {
            config.externals.push({
                "node-fetch": "commonjs node-fetch",
            });
        } else {
            config.externals = [
                { "node-fetch": "commonjs node-fetch" },
                ...(config.externals ? [config.externals] : [])
            ];
        }
        return config;
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'upload.wikimedia.org',
                // pathname: '/wikipedia/en/thumb/b/b9/Elden_Ring_cover_art.jpg/*', // Можна додати для більшої специфічності, але зазвичай не потрібно
            },
            {
                protocol: 'https',
                hostname: 'shared.fastly.steamstatic.com',
            },
            {
                protocol: 'https',
                hostname: 'image.api.playstation.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',

            },
            {
                protocol: 'https',
                hostname: 'kit.fontawesome.com', // Важливо: тільки домен, без шляху ".js"
            },
            // Додайте інші хости, якщо плануєте використовувати зображення з інших джерел
        ],
    },
    // Ця секція для overrides має бути додана до package.json, а не next.config.ts
    // overrides: {
    //     "@auth/core": "0.28.0"
    // }
};

export default nextConfig;
