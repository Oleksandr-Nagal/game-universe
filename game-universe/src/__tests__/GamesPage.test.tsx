import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';
import GamesPage from '../app/games/page';
import type { ImageProps, StaticImageData } from 'next/image';
import { useSession } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import { type MockedFunction } from 'jest-mock';
import { SessionContextValue } from 'next-auth/react';

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: ImageProps) => {
        const { src, alt, ...rest } = props;
        const srcString = typeof src === 'string' ? src : (src as StaticImageData).src || '';
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={srcString} alt={alt || ''} {...rest} />;
    },
}));

jest.mock('next/link', () => {
    const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    );
    MockLink.displayName = 'Link';
    return MockLink;
});

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
    authOptions: {},
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockGames = [
    {
        id: 'game-1',
        title: 'Game One',
        description: 'Description for game one.',
        releaseDate: '2023-01-01T00:00:00.000Z',
        imageUrl: '/images/game-1.jpg',
        developer: { name: 'Dev A' },
        publisher: { name: 'Pub X' },
        genres: [{ genre: { name: 'Action' } }],
        platforms: [{ platform: { name: 'PC' } }],
    },
    {
        id: 'game-2',
        title: 'Game Two',
        description: 'Description for game two.',
        releaseDate: '2023-02-01T00:00:00.000Z',
        imageUrl: '/images/game-2.jpg',
        developer: { name: 'Dev B' },
        publisher: { name: 'Pub Y' },
        genres: [{ genre: { name: 'Adventure' } }],
        platforms: [{ platform: { name: 'PS5' } }],
    },
];

const mockGenres = [
    { id: 'genre-1', name: 'Action' },
    { id: 'genre-2', name: 'Adventure' },
    { id: 'genre-3', name: 'RPG' },
];

const mockPlatforms = [
    { id: 'platform-1', name: 'PC' },
    { id: 'platform-2', name: 'PS5' },
    { id: 'platform-3', name: 'Xbox' },
];

