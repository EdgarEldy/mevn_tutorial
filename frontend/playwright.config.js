import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // These tests hit a real backend doing real bcrypt hashing (cost factor 12) and real
  // MySQL/MailHog round trips, not fast isolated mocks. On a CI runner's more limited CPU
  // allocation, several tests concurrently registering/logging in/resetting passwords can
  // contend for the same cores badly enough to blow past even a generous assertion
  // timeout - not because anything is broken, but because bcrypt is deliberately slow and
  // parallel workers multiply that cost. Serializing in CI trades wall-clock time for
  // reliability; locally, default parallelism is fine since there's no contention.
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
