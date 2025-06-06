// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jest-environment-jsdom',
    testEnvironmentOptions: {
        customExportConditions: ['node', 'require', 'default'],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'mjs'],
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    transform: {
        '^.+\\.(ts|tsx|js|jsx|mjs)$': ['@swc/jest', {
            jsc: {
                transform: {
                    react: { runtime: 'automatic' },
                },
            },
        }],
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(next|next-auth|@next-auth)/)',
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
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[tj]s?(x)',
    ],

};

module.exports = createJestConfig(customJestConfig);
