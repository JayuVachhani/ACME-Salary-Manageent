## Payroll review/finalization verification — 23 November 2026

This branch adds explicit-policy run preparation, immutable source generations, assigned HR→Finance→conditional Director review, configured finalization, stale-source refresh and duplicate employee/month allocation guards. It follows the verified policy/calculation commit.

Native frontend format/lint/types,15 units,build and146-file/25,594-check architecture pass. Backend format/lint/types,27 units,7 migration cases,build and actual Nest DI/OpenAPI/production-doc isolation pass. Combined integration evidence includes7 real PostgreSQL/HTTP groups and44 delivered Chromium cases. Native source is verified; staged hooks,normal push and exact published-head CI are separate pending publication steps. No production/10k acceptance claimed.

## Earlier checkpoint records

## Payroll policy/calculation verification — 23 November 2026

This branch adds immutable inactive India/INR policy versions, independent linked-HR activation and exact policy-based gross/deduction/net previews with calendar-day salary segments. Explicit rates/caps/eligibility/state/manualTDS/leave treatment and finalizer responsibilities are required; no statutory settings are inferred. It builds on the verified monthly salary/intake branch.

Native frontend format/lint/types,14 units,build and140-file/23,200-check architecture gate pass. Backend format/lint/types,27 units,7 migration cases,build and actual Nest DI/OpenAPI/production-document isolation pass. The same capability source was exercised in the combined7-group isolated HTTP/SQL and44-case delivered Chromium suites. Staged hooks/normal push and current-head CI remain publication steps, not inferred passes. No production/10k qualification.

## Earlier checkpoint records

## Monthly salary and draft intake — 23 November 2026

This feature adds salary search/current/scheduled views, effective-dated revisions/corrections, independent backdated approval, protected history and manual payroll drafts with create-only CSV intake. Fresh schemas use migrations022–023. Existing later database schemas must not be reset/downgraded to test an older feature snapshot; the combined integration checkout has the complete migration chain.

Native checks pass (frontend14 units/backend27 units/seven migration cases/builds). The combined source passed44 delivered Chromium cases and7 isolated payroll/monthly integration groups; this is not full-product/10k acceptance. Policies/calculations/review/final delivery follow in dependent feature commits. See [salary contract](acme-salary-app/docs/SALARY_MODULE.md) and [manual draft contract](acme-salary-app/docs/PAYROLL_DRAFTS_MODULE.md).

## Earlier setup and checkpoint records

## Local publication verification — 23 November 2026

The push request authorizes verification. Backend gates and32 new employee SQL/HTTP checks passed; frontend9 units/lint/types/build/architecture and12 foundation Chromium cases passed. All23 delivered Chromium cases also passed across the final corrected groups. Publication hooks and exact-head GitHub CI remain pending. This supersedes earlier deferred-verification snapshots without claiming full-product or10k capacity acceptance. See [current QA report](acme-salary-app/QA_EXECUTION_REPORT.md) and Git ledger for actual results; no push/CI success inferred.

## Employee profile presentation — 23 November 2026

Employee details now open in a responsive modal with Overview and permission-aware Salary & history tabs; editing/confirmation/lease rules remain. Shared modal/tabs own keyboard/focus behavior. Source implementation is unverified; no tests/lint/types/build/browser/safety execution, commit or push. Current details: [employee module](acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md).

## Demo data and navigation — 23 November 2026

Executed the explicit synthetic seed in local acme_app: 10,000 DEMO employees, 9,990 independently approved initial salaries, 8 pending and 2 rejected requests, using existing active INR. Demo HR accounts are independently linked; existing accounts/data remain preserved. Script owns a transaction/advisory lock and completed-seed audit marker; no reset or overwrite. Sidebar/Home are grouped by People, Salary and Settings with existing permission filtering. Accounts, sample codes, fictional policy labels and repeat command are in [the current runbook](README.md). Seeding is not a test/load pass; verification, commit and push remain deferred. No full salary-product completion claimed.

## Employee / initial salary checkpoint — 23 November 2026

Employee creation, pending initial approval, linked-HR inbox, personal edits/leases and protected salary reads are implemented in source; P5/P6 remain partial, not accepted. Full current contracts and deferred acceptance scenarios: [employee module](acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). Tests/checks remain deferred at client request; changes are local/uncommitted/unpushed.

# ACME Salary Management — Development Plan

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

Backend rules follow-up (22 November 2026): implemented/unverified on existing chore/nestjs-backend-structure in `.worktrees/nestjs-rules`. Global DTO validation, schema-derived OpenAPI, request middleware, safe global exception mapping, explicit CORS and service-owned invitation orchestration extend PR #11. Primary React changes remain separate and uncommitted; no test/lint/type/build/safety/browser check, commit, push or new CI occurred. Backend source/audit/handoff updates live in that worktree until authorized verification and independent PR delivery.

Rules alignment in progress (22 November 2026): frontend global state now uses Redux Toolkit 2.15.0 / React Redux 9.3.1 and one RTK Query API/cache. Feature-owned endpoints replace custom remote-state effects; server identity is read through useSession from the query cache. Session Context and useResource are removed. Forms, confirmation snapshots and OTP inputs stay local; OTP credentials bypass Redux actions/cache through the same shared secure transport. AppProviders owns store/error-boundary/notification composition; the authenticated workspace is lazy loaded with Suspense. Logout/self-removal/established-session 401 clears cached protected data; 403 refreshes current identity. No API/schema/financial rule changes. **Uncommitted and unverified: no tests, lint, typechecks, builds, safety scans or browser checks were run for this increment, at the user's request.** Existing PR #12 checks cover its published head only; PR #11 backend and PR #10 linkage remain separate pending work.
## PR #10 integration — 22 November 2026

