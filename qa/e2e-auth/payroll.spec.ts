import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { Pool } from 'pg';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { smtpCapture } from './smtp-capture';
test.describe.configure({ mode: 'serial' });
const pool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
let capture: Awaited<ReturnType<typeof smtpCapture>>;
let fixture: {
  ids: Record<string, string>;
  emails: Record<string, string>;
  employeeIds: Record<string, string>;
  drafts: Record<string, { id: string }>;
};
let runId = '';
const sessions = new Map<string, Awaited<ReturnType<BrowserContext['cookies']>>>();
test.beforeAll(async () => {
  if (
    !/^acme_test_[a-f0-9]{32}$/.test(process.env.ACME_AUTH_TEST_DATABASE ?? '') ||
    new URL(process.env.MIGRATION_DATABASE_URL!).pathname !==
      `/${process.env.ACME_AUTH_TEST_DATABASE}`
  )
    throw new Error('Isolated payroll browser database required');
  const helper = await import(
    pathToFileURL(path.resolve('../backend/scripts/payroll-workflow-fixtures.mjs')).href
  );
  const owner = await pool.connect();
  try {
    fixture = await helper.createPayrollWorkflowFixture(owner, {
      period: '2026-04',
      statutory: false,
    });
    await helper.seedApprovedPayrollPolicy(owner, fixture, { policyKey: 'BROWSER-PAYROLL' });
  } finally {
    owner.release();
  }
  capture = await smtpCapture(4325);
});
test.afterAll(async () => {
  await capture?.close();
  await pool.end();
});
async function login(page: Page, role = 'hr') {
  const saved = sessions.get(role);
  if (saved) {
    await page.context().addCookies(saved);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
    return;
  }
  const email = fixture.emails[role]!;
  await page.goto('/');
  await page.getByLabel('Work email').fill(email);
  const count = capture.messages.length;
  await page.getByRole('button', { name: 'Send sign-in code', exact: true }).click();
  await expect.poll(() => capture.messages.length).toBeGreaterThan(count);
  const mail = capture.messages
    .filter((message) => message.includes(`To: ${email}`) && /code is \d{6}/.test(message))
    .at(-1)!;
  await page.getByLabel('One-time code').fill(mail.match(/code is (\d{6})/)![1]!);
  await page.getByRole('button', { name: 'Verify code', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  sessions.set(role, await page.context().cookies());
}
async function inputs(page: Page) {
  await page
    .getByLabel('PF eligible?', { exact: true })
    .filter({ visible: true })
    .selectOption('false');
  await page
    .getByLabel('ESI eligible?', { exact: true })
    .filter({ visible: true })
    .selectOption('false');
  await page.getByLabel('State code', { exact: true }).filter({ visible: true }).fill('KA');
  await page
    .getByLabel('Manual professional tax (INR)', { exact: true })
    .filter({ visible: true })
    .fill('0');
  await page.getByLabel('TDS (INR)', { exact: true }).filter({ visible: true }).fill('0');
}
async function confirm(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Confirm payroll action', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirm action', exact: true }).click();
  await expect(dialog).not.toBeVisible();
}
async function openRun(page: Page) {
  await page.goto('/#/payroll-runs');
  await page.getByLabel('Payroll month', { exact: true }).fill('2026-04');
  await page.getByRole('button', { name: 'Open payroll run', exact: true }).click();
}

test('PAY-E2E-01 calculator uses approved policy and exact source values without saving payroll', async ({
  page,
}) => {
  await login(page);
  await page.goto('/#/payroll-calculations');
  await page.getByLabel('Payroll month', { exact: true }).fill('2026-04');
  await page
    .getByRole('row')
    .filter({ hasText: 'BROWSER-PAYROLL' })
    .getByRole('button', { name: 'Use policy', exact: true })
    .click();
  await page
    .getByRole('row')
    .filter({ hasText: 'PAY-FULL' })
    .getByRole('button', { name: 'Use draft', exact: true })
    .click();
  await inputs(page);
  await page.getByRole('button', { name: 'Calculate preview', exact: true }).click();
  const result = page.getByRole('region', { name: 'Calculated payroll preview', exact: true });
  await expect(result).toContainText('INR 40,000.00');
  await expect(result).toContainText('INR 39,900.00');
  await expect(
    result
      .getByRole('table', { name: 'Calculated earnings and deductions' })
      .getByRole('row')
      .filter({ hasText: 'Professional tax' }),
  ).toContainText('INR 0.00');
  expect((await pool.query('SELECT count(*)::int n FROM payroll_runs')).rows[0].n).toBe(0);
  await page.getByLabel('TDS (INR)', { exact: true }).filter({ visible: true }).fill('1');
  await expect(result).toHaveCount(0);
});

