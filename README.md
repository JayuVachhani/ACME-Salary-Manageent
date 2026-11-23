## Payroll policy/calculation verification — 23 November 2026

This branch adds immutable inactive India/INR policy versions, independent linked-HR activation and exact policy-based gross/deduction/net previews with calendar-day salary segments. Explicit rates/caps/eligibility/state/manualTDS/leave treatment and finalizer responsibilities are required; no statutory settings are inferred. It builds on the verified monthly salary/intake branch.

Native frontend format/lint/types,14 units,build and140-file/23,200-check architecture gate pass. Backend format/lint/types,27 units,7 migration cases,build and actual Nest DI/OpenAPI/production-document isolation pass. The same capability source was exercised in the combined7-group isolated HTTP/SQL and44-case delivered Chromium suites. Staged hooks/normal push and current-head CI remain publication steps, not inferred passes. No production/10k qualification.

## Earlier checkpoint records

## Monthly salary and draft intake — 23 November 2026

This feature adds salary search/current/scheduled views, effective-dated revisions/corrections, independent backdated approval, protected history and manual payroll drafts with create-only CSV intake. Fresh schemas use migrations022–023. Existing later database schemas must not be reset/downgraded to test an older feature snapshot; the combined integration checkout has the complete migration chain.

Native checks pass (frontend14 units/backend27 units/seven migration cases/builds). The combined source passed44 delivered Chromium cases and7 isolated payroll/monthly integration groups; this is not full-product/10k acceptance. Policies/calculations/review/final delivery follow in dependent feature commits. See [salary contract](acme-salary-app/docs/SALARY_MODULE.md) and [manual draft contract](acme-salary-app/docs/PAYROLL_DRAFTS_MODULE.md).

## Earlier setup and checkpoint records

## Ready-to-use synthetic demo data — 23 November 2026

Local acme_app now contains the committed acme-demo-v1 dataset: **10,000 synthetic employees, 9,990 independently approved initial salaries, 8 pending requests and 2 rejected requests**. The selected existing active currency is INR; the seed does not activate currencies or overwrite current settings. Some approved entries start 30 days after the seed date and are correctly absent from today's active compensation. Employment status and department/job-title/region vary for searching/filtering. This is data preparation, not an application test pass or a 10k performance qualification.

Open http://localhost:5173 and sign in using **demo.hr2@acme.test** to review pending initial salaries. Get the sign-in code from http://localhost:8025. Other accounts: demo.hr1@acme.test (request creator/HR), demo.editor@acme.test (read/write/edit/salary-view, not HR), and demo.viewer@acme.test (read-only, no salary access). The first two HR accounts are explicitly linked to DEMO-00001/00002; the editor is linked to DEMO-00003. No existing user's linkage or privileges were changed. Pending requests are DEMO-09991 through DEMO-09998; rejected requests are DEMO-09999/DEMO-10000. Use separate browser profiles to try both HR accounts.

Demo codes start DEMO-, employee emails use demo.employeeNNNNN@acme.test, reference names start [DEMO], and the fictitious XZ/XY/XW regions are explicitly marked synthetic. Their 2-place HALF_UP sample policies are fixture data, not real country/legal requirements. The seed chooses an already active eligible currency. It uses normal immutable request/decision/ledger/audit/linkage guards, not disabled triggers or approved salary bypasses.

To prepare this dataset on a configured local acme_app clone (backend owns credentials):

```powershell
cd 'F:\My Projects\ACME Salary Management\backend'
npm run db:seed:demo -- --employees 10000 --confirm-synthetic
```

Use supported Node 24.20+. The script is restricted to loopback acme_app outside production and requires explicit synthetic confirmation. A transaction and advisory lock prevent partial/concurrent seeds. A committed audit marker makes subsequent runs preserve demo records and manual edits; rerunning with a different count does not resize an existing dataset. Deterministic IDs also reject unrelated collisions. There is no reset/delete option. Counts 25–15,000 are supported for a first seed; 10,000 is the default. The current execution committed successfully; replay behavior and application/load scenarios have not been verified.

View profile in Employees opens a modal: Overview shows personal/assignment details; Salary & history is available only with salary access. Save or cancel personal editing before closing.

Navigation and Home shortcuts are grouped into Overview, People, Salary and Settings. Permission filtering and bookmarked page routes remain in place. Ordinary monthly salary revisions, transfers, reports and full-system acceptance are still pending. Tests/lint/types/build/browser/safety checks remain deferred; no commit/push.

---

# ACME Salary Management

Two independent applications: [React frontend](frontend/README.md) and [NestJS backend](backend/README.md). Each owns its package.json,lockfile,framework configuration,dependencies,environment and commands. There is no root npm application/workspace. [Browser QA](qa/README.md) and repository Git hooks in tools/quality are separate optional tooling. Module/requirements/history documents remain under acme-salary-app/docs and handoff_doc.

