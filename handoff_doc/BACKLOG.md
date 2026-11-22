## Employee / initial salary checkpoint — 23 November 2026

A2 linkage UI and part of A3/A4 now have unverified source. Ordinary salary changes, full employee management, reporting and 10k/15k qualification remain pending. Full current contracts and deferred acceptance scenarios: [employee module](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). Tests/checks remain deferred at client request; changes are local/uncommitted/unpushed.

# ACME — prioritized product and engineering backlog

## Combined React/NestJS reconciliation — 22 November 2026

PR #10 linkage and PR #11 native NestJS architecture are merged to main at `8b8d7ed344d0eb1b6d05e5dd891786db0d9edc9a`. Existing PR #12 now merges this base, preserving all backend feature modules, DTO/global validation/OpenAPI, migration019 and linkage protections alongside Redux Toolkit/RTK Query and shared React controls. Both architecture commands remain in CI. React Account models the nullable employee_id response; this reconciliation adds no linkage UI or salary workflow. Lockfile contains both Swagger and Redux dependencies. Combined local lint/types/builds,36 units,QA typing,React architecture71/7550,Nest architecture/OpenAPI,serial isolated PostgreSQL suites and17 linkage SQL/HTTP checks passed. The initial FX browser assertion raced a successful second save by matching a retained toast; the helper now awaits the current POST201 and dialog closure. All3 FX cases passed unchanged application code; QA typing passed again. All22 delivered browser cases passed across the completed groups (9auth/team,4references,3country,3FX,3employees). The initial FX failure remains historical, with no relaxed timeout/assertion or application change. Final safety scan,publication and exact-head CI are in progress; earlier branch-only passes and deferred-check snapshots below are historical. No self-approval/merge/deployment; unrelated user files remain excluded.

## Earlier checkpoint records

## Publication verification — 22 November 2026

Required local publication checks passed on this React branch: lint, workspace typechecks/builds, 31 unit tests, QA typing, architecture gate (71 source files / 7,549 assertions), isolated PostgreSQL integrity/authorization/concurrency suites, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The initial reference run exposed a startup identity/OTP race; fresh post-login identity retrieval now cancels and settles the older anonymous query, with a regression test. A later cold login request stalled; the complete 22-case serial rerun passed without relaxed timeouts or authorization checks. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md. No self-approval, merge or production deployment; broader unmet/blocked requirements remain open.

Setup history: incomplete dependencies and a Windows PostgreSQL DLL lock required a clean dependency reinstall and preserved local-instance restart; Prisma was regenerated. An overlapping disposable-database migration hit shared-role contention and the database suites passed serially. No existing database was reset. Historical deferred-check snapshots below do not describe this publication checkpoint.

## Earlier checkpoint records

Current React audit remediation (22 November 2026): shared controls/tables/pagination/request states, employee dependency invalidation, typed notification feedback and accurate delivered-scope copy implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

Rules alignment in progress (22 November 2026): frontend global state now uses Redux Toolkit 2.15.0 / React Redux 9.3.1 and one RTK Query API/cache. Feature-owned endpoints replace custom remote-state effects; server identity is read through useSession from the query cache. Session Context and useResource are removed. Forms, confirmation snapshots and OTP inputs stay local; OTP credentials bypass Redux actions/cache through the same shared secure transport. AppProviders owns store/error-boundary/notification composition; the authenticated workspace is lazy loaded with Suspense. Logout/self-removal/established-session 401 clears cached protected data; 403 refreshes current identity. No API/schema/financial rule changes. **Uncommitted and unverified: no tests, lint, typechecks, builds, safety scans or browser checks were run for this increment, at the user's request.** Existing PR #12 checks cover its published head only; PR #11 backend and PR #10 linkage remain separate pending work.
## PR #10 integration — 22 November 2026

PR #10 merged to main at `4509d5fa272ea1e3a3db785affa245d6a7cbdc5d`. This PR #11 checkout merges that base and ports linkage to native `team/team.controller.ts`, `team/team.service.ts` and `team/dto/team.dto.ts`; no legacy controller factory/service is restored. Migration019 is retained unchanged. The shared member response contract includes nullable employee_id for link/list/invite/change/reinvite responses; OpenAPI derives the same projection. The isolated linkage suite now boots the real application, including global validation/security/response boundaries. Existing independent-HR, audit/revocation/version/rollback rules remain. Combined local lint/types/builds, 27 units, all17 linkage SQL/real-HTTP checks, native architecture/OpenAPI (including required employee_id projection and production docs absence), serial isolated database suites and all9 affected authentication/team Chromium cases passed. Final publication/current-head GitHub CI remain pending; earlier branch-only passes below are historical. React PR #12 remains separate until PR #11 is independently merged.

## Earlier checkpoint records

