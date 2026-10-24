/** Verify the shared Material contract across application, reading and embedded routes. */
const assert = require('node:assert/strict');
const { controlContrast } = require('./material-test-helpers.cjs');
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
      ['lunar/index.en.html', 390],
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
      assert.match(
        result.font,
        route.includes('.en.') ? /SkyMotion Charter/ : /SkyMotion Reading/,
      );
      assert.equal(result.overflow, false, route + ' horizontal overflow');
      if (route.startsWith('lunar/')) {
        const mode = page.locator('.lunar-mode [data-mode=surface]');
        await mode.click();
        await page.waitForFunction(
          () =>
            document
              .querySelector('.lunar-mode [data-mode=surface]')
              .getAttribute('aria-pressed') === 'true',
        );
        assert.equal(await mode.getAttribute('aria-pressed'), 'true');
        await page.locator('.lunar-mode [data-mode=orbit]').click();
        if (width < 760) {
          await page.locator('[data-lunar-view=orbit]').click();
          await page.locator('[data-lunar-view=sky]').click();
        }
        for (const id of ['orbitAngle', 'phaseAngle']) {
          assert(
            await page.locator('#' + id).evaluate((node) => node.labels.length > 0),
            id + ' keeps a label independent of the adjacent output element',
          );
        }
        for (const id of ['resetLook', 'followEarth']) {
          const control = page.locator('#' + id);
          await page.keyboard.press('Tab');
          await control.focus();
          assert(
            (await control.evaluate(controlContrast, 'focus')) >= 3,
            id + ' has a contrasting keyboard focus outline on its dark surface',
          );
          for (const state of ['normal', 'hover', 'pressed']) {
            if (state === 'hover') await control.hover();
            if (state === 'pressed') await page.mouse.down();
            try {
              assert(
                (await control.evaluate(controlContrast)) >= 4.5,
                id + ' remains readable in ' + state + ' state on its dark surface',
              );
            } finally {
              if (state === 'pressed') await page.mouse.up();
            }
          }
        }
      }
      if (route.startsWith('space/') && width < 760) {
        const target = await page.locator('#reset').boundingBox();
        assert(target.width >= 48 && target.height >= 48, 'Touch reset target');
      }
      if (route.startsWith('lab.')) {
        await page.locator('button[data-body=moon]').click();
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
        if (width < 760) {
          await require('./diagram-test-helpers.cjs').closeDrawer(page);
          await page.setViewportSize({ width: 320, height: 960 });
          await page.locator('#workbenchDate').click();
          await page.locator('.site-calendar').evaluate(async (dialog) => {
            await Promise.all(
              dialog
                .getAnimations()
                .map((animation) => animation.finished.catch(() => {})),
            );
          });
          const dates = await page
            .locator('.site-calendar [data-date]')
            .evaluateAll((nodes) =>
              nodes.map((node) => {
                const bounds = node.getBoundingClientRect();
                return { width: bounds.width, height: bounds.height };
              }),
            );
          assert(dates.length > 0);
          assert(dates.every((date) => date.width >= 40 && date.height >= 40));
          const shift = await page
            .locator('.site-calendar [data-shift="-1"]')
            .boundingBox();
          assert(shift.width >= 48 && shift.height >= 48);
          await page.keyboard.press('Escape');
        }
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
      document.querySelector('button[data-body=moon]').click();
      if (document.body.dataset.body !== 'moon')
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
      'PASS Material roles, preserved accent, typography, nested viewpoints, direct body switching, lunar header hit targets and dark control contrast across 14 application/document/embedded route variants',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
