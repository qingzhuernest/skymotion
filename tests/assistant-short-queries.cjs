const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const {selectDiagram}=require('./diagram-test-helpers.cjs');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:960,height:1280}}),requests=[];
  page.on('request',r=>requests.push(r.url()));
  await page.goto(base+'lab.html');await page.waitForSelector('html[data-fonts-ready]');
  const original=await page.evaluate(()=>JSON.stringify(state));
  await page.locator('.assistant-launch').click();
  for(const [question,id,words] of [
   ['太阳轨迹','site:SUN-007',['天体轨迹','时刻']],
   ['如何观察杆影长度','site:VIEW-003',['俯视日影','地面影长','竖直立杆高度']],
   ['如何观察日出方位','site:SUN-025',['日出日落方位','端点','日期']]
  ]){
   await page.locator('#assistant-question').fill(question);await page.locator('.assistant-submit').click();
   await page.waitForFunction(id=>document.querySelector('.assistant-log .assistant-turn:last-child')?.dataset.cardId===id,id);
   const text=await page.locator('.assistant-turn').last().innerText();
   for(const word of words)assert(text.includes(word),question+': '+word);
   assert(!/没有足够可靠|哪一项/.test(text),question);
  }
  assert(!requests.some(url=>/assistant\/(worker|models|runtime)/.test(url)));
  assert.equal(await page.evaluate(()=>JSON.stringify(state)),original);
  await page.screenshot({path:'/tmp/assistant142-short-queries.png'});
  await page.keyboard.press('Escape');
  await page.locator('[data-rail-section=views]').click();
  await page.locator('.workbench-viewpoints [data-view=top]').click();await page.locator('[data-rail-section=conditions]').click();
  await page.locator('#displayMenu').evaluate(el=>el.open=true);
  await page.locator('#shadowMenu').evaluate(el=>el.open=true);
  await page.locator('#shadow').check();assert.match(await page.locator('#shadowMetric').innerText(),/m/);
  assert(await page.locator('label[for=height]').isVisible());
  await selectDiagram(page,'riseSetPanel');
  await page.waitForFunction(()=>uiWorkspace.selected==='riseSetPanel');
  assert(await page.locator('#eventCompass').isVisible());
  console.log('PASS screenshot questions answer directly without downloading model; real shadow controls, metric and rise/set view exist; state unchanged by assistant');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
