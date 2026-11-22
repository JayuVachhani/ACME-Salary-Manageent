# ACME — background work and optional frameworks

**Purpose:** Document the actual asynchronous mail boundary and absent job infrastructure.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

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
- ApplicationLifecycle.onApplicationShutdown drains MailModule OtpDeliveries after HTTP disposal, then calls pool.end. A process crash is not recoverable by a queue; signal/shutdown behavior needs production verification.
- TeamController.notify runs after TeamService commit. SMTP failure writes a separate audit event and returns delivery=failed; no automatic invitation rollback.
- No worker-start command exists. Run API through npm run dev; optional local Mailpit is a service, not a job worker. Test capture starts inside browser test fixtures on 4325 and sends no external mail.

## Verification and non-breaking rules

Use test:authentication/test:team for database lifecycle/rollback, test:login for real SMTP/browser flows and failure ordering; /healthz has no queue depth field and /readyz remains deliberately closed. Run browser suites sequentially. Do not persist plaintext OTPs, convert generic responses into account-existence leaks, hold a DB transaction open for SMTP, or claim durable delivery.

If a durable queue is approved, preserve generic request/attempt/replay/expiry contracts and current version/audit atomicity. Define encrypted payload/secret policy, expiry, idempotency, retries/dead-letter handling, recovery/status surfaces and independent tests before code. There is no existing legacy-vs-graph dispatch contract to preserve beyond the behavior described here.

| Code map | Responsibility |
|---|---|
| backend/src/auth/auth.service.ts and mail/otp-deliveries.service.ts | Tracked delivery, generic response, invalidate-on-failure |
| backend/src/mail/otp-mail.ts | Transport/retry wrappers |
| backend/src/team/team-notifications.service.ts | Post-commit notification and visible failure |
| backend/src/app-lifecycle.service.ts | Ordered post-HTTP OTP drain and pool shutdown |
| e2e-auth/smtp-capture.ts | Loopback-only synthetic SMTP protocol capture |

Browser harness update: existing QA_RUN selects distinct web/API ports: login 4427/4428, references 4527/4528, country-currency 4627/4628; sequential capture SMTP remains 4325. The runner logs only group/stage/process status diagnostics. GitHub run 45006454596 failed during third-group startup before country cases executed; exact cause unproven. PR #7 final head4938a138 passed run45007418682/job137162007364 and was subsequently merged at0e0fb86; failed startup evidence remains historical. P4c adds the isolated FX group on4727/4728; no retries or relaxed assertions.

FX increment adds test:fx to CI and a fourth isolated test:login group (QA_RUN=fx, web/API4727/4728, SMTP4325 sequential). Artifacts qa-artifacts/fx are retained. No external FX provider, background job, new secret/config variable or deployment behavior is introduced.

## P5a directory checkpoint

Read-only employee directory/profile integrates GET employees,employees/filters,employees/:id with fresh HR/read checks; no salary payload or mutation. Current assignment excludes future dates,removed employees excluded,literal wildcard search and fixed sorting/paging. No migration/schema/config/external service added. test:employees plus fifth isolated test:login Chromium group (4827/4828,SMTP4325 sequential),artifacts employees. Local19 directory DB /3 directory Chromium and34 scoped browser checks passed; exact-head CI/review pending; see QA_EXECUTION_REPORT.md. [Employee contract](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). ADR-005 linkage and initial salary approval are approved future integration requirements; do not treat this directory as employee creation/approval completion.

Browser runtime update: Playwright now serves built web assets through scripts/qa-web-server.mjs (loopback Node HTTP,strict port,existing QA_API_PORT proxy); npm run dev remains development only. Build before qa:e2e; test:login builds itself. Repeated native dev/preview exits3221226505 are retained failures,root cause unproven. See [browser test runtime](../acme-salary-app/docs/BROWSER_TEST_RUNTIME.md); no deployment or retry/assertion change.

CI also runs `npm.cmd run test:qa-web` to verify real built-static path/MIME/HEAD protections and API proxy method/query/Origin/body/cookies/health/error behavior. No new config or dependency.
