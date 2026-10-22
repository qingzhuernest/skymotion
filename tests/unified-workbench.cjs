/** Real menu gestures across the three historical entries, linked plots and both bodies. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const {
  selectDiagram,
  openWorkbench,
  addTool,
  closeDrawer,
  toggleCustomization,
} = require('./diagram-test-helpers.cjs');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:44125/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const [route, selected] of [
      ['lab', 'skyPanel'],
      ['diagrams', 'contextPanel'],
      ['analemma', 'analemmaPanel'],
    ]) {
      await page.goto(base + route + '.en.html');
      await page.waitForFunction(() => !!window.SkyWorkbenchMenu && !!window.SkyDiagramTools);
      assert.equal(await page.evaluate(() => uiWorkspace.selected), selected);
      assert.equal(await page.locator('.page-nav a').count(), 4);
      await selectDiagram(page, 'skyPanel');
      assert(await page.locator('#sky').isVisible());
    }
    await page.locator('.layout-launch').click();
    await page.locator('[data-rail-section=views]').click();
    for (const id of ['contextPanel', 'chartPanel', 'analemmaPanel'])
      await page
        .locator(`[data-workbench-view=${id}]`)
        .locator('..')
        .locator('.workbench-add-view')
        .click();
    await page.waitForFunction(() => skyWorkspacePresentation.views.length === 4);
    assert.deepEqual(await page.evaluate(() => skyWorkspacePresentation.views), [
      'skyPanel',
      'contextPanel',
      'chartPanel',
      'analemmaPanel',
    ]);
    assert.equal(await page.locator('.ui-diagram-card:visible').count(), 4);
    assert(await page.locator('#sky').isVisible());
    assert(await page.locator('#globe').isVisible());
    assert(await page.locator('#chart').isVisible());
    assert(await page.locator('#analemmaCanvas').isVisible());
    assert(await page.locator('.workbench-sampling-clock').isVisible());
    const oldPlace = await page.evaluate(() => state.lat);
    await page.locator('[data-rail-section=conditions]').click();
    await page.locator('#lat').evaluate((node) => {
      for (let parent = node.parentElement; parent; parent = parent.parentElement)
        if (parent.tagName === 'DETAILS') parent.open = true;
    });
    await page.locator('#lat').focus();
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction((lat) => state.lat !== lat, oldPlace);
    assert(await page.locator('#globe').isVisible());
    assert(await page.locator('#analemmaCanvas').isVisible());
    await page.locator('[data-rail-section=views]').click();
    await page.locator('.workbench-layout-section > summary').click();
    await page.waitForFunction(() => !document.getElementById('workspaceOptions').hidden);
    const inline = await page.locator('#workspaceOptions').evaluate((node) => ({
      parent: !!node.closest('#workbenchViews'),
      position: getComputedStyle(node).position,
      popover: node.hasAttribute('popover'),
      dialog: node.getAttribute('role'),
    }));
    assert.deepEqual(inline, { parent: true, position: 'static', popover: false, dialog: null });
    await page.screenshot({ path: 'tests/artifacts/unified-workbench-desktop.png' });
    await page.locator('[data-rail-section=conditions]').click();
    assert(!(await page.locator('#workspaceOptions').isVisible()));
    await page.locator('.layout-launch').click();
    assert.equal(
      await page.locator('.ui-diagram-card:visible').count(),
      4,
      'Finishing editing retains the chosen combination',
    );
    assert(await page.locator('.motion-menu-grip').isVisible());
    // Selecting a calculated event is different from rotating its display.
    for (const body of ['sun', 'moon']) {
      await page.locator(`button[data-body=${body}]`).click();
      await selectDiagram(page, 'riseSetPanel');
      await page.waitForFunction(
        () =>
          !!eventCompassLayout &&
          document.getElementById('eventCompass').getBoundingClientRect().width > 0,
      );
      const scientific = await page.evaluate(() => ({
        date: state.date,
        time: state.time,
        lat: state.lat,
        lon: state.lon,
      }));
      const box = await page.locator('#eventCompass').boundingBox();
      const rotation = await page.evaluate(() => eventCompassCamera.rotation);
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7, { steps: 8 });
      await page.mouse.up();
      assert(
        Math.abs((await page.evaluate(() => eventCompassCamera.rotation)) - rotation) > 30,
        JSON.stringify({
          body,
          rotation,
          after: await page.evaluate(() => eventCompassCamera.rotation),
          box,
        }),
      );
      assert.deepEqual(
        await page.evaluate(() => ({
          date: state.date,
          time: state.time,
          lat: state.lat,
          lon: state.lon,
        })),
        scientific,
      );
      await page.locator('#eventCompass').press('Home');
      assert.equal(await page.evaluate(() => eventCompassCamera.rotation), 0);
      const event = await page.evaluate(() => {
        const e = eventCompassLayout.model.rise;
        return e.position ? { ...eventCompassLayout.project(e.position.az), time: e.time } : null;
      });
      if (event) {
        await page.mouse.click(box.x + event.x, box.y + event.y);
        assert(Math.abs((await page.evaluate(() => state.time)) - event.time) < 0.01);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await selectDiagram(page, 'contextPanel');
    assert(await page.locator('#phaseOrbit').isVisible());
    await page.locator('.layout-launch').click();
    await page.locator('#uiParametersButton').click();
    await page.locator('[data-rail-section=views]').click();
    assert(await page.locator('#workbenchViews').isVisible());
    await openWorkbench(page);
    await addTool(page, 'note');
    await page.locator('.dt-place').click();
    const x = page.locator('.dt-fields [data-field=x]');
    await x.fill('');
    await closeDrawer(page);
    await toggleCustomization(page);
    assert.equal(
      await page.locator('#uiParameterDrawer').evaluate((node) => node.open),
      true,
      'An invalid exit reopens the native drawer so its field can be corrected',
    );
    assert(await x.isVisible());
    assert.equal(await x.getAttribute('aria-invalid'), 'true');
    await x.fill('50');
    await x.press('Tab');
    const targets = await page.locator('.dt-panel button:visible').evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { text: node.textContent, width: r.width, height: r.height };
      }),
    );
    assert(
      targets.every((target) => target.width >= 44 && target.height >= 44),
      JSON.stringify(targets),
    );
    await page.screenshot({ path: 'tests/artifacts/unified-workbench-phone.png' });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS unified routes, hierarchical content menu, four linked views, inline layout, retained combination, Sun/Moon compass gestures and phone menu',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