test('PAY-E2E-02 HR selects policy and employees, reviews calculated values and completes HR stage', async ({
  page,
}) => {
  await login(page);
  await page.goto('/#/payroll-runs');
  await page.getByLabel('Payroll month', { exact: true }).fill('2026-04');
  await page.getByRole('button', { name: 'Prepare a payroll run', exact: true }).click();
  await page
    .getByRole('row')
    .filter({ hasText: 'BROWSER-PAYROLL' })
    .getByRole('button', { name: 'Use this policy', exact: true })
    .click();
  await page.getByLabel('Include PAY-FULL', { exact: true }).check();
  await page.getByRole('button', { name: 'Continue to calculation inputs', exact: true }).click();
  await inputs(page);
  await page
    .getByRole('button', { name: 'Apply these inputs to all 1 selected employees', exact: true })
    .click();
  await page.getByRole('button', { name: 'Continue to reviewers', exact: true }).click();
  await page.getByLabel('HR reviewer', { exact: true }).selectOption(fixture.ids.hr!);
  await page.getByLabel('Finance approver', { exact: true }).selectOption(fixture.ids.finance!);
  await page.getByLabel('Director approver', { exact: true }).selectOption(fixture.ids.director!);
  await page
    .getByLabel('Reason for this run', { exact: true })
    .fill('Synthetic complete browser run');
  await page
    .getByRole('button', { name: 'Review selected employees and create draft run', exact: true })
    .click();
  await confirm(page);
  await expect(
    page.getByRole('table', { name: 'Immutable payroll employee snapshots' }),
  ).toContainText('INR 39,900.00');
  await expect(page.getByText('Calculated PF:', { exact: false })).toContainText('INR 0.00');
  await page
    .getByLabel('Reason for the next action', { exact: true })
    .fill('Synthetic HR reviewed exact components');
  await page.getByRole('button', { name: 'Complete HR review', exact: true }).click();
  await confirm(page);
  await expect(page.getByText('Current stage: HR REVIEWED', { exact: false })).toBeVisible();
  const saved = (await pool.query("SELECT id,status FROM payroll_runs WHERE status='HR_REVIEWED'"))
    .rows[0];
  expect(saved).toBeTruthy();
  runId = saved.id;
});

test('PAY-E2E-03 assigned Finance and Director approve, then HR finalizes immutable run', async ({
  browser,
  page,
  baseURL,
}) => {
  const contexts: BrowserContext[] = [];
  try {
    for (const [role, button, expected] of [
      ['finance', 'Approve as Finance', 'FINANCE_APPROVED'],
      ['director', 'Approve as Director', 'DIRECTOR_APPROVED'],
    ] as const) {
      const context = await browser.newContext({ baseURL });
      contexts.push(context);
      const actorPage = await context.newPage();
      await login(actorPage, role);
      await openRun(actorPage);
      await actorPage
        .getByLabel('Reason for the next action', { exact: true })
        .fill('Synthetic ' + role + ' independent review');
      await actorPage.getByRole('button', { name: button, exact: true }).click();
      await confirm(actorPage);
      await expect
        .poll(
          async () =>
            (await pool.query('SELECT status FROM payroll_runs WHERE id=$1', [runId])).rows[0]
              .status,
        )
        .toBe(expected);
      await context.close();
    }
    await login(page);
    await openRun(page);
    await page
      .getByLabel('Reason for the next action', { exact: true })
      .fill('Synthetic HR finalization');
    await page.getByRole('button', { name: 'Finalize payroll', exact: true }).click();
    await confirm(page);
    await expect(page.getByText('This payroll is locked.', { exact: false })).toBeVisible();
    await expect(page.getByLabel('Reason for the next action', { exact: true })).toHaveCount(0);
    expect(
      (
        await pool.query(
          'SELECT count(*)::int n FROM payroll_finalized_allocations WHERE run_id=$1',
          [runId],
        )
      ).rows[0].n,
    ).toBe(1);
  } finally {
    for (const context of contexts) await context.close();
  }
});

