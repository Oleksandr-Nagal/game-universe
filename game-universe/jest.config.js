// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    testEnvironmentOptions: {
        customExportConditions: ['node', 'require', 'default'],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': '@swc/jest',
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
    ],
    coverageThreshold: {
        global: {
            branches: 40,
            functions: 40,
            lines: 40,
            statements: 40,
        },
    },
};

module.exports = createJestConfig(customJestConfig);
