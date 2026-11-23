## Engineering/security assessment update — 23 November 2026

The [repeatable adversarial suite and current results](../acme-salary-app/docs/ENGINEERING_SECURITY_ASSESSMENT.md) supplement these manual instructions. Build the backend, configure only a disposable local test server and run `npm --prefix backend run test:security`; the script creates/drops its own randomly named fixture database and rejects the installed default port. Existing working/demo data must not be reset. Nine groups passed locally; readiness/performance/production and broader requirement gaps remain open. No current-head CI result is claimed for uncommitted changes.

## Earlier checkpoint records

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

Monthly revisions, same-date correction chains, backdated requests, approval context and immutable salary history are implemented in source. Migration 022 was applied to installed local acme_app without resetting data; Prisma client generation and formatter writes are implementation actions, not test passes. Today/future entries retain the management-review badge and count once effective; past entries await independent linked HR approval. Initial salaries still require independent approval for every date. Reports, transfers, bands and full 10k capacity/product acceptance remain incomplete. See the [canonical salary module](../acme-salary-app/docs/SALARY_MODULE.md) and root README for contracts/manual instructions.

## Earlier checkpoint records

## Local publication verification — 23 November 2026

The push request authorizes verification. Backend gates and32 new employee SQL/HTTP checks passed; frontend9 units/lint/types/build/architecture and12 foundation Chromium cases passed. All23 delivered Chromium cases also passed across the final corrected groups. Publication hooks and exact-head GitHub CI remain pending. This supersedes earlier deferred-verification snapshots without claiming full-product or10k capacity acceptance. See [current QA report](../acme-salary-app/QA_EXECUTION_REPORT.md) and Git ledger for actual results; no push/CI success inferred.

## Employee profile presentation — 23 November 2026

Employee details now open in a responsive modal with Overview and permission-aware Salary & history tabs; editing/confirmation/lease rules remain. Shared modal/tabs own keyboard/focus behavior. Source implementation is unverified; no tests/lint/types/build/browser/safety execution, commit or push. Current details: [employee module](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md).

## Demo data and navigation — 23 November 2026

Executed the explicit synthetic seed in local acme_app: 10,000 DEMO employees, 9,990 independently approved initial salaries, 8 pending and 2 rejected requests, using existing active INR. Demo HR accounts are independently linked; existing accounts/data remain preserved. Script owns a transaction/advisory lock and completed-seed audit marker; no reset or overwrite. Sidebar/Home are grouped by People, Salary and Settings with existing permission filtering. Accounts, sample codes, fictional policy labels and repeat command are in [the current runbook](../README.md). Seeding is not a test/load pass; verification, commit and push remain deferred. No full salary-product completion claimed.

## Employee / initial salary checkpoint — 23 November 2026

New employee/create/initial approval/edit/linkage scenarios are documented for later execution; no new browser or application test pass is claimed. Full current contracts and deferred acceptance scenarios: [employee module](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). Tests/checks remain deferred at client request; changes are local/uncommitted/unpushed.

# ACME — manual and automated smoke verification

## Independent package publication checks — 23 November 2026

The commit/push request authorizes verification. Independently installed frontend passed format,React lint,strict types,9 units,Vite production build and architecture71/7550. Backend passed format,lint,types,27 units,Prisma generation,official Nest CLI build,native architecture/OpenAPI and production-doc isolation. QA typing/formatting/proxy checks and all4 Git hook rejection/acceptance checks passed; safety regression passed. Serial isolated PostgreSQL integrity/auth/team/reference/country/FX/employee/approval suites and17 linkage SQL/HTTP checks passed. All12 foundation Chromium cases passed. Source comparison confirms all19 migration files and all75 frontend source files unchanged apart from relocation; only config/config.module.ts changes among81 backend source files. All22 delivered Chromium cases passed in the complete serial run without retries. Native Nest CLI watch and Vite development startup/proxy checks passed on isolated ports; those test-owned processes were stopped. First309-file indexed scan and whitespace checks passed. Final hook-gated commit/push and exact-head GitHub CI remain pending; no pending check is a pass. Historical report generation now writes only ignored QA artifacts rather than overwriting canonical documents. Earlier implementation-only records below are historical; no production completion/approval/merge claimed.


