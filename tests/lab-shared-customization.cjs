const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8989/').replace(/\/?$/,'/');
const {addTool}=require('./diagram-test-helpers.cjs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--use-angle=swiftshader']});const errors=[];try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='warning'&&m.text().includes('reference rejected'))errors.push(m.text());});
 await p.goto(base+'lab.html');await p.waitForFunction(()=>window.SkyDiagramTools&&window.SkyCustomization&&!document.querySelector('.layout-launch').disabled);
 const original=await p.evaluate(()=>({views:document.querySelector('.view-tabs').textContent,conditions:[state.lat,state.lon,state.date,state.time],view:state.view}));
 assert.equal(await p.locator('.diagram-tool-launch:visible').count(),0);assert.equal(await p.locator('.language-actions .layout-launch').count(),1);
 await require('./diagram-test-helpers.cjs').toggleCustomization(p);assert.equal(await p.evaluate(()=>state.view),original.view);assert.deepEqual(await p.evaluate(()=>[state.lat,state.lon,state.date,state.time]),original.conditions);
 await require('./diagram-test-helpers.cjs').openWorkbench(p);await require('./diagram-test-helpers.cjs').openLibrary(p);assert(await p.locator('.dt-add button').count()>=6);
 await addTool(p,'observer');
 async function field(key,value){const f=p.locator('.dt-fields [data-field="'+key+'"]');await f.fill(String(value));await f.press('Tab');}
 await field('label','Sydney');await field('lat',-33.9);await field('lon',151.2);
 await p.locator('#observerTimeBasis').selectOption('utc');
 await p.waitForFunction(()=>SkyObserverComparison.read().sky?.basis==='utc');
 const city=await p.evaluate(()=>SkyDiagramTools.read('lab-sky')[0]);assert.equal(city.label,'Sydney');assert.equal(await p.evaluate(()=>SkyObserverComparison.sites()[0].utc),await p.evaluate(()=>instantUTC().getTime()));
 await addTool(p,'time');await p.keyboard.press('Enter');await field('time',600);
 await p.waitForFunction(()=>SkyObserverComparison.read().sky.times[0]?.time===600);
 for(const view of ['top','horizon','observer','orbit']){await p.locator('[data-view="'+view+'"]').click();await p.waitForFunction(v=>state.view===v,view);await p.waitForFunction(()=>SkyObserverComparison.read().sky.sites.length===1);assert.equal(await p.locator('#sky').isVisible(),true);}
 assert.equal(await p.evaluate(()=>document.querySelector('.view-tabs').textContent),original.views);
 // Native observation controls stay usable and preserve the reference draft.
 await p.locator('[data-rail-section=conditions]').click();await p.locator('#place').selectOption('51.5,-0.1');await p.locator('[data-rail-section=references]').click();assert.equal(await p.evaluate(()=>SkyDiagramTools.read('lab-sky')[0].lat),-33.9);
 // Per-row menu, including an unselected row, operates on the clicked object.
 await p.locator('.dt-row').first().locator('button').last().click();await p.getByRole('menuitem',{name:'复制',exact:true}).click();assert.equal(await p.evaluate(()=>SkyDiagramTools.read('lab-sky').filter(o=>o.type==='observer').length),2);
 if(await p.locator('.dt-back-list').isVisible())await p.locator('.dt-back-list').click();await p.locator('.dt-more').click();await p.getByRole('menuitem',{name:'删除',exact:true}).click();assert.equal(await p.evaluate(()=>SkyDiagramTools.read('lab-sky').length),2);
 await p.locator('.dt-row').first().locator('input[type=checkbox]').uncheck();await p.waitForFunction(()=>SkyObserverComparison.sites().length===0);await p.getByRole('button',{name:'撤销',exact:true}).click();await p.waitForFunction(()=>SkyObserverComparison.sites().length===1);
 // Full navigation transfers editing intent once and keeps session references without Save.
 await require('./diagram-test-helpers.cjs').selectDiagram(p, 'contextPanel');await p.waitForFunction(()=>window.SkyCustomization?.active===true&&window.SkyObserverComparison);
 assert.equal(await p.evaluate(()=>SkyObserverComparison.sites()[0].id),city.id);
 await require('./diagram-test-helpers.cjs').selectDiagram(p, 'solarCompare');await require('./diagram-test-helpers.cjs').layoutAction(p, 'four');
 await p.waitForFunction(()=>['globe','altitude','azimuth','geometry'].every(k=>SkyObserverComparison.read()[k]?.times.length===1));
 const report=await p.evaluate(()=>SkyObserverComparison.read());for(const type of ['globe','altitude','azimuth','geometry']){assert.equal(report[type].sites[0].id,city.id);assert.equal(report[type].times[0].time,600);assert.equal(report[type].basis,'utc');}
 await p.screenshot({path:'tests/artifacts/review68-shared.png'});
 await require('./diagram-test-helpers.cjs').selectDiagram(p, 'skyPanel');await p.waitForFunction(()=>window.SkyCustomization?.active===true&&window.SkyDiagramTools);await require('./diagram-test-helpers.cjs').openWorkbench(p);
 assert.equal(await p.evaluate(()=>SkyDiagramTools.read('lab-sky').length),2);
 await addTool(p,'build');await p.waitForFunction(()=>document.body.classList.contains('scene-builder-active'));assert(await p.locator('#builderGround').isVisible());assert.equal(await p.locator('.sb-add button').count(),8);
 await require('./diagram-test-helpers.cjs').selectDiagram(p, 'skyPanel');await p.locator('[data-view=horizon]').click();await p.waitForFunction(()=>!document.body.classList.contains('scene-builder-active'));assert(await p.locator('#sky').isVisible());
 await require('./diagram-test-helpers.cjs').toggleCustomization(p);assert.equal(await p.evaluate(()=>SkyCustomization.active),false);assert.equal(await p.locator('.diagram-tool-launch:visible').count(),0);
 await require('./diagram-test-helpers.cjs').selectDiagram(p, 'contextPanel');await p.waitForFunction(()=>!!window.SkyCustomization);assert.equal(await p.evaluate(()=>SkyCustomization.active),false);
 await require('./diagram-test-helpers.cjs').toggleCustomization(p);await p.reload();await p.waitForFunction(()=>!!window.SkyCustomization);assert.equal(await p.evaluate(()=>SkyCustomization.active),false);
 assert.deepEqual(errors,[]);await p.close();
 // English phone: same entry, native parameter drawer, no forced view change or overflow.
 const m=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});m.on('pageerror',e=>errors.push(e.message));await m.goto(base+'lab.en.html');await m.waitForFunction(()=>window.SkyCustomization&&!document.querySelector('.layout-launch').disabled);await require('./diagram-test-helpers.cjs').toggleCustomization(m);await require('./diagram-test-helpers.cjs').openWorkbench(m);await addTool(m,'time');await m.keyboard.press('Enter');if(await m.locator('.dt-back-list').isVisible())await m.locator('.dt-back-list').click();await m.locator('.dt-more').click();await m.getByRole('menuitem',{name:'Save plot objects',exact:true}).click();assert.equal(await m.locator('.dt-panel').evaluate(n=>/[\u3400-\u9fff]/.test(n.innerText)),false);assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await m.screenshot({path:'tests/artifacts/review68-lab-mobile.png'});
 await m.locator('.dt-head button').last().click();await require('./diagram-test-helpers.cjs').openDrawer(m);assert.equal(await m.locator('#uiParameterDrawer').evaluate(n=>n.open),true);await m.locator('#uiDrawerClose').click();
 await require('./diagram-test-helpers.cjs').openWorkbench(m);await addTool(m,'build');await m.waitForFunction(()=>document.body.classList.contains('scene-builder-active'));assert(await m.locator('#builderGround').isVisible());assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);await m.close();console.log('PASS original Lab views and timeline, native controls, cities and times shared across pages and 4 plots, UTC parity, row-specific menus, session drafts, builder entry/return, one-use edit intent, normal refresh, English phone and drawer');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
