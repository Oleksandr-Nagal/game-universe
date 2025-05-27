// __tests__/GameDetailPage.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import GameDetailPage from '../app/games/[id]/page'; // Replace with the correct relative path

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useParams: jest.fn(),
    useSearchParams: jest.fn(() => new URLSearchParams()),
    usePathname: jest.fn(() => '/'),
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        prefetch: jest.fn(),
    })),
}));

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';

global.alert = jest.fn();

const mockFetch = jest.fn();
global.fetch = mockFetch;

interface MockUser {
    id: string;
    name: string;
    image?: string;
    email?: string;
    role?: string;
}

const mockGame = {
    id: 'game-1',
    title: 'Test Game',
    description: 'A fantastic test game description.',
    releaseDate: '2023-01-15T00:00:00.000Z',
    imageUrl: '/images/test-game.jpg',
    developer: { name: 'Test Dev' },
    publisher: { name: 'Test Publisher' },
    genres: [{ genre: { name: 'Action' } }, { genre: { name: 'Adventure' } }],
    platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'PS5' } }],
};

const mockUseSessionValue = (status: 'loading' | 'authenticated' | 'unauthenticated', user?: MockUser) => {
    (useSession as jest.Mock).mockReturnValue({
        data: user ? { user } : null,
        status,
    });
};

const mockUseParamsValue = (id: string) => {
    (useParams as jest.Mock).mockReturnValue({ id });
};

