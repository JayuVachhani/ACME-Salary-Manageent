## Demo data and navigation — 23 November 2026

Executed the explicit synthetic seed in local acme_app: 10,000 DEMO employees, 9,990 independently approved initial salaries, 8 pending and 2 rejected requests, using existing active INR. Demo HR accounts are independently linked; existing accounts/data remain preserved. Script owns a transaction/advisory lock and completed-seed audit marker; no reset or overwrite. Sidebar/Home are grouped by People, Salary and Settings with existing permission filtering. Accounts, sample codes, fictional policy labels and repeat command are in [the current runbook](../README.md). Seeding is not a test/load pass; verification, commit and push remain deferred. No full salary-product completion claimed.

## Employee / initial salary checkpoint — 23 November 2026

Local installed acme_app has migrations 020/021 applied (21 total) and Prisma generated. New workflows are unverified; no production deployment or test execution. Full current contracts and deferred acceptance scenarios: [employee module](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). Tests/checks remain deferred at client request; changes are local/uncommitted/unpushed.

# ACME — deployment, GitHub CI and infrastructure

## Independent package publication checks — 23 November 2026

The commit/push request authorizes verification. Independently installed frontend passed format,React lint,strict types,9 units,Vite production build and architecture71/7550. Backend passed format,lint,types,27 units,Prisma generation,official Nest CLI build,native architecture/OpenAPI and production-doc isolation. QA typing/formatting/proxy checks and all4 Git hook rejection/acceptance checks passed; safety regression passed. Serial isolated PostgreSQL integrity/auth/team/reference/country/FX/employee/approval suites and17 linkage SQL/HTTP checks passed. All12 foundation Chromium cases passed. Source comparison confirms all19 migration files and all75 frontend source files unchanged apart from relocation; only config/config.module.ts changes among81 backend source files. All22 delivered Chromium cases passed in the complete serial run without retries. Native Nest CLI watch and Vite development startup/proxy checks passed on isolated ports; those test-owned processes were stopped. First309-file indexed scan and whitespace checks passed. Final hook-gated commit/push and exact-head GitHub CI remain pending; no pending check is a pass. Historical report generation now writes only ignored QA artifacts rather than overwriting canonical documents. Earlier implementation-only records below are historical; no production completion/approval/merge claimed.


## Independent application ownership — 22 November 2026

Current implementation on `chore/independent-app-packages`: root frontend/ and backend/ are independent npm projects with separate lockfiles,strict TypeScript,ESLint,Prettier,tests,environment templates and native scripts. Frontend uses React19/Vite8,app/node TS projects and React hooks/refresh lint rules. Backend uses Nest12 CLI/nest-cli.json/tsconfig.build.json and official @nestjs/config with the existing safe Zod validation. Backend owns PostgreSQL/Prisma/migrations/bootstrap; no SQL or salary/permission policy is changed. QA is an independent qa/ package. tools/quality owns Git orchestration only; root has no package.json or framework configuration. Husky delegates to package-native checks. CI installs/checks each package independently.

Old acme-salary-app/ now contains canonical documentation and ignored legacy local artifacts only. The previous local PostgreSQL cluster remains untouched; backend local-start reuses it when present. Existing server .env copied only into ignored backend/.env. Frontend receives no secrets. See [manual run steps](../README.md) from acme-salary-app,or root README.md from the repository. No test/lint/type/build/browser/safety verification,staging,commit or push performed for this increment under the implementation-first rule. Package installation/configuration are not test passes. Earlier workspace paths/check results below are historical; source links have been mapped to the current owners.

## Earlier checkpoint records

Unverified operational repair: background pg errors are handled via redacted SQLSTATE telemetry rather than an unhandled pool event. Failed rollback destroys the connection without hiding the original operation/commit error. APP_ORIGIN must be the canonical HTTP(S) URL.origin; invalid values fail startup. No infrastructure rollout, operational audit retention policy, new retry mechanism or production readiness claim is introduced.

Current unverified HTTP setup: NODE_ENV=production omits `/api/docs`, `/api/openapi.json` and `/api/openapi.yaml`; development/test reference UI disables submissions and persisted authorization. CORS is limited to configured APP_ORIGIN. No new deployment, environment variable or production approval is introduced. Required checks remain deferred at user request.

**Purpose:** Separate reproducible development/test operations from unimplemented production deployment.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

Production deployment is blocked. The repository has a Windows GitHub Actions PR test workflow and local development services, not CD or an application container build. No hosting target, deployment wizard, vault, TLS termination, production backup/restore, monitoring/SLO or cutover is implemented. A complete handoff cannot turn these unknowns into a working deploy flow. See [README.md](README.md), [BACKLOG.md](BACKLOG.md) and [SMOKE_TESTS.md](SMOKE_TESTS.md).

## Actual infrastructure and prerequisites

- Node/npm workspace; API build emits backend/dist; Vite emits frontend/dist. API binds 127.0.0.1 and built frontend requests relative same-origin paths.
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
# Installed local PostgreSQL checkpoint — 23 November 2026

This machine's active development configuration is installed PostgreSQL `127.0.0.1:5432/acme_app`, managed in the existing ACME Salary Management pgAdmin connection. All 19 migrations applied; 23 public tables are visible. Restricted owner/runtime roles have no superuser, Create roles or Create databases privileges. One-time role configuration in migration 001 used the existing administrator session. No data reset or production deployment occurred. Preserve the older embedded cluster and private environment backup.

See the root README's installed PostgreSQL section for the ignored machine-local restart helper, standalone Mailpit and synthetic HR sign-in. Frontend 5173, backend 3001 and Mailpit 8025/1025 are running locally. HTTP proxy/health, OTP email delivery/verification and authenticated identity passed; this is not a complete Chromium acceptance run. Existing readiness `schema_not_verified` and unfinished business workflows remain unchanged. Migration checksum compatibility permits LF/CRLF conversion only and leaves recorded hashes unchanged.
