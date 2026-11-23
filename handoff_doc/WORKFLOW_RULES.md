## Developed-scope verification — 23 November 2026

The user authorized testing, fixes, commits and normal pushes. Local checks passed: frontend format/lint/types,15 units,native build and154-file/28,075-check architecture; backend format/lint/types,27 units,7 migration checks,native build,real Nest DI/OpenAPI/module isolation and production-doc isolation; QA formatting/types;4 hook regressions and Git safety regression. Delivered Chromium:44 passed (12 foundation,23 existing,9 new salary/payroll), no skipped/flaky cases. New real PostgreSQL/Nest HTTP suite:7 groups passed, including monthly replay/corrections/backdating,exact proration/caps/statutory replacement,policy-family refresh,independent reviews,duplicate finalization,protected document exports,external-reference authorization/replay and immutable snapshots. Existing isolated identity11,retention/FX23,approvals38,country27,directory19,linkage17,team22,references23,FX23,employee workflow32,authentication,Prisma and health also passed.

Verification used random disposable databases on preserved test PostgreSQL55432; installed acme_app5432 and its demo/user data were untouched. Native gates also passed on each feature-specific working tree (frontend14/14/15/15 units; backend27 each). Source fixes addressed OpenAPI schema transforms that prevented startup,CSV formula guards,strict money/selection types and policy-cache invalidation. Unit configuration now uses synthetic unreachable database/SMTP values and does not need developer secrets. Initial sandbox realpath/junction EPERM,old test-cluster recovery/startup delay and premature health run were environment failures and later reruns passed. A new CSV test expectation incorrectly normalized CR and browser locators matched hidden duplicate controls; those tests were corrected without dropping assertions or extending timeouts. Existing employee assertions now check actual formatted salary/history behavior.

Migrations022–026 remain unchanged after application. Full-product unmet/blocked historical checks are retained; these delivered-scope passes do not establish production or10k/15k capacity acceptance. TDS input remains manual; bank/provider transfers,partial payments,reversals and supplemental payroll remain outside delivered behavior. Source is being committed in logical dependency order with required hooks. No remote push or current-head CI pass is claimed until recorded below.

## Earlier checkpoint records

## Payroll implementation integration — 23 November 2026

Local source on feature/payroll-integration now combines approved-policy calculation/proration, staged payroll review/finalization, finalized payslips, provider-neutral preparation/manual external-payment tracking and create-only manual input CSV intake. Separate feature worktrees preserve the source. All remain uncommitted, unpublished and unverified; no test/testcase inspection, lint, typecheck, build, browser QA, safety scan or benchmark ran. Formatter writes, migrations024–026 and Prisma generation completed as implementation/setup only. Local acme_app now has26 migrations; existing records were preserved. Applied migrations are immutable.

Policies have no hardcoded statutory rates and stay inactive until another linked HR approves explicit settings. TDS is supplied manually; automatic statutory compliance/tax assessment is not claimed. Runs use explicit policy families and immutable source generations; changed sources require review again. Finalized employee/month allocations cannot duplicate. Batches are bounded at100 employees and paged at25; 10k/15k capacity remains unqualified. Bank/provider transfers, supplemental/reversal payroll and full-product acceptance are not delivered. Historical unmet/blocked checks remain unchanged.

Current contracts: PAYROLL_POLICY_CALCULATIONS.md, PAYROLL_RUNS_MODULE.md, PAYROLL_DELIVERY_MODULE.md and PAYROLL_DRAFTS_MODULE.md under acme-salary-app/docs. Root README contains current manual startup/workflow steps.

## Earlier checkpoint records

## Salary workspace, bulk revisions and manual payroll drafts — 23 November 2026

Remote inspection confirms PR #15 merged to main at 63c4ed1. Current local branch feature/salary-workspace-bulk-drafts starts from that origin/main and preserves the ongoing monthly edits. New source adds a paginated salary workspace, bounded CSV revisions using existing per-row leases/preview/approval rules, and HR-only India/INR manual payroll drafts with retained revisions and watermarked draft payslips. No automatic totals, statutory calculation, proration, payroll approval/finalization or payment processing is delivered.

This increment remains uncommitted, unpublished and unverified. No tests/testcase inspection, lint, types, build, browser or safety check has run. Formatter writes and migration/client setup are implementation work, not acceptance results. Earlier passes apply only to their recorded heads. Contracts: SALARY_MODULE.md and PAYROLL_DRAFTS_MODULE.md under acme-salary-app/docs; manual startup/walkthrough: root README. Broader historical unmet/blocked cases remain open.

## Earlier checkpoint records

## Monthly salary implementation — 23 November 2026

