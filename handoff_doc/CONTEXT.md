# ACME — technical context and handoff

**Purpose:** Describe implementation contracts, architecture, source evidence and pitfalls.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

ACME manages monthly salary records across countries/currencies; full payroll is outside the approved baseline. Login, HR team administration and HR department/designation administration have public functional workflows today. Monetary arithmetic, immutable salary/approval history, assignments, holds, FX revisions and snapshot access have internal implementations and database tests, not complete user workflows. PR #5 is merged at the source SHA above. This task changes documentation only; no deployment or new runtime test execution is claimed.

## 1. System overview

~~~mermaid
flowchart LR
  Browser[React root screen] --> Proxy[Vite development proxy]
  Proxy --> API[NestJS controllers]
  API --> PG[(PostgreSQL)]
  API --> SMTP[SMTP relay or local capture]
  Internal[Internal salary money and snapshot services] --> PG
  Prisma[Prisma runtime smoke/client] --> PG
~~~

Ports: web 5173; API 3001 bound to 127.0.0.1; project-local PostgreSQL 55432. Compose instead exposes PostgreSQL 5432, Mailpit SMTP 1025 and inbox 8025. Foundation QA uses web/API 4317/4318; isolated QA uses auth/team 4427/4428, organization references 4527/4528, country/currency 4627/4628, FX4727/4728, with sequential SMTP 4325. No Redis, remote storage or worker ports exist.

## 2. Directory structure

~~~text
/                                  Repository, policies and approved requirements
├─ AGENTS.md                       Root agent/Git/security instructions
├─ DEVELOPMENT_PLAN.md             Approved module roadmap and historic checkpoints
├─ GIT_CHANGELOG.md                Commit/PR ledger; some prior status prose is historical
├─ handoff_doc/                    This complete handoff pack
├─ Project Analysis/               Gap review, BRD, FRD, SOW, SDD
├─ Project Requirement/            Original requirement text
├─ .github/workflows/              PR validation only, not CD
└─ acme-salary-app/                npm workspace and command working directory
   ├─ package.json / package-lock.json   Pinned workspace scripts/dependencies
   ├─ compose.yaml                Development PostgreSQL and Mailpit only
   ├─ .env.example                Template; lacks owner migration URL
   ├─ apps/api/src/               NestJS entry, factories, services and unit tests
   ├─ apps/web/src/               main.tsx, login.tsx, team.tsx, organization-references.tsx, country-currency.tsx, fx-rates.tsx and styles.css
   ├─ database/migrations/        001..018 authoritative SQL, no down migrations
   ├─ database/schema.prisma      Introspected 23-model reference/client input
   ├─ scripts/                    DB lifecycle, migration, bootstrap, regression/safety tools
   ├─ e2e/                        Foundation and unmet-requirement Chromium probes
   ├─ e2e-auth/                   Real SMTP/login/team/reference Chromium workflows and capture server
   ├─ docs/                       Decisions, traceability, module docs and progress
   ├─ playwright*.config.ts       Separate protected test server/fixture setups
   ├─ QA_*.md / TEST_CASES.md / BUG_REPORT.md   Historical and latest execution evidence
   ├─ .local/                     Ignored DB binaries/data/credentials/browser installation
   └─ qa-artifacts/               Ignored reports, traces and synthetic screenshots
~~~

API src files by responsibility: main.ts registers HealthController and factory-produced auth/team/organization-reference controllers; config.ts validates env; authentication.ts owns transactions/session checks; auth-secrets.ts owns HMAC/CSPRNG and expiry; auth-rate.ts serializes abuse limits; otp-mail.ts provides mail adapters; team.ts contains admin transactions/DTOs; policy.ts contains reusable Principal predicates; salary-approval.ts and money.ts implement internal compensation rules; report-access.ts guards stored snapshots; database.ts constructs the Prisma pg adapter. Adjacent .test.ts files test config, policy, money and auth helpers.

## 3. Backend architecture

main.ts loads reflect-metadata and validated config, creates pg Pool(max 10, 3-second connect, 5-second statement and 10-second idle-transaction limits), declares health routes and registers controller factories through a local AppModule. Helmet precedes routes; auth/team/organization-reference responses set Cache-Control: no-store. Requests receive random X-Request-Id and allowlisted method/status/duration JSON logs; no request bodies/cookies/query text are logged. API binds loopback. app.enableShutdownHooks is enabled; explicit app.close wraps app close, OTP delivery drain and pool.end. Signal/drain behavior still needs production verification; no durable background-job guarantee follows from this wrapper.

Nest services use async pg queries and explicit BEGIN/COMMIT/ROLLBACK/finally-release. Team authorization calls AuthenticationService.authenticateWithin on the same client, retaining identity/session locks through the write. No JWT, Passport or decorator-based RBAC dependencies exist. SQL provides domain constraints and audit triggers; runtime account is acme_app. Prisma createDatabase uses restricted credentials and disabled query logging; runtime HTTP/domain paths currently use pg directly. IDs are UUID strings; counters/versions are integer; numeric values travel as decimal strings. See [DATA_MODEL.md](DATA_MODEL.md).

