# React frontend architecture audit and conversion

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

## Current audit remediation — implementation only

Audit remediation checkpoint — 22 November 2026: the ten source-audit findings have implementation changes in the existing React and NestJS working copies. **Implemented, not verified**: no test cases inspected, no tests/lint/typechecks/builds/browser checks/safety scans run, no staging/commit/push/new CI/approval/merge. Published PR checks are historical and do not validate these edits. Preserve unrelated handoff-document-prompt.md. React stays in the primary checkout on chore/react-frontend-architecture; backend stays in .worktrees/nestjs-rules on chore/nestjs-backend-structure. No reset, schema migration or new financial/permission/retention policy is introduced.

| Audit ID | Implementation | Status |
|---|---|---|
| ARCH-001 React controls | All delivered feature form inputs/selects/textareas/checkboxes/forms use shared form-controls.tsx; Button owns button defaults/busy/variants. Native tags remain inside the shared primitives. Labels, native constraints, IDs and change handlers are preserved; optional hint/error ARIA links are centralized | Implemented, unverified |
| RUN-002 cache dependencies | Employees list/profile provide Employees tags; reference/country writes invalidate Employees and EmployeeFilters after success. Failed mutations retain form concurrency versions | Implemented, unverified |
| RUN-003 feedback masking | Separate local ActionFeedback and query RequestState; query failures render independently, prevent false empty-state rendering and do not compete with retained success text. Explicit refresh errors have one inline owner | Implemented, unverified |
| ARCH-002 notifications | Bounded/deduplicated typed success/error/info/warning queue, individual dismissal and persistent assertive/polite regions. Significant actions announce once; local validation/instructions stay inline | Implemented, unverified |
| RUN-007 stale copy | Foundation copy now identifies delivered employee/admin scope and unfinished salary/approval/reporting scope; signed-in status no longer says employee data is absent | Implemented, unverified |

Shared `DataTable` supplies semantic captions/head/body and keyboard-focusable horizontal scrolling for all six tables. `Pagination`/`OffsetPagination` serve all five paged lists; CurrencySelect serves country defaults and FX pairs, retaining unavailable-current selections. `RequestState`, `ErrorState`, `LoadingState`, `EmptyState` and `ActionFeedback` separate query and action lifecycles. `shared/format/date.ts` owns invitation timestamp date display. Field state/business handlers remain feature-local; no generic business form engine, table query engine or extra runtime package is added.

The additive backend delivery value `failed_audit_unavailable` is represented by the React Delivery union. Team feedback distinguishes sent, delivery failed, and delivery plus audit recording failed, while making clear the invitation was saved. Existing sent/failed responses remain supported by this branch. Cross-branch integration and real behavior are still pending.

Later verification must cover every control label/constraint/disabled state, native date/numeric/checkbox behavior, dialog keyboard focus, mobile scrolling, pagination labels, typed notifications/deduplication, employee label invalidation and successful-save/failed-refresh scenarios. Existing architecture assertions may need adapting to shared UI hooks/components; do not exempt real boundary violations or relabel historical checks as current passes.

### Earlier checkpoint — superseded where it describes removed UI/feedback behavior


## Current rules alignment — implemented, verification deferred

Rules alignment in progress (22 November 2026): frontend global state now uses Redux Toolkit 2.15.0 / React Redux 9.3.1 and one RTK Query API/cache. Feature-owned endpoints replace custom remote-state effects; server identity is read through useSession from the query cache. Session Context and useResource are removed. Forms, confirmation snapshots and OTP inputs stay local; OTP credentials bypass Redux actions/cache through the same shared secure transport. AppProviders owns store/error-boundary/notification composition; the authenticated workspace is lazy loaded with Suspense. Logout/self-removal/established-session 401 clears cached protected data; 403 refreshes current identity. No API/schema/financial rule changes. **Uncommitted and unverified: no tests, lint, typechecks, builds, safety scans or browser checks were run for this increment, at the user's request.** Existing PR #12 checks cover its published head only; PR #11 backend and PR #10 linkage remain separate pending work.

