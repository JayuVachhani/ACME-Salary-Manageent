# ACME — background work and optional frameworks

**Purpose:** Document the actual asynchronous mail boundary and absent job infrastructure.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), a2dea9f (merged PR #6), plus the P4b country/currency increment on feature/country-currency-administration.

## Executive summary

There is no queue, cron, graph, worker process, job table, webhook, SSE or orchestration framework. The applicable background work is ephemeral OTP SMTP delivery in the API process. Team invitation SMTP is awaited after transaction commit. This file is included because the handoff explicitly asks for job/lifecycle clarity. Related: [SMTP_INTEGRATION.md](SMTP_INTEGRATION.md), [CONTEXT.md](CONTEXT.md), [DEPLOYMENT.md](DEPLOYMENT.md).

~~~mermaid
flowchart LR
  Request[Public OTP request] --> Budget[Atomic rate decision]
  Budget --> Response[Generic 202]
  Budget --> Issue[In-process issue Promise]
  Issue --> Commit[Challenge transaction commits]
  Commit --> Send[SMTP attempt plus one retry]
  Send --> Failure[Final failure invalidates code and audits]
  HR[HR invite or renew] --> TeamCommit[Team transaction commits]
  TeamCommit --> AwaitMail[Await invitation SMTP]
  AwaitMail --> Result[Saved account plus delivery sent or failed]
~~~

## Real flags/configuration

| Setting | Default | Effect |
|---|---|---|
| DEV_INSECURE_COOKIES | false | Dev HTTP exception only; forbidden in production, not a worker toggle |
| SMTP_SECURE | false | Implicit TLS transport; production also requires TLS |
| NODE_ENV | development | Production security checks and mail TLS requirement |
| QA_RUN / ACME_AUTH_TEST_DATABASE | Test-controlled | Artifact/fixture isolation, not production feature flags |

There is no USE_GRAPH, ENABLE_WORKER, AI_PROVIDER or synchronous/legacy fallback mode. Do not add imaginary env flags to deployment examples.

## Entry points and local operation

- authController creates a Set of delivery Promises. The request returns without awaiting user lookup/SMTP. Delivery issue has its own transaction; unknown accounts have no code and no send.
- createOtpMailer/createInvitationMailer use createMailSender with connect/greeting/socket timeouts and at most two attempts. No attachment/file/URL access or SMTP body debugging is enabled.
- authController.drain resolves currently tracked deliveries; explicit main.ts app.close wrapper calls it before pool.end. A process crash is not recoverable by a queue; signal/shutdown behavior needs production verification.
- TeamController.notify runs after TeamService commit. SMTP failure writes a separate audit event and returns delivery=failed; no automatic invitation rollback.
- No worker-start command exists. Run API through npm run dev; optional local Mailpit is a service, not a job worker. Test capture starts inside browser test fixtures on 4325 and sends no external mail.

## Verification and non-breaking rules

Use test:authentication/test:team for database lifecycle/rollback, test:login for real SMTP/browser flows and failure ordering; /healthz has no queue depth field and /readyz remains deliberately closed. Run browser suites sequentially. Do not persist plaintext OTPs, convert generic responses into account-existence leaks, hold a DB transaction open for SMTP, or claim durable delivery.

If a durable queue is approved, preserve generic request/attempt/replay/expiry contracts and current version/audit atomicity. Define encrypted payload/secret policy, expiry, idempotency, retries/dead-letter handling, recovery/status surfaces and independent tests before code. There is no existing legacy-vs-graph dispatch contract to preserve beyond the behavior described here.

| Code map | Responsibility |
|---|---|
| apps/api/src/auth-controller.ts | Delivery set, generic response, invalidate-on-failure |
| apps/api/src/otp-mail.ts | Transport/retry wrappers |
| apps/api/src/team-controller.ts | Post-commit notification and visible failure |
| apps/api/src/main.ts | Entry, explicit close/drain wrapper |
| e2e-auth/smtp-capture.ts | Loopback-only synthetic SMTP protocol capture |
