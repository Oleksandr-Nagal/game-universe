import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AvatarEditor } from '@/app/components/AvatarEditor';
import '@testing-library/jest-dom';
import type { ImageProps, StaticImageData } from 'next/image';

const mockUseSession = jest.fn();
const mockUpdate = jest.fn();

jest.mock('next-auth/react', () => ({
    useSession: () => mockUseSession(),
}));

// Мок для next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: ImageProps) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { src, alt, fill, sizes, style, className, ...rest } = props;
        const srcString = typeof src === 'string' ? src : (src as StaticImageData).src || '';

        // eslint-disable-next-line @next/next/no-img-element
        return <img src={srcString} alt={alt || 'mocked image'} style={style as React.CSSProperties} className={className} {...rest} />;
    },
}));

const CLOUDINARY_CLOUD_NAME = 'dqordf8f5';
const defaultAvatars = [
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411202/avatar1.png`,
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411202/avatar2.png`,
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411202/avatar3.png`,
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411202/avatar4.jpg`,
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1748411202/avatar5.png`,
];
describe('Компонент AvatarEditor', () => {
    let fetchSpy: jest.SpyInstance | undefined;
    let createObjectURLSpy: jest.SpyInstance | undefined;
    let revokeObjectURLSpy: jest.SpyInstance | undefined;

    beforeEach(() => {
        jest.clearAllMocks();

        if (!global.URL.createObjectURL) {
            Object.defineProperty(global.URL, 'createObjectURL', {
                writable: true,
                value: jest.fn(),
            });
        }
        if (!global.URL.revokeObjectURL) {
            Object.defineProperty(global.URL, 'revokeObjectURL', {
                writable: true,
                value: jest.fn(),
            });
        }
        createObjectURLSpy = jest.spyOn(global.URL, 'createObjectURL').mockReturnValue('blob:test/mock-url');
        revokeObjectURLSpy = jest.spyOn(global.URL, 'revokeObjectURL').mockImplementation(() => {});


        mockUseSession.mockReturnValue({
            data: {
                user: { id: '123', image: defaultAvatars[0] },
            },
            update: mockUpdate,
            status: 'authenticated',
        });

        fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
            async (url, options) => {
                if (url === '/api/user/update-avatar' && options?.method === 'POST') {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ image: defaultAvatars[1] }),
                    } as Response);
                }
                if (url === '/api/user/update-avatar' && options?.method === 'PATCH') {
                    const body = JSON.parse(options.body as string);
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ image: body.imageUrl }),
                    } as Response);
                }
                if (options?.headers && (options.headers as Record<string, string>)['X-Test-Delay']) {
                    await new Promise(resolve => setTimeout(resolve, parseInt((options.headers as Record<string, string>)['X-Test-Delay'], 10)));
                }
                return Promise.reject(new Error(`Неопрацьований виклик fetch: ${url} ${options?.method}`));
            });
    });

    afterEach(() => {
        if (fetchSpy) fetchSpy.mockRestore();
        if (createObjectURLSpy) createObjectURLSpy.mockRestore();
        if (revokeObjectURLSpy) revokeObjectURLSpy.mockRestore();
    });

    it('Рендерить всі дефолтні аватари', () => {
        render(<AvatarEditor currentImage={null} />);
        const avatars = screen.getAllByRole('img').filter((img): img is HTMLImageElement =>
            (img as HTMLImageElement).alt?.startsWith('Avatar ')
        );
        expect(avatars).toHaveLength(defaultAvatars.length);
    });

    it('Рендерить заголовок та сітку аватарів', () => {
        render(<AvatarEditor currentImage={null} />);
        expect(screen.getByText('Змінити Аватар')).toBeInTheDocument();
        expect(screen.getByText('Завантажити свій аватар')).toBeInTheDocument();
    });

    it('Викликає оновлення з вибраним URL аватара при натисканні на дефолтний аватар', async () => {
        render(<AvatarEditor currentImage={defaultAvatars[0]} />);

        const secondAvatar = screen.getByAltText('Avatar 2');
        const expectedImageUrlInBody = defaultAvatars[1];

        fireEvent.click(secondAvatar);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(fetchSpy).toHaveBeenCalledWith(
                '/api/user/update-avatar',
                expect.objectContaining({
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: expectedImageUrlInBody }),
                })
            );
        });
        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledTimes(1);
            expect(mockUpdate).toHaveBeenCalledWith({ image: expectedImageUrlInBody });
            expect(screen.getByText('Аватар успішно оновлено!')).toBeInTheDocument();
        });
    });

    it('Рендерить currentImage з виділеною рамкою, якщо надано', () => {
        const testImageUrl = defaultAvatars[2];
        mockUseSession.mockReturnValueOnce({
            data: { user: { id: '123', image: testImageUrl } },
            update: mockUpdate,
            status: 'authenticated',
        });

        render(<AvatarEditor currentImage={testImageUrl} />);

        const currentAvatarElement = screen.getByAltText('Avatar 3');
        expect(currentAvatarElement).toBeInTheDocument();
        const parentDiv = currentAvatarElement.closest('div');
        expect(parentDiv).toHaveClass('border-yellow-400');
    });

    it('Обробляє помилки оновлення дефолтного аватара (наприклад, відображає повідомлення про помилку)', async () => {
        fetchSpy?.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: 'Повідомлення про помилку сервера' }),
                status: 500,
            } as Response)
        );

        render(<AvatarEditor currentImage={null} />);

        const firstAvatar = screen.getByAltText('Avatar 1');
        fireEvent.click(firstAvatar);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(mockUpdate).not.toHaveBeenCalled();
            expect(screen.getByText('Помилка: Повідомлення про помилку сервера')).toBeInTheDocument();
        });
    });

    it('Дозволяє користувачеві завантажити новий аватар', async () => {
        render(<AvatarEditor currentImage={null} />);

        const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
        const mockFile = new File(['dummy content'], 'test-avatar.png', { type: 'image/png' });

        fireEvent.change(fileInput, { target: { files: [mockFile] } });

        await waitFor(() => {
            expect(createObjectURLSpy).toHaveBeenCalledWith(mockFile);
            expect(screen.getByAltText('Preview')).toBeInTheDocument();
        });

        const uploadButton = screen.getByRole('button', { name: 'Завантажити' });
        expect(uploadButton).not.toBeDisabled();

        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(fetchSpy).toHaveBeenCalledWith(
                '/api/user/update-avatar',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.any(FormData),
                })
            );
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledTimes(1);
            expect(mockUpdate).toHaveBeenCalledWith({ image: defaultAvatars[1] });
            expect(screen.getByText('Аватар успішно завантажено та оновлено!')).toBeInTheDocument();
        });

        expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    });

    it('Кнопка "Завантажити" деактивована, якщо файл не вибрано', () => {
        render(<AvatarEditor currentImage={null} />);
        const uploadButton = screen.getByRole('button', { name: 'Завантажити' });
        expect(uploadButton).toBeDisabled();
    });


    it('Обробляє помилки завантаження (наприклад, відображає повідомлення про помилку)', async () => {
        fetchSpy?.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: 'Помилка завантаження з сервера' }),
                status: 400,
            } as Response)
        );

        render(<AvatarEditor currentImage={null} />);

        const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
        const mockFile = new File(['dummy content'], 'test-avatar.png', { type: 'image/png' });
        fireEvent.change(fileInput, { target: { files: [mockFile] } });

        await waitFor(() => expect(screen.getByAltText('Preview')).toBeInTheDocument());

        const uploadButton = screen.getByRole('button', { name: 'Завантажити' });
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(mockUpdate).not.toHaveBeenCalled();
            expect(screen.getByText('Помилка: Помилка завантаження з сервера')).toBeInTheDocument();
        });
    });

    it('Показує стан завантаження під час оновлення дефолтного аватара', async () => {
        fetchSpy?.mockImplementationOnce(async (_url, options) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            const body = JSON.parse(options!.body as string);
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ image: body.imageUrl }),
            } as Response);
        });

        render(<AvatarEditor currentImage={null} />);
        const uploadCustomButton = screen.getByRole('button', { name: 'Завантажити' });
        const fileInputElement = screen.getByTestId('file-input');


        const firstAvatar = screen.getByAltText('Avatar 1');
        fireEvent.click(firstAvatar);

        expect(screen.getByText('Оновлення аватара...')).toBeInTheDocument();
        expect(uploadCustomButton).toBeDisabled();
        expect(fileInputElement).toBeDisabled();

        await waitFor(() => {
            expect(screen.queryByText('Оновлення аватара...')).not.toBeInTheDocument();
            expect(uploadCustomButton).toBeDisabled();
            expect(fileInputElement).not.toBeDisabled();
        }, { timeout: 500 });
    });

    it('Показує стан завантаження під час завантаження файлу', async () => {
        fetchSpy?.mockImplementationOnce(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ image: defaultAvatars[1] }),
            } as Response);
        });

        render(<AvatarEditor currentImage={null} />);
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
        const uploadButton = screen.getByRole('button', { name: 'Завантажити' });

        const mockFile = new File(['dummy content'], 'test-avatar.png', { type: 'image/png' });
        fireEvent.change(fileInput, { target: { files: [mockFile] } });

        await waitFor(() => expect(screen.getByAltText('Preview')).toBeInTheDocument());

        fireEvent.click(uploadButton);

        expect(screen.getByText('Завантаження...')).toBeInTheDocument();
        expect(uploadButton).toBeDisabled();
        expect(fileInput).toBeDisabled();

        await waitFor(() => {
            expect(screen.queryByText('Завантаження...')).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Завантажити' })).toBeDisabled();
            expect(fileInput).not.toBeDisabled();
        }, { timeout: 500 });
    });
});

