import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { Pool } from 'pg';
import AxeBuilder from '@axe-core/playwright';
import { smtpCapture } from './smtp-capture';
const pool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
let capture: Awaited<ReturnType<typeof smtpCapture>>;
test.beforeAll(async () => {
  if (
    !/^acme_test_[a-f0-9]{32}$/.test(process.env.ACME_AUTH_TEST_DATABASE ?? '') ||
    new URL(process.env.MIGRATION_DATABASE_URL!).pathname !==
      `/${process.env.ACME_AUTH_TEST_DATABASE}`
  )
    throw new Error('Isolated test database required');
  capture = await smtpCapture(4325);
  await pool.query('TRUNCATE auth_rate_events');
  await pool.query(`INSERT INTO users(email,full_name,status,is_hr_manager) VALUES
    ('refs.hr@acme.test','Synthetic Reference HR','ACTIVE',true),('refs.member@acme.test','Synthetic Reference Member','ACTIVE',false)`);
});
test.afterAll(async () => {
  await capture?.close();
  await pool.end();
});
async function login(page: Page, email = 'refs.hr@acme.test') {
  await page.goto('/');
  await page.getByLabel('Work email').fill(email);
  const count = capture.messages.length;
  await page.getByRole('button', { name: 'Send sign-in code' }).click();
  await expect.poll(() => capture.messages.length).toBeGreaterThan(count);
  const mail = capture.messages
    .filter((v) => v.includes(`To: ${email}`) && /code is \d{6}/.test(v))
    .at(-1)!;
  await page.getByLabel('One-time code').fill(mail.match(/code is (\d{6})/)![1]!);
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.goto('/#/organization');
}
const section = (page: Page) => page.getByRole('region', { name: 'Organization references' });
async function confirm(page: Page) {
  await page.getByRole('button', { name: 'Confirm reference change', exact: true }).click();
  await expect(
    page.getByLabel('Notifications').getByText('Reference saved.', { exact: true }),
  ).toBeVisible();
}

