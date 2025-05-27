import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '../app/admin/page';

const mockedPrismaUserCount = jest.fn();
const mockedPrismaGameCount = jest.fn();
const mockedPrismaCommentCount = jest.fn();
const mockedGetServerSession = jest.fn();
const mockedRedirect = jest.fn();
const mockedCaptureException = jest.fn();
const mockedSentryInit = jest.fn();


jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            count: mockedPrismaUserCount,
        },
        game: {
            count: mockedPrismaGameCount,
        },
        comment: {
            count: mockedPrismaCommentCount,
        },
    },
}));

jest.mock('@/lib/auth', () => ({
    authOptions: {},
    getServerSession: mockedGetServerSession,
}));

jest.mock('next/navigation', () => ({
    redirect: mockedRedirect,
}));

jest.mock('@sentry/nextjs', () => ({
    captureException: mockedCaptureException,
    init: mockedSentryInit,
}));

describe('AdminPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockedGetServerSession.mockReset();
        mockedRedirect.mockReset();
        mockedPrismaUserCount.mockReset();
        mockedPrismaGameCount.mockReset();
        mockedPrismaCommentCount.mockReset();
        mockedCaptureException.mockReset();
        mockedSentryInit.mockReset();


        mockedGetServerSession.mockResolvedValue({
            user: {
                id: 'admin-user-id',
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'ADMIN',
            },
        });
        mockedPrismaUserCount.mockResolvedValue(10);
        mockedPrismaGameCount.mockResolvedValue(5);
        mockedPrismaCommentCount.mockResolvedValue(20);
    });

    it('redirects to /auth/signin if user is not authenticated', async () => {
        mockedGetServerSession.mockResolvedValue(null);

        render(<AdminPage />);

        await waitFor(() => {
            expect(mockedRedirect).toHaveBeenCalledTimes(1);
            expect(mockedRedirect).toHaveBeenCalledWith('/auth/signin');
        });
    });

    it('redirects to / if user is authenticated but not ADMIN', async () => {
        mockedGetServerSession.mockResolvedValue({
            user: {
                id: 'user-id',
                name: 'Regular User',
                email: 'user@example.com',
                role: 'USER',
            },
        });

        render(<AdminPage />);

        await waitFor(() => {
            expect(mockedRedirect).toHaveBeenCalledTimes(1);
            expect(mockedRedirect).toHaveBeenCalledWith('/');
        });
    });

    it('renders admin dashboard for ADMIN user and displays counts', async () => {
        render(<AdminPage />);

        await waitFor(() => {
            expect(screen.getByText('Панель Адміністратора')).toBeInTheDocument();
            expect(screen.getByText(/Ласкаво просимо, Admin User!/i)).toBeInTheDocument();

            expect(screen.getByText('Всього Користувачів')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();
            expect(screen.getByText('Всього Ігор')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('Всього Коментарів')).toBeInTheDocument();
            expect(screen.getByText('20')).toBeInTheDocument();

            expect(screen.getByRole('link', { name: /Керувати Користувачами/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /Керувати Іграми/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /Керувати Коментарями/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /На головну/i })).toBeInTheDocument();
        });

        expect(mockedRedirect).not.toHaveBeenCalled();
    });

    it('displays 0 for counts if there is a Prisma error', async () => {
        mockedPrismaUserCount.mockRejectedValue(new Error('DB error'));
        mockedPrismaGameCount.mockRejectedValue(new Error('DB error'));
        mockedPrismaCommentCount.mockRejectedValue(new Error('DB error'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<AdminPage />);

        await waitFor(() => {
            expect(screen.getByText('Панель Адміністратора')).toBeInTheDocument();

            expect(screen.getByText('Всього Користувачів')).toBeInTheDocument();
            expect(screen.getAllByText('0')[0]).toBeInTheDocument();
            expect(screen.getByText('Всього Ігор')).toBeInTheDocument();
            expect(screen.getAllByText('0')[1]).toBeInTheDocument();
            expect(screen.getByText('Всього Коментарів')).toBeInTheDocument();
            expect(screen.getAllByText('0')[2]).toBeInTheDocument();
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Помилка завантаження даних для панелі адміністратора:',
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });
});
