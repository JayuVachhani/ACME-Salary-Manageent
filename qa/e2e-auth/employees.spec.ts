import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { Pool } from 'pg';
import AxeBuilder from '@axe-core/playwright';
import { smtpCapture } from './smtp-capture';
test.describe.configure({ mode: 'serial' });
const pool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
let capture: Awaited<ReturnType<typeof smtpCapture>>;
test.beforeAll(async () => {
  if (
    !/^acme_test_[a-f0-9]{32}$/.test(process.env.ACME_AUTH_TEST_DATABASE ?? '') ||
    new URL(process.env.MIGRATION_DATABASE_URL!).pathname !==
      `/${process.env.ACME_AUTH_TEST_DATABASE}`
  )
    throw new Error('Isolated database required');
  capture = await smtpCapture(4325);
  await pool.query('TRUNCATE auth_rate_events');
  await pool.query(
    `INSERT INTO users(email,full_name,status,is_hr_manager,permissions) VALUES ('employee.hr@acme.test','Synthetic FX HR','ACTIVE',true,ARRAY[]::text[]),('employee.member@acme.test','Synthetic Read Member','ACTIVE',false,ARRAY['read']),('employee.hr.b@acme.test','Synthetic FX HR B','ACTIVE',true,ARRAY[]::text[])`,
  );
  await pool.query(
    "INSERT INTO currencies(code,minor_units) VALUES('USD',2),('EUR',2),('INR',2),('GBP',2)",
  );
  const actor = (await pool.query("SELECT id FROM users WHERE email='employee.hr@acme.test'"))
    .rows[0].id;
  await pool.query(
    "INSERT INTO country_rules(country_code,country_name,default_currency,decimal_places,rounding_mode,updated_by) VALUES('US','Synthetic US','USD',2,'HALF_UP',$1)",
    [actor],
  );
  const dep = (
      await pool.query("INSERT INTO departments(name) VALUES('Synthetic Engineering') RETURNING id")
    ).rows[0].id,
    des = (
      await pool.query("INSERT INTO designations(name) VALUES('Synthetic Engineer') RETURNING id")
    ).rows[0].id;
  for (let i = 1; i <= 28; i++) {
    const id = (
      await pool.query(
        "INSERT INTO employees(employee_code,email,first_name,last_name,joining_date,created_by) VALUES($1,$2,$3,'Sample','2026-01-01',$4) RETURNING id",
        [
          `SYN${String(i).padStart(3, '0')}`,
          `employee.${i}@acme.test`,
          i === 1 ? 'Literal%_\\Name' : `Person${i}`,
          actor,
        ],
      )
    ).rows[0].id;
    await pool.query(
      "INSERT INTO employee_assignments(employee_id,country_code,department_id,designation_id,employment_status,effective_from,reason,created_by) VALUES($1,'US',$2,$3,$4,'2026-01-01','Synthetic fixture',$5)",
      [id, dep, des, i % 2 ? 'ACTIVE' : 'INACTIVE', actor],
    );
  }
});
test.afterAll(async () => {
  await capture?.close();
  await pool.end();
});
async function login(page: Page, email = 'employee.hr@acme.test') {
  await page.goto('/');
  await page.getByLabel('Work email').fill(email);
  const n = capture.messages.length;
  await page.getByRole('button', { name: 'Send sign-in code' }).click();
  await expect.poll(() => capture.messages.length).toBeGreaterThan(n);
  const mail = capture.messages
    .filter((v) => v.includes(`To: ${email}`) && /code is \d{6}/.test(v))
    .at(-1)!;
  await page.getByLabel('One-time code').fill(mail.match(/code is (\d{6})/)![1]!);
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.goto('/#/employees');
}
const area = (page: Page) => page.getByRole('region', { name: 'Employee directory', exact: true });

