import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
    authOptions: {},
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            count: jest.fn(),
        },
        game: {
            count: jest.fn(),
        },
        comment: {
            count: jest.fn(),
        },
    },
}));

describe('AdminPage', () => {
    let mockedGetServerSession: jest.Mock;
    let mockedRedirect: jest.Mock;
    let mockedPrismaUserCount: jest.Mock;
    let mockedPrismaGameCount: jest.Mock;
    let mockedPrismaCommentCount: jest.Mock;
    let AdminPage: typeof import('../app/admin/page').default;

    beforeEach(async () => {
        jest.clearAllMocks();

        AdminPage = (await import('../app/admin/page')).default;

        mockedGetServerSession = getServerSession as jest.Mock;
        mockedRedirect = redirect as unknown as jest.Mock; // <-- Changed this line
        mockedPrismaUserCount = prisma.user.count as jest.Mock;
        mockedPrismaGameCount = prisma.game.count as jest.Mock;
        mockedPrismaCommentCount = prisma.comment.count as jest.Mock;

        mockedGetServerSession.mockResolvedValue({
            user: { role: 'ADMIN', id: 'admin-id', name: 'Admin User', email: 'admin@example.com' },
        });
        mockedPrismaUserCount.mockResolvedValue(10);
        mockedPrismaGameCount.mockResolvedValue(5);
        mockedPrismaCommentCount.mockResolvedValue(20);
    });

    it('redirects to /auth/signin if user is not authenticated', async () => {
        mockedGetServerSession.mockResolvedValue(null);

        mockedRedirect.mockImplementation(() => {
            throw new Error('Redirected to signin');
        });

        let error: Error | null = null;
        try {
            await act(async () => {
                render(await AdminPage());
            });
        } catch (e: unknown) {
            error = e instanceof Error ? e : new Error(String(e));
        }

        await waitFor(() => {
            expect(mockedRedirect).toHaveBeenCalledWith('/auth/signin');
            expect(error).toBeInstanceOf(Error);
            expect(error?.message).toBe('Redirected to signin');
        });
    });

    it('redirects to / if user is authenticated but not ADMIN', async () => {
        mockedGetServerSession.mockResolvedValue({
            user: { role: 'USER', id: 'user-id', name: 'Regular User', email: 'user@example.com' },
        });

        mockedRedirect.mockImplementation(() => {
            throw new Error('Redirected to home');
        });

        let error: Error | null = null;
        try {
            await act(async () => {
                render(await AdminPage());
            });
        } catch (e: unknown) {
            error = e instanceof Error ? e : new Error(String(e));
        }

        await waitFor(() => {
            expect(mockedRedirect).toHaveBeenCalledWith('/');
            expect(error).toBeInstanceOf(Error);
            expect(error?.message).toBe('Redirected to home');
        });
    });

    it('renders admin panel and statistics for ADMIN user', async () => {
        await act(async () => {
            render(await AdminPage());
        });

        await waitFor(() => {
            expect(screen.getByText('Панель Адміністратора')).toBeInTheDocument();
            expect(screen.getByText('Ласкаво просимо, Admin User! Ви маєте адміністративні привілеї.')).toBeInTheDocument();

            expect(screen.getByText('Всього Користувачів')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();
            expect(screen.getByText('Всього Ігор')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('Всього Коментарів')).toBeInTheDocument();
            expect(screen.getByText('20')).toBeInTheDocument();

            expect(screen.getByRole('link', { name: 'Керувати Користувачами' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'Керувати Іграми' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'Керувати Коментарями' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'На головну' })).toBeInTheDocument();
        });
    });

    it('displays error message if data fetching for statistics fails', async () => {
        mockedPrismaUserCount.mockRejectedValue(new Error('Failed to fetch users'));
        mockedPrismaGameCount.mockRejectedValue(new Error('Failed to fetch games'));
        mockedPrismaCommentCount.mockRejectedValue(new Error('Failed to fetch comments'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await act(async () => {
            render(await AdminPage());
        });

        await waitFor(() => {
            expect(screen.getByText('Всього Користувачів').closest('div')).toHaveTextContent('0');
            expect(screen.getByText('Всього Ігор').closest('div')).toHaveTextContent('0');
            expect(screen.getByText('Всього Коментарів').closest('div')).toHaveTextContent('0');

            expect(consoleErrorSpy).toHaveBeenCalledWith('Помилка завантаження даних для панелі адміністратора:', expect.any(Error));
        });

        consoleErrorSpy.mockRestore();
    });
});