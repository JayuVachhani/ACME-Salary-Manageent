# ACME QA execution report

Executed 21 November 2026, Asia/Calcutta. **Release decision: NOT READY. Login now has dedicated SMTP/Chromium evidence; complete business E2E acceptance remains blocked by team and domain APIs/screens. Historical execution rows below are preserved and do not represent a new full-system pass.**

## Actual execution

Final sequential team retest: **9/9 auth/team Chromium cases PASS**, 0 skipped, against the final permission-form and CSRF implementation; actual server diagnostics recorded in `qa-artifacts/team-final.log`. This supersedes the intermediate browser failures described below. Team tests also passed their mobile overflow and HR-page axe checks. Remaining full-system requirement probes: **3 passed / 11 failed**, 0 skipped; no release acceptance granted.

Team increment (22 November 2026): PostgreSQL team checks passed 22/22, including HR/non-HR boundaries, valid-session permission refresh, both CSRF failures, duplicate/stale writes, manager invitation and continuity, removal/rejoin, direct SQL races, before/after audit snapshots and injected audit rollback. Existing authentication regressions passed. The expanded browser suite has recorded successful 9-case runs; final retest results are reported below. Existing requirement probes were rerun: 3 passed / 11 failed / 0 skipped. REQ-TEAM now correctly checks anonymous denial; actual authorized UI and non-HR denial are exercised in separate SMTP/browser contexts, rather than expecting private team navigation before login.

Intermediate failures were not counted as passes: SMTP capture was closed too early in one test ordering; an edit attempted the pre-login invitation version and correctly received a conflict; worker restarts initially hit duplicate fixtures; a later run lost its local web server. Ordering and restart-safe setup were corrected, stale-edit setup refreshes the account before editing, and final browser runs use sequential commands with diagnostic output under ignored `qa-artifacts/team-final.log`. Failed attempts and any not-run dependents are superseded only by actual successful reruns, never skipped or marked expected failures.

Login increment, separately executed: `verify:database` passed (22 unit tests, 72 existing logical PostgreSQL checks, lint/type/build, Prisma and health); authentication regression passed with OTP concurrency/expiry, email/IP ceilings, bootstrap, invitation activation and current-permission checks. `test:login` passed 5/5 real Chromium + loopback SMTP cases. Existing foundation browser suite passed 12/12 including four widths and axe scans. Existing requirements suite was rerun: 2 passed (REQ-LOGIN, REQ-OTP), 12 failed (remaining business entries and missing domain API boundaries), 0 skipped. These are separate command results, not full-system acceptance. Multi-account salary/report/approval browser workflows remain blocked by unfinished modules.

Harness findings: an initial configuration inherited duplicate Playwright web servers; corrected by replacing the inherited list. A subsequent concurrent invocation collided on shared ports; authentication now uses dedicated 4427/4428 ports and its own disposable database. Both initial attempts failed and are not counted as passes; the corrected isolated 5-case suite was rerun successfully. Signed-in screenshot reviewed at `qa-artifacts/login/signed-in.png`. Evidence is synthetic and ignored by Git.

| Layer | Result |
|---|---|
| Initial Chromium | 9 passed / 16 failed / 0 skipped (25 tests) |
| Final Chromium | 12 passed / 14 failed / 0 skipped (26 tests) |
| Unit suite | 18/18 passed, actually rerun |
| Existing real regression suites | 5/5 suite commands passed |
| Observed lower-level assertions | 76/76 passed; per-assertion details in TEST_CASES.md |
| Dependent business E2E scenarios | 45 BLOCKED, not executed and not counted as passed |

Chromium was downloaded project-locally and launched by Playwright. Tests run the actual React app on 127.0.0.1:4317 and real NestJS API on 4318; unrelated running instances are not reused. Screenshots at 320, 375, 768 and 1440px were captured. Desktop and mobile screenshots were visually inspected. Automated scans are not full accessibility certification.

## Findings and retests

