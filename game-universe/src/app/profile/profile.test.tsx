import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from './profile/page';

// Мок для next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />, // Використовуємо заміну на <img>
}));

describe('ProfilePage', () => {
    const mockGetServerSession = jest.fn();
    const mockRedirect = jest.fn();

    jest.mock('next-auth', () => ({
        getServerSession: (options: any) => mockGetServerSession(options),
    }));

    jest.mock('next/navigation', () => ({
        redirect: (path: string) => mockRedirect(path),
    }));

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('redirects to sign-in if user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValueOnce(null);
        await ProfilePage();
        expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
        expect(screen.queryByText('Мій Профіль')).not.toBeInTheDocument();
    });

    it('renders profile page for authenticated user', async () => {
        mockGetServerSession.mockResolvedValueOnce({
            user: {
                id: '123',
                name: 'Test User',
                email: 'test@example.com',
                image: '/avatars/avatar1.png',
                role: 'USER',
            },
        });

        render(await ProfilePage());

        expect(screen.getByText('Мій Профіль')).toBeInTheDocument();
        expect(screen.getByText(/Test User/)).toBeInTheDocument();
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
        expect(screen.getByAltText('Test User')).toBeInTheDocument();
    });
});