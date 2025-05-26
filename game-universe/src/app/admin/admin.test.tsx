// src/app/admin/admin.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '../admin/page';

const mockPrisma = {
    user: {
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },

};

jest.mock('@/lib/prisma', () => ({
    prisma: mockPrisma,
}));

const mockGetServerSession = jest.fn();

jest.mock('@/lib/auth', () => ({
    authOptions: {},
    getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));


jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
    init: jest.fn(),
}));

describe('AdminPage', () => {
    beforeEach(() => {
        mockPrisma.user.findMany.mockReset();
        mockPrisma.user.update.mockReset();
        mockPrisma.user.delete.mockReset();
        mockGetServerSession.mockReset();

        mockGetServerSession.mockResolvedValue({
            user: {
                id: 'admin-user-id',
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'ADMIN',
            },
        });
    });

    it('redirects to home if user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValue(null);

        const mockRedirect = jest.fn();
        jest.mock('next/navigation', () => ({
            redirect: mockRedirect,
        }));

        render(<AdminPage/>);

        expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('redirects to home if user is authenticated but not ADMIN', async () => {
        mockGetServerSession.mockResolvedValue({
            user: {
                id: 'user-id',
                name: 'Regular User',
                email: 'user@example.com',
                role: 'USER',
            },
        });

        const mockRedirect = jest.fn();
        jest.mock('next/navigation', () => ({
            redirect: mockRedirect,
        }));

        render(<AdminPage/>);

        expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('renders admin dashboard for ADMIN user', async () => {
        mockPrisma.user.findMany.mockResolvedValue([
            { id: '1', name: 'User 1', email: 'user1@example.com', role: 'USER' },
            { id: '2', name: 'User 2', email: 'user2@example.com', role: 'ADMIN' },
        ]);

        render(<AdminPage/>);

        expect(screen.getByText('Панель Адміністратора')).toBeInTheDocument();
        expect(screen.getByText('Управління Користувачами')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('User 1')).toBeInTheDocument();
            expect(screen.getByText('User 2')).toBeInTheDocument();
        });
    });

});