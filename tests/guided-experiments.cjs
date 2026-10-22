/** Goal-driven experiments, independent scrubbing, leap years and gesture history. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8999/').replace(/\/?$/, '/');
const helpers = require('./diagram-test-helpers.cjs');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    for (const [width, scale, lang] of [
      [1366, 1.25, ''],
      [1280, 1.5, '.en'],
      [390, 1, '.en'],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height: width < 760 ? 844 : 768 },
        deviceScaleFactor: scale,
        hasTouch: width < 760,
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(base + 'lab' + lang + '.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () => window.SkyCustomization && !document.querySelector('.layout-launch').disabled,
      );
      const baseline = await page.evaluate(() => [state.lat, state.lon, state.date, state.time]);
      await page.locator('.layout-launch').click();
      await helpers.openWorkbench(page);
      await page.locator('[data-dt-view=library]').click();
      assert.equal(await page.locator('.dt-advanced').getAttribute('open'), null);
      await page.locator('[data-experiment-goal]').selectOption('places');
      await page.locator('#dt-add-city').selectOption('-33.9,151.2');
      await page.locator('.dt-recipe').click();
      assert.equal(await page.evaluate(() => state.observerTimeBasis), 'utc');
      assert.equal(await page.evaluate(() => SkyDiagramTools.comparisons.list()[0].lat), -33.9);
      const range = page.locator('.dt-fields [data-scrub=lat]');
      if (width >= 1000)
        assert(
          await range.evaluate((node) => {
            const field = node.getBoundingClientRect(),
              pane = node.closest('.dt-inspector').getBoundingClientRect();
            return field.top >= pane.top && field.bottom <= pane.bottom;
          }),
          'Coordinate sliders are immediately visible after creating a city',
        );
      const original = await page.evaluate(() => SkyDiagramTools.comparisons.list()[0]);
      await range.evaluate((node) => {
        node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        for (const value of ['-20', '-10', '10']) {
          node.value = value;
          node.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForFunction(() => SkyDiagramTools.comparisons.list()[0].lat === 10);
      assert.equal(await page.locator('.dt-fields [data-field=lat]').inputValue(), '10');
      await range.dispatchEvent('change');
      assert.match(
        await page.locator('.dt-fields [data-field=label]').inputValue(),
        lang ? /Custom location/ : /自定义地点/,
      );
      await page.locator('.dt-undo').click();
      assert.deepEqual(
        await page.evaluate(() => SkyDiagramTools.comparisons.list()[0]),
        original,
        'one undo restores the whole drag',
      );
      const slider = page.locator('.dt-fields [data-scrub=lat]');
      await slider.focus();
      await slider.evaluate((node) => {
        node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        node.value = '25';
        node.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForFunction(() => SkyDiagramTools.comparisons.list()[0].lat === 25);
      await slider.press('Escape');
      assert.equal(
        await page.evaluate(() => SkyDiagramTools.comparisons.list()[0].lat),
        original.lat,
      );
      await slider.evaluate((node) => {
        node.value = '40';
        node.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      assert.equal(
        await page.evaluate(() => SkyDiagramTools.comparisons.list()[0].lat),
        original.lat,
        'continued pointer input after Escape cannot reapply the cancelled drag',
      );
      await slider.dispatchEvent('pointerup');
      await page.locator('[data-city-edit]').selectOption('51.5,-0.1');
      await page.locator('.dt-fields [data-scrub=lat]').focus();
      await page.keyboard.press('Control+s');
      assert.equal(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem('sky-diagram-tools-v1:lab-sky:sun')).objects[0].lat,
        ),
        51.5,
        'Save shortcut works while a slider has focus',
      );
      assert.equal(await page.evaluate(() => SkyDiagramTools.comparisons.list()[0].lat), 51.5);
      await helpers.openWorkbench(page);
      await page.locator('[data-dt-view=library]').click();
      await page.locator('[data-experiment-goal]').selectOption('times');
      await page.locator('.dt-recipe').click();
      assert.deepEqual(
        await page.evaluate(() =>
          SkyDiagramTools.comparisons
            .list()
            .filter((o) => o.type === 'time')
            .map((o) => o.time),
        ),
        [540, 900],
      );
      await page.locator('.dt-undo').click();
      assert.equal(
        await page.evaluate(
          () => SkyDiagramTools.comparisons.list().filter((o) => o.type === 'time').length,
        ),
        0,
      );
      await helpers.addTool(page, 'curve');
      const date = page.locator('.dt-fields [data-field=date]');
      await date.fill('2024-02-29');
      await date.press('Tab');
      const day = page.locator('.dt-fields [data-scrub=date]');
      assert.equal(
        Number(await day.getAttribute('max')) - Number(await day.getAttribute('min')) + 1,
        366,
      );
      await day.focus();
      await day.press('ArrowRight');
      assert.equal(await date.inputValue(), '2024-03-01');
      assert.deepEqual(
        await page.evaluate(() => [state.lat, state.lon, state.date, state.time]),
        baseline,
      );
      await helpers.openLibrary(page);
      await page.locator('[data-build-kind=rod]').click();
      await page.locator('.sb-placement-actions button').first().click();
      if (width < 760) await page.locator('.sb-mobile-props').click();
      const height = page.locator('.sb-fields [data-scrub=height]');
      await height.waitFor({ state: 'visible' });
      await height.focus();
      await height.press('ArrowRight');
      assert.equal(await page.locator('.sb-fields [data-field=height]').inputValue(), '1.75');
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      assert.deepEqual(errors, []);
      await page.screenshot({ path: `tests/artifacts/guided-${width}-${scale}.png` });
      await page.close();
      console.log(
        'PASS guided goals, independent sliders, grouped undo, Escape, city picker, leap calendar, ground objects and scale ' +
          scale,
      );
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
