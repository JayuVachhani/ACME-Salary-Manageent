import base from './playwright.config';
import { defineConfig } from '@playwright/test';
// Separate server ports as well as databases; do not race a prior group's teardown.
const group=process.env.QA_RUN==='fx'?3:process.env.QA_RUN==='references'?1:process.env.QA_RUN==='country-currency'?2:0;
const webPort=4427+100*group,apiPort=4428+100*group;
const origin=`http://127.0.0.1:${webPort}`;
export default defineConfig({ ...base,
  testDir: './e2e-auth',
  use: { ...base.use, baseURL: origin },
  testMatch: ['authentication.spec.ts','team.spec.ts','organization-references.spec.ts','country-currency.spec.ts','fx-rates.spec.ts'],
  webServer: [
    { command: 'node --env-file=.env apps/api/dist/main.js', url: `http://127.0.0.1:${apiPort}/healthz`,
      env: { PORT: String(apiPort), APP_ORIGIN: origin, SMTP_HOST: '127.0.0.1', SMTP_PORT: '4325', DEV_INSECURE_COOKIES: 'true' }, stdout:'pipe',stderr:'pipe',reuseExistingServer: false, timeout: 60000 },
    { command: `npm run dev -w @acme/web -- --port ${webPort}`, url: origin,
      env: { QA_API_PORT: String(apiPort) }, stdout:'pipe',stderr:'pipe',reuseExistingServer: false, timeout: 60000 }
  ]
});
