# ACME bug and missing-functionality register

Date: 21 November 2026. Environment: real Playwright Chromium, local React/NestJS, synthetic PostgreSQL fixtures only. These are release-assessment priorities; missing features were previously documented as unfinished, not regressions falsely claimed to be complete.

22 November team increment: invitation/permission/offboarding implementation now has actual database and multi-account Chromium evidence. The legacy anonymous Team navigation probe conflicted with HR-only visibility and was replaced by an anonymous-denial check plus authenticated UI coverage. Intermediate ordering, stale-fixture and server-loss failures are recorded in QA_EXECUTION_REPORT.md; final acceptance waits for its final successful retest and current-head PR CI. Domain/employee/report gaps below remain open.

Login increment update: QA-001's absent-login implementation is resolved for the delivered login scope: 5 SMTP/Chromium cases passed, including logout, origin/DTO checks, resend/attempt limits, failed delivery and IP throttling. REQ-LOGIN/REQ-OTP now pass. Team/permission UI and domain workflows below remain open. Initial duplicate-server and shared-port test-harness failures were fixed and the isolated suite rerun successfully. This update does not certify production SMTP/TLS deployment or full application security.

| ID | Severity | Finding | Status | Evidence / reproduction | Required fix / retest |
|---|---|---|---|---|---|
| QA-001 | Critical (original) | Login/OTP/session implementation was absent | RESOLVED for delivered login scope | Five actual SMTP/Chromium cases and REQ-LOGIN/REQ-OTP pass; see login increment report | Production SMTP/TLS deployment and full team/security acceptance remain release gates |
| QA-002 | High (original) | Team administration was unavailable | RESOLVED for delivered team scope | 22 PostgreSQL checks and actual multi-account team Chromium cases pass; see latest execution report | Cross-module permission matrix, employee linkage and production security acceptance remain future gates |
| QA-003 | High | Employee management UI/API unavailable | OPEN — incomplete implementation | REQ-EMP fails; GET `/api/v1/employees` returns 404. | Implement directory/create/edit/removal, confirmations, validation and browser tests. |
| QA-004 | High | Salary/history/approval/transfer user workflows unavailable | OPEN — incomplete integration | REQ-SAL/HISTORY/APPROVAL/TRANSFER fail. Internal approval services pass separate tests but no browser controls exist. | Integrate tested domain services behind real sessions, add forms/history/approval UI and dual-account E2E. Do not expose test-only unsecured endpoints. |
| QA-005 | High | Country, currency and FX administration unavailable | FIXED AND RETESTED for scoped reference workflows | PR #7 country/currency and P4c FX APIs/UI exist;27 country +23 FX DB and3+3 Chromium cases pass locally. Historical404 probes remain original evidence. | Final PR CI and independent review required; full-system qualification remains open. |
| QA-006 | High | Report generation/export and analytics dashboard unavailable | OPEN — incomplete implementation | REQ-REPORT/DASH fail; report route 404. | Implement filtered previews, exact snapshot CSV, historical FX and report reconciliation before certifying pending/rejected exclusion in reports. |
| QA-007 | High | HR audit log screen/API unavailable | OPEN — incomplete integration | REQ-AUDIT fails; audit route 404 despite immutable database audit storage. | Add guarded audit browsing and non-HR denial tests. |
| QA-008 | Critical | No executable authenticated API boundary for required business routes | OPEN — missing functionality | Browser probes of six specified routes return 404. REQ-API expects a real protected endpoint. | Implement sessions and permission guards with endpoints; test anonymous, authorized and unauthorized users. A 404 proves neither a working guard nor an authorization bypass. |
| QA-009 | Medium | Small numbered labels fail text contrast | FIXED AND RETESTED | Initial axe scan: #46788d on #f3f6f9, 4.46:1 versus required 4.5:1. UI-003 failed initially. | Changed labels to #356477. Final desktop/mobile axe test passes. No broad WCAG certification claimed. |
| QA-010 | Medium | Stalled health fetch leaves service status loading indefinitely | FIXED AND RETESTED | Intercept health without completing it; advance browser clock 10 seconds. Initial UI-007 remains Checking service. | Added 8-second abort and safe effect/timer cleanup. Same test passes after fix. |
| QA-011 | Low | Initial render contacts external Google font services | HARDENED AND RETESTED | UI-006 records fonts.googleapis.com and fonts.gstatic.com requests. No uncaught JS error was observed; the failure was the external-dependency assertion. | Removed external import, use system fonts. Final no-external-request/no-console-error test passes. No salary-data leakage was demonstrated. |
| QA-012 | High | Full seed, performance, browser role matrix and business validation coverage unavailable | BLOCKED | No 10k seed or usable login/business forms. TEST_CASES.md lists each dependent scenario as BLOCKED. | Complete modules/seed and execute the listed cases; do not substitute unit assertions for E2E. |