Published checkpoint: PR #15, head ae2376c81d63867dd6e7104641e49cc650dca1ce, GitHub Actions run 45067635080 passed. PR remains open for independent review, unmerged. The subsequent monthly increment is local, uncommitted and unpublished; no tests, lint, types, build, browser or safety verification has run for it. Earlier results below apply only to their recorded checkpoints.

Monthly revisions, same-date correction chains, backdated requests, approval context and immutable salary history are implemented in source. Migration 022 was applied to installed local acme_app without resetting data; Prisma client generation and formatter writes are implementation actions, not test passes. Today/future entries retain the management-review badge and count once effective; past entries await independent linked HR approval. Initial salaries still require independent approval for every date. Reports, transfers, bands and full 10k capacity/product acceptance remain incomplete. See the [canonical salary module](../acme-salary-app/docs/SALARY_MODULE.md) and root README for contracts/manual instructions.

## Earlier checkpoint records

## Employee / initial salary checkpoint — 23 November 2026

Initial salary stays pending for every date; independent linked HR approval appends the ledger. Creation is atomic and idempotent; rejected requests can be resubmitted with new IDs. Full current contracts and deferred acceptance scenarios: [employee module](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). Tests/checks remain deferred at client request; changes are local/uncommitted/unpushed.

# ACME — workflow rules and state transitions

Migration019: accounts start unlinked. Independent current HR may link/relink/unlink with reason, confirmation and expected team version. No self-link or actor's own employee identity, removed subject or duplicate live mapping. Commit atomically updates mapping/version, revokes target sessions/open OTPs, removes target edit leases, invalidates owner and old/new membership snapshots and appends actor/time/reason/old/new identity audit. Failure rolls everything back. No implicit email mapping or linkage UI; public salary writes remain absent. Earlier linkage-pending descriptions are the historical pre-019 checkpoint. See TEAM_MODULE.md.

**Purpose:** Explain allowed transitions, side effects and forbidden shortcuts.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

Login, team and department/designation transitions are user-accessible. FX maintenance is now user-accessible. Salary decisions, assignments/holds and snapshot states remain internal/schema-only where noted. No workflow can be completed by inventing missing endpoints. Financial history is append-only; there is no destructive rewind. Related: [DATA_MODEL.md](DATA_MODEL.md), [RBAC.md](RBAC.md), [SMOKE_TESTS.md](SMOKE_TESTS.md).

## 1. User and invitation lifecycle — done for delivered admin scope

~~~mermaid
stateDiagram-v2
  [*] --> INVITED: HR invite, 7-day expiry
  INVITED --> INVITED: HR renews, new version and expiry, old codes consumed
  INVITED --> ACTIVE: eligible email OTP verified
  INVITED --> DELETED: authorized offboarding
  ACTIVE --> ACTIVE: name or independent role/permission update
  ACTIVE --> DELETED: authorized offboarding, another active HR remains if needed
  DELETED --> [*]: preserved identity, no API reactivation
~~~

TeamService invite/change/remove/reinvite serialize through a team advisory lock and same-transaction session authorization. protect_team_identity blocks system mutation, own role/permission change, permanent deletion and final active-HR removal/demotion. Pending HR invitees do not count as active managers. Team version advances on updates including first login, so a pre-login table row becomes stale. Own name editing is permitted; self-offboarding is constrained by continuity. Rejoin creates a different ID with a newly assigned permission set.

Each team write audits before/after state in the transaction; any audit failure undoes state/version changes. SMTP happens after commit. Email failure does not erase the invitation: response delivery=failed and audit allow explicit Reinvite. There is no approval requirement for ordinary HR invitations beyond authorized HR confirmation, and no client-supplied actor override.

## 2. OTP and session lifecycle — done

~~~mermaid
stateDiagram-v2
  [*] --> Open: eligible account issue
  Open --> Consumed: resend invalidates old challenge
  Open --> Consumed: third wrong attempt
  Open --> Consumed: valid verification
  Open --> Consumed: delivery failure or user removal
  Open --> Expired: lifetime reached on access
  Consumed --> [*]
  Expired --> [*]
~~~

AuthenticationService.issue generates a new challenge and CSPRNG code; six-digit zero-prefixed values are valid. Only its HMAC is stored. Verify locks user then challenge, samples time after lock, checks eligibility/invitation expiry, increments and commits bad attempts, and permits one successful consumer under parallel requests. Unknown/ineligible or throttled requests still return a generic 202; generic verification failures are 401, IP throttling 429. No code is returned in HTTP.

~~~mermaid
stateDiagram-v2
  [*] --> Valid: OTP success creates hashed session
  Valid --> Valid: current-user check, idle time advanced
  Valid --> Revoked: logout or user removal
  Valid --> Expired: idle or absolute limit
  Revoked --> [*]
  Expired --> [*]
~~~

