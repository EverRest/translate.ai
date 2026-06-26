import { defineConfig, devices } from '@playwright/test';

const apiHealthUrl = 'http://localhost:3000/api/v1/health';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node dist/src/main.js',
      cwd: '../backend',
      url: apiHealthUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DATABASE_URL:
          process.env.DATABASE_URL ??
          'postgresql://translate:translate@localhost:5432/translate_ai?schema=public',
        REDIS_HOST: process.env.REDIS_HOST ?? 'localhost',
        REDIS_PORT: process.env.REDIS_PORT ?? '6379',
        JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-test-secret',
        NODE_ENV: process.env.NODE_ENV ?? 'test',
        PORT: '3000',
        CORS_ORIGIN:
          process.env.CORS_ORIGIN ??
          'http://localhost:4173,http://localhost:5173',
        MOCK_TRANSLATIONS: 'true',
      },
    },
    {
      command: 'node dist/src/worker.main.js',
      cwd: '../backend',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DATABASE_URL:
          process.env.DATABASE_URL ??
          'postgresql://translate:translate@localhost:5432/translate_ai?schema=public',
        REDIS_HOST: process.env.REDIS_HOST ?? 'localhost',
        REDIS_PORT: process.env.REDIS_PORT ?? '6379',
        JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-test-secret',
        NODE_ENV: process.env.NODE_ENV ?? 'test',
        MOCK_TRANSLATIONS: 'true',
      },
    },
    {
      command: 'npx vite preview --port 4173 --host 127.0.0.1',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
