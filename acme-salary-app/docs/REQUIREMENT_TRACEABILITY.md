## 10,000-employee performance experiment — 23 November 2026

Isolated real HTTP/PostgreSQL baseline completed10,000 payroll employees in100 bounded runs: preparation89.38seconds and independent review/finalization635.05seconds,with zero unexpected HTTP errors and10,000 finalized allocations. Engineering qualification is partial: baseline draft-list and finalized-payslip p95 exceeded1second. A measured shared-eligibility draft query reduced p95 from1,030.42ms to486.07ms in a quiet read recheck; all quiet read gates passed. Concurrent-load salary search still showed a1,160.91ms p95 miss. Finalized-payslip baseline1,124.41ms remains unqualified. Do not infer production/10k simultaneous-user capacity.

Backend lint/types/build,27 units and7 financial HTTP/SQL groups passed after the query change,including list count/value/empty-page checks. Original installed acme_app and data were untouched; random test databases were removed. No schema change. Exact workload,metrics,host limits and reproducible harness: acme-salary-app/docs/PERFORMANCE_10K.md and PERFORMANCE_10K_RESULTS.json. The user authorized a local commit after reviewing these partial results; source/report are on chore/payroll-10k-performance. No push performed. Earlier all-product/15k/soak gaps remain open.

## Earlier checkpoint records
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

Monthly revisions, same-date correction chains, backdated requests, approval context and immutable salary history are implemented in source. Migration 022 was applied to installed local acme_app without resetting data; Prisma client generation and formatter writes are implementation actions, not test passes. Today/future entries retain the management-review badge and count once effective; past entries await independent linked HR approval. Initial salaries still require independent approval for every date. Reports, transfers, bands and full 10k capacity/product acceptance remain incomplete. See the [canonical salary module](SALARY_MODULE.md) and root README for contracts/manual instructions.

## Earlier checkpoint records

## Local publication verification — 23 November 2026

The push request authorizes verification. Backend gates and32 new employee SQL/HTTP checks passed; frontend9 units/lint/types/build/architecture and12 foundation Chromium cases passed. All23 delivered Chromium cases also passed across the final corrected groups. Publication hooks and exact-head GitHub CI remain pending. This supersedes earlier deferred-verification snapshots without claiming full-product or10k capacity acceptance. See [current QA report](../QA_EXECUTION_REPORT.md) and Git ledger for actual results; no push/CI success inferred.

## Employee profile presentation — 23 November 2026

Employee details now open in a responsive modal with Overview and permission-aware Salary & history tabs; editing/confirmation/lease rules remain. Shared modal/tabs own keyboard/focus behavior. Source implementation is unverified; no tests/lint/types/build/browser/safety execution, commit or push. Current details: [employee module](EMPLOYEE_DIRECTORY_MODULE.md).

## Demo data and navigation — 23 November 2026

Executed the explicit synthetic seed in local acme_app: 10,000 DEMO employees, 9,990 independently approved initial salaries, 8 pending and 2 rejected requests, using existing active INR. Demo HR accounts are independently linked; existing accounts/data remain preserved. Script owns a transaction/advisory lock and completed-seed audit marker; no reset or overwrite. Sidebar/Home are grouped by People, Salary and Settings with existing permission filtering. Accounts, sample codes, fictional policy labels and repeat command are in [the current runbook](../../README.md). Seeding is not a test/load pass; verification, commit and push remain deferred. No full salary-product completion claimed.

## Employee / initial salary checkpoint — 23 November 2026

Employee creation/initial approval, protected salary reads, personal edits/leases and linkage UI now map to implemented-but-unverified source. Remaining salary/report/load acceptance is pending. Full current contracts and deferred acceptance scenarios: [employee module](EMPLOYEE_DIRECTORY_MODULE.md). Tests/checks remain deferred at client request; changes are local/uncommitted/unpushed.

# Requirement traceability

## Independent package publication checks — 23 November 2026

The commit/push request authorizes verification. Independently installed frontend passed format,React lint,strict types,9 units,Vite production build and architecture71/7550. Backend passed format,lint,types,27 units,Prisma generation,official Nest CLI build,native architecture/OpenAPI and production-doc isolation. QA typing/formatting/proxy checks and all4 Git hook rejection/acceptance checks passed; safety regression passed. Serial isolated PostgreSQL integrity/auth/team/reference/country/FX/employee/approval suites and17 linkage SQL/HTTP checks passed. All12 foundation Chromium cases passed. Source comparison confirms all19 migration files and all75 frontend source files unchanged apart from relocation; only config/config.module.ts changes among81 backend source files. All22 delivered Chromium cases passed in the complete serial run without retries. Native Nest CLI watch and Vite development startup/proxy checks passed on isolated ports; those test-owned processes were stopped. First309-file indexed scan and whitespace checks passed. Final hook-gated commit/push and exact-head GitHub CI remain pending; no pending check is a pass. Historical report generation now writes only ignored QA artifacts rather than overwriting canonical documents. Earlier implementation-only records below are historical; no production completion/approval/merge claimed.