## Independent application ownership — 22 November 2026

Current implementation on `chore/independent-app-packages`: root frontend/ and backend/ are independent npm projects with separate lockfiles,strict TypeScript,ESLint,Prettier,tests,environment templates and native scripts. Frontend uses React19/Vite8,app/node TS projects and React hooks/refresh lint rules. Backend uses Nest12 CLI/nest-cli.json/tsconfig.build.json and official @nestjs/config with the existing safe Zod validation. Backend owns PostgreSQL/Prisma/migrations/bootstrap; no SQL or salary/permission policy is changed. QA is an independent qa/ package. tools/quality owns Git orchestration only; root has no package.json or framework configuration. Husky delegates to package-native checks. CI installs/checks each package independently.

Old acme-salary-app/ now contains canonical documentation and ignored legacy local artifacts only. The previous local PostgreSQL cluster remains untouched; backend local-start reuses it when present. Existing server .env copied only into ignored backend/.env. Frontend receives no secrets. See [manual run steps](../README.md) from acme-salary-app,or root README.md from the repository. No test/lint/type/build/browser/safety verification,staging,commit or push performed for this increment under the implementation-first rule. Package installation/configuration are not test passes. Earlier workspace paths/check results below are historical; source links have been mapped to the current owners.

## Earlier checkpoint records

## Quality tooling publication checks — 22 November 2026

Push request authorizes verification. Formatting,lint,workspace types,36 units,builds,QA typing and React architecture71/7550 passed. Disposable Git/Husky integration checks reject unformatted source,explicit any and prohibited runtime files,and accept valid staged source. Git safety regression passed. Initial formatter baseline changes source layout only. Final indexed scan,real commit/push hooks and exact-head CI remain pending; no approval/merge. Earlier implementation-only records below are historical.


## Developer quality hooks — 22 November 2026

Implemented on `chore/quality-hooks`, verification deferred under the user's implementation-first rule. ESLint remains the application linter; Prettier3.10.1,Husky9.1.7 and lint-staged17.6.2 are exact development dependencies. Root Prettier/EditorConfig settings enforce two spaces,single quotes,semicolons and LF. The initial application/config/script/browser-test formatting baseline is applied; Markdown,immutable SQL,lockfiles and generated/runtime files are excluded. No business/API/schema rules change.

From `acme-salary-app`, `npm run format` writes supported source/config formatting; `npm run format:check` checks it; `npm run lint` rejects application lint warnings and `npm run lint:fix` applies supported fixes. `npm run quality:check` runs format check,foundation verification (lint,workspace types,units,builds),browser-test typing and React architecture checks. It does not migrate a database or require browser binaries.

Husky lives at root `.husky/` because Git is one directory above package.json. Normal development install runs `prepare`; after the documented safe `npm ci --ignore-scripts`, explicitly run `npm run hooks:install`. Installation skips CI/production/HUSKY=0. Git pre-commit runs `quality:staged`: non-writing Prettier/ESLint checks on staged code/config plus the existing indexed safety scan. Partially staged work stays under lint-staged's normal stash/hide protection; hooks do not auto-fix or broadly stage files. Git pre-push runs `quality:push`: complete source quality plus indexed safety. Failures stop the Git action. Use Node>=24.20.0 on the terminal/GUI Git PATH; packages are installed locally,never fetched by a hook.

CI keeps lifecycle scripts disabled and now checks formatting in addition to the existing complete delivered database/linkage/architecture/browser gates. The full future-requirement QA suite still retains its unmet/blocked scope. Hook execution,format checking,lint,types,unit/build/browser verification,safety scans,staging,commit and push have not been performed for this increment. Dependency installation,Husky setup and formatter writes are implementation actions,not test passes.

## Earlier checkpoint records

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

