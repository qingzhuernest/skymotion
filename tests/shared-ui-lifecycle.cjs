/** Regression for focus across the responsive parameter drawer and a locale click during dictionary startup. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8997/').replace(/\/?$/, '/');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-gpu', '--use-angle=swiftshader'],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(base + 'lab.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('#uiParametersButton').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'uiDrawerClose');
    await page.setViewportSize({ width: 1280, height: 960 });
    await page.waitForFunction(() =>
      document.activeElement.matches('.motion-menu-edge, .motion-menu-grip'),
    );
    assert.equal(await page.locator('#uiParameterDrawer').evaluate((dialog) => dialog.open), false);
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('[inert]')), false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => !document.querySelector('#uiParametersButton').hidden);
    await page.locator('#uiParametersButton').click();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#uiParameterDrawer').open);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'uiParametersButton');

    const locale = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await locale.route('**/language-data.js*', (route) => route.abort());
    await locale.route('**/i18n-*.json*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });
    await locale.goto(base + 'lab.en.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await locale.locator('.language-toggle').waitFor({ state: 'visible' });
    assert.equal(await locale.evaluate(() => !!window.skyEnglishDictionary), false);
    await locale.locator('.language-toggle').click();
    await locale.waitForFunction(() => document.documentElement.lang === 'zh-CN', null, {
      timeout: 30000,
    });
    assert.equal(await locale.locator('.language-toggle').textContent(), 'English');
    console.log(
      'PASS responsive drawer focus, Escape restoration, and locale toggle during dictionary startup',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