Migrations run through scripts/migrate.mjs, not API startup. It takes a schema advisory lock, validates SHA-256 of prior files and commits each new migration with its checksum. No auto-down/reset is provided. Local bootstrap acme_owner is the initdb bootstrap role and has development administrative powers; production least privilege is not established by this launcher.

There are no uploads, file document types, transcription, queues, scheduler, autonomous agents, SSE or webhook controllers. SMTP work is described in [ORCHESTRATION.md](ORCHESTRATION.md); absent AI contracts in [LLM_CONTRACTS.md](LLM_CONTRACTS.md).

## 4. Authentication and security module

Source: [auth-controller.ts](../acme-salary-app/apps/api/src/auth-controller.ts), [authentication.ts](../acme-salary-app/apps/api/src/authentication.ts), [auth-rate.ts](../acme-salary-app/apps/api/src/auth-rate.ts).

A01/A02 validate strict email input and exact Origin, consume rate budget and return a fresh random challengeId plus the same generic message for unknown/ineligible/throttled recipients. Delivery runs outside the response path. AuthenticationService.issue locks an eligible non-system ACTIVE/INVITED user, checks invitation expiry after lock, consumes prior open challenges and inserts a HMAC of a cryptographic six-digit code. The raw code is only passed to SMTP. Mail failure invalidates its challenge and records a sanitized event.

A03 validates UUID/code, enforces the IP limit and verifies under user-then-challenge locks, sampling the clock after lock acquisition. Three bad attempts consume the challenge; failed attempts commit. Success consumes once, activates a valid invitee, audits acceptance/login, and creates opaque random session and CSRF tokens stored only as keyed digests. acme_session cookie is HttpOnly; acme_csrf is readable for the header. Both are Secure by default, SameSite=Lax, path / and fixed 12-hour cookie maxAge. Server idle/absolute expiry respects smaller configured limits, so a cookie may outlive a valid session.

A04 re-reads current ACTIVE non-system identity/permissions and checks revocation/idle/absolute expiry under lock. A05 requires Origin and session-bound CSRF, revokes persistently and clears cookies. Root bootstrap is CLI only, refuses a live manager, and audits the system identity; no public signup endpoint exists. Rates: at most 5 accepted issues per email/IP/hour, 20/email/hour and 20 auth attempts/IP/10 minutes. Denials count toward IP events; identifiers are keyed digests. Proxy headers are not trusted. Rate rows have no automatic pruning job.

## 5. HR team module

Source: [team-controller.ts](../acme-salary-app/apps/api/src/team-controller.ts), [team.ts](../acme-salary-app/apps/api/src/team.ts), SQL 011/012, [TEAM_MODULE.md](../acme-salary-app/docs/TEAM_MODULE.md).

T01 returns live/invited accounts, excludes system/deleted identities, orders created_at/id and pages 20 rows. T02 creates a seven-day INVITED account and notifies after commit, returning delivery sent/failed. T03 changes fullName, isHrManager and permission array against expectedVersion. T04 soft-removes and revokes all access. T05 only renews INVITED records, increments version, invalidates open OTPs and resends mail. Rejoin is a new ID, not an activation endpoint for old DELETED rows.

Every operation takes the team advisory lock and validates a fresh HR session. Mutations require Origin and CSRF; unknown fields/privileges/duplicates are rejected. DB trigger checks trusted actor context, protects system identity, prevents own permission/role change and prevents deleting/demoting the final ACTIVE HR, even in tested direct-SQL races. Team writes and before/after audit are atomic. Generic stale/unavailable/duplicate conflicts are 409; missing/invalid mutation CSRF is 403; anonymous reads 401 and non-HR reads 403. Session guard errors and unexpected SQL faults are not silently turned into successful writes.

Users may edit their own name but not permissions; self-removal is subject to another active HR remaining. policy.canManageUser is an internal stricter helper (rejects any self target), not the live TeamService guard. Employee linkage is not administered by team DTOs. [RBAC.md](RBAC.md) distinguishes these contracts.

## 6. Internal compensation/reference/report modules

### Organization reference administration — done for P4a

Sources: [controller](../acme-salary-app/apps/api/src/organization-references-controller.ts), [service](../acme-salary-app/apps/api/src/organization-references.ts), [UI](../acme-salary-app/apps/web/src/organization-references.tsx), [module contract](../acme-salary-app/docs/ORGANIZATION_REFERENCES_MODULE.md), migrations 013/014 and approved ADR-003.

OrganizationReferencesService.run holds the current HR identity/session through each transaction and sets local acme.reference_actor for atomic before/after audits. Only departments/designations are accepted by referenceKind before any table-name interpolation; all values are SQL parameters. list returns 20 rows ordered by name/id, including inactive records. create trims a 1..200-character name and returns version 1. change requires name, isActive and expectedVersion; stale or unavailable IDs return 409. Case-insensitive uniqueness reserves inactive names. IDs cannot change; there is no DELETE route.

