/** Expressive range presentation stays in sync with real keyboard and state-owner updates. */
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
    for (const [route, id, width] of [
      ['lab.html', 'workbenchTime', 1440],
      ['lab.en.html', 'workbenchDay', 390],
      ['space/index.html', 'day', 1280],
      ['lunar/index.en.html', 'phaseAngle', 390],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height: 960 },
        hasTouch: width < 760,
        isMobile: width < 760,
        reducedMotion: 'reduce',
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base + route);
      await page.waitForFunction(
        (id) =>
          window.SkyMaterial &&
          document.getElementById(id)?.getBoundingClientRect().width > 0,
        id,
      );
      const slider = page.locator('#' + id);
      const before = await slider.inputValue();
      await slider.focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(
        ({ id, before }) => document.getElementById(id).value !== before,
        { id, before },
      );
      await page.waitForFunction((id) => {
        const input = document.getElementById(id),
          min = Number(input.min || 0),
          max = Number(input.max || 100);
        const expected =
          Math.round(
            Math.min(1, Math.max(0, (Number(input.value) - min) / (max - min))) * 10000,
          ) / 100;
        return (
          Math.abs(
            parseFloat(input.style.getPropertyValue('--md-range-progress')) - expected,
          ) < 0.011
        );
      }, id);
      const result = await slider.evaluate((n) => {
        const track = getComputedStyle(n, '::-webkit-slider-runnable-track'),
          thumb = getComputedStyle(n, '::-webkit-slider-thumb');
        const css = getComputedStyle(n);
        return {
          track: css.getPropertyValue('--md-sys-size-slider-track').trim(),
          handle: css.getPropertyValue('--md-sys-size-slider-handle-width').trim(),
          height: n.getBoundingClientRect().height,
          bg: track.backgroundImage,
          font: css.fontFamily,
        };
      });
      assert.equal(result.track, '16px');
      assert.equal(result.handle, '4px');
      assert(result.height >= (width < 760 ? 48 : 40));
      assert(
        result.font.includes(
          route.includes('.en.') ? 'SkyMotion Charter' : 'SkyMotion Reading',
        ),
      );
      // Dynamically inserted controls use native defaults and preserve state while painting.
      const isolated = await page.evaluate(() => {
        const n = document.createElement('input');
        n.type = 'range';
        n.min = '-10';
        n.max = '30';
        n.value = '0';
        document.body.append(n);
        SkyMaterial.updateRange(n);
        const quarter = n.style.getPropertyValue('--md-range-progress');
        n.value = '30';
        SkyMaterial.updateRange(n);
        const end = n.style.getPropertyValue('--md-range-progress');
        const value = n.value;
        n.remove();
        return { quarter, end, value };
      });
      assert.deepEqual(isolated, { quarter: '25%', end: '100%', value: '30' });
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(
      'PASS Expressive slider geometry, native keyboard interaction, value/fill synchronization, dynamic bounds, retained fonts and zero page errors across lab/3D/lunar',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
