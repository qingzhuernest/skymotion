/** Constellation opening: coherent reveal, locale return, skip and reduced motion. */
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
  for(const kind of ['reduced','keyboard','touch']) {
   const context=await browser.newContext({viewport:{width:320,height:568},reducedMotion:kind==='reduced'?'reduce':'no-preference',hasTouch:kind==='touch'}),page=await context.newPage();
   await page.goto(base+'index.html');
   if(kind==='keyboard')await page.keyboard.press('Tab');
   if(kind==='touch')await page.locator('#welcomeSky').tap({position:{x:160,y:180}});
   await page.waitForFunction(()=>!document.documentElement.classList.contains('welcome-opening'));
   assert.equal(await page.locator('.welcome-layout').evaluate(n=>n.inert),false);
   await context.close();
  }
  console.log('PASS welcome constellation reveal, both locales, return, keyboard/touch skip and reduced motion');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
