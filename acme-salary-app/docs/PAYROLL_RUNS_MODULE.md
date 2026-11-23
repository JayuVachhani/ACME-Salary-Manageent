## Publication verification

This capability's implementation was exercised in the combined isolated SQL/HTTP and browser verification. Feature-branch native checks and publication are tracked in GIT_CHANGELOG.md. Earlier deferred-verification records below describe the development phase; they are not current test results.

## Earlier implementation records

# Payroll review, approval and locking

Status — 23 November 2026: source implementation on `feature/payroll-approval-locking` in `.worktrees/payroll-workflow`. Uncommitted, unpublished and unverified. Migration 025 is authored, not applied. No tests, test-case inspection, lint, typecheck, build, browser or safety verification has run. Policy/calculation migration 024 and its source are a prerequisite owned by the policy branch. Finalized payslip/payment preparation is a separate dependent branch. Earlier results do not validate this increment.

## User workflow

Open **Payroll review**, choose a month and prepare a run. Select saved manual drafts using search and 25-row paging; selection persists between pages. Runs explicitly contain 1–100 employees. Larger teams use multiple runs with distinct employees. No automatic whole-company selection, silent employee exclusion or 10k performance acceptance is claimed.

The guided steps are employee selection, explicit calculation inputs and named reviewer assignment. Supply PF/ESI eligibility, state, manual professional tax, TDS, leaving date and unpaid dates without inferred applicability. Shared input application is an explicit user action; individual inputs remain editable. The approved calculator rejects incompatible policy/eligibility/tax/leave combinations. Creating a DRAFT run calculates and freezes employee and component snapshots for subsequent review. It does not alter raw manual drafts or salary ledger entries.

Assign a live employee-linked HR reviewer, a Finance account from the approved policy, and a policy-listed Director when required. Stage accounts must be distinct. Reviewers cannot approve a run containing their own employee record: choose independent reviewers or split the run. The HR creator may review a created run when independently eligible under these rules. Policy approval itself remains a different HR manager's responsibility in the policy capability.

Lifecycle: `DRAFT → HR_REVIEWED → FINANCE_APPROVED → DIRECTOR_APPROVED (only when policy requires) → FINALIZED`. The approved policy explicitly selects `finalizerRole=HR|FINANCE`; there is no default. Returning a reviewed run to DRAFT appends an event, and every approval must be repeated. A DRAFT refresh creates a new immutable snapshot generation from current source draft versions while retaining prior generations. Policy-assignment changes that no longer permit existing reviewers require a newly assigned run; the old run/history remains retained.

Before review, approval and finalization the server reselects the currently approved policy and recalculates the same explicit inputs under source locks. Changed policy/source hashes block progress with guidance to return to DRAFT, refresh and review again. No stale run silently finalizes. Financial payload cannot change after review. FINALIZED data never recalculates and remains historical after later source changes. One employee/month can appear in only one finalized run; concurrent duplicates fail atomically. No off-cycle, supplemental or reversal exception is implemented. Finalization does not execute a payment.

## APIs and boundaries

Native Nest `payroll-runs` capability imports exported policy/calculator providers, owns its transactions and run writes, and uses the existing global Zod DTO/response pipeline and session/CSRF/origin transport. React `payroll-runs` owns its local wizard/confirmation drafts; RTK Query owns read cache and invalidation. Mutation commands use centralized direct transport and shared authentication-error handling. No session/OTP credentials are stored in Redux, storage or logs.

- `GET /api/v1/payroll-runs?period=YYYY-MM&page=1`: 25-row list. HR sees runs; Finance/Director see runs assigned to their account, subject to current salary-read access.
- `GET /api/v1/payroll-runs/setup?period=YYYY-MM&policyId=UUID`: HR-only approved policy and eligible named account choices. Missing/ambiguous policy is blocked, never silently defaulted.
- `GET /api/v1/payroll-runs/:id?page=1`: summary, 25 immutable employee lines, `linesPage`, `linesTotal`, events, stale/blocked guidance and current allowed actions.
- `POST /api/v1/payroll-runs`: `commandId,period,policyId?,calculations[],hrReviewerId,financeApproverId,directorApproverId,reason,confirmed:true`. Each calculation has employee/manual-draft/version and all explicit calculator inputs; policy is selected authoritatively.
- `POST /api/v1/payroll-runs/:id/refresh`: `commandId,expectedVersion,reason,confirmed:true`; DRAFT and current linked HR only.
- `POST /api/v1/payroll-runs/:id/actions`: the preceding command fields plus `action=HR_REVIEW|FINANCE_APPROVE|DIRECTOR_APPROVE|FINALIZE|REJECT`.

Expected-version conflicts prevent lost updates. Actor-scoped idempotency returns the stored original result for identical commands, rejects changed command semantics and preserves the command during ambiguous client failures. A failed HTTP response is not a confirmed save. The confirmation stays open for retry when outcome is uncertain.

## Persistence and downstream reads

`payroll_runs` stores period, lifecycle/version, current snapshot generation, immutable policy/source hash, selected reviewers and finalization timestamp. `payroll_run_lines` retains every generation's employee snapshot and exact string earnings/deductions/gross/deductionTotal/net, source draft/revision/version, period/pay dates and full calculation/input context. `payroll_run_events` and `payroll_run_commands` are immutable. `payroll_finalized_allocations(employee_id,period_month)` prevents double finalization. SQL guards enforce lifecycle, locked payload, actor-stage/linkage/own-record rules, matching revision events/line counts, and immutable final records.

Downstream documents/payment preparation must select `status='FINALIZED' AND finalized_at IS NOT NULL` and lines with `generation=payroll_runs.generation`. The line snapshot envelope is `employee:{id,code,name,email},period,currency:'INR',countryCode:'IN',earnings,deductions,gross,deductionTotal,net,source:{draftId,revisionId,version},policy,periodStart,periodEnd,payDate,calculation,input`. All amounts are decimal strings. This run workflow adds no bank data, payment provider or automatic payment execution.

## Deferred acceptance

Integration, schema generation and all executable verification remain pending. Required later scenarios include policy/source concurrency, state/idempotency retries, changed permissions/linkage/own-record cases, split-run duplicate finalization, stale refresh/re-review, final historical stability, full browser keyboard/accessibility flows, calculator correctness and bounded-batch performance. No runtime capacity or production-ready claim is made.

## Explicit policy-family selection

The run wizard selects an approved policy family/version explicitly and passes policyId to setup and create. Multiple approved policy keys are supported without guessing. Omitting policyId remains valid only when the policy service can resolve exactly one current approved family. Stored-run freshness and refresh resolve the latest approved effective policy in the family identified by the stored policyId; other families cannot silently replace it. A newer same-family version marks the run stale, and DRAFT refresh adopts it only when the existing independent reviewer assignments still qualify. Changed assignment lists may require a new appropriately assigned run. This is source-only implementation; verification remains deferred.
