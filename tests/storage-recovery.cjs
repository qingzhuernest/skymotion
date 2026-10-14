/** Corrupted and restricted storage must not prevent working scientific controls. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base=(process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
(async()=>{const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const route of ['lab.html','diagrams.html','analemma.html','sundial.html']){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>sessionStorage.setItem('skyLabSession',JSON.stringify({body:'sun',sun:{lat:999,lon:999,time:-500,date:'not-a-date',view:'invalid',height:'bad'}})));
  await page.goto(base+route);await page.waitForFunction(()=>window.SkyMotionHistory?.restoring===false || !!document.getElementById('workbenchTime'));await page.waitForTimeout(250);
  const state=await page.evaluate(()=>({lat:state.lat,lon:state.lon,date:state.date,time:state.time,view:state.view}));
  assert.equal(state.lat,39.9);assert.equal(state.lon,116.4);assert.equal(state.date,'2026-06-21');assert.equal(state.time,720);assert.notEqual(state.view,'invalid');assert.deepEqual(errors,[]);
  await page.locator('#workbenchTime').evaluate(e=>{e.value='800';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))});
  assert.equal(await page.evaluate(()=>document.body.dataset.page==='analemma'?state.analemmaClock:state.time),800);await page.close();console.log('PASS corrupted-session recovery and live time control',route);
 }
 const space=await browser.newPage();const sceneErrors=[];space.on('pageerror',e=>sceneErrors.push(e.message));
 await space.addInitScript(()=>sessionStorage.setItem('skyLabSession',JSON.stringify({body:'sun',sun:{lat:999,lon:999,date:'2024-02-30'}})));
 await space.goto(base+'space/index.html');await space.waitForFunction(()=>typeof window.spaceState==='function');
 assert.equal(await space.locator('#observerLat').inputValue(),'39.9');assert.equal(await space.locator('#observerLon').inputValue(),'116.4');assert.deepEqual(sceneErrors,[]);await space.close();console.log('PASS 3D ignores invalid persisted date and coordinates');
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('denied','SecurityError')}}));
 await page.goto(base+'lab.html');await page.waitForSelector('#workbenchTime');assert.equal(await page.evaluate(()=>state.lat),39.9);assert.deepEqual(errors,[]);await page.close();console.log('PASS sessionStorage unavailable at initialization');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
