# ACME — feature status matrix

**Purpose:** Record implementation status by scope without duplicating backlog priority.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), a2dea9f (merged PR #6), plus the P4b country/currency increment on feature/country-currency-administration.

## Executive summary

Login and team administration are delivered and tested; most salary-management user journeys remain incomplete despite tested internal foundations. Status keys below refer to the named bounded feature, not the whole product. Priority/order lives only in [BACKLOG.md](BACKLOG.md). Related: [CONTEXT.md](CONTEXT.md), [SMOKE_TESTS.md](SMOKE_TESTS.md).

Legend: **done** implemented/verified for named scope; **stub/partial** groundwork exists but user contract incomplete; **not started** no delivered implementation; **blocked** prerequisite/decision prevents acceptance; **cancelled** explicitly excluded baseline; **deferred** separate later scope without current implementation.

| Area | Feature | Status | Source/evidence |
|---|---|---|---|
| Infrastructure | npm workspace, API/web builds, typed config, local DB | done | package.json, main.ts, local-postgres.mjs; Windows dev scope |
| Infrastructure | Schema integrity/checksummed migrations | done | migrations 001..017, migrate.mjs, schema.prisma |
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
| Reference | Country/currency administration | stub/partial | P4b locally tested (27 DB / 3 Chromium); PR #7 open; independent approval pending; ADR-004 and COUNTRY_CURRENCY_MODULE.md |
| Reference | FX administration | not started | Immutable domain foundation exists; public maintenance UI/API absent |
| Reference | Salary bands | deferred | Overlap/validation/conflict policies await approval |
| Reference | Pinned ISO currency catalogue | done | SIX publication 2026-09-17, 178 codes, migration 015 + provenance JSON; read-only runtime |
| Employee | Schema and dated assignments/history guard | done | migrations 002/005 |
| Employee | Directory/create/edit/remove/transfer workflow | not started | Missing API/UI; no 10k seed |
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
