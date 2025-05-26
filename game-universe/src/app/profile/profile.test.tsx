// src/app/profile/profile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from './page';
import React from 'react';
import type { ImageProps, StaticImageData } from 'next/image';

// Define mock objects *inside* the jest.mock factories for reliable initialization

// Mock for '@/lib/auth'
const mockAuth = {
    authOptions: {},
    getServerSession: jest.fn(),
};
jest.mock('@/lib/auth', () => mockAuth);

// Mock for 'next-auth/react'
const mockNextAuthReact = {
    useSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    update: jest.fn(),
};
jest.mock('next-auth/react', () => mockNextAuthReact);


// Mock for 'next/navigation'
const mockNextNavigation = {
    redirect: jest.fn(),
};
jest.mock('next/navigation', () => mockNextNavigation);

// Mock for '@/lib/prisma'
const mockPrismaClient = {
    user: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};
jest.mock('@/lib/prisma', () => ({
    prisma: mockPrismaClient,
}));

jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
    init: jest.fn(),
}));


jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: ImageProps) => {
        // Destructure 'fill' to prevent it from being passed to the img element directly
        // React warns about boolean `fill` on <img>, so we remove it.
        const { src, alt, fill, ...rest } = props;
        const srcString = typeof src === 'string' ? src : (src as StaticImageData).src || '';

        // eslint-disable-next-line @next/next/no-img-element
        return <img src={srcString} alt={alt || ''} {...rest} />; // Don't pass fill directly to img
    },
}));

describe('ProfilePage', () => {
    beforeEach(() => {
        // Reset all mocks using their respective mock objects
        mockAuth.getServerSession.mockReset();
        mockNextAuthReact.useSession.mockReset();
        mockNextAuthReact.update.mockReset();
        mockPrismaClient.user.findUnique.mockReset();
        mockPrismaClient.user.update.mockReset();
        mockNextNavigation.redirect.mockClear(); // Clear calls for redirect

        mockAuth.getServerSession.mockResolvedValue({
            user: {
                id: 'test-user-id',
                name: 'Test User',
                email: 'test@example.com',
                image: '/default-avatar.png',
                role: 'USER',
            },
        });
        mockNextAuthReact.useSession.mockReturnValue({
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
            update: mockNextAuthReact.update, // Reference the mock function from the object
        });
        mockPrismaClient.user.findUnique.mockResolvedValue({
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            image: '/default-avatar.png',
            role: 'USER',
        });
    });

    it('redirects to home if user is not authenticated', async () => {
        mockAuth.getServerSession.mockResolvedValue(null);
        mockNextAuthReact.useSession.mockReturnValue({ data: null, status: 'unauthenticated' }); // Ensure useSession also reflects unauthenticated state

        render(<ProfilePage />);

        await waitFor(() => {
            expect(mockNextNavigation.redirect).toHaveBeenCalledWith('/');
        });
    });

    it('renders profile information for authenticated user', async () => {
        render(<ProfilePage />);

        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        // Changed alt text expectation to match the component's output
        expect(screen.getByAltText('Test User')).toBeInTheDocument();
    });
});
