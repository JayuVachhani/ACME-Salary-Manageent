import { z } from 'zod';

const positiveInteger = (value: number) => z.coerce.number().int().positive().default(value);
const environment = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: positiveInteger(3001),
  APP_ORIGIN: z.url(),
  DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//),
  OTP_HMAC_SECRET: z.string().min(32),
  OTP_TTL_MINUTES: positiveInteger(15).pipe(z.number().max(15)),
  SESSION_IDLE_MINUTES: positiveInteger(30),
  SESSION_ABSOLUTE_HOURS: positiveInteger(12),
  FX_MAX_STALENESS_DAYS: positiveInteger(7),
  DEV_INSECURE_COOKIES: z.enum(['true', 'false']).default('false'),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: positiveInteger(1025),
  SMTP_FROM: z.string().min(1)
}).superRefine((config, context) => {
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
