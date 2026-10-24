/** Constellation opening: coherent reveal, locale return, activation and reduced motion. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  for(const [width,height,locale] of [[1280,900,'zh'],[390,844,'en']]) {
   const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+(locale==='en'?'index.en.html':'index.html')+'?lang='+locale);
   await page.waitForFunction(()=>document.documentElement.classList.contains('welcome-opening'));
   assert.equal(await page.locator('.welcome-layout').evaluate(n=>getComputedStyle(n).opacity),'0');
   assert.equal(await page.locator('.welcome-layout').evaluate(n=>n.inert),true);
   assert.equal(await page.locator('#startOpening,#skipOpening').count(),0);
   // Stay intact beyond both the old autoplay duration and startup recovery timer.
   await page.waitForTimeout(width===1280?10500:4500);
   assert.equal(await page.locator('.welcome-layout').evaluate(n=>getComputedStyle(n).opacity),'0');
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('welcome-opening')),true);
   await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('welcome-opening')),true);
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('skymotion-ad-astra')),null);
   await page.locator('#welcomeSky').click({position:{x:width/2,y:height/2}});
   await page.waitForFunction(()=>!document.documentElement.classList.contains('welcome-opening'),{},{timeout:10000});
   assert.equal(await page.locator('.welcome-layout').evaluate(n=>n.inert),false);
   assert.equal(await page.locator('.welcome-layout').evaluate(n=>getComputedStyle(n).opacity),'1');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(errors,[]);
   await page.reload();
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('welcome-opening')),false);
   assert.equal(await page.evaluate(()=>document.documentElement.lang),locale==='en'?'en':'zh-CN');
   await context.close();
  }
  // The opening does not depend on the large dictionary download.
  const earlyContext=await browser.newContext(),early=await earlyContext.newPage();
  let releaseDictionary;
  await early.route('**/language-data.js?*',async route=>{await new Promise(resolve=>releaseDictionary=resolve);await route.continue()});
  await early.goto(base+'index.en.html',{waitUntil:'commit'});
  await early.waitForFunction(()=>window.skyWelcomeReady && document.documentElement.hasAttribute('data-fonts-ready'));
  assert.equal(await early.evaluate(()=>window.skyEnglishDictionary),undefined);
  assert.equal(await early.locator('#welcomeSky').isVisible(),true);
  assert.equal(await early.locator('#welcomeSky').getAttribute('role'),'button');
  assert.equal(await early.evaluate(()=>document.documentElement.classList.contains('welcome-opening')),true);
  await early.keyboard.press('Enter');
  await early.waitForFunction(()=>!document.documentElement.classList.contains('welcome-opening'));
  await early.locator('#welcomeMeteor').click();
  assert.match(await early.locator('#welcomeStarStatus').innerText(),/Meteors are crossing the sky/);
  releaseDictionary();await early.waitForLoadState('domcontentloaded');
  await early.locator('.language-toggle:not(:disabled)').click();
  await early.waitForFunction(()=>document.documentElement.lang==='zh-CN');
  assert.match(await early.locator('#welcomeStarStatus').innerText(),/几颗流星/);
  await earlyContext.close();
  console.log('PASS English star cover starts while the dictionary is still downloading');
  // A slow script request must not make the head advance to the home page.
  const slowContext=await browser.newContext(),slow=await slowContext.newPage();
  await slow.route('**/welcome.js?*', async route=>{await new Promise(resolve=>setTimeout(resolve,11000));await route.continue()});
  await slow.goto(base+'index.html');
  assert.equal(await slow.evaluate(()=>document.documentElement.classList.contains('welcome-opening')),true);
  assert.equal(await slow.locator('.welcome-layout').evaluate(n=>getComputedStyle(n).opacity),'0');
  await slow.keyboard.press('Enter');
  await slow.waitForFunction(()=>!document.documentElement.classList.contains('welcome-opening'));
  await slowContext.close();
  for(const kind of ['reduced','keyboard','touch']) {
   const context=await browser.newContext({viewport:{width:320,height:568},reducedMotion:kind==='reduced'?'reduce':'no-preference',hasTouch:kind==='touch'}),page=await context.newPage();
   await page.goto(base+'index.html');
   if(kind==='keyboard'){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('welcome-opening')),true);await page.keyboard.press('Enter');}
   if(kind==='touch')await page.locator('#welcomeSky').tap({position:{x:160,y:180}});
   await page.waitForFunction(()=>!document.documentElement.classList.contains('welcome-opening'));
   assert.equal(await page.locator('.welcome-layout').evaluate(n=>n.inert),false);
   await context.close();
  }
  console.log('PASS welcome constellation reveal, both locales, return, keyboard/touch activation, delayed scripts, cached-page restoration and reduced motion');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