- `app/providers.tsx` composes the Redux Provider, accessible notification region and render error boundary. `app/app.tsx` loads Workspace only after server identity is available; Suspense covers bundle loading. Existing single-page workflows do not require an invented route hierarchy.
- `shared/state/store.ts` wires the API reducer/middleware, focus/reconnect listeners and session lifecycle listeners. `shared/state/hooks.ts` provides typed hooks; `notifications.ts` owns global feedback. Redux DevTools and browser persistence are disabled to avoid retaining employee records outside the live in-memory UI.
- `shared/api/base-api.ts` provides the common transport adapter, serializable safe errors, health/session reads and protected-data tags. Feature `api.ts` modules inject typed list/detail/mutation endpoints. Success invalidates relevant tags; conflicts and failed mutations do not silently replace form versions. Country/FX share the currency query, and employee filters have their own query/tag.
- `shared/api/query-state.ts` only maps query results into view models; it owns no state/effect/cache. `run-request.ts` connects local action cancellation to RTK Query without serializing AbortSignal. `shared/hooks/use-action.ts` still owns local submission locks/inline feedback, not server data. No parallel `useResource` or session Context remains.
- OTP request/verify use the same centralized transport directly from the local login workflow. This deliberate security boundary prevents OTP codes entering RTK action arguments/cache; it is not a second cache or HTTP client. Session identity remains query-owned; logout uses a regular RTK mutation and the same session-expiry handling. Cookies/CSRF, response contracts, decimal strings and optimistic versions remain authoritative.
- Unsubscribed protected results expire immediately; focus/reconnect/mount revalidate active queries. Session loss aborts in-flight requests and clears the API cache before recording anonymous identity. Profile selection cleanup explicitly aborts its selected-ID request. Lookup resolution derives from its RTK query result rather than a second local data copy.
- Server errors at 5xx use a generic message; network/cancellation/HTTP outcomes share the transport adapter. Authenticated 401 clears session data with one notification; anonymous /me 401 is normal. Forbidden requests keep their feature error and revalidate identity. Render failures show a safe reload fallback; existing inline form feedback remains local instead of generating a toast on every field/list update.

Dependencies were installed with lifecycle scripts/audit disabled. npm reported the host Node 24.15.0 is below the repository's >=24.20.0 requirement; no runtime validation was attempted. Required checks, architecture regression updates if needed, browser behavior and independent review remain pending until authorized. No current increment pass is claimed, and no commit/push/CI was initiated.

