/** Keep the shorter playback panel usable in both scientific contexts. */
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
    for (const width of [1440, 960, 390, 320]) {
      const page = await browser.newPage({
        viewport: { width, height: 960 },
        hasTouch: width < 760,
        isMobile: width < 760,
      });
      await page.goto(base + 'lab.html');
      await page.waitForFunction(
        () => typeof state !== 'undefined' && document.querySelector('#timeWorkbench'),
      );
      assert.equal(await page.locator('#observationBody select').count(), 0);
      for (const body of ['sun', 'moon']) {
        const choice = page.locator('button[data-body=' + body + ']');
        await choice.click();
        await page.waitForFunction((body) => state.body === body, body);
        assert.equal(await choice.getAttribute('aria-pressed'), 'true');
        const geometry = await page.locator('#timeWorkbench').evaluate((root) => {
          const rect = root.getBoundingClientRect();
          const controls = [...root.querySelectorAll('input,button')]
            .filter((n) => n.checkVisibility())
            .map((n) => {
              const b = n.getBoundingClientRect();
              return {
                id: n.id,
                x: b.x,
                y: b.y,
                right: b.right,
                bottom: b.bottom,
                w: b.width,
                h: b.height,
              };
            });
          return {
            height: rect.height,
            inside: controls.every(
              (b) =>
                b.x >= rect.x - 1 &&
                b.right <= rect.right + 1 &&
                b.y >= rect.y - 1 &&
                b.bottom <= rect.bottom + 1,
            ),
            controls,
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        assert(
          geometry.height <= (width > 760 ? 150 : 222),
          JSON.stringify({ width, body, geometry }),
        );
        assert(geometry.inside, JSON.stringify({ width, body, geometry }));
        assert.equal(geometry.overflow, false);
        if (width < 760)
          assert(
            geometry.controls.every((b) => b.h >= 48),
            JSON.stringify(geometry),
          );
        const previous = await page.evaluate(() => state.time);
        await page.locator('#workbenchTimeForward').click();
        assert.equal(await page.evaluate(() => state.time), previous + 5);
        await page.locator('#workbenchTimeBack').click();
        assert.equal(await page.evaluate(() => state.time), previous);
        await page.locator('#workbenchClockInput').fill('09:25');
        await page.locator('#workbenchClockInput').press('Tab');
        await page.waitForFunction(() => state.time === 565);
        const first = await page
          .locator('.workbench-main > :not([hidden])')
          .first()
          .getAttribute('id');
        assert.equal(
          first,
          body === 'moon' ? 'workbenchDatePanel' : 'workbenchClockPanel',
        );
      }
      await page.locator('button[data-body=moon]').focus();
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(() => state.body === 'sun');
      await page.evaluate(() => {
        state.time = 1440;
        render();
      });
      assert.equal(await page.locator('#workbenchClockText').innerText(), '24:00');
      assert.equal(await page.locator('#workbenchClockInput').isVisible(), false);
      await page.close();
    }
    console.log(
      'PASS compact playback geometry, 48px touch targets, direct/keyboard body switching, date priority, five-minute steps, exact clock and 24:00',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
