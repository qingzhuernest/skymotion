/** Current reported object editing and document navigation behavior. */
const assert=require('node:assert/strict');
const{chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const{addTool}=require('./diagram-test-helpers.cjs');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'lab.html?lang=zh#skyPanel');await page.waitForSelector('html[data-fonts-ready]');await addTool(page,'note');await page.keyboard.press('Enter');
  const name=page.locator('.dt-fields [data-field=name]'),annotation=page.locator('.dt-fields [data-field=label]');await name.waitFor({state:'visible'});const original=await annotation.inputValue();
  await name.fill('独立的对象名字');await name.press('Tab');assert.equal(await annotation.inputValue(),original);assert.equal(await page.locator('.dt-list [data-reference-id]').last().textContent(),'独立的对象名字');
  await annotation.fill('独立的图上文字');await annotation.press('Tab');assert.equal(await name.inputValue(),'独立的对象名字');assert.equal(await page.locator('.dt-list [data-reference-id]').last().textContent(),'独立的对象名字');
  const data=await page.evaluate(()=>SkyDiagramTools.snapshotExperiment());assert(JSON.stringify(data).includes('独立的对象名字'));assert(JSON.stringify(data).includes('独立的图上文字'));const normalized=await page.evaluate(snapshot=>SkyDiagramTools.prepareExperiment(snapshot),data);assert(JSON.stringify(normalized).includes('独立的对象名字'));
  assert.equal(await page.locator('.dt-inspector').evaluate(e=>getComputedStyle(e).borderRadius),'16px');await page.screenshot({path:'/tmp/settings122-object-inspector.png'});
  await page.goto(base+'project-guide.html?lang=zh');await page.waitForSelector('html[data-fonts-ready]');
  if(await page.locator('.entrance-continue').isVisible()){const bounds=await page.locator('.entrance-continue').boundingBox(),text=await page.locator('.entrance-sentence').last().boundingBox();assert(Math.abs(bounds.x-text.x)<1);assert(bounds.y>=text.y+text.height);assert(1280-bounds.x-bounds.width>=150);assert(1000-bounds.y-bounds.height>=39);await page.locator('.entrance-continue').click();}
  assert(await page.locator('.document-table').first().locator('tbody tr:last-child td').first().evaluate(e=>parseFloat(getComputedStyle(e).borderBottomLeftRadius)>0));
  await page.locator('#conditions a[href*="control=conditionsMenu"]').click();await page.waitForSelector('html[data-fonts-ready]');assert(await page.locator('#conditionsMenu').evaluate(e=>e.open));assert.equal(await page.locator('[data-rail-section=conditions]').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('input[type=search]').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS independent object names and plot annotations, separated inspector sections, inset reading action, rounded table corners and direct Lab control links');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
