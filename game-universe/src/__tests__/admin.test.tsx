import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '../app/admin/page';
import React from 'react';


let mockedRedirectFn: jest.Mock;

jest.mock('next/navigation', () => {
    const originalModule = jest.requireActual('next/navigation');
    mockedRedirectFn = jest.fn();
    return {
        ...originalModule,
        redirect: mockedRedirectFn,
    };
});

let mockGetServerSession: jest.Mock;
let mockUseSessionFn: jest.Mock;

const mockPrisma = {
    user: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
};

jest.mock('next-auth/react', () => {
    mockUseSessionFn = jest.fn();
    return {
        useSession: mockUseSessionFn,
    };
});

jest.mock('@/lib/auth', () => {
    mockGetServerSession = jest.fn();
    return {
        getServerSession: mockGetServerSession,
    };
});

jest.mock('@/lib/prisma', () => ({
    prisma: mockPrisma,
}));

jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((data) => ({ json: () => Promise.resolve(data) })),
    },
}));

describe('AdminPage', () => {
    let mockedUseSession: jest.Mock;
    let mockedGetServerSession: jest.Mock;
    let mockedPrismaUserFindMany: jest.Mock;
    let mockedPrismaUserUpdate: jest.Mock;
    let mockedRedirect: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockedUseSession = mockUseSessionFn;
        mockedGetServerSession = mockGetServerSession;
        mockedPrismaUserFindMany = mockPrisma.user.findMany as jest.Mock;
        mockedPrismaUserUpdate = mockPrisma.user.update as jest.Mock;
        mockedRedirect = mockedRedirectFn;

        mockedGetServerSession.mockResolvedValue({
            user: { role: 'ADMIN', id: 'admin-id' },
        });

        mockedUseSession.mockReturnValue({
            data: { user: { role: 'ADMIN', id: 'admin-id' } },
            status: 'authenticated',
        });

        mockedPrismaUserFindMany.mockResolvedValue([
            { id: 'user1', name: 'User One', email: 'user1@example.com', role: 'USER' },
            { id: 'user2', name: 'User Two', email: 'user2@example.com', role: 'ADMIN' },
        ]);

        mockedPrismaUserUpdate.mockImplementation((args) => {
            const { where: { id }, data: { role } } = args;
            if (id === 'user1') {
                return Promise.resolve({ id: 'user1', name: 'User One', email: 'user1@example.com', role });
            }
            if (id === 'user2') {
                return Promise.resolve({ id: 'user2', name: 'User Two', email: 'user2@example.com', role });
            }
            return Promise.reject(new Error('User not found'));
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('redirects to / if user is not authenticated', async () => {
        mockedGetServerSession.mockResolvedValue(null);
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

        mockedRedirect.mockImplementation(() => {
            throw new Error('Redirected');
        });

        let error: Error | null = null;
        try {
            render(<AdminPage />);
        } catch (e: unknown) {
            if (e instanceof Error) {
                error = e;
            } else {
                error = new Error(String(e));
            }
        }

        await waitFor(() => {
            expect(mockedRedirect).toHaveBeenCalledWith('/');
            expect(error).toBeInstanceOf(Error);
            expect(error?.message).toBe('Redirected');
        });
    });

    it('redirects to / if user is authenticated but not ADMIN', async () => {
        mockedGetServerSession.mockResolvedValue({
            user: { role: 'USER', id: 'user-id' },
        });
        mockedUseSession.mockReturnValue({
            data: { user: { role: 'USER', id: 'user-id' } },
            status: 'authenticated',
        });

        mockedRedirect.mockImplementation(() => {
            throw new Error('Redirected');
        });

        let error: Error | null = null;
        try {
            render(<AdminPage />);
        } catch (e: unknown) {
            if (e instanceof Error) {
                error = e;
            } else {
                error = new Error(String(e));
            }
        }

        await waitFor(() => {
            expect(mockedRedirect).toHaveBeenCalledWith('/');
            expect(error).toBeInstanceOf(Error);
            expect(error?.message).toBe('Redirected');
        });
    });

    it('renders loading state initially', () => {
        mockedUseSession.mockReturnValue({ data: null, status: 'loading' });
        render(<AdminPage />);
        expect(screen.getByText('Завантаження...')).toBeInTheDocument();
    });

    it('renders admin panel and user list for ADMIN user', async () => {
        render(<AdminPage />);

        await waitFor(() => {
            expect(screen.getByText('Панель адміністратора')).toBeInTheDocument();
            expect(screen.getByText('Керування користувачами')).toBeInTheDocument();
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('user1@example.com')).toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
            expect(screen.getByText('user2@example.com')).toBeInTheDocument();
        });
    });

    it('allows changing user role', async () => {
        render(<AdminPage />);

        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
        });

        const userOneRow = screen.getByText('User One').closest('tr');
        if (!userOneRow) throw new Error('User One row not found');

        const changeRoleButton = within(userOneRow).getByRole('button', { name: /Змінити роль/i });
        fireEvent.click(changeRoleButton);

        await waitFor(() => {
            expect(mockedPrismaUserUpdate).toHaveBeenCalledWith({
                where: { id: 'user1' },
                data: { role: 'ADMIN' },
            });
        });

        mockedPrismaUserFindMany.mockResolvedValueOnce([
            { id: 'user1', name: 'User One', email: 'user1@example.com', role: 'ADMIN' },
            { id: 'user2', name: 'User Two', email: 'user2@example.com', role: 'ADMIN' },
        ]);

        await waitFor(() => {
            const updatedUserOneRole = within(userOneRow).getByText('ADMIN');
            expect(updatedUserOneRole).toBeInTheDocument();
        });
    });

    it('displays error message if role change fails', async () => {
        mockedPrismaUserUpdate.mockRejectedValue(new Error('DB error during role update'));

        render(<AdminPage />);

        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
        });

        const userOneRow = screen.getByText('User One').closest('tr');
        if (!userOneRow) throw new Error('User One row not found');

        const changeRoleButton = within(userOneRow).getByRole('button', { name: /Змінити роль/i });
        fireEvent.click(changeRoleButton);

        await waitFor(() => {
            expect(screen.getByText('Помилка оновлення ролі: DB error during role update')).toBeInTheDocument();
        });
    });

    it('filters users by role', async () => {
        render(<AdminPage />);

        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
        });

        const filterSelect = screen.getByLabelText('Фільтрувати за роллю:');
        fireEvent.change(filterSelect, { target: { value: 'USER' } });

        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.queryByText('User Two')).not.toBeInTheDocument();
        });

        fireEvent.change(filterSelect, { target: { value: 'ADMIN' } });

        await waitFor(() => {
            expect(screen.queryByText('User One')).not.toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
        });

        fireEvent.change(filterSelect, { target: { value: 'ALL' } });

        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
        });
    });

    it('searches users by name or email', async () => {
        render(<AdminPage />);

        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Пошук за іменем або email');
        fireEvent.change(searchInput, { target: { value: 'User One' } });

        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.queryByText('User Two')).not.toBeInTheDocument();
        });

        fireEvent.change(searchInput, { target: { value: 'user2@example.com' } });

        await waitFor(() => {
            expect(screen.queryByText('User One')).not.toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
        });

        fireEvent.change(searchInput, { target: { value: '' } });
        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
        });
    });
});