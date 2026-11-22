# ACME — feature status matrix

## Publication verification — 22 November 2026

Required local publication checks passed on this React branch: lint, workspace typechecks/builds, 31 unit tests, QA typing, architecture gate (71 source files / 7,549 assertions), isolated PostgreSQL integrity/authorization/concurrency suites, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The initial reference run exposed a startup identity/OTP race; fresh post-login identity retrieval now cancels and settles the older anonymous query, with a regression test. A later cold login request stalled; the complete 22-case serial rerun passed without relaxed timeouts or authorization checks. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md. No self-approval, merge or production deployment; broader unmet/blocked requirements remain open.

Setup history: incomplete dependencies and a Windows PostgreSQL DLL lock required a clean dependency reinstall and preserved local-instance restart; Prisma was regenerated. An overlapping disposable-database migration hit shared-role contention and the database suites passed serially. No existing database was reset. Historical deferred-check snapshots below do not describe this publication checkpoint.

## Earlier checkpoint records

Current React audit remediation (22 November 2026): shared controls/tables/pagination/request states, employee dependency invalidation, typed notification feedback and accurate delivered-scope copy implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

Rules alignment in progress (22 November 2026): frontend global state now uses Redux Toolkit 2.15.0 / React Redux 9.3.1 and one RTK Query API/cache. Feature-owned endpoints replace custom remote-state effects; server identity is read through useSession from the query cache. Session Context and useResource are removed. Forms, confirmation snapshots and OTP inputs stay local; OTP credentials bypass Redux actions/cache through the same shared secure transport. AppProviders owns store/error-boundary/notification composition; the authenticated workspace is lazy loaded with Suspense. Logout/self-removal/established-session 401 clears cached protected data; 403 refreshes current identity. No API/schema/financial rule changes. **Uncommitted and unverified: no tests, lint, typechecks, builds, safety scans or browser checks were run for this increment, at the user's request.** Existing PR #12 checks cover its published head only; PR #11 backend and PR #10 linkage remain separate pending work.

**Purpose:** Record implementation status by scope without duplicating backlog priority.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

Login and team administration are delivered and tested; most salary-management user journeys remain incomplete despite tested internal foundations. Status keys below refer to the named bounded feature, not the whole product. Priority/order lives only in [BACKLOG.md](BACKLOG.md). Related: [CONTEXT.md](CONTEXT.md), [SMOKE_TESTS.md](SMOKE_TESTS.md).

Legend: **done** implemented/verified for named scope; **stub/partial** groundwork exists but user contract incomplete; **not started** no delivered implementation; **blocked** prerequisite/decision prevents acceptance; **cancelled** explicitly excluded baseline; **deferred** separate later scope without current implementation.

| Area | Feature | Status | Source/evidence |
|---|---|---|---|
| Infrastructure | npm workspace, API/web builds, typed config, local DB | done | package.json, main.ts, local-postgres.mjs; Windows dev scope |
| Infrastructure | Schema integrity/checksummed migrations | done | migrations 001..018, migrate.mjs, schema.prisma |
| Infrastructure | Health liveness | done | main.ts H01 |
| Infrastructure | Operational readiness | stub/partial | H02 always 503; compatibility contract not finalized |
| Infrastructure | PR CI and synthetic test harness | done | .github/workflows/pr-validation.yml; 22 unit, 72 foundation DB, 22 team + 23 reference DB, 12+9+4 scoped Chromium evidence |
| Auth | Email OTP/request/resend/login/logout/session checks | done | auth-controller.ts/authentication.ts; real loopback SMTP/Chromium |
| Auth | Attempt/rate/expiry/replay and removal revocation | done | auth-rate.ts, migrations 007..010, tests |
| Admin | Bootstrap/system identity | done | bootstrap-manager.mjs, migrations 001/011 |
| Admin | HR invites/renewals/permission edits/offboarding/pagination | done | team.ts/team-controller.ts/team.tsx, migrations 011/012; PR #4 observed merged |
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
| Salary | Exact decimal/FX calculation helpers | done | money.ts and tests |
| Salary | Append-only ledger/history/approval integrity | done | migrations 003..006 and 38 approval checks; internal scope |
| Salary | Backdated submission/decision user workflow | stub/partial | SalaryApprovalService exists; no authenticated controller/UI; linkage gate missing |
| Salary | Ordinary changes/correction/transfer/leases UI/API | stub/partial | Tables/checks only for some paths; record_locks has no service |
| Reports | Snapshot ownership/version/expiry guard | done | report-access.ts and SQL invalidation; internal scope |
| Reports | Generation, preview, CSV and dashboard | not started | No public implementation |
| Audit | Immutable transactional audit production in delivered flows | done | SQL audit and tested rollback |
| Audit | Searchable HR audit screen/API | not started | No controller/UI |
| Integrations | SMTP transport and local synthetic capture | done | otp-mail.ts, smtp-capture.ts; captured mail is not production delivery |
| Integrations | Durable background delivery/worker | deferred | In-memory Promise set only; no queue |
| Integrations | Runtime LLM, transcription, cloud storage/upload | deferred | No implementation or currently approved feature contract |
| Scope | Full payroll, deductions, payslips/payroll runs | cancelled | Excluded salary-management baseline; reopening requires scope approval |
| Release | Production hosting/TLS/proxy/restore/compliance/UAT | blocked | Target/policies and complete business workflows missing |
| Release | 10k seed/15k load and full cross-module security matrix | not started | Delivered scopes do not replace system qualification |

Historical unmet-requirement suite has 3 passes/11 failures at the team checkpoint, with remaining dependent business scenarios blocked. Do not turn these into skipped tests or mark an internal service as a public feature. See [VALIDATION_REPORT.md](VALIDATION_REPORT.md) for documentation coverage, not new runtime certification.
