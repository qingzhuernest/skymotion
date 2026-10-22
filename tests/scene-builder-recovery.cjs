/** Damaged measurement archives must not disable an otherwise valid ground scene. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const { enterCustomization } = require('./diagram-test-helpers.cjs');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8997/').replace(/\/?$/, '/');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-gpu', '--use-angle=swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base + 'diagrams.html#sceneBuilder');
    await enterCustomization(page);
    await page.waitForFunction(() => window.SkySceneBuilder?.read());
    await page.locator('.sb-examples').evaluate((node) => {
      node.open = true;
    });
    await page.locator('.sb-examples button').first().click();
    await page.evaluate(() => {
      const scene = SkySceneBuilder.read();
      const rods = scene.objects.filter((object) => object.kind === 'rod');
      const circle = scene.objects.find((object) => object.kind === 'circle');
      scene.measurements = [
        { kind: 'distance', ids: rods.map((rod) => rod.id) },
        { kind: 'angleMeasure', ids: [] },
        { kind: 'angleMeasure', ids: [rods[0].id] },
        { kind: 'distance', ids: [rods[0].id, rods[0].id] },
        { kind: 'distance', ids: [rods[0].id, 'missing-object'] },
        { kind: 'shadowMeasure', ids: [circle.id] },
        { kind: 'unknown', ids: rods.map((rod) => rod.id) },
        null,
      ];
      localStorage.setItem('skymotion-scene-builder-v1-sun', JSON.stringify(scene));
    });
    await page.reload();
    await enterCustomization(page);
    await page.waitForFunction(() => window.SkySceneBuilder?.read()?.objects.length === 4);
    assert.equal(await page.evaluate(() => SkySceneBuilder.read().measurements.length), 1);
    await page.locator('.sb-tool-section').evaluateAll((nodes) => {
      nodes.forEach((node) => {
        node.open = true;
      });
    });
    for (const [time, expected] of [
      [599.75, '10:00'],
      [1439.75, '24:00'],
    ]) {
      await page.evaluate((value) => {
        state.time = value;
      }, time);
      await page.getByRole('button', { name: '记录当前时刻', exact: true }).click();
      const record = await page.evaluate(() => SkySceneBuilder.read().notes.at(-1).text);
      assert(record.includes(expected), record);
      assert(!record.includes(':60'), record);
    }
    assert.deepEqual(errors, []);
    console.log(
      'PASS invalid measurements are discarded, valid scene remains usable, event times carry minutes correctly',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
