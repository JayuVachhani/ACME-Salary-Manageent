# Development log

## 21 November 2026 — foundation

- Request: begin fresh implementation after approval of Section 6 recommendations.
- Created isolated `acme-salary-app` npm workspace; original requirements preserved.
- Implemented foundation React/NestJS shells, configuration security checks, metadata-only logging, health/readiness behavior, local services and shared authorization primitives.
- Reviewed generated code for sensitive data logging, implicit salary access, self-edit bypass and empty-database readiness. Readiness remains explicitly unavailable until schema verification is implemented.
- Tests: config and permission policy suites added. Actual command results recorded in the parent development plan after execution.
- Client selected project-local PostgreSQL; installed pinned Windows binaries, initialized loopback PostgreSQL 17.12 and separate local runtime/migration roles. Fixed Windows pg_ctl inherited-pipe timeout by using ignored standard handles; no system service or global install.
- Added checksummed serialized SQL migration runner and identity/audit migration. Reapplication is safe; audit UPDATE/DELETE/TRUNCATE is blocked even for owner; runtime cannot perform schema DDL or read migration records.
- Results: 10 foundation tests passed, lint/type-check passed, API/web builds passed, 11 real PostgreSQL checks passed, health API smoke passed, npm audit reports zero known advisories. Initial TypeScript ESM/CSS declaration issues were fixed; Windows Vite sandbox access failure required a host-permitted build.
- Full compensation schema, Prisma integration, SMTP delivery, browser QA and domain acceptance tests remain pending. Readiness remains closed until schema verification is complete.
- Next: complete database/money module, then authentication; concrete unanswered business rules remain tracked and were proposed to the client.

## 21 November 2026 — approved business rules and database domain

- Client approved the concrete proposed rules with historical FX, current permission revalidation and retention safeguards. Highlighted conflict between backdated management approval and previous no-approval/immediate-effect baseline before implementation.
- Client's subsequent message explicitly approved minimal backdated HR approve/reject without self-approval, pending/rejected exclusion, complete immutable history and auditable decisions. Updated the five companion documents with precedence addenda and added ADR-002; original baseline paragraphs remain identifiable as superseded.
- Implemented SQL migrations 002–005, exact money/FX utilities, internal snapshot access guard, typed Prisma adapter and backdated approval service. Database triggers protect request/decision/ledger history and atomic audit. Employee assignment changes advance the version; invalid joining-date edits cannot invalidate stored history.
- Combined `verify:database` passed: 18 unit tests, 62 real PostgreSQL checks, Prisma adapter checks, health smoke, lint/type-check and both builds. An early snapshot test ran before compilation finished; rerun after the build passed. No mock database substitutes were used.
- Prisma CLI stable 7.10.1 selected instead of the current latest release candidate. Audit found a high Effect advisory through Prisma config; patched with a scoped 3.22.1 override. Prisma regeneration and final audit passed (zero known advisories).
- Approval module remains backend/database-only pending session guards, APIs, DTOs, lease/idempotency integration, screens and E2E. No claim of a finished production application.

## 21 November 2026 — actual Chromium QA audit

- Reviewed BRD/FRD/SDD approved requirements and existing automated suites; prepared QA_TEST_PLAN.md before browser execution.
- Installed pinned Playwright/axe and project-local Chromium. Added isolated QA servers, browser tests, QA TypeScript checks, Vitest test-boundary configuration and per-assertion regression evidence collection.
- Initial Chromium run: 25 tests, 9 passed / 16 failed. Found label contrast 4.46:1, indefinite health loading and third-party font dependency; retained original traces/screenshots/errors.
- Fixed numbered-label contrast, added 8-second fetch abort with safe cleanup, removed Google Fonts dependency. Final Chromium run: 26 tests, 12 passed / 14 failed / 0 skipped, including a new real synthetic OTP POST probe. All three fix regressions passed. Responsive screenshots and axe checks pass for the current foundation.
- Fourteen unmet workflow/API checks remain failed. Forty-five dependent scenarios are explicitly blocked. Login/session/permission/approval/report user journeys cannot run until modules exist. No fake forms/accounts/endpoints were added to make QA green.
- Reran 18 unit tests and five real service/database/API regression suites; 76 assertion records passed. Existing suites include different synthetic approval actors and data isolation. Added Windows file-URL preload fix to QA harness; initial failed harness logs retained. Lint/type/build and QA type-check passed. Dependency audit reports zero known advisories.
- Created all four requested QA reports, with per-case execution records and open/closed defect register. See QA_EXECUTION_REPORT.md for limitations and reproduction.

## 21 November 2026 — PR #1 currency regression and automated PR checks

- Synchronized remote MCP policy updates using a fast-forward before editing. Kept all fixes on the existing PR branch as explicitly requested.
- Executed the new inactive-currency regression on old code: failed with Missing expected rejection. Added service FOR SHARE validation and forward-only DB migration 006; 38 real approval checks now pass, including direct SQL, atomic no-change state, concurrent deactivation and rejection/reactivation behavior.
- Full local gate passed: 18 unit, 72 logical PostgreSQL checks, Prisma/health, lint/type/build and QA typing. Browser preflight exposed cold context setup budget and transient database unavailability; retained artifacts, confirmed DB runtime login and reran 12/12 foundation Chromium cases successfully without retry/expectation weakening.
- Added SHA-pinned read-only GitHub Actions using Windows hosted runner and generated local-only DB credentials. The complete delivered-foundation check runs on PR open/synchronize/reopen/ready events. CI tests no production data, uploads only browser diagnostics, and stops its isolated database.
- Actual Actions run 44920102845/job 136894051358 completed SUCCESS at 4fb1fd3, verified via GitHub MCP status/logs. MCP re-review 6006336494 inspected actual changed code/config; original currency thread resolved. PR marked ready for independent review through MCP. No self-approval or merge.
- Classified gaps in PR_1_SCOPE.md. Future full-application requirements remain visible and unpassed. Final documentation-only commit triggers a new check on its own head; no inherited CI-success claim.
