# ACME — setup, run and operations

## Combined React/NestJS reconciliation — 22 November 2026

PR #10 linkage and PR #11 native NestJS architecture are merged to main at `8b8d7ed344d0eb1b6d05e5dd891786db0d9edc9a`. Existing PR #12 now merges this base, preserving all backend feature modules, DTO/global validation/OpenAPI, migration019 and linkage protections alongside Redux Toolkit/RTK Query and shared React controls. Both architecture commands remain in CI. React Account models the nullable employee_id response; this reconciliation adds no linkage UI or salary workflow. Lockfile contains both Swagger and Redux dependencies. Combined local lint/types/builds,36 units,QA typing,React architecture71/7550,Nest architecture/OpenAPI,serial isolated PostgreSQL suites and17 linkage SQL/HTTP checks passed. The initial FX browser assertion raced a successful second save by matching a retained toast; the helper now awaits the current POST201 and dialog closure. All3 FX cases passed unchanged application code; QA typing passed again. All22 delivered browser cases passed across the completed groups (9auth/team,4references,3country,3FX,3employees). The initial FX failure remains historical, with no relaxed timeout/assertion or application change. Final safety scan,publication and exact-head CI are in progress; earlier branch-only passes and deferred-check snapshots below are historical. No self-approval/merge/deployment; unrelated user files remain excluded.

## Earlier checkpoint records

UI implementation checkpoint (unverified): all delivered forms use shared native-backed controls; tables/pagination/request states and typed notifications are centralized. Native labels/constraints and business confirmation snapshots remain feature-owned at their call sites. No additional install/setup command is required; no execution checks ran.

Current increment: Redux Toolkit/RTK Query, session-cache lifecycle, lazy workspace and error-boundary changes are implemented but unverified (22 November 2026). The user requested implementation first and checks only when explicitly requested. No tests, lint, typechecks, builds, browser QA or safety scans ran for this increment; existing pass records below are historical and do not cover the working tree. Do not commit/push until required verification is authorized and completed. See FRONTEND_ARCHITECTURE_AUDIT.md in acme-salary-app/docs for the current source map.
Backend implementation checkpoint (unverified): existing dependency setup is unchanged. Use exact APP_ORIGIN without trailing slash/path. Pool error/transaction rollback handling and response-schema validation are now centralized; see audit mapping and delivery outcome details in TEAM_MODULE/SMTP_INTEGRATION. No tests/build/type/lint/safety checks ran.

Backend rules increment: implemented/unverified in the isolated NestJS worktree. After normal local startup, API reference is available only in development/test at `/api/docs`, `/api/openapi.json`, `/api/openapi.yaml`. Production does not register them. No test/build/type/lint/safety/browser command was run; runbook commands below remain deferred until requested. See acme-salary-app/docs/BACKEND_STRUCTURE_AUDIT.md.

**Purpose:** Run the delivered application and its verification gates safely.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

Use this guide from the acme-salary-app/ working directory unless a command says repository root. Prefer the project-local PostgreSQL launcher on Windows. It creates a private environment file only if none exists. Working product path: bootstrap HR → email OTP login → invite/manage/offboard team → administer departments/designations. Employee/salary/reporting journeys are not yet available. Start with [AGENTS.md](AGENTS.md), then [CONTEXT.md](CONTEXT.md).

## 1. Prerequisites and layout

| Item | Actual requirement |
|---|---|
| Node/npm | Node >=24.20.0; CI uses 24.20.0 and npm workspaces |
| OS | Windows for bundled @embedded-postgres/windows-x64 local launcher and current CI |
| PostgreSQL | 17 family; project-local pinned package 17.12.0-beta.19 provides PostgreSQL 17.12 |
| Browser tests | Installed project-local Chromium through Playwright 1.65.1 |
| SMTP | Loopback capture or authorized SMTP relay; optional Docker for Mailpit |
| Git/GitHub | Approved branch prefixes, protected main, independent review; PR actions via GitHub MCP |

API: apps/api; frontend: apps/web; schema: database; operations/tests: scripts; browser suites: e2e and e2e-auth; decisions and progress: docs. There is no Python venv/backend, Redis worker or separate package lock per workspace.

