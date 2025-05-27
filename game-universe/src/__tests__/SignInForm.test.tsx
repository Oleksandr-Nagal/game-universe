import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignInForm } from '@/app/auth/signin/SignInForm';
import * as nextAuth from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

describe('SignInForm', () => {
    const pushMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useRouter as jest.Mock).mockReturnValue({
            push: pushMock,
        });

        (useSearchParams as jest.Mock).mockReturnValue({
            get: () => null,
        });

        (nextAuth.useSession as jest.Mock).mockReturnValue({
            status: 'unauthenticated',
        });

        (nextAuth.signIn as jest.Mock).mockResolvedValue({ ok: true });
    });

    test('рендерить форму та поля', () => {
        render(<SignInForm />);

        expect(screen.getByLabelText(/Електронна пошта/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Пароль/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^Увійти$/i })).toBeInTheDocument();
        expect(screen.getByText(/Або увійдіть за допомогою:/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Увійти за допомогою GitHub/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Увійти за допомогою Google/i })).toBeInTheDocument();
    });

    test('показує помилку, якщо у URL є error=OAuthAccountNotLinked', () => {
        (useSearchParams as jest.Mock).mockReturnValue({
            get: (key: string) => (key === 'error' ? 'OAuthAccountNotLinked' : null),
        });

        render(<SignInForm />);

        expect(screen.getByText(/Обліковий запис з такою електронною поштою вже існує/i)).toBeInTheDocument();
    });

    test('показує загальну помилку з URL параметру error', () => {
        (useSearchParams as jest.Mock).mockReturnValue({
            get: (key: string) => (key === 'error' ? 'SomeRandomError' : null),
        });

        render(<SignInForm />);

        expect(screen.getByText(/Помилка входу: Some Random Error./i)).toBeInTheDocument();
    });

    test('успішний вхід викликає signIn та редіректить', async () => {
        render(<SignInForm />);

        fireEvent.change(screen.getByLabelText(/Електронна пошта/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Пароль/i), { target: { value: '12345678' } });

        fireEvent.click(screen.getByRole('button', { name: /^Увійти$/i }));

        await waitFor(() => {
            expect(nextAuth.signIn).toHaveBeenCalledWith('credentials', {
                redirect: false,
                email: 'test@example.com',
                password: '12345678',
            });
            expect(pushMock).toHaveBeenCalledWith('/');
        });
    });

    test('показує помилку, якщо signIn повертає помилку', async () => {
        (nextAuth.signIn as jest.Mock).mockResolvedValue({ error: 'Невірний пароль', ok: false });

        render(<SignInForm />);

        fireEvent.change(screen.getByLabelText(/Електронна пошта/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Пароль/i), { target: { value: 'wrongpassword' } });

        const buttons = screen.getAllByRole('button', { name: /Увійти/i });
        const submitButton = buttons.find(button => button.getAttribute('type') === 'submit');

        if (!submitButton) throw new Error('Submit button not found');

        fireEvent.click(submitButton);

        expect(await screen.findByText(/Невірний пароль/i)).toBeInTheDocument();
    });

    test('показує індикатор завантаження під час входу', async () => {
        let resolveSignIn: () => void;
        const signInPromise = new Promise<void>((resolve) => {
            resolveSignIn = resolve;
        });
        (nextAuth.signIn as jest.Mock).mockImplementation(() => signInPromise);

        render(<SignInForm />);

        fireEvent.change(screen.getByLabelText(/Електронна пошта/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Пароль/i), { target: { value: '12345678' } });

        const submitButtons = screen.getAllByRole('button').filter(
            btn => btn.getAttribute('type') === 'submit' && btn.textContent?.trim() === 'Увійти'
        );
        if (submitButtons.length === 0) throw new Error('Submit button not found');
        const submitButton = submitButtons[0];

        fireEvent.click(submitButton);

        expect(screen.getByRole('button', { name: /Вхід.../i })).toBeDisabled();

        resolveSignIn!();

        await waitFor(() => {
            const btns = screen.getAllByRole('button').filter(
                btn => btn.getAttribute('type') === 'submit' && btn.textContent?.trim() === 'Увійти'
            );
            expect(btns.length).toBeGreaterThan(0);
            expect(btns[0]).not.toBeDisabled();
        });
    });

    test('показує завантаження під час статусу loading', () => {
        (nextAuth.useSession as jest.Mock).mockReturnValue({
            status: 'loading',
        });

        render(<SignInForm />);

        expect(screen.getByText(/Завантаження.../i)).toBeInTheDocument();
    });

    test('не рендерить форму, якщо статус authenticated', () => {
        (nextAuth.useSession as jest.Mock).mockReturnValue({
            status: 'authenticated',
        });

        const { container } = render(<SignInForm />);
        expect(container).toBeEmptyDOMElement();
    });
});
