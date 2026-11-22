# ACME — handoff validation report

## Combined React/NestJS reconciliation — 22 November 2026

PR #10 linkage and PR #11 native NestJS architecture are merged to main at `8b8d7ed344d0eb1b6d05e5dd891786db0d9edc9a`. Existing PR #12 now merges this base, preserving all backend feature modules, DTO/global validation/OpenAPI, migration019 and linkage protections alongside Redux Toolkit/RTK Query and shared React controls. Both architecture commands remain in CI. React Account models the nullable employee_id response; this reconciliation adds no linkage UI or salary workflow. Lockfile contains both Swagger and Redux dependencies. Combined local lint/types/builds,36 units,QA typing,React architecture71/7550,Nest architecture/OpenAPI,serial isolated PostgreSQL suites and17 linkage SQL/HTTP checks passed. The initial FX browser assertion raced a successful second save by matching a retained toast; the helper now awaits the current POST201 and dialog closure. All3 FX cases passed unchanged application code; QA typing passed again. All22 delivered browser cases passed across the completed groups (9auth/team,4references,3country,3FX,3employees). The initial FX failure remains historical, with no relaxed timeout/assertion or application change. Final safety scan,publication and exact-head CI are in progress; earlier branch-only passes and deferred-check snapshots below are historical. No self-approval/merge/deployment; unrelated user files remain excluded.

## Earlier checkpoint records

## Publication verification — 22 November 2026

Required local publication checks passed on this React branch: lint, workspace typechecks/builds, 31 unit tests, QA typing, architecture gate (71 source files / 7,549 assertions), isolated PostgreSQL integrity/authorization/concurrency suites, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The initial reference run exposed a startup identity/OTP race; fresh post-login identity retrieval now cancels and settles the older anonymous query, with a regression test. A later cold login request stalled; the complete 22-case serial rerun passed without relaxed timeouts or authorization checks. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md. No self-approval, merge or production deployment; broader unmet/blocked requirements remain open.

Setup history: incomplete dependencies and a Windows PostgreSQL DLL lock required a clean dependency reinstall and preserved local-instance restart; Prisma was regenerated. An overlapping disposable-database migration hit shared-role contention and the database suites passed serially. No existing database was reset. Historical deferred-check snapshots below do not describe this publication checkpoint.

## Earlier checkpoint records

Current React audit remediation (22 November 2026): shared controls/tables/pagination/request states, employee dependency invalidation, typed notification feedback and accurate delivered-scope copy implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

Current increment: Redux Toolkit/RTK Query, session-cache lifecycle, lazy workspace and error-boundary changes are implemented but unverified (22 November 2026). The user requested implementation first and checks only when explicitly requested. No tests, lint, typechecks, builds, browser QA or safety scans ran for this increment; existing pass records below are historical and do not cover the working tree. Do not commit/push until required verification is authorized and completed. See FRONTEND_ARCHITECTURE_AUDIT.md in acme-salary-app/docs for the current source map.

## React architecture verification — 22 November2026

Use `npm run test:web-architecture` from acme-salary-app (also in CI), plus lint/typecheck/test/build/qa:typecheck. Vitest includes web transport tests: total28unit tests, preserving22backend tests. Browser regression AUTH-E2E-01 now restores a server session after removing only the CSRF hint and checks one completed /me response; EMP-E2E-03 delays a profile, switches employee, requires cancellation and rejects stale profile output. All existing business assertions remain. Foundation console QA explicitly records expected anonymous /me401; /me500 and other unexpected errors still fail. The existing health display timeout remains controlled by the browser clock. Current source boundaries and audit are in docs/FRONTEND_ARCHITECTURE_AUDIT.md; exact final execution/publication disposition is in GIT_CHANGELOG.md and the PR timeline. Documentation-only verification is not a new application test pass; incomplete salary/reporting requirements remain open.
## PR #10 integration — 22 November 2026

