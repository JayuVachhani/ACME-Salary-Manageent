# Technical decision index

## Publication verification — 22 November 2026

Required local publication checks passed on this React branch: lint, workspace typechecks/builds, 31 unit tests, QA typing, architecture gate (71 source files / 7,549 assertions), isolated PostgreSQL integrity/authorization/concurrency suites, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The initial reference run exposed a startup identity/OTP race; fresh post-login identity retrieval now cancels and settles the older anonymous query, with a regression test. A later cold login request stalled; the complete 22-case serial rerun passed without relaxed timeouts or authorization checks. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md. No self-approval, merge or production deployment; broader unmet/blocked requirements remain open.

Setup history: incomplete dependencies and a Windows PostgreSQL DLL lock required a clean dependency reinstall and preserved local-instance restart; Prisma was regenerated. An overlapping disposable-database migration hit shared-role contention and the database suites passed serially. No existing database was reset. Historical deferred-check snapshots below do not describe this publication checkpoint.

## Earlier checkpoint records

Current React audit remediation (22 November 2026): shared controls/tables/pagination/request states, employee dependency invalidation, typed notification feedback and accurate delivered-scope copy implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

Authoritative decisions are recorded in [DECISIONS.md](DECISIONS.md), including ADR-002 (21 November 2026).

## Current frontend decision — 22 November 2026

Rules alignment in progress (22 November 2026): frontend global state now uses Redux Toolkit 2.15.0 / React Redux 9.3.1 and one RTK Query API/cache. Feature-owned endpoints replace custom remote-state effects; server identity is read through useSession from the query cache. Session Context and useResource are removed. Forms, confirmation snapshots and OTP inputs stay local; OTP credentials bypass Redux actions/cache through the same shared secure transport. AppProviders owns store/error-boundary/notification composition; the authenticated workspace is lazy loaded with Suspense. Logout/self-removal/established-session 401 clears cached protected data; 403 refreshes current identity. No API/schema/financial rule changes. **Uncommitted and unverified: no tests, lint, typechecks, builds, safety scans or browser checks were run for this increment, at the user's request.** Existing PR #12 checks cover its published head only; PR #11 backend and PR #10 linkage remain separate pending work.

Use one RTK Query API with feature endpoint injection, generated query/mutation hooks, successful-write tag invalidation and no persisted cache. Session identity is query-owned; global notifications use createSlice. Keep OTP exchange outside Redux to prevent credentials entering action arguments/cache. Maintain same-origin cookies/CSRF and exact-decimal/versioned API contracts. ErrorBoundary and lazy authenticated Workspace belong to app composition. Conditional standards (JWT/passwords/Redis/queues/microservices) do not authorize replacing approved OTP sessions or adding unused infrastructure. See FRONTEND_ARCHITECTURE_AUDIT.md for actual source ownership and pending checks.

## Implementation choices

- Team decisions: preserve the authenticated identity lock through each team transaction, serialize team decisions with a PostgreSQL advisory lock, and use `team_version` for optimistic form concurrency. Migrations 011/012 enforce continuity/protection and transactional before/after audit. Invitations send after commit; SMTP failure leaves a valid pending invitation with an explicit failed-delivery response and audit event. See TEAM_MODULE.md for contracts and boundary decisions.

- Email login increment: see LOGIN_MODULE.md. Use pinned Nodemailer SMTP transport with production TLS and disabled message logging/file/URL access. Delivery is outside the public response path and failures invalidate the issued challenge. PostgreSQL-backed rate events and a short global advisory lock implement atomic email/pair/IP limits across processes; denied attempts count toward the IP throttle. No proxy headers are trusted implicitly. Auth rate-event retention/operational sizing requires a release policy; this increment does not silently delete audit or employee records.

