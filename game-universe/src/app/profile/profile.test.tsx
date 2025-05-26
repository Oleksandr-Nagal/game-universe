// src/app/profile/profile.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from './page';
import React from 'react';
import type { ImageProps, StaticImageData } from 'next/image';

const mockGetServerSession = jest.fn();
jest.mock('@/lib/auth', () => ({
    authOptions: {},
    getServerSession: mockGetServerSession,
}));

const mockUseSession = jest.fn();
const mockUpdateSession = jest.fn();
jest.mock('next-auth/react', () => ({
    useSession: () => mockUseSession(),
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
    init: jest.fn(),
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: ImageProps) => {
        const { src, alt, ...rest } = props;
        const srcString = typeof src === 'string' ? src : (src as StaticImageData).src || '';

        // eslint-disable-next-line @next/next/no-img-element
        return <img src={srcString} alt={alt || ''} {...rest} />;
    },
}));

const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};
jest.mock('@/lib/prisma', () => ({
    prisma: mockPrisma,
}));

describe('ProfilePage', () => {
    beforeEach(() => {
        mockGetServerSession.mockReset();
        mockUseSession.mockReset();
        mockPrisma.user.findUnique.mockReset();
        mockPrisma.user.update.mockReset();

        mockGetServerSession.mockResolvedValue({
            user: {
                id: 'test-user-id',
                name: 'Test User',
                email: 'test@example.com',
                image: '/default-avatar.png',
                role: 'USER',
            },
        });
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: 'test-user-id',
                    name: 'Test User',
                    email: 'test@example.com',
                    image: '/default-avatar.png',
                    role: 'USER',
                },
            },
            status: 'authenticated',
            update: mockUpdateSession,
        });
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            image: '/default-avatar.png',
            role: 'USER',
        });
    });

    it('redirects to home if user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValue(null);
        const mockRedirect = jest.fn();
        jest.mock('next/navigation', () => ({
            redirect: mockRedirect,
        }));

        render(<ProfilePage />);

        expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('renders profile information for authenticated user', async () => {
        render(<ProfilePage />);

        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByAltText('Аватар користувача')).toBeInTheDocument();
    });
});