PR #10 merged to main at `4509d5fa272ea1e3a3db785affa245d6a7cbdc5d`. This PR #11 checkout merges that base and ports linkage to native `team/team.controller.ts`, `team/team.service.ts` and `team/dto/team.dto.ts`; no legacy controller factory/service is restored. Migration019 is retained unchanged. The shared member response contract includes nullable employee_id for link/list/invite/change/reinvite responses; OpenAPI derives the same projection. The isolated linkage suite now boots the real application, including global validation/security/response boundaries. Existing independent-HR, audit/revocation/version/rollback rules remain. Combined local lint/types/builds, 27 units, all17 linkage SQL/real-HTTP checks, native architecture/OpenAPI (including required employee_id projection and production docs absence), serial isolated database suites and all9 affected authentication/team Chromium cases passed. Final publication/current-head GitHub CI remain pending; earlier branch-only passes below are historical. React PR #12 remains separate until PR #11 is independently merged.

## Earlier checkpoint records

## Publication verification — 22 November 2026

Required local publication checks passed on this NestJS branch: lint, workspace typechecks/builds, 27 unit tests, QA typing, isolated PostgreSQL integrity/authorization/concurrency suites, native NestJS architecture/OpenAPI checks (including production documentation absence), HTTP health smoke, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The FX email-capture case timed out on the first run; its isolated three-case group passed on rerun without timeout or authorization changes. Environment setup failures and deferred-check snapshots below are historical. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md; no self-approval, merge or production deployment is claimed. The broader unmet/blocked requirements remain open.

## Earlier checkpoint records

Current NestJS audit remediation (22 November 2026): pool error handling, shared failure-safe transaction mechanics, typed query/response contracts, exact-origin config and honest committed invitation delivery/audit outcomes implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

Current NestJS rules increment is implemented but unverified. The user explicitly deferred tests, lint, typechecks, builds, safety scans and browser checks until requested. No checks or new CI ran. Existing pass/failure records below are historical. Global DTO metadata/guard order, malformed OTP audit/throttling, response/error contracts, read-only OpenAPI generation and production route absence require later verification; existing architecture assertions must follow the new global pipeline without suppressing real failures. See acme-salary-app/docs/BACKEND_STRUCTURE_AUDIT.md.

NestJS rules alignment (22 November 2026), implemented but unverified: the existing capability modules/native injectable services remain. Concrete request DTO classes feed one APP_PIPE RequestValidationPipe and schema-derived OpenAPI input contracts. All delivered controllers use this path; the old per-parameter ZodValidationPipe is removed. OTP verification alone defers parsing to AuthService to preserve malformed-attempt throttling/audit. APP_FILTER HttpExceptionFilter handles application/framework/unknown failures with a safe 5xx fallback and preserves readiness's intentional 503 body. RequestContextMiddleware owns correlation/logging/no-store; CORS is limited to configured APP_ORIGIN. Development/test-only /api/docs, /api/openapi.json and /api/openapi.yaml document delivered routes using Swagger 12.1.2. No financial/schema/permission/session policy changes. No tests, lint, typechecks, builds, safety scans or browser checks ran for this increment, per user instruction. Changes remain uncommitted/unpublished; historical passes do not validate this working tree.

## Nest structure verification — 22 November 2026

The chore/nestjs-backend-structure refactor preserves existing HTTP/SQL contracts and moves sources into capability folders. verify:foundation passes (22 units, lint, both types/builds). Isolated authentication/team22/references23/country27/FX23/employees19 checks, approvals38, transactional rules23, Prisma/health and QA typing pass. Run `npm run build -w @acme/api` before the added `npm run test:architecture`; it boots real Nest modules, checks shared/private DI, six feature route rejections, headers and ordered OTP drain/pool shutdown without database access. This gate is included in PR validation. Exact final Chromium/lifecycle/CI results are recorded in GIT_CHANGELOG.md; pending runs are not passes. Historical full-system gaps remain open.

## Merged linkage checkpoint

