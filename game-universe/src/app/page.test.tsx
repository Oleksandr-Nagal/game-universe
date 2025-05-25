// src/app/page.test.tsx
import { render, screen } from '@testing-library/react';
import HomeContent from './components/HomeContent';
import '@testing-library/jest-dom';

describe('HomeContent component', () => {
    it('renders guest links when unauthenticated', () => {
        render(<HomeContent isAuthenticated={false} isAdmin={false} />);
        expect(screen.getByRole('link', { name: /Увійти/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Мій Профіль/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Панель Адміністратора/i })).not.toBeInTheDocument();
    });

    it('renders user links when authenticated', () => {
        render(<HomeContent isAuthenticated={true} isAdmin={false} />);
        expect(screen.getByRole('link', { name: /Мій Профіль/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Увійти/i })).not.toBeInTheDocument();
    });

    it('renders admin panel when user is admin', () => {
        render(<HomeContent isAuthenticated={true} isAdmin={true} />);
        expect(screen.getByRole('link', { name: /Панель Адміністратора/i })).toBeInTheDocument();
    });

    it('renders main heading and description', () => {
        render(<HomeContent isAuthenticated={false} isAdmin={false} />);
        expect(screen.getByRole('heading', { name: /Ласкаво просимо до GameUniverse!/i })).toBeInTheDocument();
        expect(screen.getByText(/Відкривайте, досліджуйте та поєднуйтесь/i)).toBeInTheDocument();
    });
});