Official references used: [RTK Query custom base queries](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries), [feature endpoint injection](https://redux-toolkit.js.org/rtk-query/usage/code-splitting), [cache behavior](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior), [React error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).

## Historical published React conversion — before the new Redux requirement

The following report and pass records describe published PR #12 at `7d6bc1555d2cbd241c86e1f1459bca25c47cd31f`, not the unverified working-tree changes above. References to SessionProvider/useResource/no Redux below are historical implementations that have now been superseded.

22 November2026 (Asia/Calcutta). Scope: the complete implemented frontend/src, Vite/TypeScript/QA consumers and affected source documentation. Base: origin/main1e0e65f; branch chore/react-frontend-architecture. Read-only source/contract inspection preceded implementation. Verdict: **pass with documented scope limits** after remediation and final verification. This is not full salary/reporting or production acceptance.

## Baseline and project profile

React/ReactDOM19.3.1, TypeScript6.0.3 strict, Vite8.3.8 and npm workspaces. The baseline was a single-page React application: bootstrap and page in main.tsx, six flat feature screens, and CSS. Each screen owned transport, state, async effects, forms, tables and confirmation handling; Login also composed every authenticated feature. There was no router, Redux/query framework, UI library or shared HTTP client. The existing API contracts, native dialogs, exact-decimal text and expectedVersion/expectedRevision checks were healthy and remain authoritative.

## Confirmed findings

### REACT-ARCH-001 — medium — app/feature/transport ownership — repaired

Evidence at base: main.tsx:1–29 combines mounting/page/health; login.tsx:3–7 imports all business features and its final render mounts them; team.tsx:5–55, organization-references.tsx:6–59, country-currency.tsx and fx-rates.tsx each combine workflow effects, raw fetch, DTO-like types, forms/tables and modal lifecycle. Response.json yields implicit untyped response values despite strict TypeScript. A change in session, request security/error handling or a feature's UI spans unrelated responsibilities and repeated transport implementations.

Remedy: app composes public feature entries; every feature has API/types/workflow/UI boundaries; shared code owns transport, resource/action lifetimes and native modal effects. No old root-screen compatibility stubs remain. Validation: all-source import/boundary/cycle checks, strict compilation, six transport tests and existing SMTP/Chromium workflows. New libraries or a rewrite of business/UI contracts are unnecessary.

### REACT-RUN-001 — medium — session restoration depends on a CSRF hint — repaired

Evidence at base login.tsx:15–27: restoration invokes /me only when acme_csrf is readable, then a second signedIn-driven effect fetches the identity again. HttpOnly session existence cannot be inferred from the readable CSRF cookie; a valid session without the hint is not restored. Two pieces of state can also temporarily disagree about signed-in identity.

Remedy: one SessionProvider owns the server identity, requests /me on mount regardless of the cookie hint, and refreshes once after OTP verification.401 becomes anonymous; network/other HTTP failures remain visible. Verification: AUTH-E2E-01 removes only the hint cookie, reloads, verifies restored access and one completed identity response, then restores the synthetic cookie to test CSRF logout. No localStorage/sessionStorage credentials or cached permission authority is added. StrictMode's aborted setup probe is supported.

### REACT-RUN-002 — medium — independent async request lifetimes — repaired

Evidence at base team.tsx:19–20: imperative load updates items/total without the initial effect's active flag; an initial response delayed past a mutation/refresh can overwrite newer results at the same offset. Equivalent refresh and initial-load paths in references/country/FX do not share cancellation/generation ownership. Most effect cleanup prevents some late updates, but does not arbitrate every imperative refresh against those effects. This is a stale-display/request-lifetime issue, not evidence of bypassed server authorization.

Remedy: one useResource owns each list's initial load, dependency changes and refresh generation, aborts previous work and checks generation/mount state before publishing. useAction locks duplicate synchronous submissions and aborts transport on unmount. Keyed EmployeeProfile has an independent selected-ID lifetime; browser regression holds one profile response, switches selection, requires cancellation and checks the new profile remains visible. Existing profile cleanup was already partly guarded; this regression protects the stronger shared architecture rather than claiming every earlier profile path was broken. Cancellation does not roll back server commits or authorize automatic mutation retries.

## Resulting architecture and compatibility

- main.tsx mounts App/StrictMode. app/app.tsx owns the page, app/workspace.tsx owns HR/read feature composition, app/use-api-health.ts owns the8-second display deadline and app/styles.css retains the existing CSS.
- features/auth,team,organization-references,country-currency,fx-rates,employees expose public index.ts entries. api.ts/types.ts own typed endpoint contracts; workflow hooks own state/effects/commands/snapshots; UI components own markup/forms/tables/profile rendering.
- shared/api/client.ts owns relative same-origin requests, credentials, fresh mutation CSRF, caller cancellation/timeouts and safe error messages. URL normalization rejects external destinations, including control/backslash forms. shared/api/currency-catalogue.ts is the read contract shared by country/FX, not a cross-feature implementation dependency.
- shared/hooks/use-resource.ts and use-action.ts own async lifetimes. shared/ui/confirmation-dialog.tsx owns showModal/close/Escape behavior. Drafts and expected versions/revisions are frozen in confirmation snapshots; requests use decimal text unchanged.
- No React feature imports another feature or app. Shared code imports neither. UI components do not perform raw requests, cookie access or own state/effects; API modules do not depend on React. The source graph is acyclic.
- All public API routes, SQL/schema/environment/permission rules, labels and delivered workflows are preserved. The intentional restoration fix now performs an anonymous /me check; foundation console QA explicitly records that exact401 and keeps every other error as a failure. No new backend endpoint is required.

## Verification and limitations

Baseline lint and web types passed before changes. Updated lint/types/API+web builds,28unit tests (22existing backend +6transport), QA typing and the React architecture gate pass. Initial sandbox Vite build was blocked by EPERM while resolving installed modules; the authorized external-sandbox build passed. No dependencies were installed or unpinned.

The architecture gate checks54source files for resolvable imports, feature public APIs, dependency cycles, API/UI direction, one transport/cookie/dialog boundary, no backend imports/storage credentials and bootstrap-only main. It is an architecture regression, not proof of every semantic or security property. Chromium is the behavior gate; final group results and exact-head GitHub evidence are in QA_EXECUTION_REPORT.md/GIT_CHANGELOG.md and the PR timeline. Pending checks are not passes.

No schema migrations, production deployment, load tests, new financial/approval/retention/permission rules or new business modules. Historical full-requirement failures and blocked workflows remain disclosed. PR #11 Nest architecture and PR #10 linkage are separately pending; this independent branch uses the current-main API and preserves both branches. Independent approval is required; author MCP comments are not approval. Source links must be reconciled if those other branches merge first.

Official React guidance used for the design: [custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks), [effect ownership](https://react.dev/learn/you-might-not-need-an-effect). No unsupported React API or new state framework is introduced.

Local React verification: all34 scoped Chromium checks PASS (12foundation +9auth/team +4references +3country/currency +3FX +3employees; zero retries). Includes no-CSRF-hint session restoration/one completed identity read and profile cancellation; focused strengthened-cancellation rerun also PASS3employee cases.28units,lint,workspace types/builds,QA typing and54source React architecture gate PASS. Existing CSS is byte-identical; no backend/schema/env/lockfile/runtime-dependency change. One moved-source Markdown link checked with no missing target; mobile employee screenshot inspected. Sandbox Vite EPERM was resolved through authorized test execution; no test failure is relabelled as a pass. Final push/current-head CI remains separately verified below.

Current response types describe the existing server contract at compile time; the transport safely validates error envelopes but is not a full runtime schema validator for every success payload. No claim of complete security/performance assessment follows from these structural and browser checks. The final local source graph gate passed6021checks; those static assertions are not6021application test cases.