Database guard_organization_reference advances versions and rejects identity mutation/deletion; no-truncate triggers preserve references. validate_assignment_references locks active department/designation rows FOR SHARE, blocking concurrent deactivation while a new assignment is inserted. Existing assignments survive later deactivation. audit_organization_reference records session actor and before/after; audit failure rolls back the mutation. No old values are automatically cleaned: dirty pre-existing names cause constraint/migration failure for explicit review.

The HR-only UI supports confirmed create/rename/deactivate/reactivate, cancellation, paging, refresh and loading/empty/error/success states. Reopen after a 409; no unsaved-value auto-merge. Countries/currencies/FX administration and verified employee linkage remain future work. Salary bands are deferred pending formal overlap/validation/conflict rules.

SalaryApprovalService.submit(actorId,input) requires a backdated UTC date, mandatory reason, live employee/version and dated assignment. It validates positive exact precision and active currency, same-date collision/correction basis and historical FX path. It appends salary_change_requests; pending proposals do not touch salary_records.

SalaryApprovalService.decide(actorId,requestId,decision,comment) requires an independent active HR through SQL trigger checks. Rejection records only a decision. Approval locks the employee, checks current country policy version and shares-locks active currency, appends decision plus exact ledger row in one transaction. Deferred approval_salary_atomic prevents an approval committing without salary. record_salary_history creates before/after history/audit and advances employee version. Requester/subject checks rely on employee_id linkage, which is nullable and not yet verified end to end. **Block public salary exposure until linkage and trusted session-to-actor integration are implemented.**

money.ts uses Decimal.clone at precision 60. validateSalary rejects scientific notation, leading-format anomalies, zero/negative/excess precision and values above numeric(18,4). resolveFx uses latest eligible revision on/before as-of date with stale limit: direct, inverse, then two-leg USD. convertExact avoids intermediate rounding. roundCalculated supports HALF_UP/FLOOR/CEIL; sumConverted currently hardcodes HALF_UP. There is no external rate API. FX administration is now exposed through FxRatesService; salary bands and employee mutation HTTP/UI remain absent; read-only directory/profile now exist.

Employee assignments are append-only dated organization/status records. SQL validates joining date, protects historical joining-date changes and increments employee version. Holds/releases are append-only HR-attributed records; active holds block employee removal. No user-facing transfer, hold or permanent purge workflow exists.

readSalarySnapshot(client,actorId,snapshotId,exportRequested,now) is an internal same-transaction guard. It locks current identity, requires read+salary:view (and export when requested), checks owner, authorization version, expiry and invalidation. Removal invalidation depends on report_snapshot_employees membership; future generators must populate it. There is no report generation/export endpoint or CSV download. record_locks is schema groundwork only, not a functioning edit-lease service.

### Country and currency administration — P4b

Sources: country-currency.ts, country-currency-controller.ts, web country-currency.tsx, migrations 015..017 and [module contract](../acme-salary-app/docs/COUNTRY_CURRENCY_MODULE.md). Catalogue SELECT permits current HR or read member; configuration routes are HR-only. All writes authenticate in the same transaction, require Origin/CSRF and set local reference actor. Versioned updates and transactional before/after audits prevent silent lost updates.

Pinned SIX publication 2026-09-17 contains 178 codes (165 numeric and 13 N.A.). database/reference/iso4217.json records source/date/raw hash. Runtime catalogue is read-only, without network calls. HR activation inserts/updates configured currencies; version 0 means first activation. Codes/minor units are immutable through HTTP. N.A./unknown codes cannot activate, and mismatched legacy precision cannot silently reactivate. Separately reviewed precision corrections are rejected by SQL when referenced by country, ledger/request, FX or snapshot rows.

Country inputs configure name/default currency, 0..4 precision, HALF_UP/FLOOR/CEIL and two descriptive notes. Editing merges notes without dropping existing metadata; holds remain separate, not inferred legal automation. Codes are immutable, versions auto-advance, no delete/truncate. Inactive-country or currency checks are locked for new assignment/request/ledger/FX/snapshot writes. Existing history/policy snapshots are unchanged. An inactive currency may block a still-active country until HR changes policy or reactivates; the UI confirms this consequence. Deactivating a country remains possible while its default currency is inactive.

### FX administration — P4c

Sources: fx-rates-controller.ts, fx-rates.ts, web fx-rates.tsx and [FX module](../acme-salary-app/docs/FX_MODULE.md). HR or read members can list historical revisions/resolve as-of rates. Only HR can POST, using current-session transaction/Origin/CSRF and no actor override. A revision authoring form must load the current pair/date revision, require positive decimal rate/source/reason, show concrete confirmation, and handle stale409 without automatic merge/retry.

POST locks active pair currencies in code order and the existing advisory pair/date key, compares expectedRevision then appends current+1. SQL still enforces HR/sequence/active currencies/immutability. Migration018 writes before/after audit for NEW events while preserving all earlier audit rows. A failed audit undoes the append. Lookup is historically readable even after currency deactivation and returns exact unit factor plus IDs/dates/sources/inverse flags. It uses the existing direct/inverse/USD resolver and configured FX_MAX_STALENESS_DAYS. Future-effective quotes are excluded from earlier as-of selection; missing/stale paths422. This is rate preview/maintenance, not a completed salary or report generator.