## Retest disposition

PR #1 review finding (approval-time currency validation): FIXED AND RETESTED. Added service shared-lock validation and forward-only SQL migration 006. Added 10 approval assertions covering inactive-currency rejection, unchanged pending/ledger/history/audit/version state, direct SQL bypass denial, a concurrent deactivation and permitted rejection after deactivation; reactivation still permits valid approval. The regression failed on old code and passed after the fix. Current foundation gate: 18 unit tests and 72 logical real PostgreSQL checks (11 identity + 23 rules + 38 approvals), plus Prisma/health. Historical browser audit results below remain the recorded whole-application result, not a claim of new functionality.

Initial Chromium: 9 passed / 16 failed. Final Chromium: 12 passed / 14 failed (one added OTP route check). Three bounded defects/hardening issues were fixed and their unchanged regressions passed. Fourteen missing-requirement checks remain failed and are neither skipped nor annotated as expected failures. Full results, traces and screenshots are in the execution report.

The API's intentional readiness 503 is recorded as an unfinished application readiness contract, not fixed by returning a fake success. Browser mutation/approval and form error tests remain blocked; there are no business buttons/forms to exercise yet. No existing data was erased to obtain passing results.

## Reference increment — 22 November 2026

Department/designation administration is implemented with new database/Chromium coverage; QA-005 remains OPEN for country/currency/FX. Initial combined Chromium run: 11 pass / 1 fail. The new reference-suite HR fixture invalidated the team suite's last-manager assumption. An attempted afterAll cleanup correctly hit last-manager protection (second run: 11 pass / 2 fail), so the final fix isolates reference and auth/team groups in separate disposable databases. Guards are unchanged. Final retest is recorded in QA_EXECUTION_REPORT.md. A local migration checksum mismatch was diagnosed by comparing file hashes and restoring the exact already-applied migration bytes; database migration ledger values were not altered. Full employee/salary/report/browser and production-readiness gaps remain open.

## Country/currency increment

QA-005 is partially addressed by catalogue/country API/UI; FX administration remains missing. New financial-reference SQL initially failed with ambiguous code variable; forward migration 017 disambiguates it while preserving applied checksums. Initial local verification was also blocked by missing pg dependencies and locked PostgreSQL binaries; recovered the pinned control binary, stopped only project-local PG cleanly and restored lockfile dependencies without resetting data. Results and retests are recorded separately.

CI harness issue CTRY-QA-STARTUP: current-head run 45006454596 exited before the country browser group executed; no country result JSON in retained artifact. Exact cause unproven. Distinct per-group ports and explicit child status diagnostics are under retest; no test retries/assertion relaxation added. PR #7 remains unapproved/unmerged.

Port-isolation local retest: qa:typecheck and all test:login groups PASS (9 auth/team, 4 reference, 3 country Chromium cases; zero retries/skips). All group processes returned status 0; ignored diagnostics qa-artifacts/country-port-isolation.log. No application logic changed by this harness fix. Current-head GitHub CI remains required; the failed b8667c5 run remains recorded, not relabeled.

## P4c verification findings

| ID | Severity | Finding | Action/status | Evidence |
|---|---|---|---|---|
| FX-QA-LOCATOR | Test harness | Visible text did not match correction button accessible name; worker restart duplicated dependent fixtures | Locator corrected; sequence explicitly serial; first two FX cases retested PASS | fx-browser.log then fx-browser-final.log |
| FX-QA-NATIVE | Environment | Vite exited3221226505 during login retest | Failed run retained; native cause unproven; sequential19-case authenticated retest PASS | fx-browser-retest.log |
| FX-QA-A11Y | High | Empty FX history scroll container inaccessible to keyboard on mobile | Added tabIndex0 and named region; unchanged axe retest PASS | FX-E2E-03 failed in fx-browser-final.log |

QA-005 country/currency/FX missing-functionality item is addressed and locally retested, including final FX browser verification. This does not close salary/report/audit/linkage gaps. No old failure has been counted as a pass.
