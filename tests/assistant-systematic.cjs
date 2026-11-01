const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:960,height:1280}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'lab.html');await page.waitForSelector('html[data-fonts-ready]');
  const before=await page.evaluate(()=>JSON.stringify(state));await page.locator('.assistant-launch').click();
  for(const [q,id,word] of [
   ['怎么调节杆高','site:SUN-010','杆高'],['怎么导出设置','site:PREF-022','导出'],
   ['怎样导入设置','site:PREF-023','导入'],['怎么查看月球轨迹','site:MOON-001','月球'],
   ['帮我添加城市','site:EDIT-002','不同地点'],['太阳高度如何计算','science:SUN-001','sin'],
   ['关闭太阳轨迹','site:SUN-007','关闭'],['关闭行星伴月','site:MOON-011','关闭']
  ]){
   await page.locator('#assistant-question').fill(q);await page.locator('.assistant-submit').click();
   await page.waitForFunction(id=>document.querySelector('.assistant-turn:last-child')?.dataset.cardId===id,id);
   assert((await page.locator('.assistant-turn').last().innerText()).includes(word),q);
   assert.equal(await page.locator('.assistant-turn').last().locator('.assistant-references').getAttribute('open'),null);
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(state)),before,'Guidance does not perform requested actions');
  await page.screenshot({path:'/tmp/assistant143-systematic.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS cross-category source guidance, import/export separation, genuine toggle-off instructions, action requests handled as guidance and unchanged experiment state');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
