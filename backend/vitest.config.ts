import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Unit imports validate configuration but must never use a developer's database or SMTP.
    env: {
      NODE_ENV: 'test',
      APP_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://unit_only:unit_only@127.0.0.1:1/acme_unit_only',
      MIGRATION_DATABASE_URL: 'postgresql://unit_only:unit_only@127.0.0.1:1/acme_unit_only',
      OTP_HMAC_SECRET: 'synthetic-unit-key-not-for-runtime-0000000000000000',
      DEV_INSECURE_COOKIES: 'true',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: '1',
      SMTP_FROM: 'unit@acme.test',
      SMTP_USER: '',
      SMTP_PASSWORD: '',
    },
  },
});
