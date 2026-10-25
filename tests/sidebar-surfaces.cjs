/** Shared filled surface geometry for results and disclosure menus. */
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
    for (const [width, language] of [
      [1440, 'zh'],
      [960, 'en'],
      [390, 'zh'],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height: 960 },
        hasTouch: width < 760,
        isMobile: width < 760,
      });
      await page.goto(base + 'lab' + (language === 'en' ? '.en' : '') + '.html');
      await page.waitForFunction(() => document.querySelector('.ui-parameters .metrics'));
      if (width < 760) await require('./diagram-test-helpers.cjs').openDrawer(page);
      for (const open of [false, true]) {
        const result = await page.evaluate((open) => {
          const menus = [
            ...document.querySelectorAll(
              '.ui-parameters :is(.menu-section,.workbench-more,.analemma-advanced,.ui-information,.ui-model-details)',
            ),
          ];
          for (const menu of menus) menu.open = open;
          const rect = (n) => n.getBoundingClientRect();
          const cards = [...document.querySelectorAll('.ui-parameters .metrics article')];
          return {
            metricsHeight: document
              .querySelector('.ui-parameters .metrics')
              .getBoundingClientRect().height,
            cards: cards.map((n) => {
              const r = rect(n),
                s = getComputedStyle(n),
                v = n.querySelector('strong'),
                b = rect(v);
              return {
                width: r.width,
                x: r.x,
                y: r.y,
                center: Math.abs(b.x + b.width / 2 - r.x - r.width / 2),
                padding: s.padding,
                font: getComputedStyle(v).fontSize,
                fill: s.backgroundColor,
                border: s.borderTopWidth,
              };
            }),
            menus: menus
              .filter((n) => n.checkVisibility())
              .map((n) => {
                const a = getComputedStyle(n),
                  b = getComputedStyle(n.querySelector('summary'));
                return {
                  outer: parseFloat(a.borderTopLeftRadius),
                  inner: parseFloat(b.borderTopLeftRadius),
                  fill: a.backgroundColor,
                  headingFill: b.backgroundColor,
                  border: a.borderTopWidth,
                };
              }),
          };
        }, open);
        assert.equal(result.cards.length, 4);
        assert(
          result.metricsHeight <= 240,
          'Metrics must leave room for the parameter menu: ' + result.metricsHeight,
        );
        assert(
          Math.abs(result.cards[0].y - result.cards[1].y) < 1 &&
            Math.abs(result.cards[2].y - result.cards[3].y) < 1,
          'Two aligned metric rows',
        );
        assert(
          result.cards.every((c) => c.center < 1 && c.border === '1px'),
          JSON.stringify(result),
        );
        assert(
          result.cards.every(
            (c, index) =>
              Math.abs(c.x - result.cards[index % 2].x) < 1 &&
              Math.abs(c.width - result.cards[0].width) < 1 &&
              c.font === result.cards[0].font &&
              c.padding === result.cards[0].padding &&
              c.fill === result.cards[0].fill,
          ),
          JSON.stringify(result),
        );
        assert(
          result.menus.every(
            (m) =>
              m.outer - m.inner === 1 && m.fill === m.headingFill && m.border === '1px',
          ),
          JSON.stringify(result),
        );
      }
      if (width === 1440) {
        await page.locator('button[data-body=moon]').click();
        await page.waitForFunction(() => state.body === 'moon');
        assert.equal(
          await page.locator('.ui-metric-notes dt').first().innerText(),
          await page.locator('#altLabel').innerText(),
        );
        assert(
          await page.locator('.ui-model-details #altNote').isVisible(),
          'Detailed readout notes remain available in the expanded explanation',
        );
      }
      await page.screenshot({
        path: `tests/artifacts/sidebar-surfaces-${width}-${language}.png`,
      });
      await page.close();
    }
    const page = await browser.newPage();
    await page.goto(base + 'index.html');
    assert.equal(
      await page.locator('#startOpening,#skipOpening,.welcome-opening-actions').count(),
      0,
    );
    console.log(
      'PASS centered equal-width result cards, shared typography/padding/fill, continuous nested radii in open/closed menus and no opening buttons',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