Independent package lint/types/unit/build checks,architecture/database/linkage checks and12 foundation Chromium cases have passed after commit/push authorization. All22 delivered Chromium cases and native Nest CLI/Vite development startup/proxy checks also passed; publication/current-head CI disposition is recorded in GIT_CHANGELOG.md. Existing business gaps remain: employee creation/salary/approval/reporting workflows are incomplete. Use synthetic data only.

## Run locally on Windows

### Configured installed PostgreSQL on this machine — 23 November 2026

The current ignored `backend/.env` uses installed PostgreSQL at `127.0.0.1:5432/acme_app`, visible in pgAdmin under **ACME Salary Management → Databases → acme_app → Schemas → public → Tables**. All 21 migrations are applied (including the new initial-salary workflow). Separate `acme_owner` migration and `acme_app` runtime logins are non-superusers without Create roles/Create databases privileges. The first migration's role settings were applied once through the existing administrator connection; subsequent migrations use the owner. No existing database was reset. The older embedded database remains preserved; **do not run `db:local:start` for this installed-server setup**.

Frontend: http://localhost:5173. Local Mailpit inbox: http://localhost:8025 (standalone project-local executable, no Docker required on this machine). Sign in with synthetic HR email `tester@acme.test`, request a code, and copy the latest code from Mailpit. The synthetic account, OTP delivery, verification and authenticated identity were checked through the running frontend proxy. This is a local startup check, not a new full browser-suite pass.

After a reboot, ensure the installed PostgreSQL Windows service is running, then restart this machine's configured services:

```powershell
cd 'F:\My Projects\ACME Salary Management'
& '.\backend\.local\start-manual.ps1'
```

This ignored machine-local helper uses the already installed Node 24.20.0, dependencies and Mailpit binary. It starts missing service ports; logs are in `backend/.local/*-dev.*.log`. For foreground terminals instead, use the backend/frontend commands below and run `backend/.local/mailpit/mailpit.exe --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025`. Keep `SMTP_HOST=127.0.0.1`. Do not copy over the configured `.env` or rerun the first-manager bootstrap. Future migration commands remain `npm run db:migrate` and `npm run db:generate` from backend with supported Node. Credentials and local mail/database files remain ignored.

Migration integrity accepts unchanged SQL with LF/CRLF line endings so Windows checkout conversion does not invalidate historical migration hashes; SQL/content changes still fail and stored history is never rewritten. Seven focused regression cases cover this boundary. General fresh-clone instructions follow.

Prerequisites: Node.js **24.20.0 or newer**,npm,Git,and Docker Desktop for the local Mailpit inbox. Open PowerShell in this repository. All paths below assume `F:\My Projects\ACME Salary Management`; change that path if your clone is elsewhere. Do not run npm install from the repository root. Run `node --version` in every terminal; if it is below24.20.0,install/update Node before proceeding.

### 1. Install each application

```powershell
cd 'F:\My Projects\ACME Salary Management\backend'
npm ci --ignore-scripts
cd '..\frontend'
npm ci --ignore-scripts
```

These use separate lockfiles. No global Nest CLI is required. The backend's local Nest CLI provides its native build/watch commands. Installs deliberately skip lifecycle scripts; generate Prisma explicitly below.

### 2. Start PostgreSQL and initialize the backend

```powershell
cd 'F:\My Projects\ACME Salary Management\backend'
npm run db:local:start
npm run db:migrate
npm run db:generate
```

On Windows,local-start creates an isolated PostgreSQL17 instance at127.0.0.1:55432,with separate owner/runtime users,and writes backend/.env **only if it does not exist**. This checkout preserves its previous local cluster at acme-salary-app/.local/postgres; the command reuses that cluster without moving or resetting it. Fresh clones store it under backend/.local/postgres. Never delete either directory to resolve a startup error. If another database is already bound to55432,resolve the conflict before continuing.

For externally managed PostgreSQL instead,copy backend/.env.example to backend/.env and set distinct migration-owner/runtime URLs locally. Migrations provision restricted runtime privileges; never use the owner URL as DATABASE_URL. Do not overwrite an existing .env. Backend database scripts explicitly read backend/.env; the application also supports the environment-specific precedence described in backend/README.md.

Check/edit backend/.env locally: APP_ORIGIN=http://localhost:5173,PORT=3001,DEV_INSECURE_COOKIES=true for local HTTP,SMTP_HOST=localhost,SMTP_PORT=1025. Keep the generated OTP_HMAC_SECRET and database credentials private. All server credentials stay in backend; never place them in frontend or commit them.

### 3. Start the local email inbox

From the repository root,in a separate terminal:

```powershell
cd 'F:\My Projects\ACME Salary Management'
docker compose up -d mailpit
```

Open http://localhost:8025 to see local sign-in emails. Mailpit captures mail instead of sending real email. If Docker is unavailable,you may configure your own SMTP service in backend/.env; a working SMTP service is required for OTP login.

### 4. Create the first HR account only for a fresh database

