import { defineConfig, devices } from '@playwright/test';

// E2E_BASE_URL permite pasar las pruebas contra producción: E2E_BASE_URL=https://oleacarb.vercel.app npx playwright test
const BASE = process.env.E2E_BASE_URL || 'http://localhost:4321';
const local = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: BASE, trace: 'off' },
  projects: [
    { name: 'chromium-movil', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'chromium-escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit-iphone', use: { ...devices['iPhone 13'] } },
    { name: 'webkit-escritorio', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } }
  ],
  webServer: local ? { command: 'npm run preview -- --port 4321', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 60_000 } : undefined
});
