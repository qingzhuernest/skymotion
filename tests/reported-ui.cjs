/** Reproduce the reported nested border, tall Moon pane and exclusive-choice defects. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const helpers = require('./diagram-test-helpers.cjs');
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
    for (const [width, height, language] of [
      [1440, 1000, 'zh'],
      [960, 1200, 'en'],
      [390, 844, 'zh'],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height },
        hasTouch: width < 760,
        isMobile: width < 760,
        reducedMotion: 'reduce',
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base + 'lab' + (language === 'en' ? '.en' : '') + '.html');
      await page.waitForFunction(
        () => window.SkyWorkbenchMenu && window.skyWorkspacePresentation,
      );
      const nav = await page.locator('.page-nav').evaluate((n) => ({
        links: [...n.querySelectorAll('a')].map((a) => a.getAttribute('href')),
        parent: n.parentElement.className,
      }));
      if (width < 760) await helpers.openDrawer(page);
      await page.locator('[data-rail-section=conditions]').click();
      for (const open of [false, true]) {
        const shape = await page.locator('#coordinatesMenu').evaluate((n, open) => {
          for (let p = n.parentElement; p; p = p.parentElement)
            if (p.tagName === 'DETAILS') p.open = true;
          n.open = open;
          const s = n.querySelector('summary'),
            a = getComputedStyle(n),
            b = getComputedStyle(s),
            r = n.getBoundingClientRect(),
            q = s.getBoundingClientRect();
          return {
            outer: parseFloat(a.borderTopLeftRadius),
            inner: parseFloat(b.borderTopLeftRadius),
            insetX: q.x - r.x,
            insetY: q.y - r.y,
            border: a.borderTopWidth,
          };
        }, open);
        assert.equal(shape.outer - shape.inner, 1, JSON.stringify(shape));
        assert(shape.insetX >= 0.99 && shape.insetY >= 0.99, JSON.stringify(shape));
        assert.equal(shape.border, '1px');
        if (width === 1440)
          await page.locator('#coordinatesMenu').screenshot({
            path: `tests/artifacts/reported-coordinates-${open ? 'open' : 'closed'}.png`,
          });
      }
      const surfaces = await page.evaluate(() => {
        const group = document.querySelector('.workbench-content-group');
        const settings = document
          .querySelector('#coordinatesMenu')
          .closest('.menu-section');
        return [group, settings].map((node) => {
          const card = getComputedStyle(node),
            head = getComputedStyle(node.querySelector(':scope > summary'));
          return {
            radius: card.borderTopLeftRadius,
            border: card.borderTopWidth,
            font: head.font,
            padding: head.padding,
          };
        });
      });
      assert.deepEqual(
        surfaces[0],
        surfaces[1],
        'Views and conditions share the same accordion component',
      );
      const choices = page.locator('.dt-rail-navigation');
      assert(await choices.evaluate((n) => n.classList.contains('md-connected-choice')));
      for (const kind of ['views', 'conditions']) {
        await page.locator(`[data-rail-section=${kind}]`).click();
        assert.equal(await choices.locator('[aria-selected=true]').count(), 1);
        assert.equal(
          await choices
            .locator(`[data-rail-section=${kind}]`)
            .getAttribute('aria-selected'),
          'true',
        );
      }
      const selectedChoice = choices.locator('[aria-selected=true]');
      await selectedChoice.evaluate(async (node) => {
        await Promise.all(node.getAnimations().map((a) => a.finished.catch(() => {})));
      });
      assert.equal(
        await selectedChoice.evaluate(
          (node) => getComputedStyle(node).borderTopLeftRadius,
        ),
        '999px',
      );
      assert.equal(
        await page
          .locator('.ui-parameters summary')
          .filter({ hasText: language === 'en' ? 'Spatial models' : '空间模型' })
          .count(),
        0,
      );
      await helpers.closeDrawer(page);
      for (const id of ['workbenchTimeBack', 'workbenchTimeForward']) {
        const style = await page.locator('#' + id).evaluate((n) => {
          const s = getComputedStyle(n);
          return {
            border: s.borderTopWidth,
            fill: s.backgroundColor,
            font: parseFloat(s.fontSize),
            height: n.getBoundingClientRect().height,
          };
        });
        assert.equal(style.border, '0px');
        assert.equal(style.fill, 'rgba(0, 0, 0, 0)');
        assert(style.font <= 12);
        assert(style.height >= (width < 760 ? 48 : 40));
      }
      await page.locator('button[data-body=moon]').click();
      await helpers.enterCustomization(page);
      await page.evaluate(() => {
        SkyWorkbenchMenu.select('contextPanel');
        skyWorkspacePresentation.addView('chartPanel');
      });
      await helpers.closeDrawer(page);
      if (width < 760) await page.evaluate(() => SkyWorkbenchMenu.select('contextPanel'));
      await page.waitForFunction(() => !document.querySelector('#phaseContent').hidden);
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const geometry = await page.locator('#phaseContent').evaluate((n) => {
        const r = n.getBoundingClientRect(),
          p = n.parentElement.getBoundingClientRect(),
          c = n.querySelector('#phaseOrbit').getBoundingClientRect(),
          d = n.querySelector('#phaseDisk').getBoundingClientRect();
        return {
          height: r.height,
          parent: p.height,
          canvas: c.height,
          canvasWidth: c.width,
          contentWidth: r.width,
          columns: getComputedStyle(n).gridTemplateColumns.split(' ').length,
          center: Math.abs(r.y + r.height / 2 - (p.y + p.height / 2)),
          diskWidth: d.width,
          diskHeight: d.height,
          overflow: n.scrollWidth > n.clientWidth + 1,
        };
      });
      assert(geometry.height >= geometry.parent - 24, JSON.stringify(geometry));
      assert(geometry.center < 13, JSON.stringify(geometry));
      assert(!geometry.overflow, JSON.stringify(geometry));
      assert(
        Math.abs(geometry.diskWidth - geometry.diskHeight) < 1,
        JSON.stringify(geometry),
      );
      if (geometry.columns > 1)
        assert(geometry.canvas >= geometry.height - 30, JSON.stringify(geometry));
      else
        assert(
          geometry.canvasWidth >= geometry.contentWidth - 24,
          JSON.stringify(geometry),
        );
      assert.equal(
        await page.locator('.language-nav').evaluate((n) => getComputedStyle(n).position),
        'sticky',
      );
      assert.deepEqual(
        await page.locator('.page-nav').evaluate((n) => ({
          links: [...n.querySelectorAll('a')].map((a) => a.getAttribute('href')),
          parent: n.parentElement.className,
        })),
        nav,
      );
      await page.screenshot({
        path: `tests/artifacts/reported-moon-${width}-${language}.png`,
      });
      assert.deepEqual(errors, []);
      await page.close();
    }
    const space = await browser.newPage({
      viewport: { width: 1280, height: 960 },
      reducedMotion: 'reduce',
    });
    await space.goto(base + 'space/index.html');
    await space.waitForFunction(() => typeof window.spaceState === 'function');
    const group = space.locator('.md-connected-choice:has(#singleView)');
    assert.equal(await group.locator('button').count(), 2);
    for (const id of ['compareView', 'singleView']) {
      await space.locator('#' + id).click();
      assert.equal(await group.locator('[aria-pressed=true]').count(), 1);
      assert.equal(await space.locator('#' + id).getAttribute('aria-pressed'), 'true');
    }
    assert.equal(await group.locator('.motion-selection').count(), 0);
    await space.screenshot({ path: 'tests/artifacts/reported-space-choices.png' });
    await space.close();
    console.log(
      'PASS continuous nested disclosure borders; full-height centered Moon content; compact time steps; shared exclusive choices; unchanged global navigation and no redundant spatial shortcuts',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
