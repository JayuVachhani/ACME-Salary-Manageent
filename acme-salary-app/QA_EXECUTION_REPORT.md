# ACME QA execution report

Executed 21 November 2026, Asia/Calcutta. **Release decision: NOT READY. Login now has dedicated SMTP/Chromium evidence; complete business E2E acceptance remains blocked by team and domain APIs/screens. Historical execution rows below are preserved and do not represent a new full-system pass.**

## Actual execution

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