## Publication verification — 22 November 2026

Required local publication checks passed on this NestJS branch: lint, workspace typechecks/builds, 27 unit tests, QA typing, isolated PostgreSQL integrity/authorization/concurrency suites, native NestJS architecture/OpenAPI checks (including production documentation absence), HTTP health smoke, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The FX email-capture case timed out on the first run; its isolated three-case group passed on rerun without timeout or authorization changes. Environment setup failures and deferred-check snapshots below are historical. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md; no self-approval, merge or production deployment is claimed. The broader unmet/blocked requirements remain open.

## Earlier checkpoint records

Current NestJS audit remediation (22 November 2026): pool error handling, shared failure-safe transaction mechanics, typed query/response contracts, exact-origin config and honest committed invitation delivery/audit outcomes implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

NestJS rules alignment (22 November 2026), implemented but unverified: the existing capability modules/native injectable services remain. Concrete request DTO classes feed one APP_PIPE RequestValidationPipe and schema-derived OpenAPI input contracts. All delivered controllers use this path; the old per-parameter ZodValidationPipe is removed. OTP verification alone defers parsing to AuthService to preserve malformed-attempt throttling/audit. APP_FILTER HttpExceptionFilter handles application/framework/unknown failures with a safe 5xx fallback and preserves readiness's intentional 503 body. RequestContextMiddleware owns correlation/logging/no-store; CORS is limited to configured APP_ORIGIN. Development/test-only /api/docs, /api/openapi.json and /api/openapi.yaml document delivered routes using Swagger 12.1.2. No financial/schema/permission/session policy changes. No tests, lint, typechecks, builds, safety scans or browser checks ran for this increment, per user instruction. Changes remain uncommitted/unpublished; historical passes do not validate this working tree.

## Backend structure checkpoint — 22 November 2026

On chore/nestjs-backend-structure (base origin/main 1e0e65f), controller factories were replaced by top-level controllers and feature modules with explicit DI, shared config/database/auth/mail providers and lifecycle-managed OTP drain/pool shutdown. Source paths now follow capability folders under backend/src; see acme-salary-app/docs/BACKEND_STRUCTURE_AUDIT.md and TECHNICAL_DECISIONS.md (relative paths from repository root). Routes, SQL migrations, permissions and business scope are unchanged. Salary/report helpers remain internal. Pending PR #10 remains preserved separately and requires reconciliation after independent merge. This is structural delivery, not full backend or production acceptance.

**Purpose:** Give the next agent ordered, evidence-backed work and explicit exclusions.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

Reference administration is merged. Current work is the read-only employee directory; next are verified linkage,employee creation with pending initial salary,and authenticated compensation workflows. Production readiness is blocked by incomplete business scope and operational decisions. Sources: actual source, approved [development plan](../DEVELOPMENT_PLAN.md), [decisions](../acme-salary-app/docs/DECISIONS.md), QA records and discrepancy inventory in [CONTEXT.md](CONTEXT.md). [ROADMAP.md](ROADMAP.md) owns the feature matrix; this file owns priority/order.

Non-breaking rules: keep approved business decisions and synthetic-only tests; do not replace SQL integrity with Prisma push, trust actor IDs from bodies, remove failed requirement probes, alter applied migrations, silently auto-merge permissions, or deploy to a guessed target.

## A — business/security prerequisites

| ID | Item | Priority | Status | Notes / primary touchpoints |
|---|---|---|---|---|
| A1a | Department/designation administration (P4a) | High | done | Merged PR #5; migrations 013/014, real API/UI, 23 PostgreSQL and 4 reference Chromium cases |
| A1b | Country/currency administration (P4b) | Critical | done | PR #7 merged at0e0fb86; ADR-004, pinned catalogue and country-currency module |
| A1c | Immutable historical FX administration (P4c) | High | done | Implemented;23 DB /3 FX Chromium and final-head CI passed; Merged PR #8 at2a3ee19. FX_MODULE.md, migration018, service/controller/UI |
| A2 | Verify and administer employee/user linkage before public salary access | Critical | blocked | ADR-005 independent HR/reason/confirmation/session revocation approved,implementation pending; nullable mapping still permits incomplete self-subject protection; users, common/domain/policy.ts, employee workflows |

## Merged linkage checkpoint

| A2 | Verify and administer employee/user linkage before public salary access | Critical | stub/partial | Backend on feature/backend-linkage: migration019, confirmed independent HR endpoint, audit/revocation and SQL/HTTP checks. Linkage UI and salary-boundary integration pending; public salary writes remain absent |
| A3 | Employee create/directory/edit/removal with initial salary atomicity | Critical | stub/partial | P5a directory/profile locally verified19 DB /3 Chromium; PR pending. Dated assignments, validation, permissions, holds and unique keys; employee schemas/UI/API |
| A4 | Expose backdated request/independent decision workflow safely | Critical | blocked | Depends on A2/A3; SalaryApprovalService, trusted session boundary, approver/requester browser accounts |
| A5 | Ordinary salary/corrections/transfer and operational edit leases | High | stub/partial | Existing schemas are not complete workflow; clarify affected unresolved rules, record_locks, history |

