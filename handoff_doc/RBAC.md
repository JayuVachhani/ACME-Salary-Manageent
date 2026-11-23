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

## Demo data and navigation — 23 November 2026

Executed the explicit synthetic seed in local acme_app: 10,000 DEMO employees, 9,990 independently approved initial salaries, 8 pending and 2 rejected requests, using existing active INR. Demo HR accounts are independently linked; existing accounts/data remain preserved. Script owns a transaction/advisory lock and completed-seed audit marker; no reset or overwrite. Sidebar/Home are grouped by People, Salary and Settings with existing permission filtering. Accounts, sample codes, fictional policy labels and repeat command are in [the current runbook](../README.md). Seeding is not a test/load pass; verification, commit and push remain deferred. No full salary-product completion claimed.

## Employee / initial salary checkpoint — 23 November 2026

Create requires read+write+salary:view or HR; personal edit read+edit or HR; salary read read+salary:view or HR; salary decisions independently linked HR. Later initial resubmission also requires live linkage. Full current contracts and deferred acceptance scenarios: [employee module](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). Tests/checks remain deferred at client request; changes are local/uncommitted/unpushed.

# ACME — roles, permissions and route authorization

Migration019: PATCH `/api/v1/team/:id/employee-link` is independent active HR only with session/CSRF/Origin, confirmed reason and expectedVersion. Self target, actor's own employee identity, system/deleted targets and unavailable subjects are denied. Unique nondeleted-account mapping includes invited accounts. GET team now returns employee_id. No salary permission is added; public salary writes remain absent until subsequent ADR-005 integration. Earlier linkage-absent statements are historical. See TEAM_MODULE.md.

**Purpose:** Map real security checks without inventing framework guards.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

