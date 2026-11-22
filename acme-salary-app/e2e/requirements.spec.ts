import { test, expect } from '@playwright/test';
// These are real unmet-requirement assertions, not skipped or expected failures.
test('REQ-LOGIN login email form is reachable',async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('textbox',{name:/email/i})).toBeVisible();
});
test('REQ-OTP synthetic email OTP request is accepted',async ({page},info)=>{
  await page.goto('/');
  const actual=await page.evaluate(async()=>{
    const response=await fetch('/api/v1/auth/otp/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'qa.synthetic@acme.test'})});
    return {status:response.status,body:await response.text()};
  });
  await info.attach('otp-probe',{body:JSON.stringify(actual,null,2),contentType:'application/json'});
  expect(actual.status).toBe(202);
});
test('REQ-TEAM anonymous team access is denied; authorized UI is covered by the SMTP team suite',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Team',exact:true})).toHaveCount(0);
  expect((await page.request.get('/api/v1/team')).status()).toBe(401);
});
// Delivered private modules must be hidden anonymously; authenticated user journeys
// are actually executed in employees/country-currency/fx-rates.spec.ts via SMTP.
for(const [id,label,path] of [
 ['REQ-EMP','Employee directory','/api/v1/employees'],
 ['REQ-COUNTRY','Countries and currencies','/api/v1/currency-catalogue'],
 ['REQ-FX','Exchange rates','/api/v1/fx-rates']
])test(`${id} delivered module denies anonymous access; workflow covered by SMTP suite`,async({page})=>{
 await page.goto('/');await expect(page.getByRole('region',{name:label,exact:true})).toHaveCount(0);
 const response=await page.request.get(path!);expect(response.status()).toBe(401);expect(response.headers()['cache-control']).toBe('no-store');
});
for(const [id,label] of [
  ['REQ-SAL','Salary'],['REQ-HISTORY','History'],
  ['REQ-APPROVAL','Approvals'],['REQ-TRANSFER','Transfer'],
  ['REQ-REPORT','Reports'],['REQ-AUDIT','Audit'],['REQ-DASH','Dashboard']
]) {
  test(`${id} ${label} workflow entry is available`,async ({page},info)=>{
    await page.goto('/');
    await info.attach('available-controls',{body:JSON.stringify(await page.locator('a,button,input,nav').allTextContents()),contentType:'application/json'});
    await expect(page.getByRole('link',{name:new RegExp(label!,'i')}).or(page.getByRole('button',{name:new RegExp(label!,'i')})).first()).toBeVisible();
  });
}
test('REQ-API unauthenticated domain endpoints enforce a real auth boundary',async ({page},info)=>{
  await page.goto('/');
  const paths=['/api/v1/employees','/api/v1/auth/me','/api/v1/countries','/api/v1/fx-rates','/api/v1/reports/generate','/api/v1/audit-logs'];
  const actual=await page.evaluate(async paths=>Promise.all(paths.map(async path=>{
    const response=await fetch(path);return {path,status:response.status,body:await response.text()};
  })),paths);
  await info.attach('domain-route-probe',{body:JSON.stringify(actual,null,2),contentType:'application/json'});
  // A 404 is missing functionality, not proof that a role/session guard protects an existing route.
  for(const route of actual) expect.soft([401,403],route.path).toContain(route.status);
});