Permissions are re-read on each access. Changing privileges does not require issuing a new cookie. Revoked/expired sessions cannot be revived by resending their token. A cookie may still exist after a shorter server limit; sign in again. No JWT refresh-token or MFA provider flow is implemented.

## 3. Backdated salary requests — stub/partial user workflow; internal service done

~~~mermaid
stateDiagram-v2
  [*] --> PENDING: HR submit, reason, eligible past date
  PENDING --> APPROVED: independent active HR, comments, all rechecks
  PENDING --> REJECTED: independent active HR, comments
  APPROVED --> [*]: ledger plus history/audit committed atomically
  REJECTED --> [*]: original ledger unchanged
~~~

submit requires date before UTC businessDate, on/after joining date, current employee version, dated country assignment, positive exact precision, active currency and historical FX. One unresolved employee/date proposal is allowed; rejected proposals may be resubmitted with a new request ID. Normal date collisions are rejected; corrections must refer to the current unsuperseded same-employee/same-date record.

On approval, decide locks employee, shares-locks country/current active currency and appends decision + exact requested ledger values. Deferred constraint verify_approved_salary_exists prohibits committing only an approved decision. SQL 004 adds history/audit/version in the same write. Stale employee/country, inactive currency, duplicate decision or history/audit failure rolls everything back. Rejection can remain possible after currency deactivation because it never changes pay. Requester and salary subject cannot approve; nullable employee linkage remains a release blocker for exposing these services.

Pending/rejected proposals are never salary_records. The ordinary non-backdated WAITING_MANAGEMENT_APPROVAL ledger badge is a different baseline concept and salary_in_force does not filter it. Ordinary salary API/approval screens, transfers and correction UX are not implemented. No multilevel approvals, force-approve, date correction/cancellation, withdrawal or approval rewind exists. Mandatory reason/comment cannot be bypassed.

## 4. Assignments, salary history and FX — internal/schema foundations

~~~mermaid
flowchart LR
  Assignment[Append dated assignment] --> Version[Employee version advances]
  Ledger[Append salary record] --> History[Immutable before/after history]
  Ledger --> Audit[Immutable audit]
  Ledger --> Version
  FX[Append dated FX revision] --> Provenance[Preserved source and actor]
~~~

Assignments are append-only, unique per employee/effective date and not before joining date. SQL prevents joining-date edits invalidating assignment, salary or request history. History classifies initial/revision/correction/country-transfer and adds a separate currency-change event where relevant. A classified event is not proof that an operational transfer workflow exists.

Assignment employment_status is ACTIVE or INACTIVE. These are effective-dated observations, not a mutable users.status field; the SQL permits either initial value and new dated observations in either direction. A future-dated observation does not replace the current as-of selection until its effective date. There is no operational assignment editor yet.

~~~mermaid
stateDiagram-v2
  [*] --> ACTIVE: valid initial dated assignment
  [*] --> INACTIVE: valid initial dated assignment
  ACTIVE --> INACTIVE: append later applicable assignment
  INACTIVE --> ACTIVE: append later applicable assignment
~~~

FX revision numbers must be sequential per pair/date under advisory lock. Corrections append revisions, not UPDATE. Resolver prefers eligible direct/inverse then USD legs and rejects missing/stale paths; no manual per-entry override. Country policy and rate provenance are snapshotted at submission. Approval rechecks current country version/currency but preserves the submitted FX metadata; future reporting must explicitly honor historical policy. Calculated rounding is separate from rejecting excessive entered precision.

## 5. Retention and reports — stub/partial

~~~mermaid
stateDiagram-v2
  [*] --> Held: HR appends hold with reason
  Held --> Released: HR appends release with reason
  Released --> [*]
~~~

An unreleased hold blocks employee removal, including concurrent placement/removal through shared employee locking. Release and removal are different operations; releasing one hold does not release other holds. No permanent purge or jurisdiction-specific retention automation exists.

~~~mermaid
stateDiagram-v2
  [*] --> Snapshot: future generator writes payload/membership
  Snapshot --> Unavailable: 30-minute expiry
  Snapshot --> Unavailable: owner access change or mapped employee removal
  Snapshot --> Snapshot: valid owner/current permission/version read
~~~

Snapshot generation/export UI/API is not implemented. Existing guard requires fresh read+salary:view and export for export access, owner identity and current authorization version. Membership must be complete for employee invalidation. An already downloaded file cannot be recalled. No TTL row-deletion worker or snapshot-regenerate endpoint exists.

## 6. Recovery, independence and deployment substates

Do not delete ledger/decision/audit records to rewind a mistake; use approved append-only correction or fresh rejected-request resubmission. Do not reactivate a DELETED account through raw SQL in operational use; test-only fixtures do not authorize an API transition. Snapshot membership is the only explicit cascade delete, not an employee/user purge.

