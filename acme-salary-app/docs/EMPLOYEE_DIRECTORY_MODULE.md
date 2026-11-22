# Employee directory — P5a

Status: P5a merged in PR #9 (`1e0e65f`). This is the read-only employee slice, not complete employee management. Supports FR-EMP-03/08 and non-salary FR-EMP-04/07. The subsequent backend-linkage increment implements ADR-005 account linkage through the team endpoint (TEAM_MODULE.md, migration019); no employee/salary writes or linkage UI are delivered. Initial salary integration remains pending.

## Contracts and permissions

GET /api/v1/employees accepts strict search (trim/max200), optional country (uppercase2), department (UUID), status ACTIVE/INACTIVE, sort code/name/joiningDate/department/country, direction asc/desc, page1..100000 and pageSize1..100 (default25). It returns items,total,page,pageSize. Search is case-insensitive across code,full name,email; percent,underscore and backslash are escaped as literal characters. SQL sort expressions are selected only from a fixed whitelist. Name sort uses first_name then last_name; every ordering ends with ID for stable ties. One SQL statement derives both page and count from the same eligible set, preserving total on empty pages.

GET /api/v1/employees/filters supplies country and department options to permitted readers, including inactive references needed to find existing employees. It exposes no HR-only policy notes. GET /api/v1/employees/:id returns an allowlisted non-removed profile or404; malformed UUID/query returns400. All three routes require a fresh active session and HR or read permission within the same transaction. Anonymous401,no-read403,all responses no-store. No create/edit/delete permission implies read. No salary fields,request history,actor IDs or permission metadata are selected, including for HR; salary band filtering is deferred with salary-aware directory integration. There is no claim that this partial directory satisfies every FR-EMP requirement.

## Current assignment and privacy

List/detail use the latest assignment effective on/before today UTC,excluding future assignments; employees without an eligible assignment display Unassigned. Inactive employees are included by default,soft-removed employees excluded everywhere. Deactivated country/department/designation reference labels remain visible for history. Reads do not modify employee data,audit/financial history or leases; ordinary auth session last_seen remains updated. No database migration,new config,seed/reset or external service is introduced.

The UI uses explicit Apply/Clear filters,25/50/100 page sizes,sorting,paging,profile/close,loading/empty/error recovery and a keyboard-focusable scroll table. Search is server-side; request cancellation prevents stale fetch results replacing newer filters/profile. Profile display is read-only; edit/save controls are not presented until their real workflow is delivered.

## Verification and remaining work

npm run test:employees uses a unique disposable synthetic PostgreSQL database; employee browser group in npm run test:login uses web/API4827/4828 and SMTP4325 sequentially with its own isolated DB. CI runs both and retains qa-artifacts/employees. Exact executed results are in QA_EXECUTION_REPORT.md and TEST_CASES.md; traces/runtime secrets are ignored.

Pending: linkage UI,atomic employee plus pending initial-salary request,independent approval,employee edits/lease/history/removal/transfer,authorized salary values/band filtering,10k/15k load qualification and full security/UAT/production acceptance. Initial-salary approval conflicts with existing backdated-only request constraints; a reviewed forward migration is required before creation,not a bypass or silently active initial ledger row.

QA serving uses the built-static Node proxy described in BROWSER_TEST_RUNTIME.md. For focused diagnostics npm run test:login -- employees selects that isolated group; default test:login/CI execute all groups. Invalid selectors fail before DB access. Focused results are not counted as all-group passes.