22 November 2026 backend delta supersedes earlier linkage-absent inventories: migration019 adds two SQL functions/two row triggers, no columns/tables; PATCH team/:id/employee-link adds one HTTP operation, GET team adds employee_id. Sources: TEAM_MODULE.md, team/team.service.ts, team/team.controller.ts, team/dto/team.dto.ts and 019_verified_employee_linkage.sql. No new env/dependency/provider/deployment boundary. Executed evidence belongs to QA_EXECUTION_REPORT.md and GIT_CHANGELOG.md; these documentation updates alone do not establish application passes.

**Purpose:** Record documentation coverage against the merged implementation and distinguish static verification from runtime tests.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

The documentation now covers the P4c FX administration increment on merged PR #7: 27 concrete API operations, 23 tables / 178 scalar fields, 18 forward migrations, 28 SQL functions and two views. This is a scoped implementation and verification checkpoint, not production acceptance. Historical evidence below retains its original scope; current FX verification is recorded separately.

## Historical documentation publication result (PR #6)

PASS: 590 checks, 14 deliverables, 190 relative links/anchors, 18 routes, 22 models / 172 scalar fields, 14 migrations / 24 functions / two views, and 16 API configuration settings plus 11 tooling/service settings. The local verification script is ignored test tooling, not an application change. Whitespace and staged secret-safety results are checked separately before commit.

## Historical P4b verification scope

Country/currency APIs add six operations (C01..C06), currency_catalogue adds five fields and configured currencies adds version. Migrations 015..017 bring totals to 17 migrations / 28 functions / two views, 23 tables / 178 scalar fields and 24 concrete API operations. No new environment variables. ADR-004 records catalogue/activation interpretation. Source routes, Prisma fields, migrations/functions, links and CI commands must be rechecked before committing. The prior 590-check result below records PR #6, not this increment. P4b runtime results are in QA_EXECUTION_REPORT.md; unresolved full-system and production gates remain.

## Historical PR #6 verification scope and checks

- Inventory: all 14 required Markdown files have purpose/date/executive summary and relative cross-links; AGENTS.md is the entry point.
- API: all 18 concrete operations are mapped in CONTEXT §8 and README §7. Organization reference kind expands to departments/designations; these are three patterns / six operations, not six independent controllers.
- Configuration: all 16 API settings and 11 tooling/service settings (27 total) are documented; required values and missing template owner URL are called out. No actual environment/credential file was copied.
- Schema: all 22 Prisma table models and 172 scalar fields are documented. All 14 migrations, final definitions of 24 named SQL functions and two views are indexed. Migrations 013/014 and current organization-reference protections are included, not treated as future work.
- Authorization/workflows: current HR session, same-transaction Origin/CSRF checks, immutable reference identities, stale versions, inactive assignment rejection and before/after audit are mapped. Country/currency/FX administration and verified employee linkage remain incomplete; salary bands are deferred by ADR-003.
- Links/headings: relative file targets and Markdown anchors are checked against local files after URL decoding; fenced-code headings are excluded from anchor parsing. No uploaded-brief dependency is required by the published pack.
- Source integrity: this branch changes documentation only. The source inventory contains the 112 tracked implementation/policy/requirement files at the merged baseline; the 14 handoff files are separate additions.
- Publication: chore/update-handoff-docs starts from origin/main after MCP-confirmed PR #5 merge. Completed documentation is committed/pushed only after static/whitespace/safety checks. See GIT_CHANGELOG.md and the documentation PR for actual commit/push/CI status; this report does not pre-claim a push or current-head CI pass.

## Runtime evidence — historical, not newly executed here

MCP verified merged PR #5 head `d84ba8ec7b77b1e97bfea1bcb70a5ef0e0b355ef` passed [Actions run 44997876398](https://github.com/JayuVachhani/ACME-Salary-Manageent/actions/runs/44997876398), job 137132754960. Actual logs recorded 22 unit tests, 72 prior domain PostgreSQL checks, authentication regressions, 22 team and 23 reference PostgreSQL checks, typing/Git safety, and 12 foundation + 9 auth/team + 4 reference Chromium cases. [Review 6011039334](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/5#pullrequestreview-6011039334) records actual-code review and exact-head CI. PR #5 is now merged at the source SHA above.

