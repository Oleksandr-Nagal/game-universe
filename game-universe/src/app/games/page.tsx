// src/app/games/page.tsx
'use client'; // Цей компонент тепер є клієнтським

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Інтерфейси для даних
interface Game {
    id: string;
    title: string;
    description: string;
    releaseDate: string;
    imageUrl: string | null;
    developer?: { name: string };
    publisher?: { name: string };
    genres: { genre: { name: string } }[];
    platforms: { platform: { name: string } }[];
}

interface Option {
    id: string;
    name: string;
}

// Функція для скорочення тексту
const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
};

export default function GamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Стан для фільтрів
    const [searchTerm, setSearchTerm] = useState('');
    const [developerFilter, setDeveloperFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

    // Стан для доступних опцій фільтрів
    const [allGenres, setAllGenres] = useState<Option[]>([]);
    const [allPlatforms, setAllPlatforms] = useState<Option[]>([]);

    // Функція для отримання ігор з API з урахуванням фільтрів
    const fetchGames = useCallback(async () => {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('title', searchTerm);
        if (developerFilter) queryParams.append('developer', developerFilter);
        if (startDateFilter) queryParams.append('startDate', startDateFilter);
        if (endDateFilter) queryParams.append('endDate', endDateFilter);
        selectedGenres.forEach(genre => queryParams.append('genres', genre));
        selectedPlatforms.forEach(platform => queryParams.append('platforms', platform));

        try {
            const res = await fetch(`/api/games?${queryParams.toString()}`);
            if (!res.ok) {
                throw new Error(`Failed to fetch games: ${res.statusText}`);
            }
            const data = await res.json();
            setGames(data);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while fetching games');
            console.error('Error fetching games:', err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, developerFilter, startDateFilter, endDateFilter, selectedGenres, selectedPlatforms]);

    // Функція для отримання всіх жанрів з API
    const fetchAllGenres = useCallback(async () => {
        try {
            const res = await fetch('/api/genres');
            if (!res.ok) throw new Error('Failed to fetch genres.');
            const data: Option[] = await res.json();
            setAllGenres(data);
        } catch (err: any) {
            console.error('Error fetching genres:', err);
        }
    }, []);

    // Функція для отримання всіх платформ з API
    const fetchAllPlatforms = useCallback(async () => {
        try {
            const res = await fetch('/api/platforms');
            if (!res.ok) throw new Error('Failed to fetch platforms.');
            const data: Option[] = await res.json();
            setAllPlatforms(data);
        } catch (err: any) {
            console.error('Error fetching platforms:', err);
        }
    }, []);

    // Завантаження ігор та опцій фільтрів при першому рендері та зміні фільтрів
    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    useEffect(() => {
        fetchAllGenres();
        fetchAllPlatforms();
    }, [fetchAllGenres, fetchAllPlatforms]);

    // Обробники зміни для чекбоксів
    const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setSelectedGenres(prev =>
            checked ? [...prev, value] : prev.filter(genre => genre !== value)
        );
    };

    const handlePlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setSelectedPlatforms(prev =>
            checked ? [...prev, value] : prev.filter(platform => platform !== value)
        );
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setDeveloperFilter('');
        setStartDateFilter('');
        setEndDateFilter('');
        setSelectedGenres([]);
        setSelectedPlatforms([]);
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-6 text-white">
            <div className="w-full max-w-6xl mt-12 mb-12">
                <h1 className="text-4xl font-bold text-center text-teal-400 mb-10">Наша Колекція Ігор</h1>

                <div className="bg-gray-800/80 p-6 rounded-lg shadow-xl border border-gray-700 mb-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-blue-300 mb-4">Фільтри та Пошук</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="searchTerm" className="block text-gray-300 text-sm font-bold mb-2">Назва гри:</label>
                            <input
                                type="text"
                                id="searchTerm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Назва гри..."
                                className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="developerFilter" className="block text-gray-300 text-sm font-bold mb-2">Розробник:</label>
                            <input
                                type="text"
                                id="developerFilter"
                                value={developerFilter}
                                onChange={(e) => setDeveloperFilter(e.target.value)}
                                placeholder="Назва розробника..."
                                className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-400"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDateFilter" className="block text-gray-300 text-sm font-bold mb-2">Дата випуску (від):</label>
                                <input
                                    type="date"
                                    id="startDateFilter"
                                    value={startDateFilter}
                                    onChange={(e) => setStartDateFilter(e.target.value)}
                                    className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label htmlFor="endDateFilter" className="block text-gray-300 text-sm font-bold mb-2">Дата випуску (до):</label>
                                <input
                                    type="date"
                                    id="endDateFilter"
                                    value={endDateFilter}
                                    onChange={(e) => setEndDateFilter(e.target.value)}
                                    className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-400"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 lg:col-span-1">
                            <label className="block text-gray-300 text-sm font-bold mb-2">Жанри:</label>
                            <div className="grid grid-cols-2 gap-2 bg-gray-700 p-3 rounded-lg border border-gray-600 max-h-32 overflow-y-auto">
                                {allGenres.map((genre) => (
                                    <div key={genre.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`genre-${genre.id}`}
                                            value={genre.name}
                                            checked={selectedGenres.includes(genre.name)}
                                            onChange={handleGenreChange}
                                            className="form-checkbox h-4 w-4 text-yellow-500 rounded border-gray-400 focus:ring-yellow-500"
                                        />
                                        <label htmlFor={`genre-${genre.id}`} className="ml-2 text-gray-300 text-sm cursor-pointer">
                                            {genre.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2 lg:col-span-1">
                            <label className="block text-gray-300 text-sm font-bold mb-2">Платформи:</label>
                            <div className="grid grid-cols-2 gap-2 bg-gray-700 p-3 rounded-lg border border-gray-600 max-h-32 overflow-y-auto">
                                {allPlatforms.map((platform) => (
                                    <div key={platform.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`platform-${platform.id}`}
                                            value={platform.name}
                                            checked={selectedPlatforms.includes(platform.name)}
                                            onChange={handlePlatformChange}
                                            className="form-checkbox h-4 w-4 text-purple-500 rounded border-gray-400 focus:ring-purple-500"
                                        />
                                        <label htmlFor={`platform-${platform.id}`} className="ml-2 text-gray-300 text-sm cursor-pointer">
                                            {platform.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleResetFilters}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
                        >
                            Скинути фільтри
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-lg text-gray-400">Завантаження ігор...</div>
                ) : error ? (
                    <div className="text-center text-lg text-red-500">Помилка: {error}</div>
                ) : games.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg">Ігор за вашими критеріями не знайдено.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {games.map((game) => (
                            <div key={game.id} className="bg-gray-800/80 rounded-lg shadow-xl overflow-hidden border border-gray-700 transform hover:scale-105 transition-transform duration-300 backdrop-blur-sm">
                                <Link href={`/games/${game.id}`}>
                                    {game.imageUrl && (
                                        <div className="relative w-full h-48">
                                            <Image
                                                src={game.imageUrl}
                                                alt={game.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                style={{ objectFit: 'cover' }}
                                                className="rounded-t-lg"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold text-purple-400 mb-2 break-words">{game.title}</h2>
                                        <p className="text-gray-300 text-sm mb-4 break-words">
                                            {truncateText(game.description, 120)}
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            Дата випуску: {new Date(game.releaseDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