## B — reporting and qualification

| ID | Item | Priority | Status | Notes / primary touchpoints |
|---|---|---|---|---|
| B1 | Historical report generator/preview/export with complete snapshot membership | High | not started | reports/report-access.ts; owner/version/30-minute invalidation; FX provenance and CSV hardening |
| B2 | Resolve aggregate rounding and wire FX staleness config | High | stub/partial | FX HTTP staleness now wired; sumConverted still hardcodes HALF_UP and future salary/report constructors need config |
| B3 | HR audit browsing and metrics/dashboard | High | not started | Immutable tables exist; no read API/UI |
| B4 | Deterministic 10k/15k synthetic data and full action/load/security matrix | High | not started | Replace missing-module blockers only with executed workflows, never synthetic pass labels |
| B5 | Define readiness, hosting/TLS/proxy/secrets/backup/restore/compliance/UAT | Critical | blocked | No deploy implementation or approved target; main.ts /readyz, DEPLOYMENT.md |
| B6 | Decide durable mail, rate-event retention and scale/operational sizing | Medium | deferred | In-memory delivery can be lost; auth_rate_events has no cleanup; ORCHESTRATION.md |

## D — top five documentation hygiene tasks

| ID | Item | Priority | Status | Notes / primary touchpoints |
|---|---|---|---|---|
| D1 | Reconcile legacy 24-hour OTP/self-edit prose with approved addenda | High | stub/partial | Precedence banners now link approved decisions; original historical paragraphs remain.  Project Analysis FRD/SDD/BRD and DECISIONS.md; do not change implementation to old text |
| D2 | Reconcile latest PR #4/#5 merge labels | Medium | done | Latest roadmap/progress/ledger and this pack reflect merged P4a; earlier checkpoints remain historical |
| D3 | Document/fix setup template and launcher/Compose role-port mismatch | High | stub/partial | .env.example missing owner URL; current README explains actual safe path; code change needs a separate approved task |
| D4 | Maintain route/env/schema coverage checks with future feature PRs | Medium | not started | This pack's VALIDATION_REPORT baseline; optionally adopt an automated docs gate after approval |
| D5 | Keep QA history scoped by run and distinguish deployment readiness | Medium | stub/partial | QA_EXECUTION_REPORT.md/TEST_CASES.md; 12/14, 2/12, 3/11 and scoped green suites are not interchangeable |

## Explicit exclusions

| Item | Status | Rationale |
|---|---|---|
| Full payroll/deductions/payslips | cancelled | Outside approved salary-management baseline, not silently added |
| Permanent purge/destructive history rewrites | cancelled | Conflicts with current append-only/hold/history contract |
| Multilevel/general approval expansion | deferred | Only backdated salary minimal independent approval approved |
| Production cutover/migration/deployment | blocked | Requires separately approved infrastructure/business acceptance |
| LLM/document generation/transcription/storage providers | deferred | No runtime integration or current product contract |
| Demo video/checklist | deferred | Client moved it after development/testing |

## Recommended execution order

1. Finish A1b country/currency and A1c FX contracts using ADR-003; address D1/D3 onboarding discrepancies.
2. Complete/test those reference increments, then A2/A3 employee/user linkage and employee flow.
3. Deliver A4 and A5 with real independent accounts and immutable history verification.
4. Build B1/B2, then B3; validate report reconciliation and CSV/security details.
5. Complete B4/B5 and any approved B6 before operational release.

## When an item ships

Update source requirements/technical decision addenda when semantics change; CONTEXT routes/env, DATA_MODEL, WORKFLOW_RULES, RBAC, README/SMOKE_TESTS, ROADMAP status, this backlog, existing traceability/progress/QA docs and Git ledger in the same PR. Add actual evidence and current-head MCP review/check records. Keep LLM/ORCHESTRATION/SMTP/DEPLOYMENT docs aligned if their boundaries change. A handoff-only task does not authorize application changes. Commit/push only when explicitly authorized by the client, as for this publication.

## Changelog

| Date | Change | Evidence |
|---|---|---|
| 22 November 2026 | Initial handoff backlog derived from checked-out source; no implementation/priority promises inferred beyond approved plan | HEAD 4925ef2, schema/config/controllers/tests and approved decision files |
| 22 November 2026 | P4a merged; inventory refreshed against 8ae97b3; client authorized publishing the 14-file handoff pack | PR #5 merge, ADR-003, controllers/migrations/CI |
