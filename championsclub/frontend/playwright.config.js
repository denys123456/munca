import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.js',
  timeout: 30000,
  expect: { timeout: 6000 },
  workers: 1,
  fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: 'artifacts/browser-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 1000 },
    launchOptions: { channel: 'msedge' },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
})