- Keep PostgreSQL-specific integrity in forward-only, checksummed SQL migrations. Prisma schema is introspected from the migrated database and Prisma Client provides typed access. Never run `prisma db push` against application data: it cannot preserve all triggers, checks and derived objects.
- Pin stable Prisma 7.10.1; npm's current Prisma CLI `latest` resolves to an 8.x release candidate. Use the matched stable client/adapter/CLI instead of adopting a release candidate without need.
- Override Prisma config's transitive Effect dependency to 3.22.1 for [GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw). Final dependency audit is clean and Prisma generation passes with the override. Remove the override only after upstream adopts a patched version and compatibility checks pass.
- Prisma's PostgreSQL adapter uses runtime-only credentials; migrations use owner credentials. Query/parameter logging is disabled.
- Approval request and decision records are immutable. Authoritative salary rows exist only after approval for backdated changes. Deferred database constraint prevents an approved decision from committing without its salary row.
- Salary insertion automatically appends history/audit and advances employee version in the same transaction. Business dates come from the application's UTC clock, including a controllable test clock.
- Calculated amounts use decimal.js at 60 significant digits. Reject entered salary precision beyond country rules; keep conversion legs unrounded until final calculation/display rounding. FX provenance includes immutable rate IDs and inverse flags.
- Snapshot reads lock/re-read current user state, verify compensation/export permissions and ownership, and check stored authorization version, invalidation and expiry within the caller's transaction. These guards are internal until authenticated endpoints are delivered.
- Retention hold/release records are immutable and HR-attributed; database triggers serialize holds against employee removal and audit hold events.

## Remaining implementation work

### Approval currency revalidation (PR #1 follow-up)

Submission-time currency validation is insufficient: HR can deactivate a currency while a request is pending. Approval now reloads and shares-locks the requested currency inside its transaction, before inserting a decision. Migration 006 enforces the same rule in the database decision trigger. A deactivation already in flight blocks validation until its outcome is visible; deactivation that follows an acquired approval lock waits for that approval to finish. Earlier applied migrations/checksums are unchanged.

An inactive currency blocks approval without changing the request, salary, history, decision audit or employee version. Rejection remains permitted because it cannot apply compensation. Reactivating the currency permits a fresh approval attempt of the pending request, subject to all other checks. Existing historical salary rows are never rewritten by currency lifecycle changes.

Regression was first executed against the old code and failed with "Missing expected rejection". The service, direct SQL, rollback, concurrent-deactivation, rejection and reactivation paths pass against real isolated PostgreSQL after the fix (38 approval checks total).

Session guards and APIs/UI are not delivered yet. The internal approval service receives its actor from the future trusted session boundary, not a client-supplied body field. Retry/idempotency, lease integration, complete input DTOs, reference administration and approval UI/E2E belong to later vertical slices. Do not advertise the approval module as complete based on backend/database tests alone.

## P4c FX administration implementation — 22 November 2026

Implements the approved HR-maintained, immutable historical FX policy; this is not a new client business decision. Authenticated HR appends a revision with effective date, source and reason; non-HR needs read permission to view history/lookup. No per-entry override or third-party FX provider is added. Session identity supplies the actor; expectedRevision and pair/date advisory locking reject stale concurrent writes. Both currencies are revalidated under shared locks. Historical reads remain valid after deactivation.

The existing NUMERIC(18,8) contract is enforced before persistence without rounding entered rates. Historical lookup uses configured FX_MAX_STALENESS_DAYS, direct/inverse/USD precedence, revision IDs and exact decimal helpers. Migration018 adds before/after payloads only for newly appended audit events, preserving all existing rows. This unit-factor preview does not implement reports or change existing salary/report snapshot provenance. See FX_MODULE.md for the public contract and QA records for executed evidence.

## P5a employee reads and approved ADR-005 boundaries

Read-only directory uses explicit non-salary projection,validated sort whitelist and parameterized literal ILIKE escaping. A single SQL CTE statement derives total and ordered page from the same snapshot; UTC assignment cutoff uses transaction-stable CURRENT_TIMESTAMP. Current user/session locks guard each read,not a cached frontend identity. Filters expose reference labels to read members without widening HR configuration endpoints. No schema/config change; default25/max100 follows FR-EMP-04. Missing salary-band filtering is explicit deferred integration.

