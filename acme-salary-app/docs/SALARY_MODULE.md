## Publication verification

This capability's implementation was exercised in the combined isolated SQL/HTTP and browser verification. Feature-branch native checks and publication are tracked in GIT_CHANGELOG.md. Earlier deferred-verification records below describe the development phase; they are not current test results.

## Earlier implementation records

# Monthly salary capability

## Salary workspace and CSV revisions — local implementation

GET /api/v1/salary/workspace provides server-side search/filter/pagination, exact current/next salary values and pending counts with read+salary:view access (or HR). The workspace opens the employee modal directly on Salary & history. Totals never combine unlike currencies.

POST /api/v1/salary/bulk/resolve resolves up to 100 exact employee codes for eligible linked editors. CSV columns are employeeCode,amount,currency,effectiveFrom,reason; limit 100 rows/256KB. Positive base amounts and effective dates use existing per-employee rules. Each row acquires its own lease and preview; explicit confirmation submits ready rows sequentially. Completed rows persist when another row fails. Failures and uncertain results are visible; ambiguous results retain the exact command for replay. Stale rows require another preview. Result exports escape spreadsheet formulas. Unsent CSV data/credentials remain local to the page. This is not an all-or-nothing payroll batch or employee import.

See [manual payroll drafts](PAYROLL_DRAFTS_MODULE.md). All new source is unverified and unpublished; preceding CI results do not validate this increment.

Status — 23 November 2026: source implemented locally after PR #15 publication; uncommitted, unpublished and unverified. Migration 022_monthly_salary_commands.sql applied to installed acme_app; Prisma generation completed. Neither operation proves runtime correctness. Tests and all verification remain deferred by client instruction.

## Ownership and public routes

Backend salary capability owns native injected preparation/write/approval services, DTOs and employee salary command controller. Employee capability retains authorized directory/profile/salary reads; one global DTO validation pipeline remains. React employee feature owns the local editor and RTK Query reads; approval feature owns the independent inbox. Shared controls format exact money strings and before/after changes. No credentials or leases enter Redux, browser storage or logs.

- POST /api/v1/employees/:id/salary/preview returns normalized money, business date, employee version, current policy, before value, conversion snapshot and previewHash.
- POST /api/v1/employees/:id/salary appends a ledger entry or pending request after confirmed preview review.
- GET /api/v1/employees/:id/salary?page=1&requestsPage=1 returns independently paginated immutable ledger/history and authorized request decisions, current/scheduled values, currencies and action capability/reason.
- Existing salary approval routes remain the independent decision boundary; INITIAL and BACKDATED are distinguished, including corrections.

Draft fields: commandId, leaseToken, expectedVersion, amount (decimal string), currency, effectiveFrom, optional correctsId, reason. Submission adds previewHash and confirmed:true. Result fields: outcome (RECORDED or PENDING_APPROVAL), salaryId/requestId, employeeVersion and replayed.

## Approved behavior

INITIAL always awaits independent linked HR approval, including today/future dates. Today/future ordinary revisions and same-date typo corrections append WAITING_MANAGEMENT_APPROVAL entries; these count once effective. Their persistent management-review badge does not introduce an acknowledgement/clear/approval action. Past-dated changes require HR submission and independent linked HR approval before affecting compensation. No business rule is added for reports, transfers or bands.

Corrections target only an unsuperseded chain tip, retain employee/effective date and preserve prior rows. New revisions may precede an already approved future initial effective date if allowed by joining-date validation; INITIAL identifies the first approved initial ledger insertion rather than the earliest effective date. Previously accepted legacy rows remain readable without fabricated approval records.

Financial writes require current session authorization, salary access/edit authority, verified live employee linkage and no self-salary editing. Actor/link/target rows are locked in stable order; the fifteen-minute per-session edit lease and optimistic version protect writes. UI renews every sixty seconds. Country policy/currency/FX are resolved once and bound to the reviewed hash; changed context requires a fresh preview. Confirmation and a reason are required. All ledger/request/history/audit/version/command/release work is transactional.

Command replay uses actor + commandId with a semantic fingerprint (employee, canonical amount, currency, date, correction and reason). After current authorization/employee availability checks, identical replay returns the saved result before consumed lease/version checks; changed details conflict. Leases, preview hashes and expected versions are excluded from the semantic fingerprint. Ambiguous network/server failures retain the same command and reviewed payload for retry. Existing report snapshot behavior is preserved; no additional salary-triggered report invalidation policy is invented.

## Reads, privacy and UI

All authorized salary readers can see minimal pending salary notices. Detailed requests, reasons and decision comments are limited to the requester or HR. Requests have their own page/total. Read contracts include actionable reasons when editing is unavailable; active currencies are available without granting unrelated creation permissions. Decisions expose independent actor/time/comment and stale context. Eligible HR may reject stale requests while stale approval is unavailable and server validation remains authoritative.

Current compensation excludes pending requests, future rows and superseded correction records. History has table/timeline presentations and includes every immutable primary and currency-change event, with exact before/after strings and historical country/currency/precision snapshots; multiple events do not duplicate ledger pagination. Decimal values are never rounded through JavaScript Number. Legacy missing events remain explicit empty event lists.

Employee modal Salary & history offers new revision and eligible typo correction actions. Fields remain local, preview changes invalidate confirmation, and close/tab switching is blocked during editing until save/cancel. Refresh after conflict obtains fresh context/lease without losing the draft. Initial-request recovery shares modal protection. Direct transport failures use the central session/access lifecycle adapter. Approval context presents before/proposed values, country, creator and timestamps.

## Database and handoff

Migration 022 adds immutable salary_commands with actor/command identity, result/hash/outcome guards, ordinary ledger protections and a salary-history lookup index. It updates history classification without rewriting existing salary rows. Once applied it is immutable; further database fixes require a new migration. Prisma models reflect the command relations/index. Backend exclusively owns database/environment configuration.

Manual walkthrough is in the root README. Remaining acceptance work includes financial concurrency/replay, precision/FX boundaries, stale approval, permissions, lease recovery, network ambiguity, modal accessibility and full end-to-end/load qualification. These are pending scenarios, not executed test results. Broader historical unmet/blocked requirements remain open.
