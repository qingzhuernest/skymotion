/** Visible focus exit and stable target selection during repeated view replacement. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(
  /\/?$/,
  '/',
);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-angle=swiftshader'],
  });
  try {
    for (const [width, language, body] of [
      [1440, 'zh', 'sun'],
      [960, 'en', 'moon'],
    ]) {
      const page = await browser.newPage({ viewport: { width, height: 960 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(base + 'lab' + (language === 'en' ? '.en' : '') + '.html');
      await page.waitForFunction(
        () => window.SkyWorkbenchMenu && window.skyWorkspacePresentation,
      );
      if (body === 'moon') await page.locator('button[data-body=moon]').click();
      await page.locator('[data-rail-section=views]').click();
      await page.locator('[data-workbench-view=solarCompare]').click();
      await page.waitForFunction(() => skyWorkspacePresentation.active);
      const views = () => page.evaluate(() => skyWorkspacePresentation.views);
      const active = () => page.evaluate(() => skyWorkspacePresentation.activeView);
      const card = (id) => page.locator(`[data-diagram-card="${id}"]`);
      const original = await views();
      assert(original.length >= 2);
      const first = card(original[0]),
        second = card(original[1]);
      assert.equal(await page.evaluate(() => SkyCustomization.active), false);
      // Child handlers may stop bubbling; target activation must still happen.
      await second.locator('h2').evaluate((node) =>
        node.addEventListener('pointerdown', (event) => event.stopPropagation(), {
          once: true,
        }),
      );
      await second.locator('h2').click();
      assert.equal(await active(), original[1]);
      assert.equal(await second.getAttribute('aria-current'), 'true');
      assert.notEqual(
        await second.evaluate((node) => getComputedStyle(node).outlineStyle),
        'none',
      );
      for (const exit of ['button', 'escape', 'double-click']) {
        await first.locator('h2').dblclick();
        await page.waitForFunction(
          () => document.querySelector('.ui-plot').dataset.workspaceFocus === 'true',
        );
        const back = first.locator('.ui-diagram-card-head > [data-word=back]');
        assert(
          await back.isVisible(),
          'Ordinary mode exposes a return action in the focused header',
        );
        assert.match(await back.innerText(), /Esc/);
        const geometry = await back.evaluate((button) => {
          const icon = button.querySelector('svg').getBoundingClientRect();
          const header = button.parentElement.getBoundingClientRect();
          const target = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
              '--md-sys-size-target',
            ),
          );
          return {
            iconWidth: icon.width,
            iconHeight: icon.height,
            headerHeight: header.height,
            target,
          };
        });
        assert(
          geometry.iconWidth <= 24 && geometry.iconHeight <= 24,
          'The return icon retains shared toolbar sizing: ' + JSON.stringify(geometry),
        );
        assert(
          geometry.headerHeight <= geometry.target + 16,
          'The focused header stays compact: ' + JSON.stringify(geometry),
        );
        if (exit === 'button')
          await page.screenshot({
            path: `tests/artifacts/multiview-focused-${width}-${language}.png`,
          });
        if (exit === 'button') await back.click();
        else if (exit === 'escape') await page.keyboard.press('Escape');
        else await first.locator('h2').dblclick();
        await page.waitForFunction(
          () => document.querySelector('.ui-plot').dataset.workspaceFocus === 'false',
        );
        assert.equal(
          await page.locator('.ui-diagram-card:visible').count(),
          original.length,
        );
        assert.equal(await page.locator('[data-word=back]').isVisible(), false);
      }
      // A sidebar replacement applies to the last clicked plot, not an older target.
      await second.locator('h2').click();
      await page.locator('[data-rail-section=views]').click();
      await page.locator('.workbench-viewpoints [data-view=orbit]').click();
      assert.equal(await active(), 'skyPanel');
      assert.equal((await views())[1], 'skyPanel');
      await require('./diagram-test-helpers.cjs').toggleCustomization(page);
      await page.waitForFunction(() => SkyCustomization.active);
      // Native select focus used to reactivate the old card after swapping nodes.
      for (let index = 0; index < 6; index++) {
        const [source, replacement] = await views();
        const select = card(source).locator('.workspace-pane-tools select');
        await select.focus();
        await select.selectOption(replacement);
        assert.equal((await views())[0], replacement);
        assert.equal(await active(), replacement);
        assert.equal(
          await page.evaluate(
            () =>
              document.activeElement.closest('[data-diagram-card]')?.dataset.diagramCard,
          ),
          replacement,
        );
      }
      // Applying an unchanged layout must preserve its mounted canvases and focus.
      const moves = await page.evaluate(async () => {
        let count = 0;
        const observer = new MutationObserver((records) => {
          for (const record of records)
            if (record.target === uiWorkspace.plot)
              count += [...record.addedNodes, ...record.removedNodes].filter(
                (node) =>
                  node.nodeType === 1 && node.classList.contains('ui-diagram-card'),
              ).length;
        });
        observer.observe(uiWorkspace.plot, { childList: true });
        skyWorkspacePresentation.openOverview();
        await Promise.resolve();
        observer.disconnect();
        return count;
      });
      assert.equal(moves, 0, 'No remount of unchanged scientific panes');
      const selected = await active();
      await card(selected).locator('.workspace-focus-button').click();
      assert(
        await card(selected)
          .locator('.ui-diagram-card-head > [data-word=back]')
          .isVisible(),
      );
      assert.equal(await page.locator('#layoutTools').isVisible(), false);
      await page.keyboard.press('Escape');
      assert.equal(
        await page.locator('.ui-diagram-card:visible').count(),
        original.length,
      );
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(
      'PASS normal/editing focus exit by visible action, Escape and double-click; capture-phase target selection; repeated native swaps; stable canvas mounting in Sun/Moon and both locales',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
