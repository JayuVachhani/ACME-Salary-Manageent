# Requirement traceability

## Publication verification — 22 November 2026

Required local publication checks passed on this React branch: lint, workspace typechecks/builds, 31 unit tests, QA typing, architecture gate (71 source files / 7,549 assertions), isolated PostgreSQL integrity/authorization/concurrency suites, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The initial reference run exposed a startup identity/OTP race; fresh post-login identity retrieval now cancels and settles the older anonymous query, with a regression test. A later cold login request stalled; the complete 22-case serial rerun passed without relaxed timeouts or authorization checks. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md. No self-approval, merge or production deployment; broader unmet/blocked requirements remain open.

Setup history: incomplete dependencies and a Windows PostgreSQL DLL lock required a clean dependency reinstall and preserved local-instance restart; Prisma was regenerated. An overlapping disposable-database migration hit shared-role contention and the database suites passed serially. No existing database was reset. Historical deferred-check snapshots below do not describe this publication checkpoint.

## Earlier checkpoint records

Current React audit remediation (22 November 2026): shared controls/tables/pagination/request states, employee dependency invalidation, typed notification feedback and accurate delivered-scope copy implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

Rules alignment in progress (22 November 2026): frontend global state now uses Redux Toolkit 2.15.0 / React Redux 9.3.1 and one RTK Query API/cache. Feature-owned endpoints replace custom remote-state effects; server identity is read through useSession from the query cache. Session Context and useResource are removed. Forms, confirmation snapshots and OTP inputs stay local; OTP credentials bypass Redux actions/cache through the same shared secure transport. AppProviders owns store/error-boundary/notification composition; the authenticated workspace is lazy loaded with Suspense. Logout/self-removal/established-session 401 clears cached protected data; 403 refreshes current identity. No API/schema/financial rule changes. **Uncommitted and unverified: no tests, lint, typechecks, builds, safety scans or browser checks were run for this increment, at the user's request.** Existing PR #12 checks cover its published head only; PR #11 backend and PR #10 linkage remain separate pending work.

Status reflects verified scope, not planned completeness. Full module acceptance still requires authenticated API/UI/E2E evidence.

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| ND-08 / ADR-003, FR-EMP-01 prerequisite | OrganizationReferences service/controller/UI; migrations 013/014 | test-organization-references.mjs, e2e-auth/organization-references.spec.ts | Locally tested: 23 DB / 4 reference Chromium cases. Countries/currencies/FX and bands excluded |
| FR-AUTH-07/08/10/11/15/19, OD-03/04/05 | Team service/controller/UI, migration 011 continuity/version and migration 012 audit snapshots | `test-team.mjs` and multi-account `e2e-auth/team.spec.ts` | Implemented; verification evidence recorded in QA report |
| FR-AUTH-01..06, OD-01 | SMTP adapter, auth controller, Login form and persistent challenge/session service | `e2e-auth/authentication.spec.ts`, `test-authentication.mjs` | Login increment tested; broader team module pending |
| FR-AUTH-12/14/17/18 | DB rate events, identity revocation trigger, bootstrap CLI, invitation eligibility | Concurrent rate/OTP tests, current-permission checks, CLI repeat rejection, expired/first-login invite checks | Implemented; deployment/proxy policy and full team workflow acceptance pending |
| FR-AUTH-08/09, approved OD-03/04 | `src/policy.ts` permission primitives | `policy.test.ts` | Internal logic tested; endpoint integration pending |
| NFR-04/06 | `config.ts`, `main.ts` metadata logging/health | `config.test.ts`, `test-health.mjs` | Foundation tested; full security acceptance pending |
| FR-CTRY-01..06, FR-REF-01, ADR-003/004 | CountryCurrency service/controller/UI, catalogue JSON, migrations 015..017 | test-country-currency.mjs and e2e-auth/country-currency.spec.ts | Locally tested: 27 DB / 3 country Chromium cases; policy notes descriptive, no legal automation |
| FR-EMP-05, ND-02 | Effective-dated `employee_assignments` | `test-country-fx-retention.mjs` | Historical assignment/date constraints tested; transfer workflow pending |
| FR-EMP-09 | Migration 002 hold/release/removal triggers | Hold, release, actor and immutability tests | Database tested; API/UI pending |
| FR-REF-02/05, FR-ANA-04/05 | FX service/controller/UI, immutable DB sequence and migration018 audit before/after | test-fx-rates.mjs and fx-rates.spec.ts | Locally verified23 DB /3 FX Chromium cases; PR checks/review and report integration remain pending |
| FR-SAL-05/10/17/18 | Immutable ledger and correction checks; `money.ts` | Money tests and approval-service fixture | Core tested; normal write/lease flows pending |
| FR-SAL-11/12/13 | Migration 004 history snapshots and currency event | Approval history/audit checks | Database foundation tested; timeline/table UI pending |
| FR-APR-01/02 | `salary-approval.ts` submission; separate request storage | Pending/rejected/as-of/precision/date tests | Backend/database tested; authenticated API/UI pending |
| FR-APR-03/04/05 | Decision service, atomic triggers, immutable records | Self/requester/nonmanager denial; stale/parallel/rollback tests | Backend/database tested; UI/session integration pending |
| FR-ANA-02/04/05 | `money.ts` exact FX, direct/inverse/USD lookup | Historical rates, staleness, conversion tests | Domain tested; report query/aggregation pending |
| FR-REP-05 | Snapshot schema/invalidation and `report-access.ts` | Fresh permission read, owner, expiry, access/removal invalidation | Guard tested; report generation/export API/UI pending |
| FR-AUD-01/02/03 | Immutable audit and transactional salary/FX/hold triggers | Runtime/owner protections and forced audit failure | Covered operations tested; full event catalogue/UI pending |
| NFR-07/08 | Migration runner, restricted role, SQL triggers | Identity/rule/approval PostgreSQL suites | Partial: full regression/performance/security gate pending |
| NFR-01 | Isolated synthetic fixtures only so far | Rollback/disposable database tests | 10k deterministic seed pending |

Paths in this table are relative to `apps/api` for TypeScript files and project root for SQL/scripts. Migration scripts retain source-of-truth checks unsupported by Prisma Client.

## P5a and ADR-005 checkpoint

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| FR-EMP-03/08,non-salary FR-EMP-04/07 | Employees service/controller/UI; literal search,UTC assignment,filters,sort,pages,removed exclusion,profile | test-employees.mjs;employees.spec.ts | Locally verified19 PostgreSQL /3 employee Chromium checks; salary band filtering and all mutations not delivered |
| ADR-005 linkage | Approved independent HR/reason/confirmation/unique active link/session+snapshot invalidation/no unlinked salary writes | Future schema/service/UI/security regressions | Approved; not implemented |
| ADR-005 initial salary | Initial salaries pending until independent HR approval,original effective date/provenance preserved | Future atomic employee/request/schema/UI tests | Approved; not implemented; existing initial/backdated-only constraints need forward migrations |
