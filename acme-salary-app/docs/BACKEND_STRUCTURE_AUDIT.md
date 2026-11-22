# Backend audit and structure repair

## PR #10 integration — 22 November 2026

PR #10 merged to main at `4509d5fa272ea1e3a3db785affa245d6a7cbdc5d`. This PR #11 checkout merges that base and ports linkage to native `team/team.controller.ts`, `team/team.service.ts` and `team/dto/team.dto.ts`; no legacy controller factory/service is restored. Migration019 is retained unchanged. The shared member response contract includes nullable employee_id for link/list/invite/change/reinvite responses; OpenAPI derives the same projection. The isolated linkage suite now boots the real application, including global validation/security/response boundaries. Existing independent-HR, audit/revocation/version/rollback rules remain. Combined local lint/types/builds, 27 units, all17 linkage SQL/real-HTTP checks, native architecture/OpenAPI (including required employee_id projection and production docs absence), serial isolated database suites and all9 affected authentication/team Chromium cases passed. Final publication/current-head GitHub CI remain pending; earlier branch-only passes below are historical. React PR #12 remains separate until PR #11 is independently merged.

## Earlier checkpoint records

## Publication verification — 22 November 2026

Required local publication checks passed on this NestJS branch: lint, workspace typechecks/builds, 27 unit tests, QA typing, isolated PostgreSQL integrity/authorization/concurrency suites, native NestJS architecture/OpenAPI checks (including production documentation absence), HTTP health smoke, 12 foundation Chromium cases and all 22 delivered-feature Chromium cases. The FX email-capture case timed out on the first run; its isolated three-case group passed on rerun without timeout or authorization changes. Environment setup failures and deferred-check snapshots below are historical. Final indexed scan, commit/push and exact-head GitHub CI are tracked in GIT_CHANGELOG.md; no self-approval, merge or production deployment is claimed. The broader unmet/blocked requirements remain open.

## Earlier checkpoint records

## Current audit remediation — implementation only

Audit remediation checkpoint — 22 November 2026: the ten source-audit findings have implementation changes in the existing React and NestJS working copies. **Implemented, not verified**: no test cases inspected, no tests/lint/typechecks/builds/browser checks/safety scans run, no staging/commit/push/new CI/approval/merge. Published PR checks are historical and do not validate these edits. Preserve unrelated handoff-document-prompt.md. React stays in the primary checkout on chore/react-frontend-architecture; backend stays in .worktrees/nestjs-rules on chore/nestjs-backend-structure. No reset, schema migration or new financial/permission/retention policy is introduced.

| Audit ID | Implementation | Status |
|---|---|---|
| RUN-001 background pool error | DatabaseModule attaches one pool error listener at creation; stable SQLSTATE/allowlisted event only, no raw exception/connection/query/parameter data | Implemented, unverified |
| OOP-001 response typing | Public feature query rows use schema-derived result/record types; Auth internal rows and current identity are typed. requiredRow handles SQL-guaranteed rows. APP_INTERCEPTOR ResponseContractInterceptor parses the same schema used by ApiResult/OpenAPI, strips undeclared projection keys and normalizes pg Date timestamps to ISO text | Implemented, unverified |
| RUN-004 committed notification result | TeamNotifications preserves committed invitation outcome when SMTP and failure-audit insert both fail; additive delivery=failed_audit_unavailable plus redacted operational event. Existing sent/failed meanings retained, no false claim of persisted audit | Implemented, unverified |
| RUN-005 exact origin configuration | APP_ORIGIN must equal URL.origin and use HTTP(S); credentials/path/trailing slash/query/fragment are rejected before startup. Production still requires HTTPS/secure cookies | Implemented, unverified |
| RUN-006 transaction failure mechanics | database/transaction.ts centralizes BEGIN/COMMIT/ROLLBACK/release. Failed rollback cannot mask the original operation/commit error; bad connection is destroyed. All existing feature/auth/rate/internal approval transaction wrappers delegate without moving authorization/locks/business mappings | Implemented, unverified |

`database/database-errors.ts` centralizes safe SQLSTATE extraction and redacted pool/rollback telemetry. Query results only retain driver defaults for writes/existence checks where no row payload is consumed; public projections and consumed auth/rate rows now have explicit result types. `database/query-result.ts` handles rows guaranteed by SQL, not business not-found cases. Shared backend permission constants feed team input/auth identity schemas.

