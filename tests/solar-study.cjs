const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8986/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-gpu', '--use-angle=swiftshader'],
  });
  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
      errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(base + 'diagrams.html#solarStudy');
    await p.waitForFunction(() => window.SkySolarStudy && window.SkyCustomization);
    assert.equal(await p.evaluate(() => SkyCustomization.active), false);
    assert.equal(await p.locator('[data-diagram=solarStudy]').isVisible(), false);
    await p.locator('.layout-launch').click();
    await require('./diagram-test-helpers.cjs').selectDiagram(p, 'solarStudy');
    await p.waitForFunction(() => SkySolarStudy.read());
    assert(await p.locator('#solarStudyPanel').isVisible());
    await p.locator('[data-rail-section=conditions]').click();
    const set = async (values) => {
      await p.evaluate((v) => {
        Object.assign(state, v);
        schedule();
      }, values);
      await p.waitForFunction((v) => {
        const c = SkySolarStudy.read()?.conditions;
        return c && Object.entries(v).every(([k, value]) => c[k] === value);
      }, values);
    };
    await set({ date: '2026-06-21', time: 720, lat: 40, lon: 0, manual: false });
    let data = await p.evaluate(() => SkySolarStudy.read());
    assert.deepEqual(
      data.samples.map((s) => s.time),
      [540, 720, 900],
    );
    assert(data.samples[1].point.alt > data.samples[0].point.alt);
    assert(
      data.samples[0].point.x > 0 && data.samples[2].point.x < 0,
      'morning is east, afternoon is west',
    );
    await p.setViewportSize({ width: 1280, height: 960 });
    await p.screenshot({ path: 'tests/artifacts/study84-time-desktop.png' });
    assert(
      await p
        .locator('.motion-menu-header')
        .evaluate((n) => !n.contains(document.querySelector('#solarStudyControls'))),
      'comparison controls remain below the fixed menu header',
    );
    assert(
      await p
        .locator('.solar-study-readings caption')
        .evaluate((n) => n.getBoundingClientRect().height < 40),
      'readings caption stays horizontal',
    );
    const drawingBox = await p.locator('.solar-study-drawings').boundingBox(),
      readingBox = await p.locator('.solar-study-readings').boundingBox();
    assert(
      drawingBox.width > 350 && readingBox.x > drawingBox.x + drawingBox.width,
      'time diagram uses the large drawing area with adjacent readings',
    );
    const original = await p.evaluate(() => [state.lat, state.lon, state.date, state.time]);
    await p.locator('#solarStudyInterval').selectOption('60');
    await p.waitForFunction(() => SkySolarStudy.read().samples[0].time === 660);
    assert.deepEqual(
      await p.evaluate(() => [state.lat, state.lon, state.date, state.time]),
      original,
      'comparison controls never change observation state',
    );
    await set({ date: '2024-03-01', time: 30 });
    data = await p.evaluate(() => SkySolarStudy.read());
    assert.equal(data.samples[0].date, '2024-02-29');
    assert.equal(data.samples[0].time, 1410);
    assert.equal(data.samples[0].point.alt < 0, true);
    await set({ date: '2026-06-21', time: 720, lat: 40, lon: 0 });
    await p.locator('.solar-study-switch button').nth(1).click();
    await p.waitForFunction(() => SkySolarStudy.read().mode === 'place');
    data = await p.evaluate(() => SkySolarStudy.read());
    assert.deepEqual(
      data.samples.map((s) => s.lat),
      [40, 0, -40],
    );
    assert(data.samples.every((s) => s.instant === data.utc));
    assert(
      data.samples[0].point.z < 0 && data.samples[2].point.z > 0,
      'noon Sun is south in northern midlatitudes and north in southern midlatitudes',
    );
    await p.locator('.solar-study-presets button').nth(1).click();
    data = await p.evaluate(() => SkySolarStudy.read());
    assert.deepEqual(
      data.samples.map((s) => s.lon),
      [0, 60, -60],
    );
    assert(
      data.samples[1].time > data.samples[0].time && data.samples[2].time < data.samples[0].time,
      'same UTC means different apparent solar times',
    );
    const accuracy = await p.evaluate(() =>
      SkySolarStudy.read().samples.map((s) => {
        const native = skyRaw('Sun', s.time, s.date, s.lat, s.lon);
        return Math.abs(native.alt - s.point.alt);
      }),
    );
    assert(
      accuracy.every((v) => v < 0.00001),
      'samples agree with native astronomy at the same instant',
    );
    await p.locator('#solarStudy0lat').fill('95');
    await p.locator('#solarStudy0lat').press('Tab');
    assert.equal(await p.locator('#solarStudy0lat').getAttribute('aria-invalid'), 'true');
    assert.equal((await p.evaluate(() => SkySolarStudy.read())).samples[1].lat, 40);
    await p.locator('#solarStudy0lat').fill('90');
    await p.locator('#solarStudy0lat').press('Tab');
    assert.equal((await p.evaluate(() => SkySolarStudy.read())).samples[1].lat, 90);
    assert(
      await p
        .locator('#solarStudyPanel svg path')
        .evaluateAll((ns) => ns.every((n) => !/(NaN|Infinity)/.test(n.getAttribute('d') || ''))),
    );
    await p.locator('#solarStudy0city').selectOption('-33.9,151.2');
    assert.equal((await p.evaluate(() => SkySolarStudy.read())).samples[1].lat, -33.9);
    const latitude = p.locator('#solarStudyControls [data-scrub=lat]').first();
    await latitude.focus();
    await latitude.press('ArrowRight');
    assert.equal((await p.evaluate(() => SkySolarStudy.read())).samples[1].lat, -33.8);
    assert.equal(await p.locator('#solarStudy0lat').inputValue(), '-33.8');
    assert.equal(await p.locator('#solarStudy0city').inputValue(), '');
    assert.deepEqual(await p.evaluate(() => [state.lat, state.lon]), [40, 0]);
    await latitude.evaluate((n) => {
      n.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      n.value = '20';
      n.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await p.waitForFunction(() => SkySolarStudy.read().samples[1].lat === 20);
    await latitude.press('Escape');
    assert.equal((await p.evaluate(() => SkySolarStudy.read())).samples[1].lat, -33.8);
    await latitude.dispatchEvent('pointerup');
    await set({ manual: true, dec: 23.44 });
    await p.waitForFunction(() => !document.querySelector('.solar-study-blocked').hidden);
    assert.equal(await p.locator('.solar-study-drawings').isVisible(), false);
    await p.locator('.solar-study-switch button').nth(0).click();
    assert(
      (await p.evaluate(() => SkySolarStudy.read())).samples.every((s) =>
        Number.isFinite(s.point.alt),
      ),
    );
    await set({ manual: false, date: '1900-01-01', time: 0 });
    assert.equal(
      (await p.evaluate(() => SkySolarStudy.read())).samples[0].point,
      null,
      'date boundary has an explicit unavailable comparison',
    );
    await require('./diagram-test-helpers.cjs').selectDiagram(p, 'contextPanel');
    await p.locator('#solarStudyPanel').waitFor({ state: 'hidden' });
    assert.equal(await p.locator('#solarStudyPanel').isVisible(), false);
    await require('./diagram-test-helpers.cjs').selectDiagram(p, 'solarStudy');
    await p.locator('.solar-study-switch button').nth(1).click();
    await set({ date: '2026-06-21', time: 720, lat: 39.9, lon: 116.4 });
    await p.locator('.solar-study-presets button').first().click();
    await p.screenshot({ path: 'tests/artifacts/study66-place-desktop.png' });
    await set({ date: '1900-01-01', time: 0, lat: 0, lon: 180, manual: false });
    await p.locator('.solar-study-presets button').nth(1).click();
    data = await p.evaluate(() => SkySolarStudy.read());
    assert.equal(
      data.samples[1].date,
      undefined,
      'unsupported comparison dates have no local clock',
    );
    assert.equal(
      data.samples[1].point,
      null,
      'unsupported comparison dates do not show an ephemeris marker',
    );
    assert(
      await p
        .locator('.solar-study-card')
        .nth(1)
        .locator('svg > g:nth-of-type(3) path')
        .evaluateAll((ns) => ns.every((n) => !n.getAttribute('d'))),
      'unsupported local dates do not draw a path using the baseline date',
    );
    assert.doesNotMatch(await p.locator('#solarStudyPanel').innerText(), /NaN/);
    const m = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    m.on('pageerror', (e) => errors.push(e.message));
    await m.goto(base + 'diagrams.en.html#solarStudy');
    await m.waitForFunction(() => window.SkySolarStudy && window.SkyCustomization);
    await m.locator('.layout-launch').click();
    await require('./diagram-test-helpers.cjs').selectDiagram(m, 'solarStudy');
    await m.waitForFunction(() => SkySolarStudy.read());
    await m.locator('#uiParametersButton').click();
    await m.locator('.solar-study-switch button').nth(1).click();
    assert.equal((await m.evaluate(() => SkySolarStudy.read())).mode, 'place');
    assert.equal(
      await m.locator('#solarStudyControls').evaluate((n) => /[\u3400-\u9fff]/.test(n.innerText)),
      false,
    );
    await m.keyboard.press('Escape');
    await m.waitForFunction(
      () => document.querySelector('#uiParametersButton').getAttribute('aria-expanded') === 'false',
    );
    await m.waitForTimeout(350);
    await m.locator('#solarStudyPanel').evaluate((n) => (n.scrollTop = n.scrollHeight));
    assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await m.locator('.solar-study-readings').isVisible(), true);
    await m.screenshot({ path: 'tests/artifacts/study66-place-mobile.png' });
    assert.deepEqual(errors, []);
    console.log(
      'PASS customization-only comparisons, east/west geometry, hemispheres, shared UTC, native ephemeris agreement, independent controls, leap-day rollover, polar finiteness, invalid input, ideal/date boundaries, routing, English/mobile controls and overflow',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
