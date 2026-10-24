/** Verify the shared Material contract across application, reading and embedded routes. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(
  /\/?$/,
  '/',
);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-angle=swiftshader'],
  });
  try {
    for (const [route, width] of [
      ['lab.html', 1280],
      ['lab.en.html', 390],
      ['diagrams.html', 960],
      ['analemma.en.html', 1280],
      ['sundial.html', 390],
      ['space/index.html', 1280],
      ['space/index.en.html', 390],
      ['lunar/index.html', 960],
      ['docs.html', 1280],
      ['guide.en.html', 390],
      ['development-guide.html', 1280],
      ['contact.html', 390],
      ['index.html', 1280],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height: 960 },
        hasTouch: width < 760,
        isMobile: width < 760,
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base + route);
      await page.waitForFunction(() =>
        document.documentElement.hasAttribute('data-fonts-ready'),
      );
      if (await page.locator('.document-entrance').count()) {
        await page.locator('.entrance-continue').click();
        await page.locator('.document-entrance').waitFor({ state: 'detached' });
      }
      const result = await page.evaluate(() => {
        const css = getComputedStyle(document.body);
        return {
          primary: css.getPropertyValue('--md-sys-color-primary').trim(),
          accent: css.getPropertyValue('--design-primary').trim(),
          shape: css.getPropertyValue('--md-sys-shape-corner-full').trim(),
          font: css.getPropertyValue('--design-font').trim(),
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      });
      assert.equal(
        result.primary,
        result.accent,
        route + ' keeps the original palette through Material roles',
      );
      assert.equal(result.shape, '999px');
      assert.match(result.font, /SkyMotion Interface/);
      assert.equal(result.overflow, false, route + ' horizontal overflow');
      if (route.startsWith('lab.')) {
        await page.locator('#observationBody').selectOption('moon');
        await page.waitForFunction(() => state.body === 'moon');
        if (width < 760) await require('./diagram-test-helpers.cjs').openDrawer(page);
        await page.locator('[data-rail-section=views]').click();
        assert.equal(await page.locator('.workbench-viewpoints [data-view]').count(), 4);
        assert.match(
          await page.locator('[data-view=top]').innerText(),
          route.includes('.en') ? /Azimuth plan view/ : /俯视方位/,
        );
        const geometry = await page
          .locator('.workbench-viewpoints button')
          .evaluateAll((nodes) =>
            nodes.map((n) => ({
              x: n.getBoundingClientRect().x,
              y: n.getBoundingClientRect().y,
            })),
          );
        assert(
          geometry.every((n) => Math.abs(n.x - geometry[0].x) < 1),
          'Viewpoints remain a single vertical list',
        );
        await page.locator('[data-view=horizon]').click();
        await page.waitForFunction(
          () => state.view === 'horizon' && uiWorkspace.selected === 'skyPanel',
        );
      }
      await page.screenshot({
        path:
          'tests/artifacts/material-' + route.replaceAll('/', '-') + '-' + width + '.png',
      });
      assert.deepEqual(errors, [], route);
      await page.close();
    }
    const immediate = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await immediate.goto(base + 'lab.html');
    await immediate.waitForFunction(
      () => window.SkyCustomization && !document.querySelector('.layout-launch').disabled,
    );
    await immediate.locator('.layout-launch').click();
    await immediate.evaluate(() => {
      SkyWorkbenchMenu.select('skyPanel');
      skyWorkspacePresentation.addView('chartPanel');
    });
    await immediate.evaluate(() => {
      const select = document.getElementById('observationBody');
      select.value = 'moon';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      if (!document.getElementById('bodyTitle').textContent.includes('月球'))
        throw Error('Body UI must switch before the change handler returns');
      SkySceneBuilder.open({ kind: 'rod' });
    });
    await immediate.locator('.sb-placement-actions button').first().click();
    assert.equal(
      await immediate.evaluate(() => SkySceneBuilder.read().objects.length),
      1,
    );
    await immediate.close();
    console.log(
      'PASS Material roles, preserved accent, typography, nested viewpoints, native body selection and responsive layouts across 13 application/document/embedded route variants',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
