import { z } from 'zod';

const positiveInteger = (value: number) => z.coerce.number().int().positive().default(value);
const browserOrigin = z.url().refine(value => {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.origin === value;
  } catch { return false; }
}, 'Use an exact HTTP(S) origin without credentials, path, trailing slash, query or fragment');
const environment = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: positiveInteger(3001),
  APP_ORIGIN: browserOrigin,
  DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//),
  OTP_HMAC_SECRET: z.string().min(32),
  OTP_TTL_MINUTES: positiveInteger(15).pipe(z.number().max(15)),
  SESSION_IDLE_MINUTES: positiveInteger(30).pipe(z.number().max(30)),
  SESSION_ABSOLUTE_HOURS: positiveInteger(12).pipe(z.number().max(12)),
  FX_MAX_STALENESS_DAYS: positiveInteger(7),
  DEV_INSECURE_COOKIES: z.enum(['true', 'false']).default('false'),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: positiveInteger(1025),
  SMTP_FROM: z.string().min(1),
  SMTP_SECURE: z.enum(['true','false']).default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional()
}).superRefine((config, context) => {
  if (Boolean(config.SMTP_USER) !== Boolean(config.SMTP_PASSWORD)) {
    context.addIssue({ code: 'custom', message: 'SMTP user and password must be configured together' });
  }
  if (config.NODE_ENV === 'production' &&
      (config.DEV_INSECURE_COOKIES === 'true' || !config.APP_ORIGIN.startsWith('https://'))) {
    context.addIssue({ code: 'custom', message: 'Production requires HTTPS and secure cookies' });
  }
});

export function loadConfig(input: Record<string, string | undefined>) {
  const result = environment.safeParse(input);
  if (!result.success) {
    // Never include submitted values (connection strings and secrets) in diagnostics.
    throw new Error(`Invalid configuration: ${result.error.issues.map(i => `${i.path.join('.') || 'security'}: ${i.message}`).join('; ')}`);
  }
  return result.data;
}
