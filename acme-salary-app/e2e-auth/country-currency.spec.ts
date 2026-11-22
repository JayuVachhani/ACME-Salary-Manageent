import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {Pool} from 'pg';
import AxeBuilder from '@axe-core/playwright';
import {smtpCapture} from './smtp-capture';
const pool=new Pool({connectionString:process.env.MIGRATION_DATABASE_URL});let capture:Awaited<ReturnType<typeof smtpCapture>>;
test.beforeAll(async()=>{
 if(!/^acme_test_[a-f0-9]{32}$/.test(process.env.ACME_AUTH_TEST_DATABASE??'')||new URL(process.env.MIGRATION_DATABASE_URL!).pathname!==`/${process.env.ACME_AUTH_TEST_DATABASE}`)throw new Error('Isolated database required');
 capture=await smtpCapture(4325);await pool.query('TRUNCATE auth_rate_events');
 await pool.query(`INSERT INTO users(email,full_name,status,is_hr_manager,permissions) VALUES ('country.hr@acme.test','Synthetic Country HR','ACTIVE',true,ARRAY[]::text[]),('country.member@acme.test','Synthetic Read Member','ACTIVE',false,ARRAY['read'])`);
});
test.afterAll(async()=>{await capture?.close();await pool.end();});
async function login(page:Page,email='country.hr@acme.test'){
 await page.goto('/');await page.getByLabel('Work email').fill(email);const n=capture.messages.length;await page.getByRole('button',{name:'Send sign-in code'}).click();await expect.poll(()=>capture.messages.length).toBeGreaterThan(n);
 const mail=capture.messages.filter(v=>v.includes(`To: ${email}`)&&/code is \d{6}/.test(v)).at(-1)!;await page.getByLabel('One-time code').fill(mail.match(/code is (\d{6})/)![1]!);await page.getByRole('button',{name:'Verify code'}).click();await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
}
const area=(page:Page)=>page.getByRole('region',{name:'Countries and currencies'});
async function confirm(page:Page){await page.getByRole('button',{name:'Confirm policy change',exact:true}).click();}
async function activate(page:Page,code:string){await area(page).getByLabel('Find currency').fill(code);await area(page).getByRole('button',{name:`Activate currency ${code}`,exact:true}).click();await confirm(page);await expect(page.getByLabel('Notifications').getByText('Currency status saved.', {exact:true})).toBeVisible();}
test('CTRY-E2E-01 real catalogue activation and confirmed country create/edit/deactivate/reactivate',async({page})=>{
 await login(page);const panel=area(page);await expect(panel.getByRole('status')).toHaveCount(0);
 await panel.getByLabel('Find currency').fill('XAU');await expect(panel.getByRole('button',{name:'Activate currency XAU'})).toBeDisabled();
 await activate(page,'USD');await panel.getByLabel('Country code').fill('ZZ');await panel.getByLabel('Country name').fill('  Synthetic Browser Country  ');await panel.getByLabel('Default currency').selectOption('USD');
 await panel.getByLabel('Regulatory notes').fill('Synthetic regulation');await panel.getByLabel('Retention notes').fill('Synthetic retention');
 await panel.getByRole('button',{name:'Review country policy'}).click();await expect(page.getByRole('dialog')).toContainText('Synthetic regulation');await page.getByRole('button',{name:'Cancel policy change'}).click();expect((await pool.query("SELECT count(*)::int n FROM country_rules WHERE country_code='ZZ'")).rows[0].n).toBe(0);
 await panel.getByRole('button',{name:'Review country policy'}).click();await confirm(page);await expect(page.getByLabel('Notifications').getByText('Country saved.', {exact:true})).toBeVisible();
 await panel.getByRole('button',{name:'Edit country ZZ'}).click();await expect(panel.getByLabel('Country code')).toBeDisabled();await panel.getByLabel('Decimal places').fill('3');await panel.getByLabel('Rounding mode').selectOption('FLOOR');await panel.getByLabel('Country active').uncheck();await panel.getByRole('button',{name:'Review country policy'}).click();await confirm(page);await expect(page.getByLabel('Notifications').getByText('Country saved.', {exact:true})).toBeVisible();
 await expect(panel.getByRole('table',{name:'Country policies'}).getByRole('row').filter({hasText:'Synthetic Browser Country'})).toContainText('Inactive');
 await panel.getByRole('button',{name:'Edit country ZZ'}).click();await panel.getByLabel('Country active').check();await panel.getByRole('button',{name:'Review country policy'}).click();await confirm(page);await expect(page.getByLabel('Notifications').getByText('Country saved.', {exact:true})).toBeVisible();
 await panel.getByRole('button',{name:'Deactivate currency USD'}).click();await confirm(page);await expect(page.getByLabel('Notifications').getByText('Currency status saved.', {exact:true})).toBeVisible();
 await panel.getByRole('button',{name:'Edit country ZZ'}).click();await panel.getByRole('button',{name:'Review country policy'}).click();await confirm(page);await expect(page.getByLabel('Notifications')).toContainText('Reference unavailable');
 await activate(page,'USD');
});
test('CTRY-E2E-02 read member catalogue, HR-only writes, malformed DTO, stale versions and no-store',async({page,request})=>{
 expect((await request.get('/api/v1/currency-catalogue')).status()).toBe(401);await login(page,'country.member@acme.test');
 await expect(area(page).getByRole('table',{name:'ISO currency catalogue'})).toBeVisible();await expect(area(page).getByLabel('Country code')).toHaveCount(0);
 expect((await page.request.get('/api/v1/countries')).status()).toBe(403);expect((await page.request.get('/api/v1/currencies')).status()).toBe(403);
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await login(page);
 const csrf=(await page.context().cookies()).find(c=>c.name==='acme_csrf')!.value,headers={Origin:new URL(page.url()).origin,'X-CSRF-Token':csrf};
 const valid={countryCode:'ZY',countryName:'Synthetic API Country',defaultCurrency:'USD',decimalPlaces:2,roundingMode:'HALF_UP',regulatoryNotes:'',retentionNotes:''};
 expect((await page.request.post('/api/v1/countries',{headers:{...headers,Origin:'https://invalid.acme.test'},data:valid})).status()).toBe(403);
 expect((await page.request.post('/api/v1/countries',{headers:{...headers,'X-CSRF-Token':'invalid'},data:valid})).status()).toBe(403);
 for(const data of [{...valid,decimalPlaces:5},{...valid,countryCode:'z'},{...valid,roundingMode:'UNKNOWN'},{...valid,actorId:'forbidden'}])expect((await page.request.post('/api/v1/countries',{headers,data})).status()).toBe(400);
 expect((await page.request.patch('/api/v1/currencies/USD',{headers,data:{isActive:true,expectedVersion:1,minorUnits:3}})).status()).toBe(400);
 const created=await page.request.post('/api/v1/countries',{headers,data:valid});expect(created.status()).toBe(201);const item=await created.json();
 const {countryCode,...fields}=valid;expect(countryCode).toBe('ZY');const data={...fields,isActive:true,expectedVersion:item.version};
 expect((await page.request.patch('/api/v1/countries/ZY',{headers,data})).status()).toBe(200);expect((await page.request.patch('/api/v1/countries/ZY',{headers,data})).status()).toBe(409);
 expect((await page.request.get('/api/v1/currency-catalogue')).headers()['cache-control']).toBe('no-store');
});
test('CTRY-E2E-03 pagination, error recovery, responsive layout, accessibility and console',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await login(page);const panel=area(page);await expect(panel.getByRole('status')).toHaveCount(0);
 const actor=(await pool.query("SELECT id FROM users WHERE email='country.hr@acme.test'")).rows[0].id;
 for(let i=0;i<21;i++){const code='Q'+String.fromCharCode(65+i);await pool.query("INSERT INTO country_rules(country_code,country_name,default_currency,decimal_places,rounding_mode,updated_by) VALUES($1,$2,'USD',2,'HALF_UP',$3)",[code,`Synthetic page country ${i}`,actor]);}
 await panel.getByRole('button',{name:'Refresh countries and currencies'}).click();await expect(panel.getByRole('button',{name:'Next countries'})).toBeEnabled();await panel.getByRole('button',{name:'Next countries'}).click();await expect(panel.getByText('23 countries. Page 2.',{exact:true})).toBeVisible();await panel.getByRole('button',{name:'Previous countries'}).click();await expect(panel.getByText('23 countries. Page 1.',{exact:true})).toBeVisible();
 await page.route('**/api/v1/currency-catalogue',route=>route.fulfill({status:503,contentType:'application/json',body:'{"message":"Synthetic catalogue outage"}'}));await panel.getByRole('button',{name:'Refresh countries and currencies'}).click();await expect(panel.getByRole('alert')).toHaveText('Service unavailable. Please try again.');await page.unroute('**/api/v1/currency-catalogue');await panel.getByRole('button',{name:'Refresh countries and currencies'}).click();
 await panel.getByLabel('Find currency').fill('no match');await expect(panel.getByText('No currencies match.',{exact:true})).toBeVisible();await panel.getByLabel('Find currency').fill('USD');
 await page.setViewportSize({width:375,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);expect((await new AxeBuilder({page}).include('[aria-labelledby="country-currency-heading"]').analyze()).violations).toEqual([]);expect(errors).toEqual([]);await panel.screenshot({path:'qa-artifacts/country-currency/mobile.png'});
});
