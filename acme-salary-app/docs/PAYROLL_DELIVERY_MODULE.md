## Publication verification

This capability's implementation was exercised in the combined isolated SQL/HTTP and browser verification. Feature-branch native checks and publication are tracked in GIT_CHANGELOG.md. Earlier deferred-verification records below describe the development phase; they are not current test results.

## Earlier implementation records

# Finalized payslips and payment preparation

## Branch implementation — 23 November 2026

Source owner: feature/payroll-payslips-payment-preparation in .worktrees/payroll-payslips. This module depends on the approved policy/calculator and payroll-run workflow branches (024/025). Migration 026 is new and unapplied in this worktree. No tests, test-case inspection, lint, typecheck, build, browser QA or safety verification ran. Formatter writes are implementation only. No commit, push, bank/provider call or production acceptance is claimed. Root integration must retain the full workflow payroll_runs model and union delivery back-relations; this branch includes only a clearly labelled dependency placeholder.

## Implemented behavior

- Native Nest PayrollDeliveryModule with strict shared Zod DTO/OpenAPI contracts and transactional cookie-session authorization; React capability under Salary → Finalized payslips & payments.
- Read only FINALIZED runs with finalized_at and only their frozen generation. Payslips retain exact INR earnings, deductions, gross, deduction total/net, separate employer contributions, employment/paid/proration days, salary segments, eligibility, manual inputs and immutable policy/draft/source references. No recalculation from current employee or salary data. Calculation-time preview notes are labelled historical, not presented as a current draft status.
- Protected browser view, app printing and escaped standalone HTML download. HTML contains no scripts/external assets. Downloads use the existing shared authenticated transport, with no credentials in URLs, Redux, storage or logs. Explicit export rights are required for app-controlled downloads/printing (HR implicit). No anonymous/public download routes or employee self-service access are introduced.
- Provider-neutral full-generation manifest uses employee IDs/codes and the exact finalized INR net strings. No account numbers, provider format or editable amounts. Complete-generation/source checks, immutable preparation metadata, content/source hashes, reasons, stable command replay and export audit are enforced. CSV cells are quoted and formula prefixes neutralized. Preparing does not mark employees paid.
- User-authorized manual external tracking records a whole-run payment date/reference/reason as EXTERNALLY_REPORTED_PAID. Only the run's actual finance_approver_id with current read/salary access and a live link may report; runs containing their own employee line are rejected. One immutable external report per finalized run, no partial settlement, corrections, reversals or refunds. This is an external attestation, not a transfer or bank verification by ACME. The payment provider action is disabled and no processing adapter/provider call exists.
- HR reads all finalized runs; configured frozen Finance/Director candidates need current read+salary:view. Export additionally needs export permission (HR implicit). Preparation also requires a live employee link. All role/status/permissions are revalidated per request; source snapshots and assigned Finance provenance remain immutable.

## API

GET /api/v1/payroll-delivery/runs?period=YYYY-MM&page=1 and GET /runs/:id return finalized headers/capabilities. GET /runs/:id/payslips?page=1 and GET /runs/:id/payslips/:employeeId return frozen finalized documents. POST /runs/:id/payslips/:employeeId/download accepts commandId/confirmed and returns an authenticated HTML document object.

GET /runs/:id/payment-preparations?page=1 lists immutable history. POST the same path accepts commandId/reason/confirmed. GET /payment-preparations/:id/manifest?page=1 shows bounded exact amounts. POST /payment-preparations/:id/download accepts commandId/confirmed and returns a protected CSV document object. POST /payment-preparations/:id/external-payment accepts commandId/externalReference/paymentDate/reason/confirmed. All mutation/export metadata calls require configured Origin/current CSRF. Date year0000 is rejected at the DTO boundary; no unsupported chronological payment rule is inferred.

Pages are bounded to25 rows. Browser drafts retain reviewed commands on ambiguous results and retry the same payload. Payment reference fields explicitly exclude bank/account details. Historical preparation/report metadata snapshots actor names and records providerProcessed=false in immutable audit.

## Schema / integration

026 introduces payroll_payment_preparations, payroll_external_payment_reports and payroll_delivery_exports, immutable row/truncate guards and source/permission/audit guards. SQL reader helper is executable only by acme_app, not public. All references point to actual finalized payroll_runs/current-generation payroll_run_lines from025; no edits to earlier migrations. Prisma models fully represent all delivery FKs. New delivery back-relations are required on users, employees and the complete workflow payroll_runs model. No environment/dependency changes.

## Manual usage after integration

Finalize a run through the approved workflow first. Open Finalized payslips & payments, choose its month and open the run. View an employee's finalized payslip, download HTML or print with export access. On Payment preparation & history, enter a reason and confirm the complete manifest. Download the provider-neutral CSV if needed. Only the assigned actual Finance approver can record the externally reported full-net payment, with reference/date/reason and explicit confirmation. Review immutable history afterward. No actual transfer occurs.

Current application acceptance and 10k performance qualification remain pending. Provider/bank processing, employee self-service, partial/reversal/refund workflows and correction of external attestations need separately defined contracts.
