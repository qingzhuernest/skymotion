/** Independent Earthrise geometry and lazy, pauseable diagram integration. */
const assert = require('node:assert/strict');
const M = require('../lunar/model.js');
for (const h of [100, 300, 1000]) {
  assert(M.sample(0, h).visibility === 'visible');
  assert(M.sample(180, h).visibility === 'hidden');
  const a = M.riseAngle(h);
  assert.equal(M.sample(a - 0.01, h).visibility, 'hidden');
  assert.equal(M.sample(a + 0.01, h).visibility, 'partial');
  assert(M.sample(a + 3, h).clearance > 0);
  for (let angle = 0; angle < 360; angle += 7) {
    const s = M.sample(angle, h, angle);
    assert([s.altitude, s.horizon, s.period, s.distance].every(Number.isFinite));
    assert(Math.abs(s.earthFraction + s.moonFraction - 1) < 1e-12);
    const p = s.position,
      d = [-M.D - p[0], 0, -p[2]],
      length = Math.hypot(...d),
      t = Math.max(0, Math.min(1, -p.reduce((sum, x, i) => sum + x * d[i], 0) / (length * length))),
      closest = Math.hypot(...p.map((x, i) => x + t * d[i]));
    assert.equal(
      closest > M.R,
      s.clearance > 0,
      'Center visibility agrees with a segment/sphere test',
    );
  }
}
assert(Math.abs(M.sample(258, 100).period / 60 - 117.79) < 0.02);
assert(M.sample(0, 1000).period > M.sample(0, 100).period);
for (const phase of [0, 45, 180, 270]) {
  const s = M.sample(180, 100, phase, true);
  assert.equal(s.altitude, 90);
  assert.equal(s.horizon, 0);
  assert.equal(s.visibility, 'visible');
}
console.log(
  'PASS lunar limb contacts, ray/sphere visibility, phase complement, orbital period and fixed-site geometry',
);
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8920/').replace(/\/?$/, '/');
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 1000 } }),
      errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(base + 'diagrams.html#lunarOrbit', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#lunarOrbitPanel iframe[src]');
    const frame = await (await p.locator('#lunarOrbitPanel iframe').elementHandle()).contentFrame();
    await frame.waitForFunction(() => !!window.LunarOrbitLesson);
    await p.waitForFunction(() => uiWorkspace.lunarReady && uiWorkspace.selected === 'lunarOrbit');
    assert.equal(
      await p.locator('[data-diagram="lunarOrbit"]').getAttribute('aria-pressed'),
      'true',
    );
    assert(await p.locator('.ui-timeline-host').isVisible());
    const railBox = await p.locator('.ui-parameters').boundingBox(),
      plotBox = await p.locator('#lunarOrbitPanel').boundingBox();
    assert(railBox.x + railBox.width <= plotBox.x, 'Original left rail and right image layout');
    assert(await p.locator('.lunar-controls-host #lessonText').isVisible());
    await p.locator('.motion-menu-grip').click();
    await p.waitForFunction(() =>
      document.querySelector('.ui-shell').classList.contains('motion-rail-collapsed'),
    );
    await p.locator('.motion-menu-edge').click();
    await p.waitForFunction(
      () => !document.querySelector('.ui-shell').classList.contains('motion-rail-collapsed'),
    );
    await p.evaluate(() =>
      Promise.all(
        document
          .querySelector('.ui-shell')
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
    await frame.evaluate(() => LunarOrbitLesson.paint());
    assert(await p.locator('.lunar-controls-host #lessonText').isVisible());
    assert.equal(await frame.locator('canvas:not(.dt-overlay)').count(), 1);
    assert.equal(await frame.locator('#lunarFailure').isVisible(), false);
    const science = () =>
        p.evaluate(() => ({ date: state.date, time: state.time, lat: state.lat, lon: state.lon })),
      initial = await science();
    const input = async (id, value) =>
      p.locator('#' + id).evaluate((el, value) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, value);
    const settleScene = () =>
      frame.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
    const mapPosition = async (name) => {
      const local = await frame.evaluate((name) => LunarOrbitLesson.inspect()[name], name);
      const box = await p.locator('#lunarOrbitPanel iframe').boundingBox();
      return { x: box.x + local.x, y: box.y + local.y };
    };
    const beforeClick = await frame.evaluate(() => LunarOrbitLesson.read());
    const moonPoint = await mapPosition('moon');
    await p.mouse.click(moonPoint.x + 4, moonPoint.y + 2);
    assert.equal(
      (await frame.evaluate(() => LunarOrbitLesson.read())).phase,
      beforeClick.phase,
      'Grabbing the Moon must not jump its position',
    );
    const observerPoint = await mapPosition('observer');
    await p.mouse.move(observerPoint.x, observerPoint.y);
    await p.mouse.down();
    await p.mouse.move(observerPoint.x + 18, observerPoint.y - 12, { steps: 5 });
    await p.mouse.up();
    assert.equal(
      (await frame.evaluate(() => LunarOrbitLesson.read())).phase,
      beforeClick.phase,
      'Observer drag must not move the Moon',
    );
    assert.notEqual((await frame.evaluate(() => LunarOrbitLesson.read())).angle, beforeClick.angle);
    const angleBeforeMoon = (await frame.evaluate(() => LunarOrbitLesson.read())).angle;
    const moonDrag = await mapPosition('moon');
    await p.mouse.move(moonDrag.x, moonDrag.y);
    await p.mouse.down();
    await p.mouse.move(moonDrag.x + 15, moonDrag.y - 15, { steps: 5 });
    await p.mouse.up();
    assert.equal(
      (await frame.evaluate(() => LunarOrbitLesson.read())).angle,
      angleBeforeMoon,
      'Moon drag must preserve orbital position',
    );
    assert.notEqual((await frame.evaluate(() => LunarOrbitLesson.read())).phase, beforeClick.phase);
    await input('orbitAngle', 359.9);
    await settleScene();
    const upBefore = (await frame.evaluate(() => LunarOrbitLesson.inspect())).cameraUp;
    await input('orbitAngle', 0.1);
    await settleScene();
    const upAfter = (await frame.evaluate(() => LunarOrbitLesson.inspect())).cameraUp;
    assert(
      upBefore.reduce((sum, x, i) => sum + x * upAfter[i], 0) > 0.99,
      'Camera roll stays continuous through zenith',
    );
    const orbitBefore = (await frame.evaluate(() => LunarOrbitLesson.inspect())).orbitRadius;
    await p.locator('#seekRise').click();
    await p.locator('#playOrbit').click();
    assert.equal((await frame.evaluate(() => LunarOrbitLesson.read())).playing, false);
    assert(
      (await frame.evaluate(() => LunarOrbitLesson.read())).guided,
      'Pause keeps the guided rise',
    );
    await p.locator('#playOrbit').click();
    assert(
      (await frame.evaluate(() => LunarOrbitLesson.read())).guided,
      'Resume continues the same guided rise',
    );
    await p.locator('#altitude').selectOption('1000');
    await settleScene();
    assert.equal(
      (await frame.evaluate(() => LunarOrbitLesson.read())).playing,
      false,
      'Height change cancels a guided rise with old contacts',
    );
    assert.equal((await frame.evaluate(() => LunarOrbitLesson.read())).orbitalHeight, 1000);
    assert((await frame.evaluate(() => LunarOrbitLesson.inspect())).orbitRadius > orbitBefore);
    await p.locator('#playOrbit').click();
    await p.locator('[data-mode="orbit"]').click();
    assert(
      (await frame.evaluate(() => LunarOrbitLesson.read())).playing,
      'Clicking the active mode does not interrupt playback',
    );
    await p.locator('#altitude').selectOption('100');
    console.log(
      'PASS Moon/observer gestures, no grab jump, stable zenith camera, height-aware orbit and playback transitions',
    );
    await input('orbitAngle', 180);
    await frame.waitForFunction(() => LunarOrbitLesson.read().visibility === 'hidden');
    await input('orbitAngle', 0);
    assert.equal((await frame.evaluate(() => LunarOrbitLesson.read())).visibility, 'visible');
    await input('phaseAngle', 180);
    await frame.waitForFunction(
      () => parent.document.getElementById('earthIllumination').textContent === '0.0%',
    );
    await p.locator('[data-mode="surface"]').click();
    await frame.waitForFunction(() => parent.document.getElementById('orbitAngle').disabled);
    assert(await p.locator('#orbitAngle').isDisabled());
    assert.equal(
      await p.locator('#orbitAngle').inputValue(),
      '0',
      'Fixed-site slider agrees with its zero-degree readout',
    );
    assert(await p.locator('#playOrbit').isDisabled());
    assert.equal((await frame.evaluate(() => LunarOrbitLesson.read())).altitude, 90);
    await input('phaseAngle', 0);
    assert.equal((await frame.evaluate(() => LunarOrbitLesson.read())).altitude, 90);
    await p.locator('[data-mode="orbit"]').click();
    await p.locator('#seekRise').click();
    await frame.waitForTimeout(180);
    assert((await frame.evaluate(() => LunarOrbitLesson.read())).playing);
    await require('./diagram-test-helpers.cjs').selectDiagram(p, 'chartPanel');
    await frame.waitForFunction(() => !LunarOrbitLesson.read().playing);
    assert(await p.locator('.ui-timeline-host').isVisible());
    assert.deepEqual(await science(), initial);
    await require('./diagram-test-helpers.cjs').selectDiagram(p, 'lunarOrbit');
    await p.locator('[data-rail-section=conditions]').click();
    assert.equal(await p.locator('#lunarOrbitPanel iframe').count(), 1);
    await p.locator('.language-toggle').click();
    await frame.waitForFunction(() => document.documentElement.lang === 'en');
    await frame.waitForFunction(() => !/[\u3400-\u9fff]/.test(document.body.innerText));
    await p.waitForFunction(
      () => !/[\u3400-\u9fff]/.test(document.querySelector('.lunar-controls-host').innerText),
    );
    assert(
      !/[\u3400-\u9fff]/.test(await frame.locator('body').innerText()),
      'English scene and control labels are complete',
    );
    assert(
      !/[\u3400-\u9fff]/.test(await p.locator('.lunar-controls-host').innerText()),
      'English sidebar is complete',
    );
    await input('orbitAngle', 0);
    await frame.waitForFunction(() => !document.getElementById('skyEarth').hidden);
    const skyBox = await frame.locator('#astronautView').boundingBox();
    await p.mouse.move(skyBox.x + 30, skyBox.y + skyBox.height / 2);
    await p.mouse.down();
    await p.mouse.move(skyBox.x + 200, skyBox.y + skyBox.height / 2, { steps: 5 });
    await p.mouse.up();
    await frame.waitForFunction(() =>
      document.getElementById('cameraHint').textContent.includes('outside'),
    );
    await frame.locator('#followEarth').click();
    await frame.waitForFunction(() => !document.getElementById('skyEarth').hidden);
    await input('orbitAngle', 180);
    await frame.waitForFunction(() => !document.getElementById('revealEarth').hidden);
    await frame.locator('#revealEarth').click();
    assert((await frame.evaluate(() => LunarOrbitLesson.read())).playing);
    await frame.waitForFunction(() => !LunarOrbitLesson.read().playing, null, { timeout: 15000 });
    assert.equal(
      (await frame.evaluate(() => LunarOrbitLesson.read())).visibility,
      'visible',
      'Earthrise demonstration stops with the full Earth visible',
    );
    await p.setViewportSize({ width: 390, height: 844 });
    await frame.locator('[data-lunar-view="orbit"]').click();
    assert(await frame.locator('#orbitView').isVisible());
    assert.equal(await frame.locator('#astronautView').isVisible(), false);
    await frame.locator('[data-lunar-view="sky"]').click();
    assert(await frame.locator('#astronautView').isVisible());
    assert.equal(
      await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await p.close();
    // A cold lesson must not clear the incumbent diagram or replace a newer selection.
    const delayed = await b.newPage({ viewport: { width: 1280, height: 1000 } });
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await delayed.route('**/lunar/lunar.js*', async (route) => {
      await gate;
      await route.continue();
    });
    await delayed.goto(base + 'diagrams.html');
    await delayed.waitForSelector('.language-toggle:not(:disabled)');
    await delayed.locator('button[data-body=moon]').click();
    await delayed.waitForSelector('#lunarOrbitPanel iframe[src]', { state: 'attached' });
    await require('./diagram-test-helpers.cjs').selectDiagram(delayed, 'lunarOrbit');
    await delayed.waitForFunction(() => uiWorkspace.pendingLunar);
    assert(
      await delayed.locator('#phaseContent').isVisible(),
      'Cold load preserves the existing image',
    );
    assert(
      await delayed.locator('.ui-parameters').isVisible(),
      'Cold load preserves the existing rail',
    );
    assert.equal(
      await delayed.evaluate(() => document.body.classList.contains('lunar-orbit-active')),
      false,
    );
    await require('./diagram-test-helpers.cjs').selectDiagram(delayed, 'chartPanel');
    release();
    await delayed.waitForFunction(() => uiWorkspace.lunarReady);
    assert.equal(
      await delayed.evaluate(() => uiWorkspace.selected),
      'chartPanel',
      'Late readiness cannot steal selection',
    );
    await require('./diagram-test-helpers.cjs').selectDiagram(delayed, 'lunarOrbit');
    await delayed.waitForFunction(() => document.body.classList.contains('lunar-orbit-active'));
    assert(
      await delayed.locator('#workbenchViews').isVisible(),
      'Earthrise retains the selected content menu',
    );
    await delayed.locator('[data-rail-section=conditions]').click();
    assert(await delayed.locator('.lunar-controls-host').isVisible());
    await delayed.close();
    console.log('PASS cold loading preserves both regions and late readiness respects navigation');
    const fallback = await b.newPage();
    await fallback.route('**/space/vendor/three.min.js', (r) => r.abort());
    await fallback.goto(base + 'lunar/index.en.html');
    await fallback.waitForFunction(() => !!window.LunarOrbitLesson);
    assert(await fallback.locator('#lunarFailure').isVisible());
    await fallback.locator('[data-mode="surface"]').click();
    assert.equal((await fallback.evaluate(() => LunarOrbitLesson.read())).altitude, 90);
    await fallback.close();
    console.log(
      'PASS lazy Moon-tab entry, single WebGL canvas, independent controls, fixed surface, pause-on-exit, locale, mobile views and no-WebGL fallback',
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
