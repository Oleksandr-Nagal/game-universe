// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './', // Вказуємо кореневий каталог, де знаходиться Next.js
});

/** @type {import('jest').Config} */
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Підключення jest.setup.js
    testEnvironment: 'jest-environment-jsdom', // Використання середовища jsdom для тестів
    // Додаємо опції для Jest JSDOM середовища
    testEnvironmentOptions: {
        // Це може допомогти Jest/JSDOM правильно вирішити імпорти ESM модулів,
        // надаючи перевагу Node.js-специфічним умовам експорту.
        customExportConditions: ['node', 'require', 'default'],
    },
    moduleNameMapper: {
        // Маппінг для коректної роботи з альясами
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        // Використовуємо @swc/jest для трансформації файлів TypeScript/JavaScript
        '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest', {
            jsc: {
                transform: {
                    react: {
                        runtime: 'automatic', // Важливо для React 17+ без явного імпорту React
                    },
                },
            },
        }],
    },
    transformIgnorePatterns: [
        // Ігноруємо трансформацію певних модулів з node_modules,
        // окрім тих, що є ESM і потребують трансформації для Jest/Node.js
        '/node_modules/(?!node-fetch|jose|@web-platform-tests/tools|next-auth|undici|openid-client)/',
    ],
    collectCoverageFrom: [
        // Які файли включати у звіт покриття
        'src/**/*.{js,jsx,ts,tsx}',    // Всі файли з .js, .jsx, .ts, .tsx в папці src
        '!src/**/*.d.ts',              // Виключення типових визначень
        '!src/app/api/**',             // Виключення API-роутів (зазвичай не тестуються юніт-тестами)
        '!src/lib/**',                 // Виключення системних бібліотек (якщо не містять кастомної логіки, яку ви хочете покрити)
        '!src/middleware.ts',          // Виключення middleware
        '!src/app/layout.tsx',         // Виключення кореневого layout (рідко тестується юніт-тестами)
        '!src/app/global-error.tsx',   // Виключення global error page
        '!src/app/not-found.tsx',      // Виключення not found page
        '!src/app/loading.tsx',        // Виключення loading page
        '!src/constants/**',           // Виключення констант
        '!src/types/**',               // Виключення типів
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
    // Додаємо `testMatch` для Jest, щоб він знав, де шукати ваші файли тестів
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',  // Шукає файли у папці __tests__
        '**/?(*.)+(spec|test).[tj]s?(x)', // Шукає файли з суфіксом .spec.js/ts/jsx/tsx або .test.js/ts/jsx/tsx
    ],
    // Важливо: перевірте, чи `jest.setup.js` містить всі необхідні поліфіли для Jest/JSDOM
    // Він виглядає добре, якщо це той, що ви надали раніше.
};

module.exports = createJestConfig(customJestConfig);