PR #10 merged to main at `4509d5fa272ea1e3a3db785affa245d6a7cbdc5d`. This PR #11 checkout merges that base and ports linkage to native `team/team.controller.ts`, `team/team.service.ts` and `team/dto/team.dto.ts`; no legacy controller factory/service is restored. Migration019 is retained unchanged. The shared member response contract includes nullable employee_id for link/list/invite/change/reinvite responses; OpenAPI derives the same projection. The isolated linkage suite now boots the real application, including global validation/security/response boundaries. Existing independent-HR, audit/revocation/version/rollback rules remain. Combined local lint/types/builds, 27 units, all17 linkage SQL/real-HTTP checks, native architecture/OpenAPI (including required employee_id projection and production docs absence), serial isolated database suites and all9 affected authentication/team Chromium cases passed. Final publication/current-head GitHub CI remain pending; earlier branch-only passes below are historical. React PR #12 remains separate until PR #11 is independently merged.

## Earlier checkpoint records

## Publication verification — 22 November 2026

Required local publication checks passed on this NestJS branch: lint, workspace typechecks/builds, 27 unit tests, QA typing, isolated PostgreSQL integrity/authorization/concurrency suites, native NestJS architecture/OpenAPI checks (including production documentation absence), HTTP health smoke, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The FX email-capture case timed out on the first run; its isolated three-case group passed on rerun without timeout or authorization changes. Environment setup failures and deferred-check snapshots below are historical. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md; no self-approval, merge or production deployment is claimed. The broader unmet/blocked requirements remain open.

## Earlier checkpoint records

Current NestJS audit remediation (22 November 2026): pool error handling, shared failure-safe transaction mechanics, typed query/response contracts, exact-origin config and honest committed invitation delivery/audit outcomes implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

NestJS rules alignment (22 November 2026), implemented but unverified: the existing capability modules/native injectable services remain. Concrete request DTO classes feed one APP_PIPE RequestValidationPipe and schema-derived OpenAPI input contracts. All delivered controllers use this path; the old per-parameter ZodValidationPipe is removed. OTP verification alone defers parsing to AuthService to preserve malformed-attempt throttling/audit. APP_FILTER HttpExceptionFilter handles application/framework/unknown failures with a safe 5xx fallback and preserves readiness's intentional 503 body. RequestContextMiddleware owns correlation/logging/no-store; CORS is limited to configured APP_ORIGIN. Development/test-only /api/docs, /api/openapi.json and /api/openapi.yaml document delivered routes using Swagger 12.1.2. No financial/schema/permission/session policy changes. No tests, lint, typechecks, builds, safety scans or browser checks ran for this increment, per user instruction. Changes remain uncommitted/unpublished; historical passes do not validate this working tree.

## Backend structure checkpoint — 22 November 2026

On chore/nestjs-backend-structure (base origin/main 1e0e65f), controller factories were replaced by top-level controllers and feature modules with explicit DI, shared config/database/auth/mail providers and lifecycle-managed OTP drain/pool shutdown. Source paths now follow capability folders under backend/src; see acme-salary-app/docs/BACKEND_STRUCTURE_AUDIT.md and TECHNICAL_DECISIONS.md (relative paths from repository root). Routes, SQL migrations, permissions and business scope are unchanged. Salary/report helpers remain internal. Pending PR #10 remains preserved separately and requires reconciliation after independent merge. This is structural delivery, not full backend or production acceptance.

Review date: 21 November 2026 (Asia/Calcutta)  
Status: CORE DEVELOPMENT AUTHORIZED — FOUNDATION VERIFIED; DATABASE MODULE IN PROGRESS  
Implementation progress: foundation and core database/domain safeguards implemented in `acme-salary-app`; backdated approval backend tested. Authenticated API/UI modules are not yet complete.

Current backend checkpoint (22 November 2026): PR #9 employee reads merged at `1e0e65f`. Full approved backend scope requested; client explicitly keeps unresolved business rules blocked. Next delivery on `feature/backend-linkage` implements ADR-005 confirmed independent-HR account linkage, migration019, revocation/audit/snapshot invalidation and isolated SQL/HTTP verification. Pending initial salary/employee creation, salary writes/leases/idempotency, reports and audit/analytics remain separate undelivered work. Salary bands remain deferred. No production completion claim; dependent work follows the root review/merge gate. See TEAM_MODULE.md, DEVELOPMENT_PROGRESS.md and GIT_CHANGELOG.md for current evidence; original planning observations below remain historical.

Approval update (21 November 2026): the client approved Section 6 recommendations and requested fresh development in a new folder. Concrete accepted directions and remaining details are recorded in `acme-salary-app/docs/DECISIONS.md`. The original review findings below remain as the historical baseline; recommendations are approved where stated, while questions with no proposed answer remain open until answered. No additional permission is required to continue the authorized core build.

## 1. Review scope and evidence

All five supplied planning documents were read completely, together with the original requirements blueprint:

| Source | Location | Review role |
|---|---|---|
| Gap Analysis / scope baseline | `Project Analysis/requirement_review_scope_baseline.md` | The supplied file is titled Requirement Review & Scope Baseline; there is no separately named Gap Analysis file. It is treated as the requested fifth document. |
| BRD | `Project Analysis/business_requirements_document_brd.md` | Business outcomes, scope, BR-01–15, BRL-01–14 |
| FRD | `Project Analysis/functional_requirements_document_frd.md` | Functional acceptance requirements and NFR-01–09 |
| SOW | `Project Analysis/statement_of_work_sow.md` | Deliverables D1–D9, exclusions, quality and rollout gates |
| SDD | `Project Analysis/system_design_document_sdd.md` | Proposed architecture, example DDL, API/workflow design, OD-01–05 |
| Original blueprint | `Project Requirement/ACME Salary Management.txt` | Original intent, metrics, stack and earlier roadmap |

The workspace was enumerated, including hidden files. It contains these six documents only. No frontend/backend source, package manifest, lockfile, tests, Prisma schema, migrations, configuration, database connection information, or Git repository was found. `git rev-parse --show-toplevel` confirms that this folder is not a Git repository. No running or external database was inspected: none is identified or connected in the supplied project. Database findings below concern the proposed SDD DDL, not a deployed schema.

Recommended document precedence, requiring approval: the approved decision register and plan govern changes; the five companion documents form the detailed baseline; the original blueprint supplies additional intent only where it does not conflict. Unresolved conflicts remain open rather than being silently resolved by document order. Do not edit the original specifications until decisions are approved.

## 2. Product and scope assessment

