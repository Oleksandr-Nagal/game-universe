import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AvatarEditor } from './AvatarEditor';
import '@testing-library/jest-dom';

// Моки для `next-auth`
const mockUseSession = jest.fn();
const mockUpdateSession = jest.fn();

jest.mock('next-auth/react', () => ({
    useSession: () => mockUseSession(),
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />,
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />, // Заміна на звичайний тег <img>
}));

describe('AvatarEditor Component', () => {
    it('renders avatars correctly', () => {
        const mockUseSession = jest.fn();
        const mockUpdateSession = jest.fn();

        jest.mock('next-auth/react', () => ({
            useSession: mockUseSession,
        }));

        mockUseSession.mockReturnValue({
            data: { user: { id: '123', image: '' } },
            update: mockUpdateSession,
        });

        render(<AvatarEditor currentImage={null} />);

        const avatars = screen.getAllByRole('img');
        expect(avatars).toHaveLength(5);
    });
});