test('EMP-E2E-01 reader searches literal characters, filters, pages, sorts and opens real profile', async ({
  page,
}) => {
  await login(page, 'employee.member@acme.test');
  const panel = area(page);
  await expect(panel.getByText('28 employees. Page 1.', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Next employee page' }).click();
  await expect(panel.getByText('28 employees. Page 2.', { exact: true })).toBeVisible();
  await expect(panel.getByRole('row')).toHaveCount(4);
  await panel
    .getByRole('button', { name: 'View profile for employee SYN028', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Person28 Sample');
  await expect(page.getByRole('dialog')).toContainText('Synthetic Engineer');
  await expect(page.getByRole('tab', { name: 'Salary & history' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close employee details', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const viewAgain = panel.getByRole('button', {
    name: 'View profile for employee SYN028',
    exact: true,
  });
  await expect(viewAgain).toBeFocused();
  await viewAgain.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(viewAgain).toBeFocused();
  for (const value of ['%', '_', '\\']) {
    await panel.getByLabel('Search employees').fill(value);
    await panel.getByRole('button', { name: 'Apply employee filters' }).click();
    await expect(panel.getByText('1 employee. Page 1.', { exact: true })).toBeVisible();
    await expect(
      panel.getByRole('button', { name: 'View profile for employee SYN001' }),
    ).toBeVisible();
  }
  await panel.getByRole('button', { name: 'Clear employee filters' }).click();
  await panel.getByLabel('Employment status', { exact: true }).selectOption('INACTIVE');
  await panel.getByLabel('Employee country', { exact: true }).selectOption('US');
  await panel
    .getByLabel('Employee department', { exact: true })
    .selectOption({ label: 'Synthetic Engineering' });
  await panel.getByLabel('Sort employees by').selectOption('code');
  await panel.getByLabel('Employee sort direction').selectOption('desc');
  await panel.getByRole('button', { name: 'Apply employee filters' }).click();
  await expect(panel.getByText('14 employees. Page 1.', { exact: true })).toBeVisible();
  await expect(panel.getByRole('row').nth(1)).toContainText('SYN028');
  await panel.getByRole('button', { name: 'Clear employee filters' }).click();
  await panel.getByLabel('Employees per page').selectOption('100');
  await panel.getByRole('button', { name: 'Apply employee filters' }).click();
  await expect(panel.getByRole('row')).toHaveCount(29);
  await expect(panel.getByRole('button', { name: 'Next employee page' })).toBeDisabled();
});
test('EMP-E2E-02 permissions, invalid filters, removed records and no salary payload', async ({
  page,
  request,
}) => {
  expect((await request.get('/api/v1/employees')).status()).toBe(401);
  expect((await request.get('/api/v1/employees/filters')).status()).toBe(401);
  await login(page, 'employee.member@acme.test');
  const response = await page.request.get('/api/v1/employees');
  expect(response.headers()['cache-control']).toBe('no-store');
  const data = await response.json();
  expect(data.items[0]).not.toHaveProperty('monthly_amount');
  expect(data.items[0]).not.toHaveProperty('salary');
  const id = data.items[0].id;
  for (const query of [
    'page=0',
    'pageSize=101',
    'sort=invalid',
    'country=USA',
    'department=bad',
    'unknown=x',
  ])
    expect((await page.request.get(`/api/v1/employees?${query}`)).status()).toBe(400);
  expect((await page.request.get('/api/v1/employees/not-an-id')).status()).toBe(400);
  await pool.query('UPDATE employees SET removed_at=clock_timestamp() WHERE id=$1', [id]);
  expect((await page.request.get(`/api/v1/employees/${id}`)).status()).toBe(404);
  await area(page).getByRole('button', { name: 'Refresh employees' }).click();
  await expect(area(page).getByText('27 employees. Page 1.', { exact: true })).toBeVisible();
  await pool.query(
    "UPDATE users SET permissions=ARRAY[]::text[] WHERE email='employee.member@acme.test'",
  );
  expect((await page.request.get('/api/v1/employees')).status()).toBe(403);
  expect((await page.request.get('/api/v1/employees/filters')).status()).toBe(403);
  expect((await page.request.get(`/api/v1/employees/${id}`)).status()).toBe(403);
  await area(page).getByRole('button', { name: 'Refresh employees' }).click();
  await expect(area(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.goto('/#/employees');
});
test('EMP-E2E-03 empty/error/loading recovery, profile failure, mobile accessibility and console', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await login(page);
  const panel = area(page);
  await expect(panel.getByText('27 employees. Page 1.', { exact: true })).toBeVisible();
  await panel.getByLabel('Search employees').fill('no synthetic match');
  await panel.getByRole('button', { name: 'Apply employee filters' }).click();
  await expect(panel.getByText('No employees match these filters.')).toBeVisible();
  await panel.getByRole('button', { name: 'Clear employee filters' }).click();
  await expect(panel.getByRole('table', { name: 'Employee results' })).toBeVisible();
  await page.route('**/api/v1/employees?*', async (route) => {
    await new Promise((r) => setTimeout(r, 500));
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"message":"Synthetic directory outage"}',
    });
  });
  await panel.getByRole('button', { name: 'Refresh employees' }).click();
  await expect(panel.getByRole('status')).toHaveText('Loading employees…');
  await expect(panel.getByRole('alert')).toHaveText('Service unavailable. Please try again.');
  await page.unroute('**/api/v1/employees?*');
  await panel.getByRole('button', { name: 'Refresh employees' }).click();
  await expect(panel.getByRole('table')).toBeVisible();
  // Closing a modal must cancel its pending profile request before opening another employee.
  const directory = (await (await page.request.get('/api/v1/employees')).json()) as {
    items: { id: string; employee_code: string }[];
  };
  const first = directory.items.find((item) => item.employee_code === 'SYN002')!;
  let releaseFirst: () => void = () => {};
  let finishFirst: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const finished = new Promise<void>((resolve) => {
    finishFirst = resolve;
  });
  let held = false,
    cancellations = 0;
  const firstPath = `/api/v1/employees/${first.id}`;
  const recordCancellation = (request: import('@playwright/test').Request) => {
    if (new URL(request.url()).pathname === firstPath) cancellations++;
  };
  page.on('requestfailed', recordCancellation);
  await page.route(`**${firstPath}`, async (route) => {
    const response = await route.fetch();
    held = true;
    await gate;
    try {
      if (!cancellations) await route.fulfill({ response });
    } finally {
      finishFirst();
    }
  });
  await panel
    .getByRole('button', { name: 'View profile for employee SYN002', exact: true })
    .click();
  await expect.poll(() => held).toBe(true);
  const beforeSelection = cancellations;
  await page.getByRole('button', { name: 'Close employee details', exact: true }).click();
  await panel
    .getByRole('button', { name: 'View profile for employee SYN003', exact: true })
    .click();
  const profile = page.getByRole('dialog');
  await expect(
    profile
      .getByRole('tabpanel', { name: 'Overview', exact: true })
      .getByText('SYN003', { exact: true }),
  ).toBeVisible();
  await expect.poll(() => cancellations).toBeGreaterThan(beforeSelection);
  releaseFirst();
  await finished;
  await expect(
    profile
      .getByRole('tabpanel', { name: 'Overview', exact: true })
      .getByText('SYN003', { exact: true }),
  ).toBeVisible();
  await expect(profile.getByText('SYN002', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close employee details', exact: true }).click();
  await page.unroute(`**${firstPath}`);
  page.off('requestfailed', recordCancellation);
  await page.route(/\/api\/v1\/employees\/[a-f0-9-]{36}$/, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: '{"message":"Employee unavailable"}',
    }),
  );
  await panel
    .getByRole('button', { name: 'View profile for employee SYN002', exact: true })
    .click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('Employee unavailable');
  await page.getByRole('button', { name: 'Close employee details', exact: true }).click();
  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).include('[aria-labelledby="employees-heading"]').analyze())
      .violations,
  ).toEqual([]);
  expect(errors).toEqual([]);
  await panel.screenshot({ path: 'qa-artifacts/employees/mobile.png' });
});