## 2. Backend/workspace setup

Fresh Windows checkout, from repository root:

~~~powershell
cd acme-salary-app
npm.cmd ci --ignore-scripts --no-fund --no-audit
npm.cmd run db:local:start
npm.cmd run db:migrate
npm.cmd run db:generate
npm.cmd run build
~~~

Do not copy .env.example over the generated .env. If .env already exists, the launcher leaves it untouched: reconcile its runtime/owner URL, database port and secret privately against the launcher configuration. Never print connection URLs/credentials into chat. Do not delete existing DB data or .local to resolve a connection mismatch. The owner URL is required for migrations and is deliberately not a runtime API credential.

Illustrative configuration only; replace angle-bracket placeholders privately. The fresh launcher writes actual random local values for you:

~~~dotenv
# Runtime, restricted role; no literal sample passwords
NODE_ENV=development
PORT=3001
APP_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://acme_app:<RUNTIME_PASSWORD>@127.0.0.1:55432/acme
MIGRATION_DATABASE_URL=postgresql://acme_owner:<OWNER_PASSWORD>@127.0.0.1:55432/acme
OTP_HMAC_SECRET=<GENERATE_PRIVATELY_AT_LEAST_32_CHARACTERS>
OTP_TTL_MINUTES=15
SESSION_IDLE_MINUTES=30
SESSION_ABSOLUTE_HOURS=12
FX_MAX_STALENESS_DAYS=7
DEV_INSECURE_COOKIES=true
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM="ACME <no-reply@acme.test>"
SMTP_SECURE=false
# Optional, both together; never commit filled values
SMTP_USER=
SMTP_PASSWORD=
~~~

Environment checklist, including script/container-only settings:

| Variable | Required/default | Consumer and caveat |
|---|---|---|
| NODE_ENV | development; development/test/production | config/config.ts; production forbids HTTP APP_ORIGIN/insecure cookies and mailer requires TLS |
| PORT | 3001, positive integer | API listens on 127.0.0.1 only |
| APP_ORIGIN | Required URL | Exact Origin equality for mutations; use browser origin without a path or trailing slash |
| DATABASE_URL | Required PostgreSQL URL | Runtime pg pool and Prisma adapter; use restricted acme_app |
| OTP_HMAC_SECRET | Required, at least 32 characters | Keyed OTP/session/CSRF/rate/audit digests; generate privately, never reuse sample text |
| OTP_TTL_MINUTES | 15; positive integer at most 15 | Auth challenge expiry and mail text |
| SESSION_IDLE_MINUTES | 30; positive integer at most 30 | Server idle expiry; valid session reads refresh last_seen_at |
| SESSION_ABSOLUTE_HOURS | 12; positive integer at most 12 | Server absolute expiry; cookie maxAge remains fixed at 12 hours |
| FX_MAX_STALENESS_DAYS | 7, positive integer | Public FxRatesService resolution policy; internal approval service still has constructor default7 until exposed/configured |
| DEV_INSECURE_COOKIES | false; true/false | Explicit development opt-in for HTTP. Production rejects true |
| SMTP_HOST | Required | Nodemailer server; loopback capture for synthetic testing |
| SMTP_PORT | 1025, positive integer | Configure for chosen relay; production transport requires TLS |
| SMTP_FROM | Required string | Mail sender. Quote display-name values in Node env files |
| SMTP_SECURE | false; true/false | Implicit TLS option; does not disable certificate checks |
| SMTP_USER | Optional | Must be paired with SMTP_PASSWORD; omitted for local capture/authorized relay |
| SMTP_PASSWORD | Optional secret | Must be paired with SMTP_USER; never log or commit |
| MIGRATION_DATABASE_URL | Required by migration/admin/DB tests; no API config default | Missing from .env.example; local launcher writes it only when .env does not exist. Owner-only privileges; Prisma config uses it |
| QA_API_PORT | 3001 fallback in Vite config | Dev proxy target override; foundation 4318, auth/team 4428, references 4528, countries 4628 |
| QA_RUN | final fallback | Playwright artifact subfolder; CI sets ci, isolated auth runner sets login |
| PLAYWRIGHT_BROWSERS_PATH | Set by playwright.config.ts to absolute .local/browsers | CI also sets same project-local path; not an API setting |
| ACME_AUTH_TEST_DATABASE | Set by test-login.mjs | Random acme_test_ identifier; auth/team browser fixtures verify URL database matches it |
| QA_ASSERT_REPORT | Optional | qa-assert-observer.mjs output path, supplied by qa-regression.mjs |
| CI | true in Actions | Test/tool noninteractive mode; not a business feature flag |
| PR_BRANCH | Supplied from GitHub head_ref in workflow | Prefix validation; not a runtime setting |
| POSTGRES_USER | Compose sets development owner | Container initialization only; not consumed by API config |
| POSTGRES_PASSWORD | Compose development value | Container initialization only; existing dev literal is not a production secret strategy |
| POSTGRES_DB | Compose sets acme | Container initialization only; does not create restricted runtime role |