## 7. Frontend architecture and data shapes

main.tsx renders the sole root screen, skip link, health panel and Login. Health fetch aborts after 8 seconds. login.tsx holds email/code/challenge/message/busy/signedIn/identity in local React state. An existing CSRF cookie only hints to call /me; backend identity remains authoritative. HR identity mounts Team, OrganizationReferences, CountryCurrency and FxRates; read members mount catalogue-only CountryCurrency and read-only FxRates; non-HR users do not see private Team controls. There is no React Router, path-based guard, app-wide cache or auth bearer storage.

team.tsx uses native fetch, local list/editor state and expectedVersion. It displays a native HTML dialog via showModal(), focuses/traps through browser behavior, prevents closing while saving, and supports cancellation, paging and explicit delivery errors. A 409 preserves unsaved input: refresh the list and reopen Edit to load the current version. It does not silently merge concurrent permissions. CSS is system-font/ordinary classes; mobile tables scroll inside their container. Relative requests need a same-origin proxy/static hosting arrangement outside development.

Core synthetic API shapes (field names are intentionally different from DB snake_case):

~~~json
{"email":"synthetic.member@acme.test","fullName":"Synthetic Member","isHrManager":false,"permissions":["read","salary:view"]}
~~~

~~~json
{"fullName":"Synthetic Member","isHrManager":false,"permissions":["read"],"expectedVersion":2}
~~~

~~~json
{"id":"00000000-0000-4000-8000-000000000002","isHrManager":false,"permissions":["read"]}
~~~

The first is invite DTO; second is edit DTO; third is current-session identity response. T02/T05 return account (DB snake_case fields including team_version) plus delivery. Delete/reinvite input contains only expectedVersion. Auth request uses email; verification uses challengeId and six-digit code; request response contains challengeId/message, never the raw code or token. Financial examples and complete stored fields are in [DATA_MODEL.md](DATA_MODEL.md).

## 8. API route map

30 concrete method/path operations are listed below, registered by main.ts and the auth, team, organization-reference, country-currency,FX and employee controller factories. Organization references register three patterns with kind strictly limited to departments/designations. The two OTP request aliases share one handler. No salary writes, employee mutations, audit browser, report generator, file or deployment endpoints are registered.

No deprecated registered routes or redirect targets were found. Old SDD route proposals are planned/unimplemented contracts, not legacy endpoints with working redirects.

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

## 9. Bug fixes and pitfalls

Each entry distinguishes code-backed protections from production incidents; no production incident history is asserted.

1. **Inactive currency at approval:** submission validation could become stale → approval-time recheck/shared lock in salary-approval.ts and SQL 006 → never rely on an earlier eligibility check. Regression first failed before the fix and later passed.
2. **Split ledger/history/audit writes:** partial history would corrupt attribution → SQL 004 after-insert trigger plus transaction rollback → insert ledger only through a complete transaction; do not manually duplicate history.
3. **Assignment/joining history drift:** stale version/date changes could invalidate history → SQL 005 advances version and rejects joining dates after existing events → never rewrite historical assignments.
4. **Malformed OTP UUIDs:** loose input could reach PostgreSQL errors → strict grouping in authentication.ts and Zod DTO boundary → validate UUIDs before SQL.
5. **Expiry sampled before locks:** waiting requests could use an old timestamp → read clock after user/challenge/session locks → concurrency tests must prove an actual lock wait.
6. **Rollback of wrong-code attempts:** throwing inside the attempt transaction could undo limits → return null and commit the attempt → distinguish business denial from infrastructure failure.
7. **Ambiguous SQL parameters:** CASE timestamp and UUID/text reuse caused real regression failures → explicit timestamptz/uuid/text casts → pg parameter inference is not a substitute for type-aware SQL.
8. **Infinite health loading / remote fonts / contrast:** foundation UI had bounded-state/accessibility gaps → AbortController, local system fonts and improved colors → preserve UI timeout, axe and network checks.
9. **Cold Chromium startup:** context creation exceeded a short setup budget → 60-second test budget while retaining the 8-second application deadline → do not loosen actual app assertions or add hidden retries.
10. **Inherited Playwright web servers and port collisions:** config merge duplicated server arrays; concurrent runners lost servers → replace arrays, distinct ports, sequential browser commands and visible diagnostics → isolate fixtures and do not equate a runner failure with an application pass.
11. **Invite acceptance invalidates an editor:** INVITED→ACTIVE changes team_version → refresh before edit; stale writes correctly return 409 → never bypass expectedVersion to repair a test.
12. **Fixture restart duplicates:** beforeAll inserted existing live test users after worker restart → guarded ON CONFLICT setup in auth/team suites → fixtures must stay within the named synthetic DB; failures must not suppress later coverage.
13. **SMTP failure test ordering:** closing shared capture too early broke later logins → run failure case last and idempotently close capture → test state is part of the workflow contract.
14. **Windows pg_ctl pipes:** inherited stdio could keep command cells open → hidden process/stdin-out ignore in launcher → reuse the existing launcher instead of starting uncontrolled services.

