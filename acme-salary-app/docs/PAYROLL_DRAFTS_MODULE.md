## Publication verification

This capability's implementation was exercised in the combined isolated SQL/HTTP and browser verification. Feature-branch native checks and publication are tracked in GIT_CHANGELOG.md. Earlier deferred-verification records below describe the development phase; they are not current test results.

## Earlier implementation records

## Local database setup — 23 November 2026

Migration 023_manual_payroll_drafts.sql is applied to installed acme_app; there are now 23 applied migrations. Prisma schema formatting and client generation completed. Existing employee/salary data was preserved. The initial attempt lacked the explicit Prisma environment loader and hit sandbox EACCES/EPERM; rerunning setup with backend/.env and authorized local access succeeded. These are implementation/setup results, not application tests. Migration 023 is now immutable. Source remains uncommitted and unpublished; verification is deferred.

# Manual payroll drafts

Status — 23 November 2026: local source, uncommitted, unpublished and unverified. No test, lint, type, build, browser or safety check has run for this increment.

## Workflow and ownership

Native NestJS payroll-drafts capability owns saved drafts, strict Zod-derived DTO/global validation and transactional authorization. The React feature uses RTK Query for saved records and local state for edits. Existing HR accounts may list/read drafts. Writes require live employee linkage and prohibit modifying the actor's own payroll draft. Finance/Director roles and approval permissions are not implicitly introduced.

Create a draft for an existing employee/month, manually enter components, confirm, then view/print a watermarked draft payslip. Revising appends an immutable revision with actor/time/reason and identity snapshot. One header exists per employee/month. Optimistic versions reject stale edits. Stable command IDs return the original result for identical retries and reject changed payloads. This capability does not modify salary_records or salary approval requests.

## Draft setup

India / INR. Period: first through last calendar day of the month. Planned payment date: the following month's 7th. Supported month range: 2000-01 through 9998-12.

- Earnings: basic salary, HRA, allowances, bonuses, incentives, overtime.
- Deductions: PF, ESI, professional tax, TDS, unpaid leave, authorised deductions.

All components are manually entered nonnegative decimal strings, maximum two decimal places. Use zero where not applicable. Entries do not establish statutory applicability/rates. There are no automatic totals/net pay, statutory calculations, proration or imports from the salary ledger.

Calendar-day joining/leaving proration, splitting at mid-month salary changes, HR/Payroll review, Finance approval and optional Director authorization remain unimplemented pending approved policy and role/lifecycle contracts. Automatic calculation, approval, finalization and payment processing are unavailable. Printed drafts are not finalized payslips or payment instructions.

## HTTP contracts

- GET /api/v1/payroll-drafts?period=YYYY-MM&search=&page=1 lists saved drafts.
- GET /api/v1/payroll-drafts/:id reads a draft.
- POST /api/v1/payroll-drafts creates one with commandId, employeeId, period, complete earnings/deductions objects, reason and confirmed:true.
- PATCH /api/v1/payroll-drafts/:id appends a revision with commandId, expectedVersion, complete earnings/deductions objects, reason and confirmed:true.
- GET /api/v1/payroll-drafts/:id/revisions?page=1 reads retained revisions.

Mutations require current cookie session, origin/CSRF protection and transactional authorization. Credentials never enter Redux/cache/storage/logs. Migration 023 owns isolated draft headers, immutable revisions/command results and guards. Backend owns database configuration. Existing records must not be reset.

## Pending manual acceptance

Using linked HR, select another employee/month, enter values, save, reopen, revise and print. Confirm retained revisions, identical replay, stale conflicts, own-account/permission denials and absence of salary-ledger/payment changes. These are pending instructions, not executed results. See root README for startup/login.

## Manual input CSV intake — 23 November 2026

Source implemented on feature/payroll-input-import and present in the local integration checkout. From Payroll drafts choose a month, then Import monthly inputs. Download the required employeeCode + all twelve component keys + reason template. Blank or omitted amounts are rejected; enter zero explicitly where not applicable. Shared RFC4180 parsing supports quoted text and safe result exports. Batches are limited to100 employees/256KB.

Match employee codes, review the complete component values and confirm. Each row uses the existing HR/live-link/non-self create-draft endpoint and a stable command ID. Import creates drafts only, never overwrites an existing employee/month draft. Saved rows remain when another row fails; processing stops at the first failed save and displays exact statuses. Uncertain results retain the original command/payload for retry. Leaving clears unsent rows and retry context after an explicit warning. No automatic amounts/approvals/payments are introduced by the import. No new database table is required.

Source and formatter writes only; no tests/testcase inspection, lint, types, build, browser or safety checks. No commit or push. Existing negative/blocked baseline results remain historical, not suppressed.
