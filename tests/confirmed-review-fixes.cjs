/** Focused regressions for confirmed review findings; no whole-site audit. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const { toggleLanguage } = require('./preferences-test-helpers.cjs');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
// The same physical lunar vector must land on its orbit in the comparison projection.
const lines = [], discs = [];
const ctx = new Proxy({
  moveTo(x,y) { lines.push([x,y]); },
  arc(x,y,r) { discs.push([x,y,r]); },
  createRadialGradient() { return { addColorStop() {} }; },
  measureText() { return { width: 20 }; },
}, {get(o,k) { return o[k] || (()=>{}); }});
const canvas = {setAttribute(){},addEventListener(){},getContext(){return ctx;}};
const sandbox = {document:{createElement(){return canvas;}},SolarSpaceModel:{MOON_DISPLAY_SCALE:1.5/0.002569555}};
vm.runInNewContext(fs.readFileSync('space/compare.js','utf8'),sandbox);
const compare=sandbox.SolarSpaceCompare.create({host:{append(){},getBoundingClientRect(){return {width:600,height:400};}}});
const moon={x:0.002,z:0.001},factor=sandbox.SolarSpaceModel.MOON_DISPLAY_SCALE;
compare.render({view:'earthmoon',snapshot:{moon,earthToSun:{x:0,z:0},moonIllumination:0.5},lunarPath:[{x:moon.x*factor,z:moon.z*factor}],parallelRays:false,names:false});
assert.equal(discs.length,2);assert.deepEqual(discs[1].slice(0,2),lines[0]);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto(base+'lab.html?lang=zh');await page.waitForSelector('html[data-fonts-ready]');
  await page.evaluate(()=>{state.manual=true;SkyMotionSession.write({body:'sun',sun:{...state},moon:modeStates.moon});});
  await page.goto(base+'analemma.html?lang=zh');await page.waitForSelector('html[data-fonts-ready]');
  assert.equal(await page.evaluate(()=>state.manual),false);
  assert.equal(await page.locator('#analemmaCanvas').isVisible(),true);
  assert.equal(await page.evaluate(()=>workbenchBasis()),'date');
  const oldTime=await page.evaluate(()=>state.time);
  await page.locator('#workbenchTime').evaluate(e=>{e.value=853;e.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForFunction(()=>state.analemmaClock===853);assert.equal(await page.evaluate(()=>state.time),oldTime);
  await page.evaluate(()=>workbenchPlay());assert.equal(await page.evaluate(()=>analemmaPlaying),true);assert.equal(await page.evaluate(()=>state.playing),false);await page.evaluate(()=>workbenchPlay());
  await page.locator('#workbenchClockInput').evaluate(e=>{e.value='25:00';e.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await page.evaluate(()=>state.analemmaClock),853);
  await page.goto(base+'lab.html?lang=zh');await page.waitForSelector('html[data-fonts-ready]');
  const previous=await page.evaluate(()=>state.time);
  await page.locator('#workbenchTime').evaluate(e=>{e.value=840;e.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(450);
  await toggleLanguage(page);assert.equal(await page.evaluate(()=>document.documentElement.lang),'en');
  await page.goBack();await page.waitForFunction(value=>state.time===value,previous);
  await page.goForward();await page.waitForFunction(()=>state.time===840);
  assert.equal(await page.locator('meta[name=description]').evaluate(e=>/[\u3400-\u9fff]/.test(e.content)),false);
  assert.equal(await page.locator('#eventCompass').evaluate(e=>/[\u3400-\u9fff]/.test(e.getAttribute('aria-label'))),false);
  assert.deepEqual(errors,[]);
  console.log('PASS ideal-session analemma entry, dedicated clock and playback, invalid clock rejection, cross-language history undo/redo, English metadata/aria, lunar marker aligned with orbit');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