15. **Shared HR fixtures broke last-manager tests:** reference fixtures changed the team suite's manager count; attempted cleanup correctly hit continuity protection → test-login.mjs now uses separate disposable databases for auth/team and reference groups → never weaken guards or delete shared data to manufacture a pass. Artifacts use login/references folders.
16. **Migration checksum mismatch during local iteration:** a modified applied file was detected → restore exact already-applied bytes and use a forward migration for new constraints → never edit stored checksums.

## 10. Discrepancies and unimplemented contracts

- Older BRD/FRD/SDD text says 24-hour OTP and permissive own salary edits. Approved DECISIONS.md/ADR addenda override with 15-minute maximum, self safeguards and independent backdated approval. Do not treat old paragraphs as current implementation instructions.
- Some old progress/ledger paragraphs describe earlier OPEN/pending states. PR #4 and PR #5 are now merged; current status is taken from the latest entries and MCP-verified source merge. Preserve historical checkpoints as history. Historical QA 12/14 and later 2/12 or 3/11 results refer to different scoped runs, not contradictory full-system passes.
- policy.canManageUser rejects all self targets, while live TeamService permits own name and conditional offboarding. The helper is not wired to these routes.
- Nullable user employee links do not meet the approved verified-link requirement. Internal salary self checks are incomplete for unlinked users; there is no public salary API yet.
- .env.example lacks MIGRATION_DATABASE_URL; local launcher is 55432 while Compose/template use 5432. Compose provisions no acme_app role/migrations; existing .env is not repaired automatically.
- FX_MAX_STALENESS_DAYS is wired to public FX resolution; future salary/report integration must also pass the configured value rather than silently using an internal constructor default. Cookie lifetime is fixed 12 hours even with shorter server expiry. sumConverted uses HALF_UP regardless of a future target-country policy.
- /readyz intentionally always reports not ready, even with DB connectivity; do not fake success for deployment checks.
- No approved hosting, TLS/proxy, backup/restore, durable mail queue, external FX provider, LLM, storage/upload or production CI/CD implementation exists.

## 11. Extension rules

New module: obtain unresolved rules, add forward SQL and transaction/session boundary, strict DTO/controller registration, API IDs here, RBAC/workflows, functional UI and actual DB/browser tests. New provider/job/document type has no existing plugin interface: design and approve its contract first. New permission requires both SQL/Zod/policy and UI/tests changes. Never convert an internal actorId parameter into a public body field. See [BACKLOG.md](BACKLOG.md).

## 12. Environment inventory

| Variable | Required/default | Consumer and caveat |
|---|---|---|
| NODE_ENV | development; development/test/production | config.ts; production forbids HTTP APP_ORIGIN/insecure cookies and mailer requires TLS |
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
| QA_RUN | final fallback | Playwright artifact subfolder; CI sets ci, isolated auth runner sets login or references |
| PLAYWRIGHT_BROWSERS_PATH | Set by playwright.config.ts to absolute .local/browsers | CI also sets same project-local path; not an API setting |
| ACME_AUTH_TEST_DATABASE | Set by test-login.mjs | Random acme_test_ identifier; auth/team/reference browser fixtures verify URL database matches it |
| QA_ASSERT_REPORT | Optional | qa-assert-observer.mjs output path, supplied by qa-regression.mjs |
| CI | true in Actions | Test/tool noninteractive mode; not a business feature flag |
| PR_BRANCH | Supplied from GitHub head_ref in workflow | Prefix validation; not a runtime setting |
| POSTGRES_USER | Compose sets development owner | Container initialization only; not consumed by API config |
| POSTGRES_PASSWORD | Compose development value | Container initialization only; existing dev literal is not a production secret strategy |
| POSTGRES_DB | Compose sets acme | Container initialization only; does not create restricted runtime role |


Sources: config.ts, .env.example, scripts/local-postgres.mjs, prisma.config.ts, scripts/test-*.mjs, scripts/qa-*.mjs, playwright*.config.ts, apps/web/vite.config.ts, compose.yaml and the workflow. No frontend VITE_* variable is consumed. See [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md) for safe configuration.

## 13. Detailed HTTP contracts

Resolve IDs through section 8; there are no additional endpoints in this section. JSON request bodies use Content-Type: application/json. Browser session cookies are the authentication mechanism, not Authorization: Bearer. Team, auth and organization-reference responses are no-store. String HttpExceptions expose a message/statusCode through Nest's filter; readiness deliberately returns its custom status/reason body. Unexpected database/service faults must not be treated as successful writes. A framework 404 at an absent business endpoint is not a working permission guard.