The agreed product direction is a single-organization, invite-only application for monthly base compensation across countries. It is not a payroll execution system. It includes employee management, country policy configuration, manual FX maintenance, salary bands, an immutable salary ledger, timeline/table history, edit leases, granular permissions, analytics, filtered CSV reports, and HR-only audit access.

The documents are substantially aligned, but the baseline's statement that only five decisions remain understates the remaining work. The product is ready for planning, not unconditional implementation or production use. Core development can begin only after explicit approval; individual modules also depend on the decisions listed below.

Keep the following boundaries visible:

- TBD-01: Excel migration, cleansing, reconciliation and cutover tooling remain excluded until scoped.
- TBD-02: payroll runs, payslips, taxes, deductions and additional compensation remain excluded.
- TBD-03: deployment, CI/CD, hosting, TLS termination, production secrets, encrypted backups, recovery targets, infrastructure monitoring and support remain excluded until scoped.
- TBD-04: commercials, legal parties, sign-off contacts and agreements remain open.
- Automated management approval, permanent purge, external HRMS integration, native mobile apps and multi-tenancy remain excluded.
- Application completion is distinct from production readiness. The latest request for a production-ready result does not silently authorize or resolve these exclusions.

## 3. Existing architecture and stack assessment

There is no implemented stack to preserve or refactor. The proposed stack is React, TypeScript, Vite, Tailwind and shadcn/ui; NestJS and Prisma; PostgreSQL with raw SQL migrations for database-specific features; SMTP OTP and server-side sessions; Jest, Vitest, Supertest and Playwright; OpenAPI documentation.

Retain the modular monolith. At 10,000–15,000 employees, PostgreSQL transactions, indexes and efficient queries are a sensible starting point. Redis, Kafka, microservices and a separate search service have no demonstrated requirement. The proposed exact decimal strings, country snapshots, app/owner role separation, immutable ledger, request-time authorization, same-origin cookies, real-database tests and layered locking are strong foundations.

Recommended implementation boundaries after approval:

| Boundary | Responsibility |
|---|---|
| `apps/web` | React routes, accessible components, forms, confirmation summaries and module screens |
| `apps/api` | NestJS auth, team, country/reference data, employee, salary, reporting/analytics and audit modules |
| `packages/contracts` | Safe shared API types/client contracts; no direct browser access to database models |
| Database migrations | Prisma models plus reviewed SQL for constraints, indexes, triggers, views and least-privilege grants |
| Test support | Synthetic fixtures, controllable clock, local SMTP capture and real PostgreSQL integration environment |
| Documentation | Requirements traceability, decision records, operations/user guides, AI development log and this progress tracker |

Use module service boundaries and a shared transaction context so salary, employee version, history, audit and lease release commit together. Keep money, FX resolution, salary selection and permission policy in centrally tested domain functions. Do not duplicate calculations in React. Do not hold a database transaction open while a user edits or while sending SMTP. Local tooling is included in application verification; production infrastructure remains separately gated.

Exact runtime/library versions, dependency compatibility and advisories must be checked against official documentation at implementation time and pinned in the lockfile. No packages were installed for this review, and no version compatibility claim is made here.

## 4. Cross-document conflicts and missing business rules

Severity: Critical blocks the relevant design; High blocks the affected module; Medium must be settled before its acceptance. Recommendations below are proposals, not approved behavior.

| ID / severity | Evidence and finding | Proposed resolution / dependency |
|---|---|---|
| C-01 / High | Original blueprint specifies passwords/JWT possibilities, `/api`, mutable salary period closure and an 8–10 day MVP. Companion docs specify OTP sessions, `/api/v1`, append-only derived periods and 7–10 weeks. | Approve companion baseline precedence; remove obsolete behavior from future implementation contracts. |
| C-02 / Critical | FR-AUTH-09 permits create/update with either `write` or `edit`; SDD §4/§5.2 separates `write` creation from `edit` modification. | Approve an action matrix; recommend distinct create and edit rights, with read implied or explicitly required for usable UI flows. |
| C-03 / Critical | FR-SAL-10 allows effective-date changes, but SDD typo corrections must copy the original effective date. No cancellation or date-replacement model exists. | Decide whether date corrections are excluded or introduce explicit immutable supersession/cancellation semantics. Never mutate historical rows. |
| C-04 / Critical | SDD transfer immediately changes `employees.country_code`; reports group by that current value even for historical salary dates. Department/status are also current-only. | Decide whether reports represent historical employment attributes or current organization membership applied to historical pay. Recommend effective-dated employment assignments for historically accurate reports. |
| C-05 / High | BRD mentions date ranges; FRD/SDD define as-of reports. Original blueprint includes medians, trends, distribution and native-currency summaries; current FRD summary is less explicit. | Confirm report catalogue and definitions: point-in-time snapshot versus change/trend date-range reports, headcount denominator, missing salary handling and active/inactive treatment. |
| C-06 / High | FR-REP-02/04 promises identical preview/export with the same filters/date. Employee edits, backdated corrections, FX corrections and band edits can occur between requests. | A date and filters alone cannot guarantee equality. Recommend a permission-checked, expiring server-side report snapshot with a report ID for export; approve lifecycle and invalidation behavior. |
| C-07 / High | BRL-01 refers to active employees; FR-EMP-01 and DDL mean all non-removed employees, including INACTIVE. Code uniqueness is case-sensitive; email is not. | Confirm uniqueness includes inactive employees and define trimmed/case-normalized code behavior. |
| C-08 / High | Country retention policy is text; FR-EMP-06 requires enforcing it. BRD removal wording is broader than SOW's explicit purge exclusion. | Define enforceable soft-removal eligibility, hold/minimum-retention rules and audit access. Permanent purge remains excluded; policy notes alone must not be represented as legal compliance automation. |
| C-09 / High | Country edits must not rewrite historic salary values, yet employees automatically inherit new country rules. | Decide when existing salary snapshots change: recommend new writes only, with any revaluation requiring explicit ledger entries. Distinguish current policy display from historical calculation policy. |
| C-10 / High | Cross-currency entry requires an explicit rate/date; SDD resolves from managed FX. Manual overrides, rate date restrictions and exact amount rounding are unclear. | Confirm override rights, rate source, direction, allowed dates, precision and whether excess decimal input is rejected or rounded after confirmation. Preserve the exact approved basis. |
| C-11 / High | Future/backdated revisions and transfers are not bounded. Immediate country mutation conflicts with future transfer dates; transferring before joining is not explicitly prohibited. | Approve scheduling/backdating rules, joining-date constraints, collision handling, transfer without existing salary and which prior amount to carry at transfer date. |
| C-12 / Medium | Original blueprint models departments/designations as entities; FRD/SDD use free text with no maintenance workflow. | Choose controlled reference lists or deliberately free text. Recommend controlled lists to prevent fragmented reporting. Define casing, rename and deactivation behavior. |
| C-13 / High | User-to-employee mapping is absent; self-edit restrictions in OD-03 cannot be enforced by the supplied model. | Add explicit optional verified account/employee linkage if restrictions are approved; define HR self-permission edits and privileged override policy. |
| C-14 / Medium | Every form save requires confirmation; login, filters and heartbeats are also UI submissions but not record-edit saves. | Confirm confirmation applies to business mutations, including team/reference administration; removals need explicit destructive confirmation. Do not add confirmations to OTP entry, filters or heartbeat. |
| C-15 / High | BO-07 broadly mentions viewed compensation; FR-AUD/SDD enumerate salary-history reads but omit ordinary salary/profile/list reads. | Confirm access-audit scope and volume expectations. At minimum implement the enumerated events; never imply all salary reads are tracked unless agreed. |