User offboarding does not delete salary/employee history or override holds. A rejected salary proposal does not prevent login/team administration. An SMTP outage does not roll back an already saved team invitation; resend/reinvite differ and use different authorization/lifetime rules. No worker/graph/deployment wizard status machine exists: CI running/success/failure is a GitHub state, not a stored project deployment state. [DEPLOYMENT.md](DEPLOYMENT.md) lists the release blockers.


## 7. Department/designation administration — done for P4a

~~~mermaid
stateDiagram-v2
  [*] --> Active: HR confirms create
  Active --> Active: HR confirms rename
  Active --> Inactive: HR confirms deactivate
  Inactive --> Active: HR confirms reactivate
  Inactive --> Inactive: HR confirms rename
~~~

All mutations call OrganizationReferencesService.run with the current HR session, exact Origin and bound CSRF. create/change use strict schemas; change checks expectedVersion and SQL increments version. Trim whitespace, preserve display casing, enforce case-insensitive unique names even while inactive, and retain immutable IDs. Cancellation sends no mutation. Stale changes return 409; refresh/reopen, never auto-merge. No delete, force, skip or approval override exists.

New assignment insertion locks active department/designation rows FOR SHARE; concurrent deactivation waits or the new assignment fails after deactivation commits. Existing history remains readable. audit_organization_reference writes before/after with the session actor in the same transaction; audit failure rolls back the reference change. No salary change, salary approval or historical revaluation is implied by renaming/deactivation. Country/currency/FX administration and precision restrictions are subsequent work. Salary bands remain deferred under ADR-003.

Related: [reference module contract](../acme-salary-app/docs/ORGANIZATION_REFERENCES_MODULE.md), [RBAC](RBAC.md), [DATA_MODEL](DATA_MODEL.md).

## 8. Country/currency administration — P4b

~~~mermaid
stateDiagram-v2
  [*] --> CatalogueOnly: pinned ISO record
  CatalogueOnly --> Active: HR confirms numeric entry activation
  Active --> Inactive: HR confirms deactivate
  Inactive --> Active: HR confirms reactivate
~~~

N.A. entries never activate. Codes/minor units are read-only over HTTP. Referenced precision cannot change through SQL; any correction needs a reviewed migration. Country create/edit uses 0..4 precision, rounding enum, descriptive notes, current HR+CSRF and expectedVersion on edits. Codes remain immutable. Country/currency deactivation preserves history and blocks new financial records through active-reference locks. Active-country configuration requires an active default; country deactivation remains allowed when its default is inactive. Policy edits change version and invalidate stale approval policy bases, not old salary rows. Rejection remains independent of salary insertion. Notes preserve existing JSON metadata and do not implement legal retention; holds stay separate. No delete, forced override or automatic catalogue refresh exists.

Related: [country/currency module](../acme-salary-app/docs/COUNTRY_CURRENCY_MODULE.md), [RBAC](RBAC.md), [DATA_MODEL](DATA_MODEL.md).

## 9. FX revision workflow — P4c

~~~mermaid
flowchart LR
  HR[Active HR loads pair/date revision] --> Draft[Positive decimal, source and reason]
  Draft --> Confirm[Review exact direction/value/date]
  Confirm --> Locks[Session and active-currency locks, pair/date advisory lock]
  Locks --> Conflict[Stale revision:409, explicit refresh]
  Locks --> Append[Append current revision plus1]
  Append --> Audit[Before/after audit in same transaction]
~~~

Cancel saves nothing. Readers can browse all prior revisions and resolve historical rates, including deactivated currency history. Writes require active currencies and HR; no overwrite/delete, per-salary override or automatic retry. Future rows apply only on/after their effective date. Lookup is direct, inverse, then USD; every leg must meet configured staleness or422. Same configured currency factor1 needs no FX row. Existing salary/report snapshot provenance stays unchanged after correction. The unit-factor preview does not implement reports/payroll. See [FX module](../acme-salary-app/docs/FX_MODULE.md).

## P5a directory checkpoint

Read-only employee directory/profile integrates GET employees,employees/filters,employees/:id with fresh HR/read checks; no salary payload or mutation. Current assignment excludes future dates,removed employees excluded,literal wildcard search and fixed sorting/paging. No migration/schema/config/external service added. test:employees plus fifth isolated test:login Chromium group (4827/4828,SMTP4325 sequential),artifacts employees. Local19 directory DB /3 directory Chromium and34 scoped browser checks passed; exact-head CI/review pending; see QA_EXECUTION_REPORT.md. [Employee contract](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). ADR-005 linkage and initial salary approval are approved future integration requirements; do not treat this directory as employee creation/approval completion.