| IDs | Request/query | Successful response | Important failures/side effects |
|---|---|---|---|
| H01 | No body | 200, {status: ok} | No database dependency or private data |
| H02 | No body | No successful-ready response implemented | Always 503; {status: not_ready, reason: schema_not_verified} after SELECT 1, otherwise database_unavailable |
| A01,A02 | Strict {email}; email format and max 254 characters, normalized lower-case after validation | 202, {challengeId, message}; message includes configured code lifetime | Bad email/extra fields 400, wrong/missing Origin 403. Eligible, unknown, expired-invite, rate-denied and eventual failed-delivery responses have the same shape. Issuance throttling does not return 429 here |
| A03 | Strict {challengeId: UUID, code: six-digit string} | 200, {message: Signed in}; Set-Cookie session and CSRF values | Wrong Origin 403; malformed/used/expired/unknown/wrong code 401; verification IP budget 429. Neither token nor code is returned in JSON |
| A04 | Session cookie; no request DTO | 200, {id, isHrManager, permissions} | 401 if invalid identity/session. permissions is stored array, not an expanded six-right HR array; isHrManager implies rights through policy |
| A05 | Session cookie plus X-CSRF-Token and Origin; body is ignored, not a strict DTO | 200, {message: Signed out}, clears both cookies | 403 for rejected Origin/session/CSRF; revokes stored session |
| T01 | Strict query {offset}; default 0, coerced integer 0..100000; no other query fields | 200, {items: Account[], total: integer}, page size 20 | Bad query 400, anonymous 401, non-HR 403 |
| T02 | Strict {email, fullName, isHrManager, permissions}; all four fields required | 201, {account: Account, delivery: sent or failed} | Name trimmed 1..200 chars; email max 254 and lower-case; explicit boolean; array max 6 unique allowed rights (empty permitted). Bad DTO 400, rejected mutation/role 403, duplicate live email 409. SMTP failure leaves committed invitation and explicit failed result |
| T03 | UUID path ID; strict {fullName, isHrManager, permissions, expectedVersion} | 200, Account directly (no account wrapper) | expectedVersion positive integer; stale/missing/system/removed target 409, own role/permission change 403, last-active-HR demotion 409; no email/employee-link edit field |
| T04 | UUID path ID; strict {expectedVersion} | 200, {message: Account removed; access revoked} | Same mutation guards; stale/unavailable/last-manager conflict 409; soft removal only, history retained |
| T05 | UUID path ID; strict {expectedVersion} | 200, {account: Account, delivery: sent or failed} | Only INVITED, including expired invitations, can renew; ACTIVE/DELETED/stale targets 409. Version/expiry advance and old OTPs invalidate before post-commit email |
| O01,O04 | Strict query {offset}; default 0, integer 0..100000 | 200, {items: Reference[], total}; 20 rows ordered name/id, includes inactive | Bad query/kind 400; anonymous 401, member 403 |
| O02,O05 | Strict {name}; trim; length 1..200 | 201, Reference directly | Unknown fields/invalid name 400; Origin/CSRF/non-HR 403; duplicate active/inactive name 409 |
| O03,O06 | UUID ID; strict {name,isActive,expectedVersion}; version positive integer | 200, Reference directly | Invalid DTO/ID 400; Origin/CSRF/non-HR 403; missing/stale row 409; no code/ID editing or deletion |

Reference is {id: UUID, name: display-cased string, is_active: boolean, version: integer}. Reactivation keeps the same ID. Non-HR users have no admin-list access, even with all six business permissions.

Account contains exactly the selected team row columns: id, email, full_name, is_hr_manager, permissions, status, invite_expires_at and team_version. The stored full user row has additional fields documented in DATA_MODEL; they are not all public Team response fields. All permission values are case-sensitive members of read, write, edit, delete, salary:view, export; duplicates/unknown fields are rejected by the team DTOs.

There is no HTTP idempotency-key, edit-lease-token, session-list/revoke-other-session, user reactivation, signup or salary-approval DTO contract yet. Internal BackdatedRequestInput is {employeeId,effectiveFrom,amount,currency,reason,expectedVersion,correctsId?}; amount is a decimal string and effectiveFrom an ISO date. Its actorId argument must come from a future trusted session boundary, not the client. Do not mistake this internal TypeScript interface for a registered API.


### Country/currency detailed DTOs

C01 returns {items:[{code,currency_name,minor_units,published_on,source,is_active,version,supported,configured_minor_units}]}. minor_units/configured_minor_units may be null. C02 returns configured {code,minor_units,is_active,version}. C03 takes strict {isActive,expectedVersion}; 0 is only valid for first activation. C04 uses strict offset 0..100000 and returns {items,total}, pages of 20 sorted name/code. C05 takes {countryCode,countryName,defaultCurrency,decimalPlaces,roundingMode,regulatoryNotes,retentionNotes}; C06 omits countryCode and adds {isActive,expectedVersion}. Names trim 1..200; notes trim/max4000; uppercase codes length2/3, precision0..4, rounding enum. Country output uses snake_case and derived regulatory_notes/retention_notes. Invalid DTO400; Origin/CSRF/role403; anonymous read401; stale/duplicate/inactive-default conflict409. Policy notes do not enforce legal retention.

