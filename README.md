## Verification completed locally — 23 November 2026

Developed-scope checks pass:15 frontend units,27 backend units,7 migration cases,7 real payroll/monthly HTTP/SQL groups,44 delivered Chromium cases and native quality/architecture gates. Feature branches also passed their scoped native gates. Publication/remote/exact-head CI evidence is in GIT_CHANGELOG.md; no production/10k acceptance is claimed. Unit tests use synthetic configuration; real database/browser tests used disposable PostgreSQL55432 databases and preserved installed acme_app5432.

Current manual walkthrough below remains applicable. Older uncommitted/unverified source snapshots describe the earlier development phase. The feature branches are now being committed in dependency order; after publication use the combined integration PR rather than merging duplicate overlapping feature PRs.

## Earlier implementation and runbook snapshots

## Current local payroll walkthrough — 23 November 2026

Implementation source is assembled on feature/payroll-integration, uncommitted/unpublished/unverified. Local acme_app has26 applied migrations and a regenerated Prisma client. No application verification is claimed. Existing historical results below apply only to their recorded checkpoints.

Use the supported Node24.20+ runtime. Restart backend and frontend terminals after the new source/client setup. From backend run npm run start:dev; from frontend run npm run dev. Start Mailpit using the existing configured-machine steps below. Open http://localhost:5173 and use the OTP inbox at http://localhost:8025. Database credentials remain only in ignored backend/.env; do not reset the database or overwrite that file. New clones first run npm run db:migrate and npm run db:generate from backend after configuring its environment.

1. Settings → Payroll policies: enter explicit India/INR settings, proration choices, contribution bases/rates/caps/eligibility, state/manual deductions, Finance/optional Director colleagues and finalizer role. Each save is an inactive immutable version. Another linked HR account must review the complete saved settings and approve it. No real statutory rates are seeded or inferred.
2. Payroll → Payroll drafts: choose a month, create a manual employee draft or use Import monthly inputs. CSV requires employeeCode, all12 manual component fields and reason, up to100 employees/256KB. Enter zero explicitly where not applicable. Imports create only; existing drafts are preserved. Resolve/download partial results before leaving.
3. Payroll → Calculate payroll: choose a current approved policy, month and manual draft; enter eligibility, state, PT/TDS, leaving date and unpaid dates explicitly. Review earnings, deductions, net, employer contributions, salary segments and source versions. This screen is a preview only. Configured statutory results replace raw PF/ESI/PT/TDS draft entries; unpaid dates are handled through the approved single method.
4. Payroll → Payroll review: explicitly choose the policy and up to100 drafts, enter each employee’s calculation inputs, and choose distinct independent HR/Finance/optional Director reviewers. A reviewer cannot approve their own employee record; split runs or choose other eligible colleagues. Complete HR review, Finance approval, Director approval when required and the configured finalization action. Changed sources block approval until returned to draft/refreshed/reviewed. Changed incompatible assignments require preparing a replacement run.
5. Payroll → Payslips & payments: open a finalized run. Authorized readers can inspect payslips; export requires existing export permission (HR implicit). Prepare the exact-net manifest and download it if permitted. Only the run’s assigned Finance approver can record a full-run external reference/date/reason. This is an external attestation, not a transfer or bank settlement confirmation by ACME. Partial payments/reversals/provider processing are unavailable.

For synthetic walkthroughs use demo.hr1@acme.test and independent demo.hr2@acme.test. demo.editor@acme.test is linked and has salary read access; named responsibilities must still be explicitly configured and approved. Existing tester@acme.test is unlinked and needs another HR to link it before financial actions. Use another employee such as DEMO-00005. No policy values or eligibility facts should be guessed.

These are manual instructions, not executed results. Verification and10k capacity acceptance remain pending. Current feature contracts: [policy/calculations](acme-salary-app/docs/PAYROLL_POLICY_CALCULATIONS.md), [review/finalization](acme-salary-app/docs/PAYROLL_RUNS_MODULE.md), [payslips/payment preparation](acme-salary-app/docs/PAYROLL_DELIVERY_MODULE.md).

### Local feature branches and dependencies

- feature/payroll-input-import — .worktrees/payroll-input-import
- feature/payroll-policy-calculations — .worktrees/payroll-policy
- feature/payroll-approval-locking — .worktrees/payroll-workflow
- feature/payroll-payslips-payment-preparation — .worktrees/payroll-payslips
- feature/payroll-integration — current root checkout with the combined source.

