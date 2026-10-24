/** Restore the actual conditions, reference stores and ground scene through the saved-layout UI. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:44126/';
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base + 'lab.html');
    await page.waitForFunction(() => !!window.SkyLabExperiment && !!window.SkyDiagramTools);
    await page.locator('.layout-launch').click();
    // Add a real ground object, then compose four native views.
    await page.evaluate(() => SkySceneBuilder.open({ kind: 'rod' }));
    await page.locator('.sb-placement-actions button').first().click();
    await page.evaluate(() => {
      SkyWorkbenchMenu.select('skyPanel');
      for (const id of ['contextPanel', 'chartPanel', 'riseSetPanel'])
        skyWorkspacePresentation.addView(id);
      SkyDiagramTools.comparisons.add('observer', { lat: 0, lon: 30, label: 'Equator' });
      SkyDiagramTools.comparisons.add('observer', { lat: -33.9, lon: 151.2, label: 'Sydney' });
    });
    await page.waitForFunction(() => SkyObserverComparison.sites().length === 2);
    const refs = await page.evaluate(() =>
      SkyObserverComparison.sites().map((o) => ({ id: o.id, source: o.source })),
    );
    for (const ref of refs) {
      await page.evaluate((ref) => SkyDiagramTools.openObjects(ref), ref);
      await page.waitForFunction(
        (ref) =>
          ['sky', 'globe', 'altitude', 'azimuth'].every((type) => {
            const report = SkyObserverComparison.read()[type];
            return (
              report?.selected?.id === ref.id &&
              report.selected.source === ref.source &&
              report.sites.filter((o) => o.emphasized).length === 1
            );
          }),
        ref,
      );
    }
    const expected = await page.evaluate(() => ({
      date: state.date,
      lat: state.lat,
      lon: state.lon,
      time: state.time,
      views: skyWorkspacePresentation.views,
      refs: SkyDiagramTools.snapshotExperiment(),
      ground: SkySceneBuilder.snapshotExperiment(),
    }));
    await page.locator('[data-rail-section=views]').click();
    await page.locator('.workbench-layout-section > summary').click();
    await page.locator('#workspaceIncludeExperiment').check();
    await page.locator('.workspace-save-form input[type=text]').fill('Classroom');
    await page.locator('.workspace-save-form button[type=submit]').click();
    assert.match(await page.locator('[data-saved-name=Classroom]').innerText(), /完整实验/);
    await page.evaluate(() => {
      setDate('2027-03-15');
      state.lat = 10;
      state.lon = 15;
      state.time = 900;
      const r = SkyDiagramTools.observers()[0];
      SkyDiagramTools.comparisons.remove(r.source, r.id);
      SkySceneBuilder.restoreExperiment({ version: 1, objects: [] });
      schedule();
    });
    await page.locator('[data-saved-name=Classroom] .workspace-profile-apply').click();
    await page.waitForFunction((date) => state.date === date, expected.date);
    const actual = await page.evaluate(() => ({
      date: state.date,
      lat: state.lat,
      lon: state.lon,
      time: state.time,
      views: skyWorkspacePresentation.views,
      refs: SkyDiagramTools.snapshotExperiment(),
      ground: SkySceneBuilder.snapshotExperiment(),
      playing: state.playing,
    }));
    assert.deepEqual({ ...actual, playing: undefined }, { ...expected, playing: undefined });
    assert.equal(actual.playing, false);
    // Refresh and apply again: the complete experiment must survive in local saved profiles.
    await page.reload();
    await page.waitForFunction(() => !!window.SkyLabExperiment);
    await page.locator('.layout-launch').click();
    await page.locator('[data-rail-section=views]').click();
    await page.locator('.workbench-layout-section > summary').click();
    await page.locator('[data-saved-name=Classroom] .workspace-profile-apply').click();
    await page.waitForFunction(() => SkyDiagramTools.observers().length === 2);
    assert.equal(await page.evaluate(() => SkySceneBuilder.read().objects.length), 1);
    assert.equal(await page.evaluate(() => state.date), expected.date);
    // A corrupt scientific condition cannot partially replace the current experiment.
    await page.evaluate(() => {
      const k = 'skymotion-saved-layouts-v1',
        v = JSON.parse(localStorage.getItem(k));
      v.items[0].experiment.conditions.active.lat = 999;
      localStorage.setItem(k, JSON.stringify(v));
      dispatchEvent(new StorageEvent('storage', { key: k }));
    });
    const before = await page.evaluate(() =>
      JSON.stringify([
        state.lat,
        state.lon,
        state.date,
        SkyDiagramTools.snapshotExperiment(),
        SkySceneBuilder.read(),
      ]),
    );
    await page.locator('[data-saved-name=Classroom] .workspace-profile-apply').click();
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify([
          state.lat,
          state.lon,
          state.date,
          SkyDiagramTools.snapshotExperiment(),
          SkySceneBuilder.read(),
        ]),
      ),
      before,
    );
    assert.match(await page.locator('#workspaceSavedStatus').innerText(), /损坏/);
    await page.locator('#observationBody').selectOption('moon');
    await page.evaluate(() => SkySceneBuilder.open({ kind: 'rod' }));
    await page.locator('.sb-placement-actions button').first().click();
    await page.evaluate(() => {
      SkyWorkbenchMenu.select('skyPanel');
      skyWorkspacePresentation.addView('chartPanel');
    });
    await page.locator('[data-rail-section=views]').click();
    if (!(await page.locator('.workbench-layout-section').evaluate((node) => node.open)))
      await page.locator('.workbench-layout-section > summary').click();
    await page.locator('.workspace-save-form').waitFor({ state: 'visible' });
    await page.locator('#workspaceIncludeExperiment').check();
    const moon = await page.evaluate(() => ({
      date: state.date,
      time: state.time,
      lat: state.lat,
    }));
    await page.locator('.workspace-save-form input[type=text]').fill('Moon');
    await page.locator('.workspace-save-form button[type=submit]').click();
    await page.evaluate(() => {
      setDate('2028-02-29');
      state.time = 100;
      state.lat = -20;
      SkySceneBuilder.restoreExperiment({ version: 1, objects: [] });
      schedule();
    });
    await page.locator('[data-saved-name=Moon] .workspace-profile-apply').click();
    assert.deepEqual(
      await page.evaluate(() => ({ date: state.date, time: state.time, lat: state.lat })),
      moon,
    );
    assert.equal(await page.evaluate(() => state.body), 'moon');
    assert.equal(await page.evaluate(() => SkySceneBuilder.read().objects.length), 1);
    assert.deepEqual(errors, []);
    console.log(
      'PASS selected city across four views; full experiment save, refresh, scientific conditions, references, ground objects and atomic rejection of invalid saves',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
