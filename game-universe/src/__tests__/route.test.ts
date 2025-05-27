// src/__tests__/route.test.ts

// Mock process.env before any imports that might depend on it
jest.mock('process', () => ({
    ...jest.requireActual('process'),
    env: {
        ...jest.requireActual('process').env,
        GITHUB_ID: 'mock_github_id',
        GITHUB_SECRET: 'mock_github_secret',
        GOOGLE_CLIENT_ID: 'mock_google_client_id',
        GOOGLE_CLIENT_SECRET: 'mock_google_client_secret',
        // Add any other environment variables your auth.ts might be checking
    },
}));

import { PATCH, DELETE } from '@/app/api/comments/[id]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import type { DefaultSession } from 'next-auth';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        comment: {
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

const mockedPrisma = prisma as unknown as {
    comment: {
        findUnique: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
    };
};

const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

type UserRole = 'USER' | 'ADMIN';

interface MockSession {
    user?: {
        id: string;
        role: UserRole;
    } & DefaultSession['user'];
    expires: string;
}

interface RequestBody {
    content?: string;
}

function createRequest(body: RequestBody, url: string = 'http://localhost/api/comments/abc123') {
    return new Request(url, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('PATCH /api/comments/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 if not authenticated', async () => {
        mockedGetServerSession.mockResolvedValueOnce(null);
        const req = createRequest({ content: 'New content' });

        const res = await PATCH(req);

        const json = await res.json();
        expect(res.status).toBe(401);
        expect(json.error).toBe('Authentication required to update a comment.');
    });

    it('returns 400 if comment ID missing', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);

        const req = new Request('http://localhost/api/comments/', {
            method: 'PATCH',
            body: JSON.stringify({ content: 'Test' }),
            headers: { 'Content-Type': 'application/json' },
        });

        const res = await PATCH(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toBe('Comment ID is missing.');
    });

    it('returns 400 if content invalid', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);
        const req = createRequest({ content: '' });

        const res = await PATCH(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toBe('Comment content is required and must be a non-empty string.');
    });

    it('returns 404 if comment not found', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);
        mockedPrisma.comment.findUnique.mockResolvedValueOnce(null);

        const req = createRequest({ content: 'Test' });
        const res = await PATCH(req);
        const json = await res.json();

        expect(res.status).toBe(404);
        expect(json.error).toBe('Comment not found.');
    });

    it('returns 403 if user unauthorized', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);
        mockedPrisma.comment.findUnique.mockResolvedValueOnce({
            id: 'abc123',
            userId: 'otherUser',
            content: 'Old comment',
            updatedAt: new Date(),
        });

        const req = createRequest({ content: 'Test' });
        const res = await PATCH(req);
        const json = await res.json();

        expect(res.status).toBe(403);
        expect(json.error).toBe('Unauthorized to update this comment.');
    });

    it('updates comment if authorized', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);
        mockedPrisma.comment.findUnique.mockResolvedValueOnce({
            id: 'abc123',
            userId: 'user1',
            content: 'Old comment',
            updatedAt: new Date(),
        });
        mockedPrisma.comment.update.mockResolvedValueOnce({
            id: 'abc123',
            userId: 'user1',
            content: 'Updated comment',
            updatedAt: new Date(),
        });

        const req = createRequest({ content: 'Updated comment' });
        const res = await PATCH(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.content).toBe('Updated comment');
    });

    it('returns 500 on prisma error', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);
        mockedPrisma.comment.findUnique.mockImplementationOnce(() => {
            throw new Error('DB error');
        });

        const req = createRequest({ content: 'Test' });
        const res = await PATCH(req);
        const json = await res.json();

        expect(res.status).toBe(500);
        expect(json.error).toBe('Internal Server Error');
    });
});

describe('DELETE /api/comments/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 if not authenticated', async () => {
        mockedGetServerSession.mockResolvedValueOnce(null);

        const req = new Request('http://localhost/api/comments/abc123', { method: 'DELETE' });

        const res = await DELETE(req);
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.error).toBe('Authentication required to delete a comment.');
    });

    it('returns 400 if comment ID missing', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);

        const req = new Request('http://localhost/api/comments/', { method: 'DELETE' });

        const res = await DELETE(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toBe('Comment ID is missing.');
    });

    it('returns 404 if comment not found', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);
        mockedPrisma.comment.findUnique.mockResolvedValueOnce(null);

        const req = new Request('http://localhost/api/comments/abc123', { method: 'DELETE' });

        const res = await DELETE(req);
        const json = await res.json();

        expect(res.status).toBe(404);
        expect(json.error).toBe('Comment not found.');
    });

    it('returns 403 if unauthorized', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);
        mockedPrisma.comment.findUnique.mockResolvedValueOnce({
            id: 'abc123',
            userId: 'otherUser',
            content: 'Old comment',
            updatedAt: new Date(),
        });

        const req = new Request('http://localhost/api/comments/abc123', { method: 'DELETE' });

        const res = await DELETE(req);
        const json = await res.json();

        expect(res.status).toBe(403);
        expect(json.error).toBe('Unauthorized to delete this comment.');
    });

    it('deletes comment if authorized', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);
        mockedPrisma.comment.findUnique.mockResolvedValueOnce({
            id: 'abc123',
            userId: 'user1',
            content: 'Old comment',
            updatedAt: new Date(),
        });
        mockedPrisma.comment.delete.mockResolvedValueOnce({
            id: 'abc123',
            userId: 'user1',
            content: 'Old comment',
            updatedAt: new Date(),
        });

        const req = new Request('http://localhost/api/comments/abc123', { method: 'DELETE' });

        const res = await DELETE(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.message).toBe('Comment successfully deleted.');
    });

    it('returns 500 on prisma error', async () => {
        const mockUserSession: MockSession = {
            user: { id: 'user1', role: 'USER', name: 'User', email: 'user@example.com' },
            expires: '2024-12-31T23:59:59.000Z'
        };
        mockedGetServerSession.mockResolvedValueOnce(mockUserSession);
        mockedPrisma.comment.findUnique.mockImplementationOnce(() => {
            throw new Error('DB error');
        });

        const req = new Request('http://localhost/api/comments/abc123', { method: 'DELETE' });

        const res = await DELETE(req);
        const json = await res.json();

        expect(res.status).toBe(500);
        expect(json.error).toBe('Internal Server Error');
    });
});