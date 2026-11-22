# ACME — SMTP integration contract

**Purpose:** Describe real OTP/invitation transport, configuration, errors and verification.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 0e0fb86 (merged PR #7), plus the P4c FX increment on feature/fx-rate-administration.

## Executive summary

SMTP through Nodemailer 10.6.1 is the only delivered external application service beyond PostgreSQL. It sends passwordless codes and HR invitation notices. Local captured messages demonstrate functionality but not production relay/TLS/delivery acceptance. No cloud mail API, storage service or document attachment pipeline exists. Related: [README.md](README.md), [ORCHESTRATION.md](ORCHESTRATION.md), [RBAC.md](RBAC.md).

## Configuration and transport

Source: [otp-mail.ts](../acme-salary-app/apps/api/src/otp-mail.ts) and [config.ts](../acme-salary-app/apps/api/src/config.ts). Required SMTP_HOST/SMTP_FROM, port default 1025, SMTP_SECURE false, optional paired SMTP_USER/SMTP_PASSWORD. Production sets requireTLS; certificate validation is not disabled. Connect, greeting and socket timeouts are each 5000 ms. File and URL access are disabled, no attachments are constructed, and SMTP logging/debug is false. A complete operation can include multiple protocol timeout phases plus one retry; do not promise an overall five-second deadline.

## Interfaces

| Function | Inputs | Result / failure policy |
|---|---|---|
| createOtpMailer(config) | email, raw generated six-digit code | Promise<void>; text code/configured expiry; at most two sends; final error handled by auth controller |
| createInvitationMailer(config) | eligible invited email | Promise<void>; plain-text APP_ORIGIN sign-in link and seven-day expiry note; no invitation bearer token or auto-OTP |
| Auth issue boundary | internal AuthenticationService.issue result | Raw code stays in memory only, HMAC stored; generic 202 does not disclose delivery or eligibility |
| Team notify boundary | saved account id/email | Sent/failed result visible to authorized HR; separate failed-delivery audit, account stays saved |

Generic internal transport error text still says OTP delivery failed even for the shared invitation sender; callers do not expose SMTP exception details. This naming is a minor implementation quirk, not an additional mail type or public contract.

## Failure and recovery

On final OTP transport failure, invalidate that exact challenge, not a later resend; audit failure is not translated into a usable code. User requests a new code after relay recovery, within normal limits. On invitation failure, fix SMTP and use Reinvite for an INVITED account; it resets expiry/version and invalidates open OTPs. Reinvite cannot reactivate a DELETED account or renew an ACTIVE account. Delivery acknowledgement means transport acceptance, not proof that a production recipient read the message.

Unknown recipients have the same public request shape; no code is sent if account/invitation is ineligible. Origin and throttling are enforced separately. SMTP work is not a durable outbox; process crash can lose pending mail. No LLM fallback, secondary provider, external FX fallback or local-file spool is implemented.

## Safe development verification

Use Mailpit via the optional Compose mail service at loopback SMTP 1025/inbox 8025, or npm run test:login for its isolated SMTP capture at 4325. The latter creates only synthetic users in a random guarded test database, parses delivered messages in memory and tests failure by stopping capture last. Do not run test fixtures against a shared production cluster or send real employee addresses through tests. Preserve metadata-only logs; never copy captured OTP/session traces into Git or docs.

Browser harness update: existing QA_RUN selects distinct web/API ports: login 4427/4428, references 4527/4528, country-currency 4627/4628; sequential capture SMTP remains 4325. The runner logs only group/stage/process status diagnostics. GitHub run 45006454596 failed during third-group startup before country cases executed; exact cause unproven. PR #7 final head4938a138 passed run45007418682/job137162007364 and was subsequently merged at0e0fb86; failed startup evidence remains historical. P4c adds the isolated FX group on4727/4728; no retries or relaxed assertions.

FX increment adds test:fx to CI and a fourth isolated test:login group (QA_RUN=fx, web/API4727/4728, SMTP4325 sequential). Artifacts qa-artifacts/fx are retained. No external FX provider, background job, new secret/config variable or deployment behavior is introduced.
