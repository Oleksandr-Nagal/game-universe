// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './', // Вказуємо кореневий каталог, де знаходиться Next.js
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Підключення jest.setup.js
    testEnvironment: 'jest-environment-jsdom', // Використання середовища jsdom для тестів
    moduleNameMapper: {
        // Маппінг для коректної роботи з альясами
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        // Використовуємо @swc/jest для трансформації файлів
        '^.+\\.(ts|tsx|js|jsx)$': '@swc/jest',
    },
    transformIgnorePatterns: [
        // Ігноруємо трансформацію певних модулів, окрім зазначених
        '/node_modules/(?!node-fetch|jose|@web-platform-tests/tools|next-auth|undici)/',
    ],
    collectCoverageFrom: [
        // Які файли включати у звіт покриття
        'src/**/*.{js,jsx,ts,tsx}', // Файли, для яких буде збиратись покриття
        '!src/**/*.d.ts',           // Виключення типових визначень
        '!src/app/api/**',          // Виключення API-роутів
        '!src/lib/**',              // Виключення системних бібліотек
        '!src/middleware.ts',       // Виключення middleware
    ],
    coverageThreshold: {
        global: {
            // Мінімальні пороги покриття тестами
            branches: 40,
            functions: 40,
            lines: 40,
            statements: 40,
        },
    },
    testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
    ],
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
};

module.exports = createJestConfig(customJestConfig);
