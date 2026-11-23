## Current verification scope

This capability was exercised in the developed-scope verification (44 delivered Chromium cases and7 new isolated HTTP/SQL groups overall, plus native checks). Exact per-suite results and limitations are in the current QA_EXECUTION_REPORT.md and Git ledger. Earlier deferred-verification implementation records below are historical. Full-product/10k/production acceptance is not claimed.

## Earlier implementation records

## Monthly salary implementation — 23 November 2026

Published checkpoint: PR #15, head ae2376c81d63867dd6e7104641e49cc650dca1ce, GitHub Actions run 45067635080 passed. PR remains open for independent review, unmerged. The subsequent monthly increment is local, uncommitted and unpublished; no tests, lint, types, build, browser or safety verification has run for it. Earlier results below apply only to their recorded checkpoints.

Monthly revisions, same-date correction chains, backdated requests, approval context and immutable salary history are implemented in source. Migration 022 was applied to installed local acme_app without resetting data; Prisma client generation and formatter writes are implementation actions, not test passes. Today/future entries retain the management-review badge and count once effective; past entries await independent linked HR approval. Initial salaries still require independent approval for every date. Reports, transfers, bands and full 10k capacity/product acceptance remain incomplete. See the [canonical salary module](SALARY_MODULE.md) and root README for contracts/manual instructions.

## Earlier checkpoint records

## Local publication verification — 23 November 2026

The push request authorizes verification. Backend gates and32 new employee SQL/HTTP checks passed; frontend9 units/lint/types/build/architecture and12 foundation Chromium cases passed. All23 delivered Chromium cases also passed across the final corrected groups. Publication hooks and exact-head GitHub CI remain pending. This supersedes earlier deferred-verification snapshots without claiming full-product or10k capacity acceptance. See [current QA report](../QA_EXECUTION_REPORT.md) and Git ledger for actual results; no push/CI success inferred.

## Employee details modal — 23 November 2026

View profile now opens a shared native dialog instead of stacking details below the directory. Overview separates personal details/current assignment; Salary & history is shown only with salary-view permission and loads salary data when selected. Shared tabs support arrow/Home/End keys. Modal focus containment, focus return, Escape/Close, background scroll locking, persistent header and a scrollable responsive body are implemented. While personal editing is active, closing and switching away are disabled until saving/canceling; existing confirmation and edit-lease flows remain. Background profile refetches preserve visible content/drafts. No backend/schema/environment/permission changes. Implementation and formatter writes only: tests, lint, types, builds, browser QA and safety checks remain deferred; no commit/push.

## Synthetic demo data — 23 November 2026

The local seed committed 10,000 DEMO employees, 9,990 independently approved initial salaries, 8 pending and 2 rejected requests. It preserves existing records and uses current database guards. Demo account roles/linkages, sample employees, fictional policy labels, grouped navigation and repeat-seed commands are maintained in the [root runbook](../../README.md). This is data preparation, not workflow/load qualification; no automated verification, commit or push.

## Employee creation and initial salary implementation — 23 November 2026

Status: implemented in source on feature/employee-initial-salary; migrations 020 and 021 applied to the configured local acme_app database and Prisma client generated. No automated tests, lint, type checks, builds, browser acceptance or load checks were invoked for this increment, following the client's implementation-first instruction. It is not accepted or production ready. Prior employee-read and linkage passes do not validate the new workflows. Existing watch processes may rebuild on file changes; this is not a recorded validation result. No commit/push/PR.

Project profile: existing modular NestJS 12.6 / TypeScript 6 backend, PostgreSQL 19 local server, React 19.3 / RTK Query frontend, Node 24.20; no new dependencies or generated scaffolds. EmployeesModule owns employee creation and personal-detail edits. SalaryModule owns the approval inbox and authenticated decisions, using SalaryApprovalService.decideWithin in the same transaction as session authorization. Existing shared DTO pipe, response/OpenAPI schemas, HTTP security, database transaction helper, exact-money validation and FX resolution remain authoritative.

### Implemented behavior (awaiting verification)

