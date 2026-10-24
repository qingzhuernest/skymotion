/** Keep the workbench in one compact header and 3D comparison in its view menu. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(
  /\/?$/,
  '/',
);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  try {
    for (const width of [1440, 960, 390, 320])
      for (const language of ['zh', 'en']) {
        const page = await browser.newPage({
          viewport: { width, height: 960 },
          hasTouch: width < 760,
          isMobile: width < 760,
        });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(
          base + 'lab' + (language === 'en' ? '.en' : '') + '.html?lang=' + language,
        );
        await page.waitForFunction(
          () =>
            document.querySelector('.workbench-header .ui-heading') &&
            document.documentElement.hasAttribute('data-fonts-ready'),
        );
        const boxes = await page.evaluate(() => {
          const rect = (selector) => {
            const r = document.querySelector(selector).getBoundingClientRect();
            return {
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              bottom: r.bottom,
              right: r.right,
            };
          };
          return {
            bar: rect('.workbench-header'),
            heading: rect('.ui-heading'),
            grid: rect('.ui-grid'),
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        assert.equal(boxes.overflow, false, JSON.stringify({ width, language, boxes }));
        assert(
          boxes.bar.height <= (width > 760 ? 66 : 112),
          JSON.stringify({ width, language, boxes }),
        );
        assert(boxes.heading.right <= width && boxes.heading.x >= 0);
        assert(
          boxes.grid.y <= boxes.bar.bottom + 24,
          'No second heading row remains inside the canvas shell',
        );
        assert.equal(await page.locator('.ui-shell > .ui-heading').count(), 0);
        if (width > 760) {
          const nav = await page.locator('.page-nav').boundingBox();
          assert(
            boxes.heading.right <= nav.x + 1,
            'Observation identity precedes main navigation',
          );
        }
        assert.equal(await page.locator('.body-switch button').count(), 2);
        assert.equal(await page.locator('.ui-diagram-card-head [data-view]').count(), 0);
        assert.equal(await page.locator('#workbenchViews [data-view]').count(), 4);
        assert.equal(
          await page.locator('.workspace-tabs').isVisible(),
          false,
          'A single diagram must not show combination tabs',
        );
        const navigation = await page.locator('.page-nav a').allTextContents();
        await page.locator('button[data-body=moon]').click();
        await page.waitForFunction(() => state.body === 'moon');
        await page.waitForFunction(
          () =>
            getComputedStyle(document.querySelector('.body-switch [aria-pressed=true]'))
              .borderTopLeftRadius === '999px',
        );
        const segmentShape = await page.locator('.body-switch').evaluate((group) => {
          const style = getComputedStyle(group);
          const first = getComputedStyle(group.firstElementChild);
          return {
            border: style.borderTopWidth,
            gap: style.columnGap,
            innerCorner: first.borderTopRightRadius,
          };
        });
        assert.deepEqual(
          segmentShape,
          { border: '0px', gap: '2px', innerCorner: '8px' },
          'Expressive connected group: separate surfaces, small inner corners and no shared outline',
        );
        assert.deepEqual(await page.locator('.page-nav a').allTextContents(), navigation);
        await page.screenshot({
          path: `tests/artifacts/workbench-header-context-${width}-${language}.png`,
        });
        if (width <= 760) await require('./diagram-test-helpers.cjs').openDrawer(page);
        await page.locator('[data-rail-section=views]').click();
        const compare = page.locator('#workbenchViews .ui-linked-toggle');
        assert(await compare.isVisible());
        assert.equal(
          await compare.textContent(),
          language === 'en' ? '3D comparison' : '三维对照',
        );
        assert.equal(await page.locator('.ui-heading .ui-linked-toggle').count(), 0);
        if (width === 1440 && language === 'zh') {
          await compare.click();
          await page.waitForFunction(() => SolarSpaceLabCompare.enabled);
          assert.equal(await compare.getAttribute('aria-pressed'), 'true');
          await compare.click();
          await page.waitForFunction(() => !SolarSpaceLabCompare.enabled);
        }
        await page.screenshot({
          path: `tests/artifacts/workbench-header-${width}-${language}.png`,
        });
        assert.deepEqual(errors, []);
        await page.close();
      }
    console.log(
      'PASS compact shared header and stable main menu at 1440/960/390/320px in both languages; 3D control in Views & layout with working on/off',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