There are two human role classes (active HR Manager and granular-permission member), an INVITED eligibility state, a DELETED access state and a non-login system identity. No platform admin/project-scoped/viewer role enum exists. read alone cannot view salary values or export. Internal policy helpers are not proof of protected business endpoints. See [CONTEXT.md §8](CONTEXT.md#8-api-route-map) for route-ID paths and [WORKFLOW_RULES.md](WORKFLOW_RULES.md) for transitions.

## Role hierarchy and permission matrix

| Identity | read | write | edit | delete | salary:view | export | Team admin |
|---|---|---|---|---|---|---|---|
| ACTIVE HR Manager | implicit | implicit | implicit | implicit | implicit | implicit | yes, with self/system/continuity guards |
| ACTIVE member | assigned | assigned | assigned | assigned | assigned | assigned | no, even if all six are assigned |
| INVITED | no session until eligible OTP acceptance | no | no | no | no | no | no |
| DELETED | no | no | no | no | no | no | no |
| System identity | no login | no | no | no | no | no | no |
| Anonymous | no | no | no | no | no | no | no |

write means create, edit means modify, delete means soft-remove. Business writes/export additionally require read; permissions do not auto-imply it. canChangeSalary requires read+edit+salary:view and employeeId != target; canExportSalary requires read+salary:view+export. HR implicit rights do not bypass self salary/approval/permission rules. Verified employee linkage is still missing before public salary integration.

## Backend check map

| Function / dependency | Actual allowed scope |
|---|---|
| authController origin() | Exact APP_ORIGIN on auth POSTs; explicit CORS allows only APP_ORIGIN and does not replace Origin/CSRF/session authorization |
| AuthenticationService.authenticate / authenticateWithin | ACTIVE non-system user, valid hashed cookie session, nonrevoked/unexpired; optional bound CSRF comparison |
| TeamService.run | Same-transaction current HR; global team lock; bound CSRF for mutations; sets trusted DB actor locally |
| protect_team_identity | Current trusted HR context; no own role/permission changes, no system mutation/permanent delete, last active HR retained |
| OrganizationReferencesService.run | Same-transaction active HR session; bound CSRF for writes; sets local reference actor; allowlisted kind at SQL boundary |
| guard_organization_reference / validate_assignment_references | Immutable IDs, no delete/truncate, automatic versions; active reference rows shared-locked for new assignments |
| policy.can | ACTIVE non-system; HR implicit or specific assigned permission |
| policy.canManageUser | HR and different target ID; **internal helper not used by live TeamService**, which allows own name/conditional removal |
| SQL validate_salary_request/decision | Active non-system HR; requester/subject independence; relies on nullable employee mapping |
| readSalarySnapshot | Same-transaction fresh user, read+salary:view (+export), owner/version/unexpired/noninvalidated snapshot |

There is no Nest AuthGuard, Roles decorator, JWT bearer scope, row-level database role per employee, country scope or project scope. acme_app is a trusted server role, not an end-user login. Never pass a client actorId into an internal salary service.

## Route × dependency matrix

IDs resolve to the canonical [route map](CONTEXT.md#8-api-route-map); this avoids duplicating a third full route list.

| Route IDs | Anonymous / member / HR | Additional checks |
|---|---|---|
| H01,H02 | Public | Only liveness/readiness metadata; readiness deliberately closed |
| A01,A02 | Public request boundary | Origin, strict email, aggregate email/IP limits, eligibility enforced privately; generic 202 |
| A03 | Public verification boundary | Origin, strict UUID/six digits, three attempts, single use, expiry, current account/invite, IP throttle |
| A04 | Valid member or HR session | Fresh identity/status/rights; cookie is not a JWT |
| A05 | Valid member or HR session | Origin+CSRF, persistent revoke and cookie clearing; invalid request 403 |
| T01 | HR only | No system/deleted accounts; bounded offset and 20-row page; anonymous 401/member 403 |
| T02 | HR only | Origin+CSRF; strict role/permissions/name/email; duplicate live email 409; audited seven-day invitation |
| T03 | HR only | UUID+expectedVersion, own role/permission restriction, active-HR continuity and same-transaction audit |
| T04 | HR only | UUID+version; no system or permanent deletion; retain last HR, revoke sessions/OTPs and invalidate snapshots |
| T05 | HR only | Pending INVITED target/version; new expiry, invalidate codes, audit and SMTP notification |
| O01,O04 | HR only | Strict bounded offset, 20 rows/page; includes inactive; anonymous 401/member 403 |
| O02,O05 | HR only | Origin+bound CSRF, strict trimmed name; active/inactive uniqueness, audit atomicity |
| O03,O06 | HR only | Same + UUID, explicit isActive and expectedVersion; stale 409; rename/deactivate/reactivate with stable ID |
| C01 | HR or member with read | Current session; read-only pinned catalogue; N.A. entries listed |
| C02,C04 | HR only | Configured currencies/country policies; country list bounded 20/page |
| C03,C05,C06 | HR only | Exact Origin, bound CSRF, strict DTO, immutable codes, optimistic versions, transactional audit, active-default/precision protections |
| F01,F03 | HR or read member | Fresh session; list history and resolve as-of; no salary:view/export needed for reference rates |
| F02 | HR only | Exact Origin/bound CSRF, strict DTO, active currencies, expectedRevision/pair-date lock, atomic audit |
| E01,E02,E03 | HR or read member | Fresh same-transaction session; no salary fields; removed excluded; no implied salary/write privilege |

## Frontend path × guard

| Path/surface | Guard component | Who sees it / authority |
|---|---|---|
| / foundation and login form | main.tsx, Login local state | Public, no private employee data |
| / signed-in session controls | Login /me revalidation | Any valid account; CSRF cookie alone does not authenticate |
| / Team section (not a /team route) | identity.isHrManager conditional mounts Team | HR only; backend still checks each request |
| / Organization references section | Login identity.isHrManager mounts OrganizationReferences | HR only; current backend session checked on every call |
| Team own-edit controls | self comparison disables role/permission fields | Own name may change; server rechecks actual fields |
| / Countries and currencies | Login checks HR or read permission; CountryCurrency hides admin controls for member | Catalogue read-member/HR; country/currency configuration HR only; backend authoritative |
| / Employee directory/profile | Login HR/read mounts Employees | Backend current-session read checks; non-salary allowlist; no mutations |
| / Exchange rates | Login HR/read mounts FxRates | Read members see history/lookup; HR authoring controls; server authorizes every call |
| Planned employee mutation/report/salary screens | None implemented | No claimed permission enforcement at missing endpoints |

Use independent browser contexts for role testing. Current tests cover HR/member denial, crafted actor/privilege fields, stale versions, own permission changes, both CSRF failures, independent offboarding and last-manager protection. Full cross-module role/action matrix remains blocked by missing modules, not waived. No admin privilege should be inferred from hidden/visible UI controls.
