/** Ground bearings must follow the same visible world directions as the sky. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + 'lab.en.html');
    await page.waitForSelector('html[data-fonts-ready]');
    const results = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 500;
      const c = canvas.getContext('2d'), paint = c.fillText.bind(c);
      let labels = [], ellipses = 0;
      c.fillText = (value, x, y, ...rest) => { labels.push({ name: String(value), x, y }); paint(value, x, y, ...rest); };
      c.ellipse = () => { ellipses++; };
      return [0, 90, 180, 270, 284, 359].map(bearing => {
        const frames = [bearing, (bearing + 5) % 360].map(az => {
          labels = [];
          const frame = observerFrame(800, 500, az);
          drawObserverGround(c, 800, 500, frame, az);
          const direction = { x: Math.sin(bearing * rad), y: 0, z: Math.cos(bearing * rad) };
          const cardinal = (Math.round(bearing / 90) * 90) % 360;
          const p = { x: Math.sin(cardinal * rad), y: 0, z: Math.cos(cardinal * rad) };
          const expected = frame.project(p).x;
          const label = labels.find(label => label.name === heading(cardinal) || label.name === skyTranslate(heading(cardinal)));
          return { label, expected, skyX: frame.project(direction).x, labels };
        });
        return { bearing, frames, ellipses };
      });
    });
    for (const result of results) {
      assert.equal(result.ellipses, 0, 'No ambiguous rotating ground disk');
      for (const frame of result.frames) {
        assert(frame.label, JSON.stringify(result));
        assert(Math.abs(frame.label.x - frame.expected) < 1e-6, JSON.stringify(result));
      }
      assert(result.frames[1].label.x < result.frames[0].label.x, 'Ground markings move left with the sky when looking right');
      assert(result.frames[1].skyX < result.frames[0].skyX, 'Sky direction follows the same motion');
    }
    await page.locator('[data-rail-section=views]').click();
    await page.locator('.workbench-viewpoints [data-view=observer]').click();
    await page.waitForFunction(() => state.view === 'observer');
    for (const width of [1280, 960, 390]) {
      await page.setViewportSize({ width, height: 960 });
      await page.screenshot({ path: '/tmp/observer-heading-' + width + '.png' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    }
    assert.deepEqual(errors, []);
    console.log('PASS matching ground/sky direction and movement at every cardinal and north wrap; no rotating disk; desktop/tablet/phone');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
