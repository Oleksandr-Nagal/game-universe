import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdminGamesPage from '../app/admin/games/page';
import type { ImageProps, StaticImageData } from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: ImageProps) => {
        const { src, alt, width, height, style, ...rest } = props;
        const srcString = typeof src === 'string' ? src : (src as StaticImageData).src || '';
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={srcString} alt={alt || ''} width={width} height={height} style={style} {...rest} />;
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
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
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
        genres: [{ genre: { id: 'genre-1', name: 'Action' } }],
        platforms: [{ platform: { id: 'platform-1', name: 'PC' } }],
    },
    {
        id: 'game-2',
        title: 'Game Two',
        description: 'Description for game two.',
        releaseDate: '2023-02-01T00:00:00.000Z',
        imageUrl: '/images/game-2.jpg',
        developer: { name: 'Dev B' },
        publisher: { name: 'Pub Y' },
        genres: [{ genre: { id: 'genre-2', name: 'Adventure' } }],
        platforms: [{ platform: { id: 'platform-2', name: 'PS5' } }],
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

describe('AdminGamesPage', () => {
    let mockedUseSession: jest.Mock;
    let mockedUseRouter: jest.Mock;
    let mockPush: jest.Mock;
    let alertSpy: jest.SpyInstance;
    let confirmSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let currentMockGames: typeof mockGames;

    beforeEach(() => {
        jest.clearAllMocks();

        mockedUseSession = useSession as jest.Mock;
        mockedUseRouter = useRouter as jest.Mock;
        mockPush = jest.fn();
        mockedUseRouter.mockReturnValue({ push: mockPush });

        alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
        confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockedUseSession.mockReturnValue({
            data: { user: { role: 'ADMIN', id: 'admin-user-id' } },
            status: 'authenticated',
        });

        currentMockGames = [...mockGames];

        mockFetch.mockImplementation((url: RequestInfo | URL, options?: RequestInit) => {
            const urlString = url.toString();

            if (urlString.startsWith('/api/genres')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGenres) });
            }
            if (urlString.startsWith('/api/platforms')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPlatforms) });
            }
            if (urlString.startsWith('/api/admin/games')) {
                if (options?.method === 'GET' || options?.method === undefined) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(currentMockGames) });
                }
                if (options?.method === 'POST') {
                    const newGame = { id: `game-${currentMockGames.length + 1}`, ...JSON.parse(options.body as string) };
                    currentMockGames.push(newGame);
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(newGame) });
                }
                if (urlString.includes('/api/admin/games/') && options?.method === 'PATCH') {
                    const gameId = urlString.split('/').pop();
                    const updatedData = JSON.parse(options.body as string);
                    currentMockGames = currentMockGames.map(game =>
                        game.id === gameId ? { ...game, ...updatedData } : game
                    );
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
                }
                if (urlString.includes('/api/admin/games/') && options?.method === 'DELETE') {
                    const gameId = urlString.split('/').pop();
                    currentMockGames = currentMockGames.filter(game => game.id !== gameId);
                    return Promise.resolve({ ok: true });
                }
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });
    });

    afterEach(() => {
        cleanup();
        alertSpy.mockRestore();
        confirmSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    test('redirects to home if user is not authenticated', async () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    test('redirects to home if user is authenticated but not an ADMIN', async () => {
        mockedUseSession.mockReturnValue({ data: { user: { role: 'USER' } }, status: 'authenticated' });
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    test('displays loading state initially', () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'loading' });
        render(<AdminGamesPage />);
        expect(screen.getByText('Завантаження ігор...')).toBeInTheDocument();
    });

    test('renders games correctly for an ADMIN user', async () => {
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getByText('Керування Іграми')).toBeInTheDocument();
            expect(screen.getByText('Game One')).toBeInTheDocument();
            expect(screen.getByText('Game Two')).toBeInTheDocument();
            expect(screen.getByAltText('Game One')).toBeInTheDocument();
            expect(screen.getByAltText('Game Two')).toBeInTheDocument();
            expect(screen.getByText('Dev A')).toBeInTheDocument();
            expect(screen.getByText('Pub X')).toBeInTheDocument();
        });
    });

    test('displays error message if games fetch fails', async () => {
        mockFetch.mockImplementationOnce((url: RequestInfo | URL, _options?: RequestInit) => { // Added _ to options
            if (url.toString().startsWith('/api/admin/games') && (_options?.method === 'GET' || _options?.method === undefined)) {
                return Promise.resolve({
                    ok: false,
                    statusText: 'Not Found',
                    json: () => Promise.resolve({ error: 'Games not found' }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        });

        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getByText('Помилка: Games not found')).toBeInTheDocument();
        });
    });

    test('displays "Ігор не знайдено" if no games are returned', async () => {
        mockFetch.mockImplementationOnce((url: RequestInfo | URL, _options?: RequestInit) => { // Added _ to options
            if (url.toString().startsWith('/api/admin/games') && (_options?.method === 'GET' || _options?.method === undefined)) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        });

        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getByText('Ігор не знайдено. Додайте нову гру!')).toBeInTheDocument();
        });
    });

    test('toggles form visibility when "Додати нову гру" button is clicked', async () => {
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Додати нову гру' })).toBeInTheDocument();
        });
        const addButton = screen.getByRole('button', { name: 'Додати нову гру' });
        await userEvent.click(addButton);
        await waitFor(() => {
            expect(screen.getByText('Додати нову гру', { selector: 'h2' })).toBeInTheDocument();
        });
        await userEvent.click(addButton);
        await waitFor(() => {
            expect(screen.queryByText('Додати нову гру', { selector: 'h2' })).not.toBeInTheDocument();
        });
    });

    test('handles form input changes', async () => {
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Додати нову гру' })).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('button', { name: 'Додати нову гру' }));

        const titleInput = screen.getByLabelText('Назва:');
        await userEvent.type(titleInput, 'New Game Title');
        expect(titleInput).toHaveValue('New Game Title');

        const descriptionInput = screen.getByLabelText('Опис:');
        await userEvent.type(descriptionInput, 'New Game Description');
        expect(descriptionInput).toHaveValue('New Game Description');

        const releaseDateInput = screen.getByLabelText('Дата випуску:');
        await userEvent.type(releaseDateInput, '2024-05-20');
        expect(releaseDateInput).toHaveValue('2024-05-20');

        const imageUrlInput = screen.getByLabelText('URL зображення:');
        await userEvent.type(imageUrlInput, 'https://example.com/new-game.jpg');
        expect(imageUrlInput).toHaveValue('https://example.com/new-game.jpg');

        const developerInput = screen.getByLabelText('Розробник:');
        await userEvent.type(developerInput, 'New Dev');
        expect(developerInput).toHaveValue('New Dev');

        const publisherInput = screen.getByLabelText('Видавець:');
        await userEvent.type(publisherInput, 'New Pub');
        expect(publisherInput).toHaveValue('New Pub');
    });

    test('handles genre and platform checkbox changes', async () => {
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Додати нову гру' })).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('button', { name: 'Додати нову гру' }));

        const actionGenreCheckbox = screen.getByLabelText('Action');
        const pcPlatformCheckbox = screen.getByLabelText('PC');

        await userEvent.click(actionGenreCheckbox);
        await userEvent.click(pcPlatformCheckbox);

        expect(actionGenreCheckbox).toBeChecked();
        expect(pcPlatformCheckbox).toBeChecked();

        await userEvent.click(actionGenreCheckbox);
        expect(actionGenreCheckbox).not.toBeChecked();
    });

    test('submits new game data successfully', async () => {
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Додати нову гру' })).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('button', { name: 'Додати нову гру' }));

        await userEvent.type(screen.getByLabelText('Назва:'), 'New Game');
        await userEvent.type(screen.getByLabelText('Опис:'), 'New Description');
        await userEvent.type(screen.getByLabelText('Дата випуску:'), '2024-01-01');
        await userEvent.type(screen.getByLabelText('Розробник:'), 'New Dev');
        await userEvent.type(screen.getByLabelText('Видавець:'), 'New Pub');
        await userEvent.click(screen.getByLabelText('Action'));
        await userEvent.click(screen.getByLabelText('PC'));

        const submitButton = screen.getByRole('button', { name: 'Додати гру' });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/admin/games', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    title: 'New Game',
                    description: 'New Description',
                    releaseDate: '2024-01-01',
                    imageUrl: '',
                    developerName: 'New Dev',
                    publisherName: 'New Pub',
                    genreNames: ['Action'],
                    platformNames: ['PC'],
                }),
            }));
        });
        expect(alertSpy).toHaveBeenCalledWith('Гру успішно додано!');
        await waitFor(() => {
            expect(screen.queryByLabelText('Назва:')).not.toBeInTheDocument();
        });
    });

    test('submits updated game data successfully', async () => {
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getAllByRole('button', { name: 'Редагувати' })[0]).toBeInTheDocument();
        });

        const editButton = screen.getAllByRole('button', { name: 'Редагувати' })[0];
        await userEvent.click(editButton);

        await waitFor(() => {
            expect(screen.getByText('Редагувати гру', { selector: 'h2' })).toBeInTheDocument();
            expect(screen.getByLabelText('Назва:')).toHaveValue('Game One');
        });

        const titleInput = screen.getByLabelText('Назва:');
        await userEvent.clear(titleInput);
        await userEvent.type(titleInput, 'Updated Game One');

        const saveButton = screen.getByRole('button', { name: 'Оновити гру' });
        await userEvent.click(saveButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/admin/games/game-1', expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify({
                    title: 'Updated Game One',
                    description: 'Description for game one.',
                    releaseDate: '2023-01-01',
                    imageUrl: '/images/game-1.jpg',
                    developerName: 'Dev A',
                    publisherName: 'Pub X',
                    genreNames: ['Action'],
                    platformNames: ['PC'],
                }),
            }));
        });
        expect(alertSpy).toHaveBeenCalledWith('Гру успішно оновлено!');
        await waitFor(() => {
            expect(screen.queryByLabelText('Назва:')).not.toBeInTheDocument();
        });
    });

    test('handles cancel button in edit mode', async () => {
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getAllByRole('button', { name: 'Редагувати' })[0]).toBeInTheDocument();
        });

        const editButton = screen.getAllByRole('button', { name: 'Редагувати' })[0];
        await userEvent.click(editButton);

        await waitFor(() => {
            expect(screen.getByText('Редагувати гру', { selector: 'h2' })).toBeInTheDocument();
        });

        const cancelButton = screen.getByRole('button', { name: 'Скасувати' });
        await userEvent.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByText('Редагувати гру', { selector: 'h2' })).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Назва:')).not.toBeInTheDocument();
        });
    });

    test('deletes a game successfully', async () => {
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getAllByRole('button', { name: 'Видалити' })[0]).toBeInTheDocument();
        });

        const deleteButton = screen.getAllByRole('button', { name: 'Видалити' })[0];
        await userEvent.click(deleteButton);

        await waitFor(() => {
            expect(confirmSpy).toHaveBeenCalledWith('Ви впевнені, що хочете видалити цю гру? Цю дію не можна скасувати.');
        });

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/admin/games/game-1', expect.objectContaining({
                method: 'DELETE',
            }));
        });
        expect(alertSpy).toHaveBeenCalledWith('Гру успішно видалено.');
        await waitFor(() => {
            expect(screen.queryByText('Game One')).not.toBeInTheDocument();
        });
    });

    test('does not delete game if confirmation is cancelled', async () => {
        confirmSpy.mockImplementationOnce(() => false);
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(screen.getAllByRole('button', { name: 'Видалити' })[0]).toBeInTheDocument();
        });

        const deleteButton = screen.getAllByRole('button', { name: 'Видалити' })[0];
        await userEvent.click(deleteButton);

        await waitFor(() => {
            expect(confirmSpy).toHaveBeenCalledWith('Ви впевнені, що хочете видалити цю гру? Цю дію не можна скасувати.');
        });

        expect(mockFetch).not.toHaveBeenCalledWith('/api/admin/games/game-1', expect.any(Object));
        expect(screen.getByText('Game One')).toBeInTheDocument();
    });

    test('fetches genres and platforms on initial load', async () => {
        render(<AdminGamesPage />);
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/genres');
            expect(mockFetch).toHaveBeenCalledWith('/api/platforms');
        });
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Додати нову гру' })).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('button', { name: 'Додати нову гру' }));
        await waitFor(() => {
            expect(screen.getByLabelText('Action')).toBeInTheDocument();
            expect(screen.getByLabelText('PC')).toBeInTheDocument();
        });
    });
});