Worktrees contain local source overlays and copied upstream source dependencies, not committed branch artifacts. Their Git heads still start at origin/main63c4ed1. Policy includes its delegated calculator UI; workflow includes policy/calculation dependencies; delivery includes the complete workflow/policy source and full Prisma run model. Credentials/dependencies were not copied. Promote and verify the salary foundation/intake first, then rebase feature worktrees on the verified dependency and commit logical increments before publication. Required hooks stay intact. Run the combined application from the root checkout for this manual walkthrough.

---

## Local database setup — 23 November 2026

Migration 023_manual_payroll_drafts.sql is applied to installed acme_app; there are now 23 applied migrations. Prisma schema formatting and client generation completed. Existing employee/salary data was preserved. The initial attempt lacked the explicit Prisma environment loader and hit sandbox EACCES/EPERM; rerunning setup with backend/.env and authorized local access succeeded. These are implementation/setup results, not application tests. Migration 023 is now immutable. Source remains uncommitted and unpublished; verification is deferred.

## New salary screens — local implementation

PR #15 is merged into main. The subsequent monthly/workspace/bulk/manual-draft source is local and unverified; no new check or publication is claimed.

After starting backend, frontend and Mailpit with the steps below, sign in at http://localhost:5173 as demo.hr1@acme.test (OTP inbox http://localhost:8025).

1. Open Salary → Salary workspace. Search DEMO-00005; open salary details directly to review/change its monthly base salary. Use an employee other than your own linked DEMO-00001.
2. Open Salary → Bulk salary revisions. Download the CSV template; enter employeeCode,amount,currency,effectiveFrom,reason. Upload up to100 rows/256KB, prepare previews, review ready rows, then confirm. Inspect every result and download the result file. Saved rows remain saved if another row fails; uncertain results must retry the same submission before leaving.
3. For a past-dated salary change, sign in as independent demo.hr2@acme.test in a second profile and use Salary approvals.
4. Open Salary → Payroll drafts. Select month, show drafts, create one for another employee, and manually enter each earning/deduction in INR. Use zero where not applicable. Save, view/revise and print the watermarked draft payslip. Nothing calculates totals/proration/tax, finalizes payroll or pays money.

Draft payroll roles/approval/calculation are intentionally unavailable in this initial manual setup. See [salary contracts](acme-salary-app/docs/SALARY_MODULE.md) and [manual draft contracts](acme-salary-app/docs/PAYROLL_DRAFTS_MODULE.md). These are manual instructions, not executed results.

---

## Ready-to-use synthetic demo data — 23 November 2026

Local acme_app now contains the committed acme-demo-v1 dataset: **10,000 synthetic employees, 9,990 independently approved initial salaries, 8 pending requests and 2 rejected requests**. The selected existing active currency is INR; the seed does not activate currencies or overwrite current settings. Some approved entries start 30 days after the seed date and are correctly absent from today's active compensation. Employment status and department/job-title/region vary for searching/filtering. This is data preparation, not an application test pass or a 10k performance qualification.

Open http://localhost:5173 and sign in using **demo.hr2@acme.test** to review pending initial salaries. Get the sign-in code from http://localhost:8025. Other accounts: demo.hr1@acme.test (request creator/HR), demo.editor@acme.test (read/write/edit/salary-view, not HR), and demo.viewer@acme.test (read-only, no salary access). The first two HR accounts are explicitly linked to DEMO-00001/00002; the editor is linked to DEMO-00003. No existing user's linkage or privileges were changed. Pending requests are DEMO-09991 through DEMO-09998; rejected requests are DEMO-09999/DEMO-10000. Use separate browser profiles to try both HR accounts.

Demo codes start DEMO-, employee emails use demo.employeeNNNNN@acme.test, reference names start [DEMO], and the fictitious XZ/XY/XW regions are explicitly marked synthetic. Their 2-place HALF_UP sample policies are fixture data, not real country/legal requirements. The seed chooses an already active eligible currency. It uses normal immutable request/decision/ledger/audit/linkage guards, not disabled triggers or approved salary bypasses.

To prepare this dataset on a configured local acme_app clone (backend owns credentials):

```powershell
cd 'F:\My Projects\ACME Salary Management\backend'
npm run db:seed:demo -- --employees 10000 --confirm-synthetic
```

