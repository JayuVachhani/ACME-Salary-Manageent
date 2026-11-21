# ACME Salary Management

Fresh local implementation of the approved ACME plan. **Foundation stage, not a completed salary application.** No mock employee statistics, fake authentication or permissive data endpoints are supplied.

## Requirements

- Node.js 24.15 or newer and npm.
- Docker Compose for the isolated PostgreSQL and Mailpit services, or equivalent locally supplied services.

## Project-local PostgreSQL setup (Windows)

The client selected a project-local database. Run `npm run db:local:start`; this initializes PostgreSQL 17.12 in ignored `.local/postgres`, creates separate migration/runtime accounts, and writes a local `.env` only if none exists. PostgreSQL binds to `127.0.0.1:55432`; no system service is installed. Run `npm run db:migrate`, `npm run test:database`, and `npm run test:health` after building. Stop with `npm run db:local:stop` when finished. Never share `.local` or `.env`; they contain local secrets/data. Unix mode flags do not replace Windows account ACLs.

Migrations now cover identity/audit, countries/reference foundations, historical employee assignments, FX revisions, retention holds, report snapshots, salary ledger and backdated approvals. Run `npm run db:generate` after migrations to generate Prisma Client. `npm run verify:database` is the current combined verification gate. Full domain APIs and screens remain pending. Migration files are checksummed and cannot be silently edited after application.

## Alternative Docker local setup

1. Run `npm ci` from this directory.
2. Copy `.env.example` to `.env`. Generate `OTP_HMAC_SECRET` with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and set it locally. Never commit it.
3. Run `npm run local:up` when Docker is available. SMTP capture UI is at http://localhost:8025. The database owner is for migrations only; the runtime `acme_app` role will be provisioned by the next database module. The example runtime connection will not work until then.
4. Run `npm run build`, then `npm run dev`. Open http://localhost:5173. API binds to loopback port 3001; Vite proxies same-origin API and health requests.

`npm run verify:foundation` runs lint, TypeScript checks, foundation tests and both builds. It is deliberately named for its current scope: it does not imply migrations, real-database tests, E2E or seed verification have passed.

## Implemented

- npm workspace with React/Vite UI and NestJS API.
- Configuration validation; production HTTP/insecure-cookie rejection; 15-minute OTP configuration ceiling.
- Metadata-only JSON request logs, request IDs, security headers and shutdown hooks.
- Liveness endpoint and fail-closed readiness response. Readiness intentionally remains 503 until migrations and runtime-role verification are implemented; a connected empty database never reports ready.
- Tested permission policy primitives for distinct create/edit, compensation visibility, export, disabled/system accounts and self-edit restrictions. These are not advertised as endpoint protection before the domain endpoints are implemented.
- Local service configuration, accessible frontend foundation and decision/progress documentation.

## Not implemented yet

Bootstrap, OTP delivery and sessions, authenticated domain APIs, employee/salary/approval screens, reference administration, report generation/export, deterministic full seed, full E2E/security/performance acceptance. Internal approval service and database guards are tested; they are not exposed as unsecured endpoints. See `docs/DEVELOPMENT_PROGRESS.md` and `docs/REQUIREMENT_TRACEABILITY.md` for verified coverage. Do not use real employee data.

The authoritative progress plan is `../DEVELOPMENT_PLAN.md`; approved decision details are in `docs/DECISIONS.md`. No hosting is configured or authorized by this foundation.

## Chromium QA

PR #1's delivered-scope check is **Foundation integrity** in `.github/workflows/pr-validation.yml`, triggered on new/updated PRs to main. It uses isolated Windows PostgreSQL, the full current database/unit/build gate, QA typing, staging safety and `foundation.spec.ts` Chromium tests. No production secrets are needed. Full business E2E remains a separate readiness assessment; see `docs/PR_1_SCOPE.md` for blocking versus future gaps. CI success does not certify unimplemented application modules.

The first actual browser audit is documented in `QA_TEST_PLAN.md`, `TEST_CASES.md`, `QA_EXECUTION_REPORT.md` and `BUG_REPORT.md` in this directory. It found the foundation usable but the business application incomplete: final Chromium results are 12 passed and 14 failed, with 45 dependent scenarios blocked. Missing-feature failures are retained intentionally; they are not expected-failure annotations or skipped passes.

Run `npm run build`, then `npm run qa:e2e`. Playwright starts isolated API/web instances on ports 4318/4317 and stops them after testing. Chromium is installed in `.local/browsers`; to install on another machine, set `PLAYWRIGHT_BROWSERS_PATH` to that absolute directory and run `node node_modules/@playwright/test/cli.js install chromium`. Do not reuse production data or a production connection for QA.

Run `npm run qa:regression` for instrumented existing PostgreSQL/service suites, `npm run qa:typecheck` for browser-test TypeScript, and `npm run qa:report` to regenerate the per-case ledger and execution report from retained initial/final JSON and regression evidence. `qa-artifacts` is ignored in source control but retained locally, including screenshots, HTML reports, traces and initial failure evidence. Changes to the test catalogue should be reviewed alongside the requirement traceability file; do not delete unmet-requirement checks to obtain a green summary.
