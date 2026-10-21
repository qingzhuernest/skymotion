const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8997/').replace(/\/?$/,'/');
(async()=>{const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu']});try{
for(const spec of [{width:1280,height:960,touch:true,lang:''},{width:1440,height:1000,touch:false,lang:'.en'},{width:390,height:844,touch:true,lang:'.en'}]){
 const page=await browser.newPage({viewport:{width:spec.width,height:spec.height},hasTouch:spec.touch,isMobile:spec.width<760});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'lab'+spec.lang+'.html');await require('./diagram-test-helpers.cjs').enterCustomization(page);const baseline=await page.evaluate(()=>[state.lat,state.lon,state.date,state.time]);
 if(await page.locator('.diagram-tool-launch:visible').count())await page.locator('.diagram-tool-launch:visible').click();if(await page.locator('[data-dt-view=objects]').isVisible())await page.locator('[data-dt-view=objects]').click();await page.locator('[data-dt-view=library]').click();
 await page.locator('#dt-add-city').selectOption('51.5,-0.1');await require('./diagram-test-helpers.cjs').addTool(page,'observer');await page.waitForFunction(()=>document.querySelectorAll('.dt-row').length===1);
 assert.equal(await page.locator('.dt-fields [data-field=lat]').inputValue(),'51.5');assert.equal(await page.locator('.dt-fields [data-field=lon]').inputValue(),'-0.1');assert(await page.locator('.dt-reference-help').isVisible());
 await page.locator('[data-dt-view=library]').click();await require('./diagram-test-helpers.cjs').addTool(page,'note');assert(await page.locator('.dt-hint').isVisible());assert(await page.locator('.dt-place').isVisible());await page.locator('.dt-place').click();await page.waitForFunction(()=>document.querySelectorAll('.dt-row').length===2);
 assert.deepEqual(await page.evaluate(()=>[state.lat,state.lon,state.date,state.time]),baseline);assert.equal(await page.locator('.dt-panel').evaluate(n=>n.scrollWidth>n.clientWidth),false);assert.deepEqual(errors,[]);
 if(spec.lang)assert.equal(await page.locator('.dt-panel').evaluate(n=>/[\u3400-\u9fff]/.test(n.innerText)),false);
 await page.screenshot({path:`tests/artifacts/add-discovery-${spec.width}.png`});await page.close();
}console.log('PASS discoverable add from object properties, named city coordinates, touch placement fallback, English, unchanged native controls and three viewport widths');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
