# Email OTP login increment

Scope: SMTP delivery, login/resend/logout, current-session endpoint, first-manager bootstrap, abuse limits and browser sign-in form. Team invitation/permission administration and all compensation screens remain separate work. This increment does not establish production readiness.

## API and security

- `POST /api/v1/auth/otp/request` and `/otp/resend`: strict `{email}` DTO, exact configured Origin, generic 202 response containing an opaque challenge ID and common message for eligible, unknown, expired-invitation, throttled and delivery-failure cases. Plaintext OTPs are never returned by HTTP, persisted or logged.
- `POST /api/v1/auth/otp/verify`: strict `{challengeId,code}`, generic 401 for bad codes, 429 for IP throttling. Atomically consumes one code, applies three attempts, activates eligible invitees and creates a hashed server session. Locks precede expiry checks. Shorter configured OTP/session timeouts are honored within approved maximums.
- `GET /api/v1/auth/me`: rechecks current identity and permissions and advances idle time only on valid sessions. No-store response.
- `POST /api/v1/auth/logout`: exact Origin and header CSRF check against the session's stored digest, persistent revocation and cookie clearing. No-store response.
- Session token: HttpOnly, Secure by default, SameSite=Lax, path `/`. Separate readable CSRF cookie supplies `X-CSRF-Token`; possession of that cookie alone grants no access. Explicit insecure cookies are allowed only outside production. Production requires HTTPS and SMTP TLS with certificate validation enabled.
- SMTP is sent after the issuance transaction and outside the response path to avoid exposing account/delivery state. One retry, bounded socket/connect/greeting timeouts; final failure invalidates that challenge and audits the event. Pending deliveries drain during graceful shutdown. A crash may lose delivery, requiring resend; no plaintext durable mail queue is introduced.
- Limits: 5 accepted OTP requests/hour per email/IP pair, 20/hour per email, and 20 auth attempts/10 minutes per IP. Denied attempts count toward IP activity but do not consume another email's issuance quota. PostgreSQL transaction advisory locking serializes limit decisions across processes. Identifiers are keyed digests, never raw emails/IPs. No forwarded headers are trusted; a production proxy policy must be explicitly configured before deployment.
- User soft-removal immediately revokes sessions and open challenges through migration 009. Login and rejection events are audited without codes/tokens. No historical salary data is modified.

## Running locally

1. Start PostgreSQL and apply migrations: `npm run db:local:start`, `npm run db:migrate`.
2. Configure a local SMTP capture service (Compose includes Mailpit) or authorized SMTP relay using `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, optional paired `SMTP_USER`/`SMTP_PASSWORD`, and `SMTP_SECURE`. Production requires TLS; no TLS validation bypass is provided.
3. Bootstrap once, using the owner connection already configured in the ignored environment file: `node --env-file=.env scripts/bootstrap-manager.mjs synthetic.manager@acme.test "Synthetic HR Manager" --confirm`. The CLI refuses when a live manager exists and attributes its audit record to the system identity. This example is synthetic; no account is created merely by reading this document.
4. Start the app with `npm run dev`. Open the address matching `APP_ORIGIN` exactly and use the sign-in form. No passwords or OTPs appear in the terminal.

## Verification

`npm run test:authentication` exercises PostgreSQL integrity, concurrency, rate limits and bootstrap in a uniquely named disposable synthetic database. `npm run test:login` builds the app and runs Chromium against a separate synthetic database and loopback-only SMTP capture; it requires no external mailbox and sends no external mail. Tests preserve traces/screenshots under ignored `qa-artifacts/login`. CI executes both along with the foundation regression suite. Production SMTP delivery, TLS termination, independent security review and full application/UAT remain release gates.
