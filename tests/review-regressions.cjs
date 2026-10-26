/** Regressions for review 9913064: font deadlines, calendar drafts/focus and explicit locales. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader'] });
  try {
    const stalled = await browser.newPage();
    const held = [];
    await stalled.route('**/*.woff2', route => { held.push(route); });
    await stalled.goto(base + 'contact.en.html', { waitUntil: 'domcontentloaded' });
    await stalled.waitForFunction(() => document.documentElement.hasAttribute('data-font-load-error'), null, { timeout: 12000 });
    assert.equal(await stalled.locator('body').evaluate(e => getComputedStyle(e).visibility), 'visible');
    await stalled.locator('.font-load-notice').waitFor({state:'visible'});
    await stalled.unroute('**/*.woff2');
    await Promise.all(held.map(route => route.abort().catch(() => {})));
    await stalled.locator('.font-load-notice button').click();
    await stalled.waitForFunction(() => document.documentElement.hasAttribute('data-fonts-ready'), null, { timeout: 12000 });
    assert.equal(await stalled.locator('.font-load-notice').count(),0);
    await stalled.close();
    console.log('PASS stalled fonts reveal the application and retry recovers the chosen font');

    const locale = await browser.newPage();
    await locale.addInitScript(() => { if (!sessionStorage.getItem('review-locale')) { localStorage.setItem('skymotion-language','zh'); sessionStorage.setItem('review-locale','1'); } });
    await locale.goto(base + 'lab.en.html?lang=en');
    await locale.waitForSelector('html[data-fonts-ready]');
    await locale.locator('.page-nav a').nth(2).click();
    await locale.waitForSelector('html[data-fonts-ready]');
    assert.equal(await locale.locator('html').getAttribute('lang'),'en');
    await locale.close();
    console.log('PASS explicit English selection survives navigation despite an earlier Chinese preference');

    for (const width of [390,960]) {
      const page = await browser.newPage({viewport:{width,height:1000}});
      await page.goto(base + 'lab.en.html');
      await page.waitForSelector('html[data-fonts-ready]');
      const field = page.locator('#workbenchDate');
      const original = await field.inputValue();
      await field.click();
      await page.locator('[data-months]').click();
      await page.locator('.site-calendar [data-month="7"]').click();
      await page.locator('[data-confirm]').click();
      assert.equal(await field.inputValue(),'2026-07-21');
      assert.equal(await page.evaluate(() => state.date),'2026-07-21');
      await page.goBack();
      assert.equal(await field.inputValue(),original);
      await page.locator('.site-calendar').waitFor({state:'hidden'});
      await field.click();
      await page.locator('#siteCalendarYear').click();
      await page.locator('[data-shift="1"]').click();
      await page.locator('[data-months]').click();
      assert.equal(await page.locator('#siteCalendarTitle').innerText(),'June 2026');
      await page.locator('[data-cancel]').click();
      await page.locator('.site-calendar').waitFor({state:'hidden'});
      await field.click();
      await page.locator('#siteCalendarYear').click();
      await page.locator('.site-calendar [data-year="2024"]').click();
      await page.locator('[data-confirm]').click();
      assert.equal(await field.inputValue(),'2024-06-21');
      await page.locator('.site-calendar').waitFor({state:'hidden'});
      await field.click();
      await page.locator('[data-months]').click();
      await page.locator('.site-calendar [data-month="2"]').click();
      await page.locator('[data-date="2024-02-29"]').click();
      await page.locator('#siteCalendarYear').click();
      await page.locator('.site-calendar [data-year="2025"]').click();
      await page.locator('[data-confirm]').click();
      assert.equal(await field.inputValue(),'2025-02-28');
      await page.locator('.site-calendar').waitFor({state:'hidden'});
      await field.focus();
      await page.keyboard.press('Enter');
      await page.locator('[data-shift="1"]').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.shift),'1');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#siteCalendarTitle').innerText(),'April 2025');
      await page.keyboard.press('Escape');
      await page.locator('.site-calendar').waitFor({state:'hidden'});
      assert.equal(await field.inputValue(),'2025-02-28');
      await page.close();
      console.log(`PASS ${width}px month/year draft, leap-day clamp, undo, keyboard focus and cancel`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
