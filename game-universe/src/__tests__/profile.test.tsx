import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProfilePage from '../app/profile/page';
import React from 'react';
import type { ImageProps, StaticImageData } from 'next/image';
import type { DefaultSession } from 'next-auth';

type UserRole = 'USER' | 'ADMIN';

interface MockSession {
    user?: {
        id: string;
        role: UserRole;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    } & DefaultSession['user'];
    expires: string;
}

jest.mock('@/lib/auth', () => ({
    authOptions: {},
}));

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
    init: jest.fn(),
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: ImageProps) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { src, alt, fill: _fill, ...rest } = props;
        const srcString = typeof src === 'string' ? src : (src as StaticImageData).src || '';
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={srcString} alt={alt || ''} {...rest} />;
    },
}));

import { useSession as mockUseSessionImport, signIn as mockSignInImport, signOut as mockSignOutImport } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { captureException as mockCaptureExceptionImport, init as mockSentryInitImport } from '@sentry/nextjs';


describe('ProfilePage', () => {
    let mockedUseSession: jest.Mock;
    let mockedSignIn: jest.Mock;
    let mockedSignOut: jest.Mock;
    let mockedUpdateSession: jest.Mock;
    let mockedRedirect: jest.Mock;
    let mockedPrismaUserFindUnique: jest.Mock;
    let mockedPrismaUserUpdate: jest.Mock;
    let mockedCaptureException: jest.Mock;
    let mockedSentryInit: jest.Mock;
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        mockedUseSession = mockUseSessionImport as jest.Mock;
        mockedSignIn = mockSignInImport as jest.Mock;
        mockedSignOut = mockSignOutImport as jest.Mock;
        mockedRedirect = redirect as unknown as jest.Mock;
        mockedPrismaUserFindUnique = prisma.user.findUnique as jest.Mock;
        mockedPrismaUserUpdate = prisma.user.update as jest.Mock;
        mockedCaptureException = mockCaptureExceptionImport as jest.Mock;
        mockedSentryInit = mockSentryInitImport as jest.Mock;

        mockedUseSession.mockReset();
        mockedSignIn.mockReset();
        mockedSignOut.mockReset();
        mockedRedirect.mockClear();
        mockedPrismaUserFindUnique.mockReset();
        mockedPrismaUserUpdate.mockReset();
        mockedCaptureException.mockReset();
        mockedSentryInit.mockReset();

        mockedUpdateSession = jest.fn();

        const mockSessionData: MockSession = {
            user: {
                id: 'test-user-id',
                name: 'Test User',
                email: 'test@example.com',
                image: '/default-avatar.png',
                role: 'USER',
            },
            expires: 'some-date-string'
        };

        mockedUseSession.mockReturnValue({
            data: mockSessionData,
            status: 'authenticated',
            update: mockedUpdateSession,
        });

        fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((url: RequestInfo | URL) => {
            if (url.toString().includes('/api/user/test-user-id')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: 'test-user-id',
                        name: 'Test User',
                        email: 'test@example.com',
                        image: '/default-avatar.png',
                        role: 'USER',
                    }),
                } as Response);
            }
            if (url.toString().includes('/api/user')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                } as Response);
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });

        mockedPrismaUserFindUnique.mockResolvedValue({
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            image: '/default-avatar.png',
            role: 'USER',
        });
        mockedPrismaUserUpdate.mockResolvedValue({
            id: 'test-user-id',
            name: 'Updated Name',
            email: 'test@example.com',
            image: '/default-avatar.png',
            role: 'USER',
        });
    });

    afterEach(() => {
        cleanup();
        fetchSpy.mockRestore();
    });

    it('redirects to /auth/signin if user is not authenticated', async () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        mockedRedirect.mockImplementation(() => {
            throw new Error('Redirected');
        });

        let error: Error | null = null;
        try {
            render(<ProfilePage />);
        } catch (e: unknown) {
            if (e instanceof Error) {
                error = e;
            } else {
                error = new Error('An unknown error occurred during redirect');
            }
        }

        await waitFor(() => {
            expect(mockedRedirect).toHaveBeenCalledWith('/auth/signin');
            expect(error).toBeInstanceOf(Error);
            expect(error?.message).toBe('Redirected');
        });
    });

    it('displays loading state initially', () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'loading' });
        render(<ProfilePage />);
        expect(screen.getByText('Завантаження профілю...')).toBeInTheDocument();
    });


    it('handles name update error from API', async () => {
        render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        const editButton = screen.getByRole('button', { name: /Редагувати ім'я/i });
        await userEvent.click(editButton);

        const nameInput = screen.getByPlaceholderText("Введіть нове ім'я") as HTMLInputElement;
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Invalid Name');

        fetchSpy.mockImplementationOnce((url: RequestInfo | URL) => {
            if (url.toString().includes('/api/user')) {
                return Promise.resolve({
                    ok: false,
                    json: () => Promise.resolve({ error: 'Server error message' }),
                    status: 500,
                } as Response);
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });

        const saveButton = screen.getByRole('button', { name: /Зберегти/i });
        await userEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Server error message')).toBeInTheDocument();
            expect(mockedUpdateSession).not.toHaveBeenCalled();
        });
    });


    it('handles name validation error (too short)', async () => {
        render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        const editButton = screen.getByRole('button', { name: /Редагувати ім'я/i });
        await userEvent.click(editButton);

        const nameInput = screen.getByPlaceholderText("Введіть нове ім'я") as HTMLInputElement;
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'ab');

        const saveButton = screen.getByRole('button', { name: /Зберегти/i });
        await userEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText(/Ім'я повинно містити від 3 до 50 символів./i)).toBeInTheDocument();
            expect(fetchSpy).not.toHaveBeenCalled();
            expect(mockedUpdateSession).not.toHaveBeenCalled();
        });
    });

    it('handles name validation error (name not changed)', async () => {
        render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        const editButton = screen.getByRole('button', { name: /Редагувати ім'я/i });
        await userEvent.click(editButton);

        const nameInput = screen.getByPlaceholderText("Введіть нове ім'я") as HTMLInputElement;
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Test User');

        const saveButton = screen.getByRole('button', { name: /Зберегти/i });

        await waitFor(() => {
            expect(saveButton).toBeDisabled();
        });

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(mockedUpdateSession).not.toHaveBeenCalled();

        expect(screen.queryByText(/Ім'я не змінилося\./i)).not.toBeInTheDocument();
    });

    it('allows cancelling name edit', async () => {
        render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText('Test User')).toBeInTheDocument();
        });

        const editButton = screen.getByRole('button', { name: /Редагувати ім'я/i });
        await userEvent.click(editButton);

        const nameInput = screen.getByPlaceholderText("Введіть нове ім'я") as HTMLInputElement;
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Temporary Name');

        const cancelButton = screen.getByRole('button', { name: /Скасувати/i });
        await userEvent.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByPlaceholderText("Введіть нове ім'я")).not.toBeInTheDocument();
            expect(screen.getByText('Test User')).toBeInTheDocument(); // Original name should be back
            expect(fetchSpy).not.toHaveBeenCalled();
            expect(mockedUpdateSession).not.toHaveBeenCalled();
        });
    });


    it('shows user name from session when loaded', async () => {
        const initialSession: MockSession = {
            user: {
                id: 'user-id-1',
                name: 'Initial Name',
                email: 'initial@example.com',
                image: '/initial.png',
                role: 'USER',
            },
            expires: 'some-date-string'
        };

        mockedUseSession.mockReturnValue({
            data: initialSession,
            status: 'authenticated',
            update: mockedUpdateSession,
        });

        fetchSpy.mockImplementationOnce((url: RequestInfo | URL) => {
            if (url.toString().includes('/api/user/user-id-1')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: 'user-id-1',
                        name: 'Initial Name',
                        email: 'initial@example.com',
                        image: '/initial.png',
                        role: 'USER',
                    }),
                } as Response);
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });

        const { rerender } = render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText('Initial Name')).toBeInTheDocument();
        });

        const updatedSession: MockSession = {
            user: {
                id: 'user-id-1',
                name: 'Updated Name After Effect',
                email: 'initial@example.com',
                image: '/initial.png',
                role: 'USER',
            },
            expires: 'some-date-string'
        };

        mockedUseSession.mockReturnValue({
            data: updatedSession,
            status: 'authenticated',
            update: mockedUpdateSession,
        });

        fetchSpy.mockImplementationOnce((url: RequestInfo | URL) => {
            if (url.toString().includes('/api/user/user-id-1')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: 'user-id-1',
                        name: 'Updated Name After Effect',
                        email: 'initial@example.com',
                        image: '/initial.png',
                        role: 'USER',
                    }),
                } as Response);
            }
            return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
        });

        rerender(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByText('Updated Name After Effect')).toBeInTheDocument();
        });
    });
});