test('EMP-E2E-04 atomic employee creation, independent initial approval and salary modal tabs', async ({
  page,
  browser,
}) => {
  const fixture = await pool.connect();
  try {
    await fixture.query('BEGIN');
    const managers = (
      await fixture.query(
        "SELECT id,email FROM users WHERE email IN ('employee.hr@acme.test','employee.hr.b@acme.test')",
      )
    ).rows;
    const first = managers.find((user) => user.email === 'employee.hr@acme.test')!.id;
    const second = managers.find((user) => user.email === 'employee.hr.b@acme.test')!.id;
    for (const [actor, target, code] of [
      [second, first, 'SYN027'],
      [first, second, 'SYN028'],
    ]) {
      await fixture.query(
        "SELECT set_config('acme.link_actor',$1,true),set_config('acme.link_reason','Independent synthetic browser fixture linkage',true),set_config('acme.link_confirmed','true',true)",
        [actor],
      );
      await fixture.query(
        'UPDATE users SET employee_id=(SELECT id FROM employees WHERE employee_code=$2) WHERE id=$1',
        [target, code],
      );
    }
    await fixture.query('COMMIT');
  } catch (error) {
    await fixture.query('ROLLBACK');
    throw error;
  } finally {
    fixture.release();
  }
  await login(page);
  await page.goto('/#/add-employee');
  await page.getByLabel('Employee code', { exact: true }).fill('EMP-CREATE-001');
  await page.getByLabel('Work email', { exact: true }).fill('employee.created@acme.test');
  await page.getByLabel('First name', { exact: true }).fill('Synthetic');
  await page.getByLabel('Last name', { exact: true }).fill('Created');
  await page.getByLabel('Joining date', { exact: true }).fill('2026-01-01');
  await page.getByLabel('Country', { exact: true }).selectOption('US');
  await page
    .getByLabel('Department', { exact: true })
    .selectOption({ label: 'Synthetic Engineering' });
  await page.getByLabel('Job title', { exact: true }).selectOption({ label: 'Synthetic Engineer' });
  await page.getByLabel('Monthly amount', { exact: true }).fill('5000.00');
  await page.getByLabel('Salary starts on', { exact: true }).fill('2026-11-01');
  await page
    .getByLabel('Reason / approval note', { exact: true })
    .fill('Synthetic initial salary requiring independent approval');
  await page.getByRole('button', { name: 'Review employee & salary', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('USD 5000.00');
  await page
    .getByRole('button', { name: 'Add employee & submit for approval', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByText(
      'Employee added. The salary stays out of active compensation until a different HR manager approves it.',
    ),
  ).toBeVisible();
  const created = (
    await pool.query(
      "SELECT e.id,r.id request_id,r.monthly_amount::text FROM employees e JOIN salary_change_requests r ON r.employee_id=e.id WHERE e.employee_code='EMP-CREATE-001'",
    )
  ).rows[0]!;
  expect(
    (
      await pool.query('SELECT count(*)::int n FROM salary_records WHERE employee_id=$1', [
        created.id,
      ])
    ).rows[0].n,
  ).toBe(0);
  await page.goto('/#/salary-approvals');
  const creatorRow = page.getByRole('row').filter({ hasText: 'EMP-CREATE-001' });
  await expect(creatorRow).toContainText('Another eligible HR manager must review');
  await expect(creatorRow.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
  const reviewerContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
  try {
    const reviewer = await reviewerContext.newPage();
    await login(reviewer, 'employee.hr.b@acme.test');
    await reviewer.goto('/#/salary-approvals');
    await reviewer
      .getByRole('row')
      .filter({ hasText: 'EMP-CREATE-001' })
      .getByRole('button', { name: 'Approve', exact: true })
      .click();
    await reviewer
      .getByLabel('Decision comment (required)', { exact: true })
      .fill('Independent synthetic browser approval');
    await reviewer.getByRole('button', { name: 'Confirm approval', exact: true }).click();
    await expect(reviewer.getByRole('dialog')).toHaveCount(0);
    expect(
      (
        await pool.query('SELECT count(*)::int n FROM salary_records WHERE employee_id=$1', [
          created.id,
        ])
      ).rows[0].n,
    ).toBe(1);
  } finally {
    await reviewerContext.close();
  }
  await page.goto('/#/employees');
  await area(page).getByLabel('Search employees').fill('EMP-CREATE-001');
  await area(page).getByRole('button', { name: 'Apply employee filters', exact: true }).click();
  const salaryReads: string[] = [];
  const track = (request: import('@playwright/test').Request) => {
    if (new URL(request.url()).pathname === `/api/v1/employees/${created.id}/salary`)
      salaryReads.push(request.url());
  };
  page.on('request', track);
  await area(page)
    .getByRole('button', { name: 'View profile for employee EMP-CREATE-001', exact: true })
    .click();
  const modal = page.getByRole('dialog', { name: 'Synthetic Created', exact: true });
  await expect(modal.getByRole('tab', { name: 'Overview', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(salaryReads).toHaveLength(0);
  await modal.getByRole('tab', { name: 'Salary & history', exact: true }).click();
  await expect(modal.getByRole('table', { name: 'Approved salary history' })).toContainText(
    '5000.0000',
  );
  await expect(modal.getByText('No approved salary is active today.')).toHaveCount(0);
  expect(salaryReads.length).toBeGreaterThan(0);
  expect(
    (
      await new AxeBuilder({ page })
        .include('.detail-modal')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await modal.getByRole('tab', { name: 'Salary & history', exact: true }).press('Home');
  await expect(modal.getByRole('tab', { name: 'Overview', exact: true })).toBeFocused();
  await modal.getByRole('button', { name: 'Edit employee details', exact: true }).click();
  await expect(
    modal.getByRole('button', { name: 'Close employee details', exact: true }),
  ).toBeDisabled();
  await expect(modal.getByRole('tab', { name: 'Salary & history', exact: true })).toBeDisabled();
  await modal.getByRole('button', { name: 'Start protected editing', exact: true }).click();
  await modal.getByLabel('First name', { exact: true }).fill('Synthetic Updated');
  await modal
    .getByLabel('Reason for this change', { exact: true })
    .fill('Synthetic corrected employee details');
  await modal.getByRole('button', { name: 'Review changes', exact: true }).click();
  const editConfirmation = page.getByRole('dialog', {
    name: 'Save employee details?',
    exact: true,
  });
  await expect(editConfirmation).toContainText('Synthetic Updated');
  await editConfirmation
    .getByRole('button', { name: 'Save employee details', exact: true })
    .click();
  await expect(editConfirmation).toHaveCount(0);
  const savedModal = page.getByRole('dialog', { name: 'Synthetic Updated Created', exact: true });
  await expect(savedModal).toBeVisible();
  await expect(
    savedModal.getByRole('button', { name: 'Close employee details', exact: true }),
  ).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(savedModal).toHaveCount(0);
  page.off('request', track);
});
