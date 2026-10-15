/** Layout gestures, persistence, accessibility, breakpoints and scientific-state isolation. */
const assert=require('node:assert/strict');
const{chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8905/').replace(/\/?$/,'/');
(async()=>{const b=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});try{
 const c=await b.newContext({viewport:{width:1280,height:900}}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'diagrams.en.html');await p.locator('.language-toggle:not(:disabled)').waitFor();
 const science=()=>p.evaluate(()=>({date:state.date,time:state.time,lat:state.lat,lon:state.lon,manual:state.manual,playing:state.playing}));
 const initial=await science(),stored=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('skymotion-layout-diagrams-v1-wide')));
 await p.locator('.layout-launch').click();await p.waitForTimeout(600);
 assert(await p.locator('#layoutTools').isVisible(),'Editing toolbar stays open');
 assert(await p.locator('[data-layout-panel="parameters"]').isVisible());
 const a=p.locator('[data-layout-panel="contextPanel"]'),chart=p.locator('[data-layout-panel="chartPanel"]');
 assert((await a.boundingBox()).width>500,'Half-width diagram uses six columns');
 assert((await p.locator('#globe').boundingBox()).width>500,'Nested globe fills its resized surface');
 await p.evaluate(()=>window.scrollTo(0,500));assert((await p.evaluate(()=>scrollY))>0,'Custom workspace scrolls beyond the fixed-height laboratory');await p.evaluate(()=>window.scrollTo(0,0));
 assert((await p.locator('[data-layout-panel="timeline"]').boundingBox()).width>1100);
 const h=chart.locator('[data-layout-handle]');await h.scrollIntoViewIfNeeded();let from=await h.boundingBox(),to=await a.locator('[data-layout-handle]').boundingBox();
 await p.mouse.move(from.x+16,from.y+16);await p.mouse.down();await p.mouse.move(to.x+50,to.y+10,{steps:8});await p.waitForTimeout(80);await p.mouse.up();
 let layout=await stored();assert(layout.panels.findIndex(n=>n.id==='chartPanel')<layout.panels.findIndex(n=>n.id==='contextPanel'));
 await chart.locator('[data-layout-resize]').focus();await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowRight');
 layout=await stored();assert.equal(layout.panels.find(n=>n.id==='chartPanel').span,12);assert.equal(layout.panels.find(n=>n.id==='chartPanel').height,420);
 await p.locator('#layoutTools [data-layout-word="undo"]').click();assert.equal((await stored()).panels.find(n=>n.id==='chartPanel').span,6);
 // Pointer resize commits once and cancellation leaves the saved configuration untouched.
 const resize=a.locator('[data-layout-resize]');await resize.scrollIntoViewIfNeeded();from=await resize.boundingBox();const oldHeight=(await stored()).panels.find(n=>n.id==='contextPanel').height;
 await p.mouse.move(from.x+16,from.y+16);await p.mouse.down();await p.mouse.move(from.x+16,from.y+76,{steps:6});await p.waitForTimeout(80);await p.mouse.up();
 assert((await stored()).panels.find(n=>n.id==='contextPanel').height>oldHeight);
 const beforeCancel=await stored();await h.scrollIntoViewIfNeeded();from=await h.boundingBox();await p.mouse.move(from.x+16,from.y+16);await p.mouse.down();await p.mouse.move(from.x+90,from.y+35);await p.keyboard.press('Escape');await p.mouse.up();assert.deepEqual(await stored(),beforeCancel);
 assert.equal(await p.locator('.layout-ghost').count(),0);assert.deepEqual(await science(),initial);
 await p.locator('.layout-launch').click();assert(!await p.locator('#layoutTools').isVisible());
 await p.reload();await p.locator('.language-toggle:not(:disabled)').waitFor();assert(await p.locator('body').evaluate(n=>n.classList.contains('custom-workspace')));assert.deepEqual(await stored(),beforeCancel);
 assert.deepEqual(await p.locator('.ui-grid > [data-layout-panel]').evaluateAll(nodes=>nodes.map(n=>n.dataset.layoutPanel)),beforeCancel.panels.map(n=>n.id),'DOM order follows visual order');
 await p.locator('.layout-launch').click();await p.locator('#layoutTools [data-layout-word="standard"]').click();assert(!await p.locator('body').evaluate(n=>n.classList.contains('custom-workspace')));
 await p.locator('.layout-launch').click();await p.locator('#layoutTools [data-layout-word="reset"]').click();assert.deepEqual((await stored()).panels.map(n=>n.id),['timeline','contextPanel','chartPanel','riseSetPanel','solarGeometryPanel','parameters']);
 await p.locator('.language-toggle').click();await p.waitForFunction(()=>document.documentElement.lang==='zh-CN');assert.match(await p.locator('#layoutTools').innerText(),/恢复默认布局/);
 await p.locator('button[data-body="moon"]').click();assert(!await p.locator('body').evaluate(n=>n.classList.contains('custom-workspace')));await p.locator('button[data-body="sun"]').click();assert(await p.locator('body').evaluate(n=>n.classList.contains('custom-workspace')));
 // Breakpoint-specific storage and an inline parameter panel on phones.
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(250);await p.locator('.layout-launch').click();
 assert(await p.locator('#layoutTools').isVisible());assert(await p.locator('[data-layout-panel="parameters"]').isVisible());
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.locator('[data-layout-panel="contextPanel"] [data-layout-word="before"]').click();
 const narrow=await p.evaluate(()=>JSON.parse(localStorage.getItem('skymotion-layout-diagrams-v1-narrow')));assert.equal(narrow.panels[0].id,'contextPanel');
 await p.locator('#layoutTools [data-layout-word="standard"]').click();assert.equal(await p.locator('[data-layout-panel="parameters"]').evaluate(n=>n.parentElement.id),'uiParameterDrawer');
 assert.deepEqual(errors,[]);await c.close();
 const blocked=await b.newContext(),q=await blocked.newPage();await q.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('denied')}})});await q.goto(base+'diagrams.en.html');await q.locator('.layout-launch').click();await q.locator('[data-layout-panel="contextPanel"] [data-layout-word="before"]').click();assert.match(await q.locator('.layout-status').innerText(),/unavailable/);await blocked.close();
 console.log('PASS layout drag, pointer/keyboard resize, cancel, undo, reset, locale, persistence, mobile drawer, denied storage and unchanged science');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
