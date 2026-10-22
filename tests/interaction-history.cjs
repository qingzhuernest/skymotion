/** Browser integration regression. Run with a local static server, Playwright and Chromium. */
const testBase = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
    ],
  });
  const p = await b.newPage({ viewport: { width: 960, height: 900 } });
  let errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  const settle = () => p.waitForTimeout(800);
  await p.goto(testBase + 'lab.html');
  await settle();
  const initial = await p.evaluate(() => ({
    body: state.body,
    time: state.time,
    view: state.view,
    length: history.length,
  }));
  await p.locator('[data-view="horizon"]').first().click();
  await settle();
  await p.goBack();
  await settle();
  if ((await p.evaluate(() => state.view)) !== initial.view) throw Error('view undo');
  await p.goForward();
  await settle();
  if ((await p.evaluate(() => state.view)) !== 'horizon') throw Error('view redo');
  await p.locator('#workbenchTime').evaluate((e) => {
    e.value = 800;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.value = 820;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.value = 840;
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await settle();
  await p.goBack();
  await settle();
  if ((await p.evaluate(() => state.time)) !== initial.time) throw Error('range grouping undo');
  await p.goForward();
  await settle();
  if ((await p.evaluate(() => state.time)) !== 840) throw Error('range redo');
  const count = await p.evaluate(() => history.length);
  await p.locator('.ui-parameters details > summary:visible').first().click();
  await settle();
  await p.locator('.motion-menu-grip').click();
  await settle();
  if ((await p.evaluate(() => history.length)) !== count) throw Error('menu creates history');
  await p.locator('.motion-menu-edge').click();
  await settle();
  await p.locator('[data-body="moon"]').first().click();
  await settle();
  await p.goBack();
  await settle();
  if ((await p.evaluate(() => state.body)) !== 'sun') throw Error('body undo');
  console.log('PASS lab view/body switches, grouped time adjustment, undo/redo, no menu history');
  await p.goto(testBase + 'diagrams.html');
  await settle();
  await p.locator('[data-body="sun"]').first().click();
  await settle();
  await require('./diagram-test-helpers.cjs').selectDiagram(p, 'riseSetPanel');
  await settle();
  if (!p.url().endsWith('#riseSetPanel')) throw Error('route not updated');
  await require('./diagram-test-helpers.cjs').selectDiagram(p, 'chartPanel');
  await settle();
  await p.goBack();
  await settle();
  if (
    !p.url().endsWith('#riseSetPanel') ||
    (await p.evaluate(() => uiWorkspace.selected)) !== 'riseSetPanel'
  )
    throw Error('diagram route undo');
  await p.goForward();
  await settle();
  if ((await p.evaluate(() => uiWorkspace.selected)) !== 'chartPanel') throw Error('diagram redo');
  console.log('PASS diagram history and URL');
  const chartTime = await p.evaluate(() => state.time);
  const chart = await p.locator('#chart').boundingBox();
  await p.mouse.move(chart.x + chart.width * 0.25, chart.y + chart.height * 0.5);
  await p.mouse.down();
  await p.mouse.move(chart.x + chart.width * 0.7, chart.y + chart.height * 0.5, { steps: 6 });
  await p.mouse.up();
  await settle();
  if ((await p.evaluate(() => state.time)) === chartTime)
    throw Error('chart drag not adjusting time');
  await p.goBack();
  await settle();
  if ((await p.evaluate(() => state.time)) !== chartTime) throw Error('chart drag undo');
  console.log('PASS chart parameter gesture undo');
  await p.goto(testBase + 'space/');
  await p.waitForSelector('.planet-picker');
  await settle();
  await p.locator('.planet-picker button').filter({ hasText: '火星' }).click();
  await settle();
  await p.locator('.planet-picker button').filter({ hasText: '木星' }).click();
  await settle();
  await p.goBack();
  await settle();
  if ((await p.evaluate(() => spaceState().selected)) !== 3) throw Error('3d planet undo');
  await p.goForward();
  await settle();
  if ((await p.evaluate(() => spaceState().selected)) !== 4) throw Error('3d planet redo');
  const day = await p.evaluate(() => spaceState().day);
  await p.locator('#day').evaluate((e) => {
    e.value = 100;
    e.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await settle();
  await p.goBack();
  await settle();
  if (Math.abs((await p.evaluate(() => spaceState().day)) - day) > 0.0001)
    throw Error('3d date undo');
  await p.locator('#earthmoon').click();
  await settle();
  await p.goBack();
  await settle();
  if (
    !(await p.evaluate(
      () =>
        spaceState().view === 'overview' &&
        document.getElementById('overview').classList.contains('active') &&
        !document.getElementById('earthmoon').classList.contains('active') &&
        document.getElementById('viewTitle').textContent.includes('太阳系总览'),
    ))
  )
    throw Error('3d view title or tabs stale after undo');
  console.log('PASS 3d selected planet and date undo', errors);
  await p.goto(testBase + 'diagrams.html?compare=1');
  const frame = await p
    .locator('.ui-linked-frame')
    .elementHandle()
    .then((e) => e.contentFrame());
  await frame.waitForFunction(() => window.SolarSpaceView);
  await settle();
  const beforeMenu = await p.evaluate(() => history.length);
  await frame.locator('#sceneTools summary').click();
  await settle();
  if ((await p.evaluate(() => history.length)) !== beforeMenu)
    throw Error('embedded disclosure creates history');
  await frame.locator('[data-camera="top"]').click();
  await settle();
  await p.goBack();
  await settle();
  if ((await frame.evaluate(() => spaceState().cameraPreset)) !== 'oblique')
    throw Error('embedded camera selection undo');
  await p.goForward();
  await settle();
  if ((await frame.evaluate(() => spaceState().cameraPreset)) !== 'top')
    throw Error('embedded camera selection redo');
  await frame.locator('#sceneTools summary').click();
  const beforeDrag = await p.evaluate(() => history.length);
  const canvas = await frame.locator('#stage canvas:not(.dt-overlay)').boundingBox();
  await p.mouse.move(canvas.x + canvas.width * 0.5, canvas.y + canvas.height * 0.4);
  await p.mouse.down();
  await p.mouse.move(canvas.x + canvas.width * 0.65, canvas.y + canvas.height * 0.45, { steps: 6 });
  await p.mouse.up();
  await settle();
  if ((await p.evaluate(() => history.length)) !== beforeDrag)
    throw Error('embedded camera drag creates history');
  console.log('PASS embedded camera selection and excluded menu/camera gestures');
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
