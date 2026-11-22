import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
mkdirSync('qa-artifacts/historical-report', { recursive: true });
const json = (file) => JSON.parse(readFileSync(file, 'utf8'));
const clean = (value) =>
  String(value ?? '')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replaceAll('|', '/')
    .replaceAll('\r', '')
    .replaceAll('\n', ' ')
    .slice(0, 500);
const flatten = (report) => {
  const rows = [];
  const walk = (suite) => {
    for (const spec of suite.specs || [])
      for (const test of spec.tests || []) {
        const result = test.results.at(-1);
        rows.push({
          id: spec.title.split(' ')[0],
          title: spec.title,
          status:
            result?.status === 'passed'
              ? 'PASS'
              : result?.status === 'skipped'
                ? 'SKIPPED'
                : 'FAIL',
          actual:
            result?.status === 'passed'
              ? 'Executed assertions satisfied'
              : clean(result?.error?.message || result?.errors?.[0]?.message || result?.status),
          duration: result?.duration,
          attachments: result?.attachments || [],
        });
      }
    for (const child of suite.suites || []) walk(child);
  };
  for (const suite of report.suites) walk(suite);
  return rows;
};
const initial = flatten(json('qa-artifacts/initial/results.json'));
const final = flatten(json('qa-artifacts/final/results.json'));
const units = json('qa-artifacts/regression/unit.json').testResults.flatMap((file) =>
  file.assertionResults.map((r, index) => ({
    id: `UNIT-${file.name.split(/[\\/]/).at(-1)}-${index + 1}`,
    title: r.fullName,
    status: r.status === 'passed' ? 'PASS' : 'FAIL',
    actual: r.failureMessages?.join(' ') || 'Executed unit assertion satisfied',
  })),
);
const database = readFileSync('qa-artifacts/regression/assertions.jsonl', 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map(JSON.parse);
const suiteResults = json('qa-artifacts/regression/summary.json');
const blocked = [
  [
    'AUTH',
    'Registered synthetic email requests OTP; SMTP capture receives it',
    'A single-use 15-minute code is delivered without enumeration',
  ],
  ['AUTH', 'Invalid email and unknown address', 'Validation/generic responses prevent enumeration'],
  [
    'AUTH',
    'Expired, incorrect, third-failure and replayed OTP',
    'No authenticated session; appropriate generic error and audit',
  ],
  ['AUTH', 'Resend OTP and verify previous code', 'Old code rejected; new code works once'],
  [
    'AUTH',
    'Request/verify throttling across email/IP combinations',
    'Limits enforced without bypass across requests',
  ],
  [
    'AUTH',
    'Logout, idle/absolute expiry and offboarding',
    'Cookies/sessions revoked; subsequent protected actions denied',
  ],
  ['AUTH', 'CSRF request without valid token', 'Mutating authenticated operation rejected'],
  [
    'TEAM',
    'HR invite and first login with a second synthetic user',
    'Permissions and 7-day invitation rules apply',
  ],
  [
    'TEAM',
    'Non-HR invite/permission change and self-escalation',
    'Denied by server, no unauthorized changes',
  ],
  ['TEAM', 'Demote/delete final manager concurrently', 'At least one active manager remains'],
  [
    'TEAM',
    'Soft-delete and re-invite same email',
    'Historical attribution retained; fresh user ID',
  ],
  [
    'PERMISSION',
    'Separate reader/editor/exporter browser accounts',
    'Each account sees and acts only within assigned rights',
  ],
  [
    'EMPLOYEE',
    'Create employee and initial salary; confirm/cancel',
    'Atomic employee/salary/audit commit only on confirmation',
  ],
  ['EMPLOYEE', 'Duplicate normalized employee code/email', 'Validation error; no duplicate record'],
  [
    'EMPLOYEE',
    'Edit mandatory fields and joining date',
    'Validation preserves existing historic data',
  ],
  [
    'EMPLOYEE',
    'Search literal %, _, backslash, name and email',
    'Literal escaped search returns correct data',
  ],
  [
    'EMPLOYEE',
    'Combined country/department/status/band filters',
    'Correct dataset, sorting and bounded server pagination',
  ],
  [
    'EMPLOYEE',
    'Empty search and API error states',
    'Clear empty/error feedback; no broken controls',
  ],
  [
    'LOCK',
    'Two browser accounts edit one employee',
    'One lease holder; second blocked with holder details',
  ],
  [
    'LOCK',
    'Separate tabs, heartbeat, cancel and timeout',
    'Lease-token ownership enforced; release/expiry correct',
  ],
  ['LOCK', 'Save after lost lease or stale version', 'Write rejected; unsaved form retained'],
  [
    'SALARY',
    'Ordinary and future salary revision with confirmation',
    'Immutable ledger; future row not current prematurely',
  ],
  [
    'SALARY',
    'Negative/zero, malformed and excess-precision amount',
    'Rejected by UI/API; no silent rounding',
  ],
  ['SALARY', 'Reason omitted and date before joining', 'Rejected with actionable validation'],
  [
    'SALARY',
    'Salary history timeline and table',
    'Actors/dates/reasons/before-after/currency states match ledger',
  ],
  [
    'SALARY',
    'Typo correction and cross-country historic rows',
    'Original retained; correct terminal row and currency snapshots',
  ],
  ['SALARY', 'User modifies own compensation', 'Denied regardless of HR flag'],
  [
    'APPROVAL',
    'Requester submits backdated change in browser',
    'Pending request, no active pay change',
  ],
  [
    'APPROVAL',
    'Different HR approves with comments',
    'Original effective date applied; history/audit retained',
  ],
  [
    'APPROVAL',
    'Requester or salary subject approves own request',
    'Denied; original salary unchanged',
  ],
  [
    'APPROVAL',
    'Reject request and inspect salary and reports',
    'Rejected request retained; active salary/report unaffected',
  ],
  [
    'APPROVAL',
    'Pending request and report preview/export',
    'Proposed pay excluded across browser report/export',
  ],
  [
    'APPROVAL',
    'Duplicate submissions/stale context/repeated decision',
    'No duplicate pending request or silent overwrite',
  ],
  [
    'TRANSFER',
    'Transfer with changed country/currency at future/past date',
    'Dated assignments, salary and history remain consistent',
  ],
  ['TRANSFER', 'Transfer collides with existing salary effective date', 'Rejected atomically'],
  [
    'COUNTRY',
    'HR edits precision/rounding/versioned policy',
    'Confirmation/audit and snapshots retain prior policy',
  ],
  [
    'FX',
    'HR creates/corrects FX; non-HR attempts same action',
    'Immutable rate/date/source/actor; unauthorized write denied',
  ],
  [
    'FX',
    'Missing/stale rates, inverse and USD path',
    'Correct historical rate or clear blocking error; no override',
  ],
  [
    'REPORT',
    'Apply filters, target currency and as-of date',
    'Preview totals reconcile using historical FX',
  ],
  [
    'REPORT',
    'Export snapshot and compare exact preview rows',
    'Same rows/values and safe CSV formula escaping',
  ],
  [
    'REPORT',
    'Snapshot expiry/access change/removal',
    'Expired/invalidated access denied and current permissions rechecked',
  ],
  ['AUDIT', 'HR audit filtering and non-HR direct access', 'Complete audit visible only to HR'],
  [
    'RETENTION',
    'Hold employee then attempt UI/API removal',
    'Protected employee/history cannot be removed',
  ],
  [
    'UX',
    'Business forms loading/empty/error/success and confirmations',
    'Consistent accessible states and functional actions',
  ],
  [
    'SCALE',
    '10k synthetic employees and 15k load profile',
    'NFR search/report p95 targets measured and met',
  ],
].map(([module, scenario, expected], index) => ({
  id: `BLOCK-${String(index + 1).padStart(3, '0')}`,
  module,
  scenario,
  expected,
  status: 'BLOCKED',
  actual:
    'Not executed end to end: authentication and/or required domain screen/API is not implemented. Internal regression coverage, where present, is reported separately.',
}));
const expected = {
  'UI-001':
    'Foundation renders, shows implementation state and real live API status without employee data',
  'UI-002': 'Keyboard skip link is focusable and moves to main content',
  'UI-003': 'Automated desktop/mobile WCAG scan has no violations',
  'UI-004': 'Delayed health response shows loading then online (controlled fault injection)',
  'UI-005': 'HTTP 503 shows unavailable (controlled fault injection)',
  'UI-006': 'No uncaught browser/console errors; no third-party font/network dependency',
  'UI-007': 'A stalled health fetch leaves loading within 10 seconds (controlled clock/network)',
  'API-001': 'Browser sees liveness 200, headers, and intentional readiness 503',
  'REQ-LOGIN': 'A usable, labeled email login form exists',
  'REQ-OTP': 'Synthetic OTP request returns enumeration-safe 202',
  'REQ-API': 'Defined protected API routes exist and reject anonymous access with 401/403',
};
const issue = (id) =>
  id === 'UI-003'
    ? 'QA-009'
    : id === 'UI-007'
      ? 'QA-010'
      : id === 'UI-006'
        ? 'QA-011'
        : id === 'REQ-LOGIN' || id === 'REQ-OTP'
          ? 'QA-001'
          : id === 'REQ-TEAM'
            ? 'QA-002'
            : id === 'REQ-EMP'
              ? 'QA-003'
              : ['REQ-SAL', 'REQ-HISTORY', 'REQ-APPROVAL', 'REQ-TRANSFER'].includes(id)
                ? 'QA-004'
                : ['REQ-COUNTRY', 'REQ-FX'].includes(id)
                  ? 'QA-005'
                  : ['REQ-REPORT', 'REQ-DASH'].includes(id)
                    ? 'QA-006'
                    : id === 'REQ-AUDIT'
                      ? 'QA-007'
                      : id === 'REQ-API'
                        ? 'QA-008'
                        : '';
const table = (rows, header, render) =>
  [header, header.replace(/[^|]/g, '-'), ...rows.map(render)].join('\n');
const browserTable = (rows) =>
  table(
    rows,
    '| ID | Module/scenario | Expected | Actual | Status | Issue |',
    (r) =>
      `| ${r.id} | ${clean(r.title)} | ${expected[r.id] || (r.id.startsWith('UI-') ? 'No horizontal overflow; heading visible; screenshot captured' : 'Module workflow control reachable from app')} | ${clean(r.actual)} | ${r.status} | ${r.status === 'FAIL' ? issue(r.id) : ''} |`,
  );
writeFileSync(
  'qa-artifacts/historical-report/TEST_CASES.md',
  `# ACME test cases and execution ledger\n\nDate: 21 November 2026. This is the per-case ledger for actually executed checks and separately identified blocked scenarios. No blocked case is a pass. Full errors/traces are retained in artifact reports.\n\n## Chromium final run\n\n${browserTable(final)}\n\n## Chromium initial run (before fixes)\n\n${browserTable(initial)}\n\n## Unit cases actually rerun\n\n${table(units, '| ID | Scenario | Expected | Actual | Status | Issue |', (r) => `| ${clean(r.id)} | ${clean(r.title)} | Defined assertion succeeds | ${clean(r.actual)} | ${r.status} | ${r.status === 'FAIL' ? 'See JSON evidence' : ''} |`)}\n\n## Real database/service/API assertion ledger\n\nEach line is an executed assertion, not a browser workflow. Source location identifies exact expected values/SQL rejection in its test file. Some logical checks contain multiple assertions, so this count differs from suite-printed case totals.\n\n${table(database, '| ID | Module/source scenario | Expected | Actual | Status | Issue |', (r) => `| ${r.id} | ${clean(r.module + ': ' + r.scenario)} | ${r.expected} (${r.assertion}) | ${clean(r.actual)} | ${r.status} | ${r.issue || ''} |`)}\n\n## Important dependent scenarios blocked from E2E execution\n\nThese are not skipped Playwright passes. The corresponding entry-point requirement tests above were executed and failed.\n\n${table(blocked, '| ID | Module/scenario | Expected | Actual | Status | Issue |', (r) => `| ${r.id} | ${r.module}: ${r.scenario} | ${r.expected} | ${r.actual} | BLOCKED | Missing module/authentication; QA-001–008 |`)}\n`,
);
const counts = (rows) => ({
  total: rows.length,
  pass: rows.filter((r) => r.status === 'PASS').length,
  fail: rows.filter((r) => r.status === 'FAIL').length,
  skipped: rows.filter((r) => r.status === 'SKIPPED').length,
});
const initialCounts = counts(initial),
  finalCounts = counts(final);
writeFileSync(
  'qa-artifacts/historical-report/QA_EXECUTION_REPORT.md',
  `# ACME QA execution report\n\nExecuted 21 November 2026, Asia/Calcutta. **Release decision: NOT READY. Complete business E2E acceptance is blocked by unimplemented authentication and domain APIs/screens.**\n\n## Actual execution\n\n| Layer | Result |\n|---|---|\n| Initial Chromium | ${initialCounts.pass} passed / ${initialCounts.fail} failed / ${initialCounts.skipped} skipped (${initialCounts.total} tests) |\n| Final Chromium | ${finalCounts.pass} passed / ${finalCounts.fail} failed / ${finalCounts.skipped} skipped (${finalCounts.total} tests) |\n| Unit suite | ${units.filter((r) => r.status === 'PASS').length}/${units.length} passed, actually rerun |\n| Existing real regression suites | ${suiteResults.filter((r) => r.exitCode === 0).length}/${suiteResults.length} suite commands passed |\n| Observed lower-level assertions | ${database.filter((r) => r.status === 'PASS').length}/${database.length} passed; per-assertion details in TEST_CASES.md |\n| Dependent business E2E scenarios | ${blocked.length} BLOCKED, not executed and not counted as passed |\n\nChromium was downloaded project-locally and launched by Playwright. Tests run the actual React app on 127.0.0.1:4317 and real NestJS API on 4318; unrelated running instances are not reused. Screenshots at 320, 375, 768 and 1440px were captured. Desktop and mobile screenshots were visually inspected. Automated scans are not full accessibility certification.\n\n## Findings and retests\n\n- Initial scan found contrast 4.46:1 for the numbered labels (required 4.5:1). Darkened text; final UI-003 result: ${final.find((r) => r.id === 'UI-003')?.status}.\n- Stalled health fetch never left loading. Added an 8-second timeout and safe effect cleanup; final UI-007: ${final.find((r) => r.id === 'UI-007')?.status}.\n- Page made Google Fonts/Google font-file requests. Removed remote font import and used the system stack; final UI-006: ${final.find((r) => r.id === 'UI-006')?.status}. This is reliability/privacy hardening, not evidence of salary-data leakage.\n- Required login and module controls remain absent. Browser protected-route probes return 404, not a functioning session/permission boundary. OTP probe is a new final-run check and returns 404. A 404 does not demonstrate an authorization bypass or a working RBAC guard.\n- Readiness remains 503 by intentional implementation; liveness is not business readiness. No raw employee data is shown.\n\n## Approval and data integrity evidence\n\nThe isolated real PostgreSQL approval suite was rerun with distinct synthetic requester/approver/reader identities. Pending/rejected salary requests leave salary-in-force unchanged, independent approval applies history, self/subject/nonmanager approval is denied, parallel duplicate submissions are rejected, and audit failure rolls back the decision/ledger/history/version. **This is service/database evidence, not multi-account browser E2E.** Report generation/export does not exist, so pending/rejected exclusion from browser reports cannot be certified. Snapshot guard checks do not substitute for the missing report workflow.\n\nNo existing employee data was reset or truncated. Transactional synthetic fixtures rolled back; the approval suite created and removed only its uniquely named disposable database. No real SMTP recipient was used.\n\n## Coverage limitations\n\nNo usable login/OTP/invite/employee/salary/approval/transfer/report/audit UI exists. Business button functionality, form validation/confirmation dialogs, logged-in permission matrices, CSV safety and complete report reconciliation remain blocked. No 10k seed/load result, full security scan, real SMTP delivery, cross-browser result or production acceptance is claimed.\n\n## Evidence and reproduction\n\n- [Initial Chromium HTML](qa-artifacts/initial/html/index.html), [initial JSON](qa-artifacts/initial/results.json).\n- [Final Chromium HTML](qa-artifacts/final/html/index.html), [final JSON](qa-artifacts/final/results.json).\n- [Unit JSON](qa-artifacts/regression/unit.json), [regression suite summary](qa-artifacts/regression/summary.json), [assertion evidence](qa-artifacts/regression/assertions.jsonl).\n- Screenshots/traces live under each run's test-results folder. Retained first-run harness logs are under qa-artifacts/harness-initial.\n\nCommands: npm run build; npm run qa:e2e; npm run qa:regression; npm test -- --reporter=json --outputFile=qa-artifacts/regression/unit.json; npm run qa:typecheck; npm run qa:report. Set QA_RUN=initial or final to keep separate browser runs. qa:e2e intentionally exits nonzero while required features are absent; no expected-failure masking or skip annotations are used.\n\nThe first regression-harness attempt failed before tests because Windows ESM preload requires a file URL; fixed and rerun successfully. A sandbox Vite realpath restriction required host-permitted unit/build execution. These harness/environment errors are not misreported as passing product tests.\n`,
);
console.log(
  JSON.stringify({
    initial: initialCounts,
    final: finalCounts,
    unit: counts(units),
    lowerLevel: database.length,
    blocked: blocked.length,
  }),
);
