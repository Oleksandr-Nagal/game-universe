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

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: ImageProps) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { src, alt, fill, ...rest } = props;
        const srcString = typeof src === 'string' ? src : (src as StaticImageData).src || '';

        // eslint-disable-next-line @next/next/no-img-element
        return <img src={srcString} alt={alt || 'mocked image'} {...rest} />;
    },
}));

const defaultAvatars = [
    '/avatars/avatar1.png',
    '/avatars/avatar2.png',
    '/avatars/avatar3.png',
    '/avatars/avatar4.png',
    '/avatars/avatar5.png',
];

describe('AvatarEditor Component', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseSession.mockReturnValue({
            data: {
                user: { id: '123', image: defaultAvatars[0] },
            },
            update: mockUpdate,
        });

        fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
            () => {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ image: defaultAvatars[1] }),
                } as Response);
            });
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    it('renders all default avatars', () => {
        render(<AvatarEditor currentImage={null} />);
        const avatars = screen.getAllByRole('img');
        expect(avatars).toHaveLength(5);
    });

    it('renders the title and avatar grid', () => {
        render(<AvatarEditor currentImage={null} />);
        expect(screen.getByText('Змінити Аватар')).toBeInTheDocument();
    });

    it('calls update with the selected avatar URL when an avatar is clicked', async () => {
        render(<AvatarEditor currentImage={defaultAvatars[0]} />);

        const secondAvatar = screen.getByAltText('Avatar 2');
        const expectedImageUrlInBody = defaultAvatars[1];

        fireEvent.click(secondAvatar);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(fetchSpy).toHaveBeenCalledWith(
                '/api/user/update-avatar',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ userId: '123', imageUrl: expectedImageUrlInBody }),
                })
            );
            expect(mockUpdate).toHaveBeenCalledTimes(1);
            expect(mockUpdate).toHaveBeenCalledWith({ image: defaultAvatars[1] });
            expect(screen.getByText('Аватар успішно оновлено!')).toBeInTheDocument();
        });
    });

    it('renders the currentImage with a highlighted border when provided', () => {
        const testImageUrl = defaultAvatars[2];
        mockUseSession.mockReturnValue({
            data: {
                user: { id: '123', image: testImageUrl },
            },
            update: mockUpdate,
        });

        render(<AvatarEditor currentImage={testImageUrl} />);

        const currentAvatarElement = screen.getByAltText('Avatar 3');
        expect(currentAvatarElement).toBeInTheDocument();
        expect((currentAvatarElement.closest('div') as HTMLElement)).toHaveClass('border-yellow-400');
    });


    it('handles update errors gracefully (e.g., displays error message)', async () => {
        fetchSpy.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: 'Server error message' }),
                status: 500,
            } as Response)
        );

        render(<AvatarEditor currentImage={null} />);

        const firstAvatar = screen.getAllByRole('img')[0];
        fireEvent.click(firstAvatar);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(mockUpdate).not.toHaveBeenCalled();
            expect(screen.getByText('Помилка: Server error message')).toBeInTheDocument();
        });
    });
});