test('REF-E2E-01 confirmed creation, duplicate rejection, rename, deactivate and reactivate for both lists', async ({
  page,
}) => {
  await login(page);
  const area = section(page);
  for (const kind of ['Departments', 'Designations']) {
    await area.getByLabel('Reference type').selectOption({ label: kind });
    await expect(area.getByRole('status')).toHaveCount(0);
    await area.getByLabel('Reference name').fill(`  Synthetic ${kind}  `);
    await area.getByRole('button', { name: 'Review reference', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(`Synthetic ${kind}`);
    await page.getByRole('button', { name: 'Cancel reference change', exact: true }).click();
    expect(
      (
        await pool.query(`SELECT count(*)::int n FROM ${kind.toLowerCase()} WHERE name=$1`, [
          `Synthetic ${kind}`,
        ])
      ).rows[0].n,
    ).toBe(0);
    await area.getByRole('button', { name: 'Review reference', exact: true }).click();
    await confirm(page);
    await area.getByLabel('Reference name').fill(`synthetic ${kind.toLowerCase()}`);
    await area.getByRole('button', { name: 'Review reference', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm reference change', exact: true }).click();
    await expect(page.getByLabel('Notifications')).toContainText('already exists');
    await area
      .getByRole('button', { name: `Edit reference Synthetic ${kind}`, exact: true })
      .click();
    await area.getByLabel('Reference name').fill(`Renamed ${kind}`);
    await area.getByLabel('Reference active').uncheck();
    await area.getByRole('button', { name: 'Review reference', exact: true }).click();
    await confirm(page);
    await expect(area.getByRole('row').filter({ hasText: `Renamed ${kind}` })).toContainText(
      'Inactive',
    );
    await area.getByRole('button', { name: `Edit reference Renamed ${kind}`, exact: true }).click();
    await area.getByLabel('Reference active').check();
    await area.getByRole('button', { name: 'Review reference', exact: true }).click();
    await confirm(page);
    await expect(area.getByRole('row').filter({ hasText: `Renamed ${kind}` })).toContainText(
      'Active',
    );
  }
});
test('REF-E2E-02 anonymous/member access and invalid DTO, origin, CSRF, ID and stale edit rejected', async ({
  page,
  request,
}) => {
  expect((await request.get('/api/v1/organization-references/departments')).status()).toBe(401);
  await login(page, 'refs.member@acme.test');
  await expect(section(page)).toHaveCount(0);
  expect((await page.request.get('/api/v1/organization-references/departments')).status()).toBe(
    403,
  );
  expect(
    (
      await page.request.post('/api/v1/organization-references/departments', {
        headers: { Origin: new URL(page.url()).origin },
        data: { name: 'Denied' },
      })
    ).status(),
  ).toBe(403);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await login(page);
  const csrf = (await page.context().cookies()).find((c) => c.name === 'acme_csrf')!.value;
  const headers = { Origin: new URL(page.url()).origin, 'X-CSRF-Token': csrf };
  const path = '/api/v1/organization-references/departments';
  expect(
    (
      await page.request.post(path, {
        headers: { ...headers, Origin: 'https://invalid.acme.test' },
        data: { name: 'Denied' },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post(path, {
        headers: { ...headers, 'X-CSRF-Token': 'wrong' },
        data: { name: 'Denied' },
      })
    ).status(),
  ).toBe(403);
  for (const data of [
    { name: '   ' },
    { name: 'Valid', id: 'forbidden' },
    { name: 'x'.repeat(201) },
  ])
    expect((await page.request.post(path, { headers, data })).status()).toBe(400);
  expect((await page.request.get('/api/v1/organization-references/invalid')).status()).toBe(400);
  const created = await page.request.post(path, {
    headers,
    data: { name: 'Concurrency reference' },
  });
  expect(created.status()).toBe(201);
  const item = await created.json();
  const data = { name: 'Updated reference', isActive: false, expectedVersion: item.version };
  expect((await page.request.patch(`${path}/${item.id}`, { headers, data })).status()).toBe(200);
  expect((await page.request.patch(`${path}/${item.id}`, { headers, data })).status()).toBe(409);
  expect((await page.request.patch(`${path}/invalid`, { headers, data })).status()).toBe(400);
  expect((await page.request.get(path)).headers()['cache-control']).toBe('no-store');
});
test('REF-E2E-03 loading, error, whitespace validation, responsive layout and accessibility', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  const area = section(page);
  await area.getByLabel('Reference name').fill('   ');
  await area.getByRole('button', { name: 'Review reference', exact: true }).click();
  await expect(area.getByRole('alert')).toHaveText('Enter a reference name.');
  await page.route('**/api/v1/organization-references/departments?offset=*', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Synthetic reference outage' }),
    }),
  );
  await area.getByRole('button', { name: 'Refresh references' }).click();
  await expect(area.getByRole('alert')).toHaveText('Service unavailable. Please try again.');
  await page.unroute('**/api/v1/organization-references/departments?offset=*');
  await area.getByRole('button', { name: 'Refresh references' }).click();
  await expect(area.getByRole('table', { name: 'Departments', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).include('[aria-labelledby="organization-heading"]').analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: 'qa-artifacts/login/references.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('REF-E2E-04 empty list and two-way pagination retain all records', async ({ page }) => {
  await login(page);
  const area = section(page);
  await area.getByLabel('Reference type').selectOption('designations');
  await expect(area.getByRole('status')).toHaveCount(0);
  await pool.query(
    "INSERT INTO designations(name) SELECT 'Synthetic paged designation '||n FROM generate_series(1,21) n",
  );
  const total = (await pool.query('SELECT count(*)::int n FROM designations')).rows[0].n;
  await area.getByRole('button', { name: 'Refresh references' }).click();
  await expect(area.getByRole('button', { name: 'Next references' })).toBeEnabled();
  await expect(area.getByRole('table').getByRole('row')).toHaveCount(21);
  await area.getByRole('button', { name: 'Next references' }).click();
  await expect(area.getByRole('table').getByRole('row')).toHaveCount(total - 20 + 1);
  await area.getByRole('button', { name: 'Previous references' }).click();
  await expect(area.getByRole('table').getByRole('row')).toHaveCount(21);
  await page.route('**/api/v1/organization-references/departments?offset=*', (route) =>
    route.fulfill({ contentType: 'application/json', body: '{"items":[],"total":0}' }),
  );
  await area.getByLabel('Reference type').selectOption('departments');
  await expect(area.getByText('No departments yet.', { exact: true })).toBeVisible();
});