`common/dto/response-values.ts` normalizes Date objects through timestampText; OpenAPI describes output strings while the runtime interceptor accepts pg Dates. Response schemas remain feature-owned. Invalid response data produces safe 500 mapping without logging schema values. This is a runtime contract repair, not evidence that schemas or integration have passed execution. A response failure after a committed mutation can still mean an unknown client outcome; no automatic mutation retry is introduced.

Transaction-bound current-session authorization intentionally remains inside each business transaction. Existing Origin/CSRF guards retain their transport role; ApiSession remains documentation, not authentication. Do not replace lock-bound checks with cached or guard-only identity. Readiness stays fail-closed 503 until approved schema readiness is delivered. Incomplete salary/report/approval workflows and historical unmet-requirement failures remain open.

Later checks must inject pool errors; BEGIN/work/COMMIT/ROLLBACK failures; verify destroy/release and preservation of original failures; malformed OTP attempt commits; SMTP plus audit failure after commit; DTO/output Date/null/decimal response contracts; safe 5xx handling; exact-origin configuration; and development-only OpenAPI generation. Existing tests/architecture consumers were deliberately not inspected or rewritten while verification is deferred.

### Earlier checkpoint — superseded where it describes untyped responses or repeated transaction mechanics


## Current rules alignment — 22 November 2026 — verification deferred

NestJS rules alignment (22 November 2026), implemented but unverified: the existing capability modules/native injectable services remain. Concrete request DTO classes feed one APP_PIPE RequestValidationPipe and schema-derived OpenAPI input contracts. All delivered controllers use this path; the old per-parameter ZodValidationPipe is removed. OTP verification alone defers parsing to AuthService to preserve malformed-attempt throttling/audit. APP_FILTER HttpExceptionFilter handles application/framework/unknown failures with a safe 5xx fallback and preserves readiness's intentional 503 body. RequestContextMiddleware owns correlation/logging/no-store; CORS is limited to configured APP_ORIGIN. Development/test-only /api/docs, /api/openapi.json and /api/openapi.yaml document delivered routes using Swagger 12.1.2. No financial/schema/permission/session policy changes. No tests, lint, typechecks, builds, safety scans or browser checks ran for this increment, per user instruction. Changes remain uncommitted/unpublished; historical passes do not validate this working tree.

### Profile and boundary decisions

NestJS 12.6.0 / Express, TypeScript 6.0.3 with decorator metadata and ESM/Node16 resolution, Zod 4.6.7, pg/Prisma and existing checksummed SQL migrations remain authoritative. Swagger 12.1.2 explicitly supports Nest 12/TypeScript 6 and is pinned in the API workspace/lockfile. The declared Node floor remains 24.20.0; dependency installation used the host 24.15.0 and reported an engine warning. Installation used --ignore-scripts --no-audit --no-fund; this is dependency preparation, not validation.

Architecture remains a capability-based Nest modular monolith: controllers adapt HTTP; native injectable services own business operations and SQL transactions; AuthModule owns current-session verification; Config/Database/Mail modules own shared infrastructure; domain calculations and reports remain framework-free/internal. No repository-per-table, JWT/password auth, Redis, queue, CQRS or new microservice is justified by this standards task.

### Gaps repaired in source

| Finding | Previous implementation | Implemented change | Verification status |
|---|---|---|---|
| Validation wiring repeated across controllers | Every Body/Query/Param repeated schema/pipe/message binding, which a new endpoint could omit | Concrete DTO runtime metadata plus one APP_PIPE; missing validation metadata fails closed. Strict schemas reject extra fields and retain coercion/trim/default/version rules. Old parameter pipe removed | Deferred |
| Missing OpenAPI contracts | No Swagger dependency or route/schema reference | Feature response DTO schemas and shared schema-derived input/error decorators document all delivered feature and health operations; exact-decimal fields remain strings | Deferred |
| Request preprocessing in bootstrap | app.ts contained correlation, timing, response logging and API no-store logic | Dedicated Nest RequestContextMiddleware registered by AppModule; allowlisted metadata excludes URLs/query/body/cookies/SQL/employee data | Deferred |
| Exception handling covered only application rejections | ApplicationErrorFilter covered its own application type while Nest supplied other defaults | One catch-all HttpExceptionFilter preserves expected <500 bodies, handles framework failures and emits a redacted correlation/status event plus generic unexpected 5xx JSON; approved readiness 503 body preserved | Deferred |
| CORS policy implicit | No explicit browser-origin configuration | CORS uses only APP_ORIGIN, credentials and required methods/headers. Existing Origin/CSRF guards and transactional authorization remain in force | Deferred |

