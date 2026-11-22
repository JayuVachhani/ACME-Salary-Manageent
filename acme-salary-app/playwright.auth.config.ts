import base from './playwright.config';
import { defineConfig } from '@playwright/test';
export default defineConfig({ ...base,
  testDir: './e2e-auth',
  use: { ...base.use, baseURL: 'http://127.0.0.1:4427' },
  testMatch: ['authentication.spec.ts','team.spec.ts'],
  webServer: [
    { command: 'node --env-file=.env apps/api/dist/main.js', url: 'http://127.0.0.1:4428/healthz',
      env: { PORT: '4428', APP_ORIGIN: 'http://127.0.0.1:4427', SMTP_HOST: '127.0.0.1', SMTP_PORT: '4325', DEV_INSECURE_COOKIES: 'true' }, stdout:'pipe',stderr:'pipe',reuseExistingServer: false, timeout: 60000 },
    { command: 'npm run dev -w @acme/web -- --port 4427', url: 'http://127.0.0.1:4427',
      env: { QA_API_PORT: '4428' }, stdout:'pipe',stderr:'pipe',reuseExistingServer: false, timeout: 60000 }
  ]
});
