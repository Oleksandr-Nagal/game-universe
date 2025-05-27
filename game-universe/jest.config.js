// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Підключення jest.setup.ts
    testEnvironment: 'jest-environment-jsdom',
    testEnvironmentOptions: {
        customExportConditions: ['node', 'require', 'default'],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest', {
            jsc: {
                transform: {
                    react: { runtime: 'automatic' },
                },
            },
        }],
    },
    transformIgnorePatterns: [
        '/node_modules/(?!node-fetch|jose|@web-platform-tests/tools|next-auth|undici|openid-client)/',
    ],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/app/api/**',
        '!src/lib/**',
        '!src/middleware.ts',
        '!src/app/layout.tsx',
        '!src/app/global-error.tsx',
        '!src/app/not-found.tsx',
        '!src/app/loading.tsx',
        '!src/constants/**',
        '!src/types/**',
    ],

    coverageThreshold: {
        global: {
            branches: 40,
            functions: 40,
            lines: 40,
            statements: 40,
        },
    },
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',  // Шукає файли у папці __tests__
        '**/?(*.)+(spec|test).[tj]s?(x)', // Шукає файли з суфіксом .spec.js/ts/jsx/tsx або .test.js/ts/jsx/tsx
    ],

};

module.exports = createJestConfig(customJestConfig);