## 3. Frontend and optional services

The same root npm install provisions both workspaces. No frontend .env.example or VITE_* API URL is implemented. apps/web/vite.config.ts proxies relative /api, /healthz and /readyz to loopback API port 3001, or QA_API_PORT when explicitly set. Vite serves loopback 5173 with strictPort. Production static files need an approved same-origin API reverse proxy; development proxy settings are not a production server.

For optional local mail capture, with Docker available, run only the mail service if using bundled PostgreSQL:

~~~powershell
docker --version
docker compose up -d mailpit
~~~

Mailpit is on SMTP 1025 and inbox http://localhost:8025. The Compose postgres service is a separate development DB on 5432, not the launcher DB on 55432. Running the whole Compose file does not create acme_app or apply domain migrations. See [SMTP_INTEGRATION.md](SMTP_INTEGRATION.md).

## 4. Start, first manager and first login

After building, from app root:

~~~powershell
node --env-file=.env scripts/bootstrap-manager.mjs synthetic.manager@acme.test "Synthetic HR Manager" --confirm
npm.cmd run dev
~~~

The bootstrap CLI is audited and refuses when a live HR manager already exists; do not bypass it or directly seed privileged users in an operational database. Its example is synthetic. There is no delivered 10k seed command. The system identity is migration-owned and cannot log in or appear on Team.