test('SAL-E2E-04 monthly revision and same-date correction preserve history and modal protection', async ({
  page,
}) => {
  await login(page);
  await page.goto('/#/employees');
  const directory = page.getByRole('region', { name: 'Employee directory', exact: true });
  await directory.getByLabel('Search employees', { exact: true }).fill('PAY-MONTHLY');
  await directory.getByRole('button', { name: 'Apply employee filters', exact: true }).click();
  await directory
    .getByRole('button', { name: 'View profile for employee PAY-MONTHLY', exact: true })
    .click();
  const modal = page.getByRole('dialog', { name: 'Synthetic monthly payroll', exact: true });
  const salaryResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname ===
        `/api/v1/employees/${fixture.employeeIds.monthly}/salary` &&
      response.request().method() === 'GET',
  );
  await modal.getByRole('tab', { name: 'Salary & history', exact: true }).click();
  const businessDate = (await (await salaryResponse).json()).businessDate;
  await modal.getByRole('button', { name: 'Add salary revision', exact: true }).click();
  await expect(
    modal.getByRole('button', { name: 'Close employee details', exact: true }),
  ).toBeDisabled();
  await expect(modal.getByRole('tab', { name: 'Overview', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(modal).toBeVisible();
  await modal.getByLabel('New monthly amount', { exact: true }).fill('34000');
  await modal.getByLabel('Salary currency', { exact: true }).selectOption('INR');
  await modal.getByLabel('Salary starts on', { exact: true }).fill(businessDate);
  await modal
    .getByLabel('Reason for this salary change', { exact: true })
    .fill('Synthetic monthly browser revision');
  await modal.getByRole('button', { name: 'Review salary change', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: 'Record this salary change?',
    exact: true,
  });
  await expect(confirmation).toContainText('INR 34,000.00');
  await confirmation.getByRole('button', { name: 'Record salary change', exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  await expect(modal.getByRole('table', { name: 'Salary history entries' })).toContainText(
    'INR 34,000.00',
  );
  await expect(
    modal.getByText('Recorded · management review pending', { exact: true }).first(),
  ).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
  await modal
    .getByRole('button', { name: 'Correct a typo in the current salary', exact: true })
    .click();
  await expect(modal.getByLabel('Original salary start date', { exact: true })).toHaveValue(
    businessDate,
  );
  await expect(modal.getByLabel('Original salary start date', { exact: true })).toHaveAttribute(
    'readonly',
    '',
  );
  await modal.getByLabel('New monthly amount', { exact: true }).fill('35000');
  await modal
    .getByLabel('Reason for this salary change', { exact: true })
    .fill('Synthetic same-date correction');
  await modal.getByRole('button', { name: 'Review salary change', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Record salary change', exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  const history = modal.getByRole('table', { name: 'Salary history entries' });
  await expect(history).toContainText('INR 35,000.00');
  await expect(history).toContainText('INR 34,000.00');
  const saved = (
    await pool.query(
      'SELECT monthly_amount::text amount,effective_from::text date,corrects_id FROM salary_records WHERE employee_id=$1 ORDER BY created_at,id',
      [fixture.employeeIds.monthly],
    )
  ).rows;
  expect(saved).toHaveLength(3);
  expect(saved.filter((row) => row.corrects_id)).toHaveLength(1);
  expect(saved.at(-1).date).toBe(businessDate);
});

test('PAY-E2E-05 manual CSV intake preserves all twelve raw components without calculation', async ({
  page,
}) => {
  await login(page);
  await page.goto('/#/payroll-drafts');
  await page.getByLabel('Payroll month', { exact: true }).fill('2026-04');
  await page.getByRole('button', { name: 'Show drafts', exact: true }).click();
  await page.getByRole('button', { name: 'Import monthly inputs', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Import manual payroll inputs', exact: true });
  const csv =
    'employeeCode,basic,hra,allowances,bonuses,incentives,overtime,pf,esi,professionalTax,tds,unpaidLeave,authorized,reason\r\nPAY-MONTHLY,100.01,20.02,3.03,4.04,5.05,6.06,7.07,8.08,9.09,10.10,11.11,12.12,Synthetic raw CSV input\r\n';
  await modal.getByLabel('Upload manual payroll CSV', { exact: true }).setInputFiles({
    name: 'synthetic-payroll.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
  await modal.getByRole('button', { name: 'Match employee codes', exact: true }).click();
  await expect(modal.getByRole('table', { name: 'Manual payroll import' })).toContainText('Ready');
  await modal.getByRole('button', { name: 'Review & save 1 drafts', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: 'Create reviewed monthly drafts?',
    exact: true,
  });
  await expect(confirmation).toContainText('PAY-MONTHLY');
  await confirmation.getByRole('button', { name: 'Create 1 drafts', exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  await expect(modal.getByRole('table', { name: 'Manual payroll import' })).toContainText('Saved');
  const saved = (
    await pool.query(
      "SELECT r.earnings,r.deductions FROM payroll_drafts d JOIN payroll_draft_revisions r ON r.draft_id=d.id AND r.version=d.version WHERE d.employee_id=$1 AND d.period_month='2026-04-01'",
      [fixture.employeeIds.monthly],
    )
  ).rows[0];
  expect(saved.earnings).toEqual({
    basic: '100.01',
    hra: '20.02',
    allowances: '3.03',
    bonuses: '4.04',
    incentives: '5.05',
    overtime: '6.06',
  });
  expect(saved.deductions).toEqual({
    pf: '7.07',
    esi: '8.08',
    professionalTax: '9.09',
    tds: '10.10',
    unpaidLeave: '11.11',
    authorized: '12.12',
  });
});

test('SAL-E2E-06 bulk CSV excludes missing employee and saves exact eligible revision separately', async ({
  page,
}) => {
  await login(page);
  const response = await page.request.get(
    `/api/v1/employees/${fixture.employeeIds.partial}/salary`,
  );
  expect(response.ok()).toBe(true);
  const date = (await response.json()).businessDate;
  await page.goto('/#/salary-bulk');
  const csv = `employeeCode,amount,currency,effectiveFrom,reason\r\nMISSING-CODE,1,INR,${date},Missing synthetic employee\r\nPAY-PARTIAL,36000.50,INR,${date},Synthetic bulk browser revision\r\n`;
  await page.getByLabel('Upload salary CSV', { exact: true }).setInputFiles({
    name: 'synthetic-salaries.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
  await page.getByRole('button', { name: 'Prepare salary previews', exact: true }).click();
  const table = page.getByRole('table', { name: 'Salary revision batch', exact: true });
  await expect(table.getByRole('row').filter({ hasText: 'MISSING-CODE' })).toContainText(
    'Needs attention',
  );
  await expect(table.getByRole('row').filter({ hasText: 'PAY-PARTIAL' })).toContainText('Ready');
  await page.getByRole('button', { name: 'Review & submit 1 ready rows', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: 'Submit reviewed salary revisions?',
    exact: true,
  });
  await expect(confirmation).toContainText('INR 36,000.50');
  await confirmation.getByRole('button', { name: 'Submit 1 rows', exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  await expect(table.getByRole('row').filter({ hasText: 'PAY-PARTIAL' })).toContainText('Recorded');
  await expect(table.getByRole('row').filter({ hasText: 'MISSING-CODE' })).toContainText(
    'Needs attention',
  );
  const saved = (
    await pool.query(
      'SELECT monthly_amount::text amount,approval_status FROM salary_records WHERE employee_id=$1 ORDER BY created_at DESC LIMIT 1',
      [fixture.employeeIds.partial],
    )
  ).rows[0];
  expect(saved).toEqual({ amount: '36000.5000', approval_status: 'WAITING_MANAGEMENT_APPROVAL' });
});

async function delivery(page: Page) {
  await page.goto('/#/payroll-delivery');
  await page.getByLabel('Finalized payroll month', { exact: true }).fill('2026-04');
  await page.getByRole('button', { name: 'Show finalized runs', exact: true }).click();
  await page.getByRole('button', { name: 'Open finalized payroll', exact: true }).click();
  return page.getByRole('dialog', { name: 'Finalized payroll · 2026-04', exact: true });
}
async function downloadedText(download: import('@playwright/test').Download) {
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Expected downloaded document stream');
  let content = '';
  for await (const part of stream) content += part.toString('utf8');
  return content;
}

test('PAY-E2E-07 finalized payslip and preparation UI expose exact net and keep provider execution disabled', async ({
  page,
}) => {
  await login(page);
  const modal = await delivery(page);
  await modal.getByRole('button', { name: 'View finalized payslip', exact: true }).click();
  const payslip = page.getByRole('dialog', { name: 'Finalized payslip', exact: true });
  await expect(payslip).toContainText('INR 39,900.00');
  const downloaded = page.waitForEvent('download');
  await payslip.getByRole('button', { name: 'Download printable HTML', exact: true }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toMatch(/\.html$/);
  const html = await downloadedText(file);
  expect(html).toContain('39900.00');
  expect(html).toContain('PAY-FULL');
  await payslip.getByRole('button', { name: 'Close details', exact: true }).click();
  await modal.getByRole('tab', { name: 'Payment preparation & history', exact: true }).click();
  await expect(
    modal.getByRole('button', { name: 'Send through bank / payment provider', exact: true }),
  ).toBeDisabled();
  await expect(
    modal.getByRole('button', { name: 'Report external full-net payment', exact: true }),
  ).toHaveCount(0);
  await modal
    .getByLabel('Preparation reason', { exact: true })
    .fill('Synthetic browser payment preparation');
  await modal.getByRole('button', { name: 'Review full-run preparation', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: 'Prepare the full finalized payment manifest?',
    exact: true,
  });
  await confirmation.getByRole('button', { name: 'Save preparation only', exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  await modal.getByRole('button', { name: 'View exact amounts', exact: true }).click();
  await expect(
    modal.getByRole('table', { name: 'Provider-neutral payment manifest', exact: true }),
  ).toContainText('INR 39,900.00');
  const csvDownload = page.waitForEvent('download');
  await modal.getByRole('button', { name: 'Download preparation CSV', exact: true }).click();
  expect(await downloadedText(await csvDownload)).toContain('39900.00');
  expect(
    (
      await pool.query(
        'SELECT count(*)::int n FROM payroll_external_payment_reports WHERE run_id=$1',
        [runId],
      )
    ).rows[0].n,
  ).toBe(0);
});

test('PAY-E2E-08 designated Finance records external reference without a provider payment', async ({
  page,
}) => {
  await login(page, 'finance');
  const modal = await delivery(page);
  await modal.getByRole('tab', { name: 'Payment preparation & history', exact: true }).click();
  await modal
    .getByRole('button', { name: 'Report external full-net payment', exact: true })
    .click();
  await modal
    .getByLabel('External transaction / batch reference', { exact: true })
    .fill('SYNTHETIC-BROWSER-EXTERNAL-001');
  await modal.getByLabel('Externally reported payment date', { exact: true }).fill('2026-05-07');
  await modal
    .getByLabel('Reason / payment note', { exact: true })
    .fill('Synthetic full-net external attestation');
  await modal.getByRole('button', { name: 'Review external payment report', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: 'Record an external full-net payment report?',
    exact: true,
  });
  await expect(confirmation).toContainText('SYNTHETIC-BROWSER-EXTERNAL-001');
  await confirmation
    .getByRole('button', { name: 'Record external report only', exact: true })
    .click();
  await expect(confirmation).not.toBeVisible();
  await expect(modal.getByText('Externally reported paid', { exact: true })).toBeVisible();
  await expect(
    modal.getByRole('button', { name: 'Report external full-net payment', exact: true }),
  ).toHaveCount(0);
  const saved = (
    await pool.query(
      'SELECT external_reference,reported_by FROM payroll_external_payment_reports WHERE run_id=$1',
      [runId],
    )
  ).rows;
  expect(saved).toEqual([
    { external_reference: 'SYNTHETIC-BROWSER-EXTERNAL-001', reported_by: fixture.ids.finance },
  ]);
});

test('PAY-E2E-09 policy editor saves explicit inactive rules and a different HR independently activates them', async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page);
  await page.goto('/#/payroll-policies');
  await page.getByRole('tab', { name: 'Create policy', exact: true }).click();
  await page.getByLabel('Policy code', { exact: true }).fill('BROWSER-UI-POLICY');
  await page.getByLabel('Policy name', { exact: true }).fill('Synthetic UI payroll policy');
  await page.getByLabel('First payroll month — first day only', { exact: true }).fill('2026-04-01');
  for (const [label, value] of [
    ['Rounding for calculated INR amounts', 'HALF_UP'],
    ['Monthly basic amount comes from', 'LEDGER'],
    ['Full-month ledger rate date', 'PERIOD_END'],
    ['Unpaid leave treatment', 'PRORATE_EARNINGS'],
    ['Professional tax mode', 'DISABLED'],
    ['TDS mode', 'DISABLED'],
    ['Is Director approval required?', 'false'],
    ['Who may finalize an approved run?', 'HR'],
  ] as const)
    await page.getByLabel(label, { exact: true }).selectOption(value);
  for (const label of ['BASIC', 'HRA', 'ALLOWANCES', 'BONUSES', 'INCENTIVES', 'OVERTIME'])
    await page.getByLabel(label, { exact: true }).selectOption('CALENDAR_DAYS');
  for (const kind of ['PF', 'ESI']) {
    const group = page.getByRole('group', { name: new RegExp('^' + kind + ' —') });
    await group.getByLabel('Apply this contribution?', { exact: true }).selectOption('false');
    await group.getByLabel('Employee percentage', { exact: true }).fill('0');
    await group.getByLabel('Employer percentage', { exact: true }).fill('0');
    for (const [label, value] of [
      ['Contribution base', 'BASIC'],
      ['Wage cap', 'NONE'],
      ['Cap proration', 'FULL_CAP'],
      ['Eligibility ceiling', 'NONE'],
      ['Compare eligibility against', 'FULL_MONTH_BASE'],
    ] as const)
      await group.getByLabel(label, { exact: true }).selectOption(value);
  }
  await page
    .getByLabel('Find approvers by name, email or employee code', { exact: true })
    .fill('finance.payroll@acme.test');
  await page.getByRole('button', { name: 'Find approvers', exact: true }).click();
  await expect(page.getByLabel('Finance approver', { exact: true })).toHaveCount(1);
  await page.getByLabel('Finance approver', { exact: true }).check();
  await page
    .getByLabel('Reason for this policy version', { exact: true })
    .fill('Synthetic policy editor browser smoke');
  await page
    .getByLabel(
      'I explicitly confirm employer contributions are not deducted from net pay, and manual PF/ESI/PT/TDS fields will be replaced by approved rules and supplied inputs.',
      { exact: true },
    )
    .check();
  await page.getByRole('button', { name: 'Review inactive policy', exact: true }).click();
  const creation = page.getByRole('dialog', {
    name: 'Save this inactive policy version?',
    exact: true,
  });
  await expect(creation).toContainText('Synthetic finance payroll');
  await creation.getByRole('button', { name: 'Save inactive policy', exact: true }).click();
  await expect(creation).not.toBeVisible();
  await page.getByRole('tab', { name: 'Policy history', exact: true }).click();
  const creatorCard = page
    .locator('section.profile-section')
    .filter({ hasText: 'BROWSER-UI-POLICY' });
  await expect(creatorCard).toContainText('Inactive');
  await expect(
    creatorCard.getByRole('button', { name: 'Approve policy version', exact: true }),
  ).toHaveCount(0);
  const context = await browser.newContext({ baseURL });
  try {
    const reviewer = await context.newPage();
    await login(reviewer, 'reviewer');
    await reviewer.goto('/#/payroll-policies');
    const card = reviewer
      .locator('section.profile-section')
      .filter({ hasText: 'BROWSER-UI-POLICY' });
    await card.getByRole('button', { name: 'Approve policy version', exact: true }).click();
    const approval = reviewer.getByRole('dialog', {
      name: 'Approve this immutable policy version?',
      exact: true,
    });
    await expect(approval).toContainText('Synthetic finance payroll');
    await approval
      .getByLabel('Approval comment', { exact: true })
      .fill('Independent synthetic policy review');
    await approval.getByRole('button', { name: 'Approve policy', exact: true }).click();
    await expect(approval).not.toBeVisible();
    await expect(card).toContainText('Approved');
    const saved = (
      await pool.query(
        "SELECT p.created_by,a.approved_by FROM payroll_policies p JOIN payroll_policy_approvals a ON a.policy_id=p.id WHERE p.policy_key='BROWSER-UI-POLICY'",
      )
    ).rows[0];
    expect(saved).toEqual({ created_by: fixture.ids.hr, approved_by: fixture.ids.reviewer });
  } finally {
    await context.close();
  }
});
