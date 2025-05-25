import type { NextConfig } from 'next';
import type { Configuration as WebpackConfig } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
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
                hostname: 'kit.fontawesome.com',
            },
            {
                protocol: 'https',
                hostname: 'img.freepik.com',
            },
        ],
        dangerouslyAllowSVG: true,
    },
};

export default nextConfig;
