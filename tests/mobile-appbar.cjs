/** Mobile identity precedes every navigation destination and the customization row. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader'] });
  try {
    for (const route of ['lab.html', 'lab.en.html', 'space/index.en.html', 'project-guide.en.html']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
      await page.goto(base + route);
      await page.waitForSelector('html[data-fonts-ready]');
      await page.locator('.language-nav .preferences-launch').waitFor({ state: 'visible' });
      for (const width of [320, 390, 760]) {
        await page.setViewportSize({ width, height: 960 });
        for (const uiScale of [1, 1.5]) {
          await page.evaluate(uiScale => SkyPreferences.set({ uiScale }), uiScale);
          const layout = await page.locator('.language-nav').evaluate(header => {
            const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
            const nav = header.querySelector('.page-nav');
            return { nav: rect(nav), title: rect(header.querySelector('h1')), items: [...nav.querySelectorAll('a,.preferences-launch')].map(rect),
              scroll: nav.scrollWidth > nav.clientWidth + 1, overflow: header.scrollWidth > header.clientWidth + 1,
              parameters: header.querySelector('#uiParametersButton') ? rect(header.querySelector('#uiParametersButton')) : null,
              customize: header.querySelector('.layout-launch') ? rect(header.querySelector('.layout-launch')) : null };
          });
          assert.equal(layout.items.length, 5, route);
          assert(!layout.scroll && !layout.overflow, JSON.stringify({ route, width, uiScale, layout }));
          assert(layout.title.bottom <= layout.nav.y + 1, JSON.stringify(layout));
          assert(layout.nav.right >= width - 9, JSON.stringify(layout));
          if(layout.parameters) assert(layout.parameters.bottom <= layout.nav.y + 1, JSON.stringify(layout));
          assert(layout.items.every(item => item.x >= 0 && item.right <= width + 1 && item.y >= layout.nav.y && item.bottom <= layout.nav.bottom + 1), JSON.stringify(layout));
          if (layout.customize) assert(layout.customize.y >= layout.nav.bottom - 1, JSON.stringify(layout));
        }
      }
      await page.evaluate(() => SkyPreferences.set({ uiScale: 1 }));
      await page.setViewportSize({ width: 390, height: 844 });
      if (route.startsWith('lab')) {
        await page.locator('.layout-launch').click();
        await page.waitForFunction(() => skyWorkspacePresentation.editing);
        await page.screenshot({ path: '/tmp/mobile-appbar-' + route + '.png' });
      }
      await page.close();
    }
    console.log('PASS mobile identity above all five destinations, no hidden/scrolling navigation, customization below, bilingual 320/390/760px and 150% text');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
