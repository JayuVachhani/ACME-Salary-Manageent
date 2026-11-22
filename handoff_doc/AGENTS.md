# ACME handoff â€” start here

## Combined React/NestJS reconciliation — 22 November 2026

PR #10 linkage and PR #11 native NestJS architecture are merged to main at `8b8d7ed344d0eb1b6d05e5dd891786db0d9edc9a`. Existing PR #12 now merges this base, preserving all backend feature modules, DTO/global validation/OpenAPI, migration019 and linkage protections alongside Redux Toolkit/RTK Query and shared React controls. Both architecture commands remain in CI. React Account models the nullable employee_id response; this reconciliation adds no linkage UI or salary workflow. Lockfile contains both Swagger and Redux dependencies. Combined local lint/types/builds,36 units,QA typing,React architecture71/7550,Nest architecture/OpenAPI,serial isolated PostgreSQL suites and17 linkage SQL/HTTP checks passed. The initial FX browser assertion raced a successful second save by matching a retained toast; the helper now awaits the current POST201 and dialog closure. All3 FX cases passed unchanged application code; QA typing passed again. All22 delivered browser cases passed across the completed groups (9auth/team,4references,3country,3FX,3employees). The initial FX failure remains historical, with no relaxed timeout/assertion or application change. Final safety scan,publication and exact-head CI are in progress; earlier branch-only passes and deferred-check snapshots below are historical. No self-approval/merge/deployment; unrelated user files remain excluded.

## Earlier checkpoint records

## PR #10 integration — 22 November 2026

PR #10 merged to main at `4509d5fa272ea1e3a3db785affa245d6a7cbdc5d`. This PR #11 checkout merges that base and ports linkage to native `team/team.controller.ts`, `team/team.service.ts` and `team/dto/team.dto.ts`; no legacy controller factory/service is restored. Migration019 is retained unchanged. The shared member response contract includes nullable employee_id for link/list/invite/change/reinvite responses; OpenAPI derives the same projection. The isolated linkage suite now boots the real application, including global validation/security/response boundaries. Existing independent-HR, audit/revocation/version/rollback rules remain. Combined local lint/types/builds, 27 units, all17 linkage SQL/real-HTTP checks, native architecture/OpenAPI (including required employee_id projection and production docs absence), serial isolated database suites and all9 affected authentication/team Chromium cases passed. Final publication/current-head GitHub CI remain pending; earlier branch-only passes below are historical. React PR #12 remains separate until PR #11 is independently merged.

## Earlier checkpoint records

## Publication verification — 22 November 2026

Required local publication checks passed on this NestJS branch: lint, workspace typechecks/builds, 27 unit tests, QA typing, isolated PostgreSQL integrity/authorization/concurrency suites, native NestJS architecture/OpenAPI checks (including production documentation absence), HTTP health smoke, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The FX email-capture case timed out on the first run; its isolated three-case group passed on rerun without timeout or authorization changes. Environment setup failures and deferred-check snapshots below are historical. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md; no self-approval, merge or production deployment is claimed. The broader unmet/blocked requirements remain open.

## Earlier checkpoint records

Current NestJS audit remediation (22 November 2026): pool error handling, shared failure-safe transaction mechanics, typed query/response contracts, exact-origin config and honest committed invitation delivery/audit outcomes implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

NestJS rules alignment (22 November 2026), implemented but unverified: the existing capability modules/native injectable services remain. Concrete request DTO classes feed one APP_PIPE RequestValidationPipe and schema-derived OpenAPI input contracts. All delivered controllers use this path; the old per-parameter ZodValidationPipe is removed. OTP verification alone defers parsing to AuthService to preserve malformed-attempt throttling/audit. APP_FILTER HttpExceptionFilter handles application/framework/unknown failures with a safe 5xx fallback and preserves readiness's intentional 503 body. RequestContextMiddleware owns correlation/logging/no-store; CORS is limited to configured APP_ORIGIN. Development/test-only /api/docs, /api/openapi.json and /api/openapi.yaml document delivered routes using Swagger 12.1.2. No financial/schema/permission/session policy changes. No tests, lint, typechecks, builds, safety scans or browser checks ran for this increment, per user instruction. Changes remain uncommitted/unpublished; historical passes do not validate this working tree.

