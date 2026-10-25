/** Reported UI regressions: inspect painted corners, shared states and actual navigation behavior. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const helpers = require('./diagram-test-helpers.cjs');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:38657/').replace(
  /\/?$/,
  '/',
);
async function paintedCorner(page, button, insideRight) {
  const png = await button.screenshot();
  return page.evaluate(
    async ({ png, insideRight }) => {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = 'data:image/png;base64,' + png;
      });
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const c = canvas.getContext('2d', { willReadFrequently: true });
      c.drawImage(image, 0, 0);
      const pixel = (x, y) =>
        [...c.getImageData(Math.floor(x), Math.floor(y), 1, 1).data].slice(0, 3);
      const corner = pixel(insideRight ? image.width - 3 : 2, 2),
        inside = pixel(image.width / 2, 2);
      return {
        corner,
        inside,
        difference: corner.reduce((sum, v, i) => sum + Math.abs(v - inside[i]), 0),
      };
    },
    { png: png.toString('base64'), insideRight },
  );
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-angle=swiftshader'],
  });
  try {
    const railStyles = [];
    const choiceStates = [];
    const choiceStyle = (n) => {
      const s = getComputedStyle(n);
      return {
        fill: s.backgroundColor,
        color: s.color,
        border: s.border,
        font: s.fontSize,
        padding: s.padding,
        radius: s.borderRadius,
      };
    };
    for (const width of [1440, 390]) {
      const page = await browser.newPage({
        viewport: { width, height: 960 },
        hasTouch: width < 760,
        isMobile: width < 760,
        reducedMotion: 'reduce',
      });
      console.log('Checking lab shared controls', width);
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base + 'lab.html');
      await page.waitForFunction(
        () =>
          window.SkyWorkbenchMenu &&
          document.documentElement.hasAttribute('data-fonts-ready'),
      );
      for (const body of ['moon', 'sun']) {
        await page.locator(`[data-body=${body}]`).click();
        await page.mouse.move(width - 5, 400);
        const corner = await paintedCorner(
          page,
          page.locator('.body-switch [aria-pressed=false]'),
          body === 'moon',
        );
        assert(
          corner.difference > 30,
          'Painted inner corners must be visibly rounded, not just report12px: ' +
            JSON.stringify(corner),
        );
      }
      if (width === 1440) {
        const choice = page.locator('.body-switch [data-body=moon]');
        await page.mouse.move(width - 5, 400);
        choiceStates.push(await choice.evaluate(choiceStyle));
        await choice.hover();
        choiceStates.push(await choice.evaluate(choiceStyle));
        await page.mouse.down();
        choiceStates.push(await choice.evaluate(choiceStyle));
        await page.mouse.up();
        await page.locator('[data-body=sun]').click();
      }
      if (width < 760) await helpers.openDrawer(page);
      await page.locator('[data-rail-section=views]').click();
      await page.locator('[data-view=orbit]').click();
      const shape = await page.locator('[data-view=orbit]').evaluate((n) => ({
        fill: getComputedStyle(n).backgroundColor,
        color: getComputedStyle(n).color,
      }));
      await page.locator('[data-view=orbit]').hover();
      assert.deepEqual(
        await page.locator('[data-view=orbit]').evaluate((n) => ({
          fill: getComputedStyle(n).backgroundColor,
          color: getComputedStyle(n).color,
        })),
        shape,
        'Hover must keep selected fill and foreground',
      );
      await page.locator('[data-workbench-view=riseSetPanel]').click();
      await page.waitForFunction(
        () => !document.querySelector('.workbench-viewpoints [aria-pressed=true]'),
      );
      assert.equal(
        await page.locator('.workbench-viewpoints [aria-pressed=true]').count(),
        0,
        'Remembered sky viewpoint must not appear current in a different diagram',
      );
      assert.deepEqual(
        await page.locator('[data-workbench-view=riseSetPanel]').evaluate((n) => ({
          fill: getComputedStyle(n).backgroundColor,
          color: getComputedStyle(n).color,
        })),
        shape,
        'Related diagrams and viewpoints share the same selection component',
      );
      console.log('Checking seasons and rail', width);
      await page.locator('[data-rail-section=conditions]').click();
      await page.locator('#seasonButtons').evaluate((n) => {
        for (let p = n.parentElement; p; p = p.parentElement)
          if (p.tagName === 'DETAILS') p.open = true;
      });
      const season = await page
        .locator('#seasonButtons button')
        .first()
        .evaluate((n) => {
          const s = getComputedStyle(n);
          return {
            height: n.getBoundingClientRect().height,
            painted: parseFloat(getComputedStyle(n, '::before').height),
            class: n.parentElement.className,
          };
        });
      assert.equal(season.painted, 32);
      assert(season.height >= (width < 760 ? 48 : 40));
      assert(season.class.includes('md-connected-choice'));
      const seasons = page.locator('#seasonButtons button');
      for (const index of [0, 1]) {
        await seasons.nth(index).click();
        await page.waitForFunction(
          (index) =>
            document
              .querySelectorAll('#seasonButtons button')
              [index].getAttribute('aria-pressed') === 'true',
          index,
        );
        const selectedSeason = await seasons.nth(index).evaluate((n) => {
          const s = getComputedStyle(n);
          return {
            fill: getComputedStyle(n, '::before').backgroundColor,
            color: s.color,
            painted: parseFloat(getComputedStyle(n, '::before').height),
          };
        });
        assert.deepEqual(
          selectedSeason,
          { ...shape, painted: 32 },
          'Seasonal selection uses the shared fill and preserves compact painted height',
        );
      }
      if (width === 1440) {
        await page.locator('.motion-menu-grip').click();
        const edge = page.locator('.motion-menu-edge');
        await edge.waitFor({ state: 'visible' });
        const state = async () =>
          edge.evaluate((n) => {
            const s = getComputedStyle(n),
              r = n.getBoundingClientRect();
            return {
              width: r.width,
              height: r.height,
              fill: s.backgroundColor,
              color: s.color,
              radius: s.borderRadius,
              border: s.border,
              svg: n.querySelectorAll('svg').length,
            };
          });
        const normal = await state();
        await edge.hover();
        assert.deepEqual(await state(), normal);
        railStyles.push(normal);
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    const space = await browser.newPage({
      viewport: { width: 1440, height: 960 },
      reducedMotion: 'reduce',
    });
    console.log('Checking 3D shared rail and focus');
    const spaceErrors = [];
    space.on('pageerror', (e) => spaceErrors.push(e.message));
    await space.goto(base + 'space/index.html');
    await space.waitForFunction(
      () => typeof spaceState === 'function' && !spaceState().fallback,
    );
    const modelChoice = space.locator('#earthmoon');
    const modelStates = [];
    await space.mouse.move(5, 400);
    modelStates.push(await modelChoice.evaluate(choiceStyle));
    await modelChoice.hover();
    modelStates.push(await modelChoice.evaluate(choiceStyle));
    await space.mouse.down();
    modelStates.push(await modelChoice.evaluate(choiceStyle));
    await space.mouse.up();
    assert.deepEqual(
      modelStates,
      choiceStates,
      'Lab and3D exclusive controls share normal, hover and pressed skins',
    );
    await space.locator('#overview').click();
    const auxiliary = await space
      .locator('.head-actions > .md-outlined-action:not([hidden])')
      .evaluateAll((nodes) =>
        nodes.map((n) => {
          const s = getComputedStyle(n),
            r = n.getBoundingClientRect();
          return {
            fill: s.backgroundColor,
            color: s.color,
            border: s.border,
            radius: s.borderRadius,
            height: r.height,
            top: r.top,
            font: s.fontSize,
            padding: s.padding,
          };
        }),
      );
    assert(auxiliary.length >= 2);
    assert.deepEqual(
      await space
        .locator('.viewbar > .md-connected-choice')
        .evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).gap)),
      ['2px', '2px'],
      'Both3D exclusive groups use the shared connected gap',
    );
    assert.deepEqual(
      auxiliary[0],
      auxiliary[1],
      '3D auxiliary actions share the same component and alignment',
    );
    const planetShapes = await space
      .locator('.planet-picker button')
      .evaluateAll((nodes) =>
        nodes.map((n) => {
          const s = getComputedStyle(n, '::before');
          return {
            painted: parseFloat(s.height),
            corner: s.borderRadius,
            target: n.getBoundingClientRect().height,
          };
        }),
      );
    assert.equal(planetShapes.length, 8);
    assert(
      planetShapes.every(
        (p) => p.painted === 32 && p.corner === '999px' && p.target >= 40,
      ),
      'All planets, including the selected planet, keep their flatter proportions',
    );
    await space.locator('[data-planet="4"]').click();
    await space.waitForFunction(() => spaceState().selected === 4);
    assert.equal(
      await space
        .locator('[data-planet="4"]')
        .evaluate((n) => getComputedStyle(n, '::before').borderRadius),
      '999px',
    );
    await space.locator('[data-planet="2"]').click();
    await space.waitForFunction(() => spaceState().selected === 2);
    await space.locator('#focus').click();
    await space.waitForFunction(() => spaceState().view === 'earthmoon');
    await space.waitForFunction(() =>
      document.getElementById('focus').textContent.includes('返回'),
    );
    assert.equal(await space.locator('#focus').getAttribute('aria-pressed'), 'true');
    await space.locator('#focus').click();
    await space.waitForFunction(() => spaceState().view === 'overview');
    await space.waitForFunction(
      () => document.getElementById('focus').getAttribute('aria-pressed') === 'false',
    );
    const alignment = await space.evaluate(() => {
      const a = document
          .querySelector('.workbench-header .ui-heading h1')
          .getBoundingClientRect(),
        b = document.querySelector('.page-nav').getBoundingClientRect();
      return a.right - b.left;
    });
    assert(alignment <= 1, '3D identity precedes the stable primary navigation');
    const sticky = await space.locator('.side').evaluate((rail) => {
      rail.scrollTop = 300;
      const header = rail.querySelector('.motion-menu-header');
      return {
        top: header.getBoundingClientRect().top - rail.getBoundingClientRect().top,
        fill: getComputedStyle(header).backgroundColor,
        railFill: getComputedStyle(rail).backgroundColor,
      };
    });
    assert(
      sticky.top <= 1,
      'No scrolled content is exposed above the sticky header: ' + sticky.top,
    );
    assert.equal(sticky.fill, sticky.railFill);
    await space.locator('.motion-menu-grip').click();
    const edge = space.locator('.motion-menu-edge');
    await edge.waitFor({ state: 'visible' });
    const style = await edge.evaluate((n) => {
      const s = getComputedStyle(n),
        r = n.getBoundingClientRect();
      return {
        width: r.width,
        height: r.height,
        fill: s.backgroundColor,
        color: s.color,
        radius: s.borderRadius,
        border: s.border,
        svg: n.querySelectorAll('svg').length,
      };
    });
    assert.deepEqual(style, railStyles[0], 'Lab and3D use one shared rail handle');
    assert.deepEqual(spaceErrors, []);
    await space.close();
    for (const [width, language] of [
      [320, 'en'],
      [390, 'zh'],
    ]) {
      console.log('Checking responsive 3D app bar', width, language);
      const page = await browser.newPage({
        viewport: { width, height: 960 },
        reducedMotion: 'reduce',
        isMobile: true,
        hasTouch: true,
      });
      await page.goto(base + 'space/index' + (language === 'en' ? '.en' : '') + '.html', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForFunction(
        () =>
          typeof spaceState === 'function' &&
          document.documentElement.hasAttribute('data-fonts-ready'),
      );
      const navigation = await page.locator('.page-nav a').allTextContents();
      for (const immersive of [false, true, false]) {
        if (
          ((await page.locator('body').getAttribute('class')) || '').includes(
            'space-immersive',
          ) !== immersive
        )
          await page.locator('#spaceImmersive').click();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          '3D app bar and toolbar must fit narrow screens in both modes',
        );
        assert(await page.locator('#spaceImmersive').isVisible());
        assert.deepEqual(await page.locator('.page-nav a').allTextContents(), navigation);
      }
      await page.close();
    }
    for (const width of [1440, 390])
      for (const lang of ['zh', 'en']) {
        const page = await browser.newPage({
          viewport: { width, height: 960 },
          reducedMotion: 'reduce',
        });
        console.log('Checking documents', width, lang);
        await page.goto(
          base + 'project-guide' + (lang === 'en' ? '.en' : '') + '.html?lang=' + lang,
        );
        await page.locator('.entrance-dialogue').waitFor();
        const centers = await page.locator('.entrance-sentence').evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = document.createRange();
            r.selectNodeContents(n);
            const b = r.getBoundingClientRect();
            return b.x;
          }),
        );
        assert(
          centers.every((c) => Math.abs(c - centers[0]) < 2),
          'Dialogue lines share a single left edge: ' + centers,
        );
        await page.locator('.entrance-continue').click();
        await page.locator('.document-entrance').waitFor({ state: 'detached' });
        assert.equal(
          await page.locator('.document-toc summary,.document-reading-progress').count(),
          0,
        );
        assert.equal(
          await page.locator('.document-toc').evaluate((n) => n.tagName),
          'NAV',
        );
        await page.evaluate(() => scrollTo(0, 900));
        await page.locator('.document-back-top').waitFor({ state: 'visible' });
        await page.locator('.document-back-top').click();
        await page.waitForFunction(() => scrollY < 1);
        await page.locator('.document-back-top').waitFor({ state: 'hidden' });
        await page.close();
      }
    console.log(
      'PASS painted connected corners, shared sidebar selection/hover,32px seasonal and planet surfaces, identical rail handles, close/overview feedback, left-aligned opening dialogue, fixed contents and Back to top',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
