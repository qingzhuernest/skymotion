/** User-reported tasks, actual controls, compact mobile chat and shared app-bar styling. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const {selectDiagram}=require('./diagram-test-helpers.cjs');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
const cases=[
 ['如何观察太阳视运动？','site:LAB-001',['太阳','空间视图','地点','日期','轨迹','时刻']],
 ['打开行星伴月','site:MOON-011',['月球','关联图解','自动启用']],
 ['开启行星伴月','site:MOON-011',['演示','开关']],
 ['如何使用行星伴月？','site:MOON-011',['选择行星','日期','角距']],
 ['如何观察月球和火星的相对位置？','site:MOON-012',['月球','火星','角距','高度','方位']],
 ['开启行星半月','site:MOON-011',['演示','开关']]
];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:960}}),requests=[],errors=[],report=[];
  page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'lab.html');await page.waitForSelector('html[data-fonts-ready]');
  await page.locator('.page-nav .assistant-launch').waitFor();
  const styles=await page.evaluate(()=>['.preferences-launch','.assistant-launch'].map(selector=>{const el=document.querySelector('.page-nav '+selector),s=getComputedStyle(el),r=el.getBoundingClientRect();return {font:s.fontFamily,size:s.fontSize,color:s.color,background:s.backgroundColor,radius:s.borderRadius,shadow:s.boxShadow,y:r.y,height:r.height,position:s.position};}));
  assert.deepEqual(styles[0],styles[1],'Assistant uses the same navigation typography, color, shape and alignment as Settings');
  const original=await page.evaluate(()=>JSON.stringify(state));
  await page.locator('.assistant-launch').click();
  for(const [question,id,words] of cases){
    await page.locator('#assistant-question').fill(question);await page.locator('.assistant-submit').click();
    await page.waitForFunction(expected=>document.querySelector('.assistant-log .assistant-turn:last-child')?.dataset.cardId===expected,id);
    const text=await page.locator('.assistant-turn').last().innerText();
    for(const word of words)assert(text.includes(word),question+': missing '+word);
    assert(!/尚未核实|没有足够可靠/.test(text),question);
    assert(!/BGE|INT8|MB|检索|本地知识/.test(text),'No implementation notes in conversation');
    const diagnostic=await page.evaluate(()=>SkyAssistantDebug.getLast());
    assert.equal(diagnostic.reason,'reviewed_task_plan');assert.equal(diagnostic.decision,'answer');
    report.push({...diagnostic,result:'passed'});
  }
  assert(!requests.some(url=>/assistant\/(worker|models|runtime)/.test(url)),'These supported tasks do not need a model download');
  assert.equal(await page.evaluate(()=>JSON.stringify(state)),original,'Instructions do not perform actions');
  await page.keyboard.press('Escape');
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.locator('.language-nav').evaluate(el=>el.scrollWidth>el.clientWidth+1),false,'All menus remain visible');
  }
  await page.setViewportSize({width:390,height:844});await page.locator('.assistant-launch').click();
  await page.waitForTimeout(400);
  const layout=await page.evaluate(()=>({height:document.querySelector('.assistant-log').getBoundingClientRect().height,viewport:innerHeight,form:document.querySelector('.assistant-form').getBoundingClientRect().height,intro:document.querySelector('.assistant-intro').hidden,status:getComputedStyle(document.querySelector('.assistant-status')).display}));
  assert(layout.height/layout.viewport>.76,JSON.stringify(layout));assert(layout.form<72,JSON.stringify(layout));assert(layout.intro);assert.equal(layout.status,'none');
  await page.screenshot({path:'/tmp/assistant141-mobile.png'});
  await page.keyboard.press('Escape');
  // Validate the instructions against real page event bindings, not only knowledge text.
  await page.setViewportSize({width:1280,height:960});
  await page.locator('button[data-body=moon]').click();await selectDiagram(page,'companionModule');
  await page.waitForFunction(()=>state.body==='moon'&&state.companion&&uiWorkspace.selected==='companionModule');
  await page.locator('[data-rail-section=conditions]').click();
  await page.locator('#companionEnabled').uncheck();await page.waitForFunction(()=>!state.companion);
  await page.locator('#companionEnabled').check();await page.waitForFunction(()=>state.companion);
  await page.locator('[data-choice-for=companionPlanet] md-outlined-select').click();
  await page.locator('[data-choice-for=companionPlanet] md-select-option[data-choice-value=Mars]').click();
  await page.waitForFunction(()=>state.planet==='Mars');
  assert(await page.locator('#companionSeparation').innerText());
  await page.locator('button[data-body=sun]').click();await selectDiagram(page,'skyPanel');
  await page.locator('[data-rail-section=conditions]').click();
  const track=page.locator('#track');await track.evaluate(el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>!state.track);
  await track.evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForFunction(()=>state.track);
  await page.locator('[data-rail-section=views]').click();await page.screenshot({path:'/tmp/assistant141-header.png'});
  require('node:fs').writeFileSync('/tmp/assistant141-reported.json',JSON.stringify({queries:report,mobile:layout,controls:'Moon mode, route auto-enable, demonstration switch, Mars selection, angle readout, Sun mode, track switch passed'},null,2));
  assert.deepEqual(errors,[]);console.log('PASS six reported natural-language tasks, source-checked task plans, actual companion/Mars/track controls, compact mobile conversation and aligned navigation');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
