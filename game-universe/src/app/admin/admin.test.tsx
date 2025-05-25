import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from './page';

// Правильно ініціалізуємо mockPrisma до його використання
const mockPrisma = {
    user: { count: jest.fn() },
    game: { count: jest.fn() },
    comment: { count: jest.fn() },
};

const mockGetServerSession = jest.fn();
const mockRedirect = jest.fn();

jest.mock('next-auth', () => ({
    getServerSession: (options: any) => mockGetServerSession(options),
}));

jest.mock('next/navigation', () => ({
    redirect: (path: string) => mockRedirect(path),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: mockPrisma,
}));

describe('AdminPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('redirects to sign-in if user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValueOnce(null);
        await AdminPage();
        expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
    });

    it('redirects to home if user is not an admin', async () => {
        mockGetServerSession.mockResolvedValueOnce({
            user: { id: '123', role: 'USER' },
        });
        await AdminPage();
        expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('renders admin stats for admin user', async () => {
        mockGetServerSession.mockResolvedValueOnce({
            user: { id: '123', role: 'ADMIN', name: 'Admin User' },
        });

        mockPrisma.user.count.mockResolvedValueOnce(10);
        mockPrisma.game.count.mockResolvedValueOnce(50);
        mockPrisma.comment.count.mockResolvedValueOnce(200);

        render(await AdminPage());

        expect(screen.getByText('Панель Адміністратора')).toBeInTheDocument();
        expect(screen.getByText('Всього Користувачів')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
    });
});