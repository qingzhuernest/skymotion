/** Real menu, pointer and touch interactions for shared settings controls. */
const assert=require('node:assert/strict');
const{chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:1000},hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'docs.html?lang=zh');await page.waitForSelector('html[data-fonts-ready]');await page.locator('.preferences-launch').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'preferences-title');
  assert.equal(await page.locator('input[type=search]').count(),0);await page.keyboard.press('Escape');await page.locator('.preferences-launch').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'preferences-title');
  assert(await page.evaluate(()=>['md-outlined-select','md-filter-chip','md-slider','md-switch','md-outlined-button'].every(tag=>!!customElements.get(tag))), 'Official Material Web components are registered');
  assert.equal(await page.locator('.preferences-dialog md-slider').count(),4);
  assert(await page.locator('.preferences-dialog md-switch').count()>4);
  const controls=await page.locator('.preferences-dialog select').count();assert(controls>8);assert.equal(await page.locator('.preferences-dialog .preference-choices').count(),controls);assert.equal(await page.locator('.preferences-dialog [role=combobox]').count(),0);
  await page.locator('[data-category-link=layout]').click();await page.locator('[data-setting=density] [data-choice-value=compact]').click();assert.equal(await page.evaluate(()=>SkyPreferences.get().density),'compact');
  await page.locator('[data-setting=density] [data-choice-value=compact]').focus();await page.keyboard.press('Home');assert.equal(await page.evaluate(()=>SkyPreferences.get().density),'standard');assert.equal(await page.locator('[data-setting=density] [aria-pressed=true]').count(),1);
  await page.locator('[data-category-link=space]').click();await page.locator('[data-setting=quality] [data-choice-value=high]').click();assert.equal(await page.evaluate(()=>SkyPreferences.get().quality),'high');assert.equal(await page.locator('[data-setting=quality] [aria-pressed=true]').count(),1);
  await page.locator('[data-category-link=reading]').click();
  const font=()=>page.locator('.document-links a').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));const originalFont=await font();
  const slider=page.locator('#pref-uiScale');await slider.focus();await page.keyboard.press('Home');assert.equal(await page.evaluate(()=>SkyPreferences.get().uiScale),.8);
  const rect=await slider.boundingBox();
  await page.mouse.move(rect.x+3,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.95,rect.y+rect.height/2,{steps:10});await page.mouse.up();
  assert(await page.evaluate(()=>SkyPreferences.get().uiScale>1.25));assert(await font()>originalFont*1.25);
  await page.locator('[data-setting=uiScale] .md-range-step').last().click();assert(await page.evaluate(()=>SkyPreferences.get().uiScale>1.3));
  await slider.focus();await page.keyboard.press('End');assert.equal(await page.evaluate(()=>SkyPreferences.get().uiScale),1.5);assert.equal(await font(),originalFont*1.5);
  const reading=page.locator('#pref-readingScale'),touch=await reading.boundingBox();await page.touchscreen.tap(touch.x+touch.width*.8,touch.y+touch.height/2);assert(await page.evaluate(()=>SkyPreferences.get().readingScale>1.5));
  await reading.focus();await page.keyboard.press('End');assert.equal(await page.evaluate(()=>SkyPreferences.get().readingScale),2);assert.equal(await page.locator('.document-content p').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),32);
  for(const width of [960,390,320]){await page.setViewportSize({width,height:1000});assert(await page.locator('.preferences-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));}
  await page.setViewportSize({width:960,height:1000});await page.locator('[data-category-link=appearance]').click();await page.locator('[data-setting=theme] [data-choice-value=dark]').click();assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
  await page.screenshot({path:'/tmp/settings121-connected-dark.png'});
  await page.locator('[data-category-link=reading]').click();await page.locator('[data-setting=language] [data-choice-value=en]').click();await page.waitForFunction(()=>document.documentElement.lang==='en');assert.equal(await page.locator('[data-setting=language] [data-choice-value=en]').evaluate(item=>item.selected),true);
  await page.keyboard.press('Escape');await page.locator('.preferences-dialog').waitFor({state:'hidden'});await page.reload();await page.waitForSelector('html[data-fonts-ready]');assert.equal(await page.evaluate(()=>SkyPreferences.get().uiScale),1.5);assert.equal(await page.evaluate(()=>SkyPreferences.get().readingScale),2);
  assert.deepEqual(errors,[]);console.log('PASS official Material Web settings sliders, switches, buttons and connected choices for every categorical setting, no search autofocus on opening or reopening, keyboard selection, real slider drag/touch, actual 150% interface and 200% document text, responsive layout and persistence');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