Open exactly APP_ORIGIN (normally http://localhost:5173), enter the registered synthetic email, retrieve the code from local SMTP inbox, verify it and use Team. Unregistered emails still receive the generic HTTP success message but no usable code. Production delivery is not demonstrated by localhost capture.

## 5. Happy path and recovery

1. HR signs in with actual delivered OTP; current /me mounts Team.
2. Enter member name/email, HR role or six granular permissions. Submit opens a native modal showing the target and access; Cancel writes nothing, Confirm saves and sends invitation.
3. Pending invitee requests OTP with their invited email within seven days; verification activates the account. Non-HR cannot see or call private Team administration.
4. Refresh Team after another person's first login; open Edit using current version. Confirm permission changes; existing sessions read updated rights on the next request.
5. HR removes departed member after confirmation. Access is revoked immediately while historical user attribution remains. Rejoin uses a fresh ID/invitation.
6. Last active HR cannot be removed/demoted; own role/permission changes are rejected. Own name changes are allowed. Conditional self-offboarding clears the UI's old challenge/state.

Recovery controls: resend replaces earlier OTP and consumes the same limits; Reinvite renews only pending invites and invalidates their open codes. On version conflict, refresh and reopen Edit (do not drop expectedVersion or silently merge fields). On SMTP failure the invitation remains saved with visible warning; fix relay and use Reinvite. No salary rewind/approval override, account reactivation endpoint, full payroll run or database reset control exists. [WORKFLOW_RULES.md](WORKFLOW_RULES.md) defines boundaries.

### Department/designation happy path

As HR, open Organization references, choose Departments or Designations, enter a synthetic name, Review reference, inspect the native confirmation and confirm. Cancel must save nothing. Edit supports rename and an active checkbox; deactivation preserves the entry/history, and reactivation retains its ID. Duplicate names ignore case and remain reserved while inactive. For a stale 409, refresh and reopen the edit. FX administration is now delivered by the P4c increment; salary bands are deferred. Detailed semantics are in [WORKFLOW_RULES §7](WORKFLOW_RULES.md#7-departmentdesignation-administration--done-for-p4a).

### Country/currency happy path

Sign in as HR, search the pinned currency catalogue and activate a supported numeric-minor-unit entry with confirmation. Add a country policy selecting that active currency, precision/rounding and descriptive notes; confirm actual details before save. Edit supports versioned policy and soft deactivation/reactivation, never code/ISO precision changes. Member read access sees the catalogue without administration. N.A. entries remain listed/unavailable. Currency deactivation blocks new financial uses even for active countries; history remains. See [module contract](../acme-salary-app/docs/COUNTRY_CURRENCY_MODULE.md) and [workflow rules](WORKFLOW_RULES.md).

## 6. Stop/restart and troubleshooting

Stop dev command normally; restart after a build when dist/main.js is absent. Stop project-local DB with npm run db:local:stop; restart with db:local:start. Never remove .local/postgres to troubleshoot. Compose service controls are separate. API startup does not run migrations.

| Symptom | Check / safe next action |
|---|---|
| ECONNREFUSED 55432 | Start local DB; verify existing .env uses chosen instance; do not reset data |
| API exits with Invalid configuration | Supply required keys and valid ranges; keep error values redacted |
| 401 /me | Session expired/revoked, invite/user not eligible or cookie absent; sign in again |
| 403 mutation | Exact Origin/CSRF/current HR restriction or own permissions; no blanket CORS bypass |
| HTTPS/Secure cookie mismatch | Explicit development HTTP cookie opt-in; production must stay secure |
| Generic OTP 202 but no code | Unknown/expired invite, rate limit, SMTP down or delivery invalidation; check sanitized audit/capture |
| 429 verify | IP auth budget reached; wait for window, do not disable throttle |
| 409 edit/reinvite/remove | Refresh/reopen latest account; final-manager/system conflicts are intentional |
| dist/main.js missing | npm run build before dev; watcher is not an initial-build guarantee |
| Checksum mismatch | Restore applied migration file and add a new migration; never rewrite checksums |
| Browser port already in use / server disappeared | Stop only owned test processes; run browser suites sequentially with existing configs |
| /readyz 503 while /healthz 200 | Deliberate incomplete-readiness contract; not a healthy production release |

## 7. API route reference

Canonical complete map is [CONTEXT.md §8](CONTEXT.md#8-api-route-map); 30 concrete operations:

| ID | Method | Path | Guard / response |
|---|---|---|---|
| H01 | GET | /healthz | Public; 200 status ok |
| H02 | GET | /readyz | Public; 503 schema_not_verified or database_unavailable |
| A01 | POST | /api/v1/auth/otp/request | Origin + strict email DTO + rate limits; generic 202 |
| A02 | POST | /api/v1/auth/otp/resend | Same handler/guards as A01; generic 202 |
| A03 | POST | /api/v1/auth/otp/verify | Origin, strict challenge/code and IP throttle; 200 with cookies, 401 or 429 |
| A04 | GET | /api/v1/auth/me | Current valid session; 200 identity or 401 |
| A05 | POST | /api/v1/auth/logout | Origin + bound CSRF/session; 200 or 403 |
| T01 | GET | /api/v1/team | Current HR session; 20 records/page; 401 or 403 denial |
| T02 | POST | /api/v1/team | Origin + CSRF + current HR + strict DTO; 201 account/delivery |
| T03 | PATCH | /api/v1/team/:id | Same + UUID/version/self/continuity checks; 200 |
| T04 | DELETE | /api/v1/team/:id | Same + version/last-active-HR protection; 200 soft removal |
| T05 | POST | /api/v1/team/:id/reinvite | Same + INVITED/version check; 200 account/delivery |
| O01 | GET | /api/v1/organization-references/departments | Current HR; strict offset; 20 rows/page; includes inactive; 401/403 denial |
| O02 | POST | /api/v1/organization-references/departments | HR + Origin/CSRF + strict name; 201 reference; duplicate 409 |
| O03 | PATCH | /api/v1/organization-references/departments/:id | Same + UUID/name/isActive/expectedVersion; 200 or stale 409 |
| O04 | GET | /api/v1/organization-references/designations | Same list guard/shape as O01 |
| O05 | POST | /api/v1/organization-references/designations | Same creation guard/shape as O02 |
| O06 | PATCH | /api/v1/organization-references/designations/:id | Same edit/deactivation guard/shape as O03 |
| C01 | GET | /api/v1/currency-catalogue | HR or read member; pinned 178-entry ISO list, N.A. preserved; no-store |
| C02 | GET | /api/v1/currencies | HR only; configured rows/versions including legacy |
| C03 | PATCH | /api/v1/currencies/:code | HR + Origin/CSRF, strict isActive/expectedVersion; immutable ISO facts |
| C04 | GET | /api/v1/countries | HR only; strict offset, 20 rows/page, includes inactive |
| C05 | POST | /api/v1/countries | HR + Origin/CSRF, strict country policy, active default required; 201 |
| C06 | PATCH | /api/v1/countries/:code | Same + expectedVersion/isActive; immutable code; stale 409 |
| F01 | GET | /api/v1/fx-rates | HR or read member; pair/asOf filters,20-row immutable history |
| F02 | POST | /api/v1/fx-rates | HR + Origin/CSRF; positive decimal/source/reason/expectedRevision; appends,201 |
| F03 | GET | /api/v1/fx-rates/resolve | HR or read member; base/quote/asOf; historical direct/inverse/USD path or422 |
| E01 | GET | /api/v1/employees | HR/read; literal search,current assignment filters,whitelisted sorting,page25/max100; no salary fields |
| E02 | GET | /api/v1/employees/filters | HR/read; country/department options including inactive reference labels |
| E03 | GET | /api/v1/employees/:id | HR/read; UUID; non-removed allowlisted profile or404; no salary fields |

## 8. CI verification

Actual pipeline: [pr-validation.yml](../.github/workflows/pr-validation.yml), windows-latest, 20-minute job, Node 24.20.0, exact PR SHA, contents-read token, pinned actions, allowed prefix and no stored checkout credentials. From app root, in order:

~~~powershell
npm.cmd ci --ignore-scripts --no-fund --no-audit
npm.cmd run db:local:start
npm.cmd run verify:database
npm.cmd run test:authentication
npm.cmd run test:team
npm.cmd run test:references
npm.cmd run test:country-currency
npm.cmd run test:fx
npm.cmd run qa:typecheck
# Run the next two from repository root, as CI does:
# node acme-salary-app/scripts/test-git-safety.mjs
# node acme-salary-app/scripts/verify-staged.mjs
node node_modules/@playwright/test/cli.js install chromium
npm.cmd run qa:e2e -- e2e/foundation.spec.ts
npm.cmd run test:login
npm.cmd run db:local:stop
~~~

verify:database expands to migrations, Prisma generation, lint/type/unit/build, identity checks, country/FX/hold/snapshot checks, approval checks, Prisma adapter and health smoke. test:login builds again and runs SMTP + multi-account auth/team Chromium in one disposable database and reference Chromium in a second disposable database, then country/currency Chromium in a third. Do not parallelize browser commands. Full qa:e2e includes explicit unfinished-requirement failures and is not the passing foundation CI slice. Merged PR #5 verification evidence (run 44997876398, job 137132754960): 22 unit tests, 72 existing logical DB checks, 22 team plus 23 reference DB checks, 12 foundation Chromium, 9 auth/team Chromium and 4 reference Chromium; 3/11 pass/fail requirement probes are a separate run, not full-system acceptance. This documentation task did not rerun application tests. See [SMOKE_TESTS.md](SMOKE_TESTS.md), [DEPLOYMENT.md](DEPLOYMENT.md).

Browser harness update: existing QA_RUN selects distinct web/API ports: login 4427/4428, references 4527/4528, country-currency 4627/4628, FX4727/4728; sequential capture SMTP remains 4325. The runner logs only group/stage/process status diagnostics. GitHub run 45006454596 failed during third-group startup before country cases executed; exact cause unproven. PR #7 final head4938a138 passed run45007418682/job137162007364 and was subsequently merged at0e0fb86; failed startup evidence remains historical. P4c adds the isolated FX group on4727/4728; no retries or relaxed assertions.

FX smoke: use synthetic HR to load a pair/date revision, enter positive decimal/source/reason, cancel confirmation (no write), then confirm first quote and append a correction. Verify prior row/audit before/after and stale conflict. Read member sees history/lookup, cannot POST. Resolve a historical direct/inverse/USD path with revision/source/date; reject missing/stale paths. Test pagination, negative DTO/Origin/CSRF, inactive currency, outage/error recovery and mobile/axe. Automated test:fx plus FX test:login group (4727/4728, own disposable DB). Full application remains incomplete.

## P5a employee directory integration

Sources employees-controller.ts,employees.ts,web features/employees/employees.tsx,test-employees.mjs and employees.spec.ts; [module contract](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). Login mounts Employees for HR/read accounts. E01 strict filters:search max200,country2,department UUID,status ACTIVE/INACTIVE,sort code/name/joiningDate/department/country,direction asc/desc,page1..100000,pageSize1..100 default25. Response items,total,page,pageSize; E03 same item shape: id,employee_code,email,first_name,last_name,joining_date,version,country_code,country_name,department_id,department,designation_id,designation,employment_status. Never salary fields. Fresh session/read check for every list/options/profile; literal escaped ILIKE,latest assignment as of UTC,removed exclusion,stable ID ties,count/page one SQL snapshot. Profile404,invalid400,anonymous401,denied403,no-store. Filters include inactive labels for existing records. Read-only UI:apply/clear/search/sort/paging/profile,request cancellation and mobile keyboard-scroll states. No DB migration or config added; models23/scalars178/migrations18/functions28/views2 unchanged. No complete employee CRUD/linkage/salary acceptance implied.
Sources employees/employees.controller.ts,employees/employees.service.ts,web employees.tsx,test-employees.mjs and employees.spec.ts; [module contract](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). Login mounts Employees for HR/read accounts. E01 strict filters:search max200,country2,department UUID,status ACTIVE/INACTIVE,sort code/name/joiningDate/department/country,direction asc/desc,page1..100000,pageSize1..100 default25. Response items,total,page,pageSize; E03 same item shape: id,employee_code,email,first_name,last_name,joining_date,version,country_code,country_name,department_id,department,designation_id,designation,employment_status. Never salary fields. Fresh session/read check for every list/options/profile; literal escaped ILIKE,latest assignment as of UTC,removed exclusion,stable ID ties,count/page one SQL snapshot. Profile404,invalid400,anonymous401,denied403,no-store. Filters include inactive labels for existing records. Read-only UI:apply/clear/search/sort/paging/profile,request cancellation and mobile keyboard-scroll states. No DB migration or config added; models23/scalars178/migrations18/functions28/views2 unchanged. No complete employee CRUD/linkage/salary acceptance implied.

CI adds npm.cmd run test:employees and a fifth isolated SMTP Chromium group on4827/4828,SMTP4325 sequential; artifacts qa-artifacts/employees. Approved ADR-005 requires independently HR-verified linkage and pending initial salaries; both need future database/API/UI integration,not inferred from directory reads.

Browser runtime update: Playwright now serves built web assets through scripts/qa-web-server.mjs (loopback Node HTTP,strict port,existing QA_API_PORT proxy); npm run dev remains development only. Build before qa:e2e; test:login builds itself. Repeated native dev/preview exits3221226505 are retained failures,root cause unproven. See [browser test runtime](../acme-salary-app/docs/BROWSER_TEST_RUNTIME.md); no deployment or retry/assertion change.

CI also runs `npm.cmd run test:qa-web` to verify real built-static path/MIME/HEAD protections and API proxy method/query/Origin/body/cookies/health/error behavior. No new config or dependency.