- Initial scan found contrast 4.46:1 for the numbered labels (required 4.5:1). Darkened text; final UI-003 result: PASS.
- Stalled health fetch never left loading. Added an 8-second timeout and safe effect cleanup; final UI-007: PASS.
- Page made Google Fonts/Google font-file requests. Removed remote font import and used the system stack; final UI-006: PASS. This is reliability/privacy hardening, not evidence of salary-data leakage.
- Required login and module controls remain absent. Browser protected-route probes return 404, not a functioning session/permission boundary. OTP probe is a new final-run check and returns 404. A 404 does not demonstrate an authorization bypass or a working RBAC guard.
- Readiness remains 503 by intentional implementation; liveness is not business readiness. No raw employee data is shown.

## Approval and data integrity evidence

The isolated real PostgreSQL approval suite was rerun with distinct synthetic requester/approver/reader identities. Pending/rejected salary requests leave salary-in-force unchanged, independent approval applies history, self/subject/nonmanager approval is denied, parallel duplicate submissions are rejected, and audit failure rolls back the decision/ledger/history/version. **This is service/database evidence, not multi-account browser E2E.** Report generation/export does not exist, so pending/rejected exclusion from browser reports cannot be certified. Snapshot guard checks do not substitute for the missing report workflow.

No existing employee data was reset or truncated. Transactional synthetic fixtures rolled back; the approval suite created and removed only its uniquely named disposable database. No real SMTP recipient was used.

## Coverage limitations

No usable login/OTP/invite/employee/salary/approval/transfer/report/audit UI exists. Business button functionality, form validation/confirmation dialogs, logged-in permission matrices, CSV safety and complete report reconciliation remain blocked. No 10k seed/load result, full security scan, real SMTP delivery, cross-browser result or production acceptance is claimed.

## Evidence and reproduction

- [Initial Chromium HTML](qa-artifacts/initial/html/index.html), [initial JSON](qa-artifacts/initial/results.json).
- [Final Chromium HTML](qa-artifacts/final/html/index.html), [final JSON](qa-artifacts/final/results.json).
- [Unit JSON](qa-artifacts/regression/unit.json), [regression suite summary](qa-artifacts/regression/summary.json), [assertion evidence](qa-artifacts/regression/assertions.jsonl).
- Screenshots/traces live under each run's test-results folder. Retained first-run harness logs are under qa-artifacts/harness-initial.

Commands: npm run build; npm run qa:e2e; npm run qa:regression; npm test -- --reporter=json --outputFile=qa-artifacts/regression/unit.json; npm run qa:typecheck; npm run qa:report. Set QA_RUN=initial or final to keep separate browser runs. qa:e2e intentionally exits nonzero while required features are absent; no expected-failure masking or skip annotations are used.

The first regression-harness attempt failed before tests because Windows ESM preload requires a file URL; fixed and rerun successfully. A sandbox Vite realpath restriction required host-permitted unit/build execution. These harness/environment errors are not misreported as passing product tests.

## Organization references — 22 November 2026

Implemented ADR-003 department/designation scope. Executed: verify:database (22 units, 11+23+38 PostgreSQL checks, lint/types/build, Prisma/health), 23 new reference PostgreSQL checks, authentication regressions, 22 team PostgreSQL checks and browser typing. Initial restricted-sandbox Vite startup failed EPERM; rerun outside that process restriction passed the unit/build gate.

Intermediate browser runs were not accepted: first 11 passed / 1 failed because extra reference HR fixtures changed the team continuity scenario. An attempted fixture cleanup then correctly encountered last-manager protection (11 passed / 2 failed). Harness now runs auth/team and references sequentially against separate unique disposable databases, preserving the real constraint and retaining separate diagnostics. Initial reference UI cases passed but do not substitute for the final isolated retest. Final isolated retest PASS: 9/9 auth/team and 4/4 reference Chromium cases, 0 retries/skips. Actual output: ignored qa-artifacts/references-isolated-final.log, plus separate login/references result JSON. Mobile screenshot inspected; axe and page-error assertions passed.

