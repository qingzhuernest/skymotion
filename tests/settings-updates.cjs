/** Requested navigation, continuous reading, independent backgrounds and sky panes. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const {setRange}=require('./preferences-test-helpers.cjs');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:1100}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript(()=>{if(!sessionStorage.getItem('prefs-migration-tested')){localStorage.setItem('skymotion-preferences',JSON.stringify({version:1,preferences:{palette:'blue',uiScale:1.1,leading:'loose',width:'narrow'}}));sessionStorage.setItem('prefs-migration-tested','1');}});
  await page.goto(base+'lab.html?lang=zh');await page.waitForSelector('html[data-fonts-ready]');
  assert.equal(await page.locator('.page-nav > .preferences-launch').textContent(),'设置');assert.equal(await page.locator('.language-toggle').isVisible(),false);assert(await page.locator('.layout-launch').isVisible());
  assert.equal(await page.evaluate(()=>SkyPreferences.get().leading),2.15);assert.equal(await page.evaluate(()=>SkyPreferences.get().width),80);
  const before=await page.evaluate(()=>[state.lat,state.lon,state.time,state.date,state.view]);
  await page.locator('.preferences-launch').click();await page.locator('[data-category-link=reading]').click();
  assert.equal(await page.locator('.preference-section[data-category=reading] input[type=range]').count(),4);
  await setRange(page,'uiScale',1.17);await setRange(page,'readingScale',1.23);await setRange(page,'leading',1.97);await setRange(page,'width',93);
  assert.equal(await page.locator('#pref-uiScale-value').textContent(),'117%');assert.equal(await page.locator('#pref-leading-value').textContent(),'1.97 倍');
  await page.locator('#pref-uiScale').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>SkyPreferences.get().uiScale),1.18);
  await page.selectOption('#pref-language','en');await page.waitForFunction(()=>document.documentElement.lang==='en');assert.equal(await page.locator('.preferences-launch').textContent(),'Settings');
  await page.locator('[data-category-link=appearance]').click();await page.selectOption('#pref-surfaceMode','custom');await page.locator('#pref-surfaceColor-hex').fill('#808080');await page.locator('#pref-surfaceColor-hex').dispatchEvent('change');
  await page.selectOption('#pref-canvasMode','custom');await page.locator('#pref-canvasColor-hex').fill('#ffffff');await page.locator('#pref-canvasColor-hex').dispatchEvent('change');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--design-paper').trim()),'#808080');assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--design-plot').trim()),'#ffffff');
  await page.keyboard.press('Escape');await page.locator('.preferences-dialog').waitFor({state:'hidden'});
  assert.deepEqual(await page.evaluate(()=>[state.lat,state.lon,state.time,state.date,state.view]),before);
  assert.equal(await page.evaluate(()=>JSON.parse(SkyPreferences.export()).version),2);
  assert.equal(await page.evaluate(()=>SkyPreferences.parseImport(JSON.stringify({version:1,preferences:{leading:'loose',width:'wide'}})).preferences.width),120);
  await page.locator('.layout-launch').click();await page.locator('[data-rail-section=views]').click();
  for(const id of ['skyTopPanel','skyHorizonPanel','skyObserverPanel','skyPanel']){const add=page.locator(`[data-add-sky-view="${id}"]`);if(await add.getAttribute('aria-pressed')!=='true')await add.click();}
  await page.waitForFunction(()=>['skyTopPanel','skyHorizonPanel','skyObserverPanel','skyPanel'].every(id=>skyWorkspacePresentation.views.includes(id)));
  const views=await page.evaluate(()=>skyWorkspacePresentation.views);for(const id of ['skyTopPanel','skyHorizonPanel','skyObserverPanel','skyPanel'])assert(views.includes(id));
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#stage').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  assert.equal(await page.locator('.ui-diagram-card:visible').count(),views.length);assert(views.length<=6);
  const pixels=await page.evaluate(()=>['sky','skyTopPanel-canvas','skyHorizonPanel-canvas','skyObserverPanel-canvas'].map(id=>{const c=document.getElementById(id);return {id,w:c.width,h:c.height,data:c.toDataURL()};}));
  assert(pixels.every(p=>p.w>100&&p.h>50));assert.equal(new Set(pixels.map(p=>p.data)).size,4);
  const top=page.locator('#skyTopPanel-canvas');await top.hover();await page.mouse.wheel(0,-100);await page.waitForTimeout(200);assert((await page.evaluate(()=>SkyPerspectives.snapshot().top.zoom))>1);
  await page.locator('#skyObserverPanel-canvas').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>SkyPerspectives.snapshot().observer.observerAz),185);
  assert.deepEqual(await page.evaluate(()=>[state.lat,state.lon,state.time,state.date,state.view]),before);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('skymotion-workspace-v3-wide')));assert.equal(saved.skyCameras.observer.observerAz,185);
  const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const{root}=await cdp.send('DOM.getDocument',{depth:-1});const{nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'[data-workbench-view=sceneBuilder]'});const font=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});assert(font.fonts.every(f=>f.isCustomFont));
  await page.screenshot({path:'/tmp/settings117-combination.png'});
  await page.reload();await page.waitForSelector('html[data-fonts-ready]');await page.locator('.layout-launch').click();await page.locator('[data-rail-section=views]').click();await page.locator('[data-workbench-view=solarCompare]').click();await page.waitForFunction(()=>skyWorkspacePresentation.active);
  assert.equal(await page.evaluate(()=>SkyPerspectives.snapshot().observer.observerAz),185);
  assert.equal(await page.evaluate(()=>SkyPreferences.get().uiScale),1.18);
  for(const width of [960,390,320]){
   await page.setViewportSize({width,height:1000});await page.locator('.preferences-launch').click();await page.locator('[data-category-link=reading]').click();assert(await page.locator('.preferences-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.screenshot({path:'/tmp/settings117-reading-'+width+'.png'});await page.keyboard.press('Escape');await page.locator('.preferences-dialog').waitFor({state:'hidden'});
  }
  assert.deepEqual(errors,[]);console.log('PASS navigation settings and hidden language; continuous native reading sliders; v1 migration; independent UI/canvas backgrounds; four simultaneous sky perspectives; independent camera, persistence, retained custom glyphs, phone layout and unchanged science');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
