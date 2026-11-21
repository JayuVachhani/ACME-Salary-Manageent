import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve('.local/browsers');
const run = process.env.QA_RUN || 'final';
export default defineConfig({
  testDir: './e2e', timeout: 20000, expect: { timeout: 3000 },
  fullyParallel: false, workers: 1, retries: 0,
  outputDir: `qa-artifacts/${run}/test-results`,
  reporter: [['list'], ['json', { outputFile: `qa-artifacts/${run}/results.json` }],
    ['html', { outputFolder: `qa-artifacts/${run}/html`, open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4317', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'node --env-file=.env apps/api/dist/main.js', url: 'http://127.0.0.1:4318/healthz',
      env: { PORT: '4318' }, reuseExistingServer: false, timeout: 60000 },
    { command: 'npm run dev -w @acme/web -- --port 4317', url: 'http://127.0.0.1:4317',
      env: { QA_API_PORT: '4318' }, reuseExistingServer: false, timeout: 60000 }
  ]
});
