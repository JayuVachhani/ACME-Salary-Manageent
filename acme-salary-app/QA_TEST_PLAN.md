# ACME QA test plan

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

Current increment: Redux Toolkit/RTK Query, session-cache lifecycle, lazy workspace and error-boundary changes are implemented but unverified (22 November 2026). The user requested implementation first and checks only when explicitly requested. No tests, lint, typechecks, builds, browser QA or safety scans ran for this increment; existing pass records below are historical and do not cover the working tree. Do not commit/push until required verification is authorized and completed. See FRONTEND_ARCHITECTURE_AUDIT.md in acme-salary-app/docs for the current source map.

## React architecture verification — 22 November2026

Use `npm run test:web-architecture` from acme-salary-app (also in CI), plus lint/typecheck/test/build/qa:typecheck. Vitest includes web transport tests: total28unit tests, preserving22backend tests. Browser regression AUTH-E2E-01 now restores a server session after removing only the CSRF hint and checks one completed /me response; EMP-E2E-03 delays a profile, switches employee, requires cancellation and rejects stale profile output. All existing business assertions remain. Foundation console QA explicitly records expected anonymous /me401; /me500 and other unexpected errors still fail. The existing health display timeout remains controlled by the browser clock. Current source boundaries and audit are in docs/FRONTEND_ARCHITECTURE_AUDIT.md; exact final execution/publication disposition is in GIT_CHANGELOG.md and the PR timeline. Documentation-only verification is not a new application test pass; incomplete salary/reporting requirements remain open.
Required local publication checks passed on this NestJS branch: lint, workspace typechecks/builds, 27 unit tests, QA typing, isolated PostgreSQL integrity/authorization/concurrency suites, native NestJS architecture/OpenAPI checks (including production documentation absence), HTTP health smoke, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The FX email-capture case timed out on the first run; its isolated three-case group passed on rerun without timeout or authorization changes. Environment setup failures and deferred-check snapshots below are historical. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md; no self-approval, merge or production deployment is claimed. The broader unmet/blocked requirements remain open.

## Earlier checkpoint records

Current NestJS audit remediation (22 November 2026): pool error handling, shared failure-safe transaction mechanics, typed query/response contracts, exact-origin config and honest committed invitation delivery/audit outcomes implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

Current NestJS rules increment is implemented but unverified. The user explicitly deferred tests, lint, typechecks, builds, safety scans and browser checks until requested. No checks or new CI ran. Existing pass/failure records below are historical. Global DTO metadata/guard order, malformed OTP audit/throttling, response/error contracts, read-only OpenAPI generation and production route absence require later verification; existing architecture assertions must follow the new global pipeline without suppressing real failures. See acme-salary-app/docs/BACKEND_STRUCTURE_AUDIT.md.

Date: 21 November 2026. Scope: current local implementation, not a hypothetical completed release.

## Basis and inventory

Reviewed BRD, FRD and SDD including approved addenda, ADR-002, implementation/progress/traceability documents and existing config, policy, money, PostgreSQL, approval, Prisma and health tests. Approved decisions override superseded original text: OTP 15 minutes; separate salary visibility/export; independent HR approval for backdated changes; pending/rejected requests excluded from pay; historical FX; retention holds; permission-revalidated snapshots.

Historical initial-audit code inventory (21 November, superseded by the current increment below): one React foundation screen, skip link, service status and three informational panels. No login, inputs, business buttons, menus, confirmations or domain screens. NestJS exposes health endpoints only. Database services exist for approval and snapshot access, but no authenticated API links them to the browser. The executable browser audit will confirm this inventory instead of treating it as sufficient evidence.

## Execution strategy

1. Install pinned Playwright, Chromium and axe tooling within the project. Dedicated loopback QA ports prevent reuse of another development instance.
2. Run the real web app and API under Playwright webServer lifecycle. Exercise desktop/tablet/mobile layouts, keyboard navigation, status/loading/failure handling, console/network errors, accessible landmarks and automated WCAG scans.
3. Probe all requested workflow entry points and API routes. Missing entry capabilities fail explicit requirement tests. Downstream cases are recorded BLOCKED, not passed or silently skipped. Do not invent controls, fake login or test-only feature implementations to make results green.
4. Rerun existing unit and real PostgreSQL tests. Distinguish database/service evidence from browser E2E, especially pending/rejected salary selection and approval using separate synthetic actors.
5. Add regressions for discovered defects, fix bounded implementation issues, and preserve initial/final Chromium results, traces and screenshots. Run failed tests again after fixes.
6. Generate per-case expected/actual/status/issue tables and report overall readiness without hiding known requirement failures.

## Safety and evidence

