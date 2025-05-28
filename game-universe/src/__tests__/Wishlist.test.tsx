// game-universe/app/profile/wishlist/__tests__/Page.test.tsx
import {fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UserWishlistPage from '../app/profile/wishlist/page';

jest.mock('next-auth/react');
jest.mock('next/navigation');

const mockUseSession = useSession as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockConfirm = jest.spyOn(window, 'confirm');
const mockAlert = jest.spyOn(window, 'alert');

describe('UserWishlistPage', () => {
    let mockPush: jest.Mock;
    let mockFetch: jest.Mock;

    beforeEach(() => {
        mockPush = jest.fn();
        mockUseRouter.mockReturnValue({ push: mockPush });
        mockConfirm.mockReturnValue(true);
        mockAlert.mockClear();

        mockFetch = jest.fn();
        global.fetch = mockFetch;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Тест 1: Перенаправлення, якщо користувач не авторизований
    test('redirects to signin if user is not authenticated', async () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        render(<UserWishlistPage />);
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/auth/signin');
        });
    });

    // Тест 2: Відображення стану завантаження
    test('displays loading state initially', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'loading' });
        render(<UserWishlistPage />);
        expect(screen.getByText('Завантаження списку бажань...')).toBeInTheDocument();
    });

    // Тест 3: Відображення порожнього списку бажань
    test('displays empty wishlist message if no items', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<UserWishlistPage />);

        await waitFor(() => {
            expect(screen.getByText('Мій Список Бажань')).toBeInTheDocument();
            expect(screen.getByText('Ваш список бажань порожній.')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'Додайте ігри!' })).toBeInTheDocument();
        });
        expect(mockFetch).toHaveBeenCalledWith('/api/wishlist');
    });

    // Тест 4: Відображення списку бажань з елементами
    test('displays wishlist items when data is fetched successfully', async () => {
        const mockWishlist = [
            {
                id: 'w1',
                gameId: 'g1',
                addedAt: new Date().toISOString(),
                game: { id: 'g1', title: 'Game 1', imageUrl: '/game1.jpg', description: 'Desc 1' },
            },
            {
                id: 'w2',
                gameId: 'g2',
                addedAt: new Date().toISOString(),
                game: { id: 'g2', title: 'Game 2', imageUrl: null, description: 'Desc 2' },
            },
        ];

        mockUseSession.mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockWishlist,
        });

        render(<UserWishlistPage />);

        await waitFor(() => {
            expect(screen.getByText('Game 1')).toBeInTheDocument();
            expect(screen.getByText('Game 2')).toBeInTheDocument();
            expect(screen.getAllByRole('button', { name: 'Видалити' })).toHaveLength(2);
        });
        expect(mockFetch).toHaveBeenCalledWith('/api/wishlist');
    });

    // Тест 5: Обробка помилки завантаження списку бажань
    test('displays error message when fetching wishlist fails', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Internal Server Error',
            json: async () => ({ error: 'Server error' }),
        });

        render(<UserWishlistPage />);

        await waitFor(() => {
            expect(screen.getByText(/Помилка: Failed to fetch wishlist/i)).toBeInTheDocument();
        });
    });

    // Тест 6: Успішне видалення гри зі списку бажань
    test('successfully removes a game from wishlist', async () => {
        const mockWishlist = [
            {
                id: 'w1',
                gameId: 'g1',
                addedAt: new Date().toISOString(),
                game: { id: 'g1', title: 'Game 1', imageUrl: '/game1.jpg', description: 'Desc 1' },
            },
        ];

        mockUseSession.mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockWishlist,
        }).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Deleted' }),
        });

        render(<UserWishlistPage />);

        await waitFor(() => {
            expect(screen.getByText('Game 1')).toBeInTheDocument();
        });

        const removeButton = screen.getByRole('button', { name: 'Видалити' });
        await userEvent.click(removeButton);

        expect(mockConfirm).toHaveBeenCalledWith('Ви впевнені, що хочете видалити цю гру зі списку бажань?');

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/wishlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId: 'g1' }),
            });
            expect(screen.queryByText('Game 1')).not.toBeInTheDocument(); // Елемент має зникнути
            expect(mockAlert).toHaveBeenCalledWith('Гру успішно видалено зі списку бажань.');
        });
    });

    // Тест 7: Обробка помилки при видаленні гри зі списку бажань
    test('displays error when removing game from wishlist fails', async () => {
        const mockWishlist = [
            {
                id: 'w1',
                gameId: 'g1',
                addedAt: new Date().toISOString(),
                game: { id: 'g1', title: 'Game 1', imageUrl: '/game1.jpg', description: 'Desc 1' },
            },
        ];

        mockUseSession.mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockWishlist,
        }).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Failed to delete' }),
        });

        render(<UserWishlistPage />);

        await waitFor(() => {
            expect(screen.getByText('Game 1')).toBeInTheDocument();
        });

        const removeButton = screen.getByRole('button', { name: 'Видалити' });
        await userEvent.click(removeButton);

        await waitFor(() => {
            expect(mockAlert).toHaveBeenCalledWith('Помилка: Failed to delete');
            expect(screen.getByText('Game 1')).toBeInTheDocument();
        });
    });

    // Тест 8: Кнопка "Назад до Профілю"
    test('navigates to profile page when "Назад до Профілю" button is clicked', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<UserWishlistPage />);

        await waitFor(() => {
            expect(screen.getByText('Ваш список бажань порожній.')).toBeInTheDocument();
        });

        const profileButton = screen.getByRole('link', { name: 'Назад до Профілю' });
        expect(profileButton).toHaveAttribute('href', '/profile');
    });

    // Тест 9: Кнопка "Видалити" відображає "Видалення..." під час запиту
    test('remove button shows "Видалення..." and removes the game', async () => {
        const mockWishlist = [
            {
                id: 'w1',
                gameId: 'g1',
                addedAt: new Date().toISOString(),
                game: { id: 'g1', title: 'Game 1', imageUrl: '/game1.jpg', description: 'Desc 1' },
            },
        ];

        mockUseSession.mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockWishlist,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Deleted' }),
            });

        render(<UserWishlistPage />);

        const gameItem = await screen.findByText('Game 1');
        expect(gameItem).toBeInTheDocument();

        const removeButton = screen.getByRole('button', { name: 'Видалити' });
        expect(removeButton).toBeInTheDocument();

        fireEvent.click(removeButton);

        expect(removeButton).toHaveTextContent('Видалення...');

        await waitFor(() => {
            expect(screen.queryByText('Game 1')).not.toBeInTheDocument();
        });
    });

});