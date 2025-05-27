import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navbar } from '@/app/components/Navbar';

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

describe('Navbar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        render(<Navbar />);
        expect(screen.getByText(/GameUniverse/i)).toBeInTheDocument();
    });

    it('calls signIn when Sign In button is clicked', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        render(<Navbar />);

        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        expect(mockSignIn).toHaveBeenCalledTimes(1);
        expect(mockSignIn).toHaveBeenCalledWith();
    });

    it('renders user name and Sign Out button when authenticated as USER', () => {
        mockUseSession.mockReturnValue({
            data: { user: { name: 'Test User', email: 'test@example.com', role: 'USER' } },
            status: 'authenticated',
        });
        render(<Navbar />);

        expect(
            screen.getByText((content) => content.includes('Hello, Test User'))
        ).toBeInTheDocument(); // Перевірка тексту
        expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    });

    it('renders user name, Admin link, and Sign Out button when authenticated as ADMIN', () => {
        mockUseSession.mockReturnValue({
            data: { user: { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' } },
            status: 'authenticated',
        });
        render(<Navbar />);

        expect(
            screen.getByText((content) => content.includes('Hello, Admin User'))
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Admin/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    });

    it('calls signOut when Sign Out button is clicked', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { name: 'Test User', email: 'test@example.com', role: 'USER' } },
            status: 'authenticated',
        });
        render(<Navbar />);

        fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }));

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalledTimes(1);
            expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
        });
    });
});