// jest.setup.ts
import '@testing-library/jest-dom';

if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder } = require('util');
    global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
    const { TextDecoder } = require('util');
    global.TextDecoder = TextDecoder;
}

if (typeof global.ReadableStream === 'undefined') {
    try {
        const { ReadableStream } = require('stream/web');
        global.ReadableStream = ReadableStream;
    } catch (error) {
        console.error('ReadableStream is not supported in this Node.js environment', error);
    }
}

if (typeof global.MessagePort === 'undefined') {
    try {
        const { MessagePort } = require('worker_threads');
        global.MessagePort = MessagePort;
    } catch (error) {
        console.warn('MessagePort cannot be found; ensure the environment supports it.', error);
    }
}

const { fetch, Request, Response, Headers, FormData } = require('undici');

if (typeof global.Request === 'undefined') {
    global.Request = Request;
}
if (typeof global.Response === 'undefined') {
    global.Response = Response;
}
if (typeof global.Headers === 'undefined') {
    global.Headers = Headers;
}
if (typeof global.fetch === 'undefined') {
    global.fetch = fetch;
}
if (typeof global.FormData === 'undefined') {
    global.FormData = FormData;
}

process.env.GITHUB_ID = process.env.GITHUB_ID || 'mock_github_id';
process.env.GITHUB_SECRET = process.env.GITHUB_SECRET || 'mock_github_secret';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'mock_google_client_secret';
