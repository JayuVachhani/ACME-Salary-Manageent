# Technical decision index

## PR #10 integration — 22 November 2026

PR #10 merged to main at `4509d5fa272ea1e3a3db785affa245d6a7cbdc5d`. This PR #11 checkout merges that base and ports linkage to native `team/team.controller.ts`, `team/team.service.ts` and `team/dto/team.dto.ts`; no legacy controller factory/service is restored. Migration019 is retained unchanged. The shared member response contract includes nullable employee_id for link/list/invite/change/reinvite responses; OpenAPI derives the same projection. The isolated linkage suite now boots the real application, including global validation/security/response boundaries. Existing independent-HR, audit/revocation/version/rollback rules remain. Combined local lint/types/builds, 27 units, all17 linkage SQL/real-HTTP checks, native architecture/OpenAPI (including required employee_id projection and production docs absence), serial isolated database suites and all9 affected authentication/team Chromium cases passed. Final publication/current-head GitHub CI remain pending; earlier branch-only passes below are historical. React PR #12 remains separate until PR #11 is independently merged.

## Earlier checkpoint records

## Publication verification — 22 November 2026

Required local publication checks passed on this NestJS branch: lint, workspace typechecks/builds, 27 unit tests, QA typing, isolated PostgreSQL integrity/authorization/concurrency suites, native NestJS architecture/OpenAPI checks (including production documentation absence), HTTP health smoke, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The FX email-capture case timed out on the first run; its isolated three-case group passed on rerun without timeout or authorization changes. Environment setup failures and deferred-check snapshots below are historical. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md; no self-approval, merge or production deployment is claimed. The broader unmet/blocked requirements remain open.

## Earlier checkpoint records

Current NestJS audit remediation (22 November 2026): pool error handling, shared failure-safe transaction mechanics, typed query/response contracts, exact-origin config and honest committed invitation delivery/audit outcomes implemented. Verification remains deferred at user request: no test/lint/type/build/browser/safety command ran. No commit/push/new CI/merge. See the current architecture audit for source ownership and pending scenarios; earlier pass records below are historical.

## Current NestJS rules alignment — 22 November 2026

NestJS rules alignment (22 November 2026), implemented but unverified: the existing capability modules/native injectable services remain. Concrete request DTO classes feed one APP_PIPE RequestValidationPipe and schema-derived OpenAPI input contracts. All delivered controllers use this path; the old per-parameter ZodValidationPipe is removed. OTP verification alone defers parsing to AuthService to preserve malformed-attempt throttling/audit. APP_FILTER HttpExceptionFilter handles application/framework/unknown failures with a safe 5xx fallback and preserves readiness's intentional 503 body. RequestContextMiddleware owns correlation/logging/no-store; CORS is limited to configured APP_ORIGIN. Development/test-only /api/docs, /api/openapi.json and /api/openapi.yaml document delivered routes using Swagger 12.1.2. No financial/schema/permission/session policy changes. No tests, lint, typechecks, builds, safety scans or browser checks ran for this increment, per user instruction. Changes remain uncommitted/unpublished; historical passes do not validate this working tree.

TeamInvitationsService owns post-commit invitation orchestration; controllers only adapt HTTP and delegate. Preserve direct TeamService transaction contracts and TeamNotifications failure accounting.

Keep one validation authority: existing strict Zod schemas now provide concrete runtime DTO classes, global APP_PIPE validation and OpenAPI input contracts. Do not add a second class-validator model or a no-op ValidationPipe merely for naming. Preserve transaction-bound session/permission checks and OTP malformed-attempt audit semantics. Shared middleware owns protocol preprocessing; one exception filter owns final HTTP mapping. Response DTO schemas document existing projections without adding response fields. Swagger is local/test only with no interactive submissions or persisted credentials. No JWT/password/queue/cache conversion or new business rule is authorized by generic conditional guidance. See BACKEND_STRUCTURE_AUDIT.md for source ownership and deferred checks.

## Historical decisions — superseded where noted above

Authoritative decisions are recorded in [DECISIONS.md](DECISIONS.md), including ADR-002 (21 November 2026).

## Implementation choices

- ADR-005 linkage backend uses the existing team service/controller factory, strict Zod schema, legacy Nest method decorators and explicit pg transactions. No new wrapper/decorator DSL or dependency is needed. Nest's official controllers/authentication documentation and installed Nest 12 types confirm the route binding; TypeScript 6 build/typecheck verifies the implementation. Migration 019 keeps SQL guards/audit alongside existing triggers and unique live-account linkage. Account creation must start unlinked; linking requires an independent current HR session, reason, confirmation and expected team version. Target sessions/open OTPs/edit leases and relevant report snapshots are invalidated atomically. No salary write endpoint is introduced until subsequent ADR-005 initial-salary and session/lease safeguards are delivered. See TEAM_MODULE.md for the exact HTTP contract.

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

## P4c FX administration implementation â€” 22 November 2026