Only synthetic data. Browser probes do not send employee mutations; public route probes use synthetic email or invalid synthetic IDs. Existing PostgreSQL suites either roll back fixtures or use a uniquely named disposable database. Do not truncate or reset the application database. Separate QA requester/approver actors are created only by the isolated approval suite; authenticated browser accounts cannot be created until bootstrap/auth exists.

Evidence: Playwright JSON/HTML, screenshots, traces, inventory and console/network attachments under `qa-artifacts/<run>/`; all commands and dispositions appear in QA_EXECUTION_REPORT.md. Browser status fault injection is explicitly labeled and does not prove live SMTP/database failures are handled.

## Coverage matrix / exit criteria

Authentication/OTP/session; invites/permission matrix; employee validation/search/removal; salary exactness/history; two-user locks; independent approvals; historical transfers; country precision/FX; report preview/CSV/snapshots; HR-only audit; responsive/accessibility/error states; real-database integrity; 10k seed/performance.

Release acceptance requires all critical workflows actually run, passing browser/API/database permission tests, no open critical/high defects, full synthetic seed and required performance/security checks. Missing modules prevent release acceptance even if the foundation regression suite passes. Automated axe checks are a subset of accessibility validation, not a WCAG conformance certification.
## Login increment verification

Team increment: run `test:team` plus `test:login` for actual independent HR/member browser contexts, invitation delivery/renewal, access changes on existing sessions, stale edits, self-change and last-manager denial, offboarding, confirmation cancellation, pagination, mobile/axe checks and failed SMTP visibility. PostgreSQL tests additionally inject an audit failure and race both service removals and direct SQL demotions. Fixtures remain confined to randomly named synthetic databases.

Run `npm run test:login` for isolated PostgreSQL + actual Chromium + loopback SMTP delivery. Cover real code receipt, sign-in, session cookie attributes, page reload, origin/DTO rejection, unknown-account responses, resend invalidation, attempt limits, logout/CSRF, SMTP failure and spoofed-forwarded-header throttling. Run `test:authentication` for concurrency, expiry, bootstrap and all email/IP thresholds, and retain the existing foundation suite. Use synthetic addresses only. Earlier full-application failures remain historical evidence until those workflows are executed again.

## Reference increment — 22 November 2026

Review ADR-003 and ORGANIZATION_REFERENCES_MODULE.md. Test both department/designation lists through real HR SMTP login and Chromium: confirmed creation/cancel, trimming/display case, case-insensitive duplicates, rename/deactivate/reactivate, stale edit, permissions, strict DTO, Origin/CSRF, loading/empty/error/success, pagination, mobile/axe and page errors. PostgreSQL tests separately verify immutable identities, no deletion/truncation, inactive assignment rejection/history retention, concurrent writes, before/after audit and audit-failure rollback. Existing login/team/foundation/compensation regressions remain required. Only synthetic disposable database fixtures are used. Country/currency/FX and deferred bands are not claimed as delivered.

## Country/currency increment

Execute test:country-currency on a disposable PostgreSQL database; verify catalogue read permissions, HR-only config, N.A./precision protection, inactive country/currency references, concurrency, immutable codes/history, stale updates and audit rollback. Execute country-currency.spec.ts through test:login with independent HR/read-member contexts, actual SMTP, confirmations/cancel, CRUD/lifecycle, negative DTO/Origin/CSRF, pagination, mobile/axe and visible outage recovery. Retain existing gates and do not claim full-system acceptance.

## FX administration increment

Execute test:fx in a unique synthetic database: role/CSRF/strict DTO boundaries, exact rate precision, immutable correction chain, before/after provenance, independent-HR conflicts, concurrent deactivation, audit rollback, historical/future/direct/inverse/USD/stale lookup and configured staleness. Execute FX Chromium group through test:login (4727/4728, independent HR/member accounts): confirm/cancel, correct, history/filter/paging, provenance, negative API/form states, outages, mobile/axe and console. Keep existing gates and missing-requirement failures.

## P5a employee directory

Execute isolated test:employees and employees.spec.ts through test:login:HR/read/no-read/anonymous,revoked permissions,non-salary allowlist,literal wildcard/case-insensitive search,current-v-future assignment,combined filters,all sort/direction,page25/100/empty/invalid,removed404,filter references and actual profile. Browser SMTP login,real API/profile,paging,empty/outage/loading recovery,mobile375px,axe/pageerrors. Employee mutations,verified linkage and salary approval not claimed by this slice.

Requirement probe maintenance:keep all14 IDs. Delivered private employee/country/FX modules assert anonymous hidden UI+401/no-store; authorized workflows execute in corresponding SMTP suites. Missing salary/history/approval/transfer/report/audit/dashboard and missing report/audit API assertions remain failing until implementation. Latest actual probe is6pass/8fail; this is not whole-system acceptance.
