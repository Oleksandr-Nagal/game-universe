import React from 'react';
import { render, screen } from '@testing-library/react';
import { AvatarEditor } from './AvatarEditor';
import '@testing-library/jest-dom';

const mockUseSession = jest.fn();
const mockUpdate = jest.fn();

jest.mock('next-auth/react', () => ({
    useSession: () => mockUseSession(),
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: {
        src: string;
        alt: string;
        width?: number;
        height?: number;
        className?: string;
        style?: React.CSSProperties;
    }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img {...props} alt={props.alt || 'mocked image'} />
    ),
}));

describe('AvatarEditor Component', () => {
    beforeEach(() => {
        mockUseSession.mockReturnValue({
            data: {
                user: { id: '123', image: '' },
            },
            update: mockUpdate,
        });
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
});