## 5. Technical design gaps and improvements

These findings arise from the supplied design; no implementation defects are claimed.

| ID | Gap / risk | Planned improvement and verification |
|---|---|---|
| T-01 | Ledger correction constraints do not enforce same employee, same date, valid country snapshot or correction lineage at database level. | Add cross-row validation with transaction serialization and appropriate triggers/constraints; preserve one terminal row per employee/effective date. Test cross-employee corrections, chains, cycles, duplicates and invalid dates with direct SQL. |
| T-02 | `LEAD` and current indexes alone do not prove every intended period rule; correction date changes could produce duplicate dates and ambiguous selection. | Specify interval semantics (recommend half-open), correction rules and deterministic tie handling before final SQL. Test salary selection at each boundary and against an independent oracle. |
| T-03 | Successful OTP verification may race with another verification, resend, offboarding or invitation expiry. Request flow does not explicitly invalidate older codes. Counters alone do not guarantee one session per code. | Serialize OTP issuance/verification per identity, enforce a single open challenge, atomically consume/create session, recheck user eligibility. Retain failed attempt/security audit commits. Parallel replay must produce one success only. |
| T-04 | CSRF is required on every mutation, but pre-login OTP endpoints have no authenticated session token. SPA refresh also lacks a defined CSRF recovery endpoint. | Define pre-auth origin/CSRF protection, token bootstrap/recovery, cookie scope, trusted proxy handling and enumeration-safe response timing. Test cross-origin login attacks and reload/logout flows. |
| T-05 | Per-email OTP cap still allows targeted denial of service; in-memory IP throttles reset and do not span multiple API instances. | Document the residual limitation and decide per-IP thresholds. Start with explicitly single-instance API assumptions, or use PostgreSQL-backed shared counters if multi-instance operation is required. Unknown-user attempts also need throttling. |
| T-06 | Locks are keyed to user, not edit session; two tabs can share, extend or release each other's lease. Delete-only users cannot acquire an edit lock. | Use an opaque lease token scoped to edit session, checked with user, expiry and employee version. Define lock/permission checks for removal. Avoid dependence on browser-unload delivery; expiry remains fallback. |
| T-07 | Last-HR-Manager checks and bootstrap can race. | Serialize privileged role transitions/bootstrap with database locking; enforce system identity uniqueness and status/deleted timestamp consistency. Test simultaneous demotions/deletions/bootstrap attempts. |
| T-08 | FX rows can be corrected; a snapshot of only final rate/date does not preserve all legs, source revisions, country default currency or inversion details. Inverse rounding at eight decimals can affect thresholds. | Preserve full conversion provenance and country-rule version/default currency. Define intermediate precision once, test staleness for every leg, overflow, inverse/triangulated boundaries and band thresholds. Keep salary entry rates separate from report-date valuation. |
| T-09 | FX and band edits lack optimistic versions; salary band minimum can be negative; currency lifecycle and overlapping band rules are incomplete. | Version mutable reference records, validate nonnegative bounds and decide overlap policy. Prevent removal/deactivation from invalidating historical references. Audit band operations explicitly. |
| T-10 | Owner-role triggers are useful but privileged owners can disable triggers; immutable does not mean administrator-proof. Grants alone do not establish no-DDL behavior. | Separate migration/runtime credentials, restrict schema CREATE and default/PUBLIC privileges, validate grants/functions/views and timeouts using actual app role. Document trusted-operator boundary. Extra tamper-evident storage is a separate decision if required. |
| T-11 | Current view computes UTC date in DB while NFR-09 requests application-computed dates. | Authoritative APIs pass one application-computed UTC date into salary selection. Keep the convenience view explicitly secondary; test UTC midnight boundaries. |
| T-12 | Multi-query reports/streams may observe different snapshots; export audit could succeed while download fails. | Use consistent report generation, snapshot IDs and bounded reads. Audit generated/export-started/completed/failed states with honest row counts; do not claim client receipt from server completion. |
| T-13 | Automatic transaction retry or a client retry can duplicate append-only entries. | Add idempotency keys for financial writes and report generation; retries encompass the transaction only, not external SMTP side effects. Test timeout/retry duplication. |
| T-14 | Seed determinism is contradicted by random UUID defaults, `now()` values and changing report dates. | Fixed IDs, seed, clock/date anchors and stable logical checksums. Seed only isolated synthetic databases; prohibit production seed/reset. Repeat in two fresh databases rather than truncating immutable ledgers. |
| T-15 | NFR latency targets lack load, hardware, measurement boundary and report sample definition. Audit growth and short substring searches may alter performance. | Approve a reproducible load profile, concurrent user count, dataset/history sizes and measurement method. Use EXPLAIN and p95 evidence; 15k capacity is tested separately from the 10k seed deliverable. |
| T-16 | SMTP delivery can fail after commit, or process can stop before sending; no cleanup/storage policy for sessions, OTPs and report snapshots is specified. | Provide capture SMTP for local tests, bounded delivery retries and documented failure behavior without storing plaintext OTPs. Define cleanup schedules separately from immutable business/audit retention. Validate real SMTP with synthetic recipients before acceptance. |