### Current source map and contracts

- TeamInvitationsService now owns invitation/reinvitation orchestration and the shared post-commit delivery envelope. TeamController delegates one application operation per invitation endpoint; TeamService's direct transaction contracts and TeamNotifications' delivery-failure audit remain unchanged. This removes repeated notification orchestration from the HTTP controller without moving mail into the transaction.

- `common/dto/request-dto.ts` creates typed runtime DTO metadata from existing schemas. Feature `dto/*.dto.ts` exposes concrete classes; `common/pipes/request-validation.pipe.ts` validates/transforms them globally via AppModule's APP_PIPE. No class-validator/class-transformer validation stack duplicates Zod. This is the global validation pipeline for the approved schema stack, rather than an additional no-op built-in ValidationPipe for undecorated interfaces.
- OTP VerifyOtpDto declares deferred validation deliberately: AuthService still receives the raw value, parses against verifyInput, counts attempts and audits malformed rejections before responding. Guards still run before pipes. Other consumed HTTP bodies/query/parameter sets validate globally. Services retain their existing internal schema/invariant protection and transaction ownership.
- `common/http/api-contract.decorators.ts` converts those schemas to OpenAPI 3.0 and shares safe error/cookie/Origin/CSRF metadata. Defaults make query inputs optional; output constraints still describe valid values. Custom calendar/cross-currency/unique-permission refinements are also described in schema text; JSON Schema alone is not the business validator.
- Feature `*-response.dto.ts` files describe existing explicit wire projections; they do not add fields, serialize private records or replace query column allowlists. Date/timestamp projections remain JSON strings. Response documentation is not a newly verified runtime response validator.
- Development/test reference: GET `/api/docs` (read-only UI), GET `/api/openapi.json`, GET `/api/openapi.yaml`; production registers none of these. Interactive submit methods and persisted authorization are disabled. Credentials/OTP values and real employee examples are never embedded. No new environment variable is required.
- `common/http/request-context.middleware.ts` owns request IDs, no-store for /api/v1 and allowlisted response completion logs. `common/filters/http-exception.filter.ts` owns public error mapping and redacted unexpected-failure events. Old ApplicationErrorFilter is removed. main.ts remains startup-only; app.ts composes Helmet, explicit CORS and local OpenAPI setup.
- Transactional session/permission checks are intentionally not replaced by cached guard identities: authenticateWithin must execute inside each business transaction to preserve lock order, revocation and mutation atomicity. AuthOriginGuard/MutationRequestGuard remain the transport preconditions. No duplicate preflight authentication query or invented role policy is added.

### Delivery and pending work

Existing PR #11 branch `chore/nestjs-backend-structure`, published head `cfbac9ac8b86b3ae6346ce58bc9148a26e1c2320`, is checked out in the isolated `.worktrees/nestjs-rules` directory. The primary checkout's uncommitted React rules work and unrelated handoff-document-prompt.md remain preserved. PR #10 linkage is still separate and unmerged. Origin was fetched before edits. No new commit, push, CI, approval or merge occurred.

At the user's request, no test execution, test-case inspection workflow, lint/type/build, safety scanning, browser validation or OpenAPI-generation smoke check is performed for this increment. Existing architecture assertions/import consumers and behavioral checks may require updates for the new global DTO pipeline when verification is authorized; none were suppressed or rewritten to claim a pass. Required publication checks and independent review remain gates. Historical full-scope failures (12 passes / 14 unmet checks / 45 blocked workflows) and incomplete readiness/salary/report/approval workflows remain disclosed.