Current backend delta (22 November 2026): PR #9 merged at `1e0e65f`; `feature/backend-linkage` adds migration019 and `PATCH /api/v1/team/:id/employee-link`. Independent HR, reason, confirmation, version checks, revocation and audit are implemented at the backend; no linkage UI or public salary writes. Read [TEAM_MODULE.md](../acme-salary-app/docs/TEAM_MODULE.md). Earlier discovery counts are historical: add one method/path, two SQL functions and two triggers, no tables/fields/env. Remaining approved backend work is pending; unresolved business rules stay blocked per client direction.

## Publication verification — 22 November 2026

Required local publication checks passed on this React branch: lint, workspace typechecks/builds, 31 unit tests, QA typing, architecture gate (71 source files / 7,549 assertions), isolated PostgreSQL integrity/authorization/concurrency suites, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The initial reference run exposed a startup identity/OTP race; fresh post-login identity retrieval now cancels and settles the older anonymous query, with a regression test. A later cold login request stalled; the complete 22-case serial rerun passed without relaxed timeouts or authorization checks. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md. No self-approval, merge or production deployment; broader unmet/blocked requirements remain open.

Setup history: incomplete dependencies and a Windows PostgreSQL DLL lock required a clean dependency reinstall and preserved local-instance restart; Prisma was regenerated. An overlapping disposable-database migration hit shared-role contention and the database suites passed serially. No existing database was reset. Historical deferred-check snapshots below do not describe this publication checkpoint.

## Earlier checkpoint records

Current React audit remediation (22 November 2026): shared controls/tables/pagination/request states, employee dependency invalidation, typed notification feedback and accurate delivered-scope copy implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

Separate backend working copy: `.worktrees/nestjs-rules` on existing chore/nestjs-backend-structure contains the unverified NestJS standards follow-up (global DTO pipe, OpenAPI, middleware, safe error filter, explicit CORS and invitation workflow service). See its acme-salary-app/docs/BACKEND_STRUCTURE_AUDIT.md and handoff entry point. These edits are not merged into this React checkout and have no new verification/publication result; preserve both working trees.

Rules alignment in progress (22 November 2026): frontend global state now uses Redux Toolkit 2.15.0 / React Redux 9.3.1 and one RTK Query API/cache. Feature-owned endpoints replace custom remote-state effects; server identity is read through useSession from the query cache. Session Context and useResource are removed. Forms, confirmation snapshots and OTP inputs stay local; OTP credentials bypass Redux actions/cache through the same shared secure transport. AppProviders owns store/error-boundary/notification composition; the authenticated workspace is lazy loaded with Suspense. Logout/self-removal/established-session 401 clears cached protected data; 403 refreshes current identity. No API/schema/financial rule changes. **Uncommitted and unverified: no tests, lint, typechecks, builds, safety scans or browser checks were run for this increment, at the user's request.** Existing PR #12 checks cover its published head only; PR #11 backend and PR #10 linkage remain separate pending work.

**Purpose:** Onboard developers and coding agents without inventing functionality.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