The SDD DDL is a design example, not a migration ready to run unchanged. Final schema review will also check active-currency validation, positive FX snapshots, snapshot enum/range checks, trimmed nonempty reasons, indexes for terminal correction lookup, stable pagination and restrictive foreign-key behavior.

## 6. Approval and decision register

Recommendations APPROVED by the client on 21 November 2026. See `acme-salary-app/docs/DECISIONS.md` for selected values and the remaining concrete details. Questions without a recommendation were not silently answered by that approval. Business sponsor/HR owns compensation and access rules; technical owner validates feasibility; production owner closes operational gates. Named formal sign-off contacts remain TBD.

| Decision | Question and recommendation | Blocks |
|---|---|---|
| OD-01 | Keep 24-hour OTP expiry or shorten it? Recommend 10–15 minutes; preserve three attempts, single use and resend invalidation. | Authentication acceptance |
| OD-02 | Does pending pay take effect immediately? Baseline says yes. Confirm this explicitly. Keeping old pay requires a defined activation path; approval actions remain out of scope unless authorized. | Ledger and analytics |
| OD-03 | Permit self-salary edits? Recommend blocking them using verified user/employee linkage, and preventing self-permission escalation. | Team/employee policy |
| OD-04 | May every reader see all salaries and export? Recommend separate `salary:view` and `export` rights; confirm whether country/department scope restrictions are required. | Permission schema, APIs, UI and reports |
| OD-05 | Can HR Managers create more HR Managers and implicitly hold all rights? Confirm baseline or specify narrower administration. | Team and privilege model |
| ND-01 | Approve companion-document precedence and distinct `write=create`, `edit=modify`, `delete=soft-remove` semantics? Define whether modifying rights imply read. | Shared authorization contract |
| ND-02 | Should as-of reports use historical country/department/status? Recommend effective-dated assignments; approve backdated/future transfer policy and effect on headcount. | Data model, employee transfers, reports |
| ND-03 | Must salary effective dates be correctable? Define allowed fields, cancellation, same-day revisions, future entries and backdating limits. Recommend preserving same-date typo chains until a date-change model is approved. | Salary schema and write rules |
| ND-04 | Approve report snapshots for exact preview/export agreement? Define whether historical results must remain reproducible after corrections, snapshot expiry and behavior after permissions/removals change. | Reporting persistence and exports |
| ND-05 | Confirm FX source/override rights, precision/rounding, rate date rules and country-policy change behavior. | Money engine and reference data |
| ND-06 | Define enforceable soft-removal retention/hold rules and read-audit scope. Is configuration of policy notes sufficient, or are concrete legal rules expected? | Country policy, deletion and audit |
| ND-07 | Confirm dashboard/report metric catalogue, range versus as-of reports, inactive employees and employees with no effective salary. Recommend showing missing salary counts rather than treating missing as zero. | Analytics acceptance |
| ND-08 | Controlled department/designation lists or free text? Confirm uniqueness casing, band overlap rules and currency deactivation rules. | Reference and employee acceptance |
| ND-09 | Confirm local PostgreSQL/SMTP test access, performance load profile, target browser/accessibility standard and named UAT approver. Recommend keyboard-accessible responsive UI targeting WCAG 2.2 AA, subject to agreement. | Tooling, UX and measurable acceptance |
| ND-10 | Is this approval for the scoped core build only, or should migration and production infrastructure be separately scoped now? Production additionally needs countries/policies, hosting/data residency, backup/restore targets, monitoring, SMTP delivery ownership, agreements and release sign-off. | Production work and cutover |

Approve the core plan and resolve OD-01–05 plus schema-changing ND-01–06 before building affected foundations. Remaining ND items must close before their module starts. If partial approval is given, record its exact scope and keep dependent work blocked.

## 7. Module-wise implementation sequence

Each module is delivered as a working vertical slice: persistence, backend validation/authorization, documented API, frontend, audit integration and meaningful tests. Do not defer all security, audit or testing to the final phase.

| Phase / priority | Module and implementation scope | Depends on | Exit evidence | Status |
|---|---|---|---|---|
| P0 / Critical | Approve baseline, decisions, traceability and architecture records; finalize report/permission/date contracts | Client approval | Recommendations approved; remaining detailed rules tracked separately | Approved recommendations; detailed contracts tracked |
| P1 / Critical | Repository/workspaces, pinned toolchain, web/API shells, validated config, redacted logs, health endpoints, local DB/SMTP tooling, verification command and design tokens | P0 | Lint/type-check, 10 tests, API/web builds and health API smoke passed; local PostgreSQL runtime verified | Foundation verified; browser QA pending |
| P2 / Critical | Schema/migrations, restricted roles, system identity, append-only protections, date/money utilities and initial audit service; small deterministic fixtures | P1; ND-01–06 | Five SQL migrations, Prisma generation/adapter, exact-money domain and 62 real PostgreSQL checks passed; full catalogue/band and final schema acceptance pending | Core foundation tested; in progress |
| P3 / Critical | Bootstrap, OTP request/verify/resend, sessions, CSRF, invitations, permissions, team administration and continuity safeguards | P2; OD-01/03/04/05 | Parallel OTP/replay tests, offboarding revocation, full action matrix, login/team E2E and captured SMTP | Login and team API/UI merged through PR #4; Employee linkage and full cross-module action matrix remain integration work |
| P4 / High | Country policies, currency list, FX maintenance, bands and approved department/designation model; admin forms and confirmations | P3; ND-05/06/08 | Version conflicts, policy snapshots, FX/rounding and reference access tests; audited mutations | P4a departments/designations tested and merged in PR #5; P4b country/currency merged in PR #7; FX administration tested and merged in PR #8; salary bands deferred by ADR-003 |
| P5 / Critical | Employee create with initial salary, directory/search/filter/sort/pagination, profiles, edit leases, removal and transfer groundwork | P4; ND-02/03/06/08 | Unique constraints, literal search escaping, role checks, two-editor tests, initial-salary rollback and accessible forms | P5a directory/profile locally verified19 DB /3 Chromium; mutations/linkage/leases pending |
| P6 / Critical | Salary revisions, backdated HR approval, correction chains, effective-date selection, country/currency transfers, reasons/pending status, timeline/table and conflict recovery | P5; OD-02/03; ND-02/03/05; ADR-002 | Approval service/database tests pass; authenticated APIs/UI, lease/idempotency and E2E remain pending | Approval domain groundwork tested; vertical slice not complete |
| P7 / High | Shared report query/FX valuation, snapshots, filters, CSV streaming/sanitization and export permissions/auditing | P6; OD-04; ND-04/07 | Preview/export equality under concurrent changes, missing/stale FX rejection, formula-injection and cross-permission tests | Not started |
| P8 / High | Dashboard/analytics, counts/distributions, approved medians/trends and native/converted summaries; searchable HR audit screen | P7; ND-07 | Independent totals/median oracle, report reconciliation, removal/status/date tests and restricted audit access | Not started |
| P9 / High | Full 10k deterministic synthetic seed, 15k load extension, regression/security/accessibility/performance hardening | P3–P8; ND-09 | Stable checksums across fresh DBs, all verification gates green, measured p95 and documented fixes | Not started |
| P10 / High | UAT, user/technical docs, OpenAPI, AI development log, limitations, demo recording and handover | P9 and named approver | D1–D9 checklist signed; synthetic-only walkthrough and reproducible setup | Not started |
| P11 / Separate gate | Production migration/deployment/recovery/monitoring and cutover, only under approved additional scope | Core acceptance; TBD-01/03/04 and legal closure | Restore drill, reconciled migration, TLS/secrets/access checks, monitoring and named release approval | Excluded pending scope |

