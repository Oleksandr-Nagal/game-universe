import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'; // Додано 'within'
import '@testing-library/jest-dom';
import AdminPage from '../app/admin/page'; // Перевірте шлях до вашого компонента AdminPage
import React from 'react';
// import { getServerSession } from '@/lib/auth'; // Цей імпорт більше не потрібен для мокування таким чином
// import { NextResponse } from 'next/server'; // Цей імпорт більше не потрібен, оскільки він використовується лише в моку

// Оголошуємо змінні для зберігання мок-функцій на рівні модуля, щоб вони були доступні для присвоєння в jest.mock
let mockGetServerSession: jest.Mock;
let mockUseSessionFn: jest.Mock; // Змінено назву, щоб уникнути конфлікту з імпортом useSession

// Оголошуємо мок-об'єкт prisma за межами jest.mock
const mockPrisma = {
    user: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
};

// Мокуємо залежності
jest.mock('next-auth/react', () => {
    mockUseSessionFn = jest.fn(); // Присвоюємо мок-функцію тут
    return {
        useSession: mockUseSessionFn,
    };
});

jest.mock('@/lib/auth', () => {
    mockGetServerSession = jest.fn(); // Присвоюємо мок-функцію тут
    return {
        getServerSession: mockGetServerSession,
    };
});

jest.mock('@/lib/prisma', () => ({
    prisma: mockPrisma, // Експортуємо попередньо визначений мок-об'єкт
}));

// Мокуємо next/server для NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((data) => ({ json: () => Promise.resolve(data) })),
    },
}));

describe('AdminPage', () => {
    // Ці змінні тепер посилаються на моки, оголошені вище
    let mockedUseSession: jest.Mock;
    let mockedGetServerSession: jest.Mock;
    let mockedPrismaUserFindMany: jest.Mock;
    let mockedPrismaUserUpdate: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks(); // Очищаємо всі моки перед кожним тестом

        // Отримуємо посилання на мок-функції, які були присвоєні в jest.mock
        mockedUseSession = mockUseSessionFn;
        mockedGetServerSession = mockGetServerSession;
        // Тепер ми можемо безпечно отримати доступ до властивостей mockPrisma
        mockedPrismaUserFindMany = mockPrisma.user.findMany as jest.Mock;
        mockedPrismaUserUpdate = mockPrisma.user.update as jest.Mock;

        // Дефолтні мок-значення для успішного сценарію
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
            // Імітуємо оновлення користувача
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
        cleanup(); // Очищаємо DOM після кожного тесту
    });

    it('redirects to / if user is not authenticated', async () => {
        mockedGetServerSession.mockResolvedValue(null);
        mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

        // Мокуємо next/navigation's redirect
        const { redirect } = require('next/navigation');
        redirect.mockImplementation(() => {
            throw new Error('Redirected'); // Кидаємо помилку, щоб зупинити виконання тесту
        });

        let error: Error | null = null;
        try {
            render(<AdminPage />);
        } catch (e: any) {
            error = e;
        }

        await waitFor(() => {
            expect(redirect).toHaveBeenCalledWith('/');
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

        // Мокуємо next/navigation's redirect
        const { redirect } = require('next/navigation');
        redirect.mockImplementation(() => {
            throw new Error('Redirected'); // Кидаємо помилку, щоб зупинити виконання тесту
        });

        let error: Error | null = null;
        try {
            render(<AdminPage />);
        } catch (e: any) {
            error = e;
        }

        await waitFor(() => {
            expect(redirect).toHaveBeenCalledWith('/');
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

        // Чекаємо, поки користувачі завантажаться
        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
        });

        // Знаходимо кнопку зміни ролі для User One (який є USER)
        const userOneRow = screen.getByText('User One').closest('tr');
        if (!userOneRow) throw new Error('User One row not found');

        const changeRoleButton = within(userOneRow).getByRole('button', { name: /Змінити роль/i });
        fireEvent.click(changeRoleButton);

        // Перевіряємо, що Prisma.user.update був викликаний з правильними аргументами
        await waitFor(() => {
            expect(mockedPrismaUserUpdate).toHaveBeenCalledWith({
                where: { id: 'user1' },
                data: { role: 'ADMIN' }, // Очікуємо, що роль зміниться на ADMIN
            });
        });

        // Імітуємо оновлення даних після зміни ролі
        mockedPrismaUserFindMany.mockResolvedValueOnce([
            { id: 'user1', name: 'User One', email: 'user1@example.com', role: 'ADMIN' }, // Оновлена роль
            { id: 'user2', name: 'User Two', email: 'user2@example.com', role: 'ADMIN' },
        ]);

        // Перевіряємо, що компонент оновився і відображає нову роль
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
            expect(screen.queryByText('User Two')).not.toBeInTheDocument(); // User Two (ADMIN) should be hidden
        });

        fireEvent.change(filterSelect, { target: { value: 'ADMIN' } });

        await waitFor(() => {
            expect(screen.queryByText('User One')).not.toBeInTheDocument(); // User One (USER) should be hidden
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

        fireEvent.change(searchInput, { target: { value: '' } }); // Clear search
        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
        });
    });
});
