import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4333', 
    trace: 'off',
  },
  webServer: {
    command: 'npm run dev -- --port 4333',
    url: 'http://localhost:4333',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
