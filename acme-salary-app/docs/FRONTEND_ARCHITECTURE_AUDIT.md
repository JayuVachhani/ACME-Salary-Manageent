# React frontend architecture audit and conversion

22 November2026 (Asia/Calcutta). Scope: the complete implemented apps/web/src, Vite/TypeScript/QA consumers and affected source documentation. Base: origin/main1e0e65f; branch chore/react-frontend-architecture. Read-only source/contract inspection preceded implementation. Verdict: **pass with documented scope limits** after remediation and final verification. This is not full salary/reporting or production acceptance.

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