ADR-005 is a newly approved business rule: verified independent HR linkage with audited reason/confirmation,one active account per employee,self/unauthorized relink denial,session/snapshot invalidation and no unlinked salary writes. Initial salary requires independent approval including backdated effective dates. These cannot be safely met by the current backdated-only request table and immediate initial ledger path; a forward migration and complete write slice are required. This directory PR does not expose those paths or claim them implemented. Existing internal salary tests remain scoped foundations.

Windows CI runtime fix:minimum/pin24.20.0 replaces24.15.0 after a verified native child-process crash blocked PR #9. Upstream24.20.0 contains61999 libuv Windows fix (see BROWSER_TEST_RUNTIME.md); exact causal diagnosis remains provisional. No framework/dependency or business rule change; new-runtime full tests/current-head CI required,zero retries. Global runtime untouched.

## React frontend architecture — 22 November 2026

The complete delivered frontend uses app/ for composition/styles/health, features/<capability>/ for a public index, typed API/types, workflow hook and UI components, and shared/ for transport, resource/action hooks and native dialog lifecycle. main.tsx only mounts StrictMode/App. App owns Workspace feature composition; auth UI no longer imports team/reference/employee/country/FX features. There are no cross-feature implementation imports or dependencies on Nest/Prisma/database types.

Historical published conversion (superseded by the RTK decision above): SessionProvider owned the server identity as one source of truth. It requests /api/v1/auth/me on mount even without a readable CSRF-cookie hint, and refreshes it once after successful verification. A 401 means anonymous; other failures remain visible. No token or identity is persisted in browser storage. The provider clears identity only after successful logout or confirmed self-removal. UI visibility remains HR/read gated; the server remains the authorization authority. React StrictMode's aborted effect probe is supported.

Feature APIs own endpoint contracts; shared/api/client.ts owns relative same-origin fetch, explicit same-origin credentials, current CSRF for mutations, caller cancellation plus bounded timeout, and safe JSON/error mapping. URL normalization rejects external destinations, including backslash/control-character variants. No automatic mutation retries, financial rounding or cached authorization is introduced. FX rates remain decimal text; expected versions/revisions remain in confirmed payloads.

Workflow hooks own requests, drafts, confirmation snapshots, mutation state and success/error handling. useResource aborts superseded generations and ignores late/unmounted responses; useAction serializes immediate duplicate submissions and aborts pending transport on unmount. Cancelling a browser request does not undo a committed server mutation; uncertain outcomes still require refresh before retry. ConfirmationDialog alone owns native showModal/close/Escape lifecycle; labels/details/busy restrictions remain feature-specific. EmployeeProfile is keyed by employee ID with its own request lifecycle, so an earlier profile cannot render under a new selection.

Historical pre-Redux decision: React19.3.1 and TypeScript6 strict checks remained pinned. No router, Redux, query framework, UI kit or new runtime dependency was then required for the existing single-page workflows. Architecture checks enforce feature public boundaries, import cycles, pure APIs, one transport/cookie/dialog boundary, bootstrap-only main and stateless feature UI. Existing SMTP/Chromium workflows remain the behavioral gate, strengthened for no-cookie-hint session restoration and profile cancellation. Foundation console QA explicitly records only the expected anonymous /me401; every other console error, including /me500, remains a failure. The window-timer health deadline remains testable with browser clock controls.

This branch starts from main1e0e65f. Pending Nest refactor PR #11 and linkage PR #10 remain preserved separately; this React change uses unchanged existing APIs and does not claim those PRs merged. Backend/schema/environment/permission rules and missing business workflow scope are unchanged. See FRONTEND_ARCHITECTURE_AUDIT.md and QA_EXECUTION_REPORT.md for evidence and status.