Dependency path: approved domain contracts → database/audit → identity/access → reference rules → employees/leases → ledger/transfers → reports → analytics → final qualification/handover. Audit backend starts in P2; its user interface completes in P8. Small test fixtures start in P2; the full seed is not postponed until testing can no longer inform the design.

## 8. UI/UX acceptance direction

Use a consistent application shell with Dashboard, Employees, Reports, Country/Reference Settings, Team and Audit navigation governed by approved permissions. Core screens are email/OTP login, searchable employee directory, profile summary, salary editor, timeline/table history, pre-filter report builder, preview/export, and HR administration.

- Design responsive desktop-first layouts with usable smaller-screen views, keyboard navigation, visible focus, labeled controls, readable tables and status text in addition to color.
- Show monthly units, original currency, reporting currency, effective date, rate date/path and pending-pay meaning without ambiguity. Distinguish recorded time from effective business date.
- Confirmation summaries show before/after values and reasons. A country precision mismatch triggers the specified warning. Disable duplicate submissions without treating this as the only idempotency defense.
- Model loading, empty, validation, permission-denied, missing-FX, SMTP failure, stale-version and lost-lock states. Preserve unsaved input on lock loss on screen, without persisting confidential form data to browser storage by default.
- Lock notice displays holder and expiry; conflicts require refresh/review instead of silent overwrite. Recheck server permissions on every action.
- Reports require explicit Apply before generation. Display filter summary, as-of date, rate basis, missing-data warnings and snapshot/export state.
- Prepare low-fidelity screen flows during the approved design phase before implementing the module UI. No UI implementation was produced during this review.

## 9. Test strategy and definition of done

All tests use synthetic employees and isolated databases. No real employee files, addresses or salary values enter development, screenshots or recordings.

| Layer | Required evidence |
|---|---|
| Domain/property tests | Exact decimal operations; 0–4 decimal modes; overflow/positive constraints; FX legs/staleness; bands; date boundaries; correction chains and salary selection |
| PostgreSQL integration | Constraints, partial indexes, views/functions, triggers, app-role grants, rollback on audit failure, fresh/upgrade migrations and soft removal |
| Parallel database/API tests | One lock winner across competing edit sessions, stale version rejection, expired lease takeover, OTP consumption/resend races, last-manager continuity and idempotent retries |
| Permission/security tests | Every endpoint × relevant role/permission combinations, CSRF, revoked sessions, enumeration-safe responses, DTO validation, CSV injection and log/secret redaction |
| Frontend/E2E | Login/invite, directory/profile, confirm/cancel, salary revision/correction, transfer, timeline/table, lock loss, report/export and HR-only audit |
| Reconciliation/performance | Known expected sums/averages/medians and headcounts independent of production query code; reproducible 10k and 15k load results, query plans and p95 targets |
| Final security/UX review | Dependency audit, local ZAP baseline with triage, keyboard/accessibility checks and responsive browser validation |

NFR targets are list/search p95 ≤500 ms and filtered analytics/reports ≤1.5 seconds; their reproducible environment and load profile need ND-09 approval. Do not claim performance based only on row count or unit tests.

A module is done only when its UI, APIs and persistence work together, all mapped requirements have acceptance evidence, permissions/audit/confirmation rules pass, relevant real-database and E2E tests pass, error states are reviewed, documentation is updated and blocking defects are resolved. Run the complete local verification gate before release; record unavailable checks as blocked, never passed.

## 10. Delivery tracking and estimates

Retain the SOW estimate as provisional: 7–8 weeks for two engineers plus QA, or 9–10 weeks for one engineer plus QA. These are staffing-based estimates, not a promise for this chat. The original 8–10 working-day estimate does not cover the detailed current scope. Effective-dated employment, report snapshots or changed approval rules can alter the estimate; re-estimate after decisions and a first completed vertical slice. Migration/infrastructure add-ons need separate estimates and approval.

After every module, update its status, completed scope, requirement IDs, test commands/results, unresolved defects, decisions and next dependency in this file. Maintain detailed implementation evidence in the development log, avoiding secrets or real employee data. Proposed progress states: Not started, In progress, Blocked, Verification, Accepted. Percentage completion must follow accepted deliverables rather than generated code volume.