A transient migration checksum mismatch was investigated using hash comparisons; restored the exact applied migration 013 bytes without modifying the database ledger. Forward migration 014 adds whitespace/length constraints. db:migrate and the expanded reference checks (23 in the final run) passed after correction. Full-system business E2E remains incomplete; historical 3 pass / 11 fail probes were not rerun by this increment and are not claimed as current full-system acceptance.

Final existing foundation Chromium retest: 12/12 PASS, no retries/skips. Combined scoped browser evidence is 12 foundation + 9 auth/team + 4 reference cases. This remains scoped feature verification, not full-system acceptance.

## P4b country/currency execution — 22 November 2026

Executed after restoring lockfile dependencies and restarting only the preserved project PostgreSQL: verify:database PASS (lint/types/build, 22 units, existing 11+23+38 PostgreSQL checks, Prisma and health). Existing authentication, 22 team and 23 reference DB regressions PASS. Browser typing PASS. Actual SMTP/Chromium test:login groups PASS: 9 auth/team, 4 organization-reference, 3 country/currency, 0 retries/skips. Foundation Chromium PASS 12/12. Country mobile screenshot inspected; axe/page-error assertions passed. Artifacts remain ignored under qa-artifacts/country-* and per-group folders.

The new isolated DB suite additionally matches all 178 catalogue records and provenance to pinned SIX JSON, verifies permission/CSRF boundaries, numeric activation vs N.A., immutable codes, no deletion/truncate, stale and concurrent edits, precision references, note-metadata preservation, active references, historical salary snapshot equality and audit rollback. Final DB count: 27/27 PASS including the crafted-default guard; lint/types/build and 22 units reran successfully after that guard.

Intermediate failures were not counted as passes: initial command used the repository instead of app working directory; pg dependency was missing; reinstall encountered active project PG binaries. Recovered the exact pinned control binary into ignored local tooling, cleanly stopped the project database, restored npm ci and restarted without resetting data. SQL reference guard initially failed with ambiguous code variable; forward migration 017 corrected it without checksum edits. A no-read member test initially inherited users.permissions default read; fixture explicitly clears it, then tests later permission refresh. Browser workflows passed without retry/skip masking. The final API guard against crafted non-catalogue country defaults passed its added PostgreSQL regression; the final three-case Chromium retest also passed (3/3, no retries/skips).

This is P4b acceptance only. FX maintenance, verified employee linkage, employee/salary/report public workflows, full 10k/15k/performance/security/UAT and production operations remain incomplete. Historical full-requirements failures were not suppressed or relabeled; that full suite was not rerun by this increment.

## Current-head CI startup failure and port isolation

GitHub run 45006454596 at b8667c5 FAILED in the browser step. MCP decoded logs show 12 foundation, 9 auth/team and 4 reference cases passed, but the third API started and the runner exited before country tests/report creation. MCP-downloaded artifact 14747997310 contains no country result JSON, so country cases were not executed in that CI attempt; earlier local/feature-head passes do not substitute. The logs do not establish an exact root cause.

Harness hardening under retest: distinct API/web ports per existing QA_RUN group (login4427/4428, references4527/4528, country4627/4628) avoid reliance on immediate teardown of the preceding group. Mutation tests derive Origin from their actual page. The runner now emits allowlisted group/stage/status/signal/error-code diagnostics. Database isolation, no server reuse, real application assertions, 60-second setup limit and zero retries remain unchanged. This addresses a plausible shared-port startup race and improves diagnosis without treating the root cause as proven. PR returned to draft pending retest and exact-head green CI.

Port-isolation local retest: qa:typecheck and all test:login groups PASS (9 auth/team, 4 reference, 3 country Chromium cases; zero retries/skips). All group processes returned status 0; ignored diagnostics qa-artifacts/country-port-isolation.log. No application logic changed by this harness fix. Current-head GitHub CI remains required; the failed b8667c5 run remains recorded, not relabeled.
