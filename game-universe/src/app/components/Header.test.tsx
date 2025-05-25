import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Header } from './Header';
import '@testing-library/jest-dom';

// Явна типізація для моків
const mockSignIn: jest.Mock<void, [Record<string, unknown>?]> = jest.fn();
const mockSignOut: jest.Mock<void, [Record<string, unknown>?]> = jest.fn();
const mockUseSession: jest.Mock<
    { data: { user: { name: string; email: string; role: string } } | null; status: string },
    []
> = jest.fn();

jest.mock('next-auth/react', () => ({
    useSession: () => mockUseSession(),
    signIn: (...args: [Record<string, unknown>?]) => mockSignIn(...args),
    signOut: (...args: [Record<string, unknown>?]) => mockSignOut(...args),
    SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Header', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Очищаємо виклики моків перед кожним тестом
    });

    it('renders loading state for AuthButtons', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'loading' });
        render(<Header />);
        expect(screen.getByText('Завантаження...')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Увійти/i })).not.toBeInTheDocument();
    });

    it('renders Sign In and Register links when unauthenticated', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        render(<Header />);
        expect(screen.getByRole('link', { name: /Увійти/i })).toHaveAttribute('href', '/auth/signin');
        expect(screen.getByRole('link', { name: /Зареєструватись/i })).toHaveAttribute('href', '/auth/register');
        expect(screen.queryByRole('button', { name: /Вийти/i })).not.toBeInTheDocument();
    });

    it('renders user name, Profile link, and Sign Out button when authenticated as USER', () => {
        mockUseSession.mockReturnValue({
            data: { user: { name: 'Test User', email: 'test@example.com', role: 'USER' } },
            status: 'authenticated',
        });
        render(<Header />);

        // Використання функції-маски для перевірки тексту
        expect(
            screen.getByText((content) => content.includes('Привіт, Test User'))
        ).toBeInTheDocument(); // Перевірка тексту
        expect(
            screen.getByRole('link', { name: /Привіт, Test User/i }) // Перевірка через гнучкий name match
        ).toHaveAttribute('href', '/profile');
        expect(screen.getByRole('button', { name: /Вийти/i })).toBeInTheDocument(); // Перевірка кнопки
    });

    it('calls signOut when Sign Out button is clicked', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { name: 'Test User', email: 'test@example.com', role: 'USER' } },
            status: 'authenticated',
        });
        render(<Header />);
        fireEvent.click(await screen.findByRole('button', { name: /Вийти/i }));
        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalledTimes(1);
        });
    });
});