# ACME — manual and automated smoke verification

**Purpose:** Provide executable checks without implying missing workflows passed.

**Last verified against codebase:** 22 November 2026 (Asia/Calcutta), 2a3ee19 (merged PR #8), plus the P5a employee-directory increment on feature/employee-management.

## Executive summary

Run checks on a dedicated synthetic local instance. Use delivered UI/browser authentication, not a forged JWT or a copied database digest. The last recorded source verification had passing scoped suites but failing unfinished-business probes. This documentation task validates documents, not a new application test run. Related: [README.md](README.md), [CONTEXT.md §9](CONTEXT.md#9-bug-fixes-and-pitfalls), [RBAC.md](RBAC.md).

## 0. Exact pre-merge CI gates

Working directory acme-salary-app unless noted; all delivered gates below must exit 0. Start from README setup and a private valid .env, never production.

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
# Repository root:
# node acme-salary-app/scripts/test-git-safety.mjs
# node acme-salary-app/scripts/verify-staged.mjs
node node_modules/@playwright/test/cli.js install chromium
npm.cmd run qa:e2e -- e2e/foundation.spec.ts
npm.cmd run test:login
npm.cmd run db:local:stop
~~~

Before these commands, CI validates the PR prefix, checks out exact SHA and sets Node 24.15.0. After tests it uploads seven-day synthetic diagnostics and always attempts DB shutdown when startup succeeded. Do not disable version/rate/security checks or add retries to get a green run. Full npm run qa:e2e includes requirement probes and is intentionally nonzero until remaining modules exist. Historical baseline and newer 3-pass/11-fail probes must remain visible. qa:regression instruments five older DB/health commands and is not a substitute for auth/team/browser gates.

## 1. Health and readiness

With dev API started, run from PowerShell:

~~~powershell
curl.exe -i http://127.0.0.1:3001/healthz
curl.exe -i http://127.0.0.1:3001/readyz
~~~

Pass: first HTTP 200 with status ok, X-Request-Id and nosniff; second HTTP 503 with not_ready and schema_not_verified when DB is connected, or database_unavailable when not. A curl exit code alone does not assert HTTP success. Do not turn deliberate 503 into a failed deployment repair or claim production readiness.

## 2. Authentication and token handling

1. Bootstrap a synthetic HR account only on the disposable local system, following README. Configure local mail capture and exact browser APP_ORIGIN.
2. Open the root UI, request code for registered email and an unknown synthetic email. Both public responses are generic; only eligible recipient receives usable mail. Raw code must not appear in the HTTP response/server log.
3. Enter actual captured code; pass if signed in and /me identifies current user. Inspect browser cookies: session HttpOnly, SameSite=Lax, Secure unless explicit dev opt-in. Do not export a real cookie or write it to docs.
4. Resend and reject the old code; submit wrong code three times and reject that challenge thereafter; a successful code must not replay. Rate-limit denial must not become an account-existence response.
5. Reload to restore valid session; send logout without/bad CSRF (403); use real logout and confirm /me now 401. Cookie expiry hint alone cannot grant access.

For automated actual token creation and negative boundaries, use test:login/test:authentication; they retrieve test codes via capture and retain browser-managed cookies. No bearer token endpoint exists.

## 3. Team CRUD, invitations and permissions

1. Sign in as HR A. Team must appear; system/deleted accounts must not. Non-HR B must not see/call admin functionality (403); anonymous Team read is 401.
2. Fill synthetic invite fields and permission set. Cancel confirmation: no user row/mail. Confirm: saved INVITED record, seven-day expiry and actual SMTP invitation. Duplicate live email (case-insensitive) gives 409; invalid/unknown DTO fields/rights give 400.
3. Reinvite pending member: new version/expiry and old OTP invalidation. Accept invite with OTP in a separate browser context. Refresh HR list before Edit because acceptance advanced version.
4. Change member permissions through UI confirmation; existing member /me must read updated rights. Stale expectedVersion must 409; own role/permission tampering 403 even with handcrafted requests. Missing and invalid CSRF must 403.
5. Remove member; their existing sessions/codes fail immediately; stored actor identity/history remains. Reinvite same address as a new account and confirm new ID. Do not use raw SQL to restore an operational identity.
6. Use HR B to offboard HR A. Last active HR cannot be removed or demoted; pending HR invites do not count as active. Test direct SQL races only via the isolated test:team harness, never manually on an existing shared database.
7. Exercise Refresh, Edit/Cancel, Previous/Next with >20 synthetic fixtures; native dialog keyboard/cancel behavior, narrow viewport/overflow and axe. SMTP failure should show saved-but-undelivered warning and keep recoverable invitation.

Pass criteria correspond to TEAM-E2E-01..04 and 22 TEAM-DB checks. Test audit rollback only through its fault-injected disposable DB fixture. Never modify immutable audit entries to clean up.

## 4. Compensation, employee and reporting workflows

Internal regression commands verify exact money, history, independent approval, pending/rejected exclusion from ledger selection, inactive currency rejection, holds and snapshot guards. They do not verify a user-facing employee/salary/report API that does not exist. Mark manual UI workflows blocked/not started until delivered; do not substitute a fabricated UI or blanket 401 handler for missing features. Before acceptance, implement employee linkage, distinct requester/approver sessions, historical transfer/currency scenarios, real reports/exports, snapshot permission/expiry invalidation and full role/action matrix.

## 5. Integrations and production gates

Test captured SMTP success/failure without external addresses. No LLM, upload/download storage, worker-health, webhook, graph or deployment wizard smoke endpoint exists. Production TLS/mail/proxy/backup/restore/security/load/UAT are blocked until approved infrastructure and complete workflows exist. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Known failure modes appendix

| Symptom | Likely cause | Fix pointer |
|---|---|---|
| Active code rejected after resend | Correct single-use/invalidation behavior | CONTEXT §4 and WORKFLOW_RULES §2 |
| Edit conflict immediately after first login | INVITED→ACTIVE advanced version | CONTEXT §9 item 11; refresh/reopen |
| Currency approval now fails | Currency deactivated or policy/employee stale | CONTEXT §9 item 1; no override |
| Browser setup/port failure or lost server | Concurrent/duplicated test processes | CONTEXT §9 items 9–10; sequential dedicated configs |
| Later tests blocked after a failure | Fixture restart/state dependency | CONTEXT §9 items 12–13; fix fixture, rerun all cases |
| Local DB command hangs | Inherited Windows process pipes | CONTEXT §9 item 14; use launcher |
| Generic request accepted but no email | Eligibility, throttle, SMTP or ephemeral work loss | SMTP_INTEGRATION and ORCHESTRATION |
| Missing business navigation/API | Feature not delivered, not proof of successful authorization | ROADMAP and BACKLOG |


## 6. Department/designation administration — manual synthetic smoke

1. Sign in as an active HR Manager; Organization references appears. A member must not see it; direct API reads must return 403 (401 when anonymous).
2. In Departments, enter a synthetic name with surrounding spaces. Review and cancel: no record should persist. Review again and confirm: trimmed spelling/display casing persists.
3. Submit the same spelling in another case: 409/visible duplicate message, including for an inactive existing record.
4. Edit and confirm a rename; deactivate and confirm. The record stays visible as inactive. Reactivate: same ID, higher version. No deletion action exists.
5. Repeat for Designations. Exercise both pagination directions when over 20 records exist; check mobile table scrolling and keyboard dialog cancellation.
6. Open the same edit in two independent HR contexts: first confirmed change succeeds, second gets 409 and must refresh/reopen. Missing/wrong CSRF or Origin must not mutate data.
7. Use only test:references in a disposable database for inactive-assignment, concurrent deactivation, direct deletion/truncate and audit-failure checks. Never run destructive probes against an existing/shared database.

Automated equivalents: test:references (23 real PostgreSQL checks) and test:login (9 auth/team plus 4 reference Chromium cases). Empty/outage rendering is explicitly simulated UI-state coverage; real CRUD/pagination uses actual API/database calls. Merged PR #5 head d84ba8e passed run 44997876398/job 137132754960. This documentation task does not claim a new browser execution.

## 7. Country/currency smoke

Use synthetic HR/read-member contexts. Verify catalogue search, numeric minor units vs N.A., HR-only currency activation confirmation/cancel, country creation, immutable code, versioned precision/rounding/notes edits, deactivate/reactivate and stale conflicts. Member sees catalogue without administration; direct country/config API denies member. Inactivate a currency then confirm new assignment/salary/FX/report use fails through isolated test:country-currency, preserving old history. UI warns about inactive defaults, descriptive notes and no legal automation. Check pagination, outages/recovery, mobile/axe and console. New country-currency browser group uses its own disposable database/artifact folder; do not run against shared data.

Browser harness update: existing QA_RUN selects distinct web/API ports: login 4427/4428, references 4527/4528, country-currency 4627/4628; sequential capture SMTP remains 4325. The runner logs only group/stage/process status diagnostics. GitHub run 45006454596 failed during third-group startup before country cases executed; exact cause unproven. PR #7 final head4938a138 passed run45007418682/job137162007364 and was subsequently merged at0e0fb86; failed startup evidence remains historical. P4c adds the isolated FX group on4727/4728; no retries or relaxed assertions.

FX smoke: use synthetic HR to load a pair/date revision, enter positive decimal/source/reason, cancel confirmation (no write), then confirm first quote and append a correction. Verify prior row/audit before/after and stale conflict. Read member sees history/lookup, cannot POST. Resolve a historical direct/inverse/USD path with revision/source/date; reject missing/stale paths. Test pagination, negative DTO/Origin/CSRF, inactive currency, outage/error recovery and mobile/axe. Automated test:fx plus FX test:login group (4727/4728, own disposable DB). Full application remains incomplete.

## P5a directory checkpoint

Read-only employee directory/profile integrates GET employees,employees/filters,employees/:id with fresh HR/read checks; no salary payload or mutation. Current assignment excludes future dates,removed employees excluded,literal wildcard search and fixed sorting/paging. No migration/schema/config/external service added. test:employees plus fifth isolated test:login Chromium group (4827/4828,SMTP4325 sequential),artifacts employees. Local19 directory DB /3 directory Chromium and34 scoped browser checks passed; exact-head CI/review pending; see QA_EXECUTION_REPORT.md. [Employee contract](../acme-salary-app/docs/EMPLOYEE_DIRECTORY_MODULE.md). ADR-005 linkage and initial salary approval are approved future integration requirements; do not treat this directory as employee creation/approval completion.

New CI command: `npm.cmd run test:employees`; execute `npm.cmd run test:login` for all five authenticated groups.

Browser runtime update: Playwright now serves built web assets through scripts/qa-web-server.mjs (loopback Node HTTP,strict port,existing QA_API_PORT proxy); npm run dev remains development only. Build before qa:e2e; test:login builds itself. Repeated native dev/preview exits3221226505 are retained failures,root cause unproven. See [browser test runtime](../acme-salary-app/docs/BROWSER_TEST_RUNTIME.md); no deployment or retry/assertion change.

CI also runs `npm.cmd run test:qa-web` to verify real built-static path/MIME/HEAD protections and API proxy method/query/Origin/body/cookies/health/error behavior. No new config or dependency.
