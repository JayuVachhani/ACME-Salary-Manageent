# Requirement traceability

## PR #10 integration — 22 November 2026

PR #10 merged to main at `4509d5fa272ea1e3a3db785affa245d6a7cbdc5d`. This PR #11 checkout merges that base and ports linkage to native `team/team.controller.ts`, `team/team.service.ts` and `team/dto/team.dto.ts`; no legacy controller factory/service is restored. Migration019 is retained unchanged. The shared member response contract includes nullable employee_id for link/list/invite/change/reinvite responses; OpenAPI derives the same projection. The isolated linkage suite now boots the real application, including global validation/security/response boundaries. Existing independent-HR, audit/revocation/version/rollback rules remain. Combined local lint/types/builds, 27 units, all17 linkage SQL/real-HTTP checks, native architecture/OpenAPI (including required employee_id projection and production docs absence), serial isolated database suites and all9 affected authentication/team Chromium cases passed. Final publication/current-head GitHub CI remain pending; earlier branch-only passes below are historical. React PR #12 remains separate until PR #11 is independently merged.

## Earlier checkpoint records

## Publication verification — 22 November 2026

Required local publication checks passed on this NestJS branch: lint, workspace typechecks/builds, 27 unit tests, QA typing, isolated PostgreSQL integrity/authorization/concurrency suites, native NestJS architecture/OpenAPI checks (including production documentation absence), HTTP health smoke, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The FX email-capture case timed out on the first run; its isolated three-case group passed on rerun without timeout or authorization changes. Environment setup failures and deferred-check snapshots below are historical. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md; no self-approval, merge or production deployment is claimed. The broader unmet/blocked requirements remain open.

## Earlier checkpoint records

Current NestJS audit remediation (22 November 2026): pool error handling, shared failure-safe transaction mechanics, typed query/response contracts, exact-origin config and honest committed invitation delivery/audit outcomes implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

NestJS rules alignment (22 November 2026), implemented but unverified: the existing capability modules/native injectable services remain. Concrete request DTO classes feed one APP_PIPE RequestValidationPipe and schema-derived OpenAPI input contracts. All delivered controllers use this path; the old per-parameter ZodValidationPipe is removed. OTP verification alone defers parsing to AuthService to preserve malformed-attempt throttling/audit. APP_FILTER HttpExceptionFilter handles application/framework/unknown failures with a safe 5xx fallback and preserves readiness's intentional 503 body. RequestContextMiddleware owns correlation/logging/no-store; CORS is limited to configured APP_ORIGIN. Development/test-only /api/docs, /api/openapi.json and /api/openapi.yaml document delivered routes using Swagger 12.1.2. No financial/schema/permission/session policy changes. No tests, lint, typechecks, builds, safety scans or browser checks ran for this increment, per user instruction. Changes remain uncommitted/unpublished; historical passes do not validate this working tree.

Backend structure verification (22 November 2026): AppModule/feature modules now own DI and routing; explicit factory providers preserve service transaction boundaries. scripts/test-architecture.mjs covers real container wiring, module isolation, unchanged route rejection contracts and shutdown drain ordering. No requirement status is promoted solely because source files moved. See BACKEND_STRUCTURE_AUDIT.md.

