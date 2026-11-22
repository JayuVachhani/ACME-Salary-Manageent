import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

const valid = { APP_ORIGIN: 'http://localhost:5173', DATABASE_URL: 'postgresql://localhost/acme',
  OTP_HMAC_SECRET: 'synthetic-test-secret-at-least-32-characters', SMTP_HOST: 'localhost', SMTP_FROM: 'test@acme.test' };

describe('startup security boundary', () => {
  it('selects approved timeouts and requires explicit insecure cookie opt-in', () => {
    expect(loadConfig(valid)).toMatchObject({ OTP_TTL_MINUTES: 15, SESSION_IDLE_MINUTES: 30,
      SESSION_ABSOLUTE_HOURS: 12, DEV_INSECURE_COOKIES: 'false' });
  });
  it('rejects production HTTP or insecure cookies', () => {
    expect(() => loadConfig({ ...valid, NODE_ENV: 'production' })).toThrow('Production requires');
    expect(() => loadConfig({ ...valid, NODE_ENV: 'production', APP_ORIGIN: 'https://acme.test', DEV_INSECURE_COOKIES: 'true' })).toThrow('Production requires');
  });
  it('accepts secure production configuration', () => {
    expect(loadConfig({ ...valid, NODE_ENV: 'production', APP_ORIGIN: 'https://acme.test' }).NODE_ENV).toBe('production');
  });
  it('fails closed on missing secrets and invalid lifetime', () => {
    expect(() => loadConfig({ ...valid, OTP_HMAC_SECRET: '' })).toThrow('Invalid configuration');
    expect(() => loadConfig({ ...valid, OTP_TTL_MINUTES: '1440' })).toThrow('Invalid configuration');
    expect(() => loadConfig({ ...valid, PORT: '-1' })).toThrow('Invalid configuration');
    expect(() => loadConfig({ ...valid, SESSION_IDLE_MINUTES: '31' })).toThrow('Invalid configuration');
    expect(() => loadConfig({ ...valid, SESSION_ABSOLUTE_HOURS: '13' })).toThrow('Invalid configuration');
  });
  it('does not disclose submitted credentials in errors', () => {
    try { loadConfig({ ...valid, DATABASE_URL: 'secret-sensitive-connection' }); }
    catch (error) { expect(String(error)).not.toContain('secret-sensitive-connection'); }
  });
  it('requires SMTP credentials as a pair', () => {
    expect(() => loadConfig({ ...valid, SMTP_USER: 'synthetic' })).toThrow('configured together');
    expect(() => loadConfig({ ...valid, SMTP_PASSWORD: 'synthetic' })).toThrow('configured together');
  });
  it('rejects URL values that a browser cannot send as an exact Origin', () => {
    for (const APP_ORIGIN of ['https://acme.test/path', 'https://acme.test/', 'https://acme.test?x=1', 'https://acme.test#x', 'https://user:password@acme.test', 'ftp://acme.test']) {
      expect(() => loadConfig({ ...valid, APP_ORIGIN })).toThrow('exact HTTP(S) origin');
    }
  });

});
