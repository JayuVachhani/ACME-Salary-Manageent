import { describe, expect, it } from 'vitest';
import {
  generateOtp,
  generateSessionToken,
  matchesSecret,
  secretDigest,
  sessionExpired,
} from './auth-secrets.js';

const key = 'synthetic-test-key-with-at-least-32-characters';
describe('authentication secrets', () => {
  it('binds keyed digests to the challenge and verifies without storing the OTP', () => {
    const digest = secretDigest(key, 'otp:challenge-a', '000123');
    expect(matchesSecret(key, 'otp:challenge-a', '000123', digest)).toBe(true);
    expect(matchesSecret(key, 'otp:challenge-b', '000123', digest)).toBe(false);
    expect(matchesSecret(key, 'otp:challenge-a', '000124', digest)).toBe(false);
    expect(matchesSecret(key, 'otp:challenge-a', '000123', 'malformed')).toBe(false);
    expect(() => secretDigest('short', 'otp', '123456')).toThrow();
  });
  it('generates six-digit OTPs and opaque 256-bit session tokens', () => {
    for (let i = 0; i < 100; i++) expect(generateOtp()).toMatch(/^\d{6}$/);
    expect(generateSessionToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateSessionToken()).not.toBe(generateSessionToken());
  });
  it('expires sessions at both idle and absolute boundaries', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    expect(sessionExpired(start, start, new Date(+start + 30 * 60_000 - 1))).toBe(false);
    expect(sessionExpired(start, start, new Date(+start + 30 * 60_000))).toBe(true);
    const end = new Date(+start + 12 * 60 * 60_000);
    expect(sessionExpired(start, end, end)).toBe(true);
    expect(sessionExpired(start, start, new Date(+start + 5 * 60_000), 5, 1)).toBe(true);
  });
});
