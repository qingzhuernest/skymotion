/** Regression for first-open height measurement, reversal and reduced motion. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
    ],
  });
  try {
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      for (const path of ['lab.html', 'analemma.html', 'diagrams.html']) {
        await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.waitForSelector('.motion-disclosure', { state: 'attached' });
        const result = await page.evaluate(async () => {
          // The drawer can be closed on mobile. Measurement needs visible content.
          const drawer = document.querySelector('#uiParameterDrawer');
          if (drawer && !drawer.open) drawer.showModal();
          const folds = [...document.querySelectorAll('.motion-disclosure')].filter(
            (fold) => fold.getBoundingClientRect().width > 0,
          );
          const measurements = [];
          for (const fold of folds) {
            const summary = fold.querySelector(':scope > summary');
            const settle = async () => {
              await Promise.all(
                fold.getAnimations().map((animation) => animation.finished.catch(() => {})),
              );
              await Promise.resolve();
            };
            fold.open = false;
            const closed = fold.getBoundingClientRect().height;
            summary.click();
            const animation = fold
              .getAnimations()
              .find((item) => item.effect.getKeyframes().some((frame) => frame.height));
            const target = animation
              ? parseFloat(animation.effect.getKeyframes().at(-1).height)
              : NaN;
            await settle();
            const expanded = fold.getBoundingClientRect().height;
            const firstOpen = fold.open && !fold.style.height && !fold.style.overflow;
            summary.click();
            await settle();
            const closedAgain =
              !fold.open && Math.abs(fold.getBoundingClientRect().height - closed) < 2;
            // A close halfway through a first opening must win over its callback.
            summary.click();
            await new Promise((resolve) => setTimeout(resolve, 60));
            summary.click();
            await settle();
            const reversed = !fold.open && !fold.style.height && !fold.style.overflow;
            measurements.push({
              id: fold.id,
              closed,
              target,
              expanded,
              firstOpen,
              closedAgain,
              reversed,
            });
            // Leave parents open so nested disclosures can be measured too.
            fold.open = true;
          }
          return measurements;
        });
        assert(result.length > 0, `${path}: visible disclosures`);
        for (const fold of result) {
          assert(
            Math.abs(fold.target - fold.expanded) < 2,
            `${path}/${fold.id}: first target ${fold.target} vs ${fold.expanded}`,
          );
          assert(
            fold.firstOpen && fold.closedAgain && fold.reversed,
            `${path}/${fold.id}: state/cleanup`,
          );
        }
        assert(
          result.some((fold) => fold.expanded > fold.closed + 30),
          `${path}: meaningful expansion`,
        );
        console.log(
          `PASS ${path} ${width}px: ${result.length} first openings, closing and reversal`,
        );
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const reduced = await page
        .locator('.motion-disclosure')
        .first()
        .evaluate((fold) => {
          fold.open = false;
          fold.querySelector(':scope > summary').click();
          return fold.open && !fold.style.height && fold.getAnimations().length === 0;
        });
      assert(reduced, 'reduced motion opens immediately');
      assert.deepEqual(errors, [], 'no browser exceptions');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
