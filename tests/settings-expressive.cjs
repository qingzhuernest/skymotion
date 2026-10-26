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
  const controls=await page.locator('.preferences-dialog select').count();assert(controls>8);assert.equal(await page.locator('.preferences-dialog [role=combobox]').count(),controls);
  await page.locator('[data-category-link=layout]').click();await page.locator('#pref-density-trigger').click();
  await page.locator('#pref-density-menu').waitFor({state:'visible'});await page.locator('#pref-density-menu [data-value=compact]').click();assert.equal(await page.evaluate(()=>SkyPreferences.get().density),'compact');
  await page.locator('#pref-density-trigger').focus();await page.keyboard.press('Enter');await page.keyboard.press('Home');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>SkyPreferences.get().density),'standard');
  await page.locator('#pref-density-trigger').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.preferences-dialog').isVisible(),true);assert.equal(await page.locator('#pref-density-trigger').getAttribute('aria-expanded'),'false');
  await page.locator('[data-category-link=reading]').click();
  const font=()=>page.locator('.document-links a').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));const originalFont=await font();
  const slider=page.locator('#pref-uiScale');const rect=await slider.boundingBox();
  await page.mouse.move(rect.x+3,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.8,rect.y+rect.height/2,{steps:10});await page.mouse.up();
  assert(await page.evaluate(()=>SkyPreferences.get().uiScale>1.25));assert(await font()>originalFont*1.25);
  await page.locator('[data-setting=uiScale] .md-range-step').last().click();assert(await page.evaluate(()=>SkyPreferences.get().uiScale>1.3));
  await slider.focus();await page.keyboard.press('End');assert.equal(await page.evaluate(()=>SkyPreferences.get().uiScale),1.5);assert.equal(await font(),originalFont*1.5);
  const reading=page.locator('#pref-readingScale'),touch=await reading.boundingBox();await page.touchscreen.tap(touch.x+touch.width*.8,touch.y+touch.height/2);assert(await page.evaluate(()=>SkyPreferences.get().readingScale>1.5));
  await reading.focus();await page.keyboard.press('End');assert.equal(await page.evaluate(()=>SkyPreferences.get().readingScale),2);assert.equal(await page.locator('.document-content p').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),32);
  for(const width of [960,390,320]){await page.setViewportSize({width,height:1000});assert(await page.locator('.preferences-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));}
  await page.setViewportSize({width:960,height:1000});await page.locator('[data-category-link=appearance]').click();await page.locator('#pref-theme-trigger').click();await page.locator('#pref-theme-menu [data-value=dark]').click();assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
  await page.locator('#pref-theme-trigger').click();const bounds=await page.locator('#pref-theme-menu').boundingBox();assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=960&&bounds.y+bounds.height<=1000);
  await page.screenshot({path:'/tmp/settings119-expressive-dark.png'});await page.keyboard.press('Escape');
  await page.locator('[data-category-link=reading]').click();await page.locator('#pref-language-trigger').click();await page.locator('#pref-language-menu [data-value=en]').click();await page.waitForFunction(()=>document.documentElement.lang==='en');assert.equal(await page.locator('#pref-language-trigger').getAttribute('aria-expanded'),'false');
  await page.keyboard.press('Escape');await page.locator('.preferences-dialog').waitFor({state:'hidden'});await page.reload();await page.waitForSelector('html[data-fonts-ready]');assert.equal(await page.evaluate(()=>SkyPreferences.get().uiScale),1.5);assert.equal(await page.evaluate(()=>SkyPreferences.get().readingScale),2);
  assert.deepEqual(errors,[]);console.log('PASS shared Expressive menus, keyboard/Escape behavior, real slider drag/touch, actual 150% interface and 200% document text, responsive layout and persistence');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
