/** Escape closes the 3D observation disclosure before leaving immersive mode. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8997/').replace(/\/?$/, '/');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base + 'space/');
    await page.waitForFunction(() => typeof window.spaceState === 'function');

    await page.locator('#spaceImmersive').click();
    await page.waitForFunction(() => document.body.classList.contains('space-immersive'));
    await page.locator('#sceneTools summary').click();
    assert.equal(await page.locator('#sceneTools').evaluate((details) => details.open), true);

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#sceneTools').open);
    assert.equal(
      await page.locator('body').evaluate((body) => body.classList.contains('space-immersive')),
      true,
      'Escape first closes the scene disclosure while retaining immersive mode',
    );
    assert.equal(await page.locator('#spaceImmersive').getAttribute('aria-pressed'), 'true');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.body.classList.contains('space-immersive'));
    assert.equal(await page.locator('#spaceImmersive').getAttribute('aria-pressed'), 'false');
    assert.equal(
      await page.evaluate(() => document.activeElement?.id),
      'spaceImmersive',
      'exiting immersive mode restores focus to its toggle',
    );
    assert.deepEqual(errors, []);

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await mobileContext.newPage();
    mobile.on('pageerror', (error) => errors.push(error.message));
    await mobile.goto(base + 'space/');
    await mobile.waitForFunction(() => typeof window.spaceState === 'function');
    await mobile.locator('#stage').scrollIntoViewIfNeeded();
    const canvas = await mobile.locator('#stage canvas:not(.dt-overlay)').boundingBox();
    assert(canvas && canvas.width > 100 && canvas.height > 100, '3D canvas is available for touch');
    // Planet labels are separate buttons; camera gestures start on empty canvas.
    const emptyCanvasPoint = () =>
      mobile.evaluate(() => {
        const surface = document.querySelector('#stage canvas:not(.dt-overlay)');
        const bounds = surface.getBoundingClientRect();
        for (const row of [0.25, 0.4, 0.65, 0.8]) {
          for (const column of [0.5, 0.35, 0.65]) {
            const x = bounds.x + bounds.width * column;
            const y = bounds.y + bounds.height * row;
            if (
              [-65, -35, 0, 35, 65].every(
                (offset) => document.elementFromPoint(x + offset, y) === surface,
              )
            )
              return { x, y };
          }
        }
        throw new Error('No empty canvas area available for the gesture');
      });
    await mobile.waitForFunction(() => !spaceState().scheduled);
    const touch = await mobile.context().newCDPSession(mobile);
    const point = (id, x, y) => ({ id, x, y, radiusX: 5, radiusY: 5, force: 1 });
    const centerDrag = await emptyCanvasPoint();
    const start = { x: centerDrag.x - 30, y: centerDrag.y };
    const date = await mobile.evaluate(() => spaceState().date);
    const beforeDrag = await mobile.evaluate(() => spaceState().azimuth);
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [point(1, start.x, start.y)],
    });
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [point(1, start.x + 60, start.y + 12)],
    });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.waitForFunction(
      (previous) => Math.abs(spaceState().azimuth - previous) > 0.2,
      beforeDrag,
    );

    await mobile.waitForFunction(() => !spaceState().scheduled);
    const beforePinch = await mobile.evaluate(() => spaceState().distance);
    const center = await emptyCanvasPoint();
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [point(2, center.x - 35, center.y), point(3, center.x + 35, center.y)],
    });
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [point(2, center.x - 50, center.y), point(3, center.x + 50, center.y)],
    });
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [point(2, center.x - 65, center.y), point(3, center.x + 65, center.y)],
    });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.waitForFunction(
      (previous) => spaceState().distance < previous * 0.85,
      beforePinch,
    );
    assert.equal(
      await mobile.evaluate(() => spaceState().date),
      date,
      'Camera gestures retain the physical instant',
    );

    await mobileContext.close();
    assert.deepEqual(errors, []);
    console.log('PASS scene disclosure Escape order and one-finger rotate/two-finger pinch');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
