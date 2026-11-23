## Current verification scope

This capability was exercised in the developed-scope verification (44 delivered Chromium cases and7 new isolated HTTP/SQL groups overall, plus native checks). Exact per-suite results and limitations are in the current QA_EXECUTION_REPORT.md and Git ledger. Earlier deferred-verification implementation records below are historical. Full-product/10k/production acceptance is not claimed.

## Earlier implementation records

# Payroll calculator preview screen

Status — 23 November 2026: source-only frontend in `feature/payroll-approval-locking`, uncommitted, unpublished and unverified. No tests, test-case inspection, lint, typecheck, build, browser or safety verification ran. Backend policy/calculator branch is prerequisite; no database or backend changes accompany this screen.

Public feature export: `PayrollCalculations({isHrManager:boolean})` from `frontend/src/features/payroll-calculations`. The composition root must expose it only to HR; the component also denies non-HR without mounting its query workflow. Root owns navigation integration.

HR selects a month, a separately approved policy from the paginated policy list, and an employee's saved manual draft using month/search/pagination. The server rejects inactive, superseded or inapplicable policies. Inputs explicitly supply PF/ESI eligibility, state, professional tax, TDS, optional leaving date and unpaid dates. No applicability/rate/leave default is invented. Preview uses `POST /api/v1/payroll-calculations/preview` with the actual shared backend DTO contract: employeeId,period,policyId,manualDraftId,expectedDraftVersion,pfEligible,esiEligible,stateCode,ptAmount,tdsAmount,leavingDate,unpaidDates.

RTK Query reads policy/draft metadata; preview request/response and all draft fields stay local to the feature. Shared direct transport and useAction retain existing session/CSRF/error lifecycle. No preview hashes, OTP/session credentials or response data enter Redux actions/storage/logs. Editing inputs or changing sources invalidates the displayed preview. Query errors hide protected server lists; access/client-source denial hides preview, and empty/reset metadata cache cannot redisplay a retained preview.

The screen displays exact decimal-string earnings, deductions, gross/net totals, separate employer contributions, policy/draft/employee source versions, employment/paid/proration day counts, salary segments, correction references and server warnings. It prominently explains replacement of raw manual PF/ESI/PT/TDS by approved policy and explicit inputs. Preview does not save a payroll run, review, finalize, create a payslip or execute payment. Later source changes require a fresh calculation; the run capability recalculates authoritatively. Executable integration and acceptance remain deferred.
