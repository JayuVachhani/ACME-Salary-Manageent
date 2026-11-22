import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/** Store only keyed digests; bind OTPs to a challenge to prevent cross-request replay. */
export function secretDigest(key: string, purpose: string, value: string): string {
  if (key.length < 32) throw new Error('Authentication key must contain at least 32 characters');
  return createHmac('sha256', key)
    .update(JSON.stringify([purpose, value]))
    .digest('hex');
}

export function matchesSecret(
  key: string,
  purpose: string,
  value: string,
  digest: string,
): boolean {
  if (!/^[a-f0-9]{64}$/.test(digest)) return false;
  return timingSafeEqual(
    Buffer.from(secretDigest(key, purpose, value), 'hex'),
    Buffer.from(digest, 'hex'),
  );
}

export const generateOtp = (): string => randomInt(0, 1_000_000).toString().padStart(6, '0');
export const generateSessionToken = (): string => randomBytes(32).toString('base64url');

export function sessionExpired(
  createdAt: Date,
  lastSeenAt: Date,
  now: Date,
  idleMinutes = 30,
  absoluteHours = 12,
): boolean {
  return (
    now.getTime() >= createdAt.getTime() + absoluteHours * 60 * 60_000 ||
    now.getTime() >= lastSeenAt.getTime() + idleMinutes * 60_000
  );
}
