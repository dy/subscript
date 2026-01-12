import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test',
  testMatch: '*.spec.js',
  timeout: 30000,
  fullyParallel: true,
  workers: '50%',
  use: {
    headless: true,
    launchOptions: {
      args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
    }
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
