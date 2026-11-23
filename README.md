# ACME Salary Management

Latest [engineering and security assessment](acme-salary-app/docs/ENGINEERING_SECURITY_ASSESSMENT.md): delivered local scope passes with risks; production acceptance remains open. The repeatable adversarial command is `npm --prefix backend run test:security` after building the backend and configuring an isolated local test server, never the working database. CI runs it after payroll integration.

Effective-dated monthly salary management with independent approvals, immutable history and a bounded India/INR payroll workflow.

**Reviewer entry point:** [assessment overview and focused demo](acme-salary-app/docs/ASSESSMENT_OVERVIEW.md). [AI-use account](acme-salary-app/docs/DEVELOPMENT_LOG.md#ai-use-account--assessment-reconciliation), [decisions](acme-salary-app/docs/DECISIONS.md), [QA evidence](acme-salary-app/QA_EXECUTION_REPORT.md), [10k performance report](acme-salary-app/docs/PERFORMANCE_10K.md).

## Current delivery status

As of 23 November 2026, PRs [15](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/15), [16](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/16) and [17](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/17) are merged; current reviewed baseline is main e341025. Delivered: employee onboarding/initial approval, salary workspace, revisions/corrections/backdated requests, bulk revisions, manual payroll drafts/CSV intake, approved configurable calculations, staged review/finalization, final payslips and external-payment tracking.

Published validation includes 15 frontend units, 27 backend units, 7 migration cases, 7 financial SQL/HTTP groups and 44 delivered Chromium cases. PR #17 CI passed on d18bd57. This documentation update does not constitute another application test pass. The 10k experiment completed the bounded payroll lifecycle; latency qualification is partial and the payslip baseline target remains missed. Historical unmet/blocked requirements are preserved. No production/statutory compliance or 10k simultaneous-user claim.

Unavailable: automatic TDS tax assessment, actual bank/provider transfers, partial payments/reversals/supplemental payroll, and broader transfer/report/band scope. Payroll requires explicit approved configuration; there are no inferred legal rates. Detailed actual contracts: [salary](acme-salary-app/docs/SALARY_MODULE.md), [drafts](acme-salary-app/docs/PAYROLL_DRAFTS_MODULE.md), [policy/calculation](acme-salary-app/docs/PAYROLL_POLICY_CALCULATIONS.md), [review](acme-salary-app/docs/PAYROLL_RUNS_MODULE.md), [payslips/payments](acme-salary-app/docs/PAYROLL_DELIVERY_MODULE.md).

## Application ownership

- [frontend/](frontend/README.md): independent React 19/Vite 8 npm project; reusable presentation controls, local form drafts and Redux Toolkit/RTK Query for server state.
- [backend/](backend/README.md): independent Nest 12 npm project; native capability modules, PostgreSQL/Prisma, migrations, mail and all server secrets.
- [qa/](qa/README.md): independent browser tooling. [tools/quality/](tools/quality/README.md): optional Git quality orchestration.

There is no root npm application/workspace or shared framework dependency package. Run package commands in their owning directory.

## Run locally

Use Node 24.20.0 or newer, npm and PostgreSQL. PowerShell paths below assume this checkout; adapt the root path for another clone. Do not overwrite an existing environment file or reset data.

### This configured Windows machine

Installed PostgreSQL serves127.0.0.1:5432/acme_app; backend/.env already contains separate restricted migration/runtime credentials. All26 migrations were applied. Inspect it through pgAdmin → ACME Salary Management → acme_app → Schemas → public → Tables. Keep secrets private. The preserved embedded55432 cluster is used for isolated tests; **do not run db:local:start to replace this installed-server setup**.

After reboot, ensure the installed PostgreSQL service is running. The ignored machine-local helper backend/.local/start-manual.ps1 starts missing backend/frontend/Mailpit ports using the installed runtime. It is a convenience for this machine, not part of a fresh-clone dependency. Alternatively use the foreground commands below; the existing standalone mailpit executable is backend/.local/mailpit/mailpit.exe with HTTP127.0.0.1:8025 and SMTP127.0.0.1:1025.

Open http://localhost:5173; obtain sign-in codes at http://localhost:8025. Synthetic accounts: demo.hr1@acme.test and demo.hr2@acme.test are linked independent HR managers; demo.editor@acme.test has salary editing access; demo.viewer@acme.test has read-only/no salary access. tester@acme.test is unlinked and cannot perform financial writes until another HR links it and it signs in again.

The existing synthetic dataset has 10, 000 DEMO employees, originally9, 990 approved initial salaries, 8 pending and 2 rejected. Manual edits may change those statuses. References and regionsXZ/XY/XW are explicitly fictional. Seed replay preserves manual edits; it is not a reset command. On a configured local acme_app first seed, use backend `npm run db:seed:demo -- --employees 10000 --confirm-synthetic`.

### Fresh clone setup

1. Install independently:

```powershell
cd "F:\My Projects\ACME Salary Management\backend"
npm ci --ignore-scripts
cd ..\frontend
npm ci --ignore-scripts
```

2. Configure backend/.env from backend/.env.example only if absent. Set distinct migration-owner/runtime database URLs, APP_ORIGIN=http://localhost:5173, PORT=3001, SMTP host/port/from and a private OTP_HMAC_SECRET. DEV_INSECURE_COOKIES=true is for local HTTP only. Never put secrets in frontend. On Windows, a fresh embedded setup can use npm run db:local:start from backend; it preserves an existing.env and existing cluster. For an installed/external server, configure that server instead.
3. From backend initialize the configured database:

```powershell
npm run db:migrate
npm run db:generate
```

Applied SQL is immutable. Checksum compatibility accepts LF/CRLF-only conversion, not SQL edits or history rewriting.

4. Start a local SMTP inbox. With Docker, from the repository root run docker compose up -d mailpit. Without Docker, configure/start a compatible local SMTP service. OTP login needs working SMTP.
5. Only for a database without any HR manager, from backend run npm run bootstrap:manager -- tester@acme.test "Manual Test HR" --confirm. It refuses when a manager exists; use existing accounts/invitations rather than bypassing it.
6. Run two foreground terminals:

```powershell
# Terminal A
cd "F:\My Projects\ACME Salary Management\backend"
npm run start:dev
```

```powershell
# Terminal B
cd "F:\My Projects\ACME Salary Management\frontend"
npm run dev
```

Use localhost consistently; an origin switch to127.0.0.1 is not equivalent to APP_ORIGIN. Vite proxies to backend127.0.0.1:3001 by default. Only a different proxy needs frontend/.env.local and API_PROXY_TARGET; no browser credential belongs there. Local/test API reference: http://localhost:3001/api/docs; production omits it. /healthz is liveness. /readyz intentionally remains503/schema_not_verified even when connected; this is a known operational limit.

Follow the [focused demo walkthrough](acme-salary-app/docs/ASSESSMENT_OVERVIEW.md#focused-demo-walkthrough). Payroll roles/policies must be explicitly configured and independently approved. Finalized does not mean paid.

Stop foreground processes with Ctrl+C. Stop Mailpit with docker compose stop mailpit if Docker started it. For the embedded cluster only, use backend npm run db:local:stop. Do not stop the installed PostgreSQL service using embedded-cluster commands or delete data directories.

## Quality and verification commands

From either application: npm run format:check, npm run lint, npm run typecheck, npm test, npm run build or npm run quality:check. Backend unit tests use synthetic unreachable service configuration. Real database suites need an explicitly isolated test environment; the benchmark refuses non-loopback/non55432 targets and creates/drops only its own random database. [Benchmark reproduction and limits](acme-salary-app/docs/PERFORMANCE_10K.md).

Optional tooling setup:

```powershell
cd "F:\My Projects\ACME Salary Management\qa"
npm ci --ignore-scripts
cd ..\tools\quality
npm ci --ignore-scripts
npm run hooks:install
```

QA owns npm run typecheck, npm run test:foundation and npm run test:login. The latter executes isolated delivered-feature browser groups, including payroll. Full future-requirement tests remain separate and are not claimed passing. Install project-local Chromium as documented in qa/README.md.

Husky pre-commit checks staged formatting/lint and indexed safety. Pre-push enforces full application quality, QA typing and indexed safety. CI additionally exercises real database/HTTP/architecture/browser gates. Hooks are not weakened for benchmark misses; performance outcomes stay visible in the report. No new tests are run for prose-only edits.

## Evidence and historical records

Current reviewer narrative: [assessment overview](acme-salary-app/docs/ASSESSMENT_OVERVIEW.md). Technical boundaries: [decisions](acme-salary-app/docs/TECHNICAL_DECISIONS.md). Publication hashes/checks: [Git ledger](GIT_CHANGELOG.md). Detailed results: [QA report](acme-salary-app/QA_EXECUTION_REPORT.md). Handoff entry: [handoff_doc/AGENTS.md](handoff_doc/AGENTS.md). Earlier README states are archived in the [development log](acme-salary-app/docs/DEVELOPMENT_LOG.md); they are historical, not current setup or delivery claims.
