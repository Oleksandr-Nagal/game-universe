import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '@/app/components/Header';

const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockUseSession = jest.fn();

jest.mock('next-auth/react', () => ({
    useSession: () => mockUseSession(),
    signIn: (...args: [Record<string, unknown>?]) => mockSignIn(...args),
    signOut: (...args: [Record<string, unknown>?]) => mockSignOut(...args),
    SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Header Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    });

    it('renders correctly when unauthenticated', () => {
        render(<Header />);
        expect(screen.getByText(/GameUniverse/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Увійти/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Вийти/i })).not.toBeInTheDocument();
    });

    it('does not call signIn when "Увійти" link is clicked (it\'s a navigation link)', () => {
        render(<Header />);
        fireEvent.click(screen.getByRole('link', { name: /Увійти/i }));
        expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('renders user name and Sign Out button when authenticated', () => {
        mockUseSession.mockReturnValue({
            data: { user: { name: 'Test User', email: 'test@example.com' } },
            status: 'authenticated',
        });
        render(<Header />);
        expect(screen.getByText(/Привіт, Test User/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Вийти/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Увійти/i })).not.toBeInTheDocument();
    });

    it('calls signOut when "Вийти" button is clicked', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { name: 'Test User', email: 'test@example.com' } },
            status: 'authenticated',
        });
        render(<Header />);
        fireEvent.click(screen.getByRole('button', { name: /Вийти/i }));
        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalledTimes(1);
            expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
        });
    });
});
