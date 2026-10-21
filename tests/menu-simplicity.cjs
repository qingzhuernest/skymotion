/** Menu collapse is structural; layout editing uses one progressively disclosed entry. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8999/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    for (const route of ['lab.html', 'diagrams.en.html', 'analemma.html', 'space/index.en.html']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () => window.SkyCustomization && !document.querySelector('.layout-launch').disabled,
      );
      const grip = page.locator('.motion-menu-grip');
      await grip.waitFor({ state: 'visible' });
      await page.locator('.layout-launch').click();
      for (const section of ['references', 'conditions', 'references']) {
        await page.locator(`[data-rail-section="${section}"]`).click();
        assert(await grip.isVisible(), route + ': collapse survives sidebar changes');
        const position = await grip.boundingBox();
        await grip.evaluate((node) => (node.closest('aside, .side').scrollTop = 10000));
        const after = await grip.boundingBox();
        assert(
          Math.abs(position.y - after.y) < 2,
          route + ': collapse remains pinned when scrolling',
        );
        await grip.click();
        await page.waitForFunction(() => document.querySelector('.motion-rail-collapsed'));
        await page.locator('.motion-menu-edge').click();
        await page.waitForFunction(() => !document.querySelector('.motion-rail-collapsed'));
        assert(await grip.isVisible());
      }
      if (route.startsWith('diagrams')) {
        await page.locator('[data-diagram=solarCompare]').click();
        await page.waitForFunction(() => skyWorkspacePresentation.active);
        const toolbar = page.locator('.workspace-toolbar');
        assert.equal(await toolbar.locator('button:visible').count(), 1);
        const barBox = await toolbar.boundingBox();
        const tabsBox = await page.locator('.ui-viewbar').boundingBox();
        assert(
          Math.abs(barBox.y - tabsBox.y) < 2,
          'Layout entry shares the diagram navigation row',
        );
        assert.equal(await page.locator('.workspace-presets').isVisible(), false);
        await require('./diagram-test-helpers.cjs').layoutAction(page, 'four');
        assert.equal(await page.locator('.ui-diagram-card:visible').count(), 4);
        await page.locator('[data-word=options]').click();
        assert(await page.locator('[data-word=undo]').isVisible());
        await page.keyboard.press('Escape');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForFunction(
          () => document.querySelector('#uiParametersButton').getBoundingClientRect().width > 0,
        );
        await page.locator('[data-word=options]').click();
        assert(await page.locator('[data-word=two]').isVisible());
        await page.locator('[data-word=two]').click();
        await page.keyboard.press('Escape');
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
        );
      }
      await page.locator('.layout-launch').click();
      if (!route.startsWith('diagrams')) assert(await grip.isVisible());
      assert.deepEqual(errors, []);
      await page.close();
      console.log('PASS fixed collapse and compact menu: ' + route);
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