```powershell
cd 'F:\My Projects\ACME Salary Management\backend'
npm run bootstrap:manager -- 'tester@acme.test' 'Manual Test HR' --confirm
```

If a manager already exists,the command intentionally refuses. Use that manager's email and existing invitation workflow instead; do not reset data or bypass the guard. The synthetic .test address works with Mailpit. The bootstrap is a manual,explicit owner operation,not an automatic seed.

### 5. Run the backend — terminal A

```powershell
cd 'F:\My Projects\ACME Salary Management\backend'
npm run start:dev
```

Leave it running. API: http://localhost:3001; liveness: /healthz; readiness: /readyz; development API reference: /api/docs. The existing readiness contract intentionally returns503/schema_not_verified even with a connected database; this is a known foundation boundary,not a package-separation result. ConfigModule loads/validates server-local configuration. Production omits API reference routes.

### 6. Run the frontend — terminal B

```powershell
cd 'F:\My Projects\ACME Salary Management\frontend'
npm run dev
```

Open **http://localhost:5173**. Use exactly this host/origin consistently; APP_ORIGIN rejects mismatches such as127.0.0.1 versus localhost. Frontend's default proxy is http://127.0.0.1:3001. To override it,copy frontend/.env.example to frontend/.env.local and edit API_PROXY_TARGET. This is a Vite-server proxy value,not a browser credential. No frontend .env is needed for the default ports.

### 7. Manual checks

New workflow (implemented, not yet accepted): Add employee → enter details and monthly salary → review/submit. In Team access, an independent HR manager must link reviewer accounts to their employee records; affected colleagues sign in again. A different linked HR manager reviews Salary approvals and confirms a decision with a comment. Employee profiles show approved/pending salary only with salary-view access. Rejected initial requests can be replaced from the profile by an eligible linked creator. Employee name/email editing uses a protected edit session. The steps below are instructions, not a claim that the new workflow has passed tests.

1. Confirm the service shows online. Enter your HR email,click Send sign-in code,and open Mailpit to copy the six-digit code. Verify it; Sign out and the permitted workspace should appear.
2. Create a synthetic department/designation; confirm changes,rename/deactivate/reactivate them,and check feedback/pagination.
3. Activate needed currencies and create/edit a country policy with its required confirmation.
4. Create a synthetic FX rate,then prepare a correction with a new reason. Check immutable history and historical lookup.
5. Invite another synthetic account through Team; open its email in Mailpit and sign in using a separate browser profile. Check the expected HR/read permission boundaries. Keep an active independent HR manager; the application protects the final manager.
6. Inspect the employee directory/profile if synthetic records exist. An empty directory is valid; the employee creation UI is not delivered. The verified account/employee-link backend exists,but a linkage UI is not yet delivered.
7. Check keyboard navigation,field labels,confirmation cancel/confirm,notification dismissal,mobile layouts and sign-out. On sign-out,protected data should disappear.

The new Add employee and Salary approvals pages implement the initial salary workflow in source; acceptance testing is deferred. Ordinary monthly revisions/transfers and reporting remain incomplete. An expected validation/conflict rejection should not become a successful write. No real employee data is needed.

### Stop services

Ctrl+C in frontend and backend terminals. Then:

```powershell
cd 'F:\My Projects\ACME Salary Management\backend'
npm run db:local:stop
cd '..'
docker compose stop mailpit
```

These stop services and preserve their data. Never use a volume/data-directory removal command as a routine shutdown.

## Independent build and preview commands

Backend: from backend/,`npm run build`,then `npm run start:prod`. Frontend: from frontend/,`npm run build`,then `npm run preview`. Vite preview defaults to localhost:4173; set backend APP_ORIGIN=http://localhost:4173 for that local preview and restart backend. Vite preview is a local inspection command,not production hosting. Production requires a separately scoped HTTPS/same-origin reverse proxy and production-safe server secrets/cookies.

## Developer hooks and verification

Optional repository tooling:

```powershell
cd 'F:\My Projects\ACME Salary Management\qa'
npm ci --ignore-scripts
cd '..\tools\quality'
npm ci --ignore-scripts
npm run hooks:install
```

Pre-commit delegates staged format/lint to each application-local config,then scans indexed files. Pre-push calls each package's quality:check,QA typing and indexed safety. No root framework configuration is used. Install both applications and QA before using the complete repository push gate. Each application can install,configure,build and run without these optional packages.

Per application:`npm run format`,`npm run format:check`,`npm run lint`,`npm run typecheck`,`npm test`,`npm run quality:check`. Backend also owns real database/linkage tests; QA owns Chromium with its own lockfile and config. Executed verification includes independent package checks,36 units,database/linkage suites,12 foundation plus22 delivered Chromium cases and native dev startup/proxy; publication/current-head CI status is in GIT_CHANGELOG.md. CI mirrors the package boundaries and preserves the known unmet/blocked full-system requirements.