| Deliverable | Coverage | Current evidence |
|---|---|---|
| D1 baseline | P0 | Six sources reviewed; plan recommendations approved; concrete decision record created |
| D2 code/migrations | P1–P8 | Fresh workspace and identity/audit migration implemented; remaining modules pending |
| D3 authentication/team | P3 | Login and team increment merged through PR #4 |
| D4 country/reference rules | P4 | ADR-003 approved; P4a departments/designations tested and merged in PR #5; country/currency/FX pending |
| D5 employees/ledger/history | P5–P6 | Not started |
| D6 analytics/reports | P7–P8 | Not started |
| D7 synthetic seed | P2 fixtures, P9 full seed | Not started |
| D8 tests/API documentation | Every phase, final P9–P10 | Not started |
| D9 demo | P10 after QA | Not started |

## 11. Review completion and handoff

Completed: full document review, workspace inventory, proposed architecture/schema/API review, cross-document gap register, approval questions, module dependencies, quality gates and delivery tracking.

Not performed: application coding, schema creation, migrations, dependency installation, SMTP sending, deployment or tests of an application. There is no application to execute yet. No external service or production database was accessed for this review.

Historical review handoff: development originally awaited approval. The client has now approved recommendations and authorized the fresh core build. This does not authorize real employee data, production cutover, deferred infrastructure, or unspecified critical business rules.

## 12. Implementation evidence — 21 November 2026

- New application root: `acme-salary-app`. Original five documents and requirements blueprint preserved.
- Node 24.15.0; exact npm dependencies and lockfile recorded. React 19.3.1, Vite 8.3.8 and NestJS 12.6.0 resolved from npm. Official Nest/Vite runtime compatibility documentation checked.
- API/frontend foundation, configuration validation, loopback API, same-origin development proxy, security headers, metadata-only logs and health checks implemented. No fake salary APIs or employee metrics.
- Foundation policy tests enforce separate salary visibility/export, create versus edit, inactive/system account denial and self-salary/self-permission restrictions. These primitives still need integration into future authenticated endpoints.
- Client authorized project-local PostgreSQL. PostgreSQL 17.12 initialized under ignored `.local/postgres`, bound to `127.0.0.1:55432`. Random local credentials and `.env` are ignored; migration owner and restricted runtime roles are separate. No OS service installed.
- Identity/audit migration implements approved permission vocabulary, system identity uniqueness, user status constraints, append-only audit triggers, grants and schema restrictions. Checksummed, serialized migration runner is forward-only and repeat application passed.
- `npm run verify:foundation`: lint, TypeScript, 10 config/policy tests, NestJS build and React production build. Windows sandbox Vite access failure was resolved by running the same build with permitted host access; no code workaround bypasses checks.
- `node --env-file=.env scripts/test-database.mjs`: 11 real PostgreSQL checks passed, including owner/runtime audit mutation/truncate protection, runtime DDL/schema-migration denial and invalid identity constraints.
- `node --env-file=.env scripts/test-health.mjs`: liveness, request ID/security headers, closed readiness and absence of unimplemented data route passed. Readiness deliberately stays 503 until full domain migrations are verified.
- `npm audit --json`: zero known advisories reported after PostgreSQL binary tooling installation. This is dependency evidence, not a full security assessment.
- Still pending: full Prisma/domain schema and money engine, authentication/delivery/session flows, reference/employee/salary/reporting modules, 10k seed, browser/E2E/accessibility, load/security scans and production work. SMTP capture configuration exists; actual SMTP delivery is not yet tested.
- Additional concrete rule proposal sent to the client for transfers, FX override/input precision, report expiry/invalidation and retention holds. Continue independent core work; dependent behavior waits for that answer.

## 13. Approved scope update and latest verification

On 21 November 2026 the client approved the concrete date/FX/precision/snapshot/hold rules, then explicitly approved minimal HR Manager approval for all backdated salary changes. The earlier blanket deferral of approval workflows and immediate effect for pending backdated pay is superseded. Another active HR Manager must decide; requester and salary subject cannot approve. Pending/rejected requests leave the original salary unchanged. Broad multi-level approval remains excluded.

Updated all five companion specifications through clearly marked addenda. Canonical implementation decisions: `acme-salary-app/docs/DECISIONS.md` (ADR-002) and `docs/TECHNICAL_DECISIONS.md`. Requirement mapping, latest progress and limitations are in `docs/REQUIREMENT_TRACEABILITY.md`, `docs/DEVELOPMENT_PROGRESS.md` and `docs/KNOWN_ISSUES.md` under that application root.

Implemented and verified: immutable FX revisions with rate/date/source/actor; historical assignment schema; explicit retention holds/release and removal guards; 30-minute snapshot constraints and fresh access checks; immutable salary/request/decision tables; exact money and historical FX helpers; atomic backdated submit/approve/reject backend service; Prisma schema/client/adapter. A deferred constraint prevents approved decisions committing without their ledger row. Automatic ledger triggers append history/audit and increment employee version. Audit-write failure rolls back the decision and salary together.

`npm run verify:database` passed: 18 unit tests; 11 identity/audit, 23 country/FX/retention/snapshot and 28 approval PostgreSQL checks; Prisma runtime checks; API health smoke; lint/type checks and frontend/backend builds. These are internal/domain results, not completed authenticated feature acceptance. No real employee data was used. Disposable test databases are removed; transactional synthetic fixtures roll back.

Added stable Prisma 7.10.1 and decimal.js. A transitive Prisma tooling advisory was found and remediated via scoped Effect 3.22.1 override; Prisma generation rechecked and final npm audit reports zero known advisories. Full security scans remain pending.

Next: complete database/reference foundations and authentication/team vertical slice, then expose the tested approval domain only behind validated sessions and permissions. Salary/approval UI, reports, full seed, browser/E2E and production readiness remain pending. SOW timing must be re-evaluated for the approved scope extension; no new deadline or commercial estimate is inferred.

## 14. Chromium QA checkpoint — 21 November 2026

Performed actual Playwright Chromium testing on isolated local API/web instances. Initial run: 9 passed / 16 failed (25 tests). Fixed contrast, unbounded health-fetch loading and remote font dependence. Final run: 12 passed / 14 failed (26 tests), 0 skipped. New OTP probe added to the final run. Desktop/mobile screenshots reviewed; current foundation passes four viewport overflow checks and automated accessibility scans after fixes.

