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
for(const [id,label] of [
  ['REQ-TEAM','Team'],['REQ-EMP','Employees'],['REQ-SAL','Salary'],['REQ-HISTORY','History'],
  ['REQ-APPROVAL','Approvals'],['REQ-TRANSFER','Transfer'],['REQ-COUNTRY','Country'],
  ['REQ-FX','Exchange rates'],['REQ-REPORT','Reports'],['REQ-AUDIT','Audit'],['REQ-DASH','Dashboard']
]) {
  test(`${id} ${label} workflow entry is available`,async ({page},info)=>{
    await page.goto('/');
    await info.attach('available-controls',{body:JSON.stringify(await page.locator('a,button,input,nav').allTextContents()),contentType:'application/json'});
    await expect(page.getByRole('link',{name:new RegExp(label!,'i')}).or(page.getByRole('button',{name:new RegExp(label!,'i')})).first()).toBeVisible();
  });
}
test('REQ-API unauthenticated domain endpoints enforce a real auth boundary',async ({page},info)=>{
  await page.goto('/');
  const paths=['/api/v1/employees','/api/v1/auth/me','/api/v1/country-rules','/api/v1/fx-rates','/api/v1/reports/generate','/api/v1/audit-logs'];
  const actual=await page.evaluate(async paths=>Promise.all(paths.map(async path=>{
    const response=await fetch(path);return {path,status:response.status,body:await response.text()};
  })),paths);
  await info.attach('domain-route-probe',{body:JSON.stringify(actual,null,2),contentType:'application/json'});
  // A 404 is missing functionality, not proof that a role/session guard protects an existing route.
  for(const route of actual) expect.soft([401,403],route.path).toContain(route.status);
});