describe('GameDetailPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (global.alert as jest.Mock).mockClear();
        mockUseSessionValue('unauthenticated');
        mockUseParamsValue('game-1');

        mockFetch.mockImplementation((url: RequestInfo | URL) => {
            if (url.toString().startsWith('/api/games/')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGame) });
            }
            if (url.toString().startsWith('/api/comments')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
            }
            if (url.toString().startsWith('/api/wishlist/status')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ isInWishlist: false }) });
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });
    });

    test('renders loading state initially', () => {
        mockFetch.mockImplementation(() => new Promise(() => { }));
        render(<GameDetailPage />);
        expect(screen.getByText('Завантаження деталей гри...')).toBeInTheDocument();
    });

    test('displays error message if game fetch fails', async () => {
        mockFetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                statusText: 'Not Found',
                json: () => Promise.resolve({ error: 'Game not found' }),
            })
        );
        mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
        mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ isInWishlist: false }) }));


        render(<GameDetailPage />);

        await waitFor(() => {
            expect(screen.getByText(/Помилка: Failed to fetch game: Not Found/i)).toBeInTheDocument();
        });
    });

    describe('Comments section', () => {
        const authenticatedUser: MockUser = { id: 'user-123', name: 'Auth User', image: '/auth-user.jpg', email: 'auth@example.com' };

        test('displays error if adding comment fails', async () => {
            mockFetch.mockImplementation((url: RequestInfo | URL) => {
                if (url === '/api/games/game-1') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGame) });
                }
                if (url.toString().startsWith('/api/comments?gameId=game-1')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
                }
                if (url === '/api/comments') {
                    return Promise.resolve({
                        ok: false,
                        statusText: 'Bad Request',
                        json: () => Promise.resolve({ error: 'Comment too short' }),
                    });
                }
                if (url.toString().startsWith('/api/wishlist/status')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ isInWishlist: false }) });
                }
                return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
            });

            mockUseSessionValue('authenticated', authenticatedUser);
            render(<GameDetailPage />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Напишіть свій коментар...')).toBeInTheDocument();
            });

            const commentInput = screen.getByPlaceholderText('Напишіть свій коментар...');
            const submitButton = screen.getByRole('button', { name: 'Додати коментар' });

            await userEvent.type(commentInput, 'Short');
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Comment too short')).toBeInTheDocument();
            });

            expect(commentInput).toHaveValue('Short');

            expect(screen.queryByText('Ще немає коментарів. Будьте першим!')).toBeInTheDocument();
            const commentCards = screen.queryAllByText('Short', { selector: 'div.bg-gray-800 p-4' });
            expect(commentCards).toHaveLength(0);
        });

        test('allows user to edit their own comment', async () => {
            const userComment = {
                id: 'user-comment-1',
                content: 'Original content',
                createdAt: '2023-03-01T10:00:00.000Z',
                updatedAt: '2023-03-01T10:00:00.000Z',
                userId: authenticatedUser.id,
                user: authenticatedUser,
            };

            mockFetch.mockImplementation((url: RequestInfo | URL) => {
                if (url === '/api/games/game-1') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGame) });
                }
                if (url.toString().startsWith('/api/comments?gameId=game-1')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve([userComment]) });
                }
                if (url === `/api/comments/${userComment.id}`) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ ...userComment, content: 'Updated content', updatedAt: new Date().toISOString() }),
                    });
                }
                if (url.toString().startsWith('/api/wishlist/status')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ isInWishlist: false }) });
                }
                return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
            });

            mockUseSessionValue('authenticated', authenticatedUser);
            render(<GameDetailPage />);

            await waitFor(() => {
                expect(screen.getByText('Original content')).toBeInTheDocument();
            });

            const editButton = screen.getByRole('button', { name: 'Редагувати' });
            await userEvent.click(editButton);

            const editInput = screen.getByDisplayValue('Original content');
            expect(editInput).toBeInTheDocument();

            await userEvent.clear(editInput);
            await userEvent.type(editInput, 'Updated content');

            const saveButton = screen.getByRole('button', { name: 'Зберегти' });
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(`/api/comments/${userComment.id}`, expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify({ content: 'Updated content' }),
                }));
            });

            expect(screen.getByText('Updated content')).toBeInTheDocument();
            expect(screen.queryByDisplayValue('Original content')).not.toBeInTheDocument();
            expect(screen.getByText('(відредаговано)')).toBeInTheDocument();
        });

        test('allows admin user to edit any comment', async () => {
            const adminUser: MockUser = { id: 'admin-1', name: 'Admin User', role: 'ADMIN' };
            const anotherUserComment = {
                id: 'another-comment-1',
                content: 'Another user content',
                createdAt: '2023-03-01T10:00:00.000Z',
                updatedAt: '2023-03-01T10:00:00.000Z',
                userId: 'some-other-user-id',
                user: { id: 'some-other-user-id', name: 'Other User' },
            };

            mockFetch.mockImplementation((url: RequestInfo | URL) => {
                if (url === '/api/games/game-1') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGame) });
                }
                if (url.toString().startsWith('/api/comments?gameId=game-1')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve([anotherUserComment]) });
                }
                if (url === `/api/comments/${anotherUserComment.id}`) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ ...anotherUserComment, content: 'Admin edited content', updatedAt: new Date().toISOString() }),
                    });
                }
                if (url.toString().startsWith('/api/wishlist/status')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ isInWishlist: false }) });
                }
                return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
            });

            mockUseSessionValue('authenticated', adminUser);
            render(<GameDetailPage />);

            await waitFor(() => {
                expect(screen.getByText('Another user content')).toBeInTheDocument();
            });

            const editButton = screen.getByRole('button', { name: 'Редагувати' });
            await userEvent.click(editButton);

            const editInput = screen.getByDisplayValue('Another user content');
            await userEvent.clear(editInput);
            await userEvent.type(editInput, 'Admin edited content');

            const saveButton = screen.getByRole('button', { name: 'Зберегти' });
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Admin edited content')).toBeInTheDocument();
            });
        });

        test('allows user to delete their own comment', async () => {
            const userComment = {
                id: 'user-comment-1',
                content: 'Content to be deleted',
                createdAt: '2023-03-01T10:00:00.000Z',
                updatedAt: '2023-03-01T10:00:00.000Z',
                userId: authenticatedUser.id,
                user: authenticatedUser,
            };

            mockFetch.mockImplementation((url: RequestInfo | URL) => {
                if (url === '/api/games/game-1') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGame) });
                }
                if (url.toString().startsWith('/api/comments?gameId=game-1')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve([userComment]) });
                }
                if (url === `/api/comments/${userComment.id}`) {
                    return Promise.resolve({ ok: true });
                }
                if (url.toString().startsWith('/api/wishlist/status')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ isInWishlist: false }) });
                }
                return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
            });

            mockUseSessionValue('authenticated', authenticatedUser);
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
            render(<GameDetailPage />);

            await waitFor(() => {
                expect(screen.getByText('Content to be deleted')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: 'Видалити' });
            await userEvent.click(deleteButton);

            await waitFor(() => {
                expect(confirmSpy).toHaveBeenCalledWith('Ви впевнені, що хочете видалити цей коментар? Цю дію не можна скасувати.');
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(`/api/comments/${userComment.id}`, expect.objectContaining({
                    method: 'DELETE',
                }));
            });

            expect(screen.queryByText('Content to be deleted')).not.toBeInTheDocument();
            confirmSpy.mockRestore();
        });

        test('allows admin user to delete any comment', async () => {
            const adminUser: MockUser = { id: 'admin-1', name: 'Admin User', role: 'ADMIN' };
            const anotherUserComment = {
                id: 'another-comment-1',
                content: 'Another user content',
                createdAt: '2023-03-01T10:00:00.000Z',
                updatedAt: '2023-03-01T10:00:00.000Z',
                userId: 'some-other-user-id',
                user: { id: 'some-other-user-id', name: 'Other User' },
            };

            mockFetch.mockImplementation((url: RequestInfo | URL) => {
                if (url === '/api/games/game-1') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGame) });
                }
                if (url.toString().startsWith('/api/comments?gameId=game-1')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve([anotherUserComment]) });
                }
                if (url === `/api/comments/${anotherUserComment.id}`) {
                    return Promise.resolve({ ok: true });
                }
                if (url.toString().startsWith('/api/wishlist/status')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ isInWishlist: false }) });
                }
                return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
            });

            mockUseSessionValue('authenticated', adminUser);
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
            render(<GameDetailPage />);

            await waitFor(() => {
                expect(screen.getByText('Another user content')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: 'Видалити' });
            await userEvent.click(deleteButton);

            await waitFor(() => {
                expect(screen.queryByText('Another user content')).not.toBeInTheDocument();
            });
            confirmSpy.mockRestore();
        });

        test('does not show edit/delete buttons for comments by other users if not admin', async () => {
            const regularUser: MockUser = { id: 'regular-user-id', name: 'Regular User' };
            const commentByOtherUser = {
                id: 'other-user-comment',
                content: 'Comment by someone else',
                createdAt: '2023-04-01T12:00:00.000Z',
                updatedAt: '2023-04-01T12:00:00.000Z',
                userId: 'another-user-id',
                user: { id: 'another-user-id', name: 'Another User' },
            };

            mockFetch.mockImplementation((url: RequestInfo | URL) => {
                if (url === '/api/games/game-1') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGame) });
                }
                if (url.toString().startsWith('/api/comments?gameId=game-1')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve([commentByOtherUser]) });
                }
                if (url.toString().startsWith('/api/wishlist/status')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ isInWishlist: false }) });
                }
                return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
            });

            mockUseSessionValue('authenticated', regularUser);
            render(<GameDetailPage />);

            await waitFor(() => {
                expect(screen.getByText('Comment by someone else')).toBeInTheDocument();
            });

            expect(screen.queryByRole('button', { name: 'Редагувати' })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Видалити' })).not.toBeInTheDocument();
        });

        test('Cancel button in edit mode reverts to view mode', async () => {
            const userComment = {
                id: 'user-comment-1',
                content: 'Original content',
                createdAt: '2023-03-01T10:00:00.000Z',
                updatedAt: '2023-03-01T10:00:00.000Z',
                userId: authenticatedUser.id,
                user: authenticatedUser,
            };

            mockFetch.mockImplementation((url: RequestInfo | URL) => {
                if (url === '/api/games/game-1') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGame) });
                }
                if (url.toString().startsWith('/api/comments?gameId=game-1')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve([userComment]) });
                }
                if (url.toString().startsWith('/api/wishlist/status')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ isInWishlist: false }) });
                }
                return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
            });

            mockUseSessionValue('authenticated', authenticatedUser);
            render(<GameDetailPage />);

            await waitFor(() => {
                expect(screen.getByText('Original content')).toBeInTheDocument();
            });

            const editButton = screen.getByRole('button', { name: 'Редагувати' });
            await userEvent.click(editButton);

            const editInput = screen.getByDisplayValue('Original content');
            expect(editInput).toBeInTheDocument();

            const cancelButton = screen.getByRole('button', { name: 'Скасувати' });
            await userEvent.click(cancelButton);

            expect(screen.queryByDisplayValue('Original content')).not.toBeInTheDocument();
            expect(screen.getByText('Original content')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Редагувати' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Видалити' })).toBeInTheDocument();
        });
    });
});