Use supported Node 24.20+. The script is restricted to loopback acme_app outside production and requires explicit synthetic confirmation. A transaction and advisory lock prevent partial/concurrent seeds. A committed audit marker makes subsequent runs preserve demo records and manual edits; rerunning with a different count does not resize an existing dataset. Deterministic IDs also reject unrelated collisions. There is no reset/delete option. Counts 25–15,000 are supported for a first seed; 10,000 is the default. The seed transaction committed successfully; checkpoint seed replay was verified to preserve existing manual edits. This is not load qualification.

View profile in Employees opens a modal: Overview shows personal/assignment details; Salary & history is available only with salary access. Save or cancel personal editing before closing.

Navigation and Home shortcuts are grouped into Overview, People, Salary and Settings. Permission filtering and bookmarked page routes remain in place. Monthly revisions/corrections and backdated approval are implemented locally after PR #15; verification and publication of this increment remain deferred. Transfers, reports and full-system acceptance remain pending.

---

# ACME Salary Management

Two independent applications: [React frontend](frontend/README.md) and [NestJS backend](backend/README.md). Each owns its package.json,lockfile,framework configuration,dependencies,environment and commands. There is no root npm application/workspace. [Browser QA](qa/README.md) and repository Git hooks in tools/quality are separate optional tooling. Module/requirements/history documents remain under acme-salary-app/docs and handoff_doc.

Independent package lint/types/unit/build checks,architecture/database/linkage checks and12 foundation Chromium cases have passed after commit/push authorization. All22 delivered Chromium cases and native Nest CLI/Vite development startup/proxy checks also passed; publication/current-head CI disposition is recorded in GIT_CHANGELOG.md. The employee/initial-salary checkpoint is published in PR #15; the new monthly increment is local and unverified. Reporting/transfers and broader acceptance remain incomplete. Use synthetic data only.

## Run locally on Windows

### Configured installed PostgreSQL on this machine — 23 November 2026

The current ignored `backend/.env` uses installed PostgreSQL at `127.0.0.1:5432/acme_app`, visible in pgAdmin under **ACME Salary Management → Databases → acme_app → Schemas → public → Tables**. All 26 migrations are applied, including initial approval, monthly commands, manual drafts, policies, run workflow and delivery. Separate `acme_owner` migration and `acme_app` runtime logins are non-superusers without Create roles/Create databases privileges. The first migration's role settings were applied once through the existing administrator connection; subsequent migrations use the owner. No existing database was reset. The older embedded database remains preserved; **do not run `db:local:start` for this installed-server setup**.

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

Published employee/initial-salary checkpoint: [PR #15](https://github.com/JayuVachhani/ACME-Salary-Manageent/pull/15), exact head ae2376c81d63867dd6e7104641e49cc650dca1ce, GitHub Actions run 45067635080 passed. PR is open and unmerged. Subsequent monthly salary code is local, uncommitted and unverified; these are manual instructions, not new test results.

1. On this configured machine use the installed PostgreSQL setup above. Start Mailpit, backend and frontend with the documented commands; restart a pre-existing backend after the applied migration/client generation if necessary. Open **http://localhost:5173** and get the sign-in code from **http://localhost:8025**.
2. Sign in as **demo.hr1@acme.test**. Open People → Employees, search **DEMO-00005**, then View profile → Salary & history. Use an employee other than your own linked DEMO-00001. The original tester account is unlinked; it cannot change salaries until another HR links it through Team access and it signs in again.
3. Choose the salary revision action, enter amount/currency/effective date/reason, review the server preview and confirm. A today/future entry is recorded with the persistent management-review badge and affects compensation once effective. A future entry stays scheduled until then.
4. Use the correction action on an eligible unsuperseded record to correct its amount at the same effective date. Compare immutable before/after values in history. Save or cancel before closing the modal or switching tabs.
5. For a past date, submit as HR. Sign in as **demo.hr2@acme.test** in a separate browser profile and open Salary approvals. Review the before/proposed values and approve or reject with a comment. A pending request must not become active before independent approval; stale requests must be refreshed/rejected rather than approved.
6. Review seeded initial requests DEMO-09991–09998 as independent HR2. INITIAL requests always require independent approval regardless of effective date. Rejected DEMO-09999/10000 can be resubmitted by the eligible linked creator. Manual actions may change these original fixture statuses.
7. Try demo.editor@acme.test for non-HR editing boundaries and demo.viewer@acme.test for read-only/no-salary visibility. Sign-out should remove protected data. Use only synthetic data.

See [salary contracts and pending acceptance](acme-salary-app/docs/SALARY_MODULE.md). Transfers, reports, bands and 10k capacity qualification are incomplete; successful seeding and the prior checkpoint CI do not establish new monthly feature acceptance.

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
