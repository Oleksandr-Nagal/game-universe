import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../app/auth/register/page';
import * as nextAuth from 'next-auth/react';
import * as nextRouter from 'next/navigation';

jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe('RegisterPage', () => {
    const pushMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (nextRouter.useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    });

    test('рендерить форму реєстрації', () => {
        render(<RegisterPage />);
        expect(screen.getByLabelText(/Ім'я/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Електронна пошта/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Пароль/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Підтвердіть пароль/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /зареєструватись/i })).toBeInTheDocument();
    });

    test('показує помилку, якщо паролі не співпадають', async () => {
        render(<RegisterPage />);

        fireEvent.change(screen.getByLabelText(/Ім'я/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/Електронна пошта/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^Пароль/i), { target: { value: '12345678' } });
        fireEvent.change(screen.getByLabelText(/Підтвердіть пароль/i), { target: { value: '87654321' } });

        fireEvent.click(screen.getByRole('button', { name: /зареєструватись/i }));

        expect(await screen.findByTestId('error-message')).toHaveTextContent('Паролі не співпадають.');
    });

    test('успішна реєстрація і виклик signIn та перенаправлення', async () => {
        render(<RegisterPage />);

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            } as Response)
        ) as jest.Mock;

        (nextAuth.signIn as jest.Mock).mockResolvedValue({ ok: true });

        fireEvent.change(screen.getByLabelText(/Ім'я/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/Електронна пошта/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^Пароль/i), { target: { value: '12345678' } });
        fireEvent.change(screen.getByLabelText(/Підтвердіть пароль/i), { target: { value: '12345678' } });

        fireEvent.click(screen.getByRole('button', { name: /зареєструватись/i }));

        await waitFor(() => {
            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        });

        expect(nextAuth.signIn).toHaveBeenCalledWith('credentials', {
            redirect: false,
            email: 'test@example.com',
            password: '12345678',
        });
        expect(pushMock).toHaveBeenCalledWith('/');
    });

    test('показує помилку, якщо сервер повертає помилку', async () => {
        render(<RegisterPage />);

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: 'Email вже використовується' }),
            } as Response)
        ) as jest.Mock;

        fireEvent.change(screen.getByLabelText(/Ім'я/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/Електронна пошта/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^Пароль/i), { target: { value: '12345678' } });
        fireEvent.change(screen.getByLabelText(/Підтвердіть пароль/i), { target: { value: '12345678' } });

        fireEvent.click(screen.getByRole('button', { name: /зареєструватись/i }));

        expect(await screen.findByTestId('error-message')).toHaveTextContent('Email вже використовується');
    });
});
