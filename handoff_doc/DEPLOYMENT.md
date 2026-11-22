# ACME — deployment, GitHub CI and infrastructure

**Purpose:** Separate reproducible development/test operations from unimplemented production deployment.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

Production deployment is blocked. The repository has a Windows GitHub Actions PR test workflow and local development services, not CD or an application container build. No hosting target, deployment wizard, vault, TLS termination, production backup/restore, monitoring/SLO or cutover is implemented. A complete handoff cannot turn these unknowns into a working deploy flow. See [README.md](README.md), [BACKLOG.md](BACKLOG.md) and [SMOKE_TESTS.md](SMOKE_TESTS.md).

## Actual infrastructure and prerequisites

- Node/npm workspace; API build emits apps/api/dist; Vite emits apps/web/dist. API binds 127.0.0.1 and built frontend requests relative same-origin paths.
- Development Compose contains postgres:17 and Mailpit only; no application service, Dockerfile or .dockerignore is present. Compose dev defaults must not be reused as production secret policy.
- Project-local PostgreSQL launcher is Windows-only and uses a privileged initdb owner plus restricted runtime role; it is not a production DB operator.
- Allowed public release status: none currently. /readyz is intentionally always 503, domain workflows and UAT are incomplete, and deployment authorization/infrastructure remain separate scope.

## Existing-repository PR flow — implemented

1. Fetch the ACME remote and branch from origin/main under feature/, bugfix/ or chore/. Preserve existing work.
2. Make/test logically scoped changes and documentation, run staged safety scan, commit and push without secrets or force updates.
3. Use GitHub MCP to create PR to main, inspect actual head/diff and check workflow jobs/logs. Fix/retest on the same branch.
4. Foundation integrity runs on pull_request opened/synchronize/reopened/ready_for_review, with read-only contents permission and pinned checkout/setup-node/upload-artifact actions. Checkout is exact head with persist-credentials false.
5. npm ci skips lifecycle scripts; local DB starts; database/unit/build/auth/team/reference/country-currency gates execute, then typing/Git safety, Chromium install, foundation and isolated SMTP/auth/team and reference browser groups (separate disposable databases).
6. Diagnostics under qa-artifacts/ci, qa-artifacts/login and qa-artifacts/references and qa-artifacts/country-currency are uploaded for seven days even on failure; DB stop runs when initialization succeeded. Workflow concurrency cancels superseded runs.
7. Merge only after required exact-head checks and an authorized independent review satisfy repository policies. Adding a workflow does not itself configure branch protection. Never self-approve or bypass review restrictions.

The remote exists; the earlier one-time empty-main bootstrap exception is already used. A new hosting/repository wizard does not exist. Fresh developer checkout follows README, not a second bootstrap to protected main.

## Prospective hosting flow — blocked, not executable CD

Before approving a deploy plan, choose target/runtime/service manager, static hosting and same-origin proxy, trusted proxy/real-IP policy, TLS/SMTP provider, least-privilege migration/runtime roles, secret injection, migration sequencing and verified rollback/restore. Build/test artifacts could then be promoted by an approved pipeline; no such script or workflow currently exists. Do not invent docker build or deploy npm commands.

| Requested wizard/UI field | Existing equivalent / boundary |
|---|---|
| Repository/deployment mode | No UI or API field; developer Git workflow only |
| API origin | APP_ORIGIN runtime setting; exact browser Origin required |
| Public web/API URL | No production URL provisioned; Vite proxy is dev-only |
| Database secret | DATABASE_URL runtime, MIGRATION_DATABASE_URL owner; production injection mechanism unspecified |
| SMTP secret/options | SMTP_* settings; production requires TLS, no certificate bypass |
| Vault/ZIP/storage/upload | No fields, endpoints, vault integration or ZIP/upload limits exist |
| Deploy status/error/resume | No persisted deploy object or resume flow; GitHub job status/artifacts only |

## Operations/recovery checklist before any release

- Complete employee/reference/salary/report workflows, verified identity linkage and full permission matrix; obtain acceptance and current green tests.
- Define real readiness (including migration compatibility) instead of removing the deliberate 503 without a contract.
- Provide HTTPS, Secure cookies, exact APP_ORIGIN, CSRF, approved proxy/IP handling and production SMTP delivery tests.
- Store secrets outside Git and artifacts; provision non-superuser runtime role and controlled migrations; restrict database connectivity.
- Validate backup/restore with realistic data, RPO/RTO, retention/holds/privacy rules, monitoring/redacted logs, resource limits and audited operational access.
- Measure 10k/15k synthetic load and p95 targets; test DB lock/order failures, migration/recovery and multi-instance rate limits.
- Treat SQL migrations as forward-only; no scripted down/rewind exists. On checksum drift restore the original file and add a new migration. On failed deploy/test use job logs/artifacts, not an invented application resume API.
- For SMTP, ephemeral OTP work can be lost on crash; user resends. Team invitation remains committed when mail fails. Decide whether durable delivery is a release requirement; it is not implemented.

The client authorized committing/pushing this documentation pack on 22 November 2026. Application tests were not rerun just to author this pack; historical passing CI is evidence for the referenced source snapshot, not production acceptance.

Browser harness update: existing QA_RUN selects distinct web/API ports: login 4427/4428, references 4527/4528, country-currency 4627/4628; sequential capture SMTP remains 4325. The runner logs only group/stage/process status diagnostics. GitHub run 45006454596 failed during third-group startup before country cases executed; exact cause unproven. PR #7 final head4938a138 passed run45007418682/job137162007364 and was subsequently merged at0e0fb86; failed startup evidence remains historical. P4c adds the isolated FX group on4727/4728; no retries or relaxed assertions.

FX increment adds test:fx to CI and a fourth isolated test:login group (QA_RUN=fx, web/API4727/4728, SMTP4325 sequential). Artifacts qa-artifacts/fx are retained. No external FX provider, background job, new secret/config variable or deployment behavior is introduced.

## P5a directory checkpoint

Read-only employee directory/profile integrates GET employees,employees/filters,employees/:id with fresh HR/read checks; no salary payload or mutation. Current assignment excludes future dates,removed employees excluded,literal wildcard search and fixed sorting/paging. No migration/schema/config/external service added. test:employees plus fifth isolated test:login Chromium group (4827/4828,SMTP4325 sequential),artifacts employees. Local19 directory DB /3 directory Chromium and34 scoped browser checks passed; exact-head CI/review pending; see QA_EXECUTION_REPORT.md. [Employee contract](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). ADR-005 linkage and initial salary approval are approved future integration requirements; do not treat this directory as employee creation/approval completion.

Browser runtime update: Playwright now serves built web assets through scripts/qa-web-server.mjs (loopback Node HTTP,strict port,existing QA_API_PORT proxy); npm run dev remains development only. Build before qa:e2e; test:login builds itself. Repeated native dev/preview exits3221226505 are retained failures,root cause unproven. See [browser test runtime](../acme-salary-app/docs/BROWSER_TEST_RUNTIME.md); no deployment or retry/assertion change.

CI also runs `npm.cmd run test:qa-web` to verify real built-static path/MIME/HEAD protections and API proxy method/query/Origin/body/cookies/health/error behavior. No new config or dependency.
