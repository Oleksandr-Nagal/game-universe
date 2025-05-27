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
    // **ВИПРАВЛЕННЯ ТУТ:**
    // Оновлюємо transformIgnorePatterns, щоб явно трансформувати пакети 'next' та 'next-auth'
    // та їхні підпакети. Це більш цілеспрямований підхід для Jest.
    transformIgnorePatterns: [
        '/node_modules/(?!(next|next-auth|@next-auth)/)',
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
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[tj]s?(x)',
    ],

};

module.exports = createJestConfig(customJestConfig);
