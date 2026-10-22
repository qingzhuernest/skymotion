const { addTool } = require('./diagram-test-helpers.cjs');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8974/').replace(/\/?$/, '/');
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-gpu', '--use-angle=swiftshader'],
  });
  const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(base + 'diagrams.html#chartPanel');
    await require('./diagram-test-helpers.cjs').enterCustomization(p);
    await require('./diagram-test-helpers.cjs').openWorkbench(p);
    if (await p.locator('[data-dt-view=objects]').isVisible())
      await p.locator('[data-dt-view=objects]').click();
    assert(await p.locator('.dt-empty').isVisible());
    assert(
      await p
        .locator('.dt-actions button')
        .filter({ hasText: /^复制$/ })
        .isDisabled(),
    );
    assert(
      await p
        .locator('.dt-actions button')
        .filter({ hasText: /^删除$/ })
        .isDisabled(),
    );
    await addTool(p, 'curve');
    await p.locator('.dt-toggle input').focus();
    await p.keyboard.press('Space');
    assert.equal(await p.evaluate(() => document.activeElement.matches('.dt-toggle input')), true);
    assert.equal(await p.evaluate(() => SkyDiagramTools.read('chart')[0].visible), false);
    await p.keyboard.press('Space');
    assert.equal(await p.evaluate(() => SkyDiagramTools.read('chart')[0].visible), true);
    await p.locator('[data-field="date"]').fill('9999-01-01');
    await p.locator('[data-field="date"]').press('Tab');
    let downloads = 0;
    p.on('download', () => downloads++);
    await require('./diagram-test-helpers.cjs').objectAction(p, '保存');
    assert.equal(
      await p.evaluate(() => localStorage.getItem('sky-diagram-tools-v1:chart:sun')),
      null,
    );
    assert.match(await p.locator('.dt-status').innerText(), /1900/);
    assert.equal(
      await p.locator('[data-field="date"]').evaluate((n) => document.activeElement === n),
      true,
    );
    await p.locator('[data-dt-view=files]').click();
    assert.equal(await p.locator('[data-dt-view=objects]').getAttribute('aria-current'), 'page');
    assert.equal(downloads, 0);
    await p.locator('[data-field="date"]').fill('2024-02-29');
    await p.locator('[data-field="date"]').press('Tab');
    await require('./diagram-test-helpers.cjs').objectAction(p, '保存');
    assert.match(await p.locator('.dt-status').innerText(), /已保存/);
    await addTool(p, 'level');
    await p.locator('[data-field="alt"]').fill('');
    await p.locator('[data-field="alt"]').press('Tab');
    assert.equal(await p.evaluate(() => SkyDiagramTools.read('chart')[1].alt), 30);
    assert.equal(await p.locator('[data-field="alt"]').getAttribute('aria-invalid'), 'true');
    await require('./diagram-test-helpers.cjs').objectAction(p, '保存');
    assert.match(await p.locator('.dt-status').innerText(), /有效数值/);
    await p.locator('[data-field="alt"]').fill('45');
    await p.locator('[data-field="alt"]').press('Tab');
    await addTool(p, 'note');
    await p.keyboard.press('Enter');
    const root = await p.evaluate(
      () => SkyDiagramTools.read('chart').find((o) => o.type === 'note').id,
    );
    for (let i = 0; i < 3; i++) {
      await p.locator(`[data-reference-id="${root}"]`).click();
      await require('./diagram-test-helpers.cjs').objectAction(p, '复制');
    }
    const notes = await p.evaluate(() =>
      SkyDiagramTools.read('chart').filter((o) => o.type === 'note'),
    );
    assert.equal(new Set(notes.map((o) => o.label)).size, 4);
    assert.equal(new Set(notes.map((o) => o.x + ':' + o.y)).size, 4);
    await p.screenshot({ path: 'tests/artifacts/ux54-desktop.png' });
    await p.close();
    console.log(
      'PASS visibility keyboard focus, empty actions, invalid save/export blocked, blank numbers preserved, unique visible copies',
    );
    const cap = await b.newPage();
    cap.on('pageerror', (e) => errors.push(e.message));
    await cap.addInitScript(() =>
      localStorage.setItem(
        'sky-diagram-tools-v1:chart:sun',
        JSON.stringify({
          version: 1,
          objects: Array.from({ length: 40 }, (_, i) => ({
            id: 'limit' + i,
            type: 'level',
            label: '参考高度线|Altitude reference',
            visible: true,
            alt: i - 20,
          })),
        }),
      ),
    );
    await cap.goto(base + 'diagrams.html#chartPanel');
    await require('./diagram-test-helpers.cjs').enterCustomization(cap);
    await require('./diagram-test-helpers.cjs').openWorkbench(cap);
    assert.equal(await cap.locator('.dt-add [data-tool-type]:enabled').count(), 0);
    assert.match(await cap.locator('.dt-hint').innerText(), /40/);
    if (await cap.locator('[data-dt-view=objects]').isVisible())
      await cap.locator('[data-dt-view=objects]').click();
    await cap.locator('.dt-row button').first().click();
    assert(
      await cap
        .locator('.dt-actions button')
        .filter({ hasText: /^复制$/ })
        .isDisabled(),
    );
    await require('./diagram-test-helpers.cjs').objectAction(cap, '删除');
    assert((await cap.locator('.dt-add [data-tool-type]:enabled').count()) > 0);
    assert.equal(await cap.evaluate(() => SkyDiagramTools.read('chart').length), 39);
    await cap.close();
    console.log(
      'PASS 40-reference limit gives actionable feedback and adding recovers after deletion',
    );
    const malformed = await b.newPage();
    malformed.on('pageerror', (e) => errors.push(e.message));
    await malformed.addInitScript(() =>
      localStorage.setItem(
        'sky-diagram-tools-v1:chart:sun',
        JSON.stringify({
          version: 1,
          objects: Array.from({ length: 42 }, (_, i) => ({
            id: 'duplicate-id',
            type: 'level',
            label: 'Reference ' + i,
            visible: true,
            alt: i - 21,
          })),
        }),
      ),
    );
    await malformed.goto(base + 'diagrams.html#chartPanel');
    await require('./diagram-test-helpers.cjs').enterCustomization(malformed);
    await require('./diagram-test-helpers.cjs').openWorkbench(malformed);
    const repaired = await malformed.evaluate(() => SkyDiagramTools.read('chart'));
    assert.equal(repaired.length, 40);
    assert.equal(new Set(repaired.map((o) => o.id)).size, 40);
    assert.equal(repaired[0].alt, -21);
    assert.equal(repaired.at(-1).alt, 18);
    assert.match(await malformed.locator('.dt-status').innerText(), /不兼容内容/);
    await malformed.locator('[data-dt-view=files]').click();
    await malformed.getByRole('button', { name: '保存本图对象', exact: true }).click();
    assert.equal(
      await malformed.evaluate(() => {
        const d = JSON.parse(localStorage.getItem('sky-diagram-tools-v1:chart:sun'));
        return new Set(d.objects.map((o) => o.id)).size;
      }),
      40,
    );
    assert.match(await malformed.locator('.dt-status').innerText(), /已保存/);
    await malformed.locator('[data-dt-view=objects]').click();
    await malformed.locator('.dt-row button').first().click();
    await require('./diagram-test-helpers.cjs').objectAction(malformed, '删除');
    assert.equal(await malformed.evaluate(() => SkyDiagramTools.read('chart').length), 39);
    assert.equal(
      new Set(await malformed.evaluate(() => SkyDiagramTools.read('chart').map((o) => o.id))).size,
      39,
    );
    await malformed.close();
    console.log(
      'PASS stale over-limit saves retain 40 usable references, duplicate IDs are repaired and repaired data is surfaced until saved',
    );
    const normal = await b.newPage();
    normal.on('pageerror', (e) => errors.push(e.message));
    await normal.addInitScript(() =>
      localStorage.setItem(
        'sky-diagram-tools-v1:chart:sun',
        JSON.stringify({
          version: 1,
          objects: [
            {
              y: 30,
              x: 50,
              locked: false,
              visible: true,
              customLabel: false,
              label: '文字说明|Text note',
              type: 'note',
              id: 'ordered-differently',
            },
          ],
        }),
      ),
    );
    await normal.goto(base + 'diagrams.html#chartPanel');
    await require('./diagram-test-helpers.cjs').enterCustomization(normal);
    await require('./diagram-test-helpers.cjs').openWorkbench(normal);
    assert.equal((await normal.evaluate(() => SkyDiagramTools.read('chart'))).length, 1);
    assert.match(await normal.locator('.dt-status').innerText(), /已保存到此设备/);
    await normal.close();
    console.log(
      'PASS valid saved references with different JSON key order do not trigger repair warning',
    );
    const m = await b.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    m.on('pageerror', (e) => errors.push(e.message));
    await m.goto(base + 'diagrams.en.html#chartPanel');
    await require('./diagram-test-helpers.cjs').enterCustomization(m);
    await require('./diagram-test-helpers.cjs').openWorkbench(m);
    await addTool(m, 'note');
    await m.keyboard.press('Enter');
    await m.locator('.dt-collapse').click();
    await require('./diagram-test-helpers.cjs').closeDrawer(m);
    const r = await m.locator('#chart').boundingBox(),
      x = r.x + r.width / 2,
      y = r.y + r.height / 2,
      c = await m.context().newCDPSession(m),
      original = await m.evaluate(() => SkyDiagramTools.read('chart')[0]);
    await c.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 1 }],
    });
    await c.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + 20, y: y - 10, id: 1 }],
    });
    assert.notDeepEqual(await m.evaluate(() => SkyDiagramTools.read('chart')[0]), original);
    await c.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: x + 20, y: y - 10, id: 1 },
        { x: x - 50, y: y - 20, id: 2 },
      ],
    });
    await c.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: x + 35, y: y - 20, id: 1 },
        { x: 2, y: y - 40, id: 2 },
      ],
    });
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.deepEqual(await m.evaluate(() => SkyDiagramTools.read('chart')[0]), original);
    // A fresh one-finger drag must work after the interrupted multi-touch gesture.
    await c.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 3 }],
    });
    await c.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + 30, y: y - 10, id: 3 }],
    });
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.notDeepEqual(await m.evaluate(() => SkyDiagramTools.read('chart')[0]), original);
    await m.locator('.dt-collapse').click();
    await require('./diagram-test-helpers.cjs').closeDrawer(m);
    await addTool(m, 'emphasis');
    await m.locator('.dt-collapse').click();
    await require('./diagram-test-helpers.cjs').closeDrawer(m);
    assert(await m.locator('.dt-place').isVisible());
    assert(await m.locator('.dt-hint').isVisible());
    await m.locator('.dt-place').click();
    assert.equal(await m.evaluate(() => SkyDiagramTools.read('chart').length), 2);
    assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(
      await m.locator('.dt-panel').evaluate((n) => /[\u3400-\u9fff]/.test(n.innerText)),
      false,
    );
    await m.screenshot({ path: 'tests/artifacts/ux54-mobile.png' });
    await m.close();
    assert.deepEqual(errors, []);
    console.log(
      'PASS interrupted multi-touch rollback, next drag recovery, compact placement, localization and mobile layout',
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