Implements the approved HR-maintained, immutable historical FX policy; this is not a new client business decision. Authenticated HR appends a revision with effective date, source and reason; non-HR needs read permission to view history/lookup. No per-entry override or third-party FX provider is added. Session identity supplies the actor; expectedRevision and pair/date advisory locking reject stale concurrent writes. Both currencies are revalidated under shared locks. Historical reads remain valid after deactivation.

The existing NUMERIC(18,8) contract is enforced before persistence without rounding entered rates. Historical lookup uses configured FX_MAX_STALENESS_DAYS, direct/inverse/USD precedence, revision IDs and exact decimal helpers. Migration018 adds before/after payloads only for newly appended audit events, preserving all existing rows. This unit-factor preview does not implement reports or change existing salary/report snapshot provenance. See FX_MODULE.md for the public contract and QA records for executed evidence.

## P5a employee reads and approved ADR-005 boundaries

Read-only directory uses explicit non-salary projection,validated sort whitelist and parameterized literal ILIKE escaping. A single SQL CTE statement derives total and ordered page from the same snapshot; UTC assignment cutoff uses transaction-stable CURRENT_TIMESTAMP. Current user/session locks guard each read,not a cached frontend identity. Filters expose reference labels to read members without widening HR configuration endpoints. No schema/config change; default25/max100 follows FR-EMP-04. Missing salary-band filtering is explicit deferred integration.

ADR-005 is a newly approved business rule: verified independent HR linkage with audited reason/confirmation,one active account per employee,self/unauthorized relink denial,session/snapshot invalidation and no unlinked salary writes. Initial salary requires independent approval including backdated effective dates. These cannot be safely met by the current backdated-only request table and immediate initial ledger path; a forward migration and complete write slice are required. This directory PR does not expose those paths or claim them implemented. Existing internal salary tests remain scoped foundations.

Windows CI runtime fix:minimum/pin24.20.0 replaces24.15.0 after a verified native child-process crash blocked PR #9. Upstream24.20.0 contains61999 libuv Windows fix (see BROWSER_TEST_RUNTIME.md); exact causal diagnosis remains provisional. No framework/dependency or business rule change; new-runtime full tests/current-head CI required,zero retries. Global runtime untouched.

## NestJS architecture conversion — 22 November 2026

The complete API uses capability modules with top-level controllers and native @Injectable application services. AuthModule provides AuthService for OTP orchestration and AuthenticationService for transactional persistence/session verification. TeamModule owns TeamService and TeamNotifications; CountryCurrencyModule, OrganizationReferencesModule, FxRatesModule, EmployeesModule, HealthModule and internal SalaryModule each register class providers. Feature modules construct no service graph through useFactory; ConfigModule and DatabaseModule retain factory providers only for validated primitive settings and the external pg Pool.

Feature DTO folders own Zod schemas, including auth DTOs. ZodValidationPipe is bound to Nest Body/Param/Query decorators for feature routes; MutationRequestGuard validates Origin/CSRF before pipes on mutations. Authentication keeps origin-first validation and counts malformed verification attempts in AuthService. RequestSecurity in the shared HttpModule centralizes cookie extraction, Origin and CSRF transport checks. Every business operation retains session/permission revalidation within its SQL transaction. Controllers contain no pg imports, SQL, manually created application services or mail delivery. Domain calculations/policy remain framework-free functions in common/domain; internal report snapshot functions remain transaction-bound helpers, not public routes.

ApplicationError is framework-free. ApplicationErrorFilter maps application rejections to existing HTTP status/message bodies; health readiness retains its structured response. Services no longer throw HttpException. MailService owns mail adapter creation; OtpDeliveries tracks pending work. ApplicationLifecycle.onApplicationShutdown drains after HTTP disposal, then closes the pool. main.ts only starts the app; app.ts configures HTTP; AppModule is the composition root. Internal SalaryModule has no controller or exported approval provider.

This is a Nest modular monolith with explicit SQL transaction ownership. It preserves the approved pg/Prisma split, immutable migrations, current lock order and atomic audit. Nest CLI scaffolding, class-validator, repositories for every table, CQRS and microservices add no required boundary here. The tsc ESM/Node16 build remains. Architecture tests enforce native providers, thin controllers, transport error separation, shared DI, private feature providers, public route contracts and cleanup order. Database and browser evidence remain separate gates.

This branch starts at merged main1e0e65f. Pending PR #10 linkage/migration019 remains on feature/backend-linkage; reconcile its controller change after independent merge. No salary API, new permission, FX rule, schema/environment contract or production scope is invented. See BACKEND_STRUCTURE_AUDIT.md for the audit and final verification.

Final transport conventions: feature DTOs bind through Nest parameter pipes; AuthOriginGuard and MutationRequestGuard execute before validation. OTP verification deliberately passes unknown input to AuthService so malformed attempts are still throttled/audited. No controller performs schema parsing, persistence or service construction. This is tested as an architecture boundary, in addition to real HTTP behavior. Native guards do not replace transactional session/permission checks.