- Add employee page collects employee identity, joining date, country, department, job title/status and initial monthly salary/date/reason. Active reference options come from the backend. Country precision is enforced without rounding user input; FX provenance uses the approved historical resolver. Dates before joining are rejected.
- Creation commits employee, dated assignment, pending INITIAL request, audit and idempotency result together. No initial ledger entry is auto-approved. All initial dates, including past/today/future, require a different eligible HR manager. Retries with the same actor/command ID return the same employee/request; changed payloads with a reused key are rejected. Employee code/email remain unique and case-normalized.
- Approval inbox has paginated pending/approved/rejected views, comments and confirmation. Only currently active HR managers with live verified employee linkage can decide; requester/subject exclusions, employee version, country policy/currency validity, immutable decision/history and atomic approved-ledger creation remain server/database enforced. Rejected requests do not affect compensation. A corrected initial request uses a new ID; it is available after rejection only when no ledger or live request exists. Later resubmission requires linkage, while creation can bootstrap a new directory employee in its creation transaction.
- Team access now provides an employee search/selection/link form using the existing independent HR linkage endpoint. The operation requires reason, confirmation and team version, signs out the affected colleague and preserves existing revocation/audit/snapshot safeguards. No email matching or self-linking.
- Employee profiles expose current salary, paginated approved ledger history and pending requests only to read+salary:view (or HR). Current compensation excludes pending/rejected and not-yet-effective amounts. There is no read-only salary leak through employee listings.
- Personal name/email edits use read+edit (or HR), confirmation, reason, optimistic version and an opaque edit-session lease. Lease acquisition checks the version displayed before granting access; 15-minute lease and 60-second renewal follow the SDD. Only the holder/token can renew/release/save. Save commits details, audit, version increment, affected report-snapshot invalidation and lease release together. Browser state holds lease credentials; they are not persisted in Redux. Competing editors get 423; stale/expired saves are rejected. Cleanup is best effort; expiry remains the fallback. This does not yet edit joining date, code, dated assignments or country.

### Route contract

- POST /api/v1/employees; GET /api/v1/employees/create-options.
- POST /api/v1/employees/:id/initial-salary (corrected initial request).
- POST /api/v1/employees/:id/edit-lease, /edit-lease/renew, /edit-lease/release; PATCH /api/v1/employees/:id (personal details only).
- GET /api/v1/employees/:id/salary?page=1 (25 history rows per page, bounded pending projection).
- GET /api/v1/salary-requests?status=PENDING&page=1; POST /api/v1/salary-requests/:id/decision.
- Existing PATCH /api/v1/team/:id/employee-link now has a UI.

Every mutation requires the configured Origin and valid session CSRF, revalidated transactionally. Inputs reject unknown fields and response schemas/OpenAPI describe public projections. Creation/resubmission require read+write+salary:view or HR; salary reads require read+salary:view or HR; edits read+edit or HR; decisions require independently linked HR. No business privileges are inferred merely from navigation visibility.

### Schema and scope

Forward-only 020 adds request_kind INITIAL/BACKDATED, relaxes date constraints only for INITIAL, introduces immutable employee_creation_commands and initial/linked-approver guards; the request-status view appends the kind. 021 adds verified linkage for later initial resubmission. Existing applied SQL files and historical data are preserved; Prisma mirrors new fields/table. No environment variables were added. Local acme_app now has 21 applied migrations. The earlier 19-migration startup record is historical.

Still pending: requester-visible rejected decision/comment details for non-HR initial creators, ordinary monthly revisions and same-date corrections, transfer rules that remain unresolved, employee soft removal/holds UI, full dated assignment edits, report/export generation, audit browsing/analytics and deterministic 10k/15k qualification. Salary bands and unresolved financial/reporting rules remain blocked/deferred. This increment is the first business workflow, not completion of P5/P6 or the whole product.

### Deferred acceptance scenarios

When the client authorizes verification: check atomic rollback at every create step; duplicate code/email and retry replay/payload mismatch; active-reference/precision/FX/date rejection; initial dates past/today/future; rejection and corrected submission; unlinked/self/requester/subject approvals; stale employee/country and concurrent decisions; current/history visibility and future selection; role revocation; two tabs/editors, stale acquisition/save and expired/foreign tokens; release/renew failure; keyboard/mobile confirmation flows and cache clearing. Existing direct-initial-ledger/unlinked-approver fixtures must be adapted to the newly approved contract without dropping their original integrity assertions. Run the full affected database/HTTP/browser gates plus package/architecture/safety checks before commit/publication; performance at 10k remains unverified.

---

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
