/** Real control geometry and the user's original typography are product invariants. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const helpers = require('./diagram-test-helpers.cjs');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(
  /\/?$/,
  '/',
);
function overlaps() {
  const modal = [...document.querySelectorAll('dialog[open]')].at(-1);
  const nodes = [
    ...document.querySelectorAll(
      '.language-nav :is(button,a,select),.ui-parameters :is(button,input,select,summary),.ui-diagram-card-head :is(button,select)',
    ),
  ];
  const visible = [];
  for (const n of nodes) {
    if (n.closest('dialog:not([open])') || (modal && !modal.contains(n))) continue;
    let closed = false;
    for (let p = n.parentElement; p; p = p.parentElement)
      if (
        p.matches('details:not([open])') &&
        !p.querySelector(':scope > summary')?.contains(n)
      ) {
        closed = true;
        break;
      }
    if (closed) continue;
    const r = n.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || getComputedStyle(n).visibility === 'hidden')
      continue;
    const clip = {
      left: Math.max(0, r.left),
      right: Math.min(innerWidth, r.right),
      top: Math.max(0, r.top),
      bottom: Math.min(innerHeight, r.bottom),
    };
    for (let p = n.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p),
        b = p.getBoundingClientRect();
      if (/hidden|clip|auto|scroll/.test(s.overflowX)) {
        clip.left = Math.max(clip.left, b.left);
        clip.right = Math.min(clip.right, b.right);
      }
      if (/hidden|clip|auto|scroll/.test(s.overflowY)) {
        clip.top = Math.max(clip.top, b.top);
        clip.bottom = Math.min(clip.bottom, b.bottom);
      }
    }
    if (clip.right > clip.left + 2 && clip.bottom > clip.top + 2)
      visible.push({ n, clip });
  }
  const found = [];
  for (let i = 0; i < visible.length; i++)
    for (let j = i + 1; j < visible.length; j++) {
      const a = visible[i],
        b = visible[j];
      if (a.n.contains(b.n) || b.n.contains(a.n)) continue;
      const sa = a.n.closest('.motion-menu-header,.ui-drawer-header,.dt-status'),
        sb = b.n.closest('.motion-menu-header,.ui-drawer-header,.dt-status');
      if (sa !== sb && (sa || sb)) continue;
      const width =
          Math.min(a.clip.right, b.clip.right) - Math.max(a.clip.left, b.clip.left),
        height =
          Math.min(a.clip.bottom, b.clip.bottom) - Math.max(a.clip.top, b.clip.top);
      if (width > 3 && height > 3)
        found.push([
          a.n.id || a.n.textContent.slice(0, 24),
          b.n.id || b.n.textContent.slice(0, 24),
          width,
          height,
        ]);
    }
  return found;
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-angle=swiftshader'],
  });
  try {
    for (const [width, language] of [
      [1440, 'zh'],
      [960, 'en'],
      [390, 'zh'],
      [320, 'en'],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height: 960 },
        hasTouch: width < 760,
        isMobile: width < 760,
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base + 'lab' + (language === 'en' ? '.en' : '') + '.html');
      await page.waitForFunction(
        () =>
          document.documentElement.hasAttribute('data-fonts-ready') &&
          window.SkyCustomization &&
          !document.querySelector('.layout-launch').disabled,
      );
      const expected = language === 'en' ? 'SkyMotion Charter' : 'SkyMotion Reading';
      for (const selector of [
        'body',
        '.language-toggle',
        '.ui-heading h1',
        '#observationBody',
      ])
        assert(
          (
            await page.locator(selector).evaluate((n) => getComputedStyle(n).fontFamily)
          ).includes(expected),
          selector + ' must retain ' + expected,
        );
      await helpers.openLibrary(page);
      await page.locator('[data-tool-type=note]').click();
      await page.locator('.dt-place').click();
      const sliders = await page
        .locator('.dt-panel input[type=range]')
        .evaluateAll((nodes) =>
          nodes.map((n) => {
            const s = getComputedStyle(n);
            return { border: s.borderTopWidth, padding: s.paddingInlineStart };
          }),
        );
      assert(sliders.length > 0);
      for (const slider of sliders)
        assert.deepEqual(slider, { border: '0px', padding: '0px' });
      const icons = await page
        .locator('.dt-head button,.dt-history button')
        .evaluateAll((nodes) =>
          nodes
            .filter((n) => n.getBoundingClientRect().width)
            .map((n) => {
              const r = n.getBoundingClientRect();
              return { width: r.width, height: r.height };
            }),
        );
      for (const icon of icons)
        assert(Math.abs(icon.width - icon.height) < 1, JSON.stringify(icon));
      assert.deepEqual(
        await page.evaluate(overlaps),
        [],
        'Object editor controls overlap',
      );
      await page.evaluate(() => {
        SkyWorkbenchMenu.select('skyPanel');
        for (const id of ['contextPanel', 'chartPanel', 'riseSetPanel'])
          skyWorkspacePresentation.addView(id);
        SkyWorkbenchMenu.openLayout();
      });
      await page.locator('.workspace-save-form').waitFor({ state: 'visible' });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const fields = await page
        .locator('.workspace-proportions input')
        .evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = n.getBoundingClientRect();
            return { y: r.y, width: r.width };
          }),
        );
      assert(
        Math.abs(fields[0].y - fields[1].y) < 1,
        'Wrapped labels must not misalign their fields',
      );
      assert(Math.abs(fields[0].width - fields[1].width) < 1);
      const widths = await page
        .locator('.workspace-presets button')
        .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().width));
      assert(
        Math.max(...widths) - Math.min(...widths) < 1,
        'Layout choices share equal columns',
      );
      assert.equal(
        await page.locator('.workspace-options-head:visible').count(),
        0,
        'Inline settings reuse their existing disclosure heading',
      );
      assert.equal(
        await page
          .locator('.workspace-active .ui-diagram-surface .diagram-tool-launch:visible')
          .count(),
        0,
        'Pane actions must not cover scientific content',
      );
      assert(
        await page
          .locator('.ui-diagram-card-head > .diagram-tool-launch:visible')
          .count(),
      );
      assert.deepEqual(await page.evaluate(overlaps), [], 'Layout controls overlap');
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      );
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(
      'PASS original Song/Charter typography, slider/text-field separation, square icon targets, aligned fields and equal choices, no duplicate settings header or canvas-overlay pane actions, and non-overlapping desktop/phone controls',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
