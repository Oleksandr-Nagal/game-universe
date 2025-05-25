// src/app/page.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Імпортуємо для розширених matchers
import Home from './page'; // Імпортуємо ваш Home компонент

// Mock next-auth's useSession
jest.mock('next-auth/react', () => ({
    useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
}));

// Mock Sentry to prevent issues with its initialization in test environment
jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
    init: jest.fn(),
    // Додайте інші функції Sentry, які ви використовуєте, якщо потрібно
}));

describe('Home Page', () => {
    it('renders the main heading', () => {
        render(<Home />);

        // Перевіряємо, чи відображається заголовок "Welcome to GameSphere!"
        const heading = screen.getByRole('heading', {
            name: /Welcome to GameSphere!/i, // Пошук без урахування регістру
        });

        expect(heading).toBeInTheDocument();
    });

    it('renders the description paragraph', () => {
        render(<Home />);

        // Перевіряємо, чи відображається параграф опису
        const description = screen.getByText(
            /Explore, discover, and share your passion for video games./i
        );

        expect(description).toBeInTheDocument();
    });

    it('renders "Explore Games" link', () => {
        render(<Home />);

        const exploreLink = screen.getByRole('link', { name: /Explore Games/i });
        expect(exploreLink).toBeInTheDocument();
        expect(exploreLink).toHaveAttribute('href', '/games');
    });

    it('renders "Sign In" link when unauthenticated', () => {
        // Mock useSession to be unauthenticated
        require('next-auth/react').useSession.mockReturnValue({ data: null, status: 'unauthenticated' });

        render(<Home />);

        const signInLink = screen.getByRole('link', { name: /Sign In/i });
        expect(signInLink).toBeInTheDocument();
        expect(signInLink).toHaveAttribute('href', '/auth/signin');
    });

    it('does not render "Sign In" link when authenticated', () => {
        // Mock useSession to be authenticated
        require('next-auth/react').useSession.mockReturnValue({
            data: { user: { name: 'Test User' } },
            status: 'authenticated',
        });

        render(<Home />);

        const signInLink = screen.queryByRole('link', { name: /Sign In/i });
        expect(signInLink).not.toBeInTheDocument();
    });
});
