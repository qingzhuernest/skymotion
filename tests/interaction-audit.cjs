/** Editor state must not trap native controls, modal dialogs, or responsive sidebars. */
const assert = require('node:assert/strict'),
  { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8999/').replace(/\/?$/, '/');
const helpers = require('./diagram-test-helpers.cjs');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } }),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const route of ['lab.html', 'diagrams.en.html', 'analemma.html', 'space/index.en.html']) {
      await page.goto(base + route);
      await page.waitForFunction(
        () =>
          window.SkyDiagramTools &&
          window.SkyCustomization &&
          !document.querySelector('.layout-launch').disabled,
      );
      await page.evaluate(() => {
        window.modeEvents = [];
        document.addEventListener('skymotion:customization', (e) =>
          modeEvents.push(e.detail.active),
        );
      });
      await page.locator('.layout-launch').click();
      await page.locator('.dt-panel').waitFor({ state: 'visible' });
      await page.locator('[data-rail-section=conditions]').click();
      assert(
        await page.locator('[data-rail-section=conditions]').evaluate((n) => {
          const target = document.getElementById(n.getAttribute('aria-controls'));
          return !!target && !!target.getBoundingClientRect().width;
        }),
        'observation tab references a live control region',
      );
      await page.locator('[data-rail-section=references]').click();
      await page.evaluate(() => SkyCustomization.enter());
      assert.deepEqual(
        await page.evaluate(() => modeEvents),
        [true],
        're-entering does not duplicate state transitions',
      );
      if (route === 'lab.html') {
        await page.locator('[data-view=observer]').click();
        await page.locator('.observer-explanation-button').click();
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('#observerExplanation').open);
        assert(
          await page.locator('.dt-panel').isVisible(),
          'closing an explanation leaves the editor open',
        );
        await page.locator('#workbenchDate').click();
        await page.evaluate(() => render());
        assert.equal(
          await page.locator('.site-calendar [data-date].selected').count(),
          0,
          'season selection never styles date-picker cells',
        );
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('.site-calendar').open);
        assert(await page.locator('.dt-panel').isVisible(), 'the calendar owns Escape');
        await page.locator('.layout-launch').focus();
        await page.keyboard.press('Escape');
        assert(
          await page.locator('.dt-panel').isVisible(),
          'Escape outside the editor does not close it',
        );
      }
      // A bad reference field must block the same global exit on every scientific page.
      await helpers.addTool(page, 'note');
      await page.locator('.dt-place').click();
      const x = page.locator('.dt-fields [data-field=x]');
      await x.fill('');
      await page.locator('.layout-launch').click();
      assert.equal(await page.evaluate(() => SkyCustomization.active), true);
      assert.equal(await x.getAttribute('aria-invalid'), 'true');
      assert.deepEqual(await page.evaluate(() => modeEvents), [true]);
      await x.fill('45');
      await x.press('Enter');
      await page.locator('.dt-head button').last().click();
      if (route.startsWith('space/')) {
        await page.locator('#spaceImmersive').click();
        assert.equal(
          await page.locator('.side').evaluate((n) => n.classList.contains('dt-navigation-ready')),
          false,
          'immersive mode clears the closed rail',
        );
        await page.locator('.layout-launch').click();
        await page.locator('#spaceImmersive').click();
        assert(
          await page.locator('.side .card').first().isVisible(),
          'original space controls return after leaving customization in immersive mode',
        );
        assert(
          await page
            .locator('.language-actions')
            .evaluate((n) => n === n.parentElement.lastElementChild),
          'Customize and language return to the end of the main navigation',
        );
      } else {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForFunction(
          () => !document.querySelector('.ui-parameters').classList.contains('dt-navigation-ready'),
        );
        await page.locator('#uiParametersButton').click();
        await page.waitForFunction(() => {
          const d = document.querySelector('#uiParameterDrawer');
          return (
            d.open &&
            d.getAnimations().every((a) => a.playState !== 'running') &&
            d.getBoundingClientRect().left >= -1
          );
        });
        assert(
          await page.locator('#uiParameterDrawer').evaluate((n) => n.open),
          'responsive synchronization does not close a newly opened drawer',
        );
        assert(
          await page
            .locator(route === 'analemma.html' ? '.ui-parameters .analemma-controls' : '#controls')
            .isVisible(),
          route + ': closed desktop editor does not hide the phone controls',
        );
        await page.keyboard.press('Escape');
        await page.setViewportSize({ width: 1280, height: 960 });
        await page.locator('.layout-launch').click();
        assert(
          await page
            .locator(route === 'analemma.html' ? '.ui-parameters .analemma-controls' : '#controls')
            .isVisible(),
          route + ': normal desktop controls remain available',
        );
      }
      assert.equal(await page.evaluate(() => SkyCustomization.active), false);
      assert.deepEqual(await page.evaluate(() => modeEvents), [true, false]);
      assert.equal(await page.locator('.layout-launch').getAttribute('aria-pressed'), 'false');
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      console.log('PASS mode and responsive recovery', route);
    }
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      'PASS modal keyboard ownership, closed-editor desktop/phone and immersive recovery, consistent exit validation and single transition events on all four scientific pages',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