describe('GamesPage', () => {
    let mockedUseSession: MockedFunction<typeof useSession>;
    let mockedGetServerSession: MockedFunction<typeof getServerSession>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockedUseSession = useSession as MockedFunction<typeof useSession>;
        mockedGetServerSession = getServerSession as MockedFunction<typeof getServerSession>;

        mockedUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        } as SessionContextValue);
        mockedGetServerSession.mockResolvedValue(null);

        mockFetch.mockImplementation((url: RequestInfo | URL) => {
            const urlString = url.toString();
            if (urlString.startsWith('/api/genres')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGenres) });
            }
            if (urlString.startsWith('/api/platforms')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPlatforms) });
            }
            if (urlString.startsWith('/api/games')) {
                const queryParams = new URLSearchParams(urlString.split('?')[1] || '');
                const title = queryParams.get('title');
                const developer = queryParams.get('developer');
                const startDate = queryParams.get('startDate');
                const endDate = queryParams.get('endDate');
                const genres = queryParams.getAll('genres');
                const platforms = queryParams.getAll('platforms');

                let filteredGames = [...mockGames];

                if (title) {
                    filteredGames = filteredGames.filter(game =>
                        game.title.toLowerCase().includes(title.toLowerCase())
                    );
                }
                if (developer) {
                    filteredGames = filteredGames.filter(game =>
                        game.developer?.name.toLowerCase().includes(developer.toLowerCase())
                    );
                }
                if (startDate) {
                    filteredGames = filteredGames.filter(game =>
                        new Date(game.releaseDate) >= new Date(startDate)
                    );
                }
                if (endDate) {
                    filteredGames = filteredGames.filter(game =>
                        new Date(game.releaseDate) <= new Date(endDate)
                    );
                }
                if (genres.length > 0) {
                    filteredGames = filteredGames.filter(game =>
                        game.genres.some(g => genres.includes(g.genre.name))
                    );
                }
                if (platforms.length > 0) {
                    filteredGames = filteredGames.filter(game =>
                        game.platforms.some(p => platforms.includes(p.platform.name))
                    );
                }
                return Promise.resolve({ ok: true, json: () => Promise.resolve(filteredGames) });
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });
    });

    test('renders loading state initially', () => {
        mockFetch.mockImplementation(() => new Promise(() => { }));
        render(<GamesPage />);
        expect(screen.getByText('Завантаження ігор...')).toBeInTheDocument();
    });

    test('displays error message if games fetch fails', async () => {
        mockFetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                statusText: 'Internal Server Error',
                json: () => Promise.resolve({ error: 'Failed to fetch' }),
            })
        );

        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('Помилка: Failed to fetch games: Internal Server Error')).toBeInTheDocument();
        });
    });

    test('displays "Ігор за вашими критеріями не знайдено." if no games are returned', async () => {
        mockFetch.mockImplementation((url: RequestInfo | URL) => {
            if (url.toString().startsWith('/api/games')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
            }
            if (url.toString().startsWith('/api/genres')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGenres) });
            }
            if (url.toString().startsWith('/api/platforms')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPlatforms) });
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });

        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('Ігор за вашими критеріями не знайдено.')).toBeInTheDocument();
        });
    });

    test('filters games by search term', async () => {
        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Назва гри...');
        await userEvent.type(searchInput, 'Game One');

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
            expect(screen.queryByText('Game Two')).not.toBeInTheDocument();
        });
    });

    test('filters games by developer', async () => {
        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
        });

        const developerInput = screen.getByPlaceholderText('Назва розробника...');
        await userEvent.type(developerInput, 'Dev A');

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
            expect(screen.queryByText('Game Two')).not.toBeInTheDocument();
        });
    });

    test('filters games by start date', async () => {
        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
        });

        const startDateInput = screen.getByLabelText('Дата випуску (від):');
        await userEvent.type(startDateInput, '2023-01-15');

        await waitFor(() => {
            expect(screen.queryByText('Game One')).not.toBeInTheDocument();
            expect(screen.getByText('Game Two')).toBeInTheDocument();
        });
    });

    test('filters games by end date', async () => {
        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
        });

        const endDateInput = screen.getByLabelText('Дата випуску (до):');
        await userEvent.type(endDateInput, '2023-01-15');

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
            expect(screen.queryByText('Game Two')).not.toBeInTheDocument();
        });
    });

    test('filters games by selected genres', async () => {
        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('Action')).toBeInTheDocument();
        });

        const actionGenreCheckbox = screen.getByLabelText('Action');
        await userEvent.click(actionGenreCheckbox);

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
            expect(screen.queryByText('Game Two')).not.toBeInTheDocument();
        });
    });

    test('filters games by selected platforms', async () => {
        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('PC')).toBeInTheDocument();
        });

        const pcPlatformCheckbox = screen.getByLabelText('PC');
        await userEvent.click(pcPlatformCheckbox);

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
            expect(screen.queryByText('Game Two')).not.toBeInTheDocument();
        });
    });

    test('resets all filters when "Скинути фільтри" button is clicked', async () => {
        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Назва гри...');
        await userEvent.type(searchInput, 'test');
        const developerInput = screen.getByPlaceholderText('Назва розробника...');
        await userEvent.type(developerInput, 'test');
        const startDateInput = screen.getByLabelText('Дата випуску (від):');
        await userEvent.type(startDateInput, '2020-01-01');
        const endDateInput = screen.getByLabelText('Дата випуску (до):');
        await userEvent.type(endDateInput, '2024-01-01');
        const actionGenreCheckbox = screen.getByLabelText('Action');
        await userEvent.click(actionGenreCheckbox);
        const pcPlatformCheckbox = screen.getByLabelText('PC');
        await userEvent.click(pcPlatformCheckbox);

        const resetButton = screen.getByRole('button', { name: 'Скинути фільтри' });
        await userEvent.click(resetButton);

        await waitFor(() => {
            expect(searchInput).toHaveValue('');
            expect(developerInput).toHaveValue('');
            expect(startDateInput).toHaveValue('');
            expect(endDateInput).toHaveValue('');
            expect(actionGenreCheckbox).not.toBeChecked();
            expect(pcPlatformCheckbox).not.toBeChecked();
            expect(mockFetch).toHaveBeenCalledWith('/api/games?');
        });
    });

    test('navigates to game detail page on game card click', async () => {
        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('Game One')).toBeInTheDocument();
        });

        const gameOneLink = screen.getByRole('link', { name: /Game One/i });
        expect(gameOneLink).toHaveAttribute('href', '/games/game-1');
    });

    test('truncateText does not truncate short text', async () => {
        const shortText = 'Short description.';
        mockFetch.mockImplementation((url: RequestInfo | URL) => {
            if (url.toString().startsWith('/api/games')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([{ ...mockGames[0], description: shortText }]),
                });
            }
            if (url.toString().startsWith('/api/genres')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGenres) });
            }
            if (url.toString().startsWith('/api/platforms')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPlatforms) });
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });

        render(<GamesPage />);

        await waitFor(() => {
            expect(screen.getByText('Short description.')).toBeInTheDocument();
        });
    });

    test('fetches genres and platforms on initial load', async () => {
        render(<GamesPage />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/genres');
            expect(mockFetch).toHaveBeenCalledWith('/api/platforms');
        });

        expect(screen.getByLabelText('Action')).toBeInTheDocument();
        expect(screen.getByLabelText('PC')).toBeInTheDocument();
    });

    test('handles genre fetch error gracefully', async () => {
        mockFetch.mockImplementation((url: RequestInfo | URL) => {
            if (url.toString().startsWith('/api/games')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGames) });
            }
            if (url.toString().startsWith('/api/genres')) {
                return Promise.resolve({ ok: false, statusText: 'Failed Genres', json: () => Promise.resolve({}) });
            }
            if (url.toString().startsWith('/api/platforms')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPlatforms) });
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<GamesPage />);

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch genres.');
        });
        expect(screen.queryByLabelText('Action')).not.toBeInTheDocument();
        consoleErrorSpy.mockRestore();
    });

    test('handles platforms fetch error gracefully', async () => {
        mockFetch.mockImplementation((url: RequestInfo | URL) => {
            if (url.toString().startsWith('/api/games')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGames) });
            }
            if (url.toString().startsWith('/api/genres')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGenres) });
            }
            if (url.toString().startsWith('/api/platforms')) {
                return Promise.resolve({ ok: false, statusText: 'Failed Platforms', json: () => Promise.resolve({}) });
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<GamesPage />);

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch platforms.');
        });
        expect(screen.queryByLabelText('PC')).not.toBeInTheDocument();
        consoleErrorSpy.mockRestore();
    });
});