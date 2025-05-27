// jest.setup.ts
import '@testing-library/jest-dom';

// Synchronous setup for TextEncoder and TextDecoder
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder } = require('util');
    global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
    const { TextDecoder } = require('util');
    global.TextDecoder = TextDecoder;
}

// ReadableStream
if (typeof global.ReadableStream === 'undefined') {
    try {
        const { ReadableStream } = require('stream/web');
        global.ReadableStream = ReadableStream;
    } catch (error) {
        console.error('ReadableStream is not supported in this Node.js environment', error);
    }
}

// MessagePort setup
if (typeof global.MessagePort === 'undefined') {
    try {
        const { MessagePort } = require('worker_threads');
        global.MessagePort = MessagePort;
    } catch (error) {
        console.warn('MessagePort cannot be found; ensure the environment supports it.', error);
    }
}

// Fetch API polyfills (if needed)
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
if (typeof global.FormData === 'undefined') {
    global.FormData = FormData;
}
if (typeof global.fetch === 'undefined') {
    global.fetch = fetch;
}