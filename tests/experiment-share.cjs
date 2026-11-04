/** Share a real classroom comparison into a fresh phone; invalid links cannot mutate state. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-angle=swiftshader'],
  });
  const errors = [];
  async function page(context) {
    const p = await context.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    await p.route('**/assistant/worker.js*', (route) => route.abort());
    return p;
  }
  const read = (p) =>
    p.evaluate(() => ({
      body: state.body,
      date: state.date,
      lat: state.lat,
      lon: state.lon,
      time: state.time,
      basis: state.observerTimeBasis,
      views: skyWorkspacePresentation.views,
      refs: SkyDiagramTools.snapshotExperiment(),
      ground: SkySceneBuilder.snapshotExperiment(),
    }));
  try {
    const teacherContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const teacher = await page(teacherContext);
    await teacher.goto(base + 'lab.html', { waitUntil: 'domcontentloaded' });
    await teacher.waitForFunction(() => !!window.SkyLabExperiment && !!window.SkyExperimentShare);
    // The single share action is available without entering customization.
    await teacher.locator('[data-rail-section=views]').click();
    await teacher.locator('.workbench-layout-section > summary').click();
    assert(await teacher.locator('.workspace-share-button').isVisible());
    assert.equal(await teacher.evaluate(() => SkyCustomization.active), false);
    await teacher.locator('.layout-launch').click();
    await teacher.evaluate(() => SkySceneBuilder.open({ kind: 'rod' }));
    await teacher.locator('.sb-placement-actions button').first().click();
    await teacher.evaluate(() => {
      SkyWorkbenchMenu.select('skyPanel');
      setDate('2024-02-29');
      Object.assign(state, {
        lat: -33.9,
        lon: 151.2,
        time: 613,
        observerTimeBasis: 'utc',
        place: 'custom',
      });
      for (const id of ['chartPanel', 'contextPanel']) skyWorkspacePresentation.addView(id);
      SkyDiagramTools.comparisons.add('observer', { lat: 51.5, lon: -0.1, label: 'London & 北京' });
      syncControls();
      render();
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          async write(items) {
            window.copiedShare = await (await items[0].getType('text/plain')).text();
          },
        },
      });
    });
    const expected = await read(teacher);
    await teacher.evaluate(() => SkyWorkbenchMenu.openLayout());
    await teacher.locator('.workspace-share-button').click();
    await teacher.waitForFunction(() => !!window.copiedShare);
    await teacher.screenshot({ path: '/tmp/sharing152-desktop.png' });
    const link = await teacher.evaluate(() => copiedShare);
    console.log('Generated classroom link:', link.length, 'characters');
    assert(link.length <= 2800, `link is ${link.length} characters`);
    const url = new URL(link);
    assert.equal(url.search, '');
    assert(url.hash.startsWith('#state=1z.'));
    assert(url.pathname.endsWith('/lab.html'));
    const studentContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const student = await page(studentContext);
    await student.goto(link.replace('/lab.html', '/lab.en.html'), {
      waitUntil: 'domcontentloaded',
    });
    await student.waitForFunction(
      () => skyWorkspacePresentation.shareControl.dataset.shareResult === 'restored',
    );
    assert.deepEqual(await read(student), expected);
    assert.equal(await student.evaluate(() => state.playing), false);
    assert.equal(await student.evaluate(() => SkyCustomization.active), true);
    assert.equal(await student.evaluate(() => SkyObserverComparison.sites().length), 1);
    assert.equal(
      await student.evaluate(() => localStorage.getItem('skymotion-saved-layouts-v1')),
      null,
    );
    assert.equal(
      await student.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    // Clipboard denial reveals a selectable link, with no extra dialog.
    await student.evaluate(() =>
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async () => {
            throw Error('denied');
          },
        },
        configurable: true,
      }),
    );
    await student.evaluate(() => SkyWorkbenchMenu.openLayout());
    await student.locator('.workspace-share-button').click();
    await student.locator('.workspace-share-link').waitFor({ state: 'visible' });
    await student.screenshot({ path: '/tmp/sharing152-mobile.png' });
    const manual = await student.locator('.workspace-share-link').inputValue();
    assert(manual.includes('/lab.en.html#state='));
    // Cross-body restoration, preserving Moon timing and planet choice.
    const moonLink = await teacher.evaluate(async () => {
      selectObservationBody('moon');
      state.planet = 'Mars';
      state.companion = true;
      state.observerTimeBasis = 'solar';
      const experiment = SkyLabExperiment.captureComplete('moon');
      experiment.conditions.selected = 'companionModule';
      experiment.conditions.linked = false;
      return SkyExperimentShare.link({
        version: 1,
        layout: {
          version: 3,
          views: ['contextPanel'],
          active: 0,
          ratio: 50,
          rowRatio: 50,
          axis: 'columns',
          featured: false,
        },
        experiment,
      });
    });
    await student.goto(moonLink, { waitUntil: 'domcontentloaded' });
    await student.waitForFunction(
      () => !!skyWorkspacePresentation.shareControl.dataset.shareResult,
    );
    assert.equal(
      await student.evaluate(() => skyWorkspacePresentation.shareControl.dataset.shareResult),
      'restored',
    );
    assert.equal(await student.evaluate(() => state.body), 'moon');
    assert.equal(await student.evaluate(() => state.planet), 'Mars');
    assert.equal(await student.evaluate(() => uiWorkspace.selected), 'companionModule');
    // A participant failure rolls conditions and both object stores back together.
    const rollback = await student.evaluate(async (link) => {
      const snapshot = () =>
        JSON.stringify([
          SkyLabExperiment.snapshot(),
          SkyDiagramTools.snapshotExperiment(),
          SkySceneBuilder.snapshotExperiment(),
          skyWorkspacePresentation.views,
        ]);
      const before = snapshot(),
        payload = await SkyExperimentShare.decode(new URL(link).hash.slice(7));
      payload.experiment.conditions.active.lat = 4;
      const restore = SkySceneBuilder.restoreExperiment;
      SkySceneBuilder.restoreExperiment = () => {
        throw Error('injected');
      };
      const ok = skyWorkspacePresentation.restoreShared(payload);
      SkySceneBuilder.restoreExperiment = restore;
      return { ok, unchanged: before === snapshot() };
    }, link);
    assert.deepEqual(rollback, { ok: false, unchanged: true });
    // Untrusted data: invalid version, calendar/coordinates/layout, truncation and zip bomb.
    assert(
      await student.evaluate(async () => {
        const before = JSON.stringify(SkyLabExperiment.snapshot());
        const experiment = SkyLabExperiment.captureComplete('moon');
        experiment.conditions.active.lat = 999;
        const bad = skyWorkspacePresentation.restoreShared({
          version: 1,
          experiment,
          layout: {
            version: 3,
            views: ['chartPanel'],
            active: 0,
            ratio: 50,
            rowRatio: 50,
            axis: 'columns',
            featured: false,
          },
        });
        let rejected = 0;
        for (const token of ['1z.not-valid', '2j.e30', '1j.' + 'A'.repeat(2801)])
          try {
            await SkyExperimentShare.decode(token);
          } catch {
            rejected++;
          }
        const compressed = new Uint8Array(
          await new Response(
            new Blob(['x'.repeat(700000)]).stream().pipeThrough(new CompressionStream('deflate')),
          ).arrayBuffer(),
        );
        let binary = '';
        for (const byte of compressed) binary += String.fromCharCode(byte);
        try {
          await SkyExperimentShare.decode(
            '1z.' + btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''),
          );
        } catch {
          rejected++;
        }
        const compression = window.CompressionStream;
        window.CompressionStream = undefined;
        const minimal = { version: 1, experiment: { body: 'moon' } };
        const raw = await SkyExperimentShare.encode(minimal);
        const roundtrip = await SkyExperimentShare.decode(raw);
        window.CompressionStream = compression;
        return (
          !bad &&
          before === JSON.stringify(SkyLabExperiment.snapshot()) &&
          rejected === 4 &&
          raw.startsWith('1j.') &&
          roundtrip.experiment.body === 'moon'
        );
      }),
    );
    await student.goto(link, { waitUntil: 'domcontentloaded' });
    await student.waitForFunction(() => state.body === 'sun' && state.date === '2024-02-29');
    assert.deepEqual(await read(student), expected);
    await student.evaluate(link => { location.hash = new URL(link).hash; }, moonLink);
    await student.waitForFunction(() => state.body === 'moon' && uiWorkspace.selected === 'companionModule' && !SkyCustomization.active);
    const beforeInvalid = await read(student);
    await student.goto(base + 'lab.html#state=1z.invalid', { waitUntil: 'domcontentloaded' });
    await student.waitForFunction(
      () => skyWorkspacePresentation.shareControl.dataset.shareResult === 'invalid',
    );
    assert(await student.locator('.workspace-share [role=status]').isVisible());
    assert.deepEqual(await read(student), beforeInvalid);
    assert.deepEqual(errors, []);
    console.log(
      'PASS classroom share link, fresh mobile/English restore, Moon mode, references, bounded decompression, invalid state, transactional rollback, clipboard fallback and uncompressed compatibility',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
