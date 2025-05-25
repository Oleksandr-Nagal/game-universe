// src/app/admin/games/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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

// Інтерфейс для опцій жанрів/платформ
interface Option {
    id: string;
    name: string;
}

interface FormState {
    id: string | null; // Для редагування
    title: string;
    description: string;
    releaseDate: string;
    imageUrl: string;
    developerName: string;
    publisherName: string;
    selectedGenreNames: string[]; // Тепер масив рядків для вибраних жанрів
    selectedPlatformNames: string[]; // Тепер масив рядків для вибраних платформ
}

export default function AdminGamesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingGameId, setDeletingGameId] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false); // Для показу/приховування форми
    const [currentFormState, setCurrentFormState] = useState<FormState>({
        id: null,
        title: '',
        description: '',
        releaseDate: '',
        imageUrl: '',
        developerName: '',
        publisherName: '',
        selectedGenreNames: [], // Ініціалізуємо як порожній масив
        selectedPlatformNames: [], // Ініціалізуємо як порожній масив
    });

    const [allGenres, setAllGenres] = useState<Option[]>([]); // Стан для всіх доступних жанрів
    const [allPlatforms, setAllPlatforms] = useState<Option[]>([]); // Стан для всіх доступних платформ

    // Функція для отримання всіх ігор (для таблиці)
    const fetchGames = useCallback(async () => {
        if (status === 'loading') return;

        // Перевірка ролі адміністратора на клієнті (додатково до серверної)
        if (!session || session.user?.role !== 'ADMIN') {
            router.push('/'); // Перенаправлення, якщо не адміністратор
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/games'); // Адмінський API для ігор
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Помилка отримання ігор: ${res.statusText}`);
            }
            const data: Game[] = await res.json();
            setGames(data);
        } catch (err: any) {
            setError(err.message || 'Виникла неочікувана помилка при завантаженні ігор.');
            console.error('Error fetching games:', err);
        } finally {
            setLoading(false);
        }
    }, [session, status, router]);

    // Функція для отримання всіх жанрів з API
    const fetchAllGenres = useCallback(async () => {
        try {
            const res = await fetch('/api/genres');
            if (!res.ok) throw new Error('Failed to fetch genres.');
            const data: Option[] = await res.json();
            setAllGenres(data);
        } catch (err: any) {
            console.error('Error fetching genres:', err);
            setFormError('Не вдалося завантажити список жанрів.');
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
            setFormError('Не вдалося завантажити список платформ.');
        }
    }, []);

    // Завантаження даних при першому рендері
    useEffect(() => {
        fetchGames();
        fetchAllGenres();
        fetchAllPlatforms();
    }, [fetchGames, fetchAllGenres, fetchAllPlatforms]);

    // Обробник зміни текстових полів форми
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentFormState(prev => ({ ...prev, [name]: value }));
    };

    // Обробник зміни чекбоксів жанрів
    const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setCurrentFormState(prev => {
            const newSelectedGenres = checked
                ? [...prev.selectedGenreNames, value]
                : prev.selectedGenreNames.filter(name => name !== value);
            return { ...prev, selectedGenreNames: newSelectedGenres };
        });
    };

    // Обробник зміни чекбоксів платформ
    const handlePlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setCurrentFormState(prev => {
            const newSelectedPlatforms = checked
                ? [...prev.selectedPlatformNames, value]
                : prev.selectedPlatformNames.filter(name => name !== value);
            return { ...prev, selectedPlatformNames: newSelectedPlatforms };
        });
    };

    // Обробник відправки форми (додавання/редагування гри)
    const handleAddEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setIsSubmitting(true);

        const { id, title, description, releaseDate, imageUrl, developerName, publisherName, selectedGenreNames, selectedPlatformNames } = currentFormState;

        // Проста валідація
        if (!title || !description || !releaseDate || !developerName || !publisherName || selectedGenreNames.length === 0 || selectedPlatformNames.length === 0) {
            setFormError('Будь ласка, заповніть усі обов\'язкові поля (включаючи вибір жанрів та платформ).');
            setIsSubmitting(false);
            return;
        }

        try {
            const method = id ? 'PATCH' : 'POST';
            const url = id ? `/api/admin/games/${id}` : '/api/admin/games';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    releaseDate,
                    imageUrl,
                    developerName,
                    publisherName,
                    genreNames: selectedGenreNames, // Передаємо масив назв жанрів
                    platformNames: selectedPlatformNames, // Передаємо масив назв платформ
                }),
            });

            if (res.ok) {
                alert(`Гру успішно ${id ? 'оновлено' : 'додано'}!`);
                setShowForm(false);
                resetForm();
                fetchGames(); // Оновити список ігор
            } else {
                const errorData = await res.json();
                setFormError(errorData.error || `Не вдалося ${id ? 'оновити' : 'додати'} гру.`);
            }
        } catch (err) {
            console.error('Error adding/editing game:', err);
            setFormError('Виникла неочікувана помилка.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Обробник натискання кнопки "Редагувати"
    const handleEditClick = (game: Game) => {
        setCurrentFormState({
            id: game.id,
            title: game.title,
            description: game.description,
            releaseDate: new Date(game.releaseDate).toISOString().split('T')[0], // Форматуємо для input type="date"
            imageUrl: game.imageUrl || '',
            developerName: game.developer?.name || '',
            publisherName: game.publisher?.name || '',
            selectedGenreNames: game.genres.map(g => g.genre.name), // Витягуємо назви жанрів в масив
            selectedPlatformNames: game.platforms.map(p => p.platform.name), // Витягуємо назви платформ в масив
        });
        setShowForm(true);
    };

    // Обробник видалення гри
    const handleDeleteGame = async (gameId: string) => {
        if (!confirm('Ви впевнені, що хочете видалити цю гру? Цю дію не можна скасувати.')) {
            return;
        }

        setDeletingGameId(gameId);
        try {
            const res = await fetch(`/api/admin/games/${gameId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('Гру успішно видалено.');
                fetchGames(); // Оновити список ігор
            } else {
                const errorData = await res.json();
                alert(`Помилка видалення: ${errorData.error || res.statusText}`);
            }
        } catch (err) {
            console.error('Error deleting game:', err);
            alert('Виникла помилка під час видалення гри.');
        } finally {
            setDeletingGameId(null);
        }
    };

    // Скидання форми до початкового стану
    const resetForm = () => {
        setCurrentFormState({
            id: null,
            title: '',
            description: '',
            releaseDate: '',
            imageUrl: '',
            developerName: '',
            publisherName: '',
            selectedGenreNames: [],
            selectedPlatformNames: [],
        });
        setFormError(null);
    };

    // Відображення стану завантаження
    if (status === 'loading' || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                Завантаження ігор...
            </div>
        );
    }

    // Перенаправлення, якщо користувач не адміністратор
    if (!session || session.user?.role !== 'ADMIN') {
        return null; // Вже перенаправлено через useEffect
    }

    // Відображення помилки, якщо вона виникла
    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center text-white">
                <p className="text-red-500 text-xl">Помилка: {error}</p>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-6 text-white">
            <div className="w-full max-w-6xl bg-gray-800/80 p-8 rounded-lg shadow-2xl border border-gray-700 mt-12 backdrop-blur-sm">
                <h1 className="text-4xl font-bold text-center text-indigo-400 mb-8">Керування Іграми</h1>

                <div className="mb-6 text-center">
                    <button
                        onClick={() => {
                            setShowForm(!showForm);
                            resetForm();
                        }}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
                    >
                        {showForm ? 'Приховати форму' : 'Додати нову гру'}
                    </button>
                </div>

                {showForm && (
                    <div className="bg-gray-700/70 p-6 rounded-lg shadow-inner border border-gray-600 mb-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-yellow-300 mb-6 text-center">
                            {currentFormState.id ? 'Редагувати гру' : 'Додати нову гру'}
                        </h2>
                        {formError && (
                            <div className="bg-red-500 text-white p-3 rounded mb-4 text-center">
                                {formError}
                            </div>
                        )}
                        <form onSubmit={handleAddEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="title" className="block text-gray-300 text-sm font-bold mb-2">Назва:</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={currentFormState.title}
                                    onChange={handleFormChange}
                                    className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-400"
                                    maxLength={100} // Обмеження довжини назви
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="releaseDate" className="block text-gray-300 text-sm font-bold mb-2">Дата випуску:</label>
                                <input type="date" id="releaseDate" name="releaseDate" value={currentFormState.releaseDate} onChange={handleFormChange} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-400" required />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="description" className="block text-gray-300 text-sm font-bold mb-2">Опис:</label>
                                <textarea id="description" name="description" value={currentFormState.description} onChange={handleFormChange} rows={4} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-400 min-h-[100px] resize-y" required></textarea>
                            </div>
                            <div>
                                <label htmlFor="imageUrl" className="block text-gray-300 text-sm font-bold mb-2">URL зображення:</label>
                                <input type="text" id="imageUrl" name="imageUrl" value={currentFormState.imageUrl} onChange={handleFormChange} placeholder="http://example.com/image.jpg (необов'язково)" className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-400" />
                            </div>
                            <div>
                                <label htmlFor="developerName" className="block text-gray-300 text-sm font-bold mb-2">Розробник:</label>
                                <input type="text" id="developerName" name="developerName" value={currentFormState.developerName} onChange={handleFormChange} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-400" required />
                            </div>
                            <div>
                                <label htmlFor="publisherName" className="block text-gray-300 text-sm font-bold mb-2">Видавець:</label>
                                {/* Змінено bg-white на bg-gray-800 */}
                                <input type="text" id="publisherName" name="publisherName" value={currentFormState.publisherName} onChange={handleFormChange} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-400" required />
                            </div>
                            {/* Селектори жанрів (чекбокси) */}
                            <div className="md:col-span-2">
                                <label className="block text-gray-300 text-sm font-bold mb-2">Жанри:</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-800 p-3 rounded-lg border border-gray-600 max-h-40 overflow-y-auto">
                                    {allGenres.map((genre) => (
                                        <div key={genre.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`genre-${genre.id}`}
                                                value={genre.name}
                                                checked={currentFormState.selectedGenreNames.includes(genre.name)}
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
                            {/* Селектори платформ (чекбокси) */}
                            <div className="md:col-span-2">
                                <label className="block text-gray-300 text-sm font-bold mb-2">Платформи:</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-800 p-3 rounded-lg border border-gray-600 max-h-40 overflow-y-auto">
                                    {allPlatforms.map((platform) => (
                                        <div key={platform.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`platform-${platform.id}`}
                                                value={platform.name}
                                                checked={currentFormState.selectedPlatformNames.includes(platform.name)}
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

                            <div className="md:col-span-2 text-center">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition duration-300 disabled:opacity-50"
                                >
                                    {isSubmitting ? (currentFormState.id ? 'Оновлення...' : 'Додавання...') : (currentFormState.id ? 'Оновити гру' : 'Додати гру')}
                                </button>
                                {currentFormState.id && (
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); resetForm(); }}
                                        disabled={isSubmitting}
                                        className="ml-4 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-md transition duration-300 disabled:opacity-50"
                                    >
                                        Скасувати
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {games.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg">Ігор не знайдено. Додайте нову гру!</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-700/70 rounded-lg shadow-md border border-gray-600">
                            <thead>
                            <tr className="bg-gray-600/70">
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Зображення</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Назва</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Розробник</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Видавець</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200">Дії</th>
                            </tr>
                            </thead>
                            <tbody>
                            {games.map((game) => (
                                <tr key={game.id} className="border-b border-gray-600 hover:bg-gray-700">
                                    <td className="py-3 px-4">
                                        {game.imageUrl && (
                                            <Image
                                                src={game.imageUrl}
                                                alt={game.title}
                                                width={60}
                                                height={60}
                                                style={{ objectFit: 'cover' }}
                                                className="rounded-md"
                                            />
                                        )}
                                    </td>
                                    {/* Змінено, щоб уникнути зайвих пробілів */}
                                    <td className="py-3 px-4 text-gray-300 font-semibold max-w-xs truncate">{game.title}</td><td className="py-3 px-4 text-gray-300">{game.developer?.name || 'N/A'}</td><td className="py-3 px-4 text-gray-300">{game.publisher?.name || 'N/A'}</td><td className="py-3 px-4 flex space-x-2">
                                    <button
                                        onClick={() => handleEditClick(game)}
                                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg text-xs transition duration-300"
                                    >
                                        Редагувати
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGame(game.id)}
                                        disabled={deletingGameId === game.id}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition duration-300 disabled:opacity-50"
                                    >
                                        {deletingGameId === game.id ? 'Видалення...' : 'Видалити'}
                                    </button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="text-center mt-8">
                    <Link href="/admin" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
                        Назад до Панелі Адміністратора
                    </Link>
                </div>
            </div>
        </main>
    );
}