Status reflects verified scope, not planned completeness. Full module acceptance still requires authenticated API/UI/E2E evidence.

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| ND-08 / ADR-003, FR-EMP-01 prerequisite | OrganizationReferences service/controller/UI; migrations 013/014 | test-organization-references.mjs, e2e-auth/organization-references.spec.ts | Locally tested: 23 DB / 4 reference Chromium cases. Countries/currencies/FX and bands excluded |
| FR-AUTH-07/08/10/11/15/19, OD-03/04/05 | Team service/controller/UI, migration 011 continuity/version and migration 012 audit snapshots | `test-team.mjs` and multi-account `e2e-auth/team.spec.ts` | Implemented; verification evidence recorded in QA report |
| FR-AUTH-01..06, OD-01 | SMTP adapter, auth controller, Login form and persistent challenge/session service | `e2e-auth/authentication.spec.ts`, `test-authentication.mjs` | Login increment tested; broader team module pending |
| FR-AUTH-12/14/17/18 | DB rate events, identity revocation trigger, bootstrap CLI, invitation eligibility | Concurrent rate/OTP tests, current-permission checks, CLI repeat rejection, expired/first-login invite checks | Implemented; deployment/proxy policy and full team workflow acceptance pending |
| FR-AUTH-08/09, approved OD-03/04 | `src/policy.ts` permission primitives | `policy.test.ts` | Internal logic tested; endpoint integration pending |
| NFR-04/06 | `config/config.ts`, `main.ts` metadata logging/health | `config.test.ts`, `test-health.mjs` | Foundation tested; full security acceptance pending |
| FR-CTRY-01..06, FR-REF-01, ADR-003/004 | CountryCurrency service/controller/UI, catalogue JSON, migrations 015..017 | test-country-currency.mjs and e2e-auth/country-currency.spec.ts | Locally tested: 27 DB / 3 country Chromium cases; policy notes descriptive, no legal automation |
| FR-EMP-05, ND-02 | Effective-dated `employee_assignments` | `test-country-fx-retention.mjs` | Historical assignment/date constraints tested; transfer workflow pending |
| FR-EMP-09 | Migration 002 hold/release/removal triggers | Hold, release, actor and immutability tests | Database tested; API/UI pending |
| FR-REF-02/05, FR-ANA-04/05 | FX service/controller/UI, immutable DB sequence and migration018 audit before/after | test-fx-rates.mjs and fx-rates.spec.ts | Locally verified23 DB /3 FX Chromium cases; PR checks/review and report integration remain pending |
| FR-SAL-05/10/17/18 | Immutable ledger and correction checks; `common/domain/money.ts` | Money tests and approval-service fixture | Core tested; normal write/lease flows pending |
| FR-SAL-11/12/13 | Migration 004 history snapshots and currency event | Approval history/audit checks | Database foundation tested; timeline/table UI pending |
| FR-APR-01/02 | `salary/salary-approval.service.ts` submission; separate request storage | Pending/rejected/as-of/precision/date tests | Backend/database tested; authenticated API/UI pending |
| FR-APR-03/04/05 | Decision service, atomic triggers, immutable records | Self/requester/nonmanager denial; stale/parallel/rollback tests | Backend/database tested; UI/session integration pending |
| FR-ANA-02/04/05 | `common/domain/money.ts` exact FX, direct/inverse/USD lookup | Historical rates, staleness, conversion tests | Domain tested; report query/aggregation pending |
| FR-REP-05 | Snapshot schema/invalidation and `reports/report-access.ts` | Fresh permission read, owner, expiry, access/removal invalidation | Guard tested; report generation/export API/UI pending |
| FR-AUD-01/02/03 | Immutable audit and transactional salary/FX/hold triggers | Runtime/owner protections and forced audit failure | Covered operations tested; full event catalogue/UI pending |
| NFR-07/08 | Migration runner, restricted role, SQL triggers | Identity/rule/approval PostgreSQL suites | Partial: full regression/performance/security gate pending |
| NFR-01 | Isolated synthetic fixtures only so far | Rollback/disposable database tests | 10k deterministic seed pending |

Paths in this table are relative to `apps/api` for TypeScript files and project root for SQL/scripts. Migration scripts retain source-of-truth checks unsupported by Prisma Client.

## P5a and ADR-005 checkpoint

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| FR-EMP-03/08,non-salary FR-EMP-04/07 | Employees service/controller/UI; literal search,UTC assignment,filters,sort,pages,removed exclusion,profile | test-employees.mjs;employees.spec.ts | Locally verified19 PostgreSQL /3 employee Chromium checks; salary band filtering and all mutations not delivered |
| ADR-005 linkage | TeamService.linkEmployee; PATCH team/:id/employee-link; migration019 confirmed independent HR guard, audit, revocation and snapshot invalidation | test-employee-linkage.mjs: isolated SQL/service/HTTP security and concurrency regressions | Backend implemented; UI pending; no public salary writes exposed. Full salary guard integration remains pending |
| ADR-005 initial salary | Initial salaries pending until independent HR approval,original effective date/provenance preserved | Future atomic employee/request/schema/UI tests | Approved; not implemented; existing initial/backdated-only constraints need forward migrations |
