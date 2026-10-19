const {addTool}=require('./diagram-test-helpers.cjs');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8972/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-gpu', '--use-angle=swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', m => { if (m.type() === 'warning' && /reference rejected/i.test(m.text())) errors.push(m.text()); });
    await page.goto(base + 'diagrams.html#chartPanel');await require('./diagram-test-helpers.cjs').enterCustomization(page);
    await page.locator('.diagram-tool-launch:visible').click();
    await addTool(page,'curve');
    await page.waitForFunction(() => document.querySelector('.dt-result').textContent.includes('2026'));
    await addTool(page,'measure');
    await page.waitForFunction(() => document.querySelector('.dt-result').textContent.includes('240'));
    await page.locator('.dt-row button').first().click();
    await page.waitForFunction(() => document.querySelector('.dt-result').textContent.includes('2026'));
    assert(await page.locator('.dt-row button').first().evaluate(n => document.activeElement === n));
    const original = await page.evaluate(() => SkyDiagramTools.read('chart')[0].date);
    for (const value of ['9999-01-01', '1899-12-31', '2101-01-01', '2026-02-30']) {
      await page.locator('[data-field="date"]').fill(value);
      await page.locator('[data-field="date"]').press('Tab');
      assert.equal(await page.locator('[data-field="date"]').getAttribute('aria-invalid'), 'true');
      assert.equal(await page.evaluate(() => SkyDiagramTools.read('chart')[0].date), original);
    }
    await page.locator('[data-field="date"]').fill('2024-02-29');
    await page.locator('[data-field="date"]').press('Tab');
    await page.waitForFunction(() => SkyDiagramTools.read('chart')[0].date === '2024-02-29');
    assert.equal(await page.locator('[data-field="date"]').getAttribute('aria-invalid'), null);
    await require('./diagram-test-helpers.cjs').objectAction(page,'复制');
    await require('./diagram-test-helpers.cjs').objectAction(page,'保存');
    await page.locator('.dt-head button').last().click();
    await page.locator('.language-toggle').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    await page.locator('.diagram-tool-launch:visible').click();
    const labels = await page.locator('.dt-row button').allTextContents();
    assert(labels.includes('Date comparison curve 2'));
    assert(labels.every(label => !/[\u3400-\u9fff]/.test(label)));
    await page.screenshot({ path: '/workspace/audits/fix52-desktop.png' });
    await page.locator('.dt-head button').last().click();
    await page.reload();await require('./diagram-test-helpers.cjs').enterCustomization(page);
    await page.waitForFunction(() => window.SkyDiagramTools && SkyDiagramTools.read('chart')?.length === 3);
    assert.equal(await page.evaluate(() => SkyDiagramTools.read('chart')[0].date), '2024-02-29');
    // Old v51 default copies must migrate without changing personal text.
    await page.evaluate(() => {
      const objects = SkyDiagramTools.read('chart');
      objects[2].label = '日期对照曲线 2'; delete objects[2].copyNumber;
      objects[1].customLabel = true; objects[1].label = '个人测量 Personal';
      localStorage.setItem('sky-diagram-tools-v1:chart:sun', JSON.stringify({ version: 1, objects }));
      sessionStorage.removeItem('sky-diagram-draft-v2:chart:sun'); // Simulate a legacy device archive, without a newer visit draft.
    });
    await page.reload();await require('./diagram-test-helpers.cjs').enterCustomization(page);
    await page.locator('.diagram-tool-launch:visible').click();
    assert((await page.locator('.dt-row button').allTextContents()).includes('Date comparison curve 2'));
    assert((await page.locator('.dt-row button').allTextContents()).includes('个人测量 Personal'));
    await page.locator('.dt-head button').last().click();
    await page.locator('[data-diagram="contextPanel"]').click();
    await page.waitForFunction(() => document.querySelector('.ui-plot').dataset.kind === 'contextPanel');
    await page.locator('.diagram-tool-launch:visible').click();
    const location = await page.evaluate(() => [state.lat, state.lon]);
    await addTool(page,'note');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'globe');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => SkyDiagramTools.read('earth').length), 1);
    await addTool(page,'observer');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => SkyDiagramTools.read('earth').length), 2);
    assert.deepEqual(await page.evaluate(() => [state.lat, state.lon]), location);
    await addTool(page,'emphasis');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => SkyDiagramTools.read('earth').length), 2);
    await addTool(page,'emphasis');
    await page.locator('.dt-place').click();
    assert.equal(await page.evaluate(() => SkyDiagramTools.read('earth').length), 3);
    console.log('PASS selected readouts, shared date validation, leap day, legacy bilingual copies, personal labels, keyboard/button placement and cancellation');
    await page.locator('.dt-head button').last().click();
    await page.goto(base + 'diagrams.html#sceneBuilder');await require('./diagram-test-helpers.cjs').enterCustomization(page);
    await page.waitForFunction(() => window.SkySceneBuilder?.read());
    const scene = await page.evaluate(() => SkySceneBuilder.read());
    for (const patch of [{ lat: 999 }, { lon: 181 }, { time: 1441 }, { date: '2026-02-30' }, { date: '2101-01-01' }, { manual: true, dec: 99 }]) {
      await page.evaluate(({ scene, patch }) => {
        const reference = { scene, condition: { body: 'sun', date: '2026-06-21', time: 720, lat: 39.9, lon: 116.4, manual: false, dec: 23.4, ...patch } };
        localStorage.setItem('skymotion-scene-builder-v1-sun', JSON.stringify({ ...scene, reference }));
      }, { scene, patch });
      await page.reload();await require('./diagram-test-helpers.cjs').enterCustomization(page);
      await page.waitForFunction(() => window.SkySceneBuilder?.read());
      const restored = await page.evaluate(() => SkySceneBuilder.read());
      assert.equal(restored.reference, undefined);
      assert.equal(restored.objects.length, scene.objects.length);
      assert.match(await page.locator('.sb-status').innerText(), /移除|removed/);
    }
    // The valid leap-day reference must remain readable.
    await page.evaluate(scene => localStorage.setItem('skymotion-scene-builder-v1-sun', JSON.stringify({ ...scene, reference: { scene, condition: { body: 'sun', date: '2024-02-29', time: 720, lat: 39.9, lon: 116.4, manual: false, dec: 0 } } })), scene);
    await page.reload();await require('./diagram-test-helpers.cjs').enterCustomization(page);
    await page.waitForFunction(() => window.SkySceneBuilder?.read()?.reference);
    assert.equal(await page.evaluate(() => SkySceneBuilder.read().reference.condition.date), '2024-02-29');
    await page.close();
    console.log('PASS invalid frozen conditions discarded without losing objects or throwing, valid frozen leap-day reference retained');
    for (const path of ['lunar/index.en.html', 'space/index.en.html']) {
      const p = await browser.newPage(); p.on('pageerror', e => errors.push(e.message));
      await p.goto(base + path);await require('./diagram-test-helpers.cjs').enterCustomization(p); await p.locator('.diagram-tool-launch:visible').click();
      await addTool(p,'note'); await p.keyboard.press('Enter');
      const id = path.startsWith('lunar') ? 'lunar' : 'solar-system';
      assert.equal(await p.evaluate(id => SkyDiagramTools.read(id).length, id), 1);
      await p.close();
    }
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mobile.goto(base + 'diagrams.en.html#chartPanel');await require('./diagram-test-helpers.cjs').enterCustomization(mobile);
    await mobile.locator('.diagram-tool-launch:visible').click();
    await addTool(mobile,'measure');
    const sizes = await mobile.locator('.dt-panel button:visible').evaluateAll(nodes => nodes.map(n => ({ w: n.getBoundingClientRect().width, h: n.getBoundingClientRect().height })));
    assert(sizes.every(n => n.w >= 44 && n.h >= 44));
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await mobile.locator('.dt-panel').evaluate(n => /[\u3400-\u9fff]/.test(n.innerText)), false);
    await mobile.screenshot({ path: '/workspace/audits/fix52-mobile.png' });
    await mobile.close();
    assert.deepEqual(errors, []);
    console.log('PASS 3D/lunar keyboard placement, 44px mobile buttons, no horizontal overflow or page errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