Earlier full-requirements probe results (3 passed / 11 failed at the team checkpoint; original 12/14 and 45 dependent blockers) describe distinct historical runs. No full-system E2E, performance, production SMTP/TLS or release acceptance is claimed. The documentation PR's own checks must pass independently.

## Known discrepancies and five hygiene follow-ups

1. **Legacy requirement prose:** approved precedence banners resolve 24-hour OTP/self-edit conflicts, but original historical paragraphs remain. Read DECISIONS.md first; consolidate old text only while preserving traceability.
2. **Onboarding configuration:** .env.example omits MIGRATION_DATABASE_URL; Compose uses 5432 and does not provision the runtime role, whereas the Windows launcher uses 55432. Runbook documents this; application fixes remain separate work.
3. **Operational readiness:** /readyz always returns 503; no production deployment/backup/restore/proxy policy exists. Do not reinterpret green scoped CI as production acceptance.
4. **Contract/schema coverage:** repeat route/env/model/function/command checks when code changes; consider an approved persistent docs gate rather than relying on stale snapshot counts.
5. **QA history/status:** preserve failed/missing-module evidence with run scope; maintain current roadmap/backlog and merge status separately from historical checkpoints. Public employee/salary/report workflows remain absent.

## Handoff index

- [AGENTS.md](AGENTS.md)
- [CONTEXT.md](CONTEXT.md)
- [README.md](README.md)
- [DATA_MODEL.md](DATA_MODEL.md)
- [WORKFLOW_RULES.md](WORKFLOW_RULES.md)
- [RBAC.md](RBAC.md)
- [LLM_CONTRACTS.md](LLM_CONTRACTS.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [ROADMAP.md](ROADMAP.md)
- [BACKLOG.md](BACKLOG.md)
- [ORCHESTRATION.md](ORCHESTRATION.md)
- [SMOKE_TESTS.md](SMOKE_TESTS.md)
- [SMTP_INTEGRATION.md](SMTP_INTEGRATION.md)
- [VALIDATION_REPORT.md](VALIDATION_REPORT.md)

P4b fresh static check: 631 checks PASS, 203 relative links/anchors, 24 routes, 23 models/178 scalar fields, 17 migrations/28 functions/two views, unchanged 16 API settings. Current DB/browser evidence is in QA_EXECUTION_REPORT.md; the final supported-default guard DB/browser retest passed; current-head CI and independent review remain required before approval. Historical PR #6 inventories above are explicitly historical, not current totals.

P4b feature head 4da4bc7 passed GitHub run 45006067281/job 137157825998, verified through MCP status and decoded logs (27 new DB checks; 12+9+4+3 Chromium cases plus existing lower-level gates). Actual-code review 6011436419 is COMMENT only. PR #7 subsequently passed final-head checks and was merged by the user at0e0fb86; the agent did not approve or merge it. Publication identities/push state are in GIT_CHANGELOG.md and linked PR reviews.

Port-isolation local retest: qa:typecheck and all test:login groups PASS (9 auth/team, 4 reference, 3 country Chromium cases; zero retries/skips). All group processes returned status 0; ignored diagnostics qa-artifacts/country-port-isolation.log. No application logic changed by this harness fix. Current-head GitHub CI remains required; the failed b8667c5 run remains recorded, not relabeled.

## P4c current verification

Fresh static validation:644 checks PASS,14 required files,207 relative links/anchors,27 concrete routes,23 models/178 scalar fields,18 migrations/28 SQL functions/two views and16 API settings. Existing11 tooling/service settings remain unchanged. Scoped runtime:23 FX +27 country/currency +23 organization-reference +22 team PostgreSQL checks,authentication persistence,72 foundation-domain PostgreSQL checks,22 units,Prisma/health,lint/type/build,QA typing and19 authenticated Chromium cases passed. Mobile axe failure was fixed and retested without suppressing the assertion; failed setup/native-crash attempts remain recorded in QA_EXECUTION_REPORT.md. Foundation Chromium and GitHub current-head checks are separately reported there and in the PR. No complete salary-management/production acceptance is claimed.

## P5a directory checkpoint

Read-only employee directory/profile integrates GET employees,employees/filters,employees/:id with fresh HR/read checks; no salary payload or mutation. Current assignment excludes future dates,removed employees excluded,literal wildcard search and fixed sorting/paging. No migration/schema/config/external service added. test:employees plus fifth isolated test:login Chromium group (4827/4828,SMTP4325 sequential),artifacts employees. Local19 directory DB /3 directory Chromium and34 scoped browser checks passed; exact-head CI/review pending; see QA_EXECUTION_REPORT.md. [Employee contract](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). ADR-005 linkage and initial salary approval are approved future integration requirements; do not treat this directory as employee creation/approval completion.

Browser runtime update: Playwright now serves built web assets through scripts/qa-web-server.mjs (loopback Node HTTP,strict port,existing QA_API_PORT proxy); npm run dev remains development only. Build before qa:e2e; test:login builds itself. Repeated native dev/preview exits3221226505 are retained failures,root cause unproven. See [browser test runtime](../acme-salary-app/docs/BROWSER_TEST_RUNTIME.md); no deployment or retry/assertion change.

CI also runs `npm.cmd run test:qa-web` to verify real built-static path/MIME/HEAD protections and API proxy method/query/Origin/body/cookies/health/error behavior. No new config or dependency.

P5a fresh static verification:669 checks PASS,14 files,222 relative links/anchors,30 concrete routes,23 models/178 scalar fields,18 migrations/28 functions/two views,16 API settings unchanged. Scoped local execution19 employee DB,4 QA-WEB HTTP groups,22 units,72 foundation DB,Prisma/health/lint/types/build/QA typing,and34 Chromium checks PASS. Existing local runtime URL mismatch handled only in ignored test subprocess override; .env unchanged. Earlier native/axe/locator/startup failures remain retained; independent PR review and current-head CI still required.

Runtime follow-up:CI4705f3b failed before FX/employee browser execution; c378a3d passed independently on old runtime. Both outcomes are retained. Minimum/CI runtime now24.20.0 for relevant upstream Windows libuv fix; exact crash match remains inference. Local official executable checksum verified in ignored tooling,global Node/.env unchanged. Current24.20-head CI/review required; static schema/route counts unchanged.

Local React verification: all34 scoped Chromium checks PASS (12foundation +9auth/team +4references +3country/currency +3FX +3employees; zero retries). Includes no-CSRF-hint session restoration/one completed identity read and profile cancellation; focused strengthened-cancellation rerun also PASS3employee cases.28units,lint,workspace types/builds,QA typing and54source React architecture gate PASS. Existing CSS is byte-identical; no backend/schema/env/lockfile/runtime-dependency change. One moved-source Markdown link checked with no missing target; mobile employee screenshot inspected. Sandbox Vite EPERM was resolved through authorized test execution; no test failure is relabelled as a pass. Final push/current-head CI remains separately verified below.
Final local structure checkpoint: real Nest architecture/lifecycle test PASS after the composition-root cleanup change; final API build, workspace typecheck and lint PASS. All five delivered Chromium groups PASS (9 authentication/team +4 references +3 country/currency +3 FX +3 employee =22; zero retries). Existing future-requirement failures remain unchanged and are not a full-system acceptance pass. Script import and decorator inventories verified; no schema, environment, permission or route additions/removals. Staging safety and whitespace verified before commit. GitHub exact-head results remain separate from local execution.

Final complete-conversion verification: all22 delivered Chromium tests PASS in the serial run (9auth/team,4references,3country/currency,3FX,3employees; zero retries). Final architecture/guard/pipe/filter/lifecycle test PASS, lint/API+web build/workspace+QA types PASS,22unit tests PASS; isolated authentication/team22/references23/country27/FX23/employees19/approvals38/health PASS. The earlier7PASS/2FAIL browser timeout attempt remains historical evidence, not erased or relabeled. Current application-wide requirement failures/blockers remain open. Exact-head GitHub CI and independent review remain separate publication gates.
