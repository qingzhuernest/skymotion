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
    await p.goto(base + 'diagrams.html#lunarOrbit');
    await p.waitForSelector('#lunarOrbitPanel iframe[src]');
    const frame = await (await p.locator('#lunarOrbitPanel iframe').elementHandle()).contentFrame();
    await frame.waitForFunction(() => !!window.LunarOrbitLesson);
    await frame.waitForTimeout(150);
    assert.equal(
      await p.locator('[data-diagram="lunarOrbit"]').getAttribute('aria-selected'),
      'true',
    );
    assert.equal(await p.locator('.ui-timeline-host').isVisible(), false);
    assert.equal(await frame.locator('canvas').count(), 1);
    assert.equal(await frame.locator('#lunarFailure').isVisible(), false);
    const science = () =>
        p.evaluate(() => ({ date: state.date, time: state.time, lat: state.lat, lon: state.lon })),
      initial = await science();
    const input = async (id, value) =>
      frame.locator('#' + id).evaluate((el, value) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, value);
    await input('orbitAngle', 180);
    await frame.waitForFunction(() => LunarOrbitLesson.read().visibility === 'hidden');
    await input('orbitAngle', 0);
    assert.equal((await frame.evaluate(() => LunarOrbitLesson.read())).visibility, 'visible');
    await input('phaseAngle', 180);
    await frame.waitForFunction(
      () => document.getElementById('earthIllumination').textContent === '0.0%',
    );
    await frame.locator('[data-mode="surface"]').click();
    await frame.waitForFunction(() => document.getElementById('orbitAngle').disabled);
    assert(await frame.locator('#orbitAngle').isDisabled());
    assert(await frame.locator('#playOrbit').isDisabled());
    assert.equal((await frame.evaluate(() => LunarOrbitLesson.read())).altitude, 90);
    await input('phaseAngle', 0);
    assert.equal((await frame.evaluate(() => LunarOrbitLesson.read())).altitude, 90);
    await frame.locator('[data-mode="orbit"]').click();
    await frame.locator('#seekRise').click();
    await frame.waitForTimeout(180);
    assert((await frame.evaluate(() => LunarOrbitLesson.read())).playing);
    await p.locator('[data-diagram="chartPanel"]').click();
    await frame.waitForFunction(() => !LunarOrbitLesson.read().playing);
    assert(await p.locator('.ui-timeline-host').isVisible());
    assert.deepEqual(await science(), initial);
    await p.locator('[data-diagram="lunarOrbit"]').click();
    assert.equal(await p.locator('#lunarOrbitPanel iframe').count(), 1);
    await p.locator('.language-toggle').click();
    await frame.waitForFunction(() => document.documentElement.lang === 'en');
    await frame.waitForTimeout(80);
    assert(
      !/[\u3400-\u9fff]/.test(await frame.locator('body').innerText()),
      'English scene and control labels are complete',
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
