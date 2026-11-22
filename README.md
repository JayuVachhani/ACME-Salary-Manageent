# ACME Salary Management

Two independent applications: [React frontend](frontend/README.md) and [NestJS backend](backend/README.md). Each owns its package.json,lockfile,framework configuration,dependencies,environment and commands. There is no root npm application/workspace. [Browser QA](qa/README.md) and repository Git hooks in tools/quality are separate optional tooling. Module/requirements/history documents remain under acme-salary-app/docs and handoff_doc.

Independent package lint/types/unit/build checks,architecture/database/linkage checks and12 foundation Chromium cases have passed after commit/push authorization. All22 delivered Chromium cases and native Nest CLI/Vite development startup/proxy checks also passed; publication/current-head CI disposition is recorded in GIT_CHANGELOG.md. Existing business gaps remain: employee creation/salary/approval/reporting workflows are incomplete. Use synthetic data only.

## Run locally on Windows

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

1. Confirm the service shows online. Enter your HR email,click Send sign-in code,and open Mailpit to copy the six-digit code. Verify it; Sign out and the permitted workspace should appear.
2. Create a synthetic department/designation; confirm changes,rename/deactivate/reactivate them,and check feedback/pagination.
3. Activate needed currencies and create/edit a country policy with its required confirmation.
4. Create a synthetic FX rate,then prepare a correction with a new reason. Check immutable history and historical lookup.
5. Invite another synthetic account through Team; open its email in Mailpit and sign in using a separate browser profile. Check the expected HR/read permission boundaries. Keep an active independent HR manager; the application protects the final manager.
6. Inspect the employee directory/profile if synthetic records exist. An empty directory is valid; the employee creation UI is not delivered. The verified account/employee-link backend exists,but a linkage UI is not yet delivered.
7. Check keyboard navigation,field labels,confirmation cancel/confirm,notification dismissal,mobile layouts and sign-out. On sign-out,protected data should disappear.

Do not treat absent salary/approval/reporting screens as completed functionality. An expected validation/conflict rejection should not become a successful write. No real employee data is needed.

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
