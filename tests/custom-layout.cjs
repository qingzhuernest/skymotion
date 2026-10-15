/** Workspace presentation, deferred resize, keyboard access and isolated preferences. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8905/').replace(/\/?$/, '/');
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  try {
    const c = await b.newContext({ viewport: { width: 1280, height: 900 } }),
      p = await c.newPage(),
      errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(base + 'diagrams.en.html');
    await p.waitForFunction(() => !document.querySelector('.layout-launch').disabled);
    const science = () =>
      p.evaluate(() => ({
        date: state.date,
        time: state.time,
        lat: state.lat,
        lon: state.lon,
        manual: state.manual,
        playing: state.playing,
      }));
    const initial = await science(),
      stored = () =>
        p.evaluate(() => JSON.parse(localStorage.getItem('skymotion-workspace-v2-wide')));
    await p.locator('.layout-launch').click();
    await p.waitForTimeout(250);
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 2);
    assert(await p.locator('.ui-timeline-host').isVisible());
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const divider = p.locator('.workspace-divider'),
      before = await p.locator('[data-diagram-card="contextPanel"]').boundingBox();
    let rect = await divider.boundingBox();
    await p.mouse.move(rect.x + 6, rect.y + 30);
    await p.mouse.down();
    await p.mouse.move(rect.x + 95, rect.y + 30, { steps: 8 });
    await p.waitForTimeout(100);
    assert.equal(
      (await p.locator('[data-diagram-card="contextPanel"]').boundingBox()).width,
      before.width,
      'Canvas dimensions stay fixed during resize preview',
    );
    assert(await p.evaluate(() => window.skyWorkspaceInteracting));
    await p.mouse.up();
    assert((await stored()).ratio > 50);
    const saved = await stored();
    rect = await divider.boundingBox();
    await p.mouse.move(rect.x + 6, rect.y + 30);
    await p.mouse.down();
    await p.mouse.move(rect.x - 80, rect.y + 30);
    await p.keyboard.press('Escape');
    await p.mouse.up();
    assert.deepEqual(await stored(), saved);
    assert.equal(await p.locator('.workspace-guide').count(), 0);
    await divider.focus();
    await p.keyboard.press('ArrowLeft');
    assert.equal((await stored()).ratio, saved.ratio - 5);
    await p.locator('.ui-diagram-card:visible .workspace-grip').first().focus();
    await p.keyboard.press('ArrowRight');
    assert.deepEqual((await stored()).views, ['chartPanel', 'contextPanel']);
    await p.locator('[data-word="undo"]').click();
    assert.deepEqual((await stored()).views, ['contextPanel', 'chartPanel']);
    await p.locator('[data-word="four"]').click();
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 4);
    await p.locator('[data-word="one"]').click();
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 1);
    assert(await p.locator('.ui-diagram-card:visible [data-word="close"]').isDisabled());
    await p.locator('.ui-diagram-card:visible select').selectOption('solarGeometryPanel');
    assert(await p.locator('#resetGeometryView').isVisible());
    await p.locator('[data-word="two"]').click();
    await p.locator('.ui-diagram-card:visible [data-word="close"]').first().click();
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 1);
    await p.locator('[data-word="reset"]').click();
    assert.deepEqual((await stored()).views, ['contextPanel', 'chartPanel']);
    assert.deepEqual(await science(), initial);
    await p.reload();
    await p.waitForFunction(() => !document.querySelector('.layout-launch').disabled);
    assert(await p.locator('.workspace-active').isVisible());
    // Repeated renders must not reparent scientific settings or rewrite translated tab labels.
    const writes = await p.evaluate(async () => {
      let n = 0;
      const obs = new MutationObserver((es) => (n += es.length));
      obs.observe(uiWorkspace.tabs, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
      for (let i = 0; i < 3; i++) renderUIWorkspace();
      await Promise.resolve();
      obs.disconnect();
      return n;
    });
    assert.equal(writes, 0);
    await p.locator('[data-word="standard"]').click();
    assert.equal(await p.locator('.workspace-active').count(), 0);
    await p.locator('[data-diagram="chartPanel"]').click();
    assert(await p.locator('#chart').isVisible());
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(250);
    await p.locator('.layout-launch').click();
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 1);
    assert(await p.locator('.workspace-tabs').isVisible());
    await p.locator('.workspace-tabs button').nth(1).click();
    assert(await p.locator('#chart').isVisible());
    await p.locator('[data-word="four"]').click();
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 1);
    assert.equal(await p.locator('.workspace-tabs button').count(), 4);
    assert((await p.locator('.ui-diagram-card:visible').boundingBox()).height > 200);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(
      await p.locator('.ui-parameters').evaluate((n) => n.parentElement.id),
      'uiParameterDrawer',
    );
    await p.locator('.language-toggle').click();
    await p.waitForFunction(() => document.documentElement.lang === 'zh-CN');
    assert.match(await p.locator('.layout-launch').innerText(), /我的工作区/);
    await p.locator('button[data-body="moon"]').click();
    assert.equal(await p.locator('.workspace-active').count(), 0);
    assert(await p.locator('#phaseContent').isVisible());
    assert.deepEqual(errors, []);
    await c.close();
    const blocked = await b.newContext(),
      q = await blocked.newPage();
    await q.addInitScript(() =>
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw Error('denied');
        },
      }),
    );
    await q.goto(base + 'diagrams.en.html');
    await q.waitForFunction(() => !document.querySelector('.layout-launch').disabled);
    await q.locator('.layout-launch').click();
    await q.locator('[data-word="four"]').click();
    assert.equal(await q.locator('.ui-diagram-card:visible').count(), 4);
    await blocked.close();
    console.log(
      'PASS workspace presets, content, resize preview, cancel, keyboard swap, undo, persistence, mobile tabs, locale, denied storage and scientific isolation',
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
