/** Reproduce the actual quality defects: locale routes, idempotent helpers and failed restores. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const helpers = require('./diagram-test-helpers.cjs');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(
  /\/?$/,
  '/',
);

const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync('experiment-storage.js', 'utf8'), context);
const transaction = context.window.SkyMotionSession.transaction;
const order = [];
let value = 1;
const result = transaction([
  {
    checkpoint: () => {
      order.push('capture-a');
      return () => {
        order.push('restore-a');
        value = 1;
      };
    },
    apply: () => {
      order.push('apply-a');
      value = 2;
    },
  },
  {
    checkpoint: () => {
      order.push('capture-b');
      return () => order.push('restore-b');
    },
    apply: () => {
      order.push('apply-b');
      return false;
    },
  },
]);
assert.equal(result.ok, false);
assert.equal(value, 1);
assert.deepEqual(order, [
  'capture-a',
  'capture-b',
  'apply-a',
  'apply-b',
  'restore-b',
  'restore-a',
]);
assert.equal(
  transaction([
    {
      checkpoint: () => {
        throw Error('Cannot capture');
      },
      apply: () => {
        value = 99;
      },
    },
  ]).ok,
  false,
);
assert.equal(value, 1);

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base + 'docs.html?lang=zh');
    for (const language of ['en', 'zh']) {
      await require('./preferences-test-helpers.cjs').toggleLanguage(page);
      await page.waitForFunction(
        (language) =>
          document.documentElement.lang === (language === 'en' ? 'en' : 'zh-CN'),
        language,
      );
      assert.equal(new URL(page.url()).searchParams.get('lang'), language);
      assert.equal(
        new URL(page.url()).pathname.endsWith('docs.en.html'),
        language === 'en',
      );
      await page.reload();
      await page.waitForSelector('html[data-fonts-ready]');
      assert.equal(
        await page.locator('html').getAttribute('lang'),
        language === 'en' ? 'en' : 'zh-CN',
      );
    }
    for (const id of ['sceneBuilder', 'solarStudy']) {
      const intent = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
      await intent.goto(base + 'diagrams.html#' + id);
      await intent.waitForFunction(
        () =>
          window.SkyCustomization && !document.querySelector('.layout-launch').disabled,
      );
      assert.equal(new URL(intent.url()).hash, '#' + id);
      assert.equal(await intent.evaluate(() => SkyCustomization.active), false);
      await intent.locator('.layout-launch').click();
      await intent.waitForFunction((id) => uiWorkspace.selected === id, id);
      assert.equal(new URL(intent.url()).hash, '#' + id);
      await intent.close();
    }
    await page.goto(base + 'lab.html?lang=zh');
    await page.waitForFunction(
      () =>
        !!window.SkyLabExperiment && !document.querySelector('.layout-launch').disabled,
    );
    await page.evaluate(() => {
      // Let the first frame arrive after a user has opened the library. This
      // reproduces the initialization race without relying on runner speed.
      const requestFrame = window.requestAnimationFrame;
      const pending = [];
      window.requestAnimationFrame = (callback) => {
        pending.push(callback);
        return 0;
      };
      try {
        document.querySelector('.layout-launch').click();
        SkyDiagramTools.openObjects({ add: true });
      } finally {
        window.requestAnimationFrame = requestFrame;
      }
      pending.forEach((callback) => callback(performance.now()));
    });
    assert.equal(
      await page.locator('[data-dt-view=library]').getAttribute('aria-current'),
      'page',
      'Deferred customization initialization preserves a tool opened in the meantime',
    );
    await helpers.openLibrary(page);
    await helpers.openLibrary(page);
    assert.equal(
      await page.locator('[data-dt-view=library]').getAttribute('aria-current'),
      'page',
    );
    assert(await page.locator('.dt-advanced [data-tool-type]').first().isVisible());
    await page.evaluate(() => {
      state.lat = 10;
      state.place = 'custom';
      syncControls();
      schedule();
      skyWorkspacePresentation.openOptions();
    });
    await page.locator('.workspace-save-form').waitFor();
    await page.locator('#workspaceIncludeExperiment').check();
    await page.locator('.workspace-save-form input[type=text]').fill('Rollback test');
    await page.locator('.workspace-save-form button[type=submit]').click();
    await page.waitForSelector('[data-saved-name="Rollback test"]');
    await page.evaluate(() => {
      state.lat = 50;
      state.place = 'custom';
      SkyDiagramTools.comparisons.add('observer', {
        lat: 20,
        lon: 30,
        label: 'Unsaved comparison',
      });
      syncControls();
      schedule();
    });
    const before = await page.evaluate(() =>
      JSON.stringify({
        lat: state.lat,
        refs: SkyDiagramTools.snapshotExperiment(),
        ground: SkySceneBuilder.read(),
        views: skyWorkspacePresentation.views,
        undo: SkyDiagramTools.comparisons.history(),
      }),
    );
    // Throw after the conditions and references have already been applied.
    await page.evaluate(() => {
      window.originalGroundRestore = SkySceneBuilder.restoreExperiment;
      SkySceneBuilder.restoreExperiment = () => {
        throw Error('Injected ground failure');
      };
    });
    await page
      .locator('[data-saved-name="Rollback test"] .workspace-profile-apply')
      .click();
    await page.waitForFunction(() =>
      document.getElementById('workspaceSavedStatus').textContent.includes('恢复失败'),
    );
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify({
          lat: state.lat,
          refs: SkyDiagramTools.snapshotExperiment(),
          ground: SkySceneBuilder.read(),
          views: skyWorkspacePresentation.views,
          undo: SkyDiagramTools.comparisons.history(),
        }),
      ),
      before,
    );
    assert.equal(await page.evaluate(() => SkyMotionHistory.restoring), false);
    await page.evaluate(
      () => (SkySceneBuilder.restoreExperiment = window.originalGroundRestore),
    );
    await page
      .locator('[data-saved-name="Rollback test"] .workspace-profile-apply')
      .click();
    await page.waitForFunction(
      () => state.lat === 10 && SkyDiagramTools.comparisons.list().length === 0,
    );
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      'PASS capture-before-commit and reverse rollback, locale switch/reload, repeatable library opening, failed restore preserves conditions/references/ground/layout, then successful retry',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
