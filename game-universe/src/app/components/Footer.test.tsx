// src/app/components/Footer.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Footer } from './Footer';


jest.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: jest.fn(() => <div />),
}));

describe('Footer', () => {
    it('renders social media links with accessible names', () => {
        render(<Footer />);

        const facebookLink = screen.getByRole('link', { name: /Facebook link/i });
        expect(facebookLink).toBeInTheDocument();
        expect(facebookLink).toHaveAttribute('href', 'https://www.facebook.com/yourgameuniverse');

        const instagramLink = screen.getByRole('link', { name: /Instagram link/i });
        expect(instagramLink).toBeInTheDocument();
        expect(instagramLink).toHaveAttribute('href', 'https://www.instagram.com/yourgameuniverse');

        const telegramLink = screen.getByRole('link', { name: /Telegram link/i });
        expect(telegramLink).toBeInTheDocument();
        expect(telegramLink).toHaveAttribute('href', 'https://t.me/yourgameuniverse');

        const tiktokLink = screen.getByRole('link', { name: /TikTok link/i });
        expect(tiktokLink).toBeInTheDocument();
        expect(tiktokLink).toHaveAttribute('href', 'https://www.tiktok.com/@yourgameuniverse');
    });

    it('renders copyright text with current year', () => {
        render(<Footer />);
        const currentYear = new Date().getFullYear();
        const copyrightText = screen.getByText(new RegExp(`© ${currentYear} GameUniverse\\. Усі права захищено\\.`));
        expect(copyrightText).toBeInTheDocument();
    });

    it('renders privacy policy link', () => {
        render(<Footer />);
        const privacyLink = screen.getByRole('link', { name: /Політика конфіденційності/i });
        expect(privacyLink).toBeInTheDocument();
        expect(privacyLink).toHaveAttribute('href', '/privacy');
    });
});