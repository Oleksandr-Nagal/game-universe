// src/app/admin/admin.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '../admin/page';

// Define mock objects directly within the jest.mock factories.
// We will use the returned mock objects for resetting in beforeEach.

// Явно вказуємо типи для мокованих об'єктів, щоб уникнути 'any'.
// Для prismaClient можна створити інтерфейс, або використати Partial<typeof prisma>
// Якщо інтерфейс не визначений, можна використовувати більш конкретні типи для кожного методу.
let mockPrismaClientInstance: {
    user: {
        findMany: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
        count: jest.Mock;
    };
    game: {
        count: jest.Mock;
    };
    comment: {
        count: jest.Mock;
    };
};
let mockAuthInstance: {
    authOptions: object;
    getServerSession: jest.Mock;
};
let mockNextNavigationInstance: {
    redirect: jest.Mock;
};

jest.mock('@/lib/prisma', () => {
    mockPrismaClientInstance = {
        user: {
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        game: {
            count: jest.fn(),
        },
        comment: {
            count: jest.fn(),
        },
    };
    return { prisma: mockPrismaClientInstance };
});

jest.mock('@/lib/auth', () => {
    mockAuthInstance = {
        authOptions: {},
        getServerSession: jest.fn(),
    };
    return mockAuthInstance;
});

jest.mock('next/navigation', () => {
    mockNextNavigationInstance = {
        redirect: jest.fn(),
    };
    return mockNextNavigationInstance;
});

jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
    init: jest.fn(),
}));


describe('AdminPage', () => {
    beforeEach(() => {
        // Reset mocks using the instances captured from the mock factories
        mockPrismaClientInstance.user.findMany.mockReset();
        mockPrismaClientInstance.user.update.mockReset();
        mockPrismaClientInstance.user.delete.mockReset();
        mockPrismaClientInstance.user.count.mockReset();
        mockPrismaClientInstance.game.count.mockReset();
        mockPrismaClientInstance.comment.count.mockReset();
        mockAuthInstance.getServerSession.mockReset();
        mockNextNavigationInstance.redirect.mockClear();

        // Default mock for prisma counts
        mockPrismaClientInstance.user.count.mockResolvedValue(0);
        mockPrismaClientInstance.game.count.mockResolvedValue(0);
        mockPrismaClientInstance.comment.count.mockResolvedValue(0);

        mockAuthInstance.getServerSession.mockResolvedValue({
            user: {
                id: 'admin-user-id',
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'ADMIN',
            },
        });
    });

    it('redirects to home if user is not authenticated', async () => {
        mockAuthInstance.getServerSession.mockResolvedValue(null);

        render(<AdminPage/>);

        await waitFor(() => {
            expect(mockNextNavigationInstance.redirect).toHaveBeenCalledWith('/');
        });
    });

    it('redirects to home if user is authenticated but not ADMIN', async () => {
        mockAuthInstance.getServerSession.mockResolvedValue({
            user: {
                id: 'user-id',
                name: 'Regular User',
                email: 'user@example.com',
                role: 'USER',
            },
        });

        render(<AdminPage/>);

        await waitFor(() => {
            expect(mockNextNavigationInstance.redirect).toHaveBeenCalledWith('/');
        });
    });

    it('renders admin dashboard for ADMIN user', async () => {
        mockPrismaClientInstance.user.findMany.mockResolvedValue([
            { id: '1', name: 'User 1', email: 'user1@example.com', role: 'USER' },
            { id: '2', name: 'User 2', email: 'user2@example.com', role: 'ADMIN' },
        ]);
        mockPrismaClientInstance.user.count.mockResolvedValue(2);
        mockPrismaClientInstance.game.count.mockResolvedValue(10);
        mockPrismaClientInstance.comment.count.mockResolvedValue(5);


        render(<AdminPage/>);

        expect(screen.getByText('Панель Адміністратора')).toBeInTheDocument();
        expect(screen.getByText('Управління Користувачами')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('User 1')).toBeInTheDocument();
            expect(screen.getByText('User 2')).toBeInTheDocument();
            expect(mockNextNavigationInstance.redirect).not.toHaveBeenCalled();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
        });
    });
});