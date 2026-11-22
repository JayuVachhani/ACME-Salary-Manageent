import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { Pool } from 'pg';
import { smtpCapture } from './smtp-capture';
import AxeBuilder from '@axe-core/playwright';
const pool=new Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
let capture:Awaited<ReturnType<typeof smtpCapture>>;
const origin='http://127.0.0.1:4427';
test.beforeAll(async()=>{
  if(!/^acme_test_[a-f0-9]{32}$/.test(process.env.ACME_AUTH_TEST_DATABASE??'')||new URL(process.env.MIGRATION_DATABASE_URL!).pathname!==`/${process.env.ACME_AUTH_TEST_DATABASE}`)throw new Error('Isolated test database required');
  capture=await smtpCapture(4325);
  await pool.query('TRUNCATE auth_rate_events');
  await pool.query(`INSERT INTO users(email,full_name,status,is_hr_manager) VALUES
    ('team.a@acme.test','Synthetic HR A','ACTIVE',true),('team.b@acme.test','Synthetic HR B','ACTIVE',true)
    ON CONFLICT(email) WHERE status<>'DELETED' DO NOTHING`);
});
test.afterAll(async()=>{await capture?.close();await pool.end();});
async function signIn(page:Page,email:string){
  await page.goto('/');await page.getByLabel('Work email').fill(email);
  const count=capture.messages.length;await page.getByRole('button',{name:'Send sign-in code'}).click();
  await expect.poll(()=>capture.messages.length).toBeGreaterThan(count);
  const message=capture.messages.filter(value=>value.includes(`To: ${email}`)&&/code is \d{6}/.test(value)).at(-1)!;
  await page.getByLabel('One-time code').fill(message.match(/code is (\d{6})/)![1]!);
  await page.getByRole('button',{name:'Verify code'}).click();await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
}
async function mutate(page:Page,path:string,method:string,body:object){
  return page.evaluate(async({path,method,body,origin})=>{
    const csrf=document.cookie.split('; ').find(value=>value.startsWith('acme_csrf='))?.slice(10)??'';
    const response=await fetch(`/api/v1/team${path}`,{method,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,Origin:origin},body:JSON.stringify(body)});
    return {status:response.status,body:await response.json()};
  },{path,method,body,origin});
}
test('TEAM-E2E-01 HR invites through confirmed form, SMTP arrives, member logs in without HR access',async({page,browser})=>{
  await signIn(page,'team.a@acme.test');await expect(page.getByRole('heading',{name:'Team',exact:true})).toBeVisible();
  await page.getByLabel('Full name',{exact:true}).fill('Synthetic Invited Member');await page.getByLabel('Team email').fill('team.member@acme.test');
  await page.getByRole('button',{name:'Send invitation',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('team.member@acme.test');
  await page.getByRole('button',{name:'Cancel change'}).click();
  expect((await pool.query("SELECT count(*)::int n FROM users WHERE email='team.member@acme.test'")).rows[0].n).toBe(0);
  await page.getByRole('button',{name:'Send invitation',exact:true}).click();await page.getByRole('button',{name:'Confirm change'}).click();
  await expect(page.getByLabel('Notifications').getByText('Invitation saved and email sent.', {exact:true})).toBeVisible();
  await expect.poll(()=>capture.messages.some(value=>value.includes('To: team.member@acme.test')&&value.includes('You are invited to ACME'))).toBe(true);
  await page.getByRole('button',{name:'Reinvite team.member@acme.test',exact:true}).click();
  await page.getByRole('button',{name:'Confirm change'}).click();
  await expect(page.getByLabel('Notifications').getByText('Invitation renewed and email sent.', {exact:true})).toBeVisible();
  const memberContext=await browser.newContext({baseURL:origin});const member=await memberContext.newPage();
  try{
    await signIn(member,'team.member@acme.test');await expect(member.getByRole('heading',{name:'Team',exact:true})).toHaveCount(0);
    expect((await member.request.get(`${origin}/api/v1/team`)).status()).toBe(403);
    expect((await mutate(member,'','POST',{email:'forbidden@acme.test',fullName:'Forbidden',isHrManager:true,permissions:['read']})).status).toBe(403);
    await page.getByRole('button',{name:'Refresh team'}).click();
    await expect(page.getByRole('row').filter({hasText:'team.member@acme.test'})).toContainText('ACTIVE');
    await page.getByRole('button',{name:'Edit team.member@acme.test',exact:true}).click();
    await page.getByRole('checkbox',{name:'salary:view',exact:true}).check();
    await page.getByRole('button',{name:'Save member',exact:true}).click();
    await expect(page.getByRole('dialog')).toContainText('salary:view');
    await page.getByRole('button',{name:'Confirm change'}).click();
    await expect(page.getByLabel('Notifications').getByText('Permissions saved.', {exact:true})).toBeVisible();
    expect((await (await member.request.get(`${origin}/api/v1/auth/me`)).json()).permissions).toEqual(['read','salary:view']);
    await page.getByRole('button',{name:'Refresh team'}).click();
    await expect(page.getByRole('row').filter({hasText:'team.member@acme.test'})).toContainText('salary:view');
    await page.getByRole('button',{name:'Remove team.member@acme.test',exact:true}).click();await page.getByRole('button',{name:'Confirm change'}).click();
    await expect(page.getByLabel('Notifications').getByText('Account removed; access revoked.', {exact:true})).toBeVisible();
    expect((await member.request.get(`${origin}/api/v1/auth/me`)).status()).toBe(401);
  }finally{await memberContext.close();}
});
test('TEAM-E2E-02 current HR cannot self-elevate, stale changes and missing CSRF rejected',async({page})=>{
  await signIn(page,'team.a@acme.test');
  await page.getByRole('button',{name:'Edit team.a@acme.test',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'HR Manager (all permissions)',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Cancel edit'}).click();
  const account=(await pool.query("SELECT * FROM users WHERE email='team.a@acme.test'")).rows[0];
  expect((await mutate(page,`/${account.id}`,'PATCH',{fullName:account.full_name,isHrManager:false,permissions:['read'],expectedVersion:account.team_version})).status).toBe(403);
  const other=(await pool.query("SELECT * FROM users WHERE email='team.b@acme.test'")).rows[0];
  const body={fullName:other.full_name,isHrManager:true,permissions:other.permissions,expectedVersion:other.team_version};
  expect((await mutate(page,`/${other.id}`,'PATCH',body)).status).toBe(200);
  expect((await mutate(page,`/${other.id}`,'PATCH',body)).status).toBe(409);
  expect((await page.request.delete(`${origin}/api/v1/team/${other.id}`,{headers:{Origin:origin},data:{expectedVersion:other.team_version}})).status()).toBe(403);
  expect((await page.request.patch(`${origin}/api/v1/team/${other.id}`,{headers:{Origin:origin,'X-CSRF-Token':'invalid'},data:body})).status()).toBe(403);
  expect((await mutate(page,'','POST',{email:'invalid.permissions@acme.test',fullName:'Synthetic Invalid',isHrManager:false,permissions:['superuser']})).status).toBe(400);
  expect((await mutate(page,'','POST',{email:'invalid.actor@acme.test',fullName:'Synthetic Invalid',isHrManager:false,permissions:['read'],actorId:other.id})).status).toBe(400);
});
test('TEAM-E2E-03 independent HR offboards manager; final manager cannot remove own account',async({page,browser})=>{
  await signIn(page,'team.b@acme.test');const context=await browser.newContext({baseURL:origin});const removed=await context.newPage();
  try{
    await signIn(removed,'team.a@acme.test');
    const target=(await pool.query("SELECT id,team_version FROM users WHERE email='team.a@acme.test'")).rows[0];
    expect((await mutate(page,`/${target.id}`,'DELETE',{expectedVersion:target.team_version})).status).toBe(200);
    expect((await removed.request.get(`${origin}/api/v1/team`)).status()).toBe(401);
    const last=(await pool.query("SELECT id,team_version FROM users WHERE email='team.b@acme.test'")).rows[0];
    expect((await mutate(page,`/${last.id}`,'DELETE',{expectedVersion:last.team_version})).status).toBe(409);
    expect((await page.request.get(`${origin}/api/v1/team`)).status()).toBe(200);
    await expect(page.getByRole('heading',{name:'Team',exact:true})).toBeVisible();
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
    await pool.query("INSERT INTO users(email,full_name,status) SELECT 'pager.'||n||'@acme.test','Synthetic Page Member '||n,'ACTIVE' FROM generate_series(1,21) n");
    const liveCount=(await pool.query("SELECT count(*)::int n FROM users WHERE NOT is_system AND status<>'DELETED'")).rows[0].n;
    await page.getByRole('button',{name:'Refresh team'}).click();
    await expect(page.getByRole('button',{name:'Next page'})).toBeEnabled();
    await page.getByRole('button',{name:'Next page'}).click();
    await expect(page.getByRole('table',{name:'Team members'}).getByRole('row')).toHaveCount(liveCount-20+1);
    await page.getByRole('button',{name:'Previous page'}).click();
    await expect(page.getByRole('table',{name:'Team members'}).getByRole('row')).toHaveCount(21);
    await page.setViewportSize({width:375,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.screenshot({path:'qa-artifacts/login/team.png',fullPage:true});
  }finally{await context.close();}
});
test('TEAM-E2E-04 invitation email failure is visible and saved invitation remains recoverable',async({page})=>{
  await signIn(page,'team.b@acme.test');await capture.close();
  await page.getByLabel('Full name',{exact:true}).fill('Synthetic Delivery Failure');await page.getByLabel('Team email').fill('team.delivery@acme.test');
  await page.getByRole('button',{name:'Send invitation',exact:true}).click();await page.getByRole('button',{name:'Confirm change'}).click();
  await expect(page.getByLabel('Notifications').getByText('Invitation saved, but email delivery failed.', {exact:false})).toBeVisible({timeout:15000});
  const account=(await pool.query("SELECT id,status FROM users WHERE email='team.delivery@acme.test'")).rows[0];
  expect(account.status).toBe('INVITED');
  expect((await pool.query("SELECT count(*)::int n FROM audit_logs WHERE entity_id=$1 AND change_type='INVITATION_DELIVERY_FAILED'",[account.id])).rows[0].n).toBe(1);
});
