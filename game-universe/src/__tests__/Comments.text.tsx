import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UserCommentsPage from '../app/profile/comments/page';

jest.mock('next-auth/react');
jest.mock('next/navigation');

describe('UserCommentsPage', () => {
    let mockPush: jest.Mock;
    let mockFetch: jest.Mock;
    let mockAlert: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' });

        mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
        jest.spyOn(window, 'confirm').mockImplementation(() => true);
        mockFetch = jest.fn();
        global.fetch = mockFetch;

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy.mockRestore();
    });

    test('redirects to signin if user is not authenticated', async () => {
        (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
        render(<UserCommentsPage />);
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/auth/signin');
        });
    });

    test('displays loading state initially', () => {
        (useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' });
        render(<UserCommentsPage />);
        expect(screen.getByText('Завантаження коментарів...')).toBeInTheDocument();
    });

    test('displays empty comments message if no comments', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });

        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

        render(<UserCommentsPage />);

        expect(await screen.findByText((content) => content.includes('У вас ще немає коментарів'))).toBeInTheDocument();
    });

    test('displays comments when data is fetched successfully', async () => {
        const mockComments = [
            {
                id: 'c1',
                content: 'Great game!',
                createdAt: new Date().toISOString(),
                game: { id: 'g1', title: 'Game 1', imageUrl: '/game1.jpg' },
            },
        ];

        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockComments,
        });

        render(<UserCommentsPage />);
        expect(await screen.findByText('Great game!')).toBeInTheDocument();
    });

    test('displays error message when fetching comments fails', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });

        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Not Found',
            json: async () => ({ error: 'Comments not found' }),
        });

        render(<UserCommentsPage />);
        expect(await screen.findByText(/Помилка: Failed to fetch comments/i)).toBeInTheDocument();
    });

    test('successfully deletes a comment', async () => {
        const mockComments = [
            {
                id: 'c1',
                content: 'Test comment',
                createdAt: new Date().toISOString(),
                game: { id: 'g1', title: 'Game 1', imageUrl: null },
            },
        ];

        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockComments,
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
        });

        render(<UserCommentsPage />);

        expect(await screen.findByText('Test comment')).toBeInTheDocument();

        const deleteButton = screen.getByRole('button', { name: /Видалити/i });
        await userEvent.click(deleteButton);

        await waitFor(() => {
            expect(screen.queryByText('Test comment')).not.toBeInTheDocument();
        });

        expect(mockAlert).toHaveBeenCalledWith('Коментар успішно видалено.');
    });

    test('displays error when deleting comment fails', async () => {
        const mockComments = [
            {
                id: 'c1',
                content: 'Great game!',
                createdAt: new Date().toISOString(),
                game: { id: 'g1', title: 'Game 1', imageUrl: '/game1.jpg' },
            },
        ];

        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });

        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => mockComments }) // initial fetch
            .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Forbidden' }) }); // delete fail

        render(<UserCommentsPage />);
        expect(await screen.findByText('Great game!')).toBeInTheDocument();

        const deleteButton = screen.getByRole('button', { name: /Видалити/i });
        await userEvent.click(deleteButton);

        await waitFor(() => {
            expect(mockAlert).toHaveBeenCalledWith('Помилка: Forbidden');
        });

        expect(screen.getByText('Great game!')).toBeInTheDocument();
    });

    test('navigates to profile page when "Назад до Профілю" button is clicked', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });

        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

        render(<UserCommentsPage />);

        expect(await screen.findByText((content) => content.includes('У вас ще немає коментарів'))).toBeInTheDocument();

        const profileButton = screen.getByRole('link', { name: 'Назад до Профілю' });
        expect(profileButton).toHaveAttribute('href', '/profile');
    });

    test('delete button shows "Видалення..." during deletion', async () => {
        const mockComments = [
            {
                id: 'c1',
                content: 'Test comment',
                createdAt: new Date().toISOString(),
                game: { id: 'g1', title: 'Test Game', imageUrl: null },
            },
        ];

        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'user1' } },
            status: 'authenticated',
        });

        let deleteResolve: () => void;
        const deletePromise = new Promise<void>((resolve) => {
            deleteResolve = resolve;
        });

        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockComments });

        mockFetch.mockImplementationOnce(() => deletePromise);

        render(<UserCommentsPage />);

        expect(await screen.findByText('Test comment')).toBeInTheDocument();

        const deleteButton = screen.getByRole('button', { name: /Видалити/i });
        await userEvent.click(deleteButton);

        expect(screen.getByRole('button', { name: /Видалення.../i })).toBeInTheDocument();

        deleteResolve!();
    });
});