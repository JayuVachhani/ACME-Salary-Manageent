# Requirement traceability

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
| FR-REF-02/05, FR-ANA-04/05 | FX service/controller/UI, immutable DB sequence and migration018 audit before/after | test-fx-rates.mjs and fx-rates.spec.ts | Implemented; verification in progress; report integration remains pending |
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