Official design contracts: [Nest pipes](https://docs.nestjs.com/pipes), [Nest middleware](https://docs.nestjs.com/middleware), [exception filters](https://docs.nestjs.com/exception-filters), [Nest OpenAPI](https://docs.nestjs.com/openapi/introduction), [Zod JSON Schema input/output conversion](https://zod.dev/json-schema).

## Historical published conversion — before the current standards increment

The report and pass records below describe the published PR #11 implementation. References to ZodValidationPipe/ApplicationErrorFilter/per-parameter binding are historical and superseded above. They do not validate the uncommitted rules alignment.

22 November 2026 (Asia/Calcutta). Scope: apps/api source, module wiring, executable consumers, configuration, tests and shutdown. Read-only audit completed before the authorized implementation phase. Baseline: NestJS 12.6.0 ESM modular-monolith business services with flat files, closure-created controllers and a bootstrap-local composition root. Audit verdict: **pass with risks**; structural remediation implemented, application scope remains incomplete.

## Quality gates

The bundled audit collector detected NestJS but could not run Windows .cmd wrappers (EINVAL); the API workspace has no local executable directory. Those collector checks are **not run**, not passes. Direct project commands are the authoritative verification below. Default shell Node24.15.0 is below the declared engine; commands use the existing project-local Node24.20.0 without changing global configuration or runtime .env. Initial sandbox Vite resolution failed EPERM; the authorized unsandboxed foundation retry passed.

- PASS: npm run verify:foundation (lint, both workspace typechecks, 22 unit tests, API/web builds).
- PASS: npm run test:authentication; test:team (22); test:references (23); test:country-currency (27); test:fx (23); test:employees (19), using disposable synthetic databases.
- PASS: test:approvals (38); test:rules (23 transactional synthetic checks); test:prisma; test:health; qa:typecheck.
- Final architecture/lifecycle and Chromium disposition: see QA_EXECUTION_REPORT.md and GIT_CHANGELOG.md. No pending check is a pass.
- Coverage: traced bootstrap, all six feature controller paths, shared authentication, transaction ownership, pg lifecycle, mail delivery, internal salary/snapshot helpers and downstream script imports. No load testing, production deployment, exhaustive security assessment or new full-business E2E acceptance.

## Finding summary

Two confirmed medium findings: architecture owner 1, runtime/lifecycle owner 1. No confirmed critical/high finding within this structural review. Existing unmet requirements remain open.

## Confirmed findings

### ARCH-001 — medium — nestjs-architecture-principles — repaired

Baseline origin/main 1e0e65f: src/main.ts:20–41 defines HealthController and AppModule inside bootstrap and registers six generated controllers. src/team-controller.ts:11–16 and equivalent factories construct AuthenticationService and feature services outside Nest's provider graph. This hides actual dependencies from module visibility and prevents replacing service providers in Nest container tests. Six authentication instances duplicate configuration and wiring. Remedy: top-level controllers in capability folders, explicit feature modules, private native application-service providers, AuthModule's exported singleton, ConfigModule/DatabaseModule/MailModule infrastructure providers. Validation: compile/build, real-container shared-instance and isolation assertions, all feature route registration checks, PostgreSQL and browser regressions.

### RUN-001 — medium — nestjs-professional-software-engineering — repaired

Baseline src/main.ts:67–69 replaces app.close to drain OTP work and end the pool. Nest's registered signal shutdown pipeline invokes lifecycle hooks and adapter disposal directly; overriding the public close method is not the lifecycle contract. Signal shutdown could bypass pending challenge invalidation and pool cleanup. Remedy: ApplicationLifecycle.onApplicationShutdown drains the MailModule-owned OtpDeliveries tracker after HTTP disposal, then ends the pool. One hook orders both operations; no dependence on parallel hook ordering or before-shutdown snapshots. Validation: real app.close lifecycle test holds pending work, proves pool remains open until delivery completion, then confirms pool closure. OS-signal delivery itself was not separately exercised on Windows.

## Needs verification

- /readyz intentionally remains 503/schema_not_verified even with reachable PostgreSQL. This is a documented fail-closed foundation contract, not repaired by guessing schema/production acceptance criteria.
- Resolved by full conversion: feature DTOs own request schemas; services throw framework-free ApplicationError; one global filter preserves HTTP mapping. All services are native injectable providers, including auth orchestration, notifications, health and internal salary approval.
- PR #10 account linkage is pending on feature/backend-linkage; this branch starts from main as required. Its migration019/controller delta needs reconciliation after independent merge, not silent inclusion or removal from that branch.
- Complete salary, reporting, approval UI, retention policy and production operations remain governed by existing requirements/decision blockers. Historical 12 passes /14 unmet-requirement failures /45 blocked workflows are not superseded by delivered-scope regressions.

## Healthy patterns verified

Parameterized SQL; identity revalidation and locks within each business transaction; commit/rollback/release ownership in services; strict Zod boundaries; exact decimal helpers; immutable SQL migrations; explicit public response projections; request logs allowlist metadata; notifications outside business commit; no ORM replacement or database reset. Internal salary approval and report snapshot helpers remain unexposed.

## Remediation order and resulting profile

1. Finish audit and identify wiring/lifecycle boundaries.
2. Move source/tests by capability; update executable imports without old-path re-export stubs.
3. Introduce modules and native injectable class providers, preserving directly constructed unit/service tests.
4. Replace closure controllers and bootstrap-local health; lifecycle-own resource cleanup.
5. Verify DI at runtime, SQL/HTTP/browser contracts, docs/source references and exact-head CI before independent review.

Current directories: auth/, team/, organization-references/, country-currency/, fx-rates/, employees/, health/, config/, database/, mail/, common/domain/, salary/ and reports/. main.ts starts the server; app.ts creates the app/middleware; app.module.ts composes features. Internal SalaryModule registers approval without exports/controllers; reports remain pure transaction helpers because their authenticated workflow is undelivered. Existing tsc build and npm workspaces remain; Nest CLI/scaffolding adds no required runtime capability here.

Reference contracts: [Nest modules](https://docs.nestjs.com/modules), [custom factory providers](https://docs.nestjs.com/fundamentals/custom-providers), [shutdown lifecycle](https://docs.nestjs.com/fundamentals/lifecycle-events). Installed Nest12 provider types and TypeScript6 compilation verify the used APIs.

Final local structure checkpoint: real Nest architecture/lifecycle test PASS after the composition-root cleanup change; final API build, workspace typecheck and lint PASS. All five delivered Chromium groups PASS (9 authentication/team +4 references +3 country/currency +3 FX +3 employee =22; zero retries). Existing future-requirement failures remain unchanged and are not a full-system acceptance pass. Script import and decorator inventories verified; no schema, environment, permission or route additions/removals. Staging safety and whitespace verified before commit. GitHub exact-head results remain separate from local execution.

## Full architecture conversion follow-up

The user required complete Nest architecture, superseding the first-pass factory-provider conversion. Service classes now use @Injectable and explicit runtime tokens for pool/auth/clock/config settings; all capability modules register class providers. AuthService and TeamNotifications remove persistence and delivery orchestration from controllers. HealthService removes pool access from its controller. Feature dto/ files own schemas; shared ZodValidationPipe and RequestSecurity own HTTP input mechanics; ApplicationErrorFilter owns HTTP mapping. No HTTP exceptions remain in application services. MailService owns adapter creation. Internal salary approval is an injectable private SalaryModule provider; report/domain functions stay framework-free. This is consistent modular-monolith architecture, not a claim of completed missing business functionality.

The architecture regression now rejects pg imports in controllers, manual service construction, missing @Injectable on services, service HttpException use and feature useFactory wiring. It verifies a real 401 application-error response through the global filter. Initial strengthened test exposed health's direct pg access; HealthService repair is included, rather than exempting it. An early backend rerun was blocked by stopped local PostgreSQL (ECONNREFUSED); the existing data directory was restarted without reset. Sandbox EACCES was resolved with authorized test execution. Final updated-code test results are recorded separately; first-pass passes are historical.

Updated-code browser attempt: login group 7PASS/2FAIL (AUTH-E2E-01 and TEAM-E2E-01 waiting for OTP form; first request recorded about8.1s against3s UI assertion). Remaining groups were not run because the group failed. This is not recorded as a pass. Backend/22unit/QA typing checks passed. A serial final rerun is in progress after native parameter pipes and MutationRequestGuard completed the transport conversion; tests/timeouts were not weakened. Guard checks transport Origin/CSRF before pipes, preserving rejection order; transaction-level session/permissions remain in services.

Final transport conventions: feature DTOs bind through Nest parameter pipes; AuthOriginGuard and MutationRequestGuard execute before validation. OTP verification deliberately passes unknown input to AuthService so malformed attempts are still throttled/audited. No controller performs schema parsing, persistence or service construction. This is tested as an architecture boundary, in addition to real HTTP behavior. Native guards do not replace transactional session/permission checks.

Final complete-conversion verification: all22 delivered Chromium tests PASS in the serial run (9auth/team,4references,3country/currency,3FX,3employees; zero retries). Final architecture/guard/pipe/filter/lifecycle test PASS, lint/API+web build/workspace+QA types PASS,22unit tests PASS; isolated authentication/team22/references23/country27/FX23/employees19/approvals38/health PASS. The earlier7PASS/2FAIL browser timeout attempt remains historical evidence, not erased or relabeled. Current application-wide requirement failures/blockers remain open. Exact-head GitHub CI and independent review remain separate publication gates.
