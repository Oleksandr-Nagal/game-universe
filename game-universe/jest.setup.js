// jest.setup.js
import '@testing-library/jest-dom';

if (typeof global.ReadableStream === 'undefined') {
    try {
        global.ReadableStream = require('stream/web').ReadableStream;
    } catch (error) {
        console.error('ReadableStream не підтримується у вашій версії Node.js:', error);
    }
}

if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = require('util').TextDecoder;
}

if (typeof global.MessagePort === 'undefined') {
    try {
        const { MessagePort } = require('stream/web');
        global.MessagePort = MessagePort;
    } catch (error) {
        console.warn('MessagePort not found in stream/web, trying worker_threads:', error);
        try {
            const { MessagePort } = require('worker_threads');
            global.MessagePort = MessagePort;
        } catch (workerError) {
            console.error('MessagePort is not supported in this Node.js environment:', workerError);
        }
    }
}

const { Request, Response, Headers, FormData } = require('undici');

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
    global.fetch = require('undici').fetch;
}
