/** Native controls and comparisons share one workbench; no second Lab form. */
const assert=require('node:assert/strict'),{chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8999/').replace(/\/?$/,'/');
(async()=>{const b=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--use-angle=swiftshader']});try{const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'lab.html');await p.waitForFunction(()=>window.SkyCustomization&&!document.querySelector('.layout-launch').disabled);const before=await p.evaluate(()=>[state.lat,state.lon,state.date,state.time,state.view]);await p.locator('.layout-launch').click();await p.locator('.dt-panel').waitFor();assert.equal(await p.locator('#labComparisons').count(),0);
 await require('./diagram-test-helpers.cjs').openLibrary(p);await require('./diagram-test-helpers.cjs').addTool(p,'time');await p.locator('.dt-place').click();let input=p.locator('.dt-fields [data-field=time]');await input.fill('09:00');await input.press('Tab');assert.equal(await p.evaluate(()=>SkyDiagramTools.comparisons.list()[0].time),540);assert.equal(await input.inputValue(),'09:00');await input.fill('25:61');await input.press('Tab');assert.equal(await input.getAttribute('aria-invalid'),'true');await p.locator('[data-rail-section=conditions]').click();assert.equal(await p.locator('[data-rail-section=references]').getAttribute('aria-selected'),'true');await input.fill('24:00');await input.press('Tab');assert.equal(await p.evaluate(()=>SkyDiagramTools.comparisons.list()[0].time),1440);
 await require('./diagram-test-helpers.cjs').openLibrary(p);await p.locator('#dt-add-city').selectOption('-33.9,151.2');await require('./diagram-test-helpers.cjs').addTool(p,'observer');await p.locator('#observerTimeBasis').selectOption('utc');assert.equal(await p.evaluate(()=>SkyObserverComparison.sites()[0].utc),await p.evaluate(()=>instantUTC().getTime()));assert.deepEqual(await p.evaluate(()=>[state.lat,state.lon,state.date,state.time,state.view]),before);
 await p.locator('[data-rail-section=conditions]').click();assert(await p.locator('#place').isVisible());await p.locator('#place').selectOption('51.5,-0.1');await p.locator('[data-rail-section=references]').click();assert.equal(await p.evaluate(()=>SkyDiagramTools.comparisons.list().find(o=>o.type==='observer').lat),-33.9);if(await p.locator('.dt-back-list').isVisible())await p.locator('.dt-back-list').click();await p.locator('.dt-more').click();await p.getByRole('menuitem',{name:'保存本图对象',exact:true}).click();assert.match(await p.locator('.dt-status').innerText(),/已保存/);await p.reload();await p.waitForFunction(()=>window.SkyCustomization&&!document.querySelector('.layout-launch').disabled);await p.locator('.layout-launch').click();await p.locator('.dt-panel').waitFor();assert.equal(await p.locator('.dt-row').count(),2);
 // Alternate the public comparison API and the visible editor against one history.
 const original = await p.evaluate(() => SkyDiagramTools.comparisons.add('time', {
   time: 600, name: 'Class A', label: 'Pinned hour',
 }));
 assert(original);
 assert.equal(await p.evaluate(id => SkyDiagramTools.comparisons.duplicate('lab-sky', id), original), true);
 await p.evaluate(id => SkyDiagramTools.openObjects({source:'lab-sky', id}), original);
 await require('./diagram-test-helpers.cjs').objectAction(p,'复制');
 const copies = await p.evaluate(() => SkyDiagramTools.comparisons.list().filter(o=>o.name?.startsWith('Class A')));
 assert.deepEqual(copies.map(o=>[o.name,o.label]), [
   ['Class A','Pinned hour'], ['Class A 2','Pinned hour 2'], ['Class A 3','Pinned hour 3'],
 ]);
 assert.equal(new Set(copies.map(o=>o.id)).size,3);
 assert.equal(await p.evaluate(()=>SkyDiagramTools.comparisons.travel('undo')),true);
 assert.equal(await p.evaluate(()=>SkyDiagramTools.comparisons.list().length),4);
 await p.locator('.dt-redo').click();
 assert.deepEqual(await p.evaluate(()=>SkyDiagramTools.comparisons.list()), await p.evaluate(()=>SkyDiagramTools.read('lab-sky').filter(o=>['observer','time'].includes(o.type)).map(o=>({...o,source:'lab-sky'}))));
 assert.equal(await p.evaluate(()=>SkyDiagramTools.comparisons.list().length),5);
 assert.equal(await p.evaluate(()=>SkyDiagramTools.comparisons.save('lab-sky')),true);
 await p.reload();
 await p.waitForFunction(()=>window.SkyDiagramTools&&typeof state!=='undefined');
 assert.deepEqual(await p.evaluate(()=>SkyDiagramTools.read('lab-sky').filter(o=>o.name?.startsWith('Class A'))), copies.map(({source,...object})=>object));
 assert.deepEqual(errors,[]);await p.close();
 const m=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await m.goto(base+'lab.en.html');await m.waitForFunction(()=>window.SkyCustomization&&!document.querySelector('.layout-launch').disabled);await m.locator('.layout-launch').click();await require('./diagram-test-helpers.cjs').openLibrary(m);await require('./diagram-test-helpers.cjs').addTool(m,'time');await m.locator('.dt-place').click();await m.locator('.dt-fields [data-field=time]').fill('10:30');await m.locator('.dt-fields [data-field=time]').press('Tab');await m.locator('.dt-back-list').click();assert(await m.locator('[data-dt-view=library]').isVisible());assert.equal(await m.locator('.dt-panel').evaluate(n=>/[\u3400-\u9fff]/.test(n.innerText)),false);assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);console.log('PASS unified Lab comparisons, HH:MM/24:00, invalid field navigation guard, shared UTC, original controls, save/reload and English touch list');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
