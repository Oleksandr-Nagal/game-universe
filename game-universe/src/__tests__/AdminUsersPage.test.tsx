import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import AdminUsersPage from '../app/admin/users/page';
import { useSession } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
        prefetch: jest.fn(),
    }),
}));

const mockUseSession = (
    status: 'loading' | 'authenticated' | 'unauthenticated',
    user?: { id: string; role: string; name?: string; email?: string; image?: string | null }
) => {
    (useSession as jest.Mock).mockReturnValue({
        data: user ? { user } : null,
        status,
    });
};

const mockUsers = [
    {
        id: 'user1',
        name: 'User One',
        email: 'user1@example.com',
        role: 'USER',
        createdAt: new Date('2023-01-01T10:00:00Z').toISOString(),
        image: '/avatar1.jpg',
    },
    {
        id: 'user2',
        name: 'User Two',
        email: 'user2@example.com',
        role: 'ADMIN',
        createdAt: new Date('2023-01-02T11:00:00Z').toISOString(),
        image: null,
    },
];

describe('AdminUsersPage', () => {
    let mockConfirm: jest.SpyInstance;
    let mockAlert: jest.SpyInstance;
    let fetchSpy: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPush.mockClear();

        mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
        mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {}); // Removed 'message: string' parameter

        Object.defineProperty(global, 'fetch', {
            writable: true,
            value: jest.fn(),
        });
        fetchSpy = global.fetch as jest.Mock;
    });

    afterEach(() => {
        mockConfirm.mockRestore();
        mockAlert.mockRestore();
    });

    test('redirects to home if user is not ADMIN', async () => {
        mockUseSession('authenticated', { id: 'user1', role: 'USER' });
        render(<AdminUsersPage />);
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    test('displays loading state initially', () => {
        mockUseSession('loading');
        render(<AdminUsersPage />);
        expect(screen.getByText('Завантаження користувачів...')).toBeInTheDocument();
    });

    test('displays error message if fetching users fails', async () => {
        mockUseSession('authenticated', { id: 'admin1', role: 'ADMIN' });

        fetchSpy.mockResolvedValueOnce(
            new Response(JSON.stringify({ error: 'Users not found' }), {
                status: 404,
                statusText: 'Not Found',
                headers: { 'Content-Type': 'application/json' },
            })
        );

        render(<AdminUsersPage />);
        await waitFor(() => {
            expect(screen.getByText(/Помилка: Users not found/i)).toBeInTheDocument();
        });
    });

    test('displays "Користувачів не знайдено." if no users are returned', async () => {
        mockUseSession('authenticated', { id: 'admin1', role: 'ADMIN' });

        fetchSpy.mockResolvedValueOnce(
            new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        render(<AdminUsersPage />);

        await waitFor(() => {
            expect(screen.queryByText('Завантаження користувачів...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Користувачів не знайдено.')).toBeInTheDocument();
    });

    test('displays user data in a table for ADMIN user', async () => {
        mockUseSession('authenticated', { id: 'admin1', role: 'ADMIN' });

        fetchSpy.mockResolvedValueOnce(
            new Response(JSON.stringify(mockUsers), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        render(<AdminUsersPage />);

        await waitFor(() => {
            expect(screen.queryByText('Завантаження користувачів...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Керування Користувачами')).toBeInTheDocument();
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
        expect(screen.getByText('USER')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
        expect(screen.getByText('user2@example.com')).toBeInTheDocument();
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });

    test('does not allow ADMIN to delete own account and shows label', async () => {
        const adminUser = {
            id: 'admin1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'ADMIN',
        };

        mockUseSession('authenticated', adminUser);

        const users = [
            {
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                role: 'USER',
                createdAt: new Date().toISOString(),
                image: null,
            },
            {
                id: 'admin1',
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'ADMIN',
                createdAt: new Date().toISOString(),
                image: null,
            },
        ];

        fetchSpy.mockResolvedValueOnce(
            new Response(JSON.stringify(users), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        render(<AdminUsersPage />);

        await waitFor(() => {
            expect(screen.queryByText('Завантаження користувачів...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('Ваш обліковий запис')).toBeInTheDocument();

        const deleteButtons = screen.getAllByRole('button', { name: /Видалити/i });
        expect(deleteButtons.length).toBe(1);
    });
});