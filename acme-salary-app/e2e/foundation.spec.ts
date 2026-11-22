import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('UI-001 foundation renders against the actual API', async ({ page }, info) => {
  await page.goto('/');
  await expect(page).toHaveTitle('ACME Salary Management');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API is online');
  await expect(page.getByText('No employee data is displayed.')).toBeVisible();
  await info.attach('inventory', { body: JSON.stringify(await page.evaluate(() => ({
    buttons: [...document.querySelectorAll('button')].map(e=>e.textContent),
    forms: document.forms.length, inputs: document.querySelectorAll('input').length,
    links: [...document.querySelectorAll('a')].map(e=>({text:e.textContent,href:e.getAttribute('href')}))
  })),null,2), contentType:'application/json' });
});

for (const width of [320, 375, 768, 1440]) {
  test(`UI-${width} responsive layout at ${width}px`,async ({page},info)=>{
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await expect(page.getByRole('status')).toHaveText('API is online');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await expect(page.getByRole('heading',{level:1})).toBeInViewport();
    await page.screenshot({path:info.outputPath(`viewport-${width}.png`),fullPage:true});
  });
}
test('UI-002 skip link supports keyboard navigation',async ({page})=>{
  await page.goto('/'); await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await expect(page.getByRole('main')).toBeInViewport();
});
test('UI-003 WCAG automated scan desktop and mobile',async ({page},info)=>{
  for(const width of [375,1440]) {
    await page.setViewportSize({width,height:900}); await page.goto('/');
    const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    await info.attach(`axe-${width}`,{body:JSON.stringify(scan.violations,null,2),contentType:'application/json'});
    expect(scan.violations).toEqual([]);
  }
});
test('UI-004 initial loading and successful status (controlled delayed health response)',async ({page})=>{
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/healthz',async route=>{await gate;await route.fulfill({status:200,json:{status:'ok'}});});
  await page.goto('/'); await expect(page.getByRole('status')).toHaveText('Checking service…');
  release(); await expect(page.getByRole('status')).toHaveText('API is online');
});
test('UI-005 unavailable status on health failure (controlled HTTP failure)',async ({page})=>{
  await page.route('**/healthz',route=>route.fulfill({status:503,json:{status:'unavailable'}}));
  await page.goto('/');await expect(page.getByRole('status')).toHaveText('API is unavailable');
});
test('UI-007 stalled health request leaves loading state within a bounded time',async ({page})=>{
  await page.clock.install();
  await page.route('**/healthz',()=>{});
  await page.goto('/');await expect(page.getByRole('status')).toHaveText('Checking service…');
  await page.clock.fastForward(10000);
  await expect(page.getByRole('status')).toHaveText('API is unavailable');
});
test('UI-006 no uncaught browser errors or unexpected external dependencies',async ({page},info)=>{
  const errors:string[]=[]; const external:string[]=[]; const anonymousSessionChecks:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{
    if(message.type()!=='error')return;
    // Anonymous /me is now an explicit session check, even without a CSRF-cookie hint.
    // Keep every other console error (including a /me 500) as a failure.
    const url=message.location().url;
    if(url&&new URL(url).pathname==='/api/v1/auth/me'&&/^Failed to load resource: the server responded with a status of 401\b/.test(message.text()))anonymousSessionChecks.push(message.text());
    else errors.push(message.text());
  });
  page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:4317')&&!request.url().startsWith('data:'))external.push(request.url());});
  await page.goto('/'); await expect(page.getByRole('status')).toHaveText('API is online');
  await page.evaluate(()=>document.fonts.ready);
  await info.attach('console-network',{body:JSON.stringify({errors,external,anonymousSessionChecks},null,2),contentType:'application/json'});
  expect(errors).toEqual([]);expect(external).toEqual([]);expect(anonymousSessionChecks.length).toBeGreaterThan(0);
});
test('API-001 browser verifies health security headers and closed readiness',async ({page},info)=>{
  await page.goto('/');
  const actual=await page.evaluate(async()=>{
    const health=await fetch('/healthz'); const readiness=await fetch('/readyz');
    return {health:health.status,requestId:health.headers.get('x-request-id'),nosniff:health.headers.get('x-content-type-options'),
      ready:readiness.status,body:await readiness.json()};
  });
  await info.attach('health-probe',{body:JSON.stringify(actual,null,2),contentType:'application/json'});
  expect(actual.health).toBe(200);expect(actual.requestId).toBeTruthy();expect(actual.nosniff).toBe('nosniff');
  expect(actual.ready).toBe(503);expect(actual.body.reason).toBe('schema_not_verified');
});