## Independent application ownership — 22 November 2026

Current implementation on `chore/independent-app-packages`: root frontend/ and backend/ are independent npm projects with separate lockfiles,strict TypeScript,ESLint,Prettier,tests,environment templates and native scripts. Frontend uses React19/Vite8,app/node TS projects and React hooks/refresh lint rules. Backend uses Nest12 CLI/nest-cli.json/tsconfig.build.json and official @nestjs/config with the existing safe Zod validation. Backend owns PostgreSQL/Prisma/migrations/bootstrap; no SQL or salary/permission policy is changed. QA is an independent qa/ package. tools/quality owns Git orchestration only; root has no package.json or framework configuration. Husky delegates to package-native checks. CI installs/checks each package independently.

Old acme-salary-app/ now contains canonical documentation and ignored legacy local artifacts only. The previous local PostgreSQL cluster remains untouched; backend local-start reuses it when present. Existing server .env copied only into ignored backend/.env. Frontend receives no secrets. See [manual run steps](../README.md) from acme-salary-app,or root README.md from the repository. No test/lint/type/build/browser/safety verification,staging,commit or push performed for this increment under the implementation-first rule. Package installation/configuration are not test passes. Earlier workspace paths/check results below are historical; source links have been mapped to the current owners.

## Earlier checkpoint records

## Combined React/NestJS reconciliation — 22 November 2026

PR #10 linkage and PR #11 native NestJS architecture are merged to main at `8b8d7ed344d0eb1b6d05e5dd891786db0d9edc9a`. Existing PR #12 now merges this base, preserving all backend feature modules, DTO/global validation/OpenAPI, migration019 and linkage protections alongside Redux Toolkit/RTK Query and shared React controls. Both architecture commands remain in CI. React Account models the nullable employee_id response; this reconciliation adds no linkage UI or salary workflow. Lockfile contains both Swagger and Redux dependencies. Combined local lint/types/builds,36 units,QA typing,React architecture71/7550,Nest architecture/OpenAPI,serial isolated PostgreSQL suites and17 linkage SQL/HTTP checks passed. The initial FX browser assertion raced a successful second save by matching a retained toast; the helper now awaits the current POST201 and dialog closure. All3 FX cases passed unchanged application code; QA typing passed again. All22 delivered browser cases passed across the completed groups (9auth/team,4references,3country,3FX,3employees). The initial FX failure remains historical, with no relaxed timeout/assertion or application change. Final safety scan,publication and exact-head CI are in progress; earlier branch-only passes and deferred-check snapshots below are historical. No self-approval/merge/deployment; unrelated user files remain excluded.

## Earlier checkpoint records

## Publication verification — 22 November 2026

Required local publication checks passed on this React branch: lint, workspace typechecks/builds, 31 unit tests, QA typing, architecture gate (71 source files / 7,549 assertions), isolated PostgreSQL integrity/authorization/concurrency suites, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The initial reference run exposed a startup identity/OTP race; fresh post-login identity retrieval now cancels and settles the older anonymous query, with a regression test. A later cold login request stalled; the complete 22-case serial rerun passed without relaxed timeouts or authorization checks. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md. No self-approval, merge or production deployment; broader unmet/blocked requirements remain open.

Setup history: incomplete dependencies and a Windows PostgreSQL DLL lock required a clean dependency reinstall and preserved local-instance restart; Prisma was regenerated. An overlapping disposable-database migration hit shared-role contention and the database suites passed serially. No existing database was reset. Historical deferred-check snapshots below do not describe this publication checkpoint.

## Earlier checkpoint records

Current React audit remediation (22 November 2026): shared controls/tables/pagination/request states, employee dependency invalidation, typed notification feedback and accurate delivered-scope copy implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

Rules alignment in progress (22 November 2026): frontend global state now uses Redux Toolkit 2.15.0 / React Redux 9.3.1 and one RTK Query API/cache. Feature-owned endpoints replace custom remote-state effects; server identity is read through useSession from the query cache. Session Context and useResource are removed. Forms, confirmation snapshots and OTP inputs stay local; OTP credentials bypass Redux actions/cache through the same shared secure transport. AppProviders owns store/error-boundary/notification composition; the authenticated workspace is lazy loaded with Suspense. Logout/self-removal/established-session 401 clears cached protected data; 403 refreshes current identity. No API/schema/financial rule changes. **Uncommitted and unverified: no tests, lint, typechecks, builds, safety scans or browser checks were run for this increment, at the user's request.** Existing PR #12 checks cover its published head only; PR #11 backend and PR #10 linkage remain separate pending work.
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
