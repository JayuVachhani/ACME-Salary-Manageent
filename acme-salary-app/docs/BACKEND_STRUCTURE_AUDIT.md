# Backend audit and structure repair

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

Baseline origin/main 1e0e65f: src/main.ts:20–41 defines HealthController and AppModule inside bootstrap and registers six generated controllers. src/team-controller.ts:11–16 and equivalent factories construct AuthenticationService and feature services outside Nest's provider graph. This hides actual dependencies from module visibility and prevents replacing service providers in Nest container tests. Six authentication instances duplicate configuration and wiring. Remedy: top-level controllers in capability folders, explicit feature modules, private application-service providers, AuthModule's exported singleton, ConfigModule/DatabaseModule/MailModule infrastructure providers. Validation: compile/build, real-container shared-instance and isolation assertions, all feature route registration checks, PostgreSQL and browser regressions.

### RUN-001 — medium — nestjs-professional-software-engineering — repaired

Baseline src/main.ts:67–69 replaces app.close to drain OTP work and end the pool. Nest's registered signal shutdown pipeline invokes lifecycle hooks and adapter disposal directly; overriding the public close method is not the lifecycle contract. Signal shutdown could bypass pending challenge invalidation and pool cleanup. Remedy: ApplicationLifecycle.onApplicationShutdown drains the MailModule-owned OtpDeliveries tracker after HTTP disposal, then ends the pool. One hook orders both operations; no dependence on parallel hook ordering or before-shutdown snapshots. Validation: real app.close lifecycle test holds pending work, proves pool remains open until delivery completion, then confirms pool closure. OS-signal delivery itself was not separately exercised on Windows.

## Needs verification

- /readyz intentionally remains 503/schema_not_verified even with reachable PostgreSQL. This is a documented fail-closed foundation contract, not repaired by guessing schema/production acceptance criteria.
- SQL-backed feature services intentionally retain HttpException contracts and Zod schemas. No second framework-free domain layer is claimed. Extract only if a real non-HTTP consumer needs independent error mapping.
- PR #10 account linkage is pending on feature/backend-linkage; this branch starts from main as required. Its migration019/controller delta needs reconciliation after independent merge, not silent inclusion or removal from that branch.
- Complete salary, reporting, approval UI, retention policy and production operations remain governed by existing requirements/decision blockers. Historical 12 passes /14 unmet-requirement failures /45 blocked workflows are not superseded by delivered-scope regressions.

## Healthy patterns verified

Parameterized SQL; identity revalidation and locks within each business transaction; commit/rollback/release ownership in services; strict Zod boundaries; exact decimal helpers; immutable SQL migrations; explicit public response projections; request logs allowlist metadata; notifications outside business commit; no ORM replacement or database reset. Internal salary approval and report snapshot helpers remain unexposed.

## Remediation order and resulting profile

1. Finish audit and identify wiring/lifecycle boundaries.
2. Move source/tests by capability; update executable imports without old-path re-export stubs.
3. Introduce modules and explicit useFactory providers, preserving directly constructed service tests.
4. Replace closure controllers and bootstrap-local health; lifecycle-own resource cleanup.
5. Verify DI at runtime, SQL/HTTP/browser contracts, docs/source references and exact-head CI before independent review.

Current directories: auth/, team/, organization-references/, country-currency/, fx-rates/, employees/, health/, config/, database/, mail/, common/domain/, salary/ and reports/. main.ts starts the server; app.ts creates the app/middleware; app.module.ts composes features. Internal salary/reports have no public feature module because their authenticated workflows are undelivered. Existing tsc build and npm workspaces remain; Nest CLI/scaffolding adds no required runtime capability here.

Reference contracts: [Nest modules](https://docs.nestjs.com/modules), [custom factory providers](https://docs.nestjs.com/fundamentals/custom-providers), [shutdown lifecycle](https://docs.nestjs.com/fundamentals/lifecycle-events). Installed Nest12 provider types and TypeScript6 compilation verify the used APIs.

Final local structure checkpoint: real Nest architecture/lifecycle test PASS after the composition-root cleanup change; final API build, workspace typecheck and lint PASS. All five delivered Chromium groups PASS (9 authentication/team +4 references +3 country/currency +3 FX +3 employee =22; zero retries). Existing future-requirement failures remain unchanged and are not a full-system acceptance pass. Script import and decorator inventories verified; no schema, environment, permission or route additions/removals. Staging safety and whitespace verified before commit. GitHub exact-head results remain separate from local execution.