This is the single entry point for the root handoff_doc/ pack. ACME Salary Management is a TypeScript modular monolith with working passwordless login, team, department/designation and country/currency administration (PR #7 merged), plus locally verified P4c FX administration and substantial internal database/compensation foundations. It is not a production-ready salary application. Read [ROADMAP.md](ROADMAP.md) before promising features. This pack describes the checked-out code, not every feature described in the BRD.

## Read order

| Step | File | What you learn | When to stop |
|---|---|---|---|
| 1 | [AGENTS.md](AGENTS.md) | Rules, scope and source map | Before any edit |
| 2 | [CONTEXT.md](CONTEXT.md) | Architecture, exact routes/env, discrepancies | Stop if requested endpoint is planned only |
| 3 | [README.md](README.md) | Reproducible local setup | Stop on invalid env; never print credentials |
| 4 | [DATA_MODEL.md](DATA_MODEL.md) | Every table, field, FK, index and SQL protections | Before schema/data work |
| 5 | [WORKFLOW_RULES.md](WORKFLOW_RULES.md) + [RBAC.md](RBAC.md) | Transitions and authorization boundaries | Stop before guessing a financial/approval rule |
| 6 | [SMTP_INTEGRATION.md](SMTP_INTEGRATION.md) + [ORCHESTRATION.md](ORCHESTRATION.md) + [LLM_CONTRACTS.md](LLM_CONTRACTS.md) | Live SMTP, ephemeral delivery, absent AI/job frameworks | Before introducing integrations |
| 7 | [DEPLOYMENT.md](DEPLOYMENT.md) | CI versus unimplemented deployment | Do not deploy from this pack alone |
| 8 | [ROADMAP.md](ROADMAP.md) + [BACKLOG.md](BACKLOG.md) | Implemented scope versus ordered work | Resolve affected blockers first |
| 9 | [SMOKE_TESTS.md](SMOKE_TESTS.md) + [VALIDATION_REPORT.md](VALIDATION_REPORT.md) | Execution gates and documentation checks | No unexecuted test may be reported as passed |

## Agent rules

### General

- Root [AGENTS.md](../AGENTS.md), latest user decisions and approved [DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md) remain authoritative. This local entry guide does not authorize changing protected branches or business scope.
- Read code before edits; flag wrong legacy docs rather than changing working code to fit them. The client-provided handoff brief governs the documentation structure. On 22 November 2026 the client explicitly requested updating and pushing this pack. This authorizes documentation delivery, not application changes or production deployment.
- Future feature work follows root Git policy: fetch, branch from origin/main using feature/, bugfix/ or chore/, test, scan staged files, commit/push logically, use GitHub MCP exclusively for PR review/lifecycle. Never self-approve or bypass independent review/checks.
- Preserve user work and synthetic-only fixtures. Never read/copy secrets into docs, commit .env/.local/qa-artifacts, reset databases, force-push or delete branches.
- Use code-backed status keys: done Â· stub/partial Â· not started Â· blocked Â· cancelled Â· deferred. Component-level done never means system-wide readiness.

### Backend

- NestJS 12 ESM/Node16 module resolution, TypeScript 6 strict checks, Zod 4 strict DTO classes/global APP_PIPE, Swagger 12.1.2 local/test reference, pg parameterized SQL. UUIDs are strings; money is decimal text/Decimal, not JavaScript floating-point arithmetic.
- There is no Passport/JWT/session AuthGuard/@Roles implementation. MutationRequestGuard enforces Origin/CSRF transport preconditions, not session authorization. Feature modules register controllers and native injectable class providers; DatabaseModule owns the shared pool and AuthModule exports one AuthenticationService. AuthenticationService.authenticateWithin must run in the caller's transaction for mutations; never accept actor IDs from HTTP bodies.
- Follow root implementation-first rules: do not inspect test cases or run verification until requested; do not commit/push unverified edits. Global DTO schemas remain the single validation authority; Malformed OTP verification must reach attempt accounting and rejection audit before HTTP rejection.
- Match current identity/session lock order and team advisory lock. Always commit/rollback/release; failed OTP attempts must commit. Notifications run after database commit.
- SQL migrations are forward-only/checksummed. Prisma is an introspected client/schema, not a replacement for triggers/checks. Never use prisma db push.
- Internal SalaryApprovalService/readSalarySnapshot are not HTTP endpoints. Employee linkage is incomplete; do not expose internal actor-parameter services directly.

### Frontend

- React workflow hooks, typed feature APIs and shared same-origin transport with ordinary CSS. Redux Toolkit/RTK Query own global/server state; local forms remain local. No router or auth localStorage. Follow root implementation-first/no-verification instructions until the user authorizes checks. App owns feature composition; shared code must not import features, and features must not import one another.
- Relative same-origin requests; Vite proxy is development-only. Do not invent VITE_API_URL. Use APP_ORIGIN on the server and QA_API_PORT only for the dev proxy.
- acme_session is HttpOnly; acme_csrf is a readable hint/header source, not proof of authentication. Current /me and backend guards decide access.
- Native modal confirmation must show actual target/access details; preserve optimistic versions. Do not auto-merge stale forms or remove checks to make a test pass. Refresh and reopen edits after conflict.
- Keep loading/error/empty/success states, timeouts, keyboard behavior and mobile table scrolling. Use system fonts, escaped React text and no sensitive console logs.

## Stack quick reference

| Layer | Pinned implementation |
|---|---|
| Runtime | Node >=24.20.0; CI exactly 24.20.0; npm workspaces |
| API | NestJS 12.6.0, TypeScript 6.0.3, Zod 4.6.7, pg 8.23.1 |
| Data | PostgreSQL 17; local binary 17.12; Prisma/client/adapter 7.10.1 |
| Web | React/ReactDOM 19.3.1, Redux Toolkit 2.15.0, React Redux 9.3.1, Vite 8.3.8 (Redux increment unverified) |
| Domain/mail | decimal.js 10.6.0, Nodemailer 10.6.1, Helmet 8.3.0 |
| QA | Vitest 5.1.1, Playwright 1.65.1, axe 4.14.0, ESLint 10.15.0 |

## Task-to-code map

API filenames below are under acme-salary-app/apps/api/src; migration references are under acme-salary-app/database/migrations. Paths beginning apps/, scripts/, e2e/ or e2e-auth/ are relative to acme-salary-app/. The web reference component is apps/web/src/features/organization-references/organization-references.tsx.

| Task/symptom | Primary locations |
|---|---|
| API entry/health/headers | apps/api/src/main.ts, config.ts |
| OTP/cookies/origin | auth-controller.ts, authentication.ts, auth-secrets.ts, auth-rate.ts |
| Department/designation admin | organization-references-controller.ts, organization-references.ts, web features/organization-references/organization-references.tsx, migrations 013/014 |
| Email delivery | otp-mail.ts, compose.yaml, e2e-auth/smtp-capture.ts |
| Team access/conflicts | team-controller.ts, team.ts, migrations 011/012 |
| Salary/FX | salary-approval.ts, money.ts, fx-rates-controller.ts, fx-rates.ts, migrations003..006/018, web features/fx-rates/fx-rates.tsx |
| Snapshot/holds | report-access.ts, migrations/002_country_employee_fx.sql |
| UI state/confirmation | apps/web/src/app/workspace.tsx, features/auth/use-login.ts, features/team/use-team.ts, shared/ui/confirmation-dialog.tsx, app/styles.css |
| API entry/health/headers | apps/api/src/main.ts, config/config.ts |
| OTP/cookies/origin | auth/auth.controller.ts, auth/authentication.service.ts, auth/auth-secrets.ts, auth/auth-rate.ts |
| Department/designation admin | organization-references/organization-references.controller.ts, organization-references/organization-references.service.ts, web organization-references.tsx, migrations 013/014 |
| Email delivery | mail/otp-mail.ts, compose.yaml, e2e-auth/smtp-capture.ts |
| Team access/conflicts | team/team.controller.ts, team/team.service.ts, migrations 011/012 |
| Salary/FX | salary/salary-approval.service.ts, common/domain/money.ts, fx-rates/fx-rates.controller.ts, fx-rates/fx-rates.service.ts, migrations003..006/018, web fx-rates.tsx |
| Snapshot/holds | reports/report-access.ts, migrations/002_country_employee_fx.sql |
| UI state/confirmation | apps/web/src/main.tsx, login.tsx, team.tsx, styles.css |
| Local DB/bootstrap | scripts/local-postgres.mjs, migrate.mjs, bootstrap-manager.mjs |
| QA/CI | e2e/, e2e-auth/, scripts/test-*.mjs, ../.github/workflows/pr-validation.yml |

## Adding features

Documentation is an ongoing acceptance requirement for every significant project change, including removals. Before completing a task, compare the changed behavior with existing canonical documents and update affected contracts, setup, schema, permissions, transitions, architecture, scope/status and QA evidence in the same delivery increment. Prefer updating existing files over creating duplicates. Keep root planning/decisions, application module/traceability/progress/QA records and this pack consistent; retain history only when clearly labelled historical. Verify affected inventories, links and commands, and explicitly report remaining discrepancies. Follow the current task's commit instructions; an uncommitted documentation request does not authorize staging the uploaded prompt or unrelated user work.

1. Confirm source requirements/decision precedence and update BACKLOG/ROADMAP scope.
2. New domain: schema migration, transactional service, strict HTTP contract, current-session permission checks, functional UI, negative/parallel tests and smoke steps; update CONTEXT, DATA_MODEL, RBAC, WORKFLOW_RULES.
3. New role/permission: update common/domain/policy.ts, Zod permission enum, SQL permission checks/guards, UI, session/snapshot invalidation and multi-account tests; never infer roles from client flags.
4. New status: migrate enums/checks and transition guards; update workflow diagrams, filters, ledger/report selection and tests.
5. New document/provider/upload type: none exists currently; obtain scope, define storage/retention/validation/contracts before adding routes or packages; update integration/deployment docs and smoke tests.
6. Update all affected handoff files in the same feature PR. Maintain the existing operational/QA docs too; do not erase historical failures.

## Pack files to keep synchronized

- [AGENTS.md](AGENTS.md)
- [CONTEXT.md](CONTEXT.md)
- [README.md](README.md)
- [DATA_MODEL.md](DATA_MODEL.md)
- [WORKFLOW_RULES.md](WORKFLOW_RULES.md)
- [RBAC.md](RBAC.md)
- [LLM_CONTRACTS.md](LLM_CONTRACTS.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [ROADMAP.md](ROADMAP.md)
- [BACKLOG.md](BACKLOG.md)
- [ORCHESTRATION.md](ORCHESTRATION.md)
- [SMOKE_TESTS.md](SMOKE_TESTS.md)
- [SMTP_INTEGRATION.md](SMTP_INTEGRATION.md)
- [VALIDATION_REPORT.md](VALIDATION_REPORT.md)

## Discovery snapshot

30 concrete method/path API operations (27 controller patterns, with two organization-reference kinds); one React root screen; 23 Prisma tables / 178 scalar fields; 18 ordered SQL migrations; 28 named SQL functions; 2 SQL views. No runtime LLM, upload/storage API, transcription, cron, queue worker or production deployment workflow. PR #8 is merged at the source SHA above. The employee feature branch starts from that origin/main. Public employee/salary/reporting workflows remain incomplete. See [VALIDATION_REPORT.md](VALIDATION_REPORT.md) for snapshot checks.

P5a adds read-only employee directory/profile (employees-controller.ts/employees.ts/web features/employees/employees.tsx); no salary payload/mutation. ADR-005 linkage and initial salary approval are approved but not implemented by this slice. Read module contract and latest backlog before salary integration.
P5a adds read-only employee directory/profile (employees/employees.controller.ts/employees.ts/web employees.tsx); no salary payload/mutation. ADR-005 linkage and initial salary approval are approved but not implemented by this slice. Read module contract and latest backlog before salary integration.