Fourteen requirement checks still fail because login/OTP, business navigation/screens and protected API endpoints are missing. Forty-five downstream E2E scenarios are recorded BLOCKED rather than passed. Internal approval data-integrity checks are separate evidence; browser reports and multi-account approval cannot yet be certified. Do not treat this checkpoint as end-to-end application acceptance or production readiness.

Reran all 18 unit tests and five existing real PostgreSQL/service/API suites; 76 individual assertion records pass. Lint, application type-check/build, QA type-check and dependency audit passed. QA automation was added; no production or existing employee data reset occurred.

Reports under `acme-salary-app`: `QA_TEST_PLAN.md`, `TEST_CASES.md`, `QA_EXECUTION_REPORT.md`, `BUG_REPORT.md`. Retained initial/final JSON, HTML, screenshots and traces are under `qa-artifacts`. Next implementation priority remains real authentication/bootstrap/session/team functionality, followed by the approved domain vertical slices. Re-run the explicit unmet-requirement tests as each module becomes usable; do not suppress them to claim success.

## 15. Git/GitHub management initialized — 21 November 2026

Authorized remote is exclusively `JayuVachhani/ACME-Salary-Manageent`. The remote was empty and the client explicitly approved one empty bootstrap commit on `main`; `d7da0c84e10ef4f3aa961c97ddc532a679957f0d` was created and pushed. All application changes are on `feature/acme-initial-baseline`, branched from that main. Draft [PR #1](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/1) targets main and is not merged.

The pre-Git implementation is imported honestly as an in-progress baseline (`4696cf4`), not retroactively fabricated feature commits. Git safety tooling, its isolated tests, PR template and initial change ledger are a separate pushed improvement (`8015e93`). Commit details and synchronization rules are maintained in `GIT_CHANGELOG.md`; future completed features, fixes and tests receive separate verified commits and pushes on policy-compliant branches.

Re-ran `verify:database` and `qa:typecheck` successfully before import. Tested and scanned the full Git index for runtime paths, actual local credential values and high-confidence token patterns; none were included. No new Chromium pass is claimed at this Git-only checkpoint: known QA failures remain disclosed and the PR stays draft. `.env.example` is a template; actual secrets, local database and browser data, dependencies and QA runtime artifacts remain ignored.

New development branches still originate from main. Until the baseline PR is reviewed/merged, a new module depending on it must explicitly track that dependency rather than silently rebasing policy or merging. No automatic merge, force-push, branch deletion, CI deployment or production operation was performed.

## 16. PR #1 current-feature remediation and CI

Fixed approval-time currency deactivation in the service and database via forward-only migration 006. Regression failed on old code, then passed alongside 38 real approval checks (72 logical PostgreSQL checks across the database gate) and 18 unit tests. Shared currency locks serialize approval with deactivation; failed approvals preserve all financial/history/audit/version state; rejection remains possible.

Explicit current-foundation versus future-application scope: `acme-salary-app/docs/PR_1_SCOPE.md`. Missing authentication/business API/UI, reports and full system qualification remain future work; their requirement tests and QA records remain intact. No current foundation success is represented as full application readiness.

GitHub Actions is now explicitly authorized for PR testing. `.github/workflows/pr-validation.yml` validates exact PR heads with read-only permissions, pinned actions, isolated synthetic PostgreSQL, the current full database/unit/build gate, browser typing/Git safety and foundation Chromium. The first GitHub run [44920102845](https://github.com/JayuVachhani/ACME-Salary-Manageent/actions/runs/44920102845) passed all steps at `4fb1fd3`; actual status/logs checked through MCP. No production infrastructure or secrets are required.

MCP re-review posted and original finding resolved. PR #1 is ready for an independent reviewer, not approved or merged. The documentation synchronization triggers another current-head run; check the latest PR result before approval. Current client's instruction: do not self-approve or merge; an authorized independent review and passing required checks are necessary.

## Reference increment — 22 November 2026

Client approved ADR-003 default rules. Deliver P4a departments/designations first as a complete API/UI/database/test increment. P4b delivers countries/currencies with precision and lifecycle guards; P4c delivers FX administration. Salary bands are deferred until overlap/validation/conflict rules are approved. Preserve all historical rows and immutable codes. PR #4 is merged at fa2cbc4867994dcde5e81ba0ee3d5b417d2ac8b8; feature/reference-administration starts from that origin/main. No employee/salary/report completion is implied.

## Country/currency increment — 22 November 2026

ADR-004 reconciles read-only ISO catalogue with HR activation. P4b implements pinned catalogue, country policy administration, immutable codes, currency precision/reference guards, active-status locks, audits, confirmations and DB/browser tests. Local validation: 27 country/currency PostgreSQL checks and 3 country Chromium cases pass, alongside existing gates. FX is P4c and salary bands remain deferred. PR #6 documentation pack is merged at a2dea9f; branch feature/country-currency-administration starts from that origin/main. No deployment or full-system acceptance is implied.

## FX administration increment — 22 November 2026

PR #7 merged at 0e0fb86d13bb01903b98df19acb6f2c3aba38223, verified through GitHub MCP; feature/fx-rate-administration branched from origin/main. P4c delivers immutable HR rate revisions, reader history/as-of lookup with configured staleness, audit before/after, confirmations and tests. Local DB and authenticated Chromium validation passed; employee linkage and employee/salary/report workflows remain next, bands deferred.

## P5 employee development — 22 November2026

PR #8 merged at2a3ee19cb6e5c360929e62444a5eca69d074d3ef; feature/employee-management starts from fetched origin/main. P5a delivers read-only directory/profile first,with literal search,country/department/status filters,whitelisted sorts,page25/max100 and strict non-salary projection. FR-EMP-04 salary bands remain deferred; no mutation or linkage claim. ADR-005 explicitly approves independent HR linkage/reason/confirmation/one active account/audit/revocation/unlinked-write denial and pending initial salary with independent approval. Next slices must atomically create employee plus pending initial request and update backdated-only request constraints via reviewed migrations,not insert an approved initial salary. Separate linkage/creation/lease/write workflows follow after this increment's reviewed merge. Local19 directory DB and34 scoped Chromium checks passed; PR review/current-head CI pending.