Linkage backend: build first (`npm run build`), then `npm run test:employee-linkage` from acme-salary-app using Node >=24.20.0, restricted DATABASE_URL and owner MIGRATION_DATABASE_URL. The command creates/drops only a unique synthetic database and runs real loopback HTTP. Covers anonymous/non-HR/CSRF/origin/self/stale/duplicate/removed denials, confirmed independent link/unlink, immutable audit, competing assignments, revocation and audit-failure rollback. CI includes this gate. No linkage screen or salary-write pass is claimed.

**Purpose:** Provide executable checks without implying missing workflows passed.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

Run checks on a dedicated synthetic local instance. Use delivered UI/browser authentication, not a forged JWT or a copied database digest. The last recorded source verification had passing scoped suites but failing unfinished-business probes. This documentation task validates documents, not a new application test run. Related: [README.md](README.md), [CONTEXT.md §9](CONTEXT.md#9-bug-fixes-and-pitfalls), [RBAC.md](RBAC.md).

## 0. Exact pre-merge CI gates

Working directory acme-salary-app unless noted; all delivered gates below must exit 0. Start from README setup and a private valid .env, never production.

~~~powershell
npm.cmd ci --ignore-scripts --no-fund --no-audit
npm.cmd run db:local:start
npm.cmd run verify:database
npm.cmd run test:authentication
npm.cmd run test:team
npm.cmd run test:references
npm.cmd run test:country-currency
npm.cmd run test:fx
npm.cmd run qa:typecheck
# Repository root:
# node tools/quality/scripts/test-git-safety.mjs
# node tools/quality/scripts/verify-staged.mjs
node node_modules/@playwright/test/cli.js install chromium
npm.cmd run qa:e2e -- e2e/foundation.spec.ts
npm.cmd run test:login
npm.cmd run db:local:stop
~~~

Before these commands, CI validates the PR prefix, checks out exact SHA and sets Node 24.20.0. After tests it uploads seven-day synthetic diagnostics and always attempts DB shutdown when startup succeeded. Do not disable version/rate/security checks or add retries to get a green run. Full npm run qa:e2e includes requirement probes and is intentionally nonzero until remaining modules exist. Historical baseline and newer 3-pass/11-fail probes must remain visible. qa:regression instruments five older DB/health commands and is not a substitute for auth/team/browser gates.

## 1. Health and readiness

With dev API started, run from PowerShell:

~~~powershell
curl.exe -i http://127.0.0.1:3001/healthz
curl.exe -i http://127.0.0.1:3001/readyz
~~~

Pass: first HTTP 200 with status ok, X-Request-Id and nosniff; second HTTP 503 with not_ready and schema_not_verified when DB is connected, or database_unavailable when not. A curl exit code alone does not assert HTTP success. Do not turn deliberate 503 into a failed deployment repair or claim production readiness.

## 2. Authentication and token handling

1. Bootstrap a synthetic HR account only on the disposable local system, following README. Configure local mail capture and exact browser APP_ORIGIN.
2. Open the root UI, request code for registered email and an unknown synthetic email. Both public responses are generic; only eligible recipient receives usable mail. Raw code must not appear in the HTTP response/server log.
3. Enter actual captured code; pass if signed in and /me identifies current user. Inspect browser cookies: session HttpOnly, SameSite=Lax, Secure unless explicit dev opt-in. Do not export a real cookie or write it to docs.
4. Resend and reject the old code; submit wrong code three times and reject that challenge thereafter; a successful code must not replay. Rate-limit denial must not become an account-existence response.
5. Reload to restore valid session; send logout without/bad CSRF (403); use real logout and confirm /me now 401. Cookie expiry hint alone cannot grant access.

For automated actual token creation and negative boundaries, use test:login/test:authentication; they retrieve test codes via capture and retain browser-managed cookies. No bearer token endpoint exists.

## 3. Team CRUD, invitations and permissions

1. Sign in as HR A. Team must appear; system/deleted accounts must not. Non-HR B must not see/call admin functionality (403); anonymous Team read is 401.
2. Fill synthetic invite fields and permission set. Cancel confirmation: no user row/mail. Confirm: saved INVITED record, seven-day expiry and actual SMTP invitation. Duplicate live email (case-insensitive) gives 409; invalid/unknown DTO fields/rights give 400.
3. Reinvite pending member: new version/expiry and old OTP invalidation. Accept invite with OTP in a separate browser context. Refresh HR list before Edit because acceptance advanced version.
4. Change member permissions through UI confirmation; existing member /me must read updated rights. Stale expectedVersion must 409; own role/permission tampering 403 even with handcrafted requests. Missing and invalid CSRF must 403.
5. Remove member; their existing sessions/codes fail immediately; stored actor identity/history remains. Reinvite same address as a new account and confirm new ID. Do not use raw SQL to restore an operational identity.
6. Use HR B to offboard HR A. Last active HR cannot be removed or demoted; pending HR invites do not count as active. Test direct SQL races only via the isolated test:team harness, never manually on an existing shared database.
7. Exercise Refresh, Edit/Cancel, Previous/Next with >20 synthetic fixtures; native dialog keyboard/cancel behavior, narrow viewport/overflow and axe. SMTP failure should show saved-but-undelivered warning and keep recoverable invitation.

Pass criteria correspond to TEAM-E2E-01..04 and 22 TEAM-DB checks. Test audit rollback only through its fault-injected disposable DB fixture. Never modify immutable audit entries to clean up.

## 4. Compensation, employee and reporting workflows

Internal regression commands verify exact money, history, independent approval, pending/rejected exclusion from ledger selection, inactive currency rejection, holds and snapshot guards. They do not verify a user-facing employee/salary/report API that does not exist. Mark manual UI workflows blocked/not started until delivered; do not substitute a fabricated UI or blanket 401 handler for missing features. Before acceptance, implement employee linkage, distinct requester/approver sessions, historical transfer/currency scenarios, real reports/exports, snapshot permission/expiry invalidation and full role/action matrix.

## 5. Integrations and production gates

Test captured SMTP success/failure without external addresses. No LLM, upload/download storage, worker-health, webhook, graph or deployment wizard smoke endpoint exists. Production TLS/mail/proxy/backup/restore/security/load/UAT are blocked until approved infrastructure and complete workflows exist. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Known failure modes appendix

| Symptom | Likely cause | Fix pointer |
|---|---|---|
| Active code rejected after resend | Correct single-use/invalidation behavior | CONTEXT §4 and WORKFLOW_RULES §2 |
| Edit conflict immediately after first login | INVITED→ACTIVE advanced version | CONTEXT §9 item 11; refresh/reopen |
| Currency approval now fails | Currency deactivated or policy/employee stale | CONTEXT §9 item 1; no override |
| Browser setup/port failure or lost server | Concurrent/duplicated test processes | CONTEXT §9 items 9–10; sequential dedicated configs |
| Later tests blocked after a failure | Fixture restart/state dependency | CONTEXT §9 items 12–13; fix fixture, rerun all cases |
| Local DB command hangs | Inherited Windows process pipes | CONTEXT §9 item 14; use launcher |
| Generic request accepted but no email | Eligibility, throttle, SMTP or ephemeral work loss | SMTP_INTEGRATION and ORCHESTRATION |
| Missing business navigation/API | Feature not delivered, not proof of successful authorization | ROADMAP and BACKLOG |


## 6. Department/designation administration — manual synthetic smoke

1. Sign in as an active HR Manager; Organization references appears. A member must not see it; direct API reads must return 403 (401 when anonymous).
2. In Departments, enter a synthetic name with surrounding spaces. Review and cancel: no record should persist. Review again and confirm: trimmed spelling/display casing persists.
3. Submit the same spelling in another case: 409/visible duplicate message, including for an inactive existing record.
4. Edit and confirm a rename; deactivate and confirm. The record stays visible as inactive. Reactivate: same ID, higher version. No deletion action exists.
5. Repeat for Designations. Exercise both pagination directions when over 20 records exist; check mobile table scrolling and keyboard dialog cancellation.
6. Open the same edit in two independent HR contexts: first confirmed change succeeds, second gets 409 and must refresh/reopen. Missing/wrong CSRF or Origin must not mutate data.
7. Use only test:references in a disposable database for inactive-assignment, concurrent deactivation, direct deletion/truncate and audit-failure checks. Never run destructive probes against an existing/shared database.

Automated equivalents: test:references (23 real PostgreSQL checks) and test:login (9 auth/team plus 4 reference Chromium cases). Empty/outage rendering is explicitly simulated UI-state coverage; real CRUD/pagination uses actual API/database calls. Merged PR #5 head d84ba8e passed run 44997876398/job 137132754960. This documentation task does not claim a new browser execution.

## 7. Country/currency smoke

Use synthetic HR/read-member contexts. Verify catalogue search, numeric minor units vs N.A., HR-only currency activation confirmation/cancel, country creation, immutable code, versioned precision/rounding/notes edits, deactivate/reactivate and stale conflicts. Member sees catalogue without administration; direct country/config API denies member. Inactivate a currency then confirm new assignment/salary/FX/report use fails through isolated test:country-currency, preserving old history. UI warns about inactive defaults, descriptive notes and no legal automation. Check pagination, outages/recovery, mobile/axe and console. New country-currency browser group uses its own disposable database/artifact folder; do not run against shared data.

Browser harness update: existing QA_RUN selects distinct web/API ports: login 4427/4428, references 4527/4528, country-currency 4627/4628; sequential capture SMTP remains 4325. The runner logs only group/stage/process status diagnostics. GitHub run 45006454596 failed during third-group startup before country cases executed; exact cause unproven. PR #7 final head4938a138 passed run45007418682/job137162007364 and was subsequently merged at0e0fb86; failed startup evidence remains historical. P4c adds the isolated FX group on4727/4728; no retries or relaxed assertions.

FX smoke: use synthetic HR to load a pair/date revision, enter positive decimal/source/reason, cancel confirmation (no write), then confirm first quote and append a correction. Verify prior row/audit before/after and stale conflict. Read member sees history/lookup, cannot POST. Resolve a historical direct/inverse/USD path with revision/source/date; reject missing/stale paths. Test pagination, negative DTO/Origin/CSRF, inactive currency, outage/error recovery and mobile/axe. Automated test:fx plus FX test:login group (4727/4728, own disposable DB). Full application remains incomplete.

## P5a directory checkpoint

Read-only employee directory/profile integrates GET employees,employees/filters,employees/:id with fresh HR/read checks; no salary payload or mutation. Current assignment excludes future dates,removed employees excluded,literal wildcard search and fixed sorting/paging. No migration/schema/config/external service added. test:employees plus fifth isolated test:login Chromium group (4827/4828,SMTP4325 sequential),artifacts employees. Local19 directory DB /3 directory Chromium and34 scoped browser checks passed; exact-head CI/review pending; see QA_EXECUTION_REPORT.md. [Employee contract](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). ADR-005 linkage and initial salary approval are approved future integration requirements; do not treat this directory as employee creation/approval completion.

New CI command: `npm.cmd run test:employees`; execute `npm.cmd run test:login` for all five authenticated groups.

Browser runtime update: Playwright now serves built web assets through scripts/qa-web-server.mjs (loopback Node HTTP,strict port,existing QA_API_PORT proxy); npm run dev remains development only. Build before qa:e2e; test:login builds itself. Repeated native dev/preview exits3221226505 are retained failures,root cause unproven. See [browser test runtime](../acme-salary-app/docs/BROWSER_TEST_RUNTIME.md); no deployment or retry/assertion change.

CI also runs `npm.cmd run test:qa-web` to verify real built-static path/MIME/HEAD protections and API proxy method/query/Origin/body/cookies/health/error behavior. No new config or dependency.
