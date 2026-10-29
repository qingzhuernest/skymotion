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
        p.evaluate(() => JSON.parse(localStorage.getItem('skymotion-workspace-v3-wide')));
    await p.locator('.layout-launch').click();
    await require('./diagram-test-helpers.cjs').selectDiagram(p, 'solarCompare');
    await p.waitForFunction(() => skyWorkspacePresentation.active);
    await p.waitForFunction(
      () =>
        skyWorkspacePresentation.active &&
        [...document.querySelectorAll('.ui-diagram-card')].filter(
          (n) => n.getBoundingClientRect().width > 0 && n.getBoundingClientRect().height > 0,
        ).length === 2,
    );
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 2);
    assert(await p.locator('.ui-timeline-host').isVisible());
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const divider = p.locator('.workspace-divider-x'),
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
    await require('./diagram-test-helpers.cjs').layoutAction(p, 'undo');
    assert.deepEqual((await stored()).views, ['contextPanel', 'chartPanel']);
    await require('./diagram-test-helpers.cjs').layoutAction(p, 'four');
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 4);
    await require('./diagram-test-helpers.cjs').layoutAction(p, 'three');
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 3);
    assert.equal(
      await p.locator('.workspace-presets [data-word="three"]').getAttribute('aria-pressed'),
      'true',
    );
    await require('./diagram-test-helpers.cjs').layoutAction(p, 'undo');
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 4);
    await require('./diagram-test-helpers.cjs').layoutAction(p, 'one');
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 1);
    assert(await p.locator('.ui-diagram-card:visible [data-word="close"]').isDisabled());
    await p.locator('.ui-diagram-card:visible select').selectOption('solarGeometryPanel');
    assert(await p.locator('#resetGeometryView').isVisible());
    await require('./diagram-test-helpers.cjs').layoutAction(p, 'two');
    await p.locator('.ui-diagram-card:visible [data-word="close"]').first().click();
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 1);
    await p.locator('[data-word="options"]').click();
    const optionsBox = await p.locator('.workspace-options').boundingBox();
    const railBox = await p.locator('.ui-parameters').boundingBox();
    const menuHeaderBox = await p.locator('.motion-menu-header').boundingBox();
    const plotBox = await p.locator('.ui-plot').boundingBox();
    assert(
      optionsBox.x >= railBox.x && optionsBox.x + optionsBox.width <= railBox.x + railBox.width + 1,
    );
    assert(
      optionsBox.x + optionsBox.width <= plotBox.x,
      'Inline settings leave the chart unobscured',
    );
    assert.equal(
      await p.locator('.workspace-options').evaluate((node) => getComputedStyle(node).position),
      'static',
    );
    assert.equal(
      await p.locator('.workspace-options').evaluate((node) => node.hasAttribute('popover')),
      false,
    );
    assert(
      await p.locator('.motion-menu-header').isVisible(),
      'Persistent navigation remains reachable',
    );
    await p.locator('[data-word="reset"]').click();
    await p.keyboard.press('Escape');
    assert.deepEqual((await stored()).views, ['contextPanel', 'chartPanel']);
    assert.deepEqual(await science(), initial);
    await p.reload();
    await p.evaluate(()=>{window.retainedLayoutCards=[...document.querySelectorAll('.ui-plot > [data-diagram-card]')];});
    await p.waitForFunction(() => !document.querySelector('.layout-launch').disabled);
    assert.equal(await p.evaluate(() => SkyCustomization.active), false);
    await p.locator('.layout-launch').click();
    await require('./diagram-test-helpers.cjs').selectDiagram(p, 'solarCompare');
    await p.waitForFunction(() => skyWorkspacePresentation.active);
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
    await p.locator('.layout-launch').click();
    assert.equal(await p.locator('.workspace-active').count(), 1);
    assert.equal(
      await p.locator('.ui-diagram-card:visible').count(),
      2,
      'Finishing customization retains the selected arrangement',
    );
    assert(await p.evaluate(()=>{
      const current=[...document.querySelectorAll('.ui-plot > [data-diagram-card]')];
      return current.length===retainedLayoutCards.length&&current.every(card=>retainedLayoutCards.includes(card));
    }), 'Finishing customization retains each original diagram card');
    await require('./diagram-test-helpers.cjs').selectDiagram(p, 'chartPanel');
    assert(await p.locator('#chart').isVisible());
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(250);
    await p.locator('.layout-launch').click();
    await require('./diagram-test-helpers.cjs').selectDiagram(p, 'solarCompare');
    await p.waitForFunction(() => skyWorkspacePresentation.active);
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 1);
    assert(await p.locator('.workspace-tabs').isVisible());
    await p.locator('.workspace-tabs button').nth(1).click();
    assert(await p.locator('#chart').isVisible());
    await require('./diagram-test-helpers.cjs').layoutAction(p, 'three');
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 1);
    assert.equal(await p.locator('.workspace-tabs button').count(), 3);
    await require('./diagram-test-helpers.cjs').layoutAction(p, 'four');
    assert.equal(await p.locator('.ui-diagram-card:visible').count(), 1);
    assert.equal(await p.locator('.workspace-tabs button').count(), 4);
    await p.locator('.workspace-tabs [aria-selected="true"]').focus();
    await p.keyboard.press('End');
    assert.equal(
      await p.locator('.workspace-tabs button').last().getAttribute('aria-selected'),
      'true',
    );
    assert(
      await p
        .locator('.workspace-tabs button')
        .last()
        .evaluate((n) => n === document.activeElement),
    );
    assert((await p.locator('.ui-diagram-card:visible').boundingBox()).height > 200);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(
      await p.locator('.ui-parameters').evaluate((n) => n.parentElement.id),
      'uiParameterDrawer',
    );
    await require('./preferences-test-helpers.cjs').toggleLanguage(p);
    await p.waitForFunction(() => document.documentElement.lang === 'zh-CN');
    assert.match(await p.locator('.layout-launch').innerText(), /完成自定义/);
    await p.locator('button[data-body=moon]').click();
    await p.waitForFunction(
      () => state.body === 'moon' && !!document.querySelector('.workspace-active'),
    );
    assert.equal(await p.locator('.workspace-active').count(), 1);
    await p.locator('.workspace-tabs button').first().click();
    await p.locator('#phaseContent').waitFor({ state: 'visible' });
    assert(await p.locator('#phaseContent').isVisible());
    assert.equal(await p.locator('.layout-launch').getAttribute('aria-pressed'), 'true');
    await p.locator('.layout-launch').click();
    assert(await p.evaluate(()=>{const cards=[...document.querySelectorAll('.ui-plot > [data-diagram-card]')];return cards.length===retainedLayoutCards.length&&cards.every(card=>retainedLayoutCards.includes(card));}), 'Body and locale changes retain the original diagram cards');
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
    await require('./diagram-test-helpers.cjs').selectDiagram(q, 'solarCompare');
    await q.waitForFunction(() => skyWorkspacePresentation.active);
    await require('./diagram-test-helpers.cjs').layoutAction(q, 'four');
    assert.equal(await q.locator('.ui-diagram-card:visible').count(), 4);
    await q.locator('[data-word="options"]').click();
    await q.locator('.workspace-save-form input[type=text]').fill('Temporary');
    await q.locator('[data-word="save"]').click();
    assert.match(await q.locator('.workspace-settings-status').innerText(), /unavailable/);
    await blocked.close();
    const rich = await b.newContext({ viewport: { width: 1280, height: 900 } }),
      r = await rich.newPage(),
      richErrors = [];
    r.on('pageerror', (e) => richErrors.push(e.message));
    await r.addInitScript(() => {
      if (!localStorage.getItem('migration-test')) {
        localStorage.setItem('migration-test', '1');
        localStorage.setItem('skymotion-workspace-v3-wide', '{broken');
        localStorage.setItem(
          'skymotion-workspace-v2-wide',
          JSON.stringify({
            version: 2,
            enabled: true,
            views: ['chartPanel', 'contextPanel'],
            ratio: 57,
            active: 0,
          }),
        );
      }
    });
    await r.goto(base + 'diagrams.en.html');
    await r.waitForFunction(() => !document.querySelector('.layout-launch').disabled);
    await r.locator('.layout-launch').click();
    await require('./diagram-test-helpers.cjs').selectDiagram(r, 'solarCompare');
    await r.waitForFunction(() => skyWorkspacePresentation.active);
    const richSaved = () =>
      r.evaluate(() => JSON.parse(localStorage.getItem('skymotion-workspace-v3-wide')));
    const inputState = () =>
      r.evaluate(() => ({
        date: state.date,
        time: state.time,
        lat: state.lat,
        lon: state.lon,
        playing: state.playing,
      }));
    const scienceBefore = await inputState();
    const options = async () => {
      if ((await r.locator('[data-word="options"]').getAttribute('aria-expanded')) !== 'true')
        await r.locator('[data-word="options"]').click();
      if (await r.evaluate(() => matchMedia('(max-width:760px)').matches))
        await require('./diagram-test-helpers.cjs').openDrawer(r);
    };
    assert.equal(await r.locator('.ui-diagram-card:visible').count(), 2, 'A damaged v3 record still permits valid v2 migration');
    assert.equal(
      await r.locator('.ui-diagram-card:visible').first().getAttribute('data-diagram-card'),
      'chartPanel',
    );
    await options();
    await r.locator('[data-word="rows"]').click();
    await r.keyboard.press('Control+z');
    assert.equal((await richSaved()).axis, 'columns');
    await r.keyboard.press('Control+Shift+z');
    assert.equal((await richSaved()).axis, 'rows');
    await r.keyboard.press('Escape');
    let first = await r.locator('[data-diagram-card="chartPanel"]').boundingBox(),
      second = await r.locator('[data-diagram-card="contextPanel"]').boundingBox();
    assert(
      second.y > first.y + first.height - 1 && Math.abs(first.x - second.x) < 2,
      'Stacked view occupies separate rows',
    );
    const splitY = r.locator('.workspace-divider-y');
    let handle = await splitY.boundingBox();
    await r.mouse.move(handle.x + 30, handle.y + 6);
    await r.mouse.down();
    await r.mouse.move(handle.x + 30, handle.y + 65, { steps: 6 });
    await r.waitForTimeout(80);
    assert.equal(
      (await r.locator('[data-diagram-card="chartPanel"]').boundingBox()).height,
      first.height,
      'Vertical resizing is deferred',
    );
    await r.mouse.up();
    assert((await richSaved()).rowRatio > 50);
    const heightRatio = (await richSaved()).rowRatio;
    await require('./diagram-test-helpers.cjs').layoutAction(r, 'undo');
    assert.equal((await richSaved()).rowRatio, 50);
    await require('./diagram-test-helpers.cjs').layoutAction(r, 'redo');
    assert.equal((await richSaved()).rowRatio, heightRatio);
    await options();
    await r.keyboard.press('Escape');
    await r.locator('.ui-diagram-card:visible [data-word="focus"]').first().click();
    assert.equal(await r.locator('.ui-diagram-card:visible').count(), 1);
    assert(await r.locator('[data-word="back"]').isVisible());
    const focusChoice = (await richSaved()).views[1];
    await r.locator('.ui-diagram-card:visible select').selectOption(focusChoice);
    assert.equal(await r.locator('.ui-diagram-card:visible').count(), 1);
    assert.equal(
      await r.locator('.ui-diagram-card:visible').getAttribute('data-diagram-card'),
      focusChoice,
    );
    await r.keyboard.press('Escape');
    assert.equal(await r.locator('.ui-diagram-card:visible').count(), 2);
    await require('./diagram-test-helpers.cjs').layoutAction(r, 'add');
    assert.equal((await richSaved()).views.length, 3);
    await options();
    await r.locator('[data-word="columns"]').click();
    await r.locator('[data-word="featured"]').click();
    await r.keyboard.press('Escape');
    const main = r.locator('.ui-diagram-card[data-workspace-position="0"]'),
      support = r.locator('.ui-diagram-card[data-workspace-position="1"]');
    const mainBox = await main.boundingBox(),
      supportBox = await support.boundingBox(),
      lowerBox = await r.locator('.ui-diagram-card[data-workspace-position="2"]').boundingBox();
    assert(
      Math.abs(mainBox.y - supportBox.y) < 2 &&
        Math.abs(mainBox.y + mainBox.height - lowerBox.y - lowerBox.height) < 2 &&
        lowerBox.y > supportBox.y + supportBox.height,
      'Featured view spans both supporting rows',
    );
    await r.waitForTimeout(150);
    await main.locator('select').selectOption((await richSaved()).views[1]);
    assert.equal(
      new Set((await richSaved()).views).size,
      3,
      'Choosing an occupied diagram swaps without duplicates',
    );
    await options();
    const originalOrder = (await richSaved()).views;
    const missing = ['contextPanel', 'chartPanel', 'riseSetPanel', 'solarGeometryPanel'].find(
      (id) => !originalOrder.includes(id),
    );
    await r
      .locator(`[data-workbench-view="${missing}"]`)
      .locator('..')
      .locator('.workbench-add-view')
      .click();
    assert.equal((await richSaved()).views.at(-1), missing, 'Add the requested diagram directly');
    await r.keyboard.press('Escape');
    await require('./diagram-test-helpers.cjs').layoutAction(r, 'undo');
    await options();
    await r.locator(`[data-main-view="${originalOrder.at(-1)}"]`).click();
    assert.equal(
      (await richSaved()).views[0],
      originalOrder.at(-1),
      'Any diagram can become the main view',
    );
    await r.keyboard.press('Escape');
    await require('./diagram-test-helpers.cjs').layoutAction(r, 'undo');
    await options();
    await r.locator('[data-word="equalize"]').click();
    assert.equal((await richSaved()).ratio, 50);
    assert.equal((await richSaved()).rowRatio, 50);
    assert(await r.locator('[data-word="equalize"]').isDisabled());
    assert.deepEqual(
      await inputState(),
      scienceBefore,
      'New customization controls leave science untouched',
    );
    await r.locator('.workspace-save-form input[type=text]').fill('Observation');
    await r.locator('[data-word="save"]').click();
    assert.equal(await r.locator('.workspace-profile-row').count(), 1);
    await r.locator('.workspace-save-form input[type=text]').fill('Observation');
    await r.locator('[data-word="save"]').click();
    assert.equal(
      await r.locator('.workspace-profile-row').count(),
      1,
      'Same name updates rather than duplicates',
    );
    await r.locator('[data-word="overview"]').click();
    await r.locator('.workspace-profile-apply').click();
    assert.equal((await richSaved()).views.length, 3);
    await r.reload();
    await r.waitForFunction(() => !document.querySelector('.layout-launch').disabled);
    await r.locator('.layout-launch').click();
    await require('./diagram-test-helpers.cjs').selectDiagram(r, 'solarCompare');
    await r.waitForFunction(() => skyWorkspacePresentation.active);
    assert.equal(await r.locator('.ui-diagram-card:visible').count(), 3);
    await options();
    assert.equal(
      await r.locator('.workspace-profile-row').count(),
      1,
      'Saved combinations survive navigation',
    );
    const collectionBefore = await r.evaluate(() =>
      JSON.parse(localStorage.getItem('skymotion-saved-layouts-v1')),
    );
    await r.locator('[data-word="rename"]').click();
    await r.locator('.workspace-profile-editor input').fill('Classroom');
    await r.locator('[data-word="saveName"]').click();
    assert.match(await r.locator('.workspace-profile-apply').innerText(), /Classroom/);
    await r.locator('[data-word="rename"]').click();
    await r.locator('.workspace-profile-editor input').fill('Discard this');
    await r.keyboard.press('Escape');
    assert.equal(await r.locator('.workspace-profile-editor').count(), 0);
    assert.equal(await r.locator('[data-word="options"]').getAttribute('aria-expanded'), 'true');
    assert.match(await r.locator('.workspace-profile-apply').innerText(), /Classroom/);
    await r.locator('[data-word="undoSaved"]').click();
    assert.deepEqual(
      await r.evaluate(() => JSON.parse(localStorage.getItem('skymotion-saved-layouts-v1'))),
      collectionBefore,
    );
    await r.locator('[data-word="overview"]').click();
    await r.locator('[data-word="update"]').click();
    assert.equal(await r.locator('[data-word="update"]').isDisabled(), true);
    assert.equal(
      (await r.evaluate(() => JSON.parse(localStorage.getItem('skymotion-saved-layouts-v1'))))
        .items[0].layout.views.length,
      4,
    );
    await r.locator('[data-word="undoSaved"]').click();
    assert.equal(
      (await richSaved()).views.length,
      4,
      'Collection undo leaves the workspace unchanged',
    );
    await r.locator('.workspace-profile-apply').click();
    assert.equal((await richSaved()).views.length, 3);
    const ratioBeforeTyping = (await richSaved()).ratio;
    await r.locator('[data-proportion="ratio"]').fill('43');
    assert.equal((await richSaved()).ratio, ratioBeforeTyping, 'Typing does not resize the canvas');
    await r.locator('[data-proportion="ratio"]').press('Tab');
    assert.equal((await richSaved()).ratio, 43);
    await r.locator('[data-proportion="rowRatio"]').fill('99');
    await r.locator('[data-proportion="rowRatio"]').press('Tab');
    assert.equal((await richSaved()).rowRatio, 70, 'Exact input clamps to supported proportions');
    await r.locator('[data-word="equalize"]').click();
    assert.deepEqual(await inputState(), scienceBefore);
    for (let i = 2; i <= 5; i++) {
      await r.locator('.workspace-save-form input[type=text]').fill('Layout ' + i);
      await r.locator('[data-word="save"]').click();
    }
    await r.locator('.workspace-save-form input[type=text]').fill('Sixth');
    await r.locator('[data-word="save"]').click();
    assert.equal(await r.locator('.workspace-profile-row').count(), 5);
    assert.match(await r.locator('.workspace-settings-status').innerText(), /five/);
    await r.locator('.workspace-profile-row [data-word="delete"]').last().click();
    assert.equal(await r.locator('.workspace-profile-row').count(), 4);
    await r.locator('[data-word="undoSaved"]').click();
    assert.equal(
      await r.locator('.workspace-profile-row').count(),
      5,
      'Deleted collections can be restored',
    );
    await r.locator('.workspace-profile-row [data-word="rename"]').last().click();
    await r.locator('.workspace-profile-editor input').fill('Observation');
    await r.locator('[data-word="saveName"]').click();
    assert.equal(
      await r.locator('.workspace-profile-editor input').getAttribute('aria-invalid'),
      'true',
    );
    await r.locator('[data-word="cancelEdit"]').click();
    await r.locator('.workspace-profile-row [data-word="delete"]').last().click();

    await r.keyboard.press('Escape');
    assert.deepEqual(
      await inputState(),
      scienceBefore,
      'Layout operations never restore scientific state',
    );
    await r.setViewportSize({ width: 390, height: 844 });
    await r.waitForTimeout(100);
    assert.equal(await r.evaluate(() => SkyCustomization.active), true);
    await options();
    assert.equal(
      await r.locator('.workspace-profile-row').count(),
      4,
      'Saved layouts are available on phones',
    );
    await r.locator('.workspace-profile-apply').first().click();
    assert.equal(await r.locator('.ui-diagram-card:visible').count(), 1);
    assert.equal(await r.locator('.workspace-tabs button').count(), 3);
    await r.keyboard.press('Escape');
    await require('./diagram-test-helpers.cjs').closeDrawer(r);
    await r.locator('.workspace-tabs button').first().click();
    await options();
    const oldOrder = await r.evaluate(
      () => JSON.parse(localStorage.getItem('skymotion-workspace-v3-narrow')).views,
    );
    await r.locator('.workspace-order-row [data-word="after"]').first().click();
    const newOrder = await r.evaluate(
      () => JSON.parse(localStorage.getItem('skymotion-workspace-v3-narrow')).views,
    );
    assert.equal(newOrder[1], oldOrder[0]);
    assert.equal(
      await r.locator('.workspace-tabs [aria-selected="true"]').getAttribute('data-word'),
      oldOrder[0],
      'Reordering keeps the selected diagram',
    );
    await r.keyboard.press('Escape');
    await require('./diagram-test-helpers.cjs').closeDrawer(r);
    await r.setViewportSize({ width: 320, height: 760 });
    await r.waitForTimeout(100);
    assert.equal(await r.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const moonChoice = await r.locator('#observationBody').boundingBox(),
      heading = await r.locator('.workbench-header').boundingBox();
    assert(
      moonChoice.x + moonChoice.width <= heading.x + heading.width,
      'Narrow body choices stay inside the workbench heading',
    );
    await options();
    const bounds = await r.locator('#workspaceOptions').boundingBox();
    assert(
      bounds.x >= 0 && bounds.x + bounds.width <= 320,
      'Settings stay inside narrow screens: ' + JSON.stringify(bounds),
    );
    await r.keyboard.press('Escape');
    assert.deepEqual(richErrors, []);
    await rich.close();
    console.log(
      'PASS v2 migration, stacked/main layouts, deferred row resize, focus, redo, swapping, saved profiles, bounds, mobile ordering and unchanged science',
    );
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