### FX detailed DTOs

F01 strict query: optional base/quote three uppercase letters, asOf valid calendar date, offset0..100000; returns {items,total}, page20 sorted date descending,base/quote,revision descending,ID. Row: id,base_currency,quote_currency,effective_date,revision,rate decimal string,source,reason,created_by,recorded_at. F02 strict {base,quote,effectiveDate,rate,source,reason,expectedRevision}; different pair, positive plain NUMERIC(18,8) string (<=10 integer/8 fractional digits), source/reason trimmed1..500/1..2000, expectedRevision>=0. Returns201 row. F03 strict {base,quote,asOf}; returns {base,quote,asOf,maxStalenessDays,rate,path:[{rate:{id,base,quote,effectiveDate,revision,rate,source},inverse}]}. Same configured currency yields1/empty path. No eligible path/unknown currency422; invalid DTO400; denied role/CSRF/Origin403; anonymous read401; stale/inactive409. No PATCH/DELETE or per-salary override exists.

## Appendix A. Source inventory at merged implementation snapshot

The following 112 tracked files capture the PR #5 implementation baseline. Current additions include the handoff pack, country-currency API/service/UI/catalogue/migrations015..017, and FX API/service/UI, migration018, module contract and DB/browser tests. The pack adds its 14 Markdown deliverables separately; ignored runtime state and the local uploaded brief are excluded.

~~~text
.gitattributes
.github/PULL_REQUEST_TEMPLATE.md
.github/workflows/pr-validation.yml
.gitignore
AGENTS.md
DEVELOPMENT_PLAN.md
GIT_CHANGELOG.md
Project Analysis/business_requirements_document_brd.md
Project Analysis/functional_requirements_document_frd.md
Project Analysis/requirement_review_scope_baseline.md
Project Analysis/statement_of_work_sow.md
Project Analysis/system_design_document_sdd.md
Project Requirement/ACME Salary Management.txt
README.md
acme-salary-app/.env.example
acme-salary-app/.gitignore
acme-salary-app/BUG_REPORT.md
acme-salary-app/QA_EXECUTION_REPORT.md
acme-salary-app/QA_TEST_PLAN.md
acme-salary-app/README.md
acme-salary-app/TEST_CASES.md
acme-salary-app/apps/api/package.json
acme-salary-app/apps/api/src/auth-controller.ts
acme-salary-app/apps/api/src/auth-rate.ts
acme-salary-app/apps/api/src/auth-secrets.test.ts
acme-salary-app/apps/api/src/auth-secrets.ts
acme-salary-app/apps/api/src/authentication.ts
acme-salary-app/apps/api/src/config.test.ts
acme-salary-app/apps/api/src/config.ts
acme-salary-app/apps/api/src/database.ts
acme-salary-app/apps/api/src/main.ts
acme-salary-app/apps/api/src/money.test.ts
acme-salary-app/apps/api/src/money.ts
acme-salary-app/apps/api/src/organization-references-controller.ts
acme-salary-app/apps/api/src/organization-references.ts
acme-salary-app/apps/api/src/otp-mail.ts
acme-salary-app/apps/api/src/policy.test.ts
acme-salary-app/apps/api/src/policy.ts
acme-salary-app/apps/api/src/report-access.ts
acme-salary-app/apps/api/src/salary-approval.ts
acme-salary-app/apps/api/src/team-controller.ts
acme-salary-app/apps/api/src/team.ts
acme-salary-app/apps/api/tsconfig.json
acme-salary-app/apps/web/index.html
acme-salary-app/apps/web/package.json
acme-salary-app/apps/web/src/login.tsx
acme-salary-app/apps/web/src/main.tsx
acme-salary-app/apps/web/src/organization-references.tsx
acme-salary-app/apps/web/src/styles.css
acme-salary-app/apps/web/src/team.tsx
acme-salary-app/apps/web/src/vite-env.d.ts
acme-salary-app/apps/web/tsconfig.json
acme-salary-app/apps/web/vite.config.ts
acme-salary-app/compose.yaml
acme-salary-app/database/migrations/001_identity_audit.sql
acme-salary-app/database/migrations/002_country_employee_fx.sql
acme-salary-app/database/migrations/003_salary_approval.sql
acme-salary-app/database/migrations/004_salary_history_atomic.sql
acme-salary-app/database/migrations/005_assignment_version_guard.sql
acme-salary-app/database/migrations/006_approval_currency_guard.sql
acme-salary-app/database/migrations/007_authentication.sql
acme-salary-app/database/migrations/008_auth_rate_limits.sql
acme-salary-app/database/migrations/009_identity_revocation.sql
acme-salary-app/database/migrations/010_auth_rate_denials.sql
acme-salary-app/database/migrations/011_team_integrity.sql
acme-salary-app/database/migrations/012_team_audit_snapshots.sql
acme-salary-app/database/migrations/013_organization_references.sql
acme-salary-app/database/migrations/014_reference_name_bounds.sql
acme-salary-app/database/schema.prisma
acme-salary-app/docs/DECISIONS.md
acme-salary-app/docs/DEVELOPMENT_LOG.md
acme-salary-app/docs/DEVELOPMENT_PROGRESS.md
acme-salary-app/docs/KNOWN_ISSUES.md
acme-salary-app/docs/LOGIN_MODULE.md
acme-salary-app/docs/ORGANIZATION_REFERENCES_MODULE.md
acme-salary-app/docs/PR_1_SCOPE.md
acme-salary-app/docs/REQUIREMENT_TRACEABILITY.md
acme-salary-app/docs/TEAM_MODULE.md
acme-salary-app/docs/TECHNICAL_DECISIONS.md
acme-salary-app/e2e-auth/authentication.spec.ts
acme-salary-app/e2e-auth/organization-references.spec.ts
acme-salary-app/e2e-auth/smtp-capture.ts
acme-salary-app/e2e-auth/team.spec.ts
acme-salary-app/e2e/foundation.spec.ts
acme-salary-app/e2e/requirements.spec.ts
acme-salary-app/eslint.config.mjs
acme-salary-app/package-lock.json
acme-salary-app/package.json
acme-salary-app/playwright.auth.config.ts
acme-salary-app/playwright.config.ts
acme-salary-app/prisma.config.ts
acme-salary-app/scripts/bootstrap-manager.mjs
acme-salary-app/scripts/local-postgres.mjs
acme-salary-app/scripts/migrate.mjs
acme-salary-app/scripts/pin-dependencies.mjs
acme-salary-app/scripts/qa-assert-observer.mjs
acme-salary-app/scripts/qa-regression.mjs
acme-salary-app/scripts/qa-report.mjs
acme-salary-app/scripts/test-approvals.mjs
acme-salary-app/scripts/test-authentication.mjs
acme-salary-app/scripts/test-country-fx-retention.mjs
acme-salary-app/scripts/test-database.mjs
acme-salary-app/scripts/test-git-safety.mjs
acme-salary-app/scripts/test-health.mjs
acme-salary-app/scripts/test-login.mjs
acme-salary-app/scripts/test-organization-references.mjs
acme-salary-app/scripts/test-prisma.mjs
acme-salary-app/scripts/test-team.mjs
acme-salary-app/scripts/verify-staged.mjs
acme-salary-app/tsconfig.base.json
acme-salary-app/tsconfig.qa.json
acme-salary-app/vitest.config.ts
~~~

