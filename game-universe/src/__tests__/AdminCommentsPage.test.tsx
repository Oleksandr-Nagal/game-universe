// __tests__/AdminCommentsPage.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminCommentsPage from '@/app/admin/comments/page';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

jest.mock('next-auth/react');

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
        prefetch: jest.fn(),
    })),
}));

jest.mock('next/link', () => {
    const Link = ({ children }: { children: React.ReactNode }) => <>{children}</>;
    Link.displayName = 'Link';
    return Link;
});

jest.mock('next/image', () => {
    const Image = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img {...props} alt={props.alt} />
    );
    Image.displayName = 'Image';
    return Image;
});

describe('AdminCommentsPage', () => {
    const useSessionMock = useSession as jest.Mock;
    const useRouterMock = useRouter as jest.Mock;
    const pushMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useRouterMock.mockReturnValue({ push: pushMock });
    });

    it('показує екран завантаження поки сесія і коментарі завантажуються', () => {
        useSessionMock.mockReturnValue({ data: null, status: 'loading' });

        render(<AdminCommentsPage />);
        expect(screen.getByText(/Завантаження коментарів.../i)).toBeInTheDocument();
    });

    it('редіректить не-адміністратора на головну сторінку', async () => {
        useSessionMock.mockReturnValue({ data: { user: { role: 'USER' } }, status: 'authenticated' });

        render(<AdminCommentsPage />);
        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith('/');
        });
    });

    it('показує помилку, якщо fetch повертає помилку', async () => {
        useSessionMock.mockReturnValue({ data: { user: { role: 'ADMIN' } }, status: 'authenticated' });

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                statusText: 'Internal Server Error',
                json: () => Promise.resolve({ error: 'Server error' }),
            } as Response)
        ) as jest.Mock;

        render(<AdminCommentsPage />);

        await waitFor(() => {
            expect(screen.getByText(/Помилка: Server error/i)).toBeInTheDocument();
        });
    });

    it('відображає список коментарів', async () => {
        useSessionMock.mockReturnValue({ data: { user: { role: 'ADMIN' } }, status: 'authenticated' });

        const mockComments = [
            {
                id: '1',
                content: 'Test comment',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: 'user1',
                user: {
                    id: 'user1',
                    name: 'Admin User',
                    email: 'admin@example.com',
                    image: null,
                },
                game: {
                    id: 'game1',
                    title: 'Test Game',
                },
            },
        ];

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockComments),
            } as Response)
        ) as jest.Mock;

        render(<AdminCommentsPage />);

        await waitFor(() => {
            expect(screen.getByText(/Керування Коментарями/i)).toBeInTheDocument();
            expect(screen.getByText('Admin User')).toBeInTheDocument();
            expect(screen.getByText('Test Game')).toBeInTheDocument();
            expect(screen.getByText('Test comment')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Видалити/i })).toBeInTheDocument();
        });
    });

    it('видаляє коментар після підтвердження', async () => {
        useSessionMock.mockReturnValue({ data: { user: { role: 'ADMIN' } }, status: 'authenticated' });

        const mockComments = [
            {
                id: '1',
                content: 'Test comment',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: 'user1',
                user: {
                    id: 'user1',
                    name: 'Admin User',
                    email: 'admin@example.com',
                    image: null,
                },
                game: {
                    id: 'game1',
                    title: 'Test Game',
                },
            },
        ];

        global.fetch = jest.fn((_url: RequestInfo, init?: RequestInit) => {
            if (init && init.method === 'DELETE') {
                return Promise.resolve({ ok: true } as Response);
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockComments),
            } as Response);
        }) as jest.Mock;

        jest.spyOn(window, 'confirm').mockImplementation(() => true);

        render(<AdminCommentsPage />);

        await waitFor(() => {
            expect(screen.getByText('Test comment')).toBeInTheDocument();
        });

        const deleteButton = screen.getByRole('button', { name: /Видалити/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/admin/comments/1', { method: 'DELETE' });
            expect(screen.queryByText('Test comment')).not.toBeInTheDocument();
        });
    });

    it('скасовує видалення, якщо confirm відмінено', async () => {
        useSessionMock.mockReturnValue({ data: { user: { role: 'ADMIN' } }, status: 'authenticated' });

        const mockComments = [
            {
                id: '1',
                content: 'Test comment',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: 'user1',
                user: {
                    id: 'user1',
                    name: 'Admin User',
                    email: 'admin@example.com',
                    image: null,
                },
                game: {
                    id: 'game1',
                    title: 'Test Game',
                },
            },
        ];

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockComments),
            } as Response)
        ) as jest.Mock;

        jest.spyOn(window, 'confirm').mockImplementation(() => false);

        render(<AdminCommentsPage />);

        await waitFor(() => {
            expect(screen.getByText('Test comment')).toBeInTheDocument();
        });

        const deleteButton = screen.getByRole('button', { name: /Видалити/i });
        fireEvent.click(deleteButton);

        expect(global.fetch).toHaveBeenCalledTimes(1); // Лише початковий fetch, видалення не виконується
        expect(screen.getByText('Test comment')).toBeInTheDocument();
    });
});