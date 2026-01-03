import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // WebServer disabled - run `pnpm --filter bedaya dev` manually before tests
  // webServer: {
  //   command: 'pnpm --filter bedaya dev',
  //   url: 'http://localhost:3001',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
});