Browser harness update: existing QA_RUN selects distinct web/API ports: login 4427/4428, references 4527/4528, country-currency 4627/4628, FX4727/4728; sequential capture SMTP remains 4325. The runner logs only group/stage/process status diagnostics. GitHub run 45006454596 failed during third-group startup before country cases executed; exact cause unproven. PR #7 final head4938a138 passed run45007418682/job137162007364 and was subsequently merged at0e0fb86; failed startup evidence remains historical. P4c adds the isolated FX group on4727/4728; no retries or relaxed assertions.

## P5a employee directory integration

Sources employees-controller.ts,employees.ts,web employees.tsx,test-employees.mjs and employees.spec.ts; [module contract](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). Login mounts Employees for HR/read accounts. E01 strict filters:search max200,country2,department UUID,status ACTIVE/INACTIVE,sort code/name/joiningDate/department/country,direction asc/desc,page1..100000,pageSize1..100 default25. Response items,total,page,pageSize; E03 same item shape: id,employee_code,email,first_name,last_name,joining_date,version,country_code,country_name,department_id,department,designation_id,designation,employment_status. Never salary fields. Fresh session/read check for every list/options/profile; literal escaped ILIKE,latest assignment as of UTC,removed exclusion,stable ID ties,count/page one SQL snapshot. Profile404,invalid400,anonymous401,denied403,no-store. Filters include inactive labels for existing records. Read-only UI:apply/clear/search/sort/paging/profile,request cancellation and mobile keyboard-scroll states. No DB migration or config added; models23/scalars178/migrations18/functions28/views2 unchanged. No complete employee CRUD/linkage/salary acceptance implied.

CI adds npm.cmd run test:employees and a fifth isolated SMTP Chromium group on4827/4828,SMTP4325 sequential; artifacts qa-artifacts/employees. Approved ADR-005 requires independently HR-verified linkage and pending initial salaries; both need future database/API/UI integration,not inferred from directory reads.

Browser runtime update: Playwright now serves built web assets through scripts/qa-web-server.mjs (loopback Node HTTP,strict port,existing QA_API_PORT proxy); npm run dev remains development only. Build before qa:e2e; test:login builds itself. Repeated native dev/preview exits3221226505 are retained failures,root cause unproven. See [browser test runtime](../acme-salary-app/docs/BROWSER_TEST_RUNTIME.md); no deployment or retry/assertion change.

CI also runs `npm.cmd run test:qa-web` to verify real built-static path/MIME/HEAD protections and API proxy method/query/Origin/body/cookies/health/error behavior. No new config or dependency.
