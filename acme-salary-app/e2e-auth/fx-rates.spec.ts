import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {Pool} from 'pg';
import AxeBuilder from '@axe-core/playwright';
import {smtpCapture} from './smtp-capture';
test.describe.configure({mode:'serial'});
const pool=new Pool({connectionString:process.env.MIGRATION_DATABASE_URL});let capture:Awaited<ReturnType<typeof smtpCapture>>;
test.beforeAll(async()=>{
 if(!/^acme_test_[a-f0-9]{32}$/.test(process.env.ACME_AUTH_TEST_DATABASE??'')||new URL(process.env.MIGRATION_DATABASE_URL!).pathname!==`/${process.env.ACME_AUTH_TEST_DATABASE}`)throw new Error('Isolated database required');
 capture=await smtpCapture(4325);await pool.query('TRUNCATE auth_rate_events');
 await pool.query(`INSERT INTO users(email,full_name,status,is_hr_manager,permissions) VALUES ('fx.hr@acme.test','Synthetic FX HR','ACTIVE',true,ARRAY[]::text[]),('fx.member@acme.test','Synthetic Read Member','ACTIVE',false,ARRAY['read']),('fx.hr.b@acme.test','Synthetic FX HR B','ACTIVE',true,ARRAY[]::text[])`);
 await pool.query("INSERT INTO currencies(code,minor_units) VALUES('USD',2),('EUR',2),('INR',2),('GBP',2)");
});
test.afterAll(async()=>{await capture?.close();await pool.end();});
async function login(page:Page,email='fx.hr@acme.test'){
 await page.goto('/');await page.getByLabel('Work email').fill(email);const n=capture.messages.length;await page.getByRole('button',{name:'Send sign-in code'}).click();await expect.poll(()=>capture.messages.length).toBeGreaterThan(n);
 const mail=capture.messages.filter(v=>v.includes(`To: ${email}`)&&/code is \d{6}/.test(v)).at(-1)!;await page.getByLabel('One-time code').fill(mail.match(/code is (\d{6})/)![1]!);await page.getByRole('button',{name:'Verify code'}).click();await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
}
const area=(page:Page)=>page.getByRole('region',{name:'Exchange rates'});
async function save(page:Page){await page.getByRole('button',{name:'Confirm FX change',exact:true}).click();await expect(page.getByLabel('Notifications').getByText('FX revision saved.', {exact:true})).toBeVisible();}
async function api(page:Page,body:object,extra:Record<string,string>={}){
 const csrf=(await page.context().cookies()).find(c=>c.name==='acme_csrf')!.value;
 return page.request.post('/api/v1/fx-rates',{headers:{Origin:new URL(page.url()).origin,'X-CSRF-Token':csrf,...extra},data:body});
}
test('FX-E2E-01 confirmed initial rate, immutable correction, provenance and historical lookup',async({page})=>{
 await login(page);const panel=area(page);await expect(panel.getByRole('status')).toHaveCount(0);
 await panel.getByLabel('Rate base currency').selectOption('USD');await panel.getByLabel('Rate quote currency').selectOption('EUR');await panel.getByLabel('Rate effective date').fill('2026-11-20');
 await panel.getByRole('button',{name:'Load current FX revision'}).click();await expect(panel.getByRole('status').filter({hasText:'Current revision'})).toHaveText('Current revision 0; next revision 1.');
 await panel.getByLabel('FX rate',{exact:true}).fill('0.8');await panel.getByLabel('Rate source').fill('Synthetic treasury');await panel.getByLabel('Revision reason').fill('Synthetic initial');await panel.getByRole('button',{name:'Review FX revision'}).click();
 await expect(page.getByRole('dialog')).toContainText('1 USD = 0.8 EUR');await page.getByRole('button',{name:'Cancel FX change'}).click();expect((await pool.query('SELECT count(*)::int n FROM fx_rate_revisions')).rows[0].n).toBe(0);
 await panel.getByRole('button',{name:'Review FX revision'}).click();await save(page);
 await panel.getByRole('button',{name:/^Prepare FX revision /}).click();await panel.getByLabel('FX rate',{exact:true}).fill('0.9');await panel.getByLabel('Revision reason').fill('Synthetic corrected source');await panel.getByRole('button',{name:'Review FX revision'}).click();await save(page);
 const rows=(await pool.query("SELECT revision,rate::text FROM fx_rate_revisions WHERE base_currency='USD' AND quote_currency='EUR' ORDER BY revision")).rows;expect(rows.map(r=>r.rate)).toEqual(['0.80000000','0.90000000']);
 await panel.getByLabel('Lookup base currency').fill('USD');await panel.getByLabel('Lookup quote currency').fill('EUR');await panel.getByLabel('Lookup as-of date').fill('2026-11-20');await panel.getByRole('button',{name:'Resolve historical FX'}).click();
 await expect(panel.getByRole('status')).toContainText('Resolved unit rate: 0.9');await expect(panel.getByRole('status')).toContainText('Synthetic treasury');await expect(panel.getByRole('status')).toContainText('revision 2');
});
test('FX-E2E-02 reader/HR boundaries, independent stale writer, strict validation, CSRF and no-store',async({page,request})=>{
 expect((await request.get('/api/v1/fx-rates')).status()).toBe(401);await login(page,'fx.member@acme.test');const panel=area(page);await expect(panel.getByRole('table',{name:'FX revision history'})).toBeVisible();await expect(panel.getByLabel('Rate base currency')).toHaveCount(0);
 const valid={base:'USD',quote:'EUR',effectiveDate:'2026-11-20',rate:'1',source:'Synthetic source',reason:'Synthetic change',expectedRevision:0};
 expect((await api(page,valid)).status()).toBe(403);await page.getByRole('button',{name:'Sign out',exact:true}).click();await login(page,'fx.hr.b@acme.test');
 expect((await api(page,valid)).status()).toBe(409);
 for(const data of [{...valid,rate:'0'},{...valid,rate:'1e3'},{...valid,rate:'1.123456789'},{...valid,quote:'USD'},{...valid,effectiveDate:'2026-02-30'},{...valid,actorId:'forbidden'},{...valid,reason:'  '}])expect((await api(page,data)).status()).toBe(400);
 expect((await api(page,valid,{'X-CSRF-Token':'wrong'})).status()).toBe(403);expect((await api(page,valid,{Origin:'https://invalid.acme.test'})).status()).toBe(403);
 const denied=await page.request.get('/api/v1/fx-rates/resolve?base=USD&quote=EUR&asOf=2026-12-01');expect(denied.status()).toBe(422);expect((await page.request.get('/api/v1/fx-rates')).headers()['cache-control']).toBe('no-store');
});
test('FX-E2E-03 filters, paging, missing-rate and outage states, mobile/axe/console',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await login(page);const panel=area(page);await expect(panel.getByRole('status')).toHaveCount(0);
 const actor=(await pool.query("SELECT id FROM users WHERE email='fx.hr@acme.test'")).rows[0].id;
 await pool.query("INSERT INTO fx_rate_revisions(base_currency,quote_currency,effective_date,revision,rate,source,reason,created_by) SELECT 'USD','INR',date '2026-10-01'+n,1,80,'SYNTHETIC','Synthetic page quote',$1 FROM generate_series(0,20) n",[actor]);
 await panel.getByRole('button',{name:'Refresh FX history'}).click();await expect(panel.getByRole('button',{name:'Next FX page'})).toBeEnabled();await panel.getByRole('button',{name:'Next FX page'}).click();await expect(panel.getByText('23 FX revisions. Page 2.',{exact:true})).toBeVisible();await panel.getByRole('button',{name:'Previous FX page'}).click();
 await panel.getByLabel('Filter base currency').fill('USD');await panel.getByLabel('Filter quote currency').fill('GBP');await panel.getByRole('button',{name:'Apply FX filters'}).click();await expect(panel.getByText('No exchange rate revisions match.',{exact:true})).toBeVisible();
 await panel.getByLabel('Lookup base currency').fill('USD');await panel.getByLabel('Lookup quote currency').fill('GBP');await panel.getByLabel('Lookup as-of date').fill('2026-11-20');await panel.getByRole('button',{name:'Resolve historical FX'}).click();await expect(page.getByLabel('Notifications')).toContainText('No eligible historical FX path');
 await page.route('**/api/v1/fx-rates?*',route=>route.fulfill({status:503,contentType:'application/json',body:'{"message":"Synthetic FX outage"}'}));await panel.getByRole('button',{name:'Refresh FX history'}).click();await expect(panel.getByRole('alert')).toHaveText('Service unavailable. Please try again.');await page.unroute('**/api/v1/fx-rates?*');await panel.getByRole('button',{name:'Refresh FX history'}).click();
 await page.setViewportSize({width:375,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);expect((await new AxeBuilder({page}).include('[aria-labelledby="fx-heading"]').analyze()).violations).toEqual([]);expect(errors).toEqual([]);await panel.screenshot({path:'qa-artifacts/fx/mobile.png'});
});
