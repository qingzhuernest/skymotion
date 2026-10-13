/** Browser regression: switch alignment, uniform related-link gaps and responsive visibility. */
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
    ],
  });
  try {
    for (const width of [1280, 960, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      let errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      for (const path of [
        'lab.html',
        'diagrams.html',
        'analemma.html',
        'sundial.html',
        'space/',
        'guide.html',
        'project-guide.html',
        'development-guide.html',
        'index.html',
      ]) {
        await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.waitForTimeout(path === 'space/' ? 1500 : 350);
        const rows = await page.evaluate(() => {
          const drawer = document.querySelector('#uiParameterDrawer');
          if (drawer && !drawer.open && matchMedia('(max-width:760px)').matches) drawer.showModal();
          document
            .querySelectorAll('.ui-parameters details,.side details')
            .forEach((d) => (d.open = true));
          const tools = document.querySelector('#sceneTools');
          if (tools) tools.open = true;
          return document.querySelectorAll('.ui-parameters,.side,.scene-tools-panel').length;
        });
        await page.evaluate(async () => {
          const animations = document.getAnimations().filter(a => a.effect?.target instanceof Element && a.effect.target.closest('.ui-parameters,.side,.scene-tools-panel') && Number.isFinite(a.effect.getComputedTiming().endTime));
          await Promise.all(animations.map(a => a.finished.catch(() => {})));
        });
        const result = await page.evaluate(() => {
          const visible = (e) =>
            e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden';
          const labels = [
            ...document.querySelectorAll(
              '.ui-parameters :is(.toggle-row,.overlay-toggle),.side .toggles > label,.scene-tools-panel .tools-check',
            ),
          ].filter(visible);
          const faults = labels.flatMap((row) => {
            const input = row.querySelector('input[type=checkbox]');
            if (!input) return [];
            const r = row.getBoundingClientRect(),
              i = input.getBoundingClientRect();
            const end = r.right - parseFloat(getComputedStyle(row).paddingRight);
            return Math.abs(i.width - 44) > 1 ||
              Math.abs(i.height - 26) > 1 ||
              Math.abs(end - i.right) > 1 ||
              r.height < 43
              ? [
                  {
                    id: input.id,
                    width: i.width,
                    height: i.height,
                    alignment: end - i.right,
                    row: r.height,
                  },
                ]
              : [];
          });
          const hidden = [...document.querySelectorAll('[hidden]')]
            .filter((e) => visible(e) && getComputedStyle(e).display !== 'none')
            .map((e) => e.id || e.className);
          const nav = document.querySelector('.ui-parameters .study-navigation');
          const children = nav ? [...nav.children].filter(visible) : [];
          const gaps = children
            .slice(1)
            .map(
              (e, i) => e.getBoundingClientRect().top - children[i].getBoundingClientRect().bottom,
            );
          const gapFaults = gaps.filter((g) => Math.abs(g - 8) > 1);
          return {
            rows: labels.length,
            faults,
            hidden,
            gapFaults,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
          };
        });
        assert.deepEqual(result.faults, [], path + ' ' + width + ' switch geometry');
        assert.deepEqual(result.hidden, [], path + ' ' + width + ' hidden controls');
        assert.deepEqual(result.gapFaults, [], path + ' ' + width + ' navigation gaps');
        assert(!result.overflow, path + ' ' + width + ' horizontal overflow');
        console.log('PASS', width, path, result.rows + ' switch rows');
      }
      assert.deepEqual(errors, [], width + ' browser exceptions');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
