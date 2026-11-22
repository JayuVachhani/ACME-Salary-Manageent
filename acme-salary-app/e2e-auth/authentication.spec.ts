import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { smtpCapture } from './smtp-capture';
const origin = 'http://127.0.0.1:4427';
const pool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
let capture: Awaited<ReturnType<typeof smtpCapture>>;
test.beforeAll(async () => {
  if (!/^acme_test_[a-f0-9]{32}$/.test(process.env.ACME_AUTH_TEST_DATABASE ?? '') ||
    new URL(process.env.MIGRATION_DATABASE_URL!).pathname !== `/${process.env.ACME_AUTH_TEST_DATABASE}`) {
    throw new Error('Run npm run test:login; authentication E2E requires its isolated synthetic database');
  }
  capture = await smtpCapture(4325);
  await pool.query("INSERT INTO users(email,full_name,status) VALUES('login.browser@acme.test','Synthetic Browser User','ACTIVE') ON CONFLICT(email) WHERE status<>'DELETED' DO NOTHING");
});
test.afterAll(async () => { await capture?.close(); await pool.end(); });
test('AUTH-E2E-01 real SMTP OTP login, HttpOnly session, CSRF logout and revocation', async ({ page, context }) => {
  await page.goto('/');
  await page.getByLabel('Work email').fill('login.browser@acme.test');
  await page.getByRole('button', { name: 'Send sign-in code' }).click();
  await expect(page.getByLabel('One-time code')).toBeVisible();
  await expect.poll(() => capture.messages.length).toBe(1);
  const code = capture.messages[0]!.match(/code is (\d{6})/)![1]!;
  await page.getByLabel('One-time code').fill(code);
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  const cookies = await context.cookies();
  expect(cookies.find(c => c.name === 'acme_session')?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain('acme_session');
  expect((await page.request.get('/api/v1/auth/me')).status()).toBe(200);
  // The readable CSRF cookie is a hint, not proof that an HttpOnly session exists.
  await context.clearCookies({ name: 'acme_csrf' });
  const restored: string[] = [];
  const recordIdentity = (response: import('@playwright/test').Response) => {
    if (new URL(response.url()).pathname === '/api/v1/auth/me' && response.status() === 200) restored.push(response.url());
  };
  page.on('response', recordIdentity);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await expect.poll(() => restored.length).toBe(1);
  page.off('response', recordIdentity);
  await context.addCookies(cookies.filter(cookie => cookie.name === 'acme_csrf'));
  await page.screenshot({ path: 'qa-artifacts/login/signed-in.png', fullPage: true });
  expect((await page.request.post('/api/v1/auth/logout', { headers: { Origin: origin }, data: {} })).status()).toBe(403);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Notifications').getByText('Signed out.', {exact:true})).toBeVisible();
  expect((await page.request.get('/api/v1/auth/me')).status()).toBe(401);
});
test('AUTH-E2E-02 origin, DTO, generic responses and unknown-user verification', async ({ request }) => {
  expect((await request.post('/api/v1/auth/otp/request', { data: { email: 'unknown@acme.test' } })).status()).toBe(403);
  expect((await request.post('/api/v1/auth/otp/request', { headers: { Origin: origin }, data: { email: 'bad' } })).status()).toBe(400);
  const response = await request.post('/api/v1/auth/otp/request', { headers: { Origin: origin }, data: { email: 'unknown@acme.test' } });
  expect(response.status()).toBe(202);
  const body = await response.json(); expect(Object.keys(body).sort()).toEqual(['challengeId', 'message']);
  expect((await request.post('/api/v1/auth/otp/verify', { headers: { Origin: origin }, data: { challengeId: body.challengeId, code: '123456' } })).status()).toBe(401);
});
test('AUTH-E2E-03 resend invalidation and three failed attempts', async ({ request }) => {
  const count = capture.messages.length;
  const issue = async (path = 'request') => (await request.post(`/api/v1/auth/otp/${path}`, { headers: { Origin: origin }, data: { email: 'login.browser@acme.test' } })).json();
  const first = await issue(); await expect.poll(() => capture.messages.length).toBe(count + 1);
  const oldCode = capture.messages.at(-1)!.match(/code is (\d{6})/)![1]!;
  const second = await issue('resend'); await expect.poll(() => capture.messages.length).toBe(count + 2);
  const code = capture.messages.at(-1)!.match(/code is (\d{6})/)![1]!;
  const verify = async (id: string, value: string) => request.post('/api/v1/auth/otp/verify', { headers: { Origin: origin }, data: { challengeId: id, code: value } });
  expect((await verify(first.challengeId, oldCode)).status()).toBe(401);
  for (let i = 0; i < 3; i++) expect((await verify(second.challengeId, code === '000000' ? '000001' : '000000')).status()).toBe(401);
  expect((await verify(second.challengeId, code)).status()).toBe(401);
});
test('AUTH-E2E-04 SMTP failure invalidates the code without exposing delivery state', async ({ request }) => {
  await capture.close();
  const response = await request.post('/api/v1/auth/otp/resend', { headers: { Origin: origin }, data: { email: 'login.browser@acme.test' } });
  expect(response.status()).toBe(202);
  const { challengeId } = await response.json();
  await expect.poll(async () => (await pool.query('SELECT consumed_at FROM login_challenges WHERE id=$1', [challengeId])).rows[0]?.consumed_at != null, { timeout: 15000 }).toBe(true);
  expect((await pool.query("SELECT count(*)::int n FROM audit_logs WHERE entity_id=$1 AND change_type='OTP_DELIVERY_FAILED'", [challengeId])).rows[0].n).toBe(1);
});
test('AUTH-E2E-05 IP throttle applies to verification and ignores spoofed forwarded headers', async ({ request }) => {
  let status = 0;
  for (let i = 0; i < 21; i++) {
    const response = await request.post('/api/v1/auth/otp/verify', { headers: { Origin: origin, 'X-Forwarded-For': `192.0.2.${i+1}` },
      data: { challengeId: '00000000-0000-4000-8000-000000000099', code: '123456' } });
    status = response.status(); expect([401, 429]).toContain(status);
  }
  expect(status).toBe(429);
});
