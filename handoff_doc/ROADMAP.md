# ACME — feature status matrix

## Publication verification — 22 November 2026

Required local publication checks passed on this NestJS branch: lint, workspace typechecks/builds, 27 unit tests, QA typing, isolated PostgreSQL integrity/authorization/concurrency suites, native NestJS architecture/OpenAPI checks (including production documentation absence), HTTP health smoke, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The FX email-capture case timed out on the first run; its isolated three-case group passed on rerun without timeout or authorization changes. Environment setup failures and deferred-check snapshots below are historical. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md; no self-approval, merge or production deployment is claimed. The broader unmet/blocked requirements remain open.

## Earlier checkpoint records

Current NestJS audit remediation (22 November 2026): pool error handling, shared failure-safe transaction mechanics, typed query/response contracts, exact-origin config and honest committed invitation delivery/audit outcomes implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

NestJS rules alignment (22 November 2026), implemented but unverified: the existing capability modules/native injectable services remain. Concrete request DTO classes feed one APP_PIPE RequestValidationPipe and schema-derived OpenAPI input contracts. All delivered controllers use this path; the old per-parameter ZodValidationPipe is removed. OTP verification alone defers parsing to AuthService to preserve malformed-attempt throttling/audit. APP_FILTER HttpExceptionFilter handles application/framework/unknown failures with a safe 5xx fallback and preserves readiness's intentional 503 body. RequestContextMiddleware owns correlation/logging/no-store; CORS is limited to configured APP_ORIGIN. Development/test-only /api/docs, /api/openapi.json and /api/openapi.yaml document delivered routes using Swagger 12.1.2. No financial/schema/permission/session policy changes. No tests, lint, typechecks, builds, safety scans or browser checks ran for this increment, per user instruction. Changes remain uncommitted/unpublished; historical passes do not validate this working tree.

## Backend structure checkpoint — 22 November 2026

On chore/nestjs-backend-structure (base origin/main 1e0e65f), controller factories were replaced by top-level controllers and feature modules with explicit DI, shared config/database/auth/mail providers and lifecycle-managed OTP drain/pool shutdown. Source paths now follow capability folders under apps/api/src; see acme-salary-app/docs/BACKEND_STRUCTURE_AUDIT.md and TECHNICAL_DECISIONS.md (relative paths from repository root). Routes, SQL migrations, permissions and business scope are unchanged. Salary/report helpers remain internal. Pending PR #10 remains preserved separately and requires reconciliation after independent merge. This is structural delivery, not full backend or production acceptance.

**Purpose:** Record implementation status by scope without duplicating backlog priority.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

Login and team administration are delivered and tested; most salary-management user journeys remain incomplete despite tested internal foundations. Status keys below refer to the named bounded feature, not the whole product. Priority/order lives only in [BACKLOG.md](BACKLOG.md). Related: [CONTEXT.md](CONTEXT.md), [SMOKE_TESTS.md](SMOKE_TESTS.md).

Legend: **done** implemented/verified for named scope; **stub/partial** groundwork exists but user contract incomplete; **not started** no delivered implementation; **blocked** prerequisite/decision prevents acceptance; **cancelled** explicitly excluded baseline; **deferred** separate later scope without current implementation.

| Area | Feature | Status | Source/evidence |
|---|---|---|---|
| Infrastructure | npm workspace, API/web builds, typed config, local DB | done | package.json, main.ts, local-postgres.mjs; Windows dev scope |
| Infrastructure | Schema integrity/checksummed migrations | done | migrations 001..018, migrate.mjs, schema.prisma |
| Infrastructure | Health liveness | done | health/health.controller.ts H01 |
| Infrastructure | Operational readiness | stub/partial | H02 always 503; compatibility contract not finalized |
| Infrastructure | PR CI and synthetic test harness | done | .github/workflows/pr-validation.yml; 22 unit, 72 foundation DB, 22 team + 23 reference DB, 12+9+4 scoped Chromium evidence |
| Auth | Email OTP/request/resend/login/logout/session checks | done | auth/auth.controller.ts and auth/authentication.service.ts; real loopback SMTP/Chromium |
| Auth | Attempt/rate/expiry/replay and removal revocation | done | auth/auth-rate.ts, migrations 007..010, tests |
| Admin | Bootstrap/system identity | done | bootstrap-manager.mjs, migrations 001/011 |
| Admin | HR invites/renewals/permission edits/offboarding/pagination | done | team/team.service.ts, team/team.controller.ts and web team.tsx, migrations 011/012; PR #4 observed merged |
| Auth | Verified user-to-employee association | not started | nullable users.employee_id exists; no delivered verification workflow |
| Reference | Country/currency/reference/FX/hold data foundations | done | migration 002 and domain tests; no admin workflow implied |
| Reference | Department/designation administration | done | P4a merged in PR #5; 23 DB / 4 reference Chromium cases and exact-head CI passed |
| Reference | Country/currency administration | done | PR #7 merged at0e0fb86; ADR-004 and COUNTRY_CURRENCY_MODULE.md |
| Reference | FX administration | done | P4c API/UI scoped local verification23 DB /3 FX Chromium passed; FX_MODULE.md; publication/CI tracked in GIT_CHANGELOG.md |
| Reference | Salary bands | deferred | Overlap/validation/conflict policies await approval |
| Reference | Pinned ISO currency catalogue | done | SIX publication 2026-09-17, 178 codes, migration 015 + provenance JSON; read-only runtime |
| Employee | Schema and dated assignments/history guard | done | migrations 002/005 |
| Employee | Directory/profile | stub/partial | P5a directory/profile locally verified19 DB /3 Chromium; PR pending; no salary payload/band filter |
| Employee | Create/edit/remove/transfer workflow | not started | ADR-005 pending initial salary; linkage/approval/leases required; no10k seed |
| Salary | Exact decimal/FX calculation helpers | done | common/domain/money.ts and tests |
| Salary | Append-only ledger/history/approval integrity | done | migrations 003..006 and 38 approval checks; internal scope |
| Salary | Backdated submission/decision user workflow | stub/partial | SalaryApprovalService exists; no authenticated controller/UI; linkage gate missing |
| Salary | Ordinary changes/correction/transfer/leases UI/API | stub/partial | Tables/checks only for some paths; record_locks has no service |
| Reports | Snapshot ownership/version/expiry guard | done | reports/report-access.ts and SQL invalidation; internal scope |
| Reports | Generation, preview, CSV and dashboard | not started | No public implementation |
| Audit | Immutable transactional audit production in delivered flows | done | SQL audit and tested rollback |
| Audit | Searchable HR audit screen/API | not started | No controller/UI |
| Integrations | SMTP transport and local synthetic capture | done | mail/otp-mail.ts, smtp-capture.ts; captured mail is not production delivery |
| Integrations | Durable background delivery/worker | deferred | In-memory Promise set only; no queue |
| Integrations | Runtime LLM, transcription, cloud storage/upload | deferred | No implementation or currently approved feature contract |
| Scope | Full payroll, deductions, payslips/payroll runs | cancelled | Excluded salary-management baseline; reopening requires scope approval |
| Release | Production hosting/TLS/proxy/restore/compliance/UAT | blocked | Target/policies and complete business workflows missing |
| Release | 10k seed/15k load and full cross-module security matrix | not started | Delivered scopes do not replace system qualification |

Historical unmet-requirement suite has 3 passes/11 failures at the team checkpoint, with remaining dependent business scenarios blocked. Do not turn these into skipped tests or mark an internal service as a public feature. See [VALIDATION_REPORT.md](VALIDATION_REPORT.md) for documentation coverage, not new runtime certification.
