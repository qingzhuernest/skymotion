/** Small multi-view cards keep the chooser readable and actions on their own row. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const helpers = require('./diagram-test-helpers.cjs');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader'] });
  try {
    for (const suffix of ['', '.en']) {
      const page = await browser.newPage({ viewport: { width: 960, height: 1280 }, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + 'lab' + suffix + '.html');
      await page.waitForFunction(() => !!window.skyWorkspacePresentation && !!window.SkyDiagramTools);
      await page.locator('.layout-launch').click();
      await page.evaluate(() => {
        const views = ['riseSetPanel', 'chartPanel', 'skyHorizonPanel', 'skyPanel', 'contextPanel', 'solarGeometryPanel'];
        for (const id of views) skyWorkspacePresentation.addView(id);
        for (const id of skyWorkspacePresentation.views) if (!views.includes(id)) skyWorkspacePresentation.removeView(id);
      });
      await page.waitForFunction(() => skyWorkspacePresentation.views.length === 6);
      for (const viewport of [{ width: 960, height: 1280 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const sizes = await page.locator('.ui-diagram-card:visible').evaluateAll(cards => cards.map(card => {
          const head = card.querySelector('.ui-diagram-card-head'), chooser = head.querySelector('.md-choice-disclosure > summary');
          const h = head.getBoundingClientRect(), c = chooser.getBoundingClientRect();
          return { id: card.dataset.diagramCard, width: c.width, height: c.height, headHeight: h.height, nowrap: getComputedStyle(chooser).whiteSpace, inside: c.left >= h.left && c.right <= h.right + 1 };
        }));
        assert(sizes.length > 0);
        for (const size of sizes) {
          assert(size.width >= 180, JSON.stringify(size));
          assert(size.height <= 64, JSON.stringify(size));
          assert(size.headHeight <= 128, JSON.stringify(size));
          assert.equal(size.nowrap, 'nowrap');
          assert(size.inside, JSON.stringify(size));
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      }
      await page.setViewportSize({ width: 960, height: 1280 });
      const card = page.locator('[data-diagram-card=solarGeometryPanel]');
      await card.waitFor({ state: 'visible' });
      const before = await card.locator('.ui-diagram-surface').boundingBox();
      await card.locator('.md-choice-disclosure > summary').click();
      const popup = card.locator('.md-choice-panel');
      await popup.waitFor({ state: 'visible' });
      const after = await card.locator('.ui-diagram-surface').boundingBox();
      assert(Math.abs(before.height - after.height) < 1, 'opening choices does not resize the plot');
      await page.keyboard.press('Escape');
      await helpers.openWorkbench(page);
      await page.locator('.dt-head h2').waitFor({ state: 'visible' });
      assert.equal(await page.locator('.dt-history .dt-help-toggle').count(), 1);
      if (!suffix) assert.equal(await page.locator('[data-rail-section=views]').evaluate(node => { const range = document.createRange(); range.selectNodeContents(node); return new Set([...range.getClientRects()].filter(rect => rect.width > 0).map(rect => Math.round(rect.top))).size; }), 1, 'Chinese navigation label stays on one line');
      const buttons = await page.locator('.dt-tabs > [data-dt-view]:visible').evaluateAll(nodes => nodes.map(node => {
        const box = node.getBoundingClientRect(); return { width: box.width, height: box.height, text: node.textContent };
      }));
      assert(buttons.every(button => button.width >= 40 && button.height <= 60), JSON.stringify(buttons));
      await page.screenshot({ path: '/tmp/narrow-workspace-controls' + (suffix || '.zh') + '.png' });
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS six-pane tablet/phone titles, separate action rows, stable popovers and readable bilingual object controls');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
