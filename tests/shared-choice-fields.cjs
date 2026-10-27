/** Selection fields share one renderer without changing their existing state owners. */
const assert=require('node:assert/strict');
const{chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const field=id=>page.locator(`.md-choice-field[data-choice-for="${id}"]`);
 try{
  for(const route of ['lab.html','space/index.html','lunar/index.html']){
   await page.goto(base+route+'?lang=en');await page.waitForSelector('html[data-fonts-ready]');
   await page.waitForFunction(()=>[...document.querySelectorAll('select')].every(select=>select.classList.contains('md-choice-native')&&select.nextElementSibling?.classList.contains('md-choice-field')));
   if(route==='lab.html'){
    await field('place').locator('summary').click();const choose=await page.locator('#place').evaluate(select=>[...select.options].find(option=>option.value!==select.value&&option.value!=='custom').value);
    await field('place').locator('[data-choice-value="'+choose+'"]').click();assert.equal(await page.locator('#place').inputValue(),choose);assert.equal(await page.evaluate(()=>state.lat),Number(choose.split(',')[0]));
    await page.locator('.layout-launch').click();await page.waitForFunction(()=>document.querySelectorAll('.workspace-pane-tools select').length>0);await page.waitForFunction(()=>[...document.querySelectorAll('.workspace-pane-tools select')].every(s=>s.nextElementSibling?.matches('.md-choice-field')));
   }else if(route.startsWith('space')){
    await field('spaceSpeed').locator('[data-choice-value="30"]').click();assert.equal(await page.locator('#spaceSpeed').inputValue(),'30');
    await page.evaluate(()=>{document.getElementById('spaceSpeed').value='2';});await page.waitForFunction(()=>document.querySelector('[data-choice-for=spaceSpeed] [data-choice-value="2"]').getAttribute('aria-pressed')==='true');
   }else{
    await field('lens').locator('[data-choice-value="70"]').click();assert.equal(await page.locator('#lens').inputValue(),'70');
   }
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,route+' overflows');await page.setViewportSize({width:1280,height:1000});
  }
  await page.evaluate(()=>{const select=document.createElement('select');select.id='choice-contract';document.body.append(select);select.add(new Option('First','one'));select.add(new Option('Second','two'));});
  await field('choice-contract').locator('[data-choice-value=two]').click();assert.equal(await page.locator('#choice-contract').inputValue(),'two');
  await page.evaluate(()=>{document.getElementById('choice-contract').replaceChildren(new Option('Third','three'),new Option('Fourth','four'));});await field('choice-contract').locator('[data-choice-value=four]').click();assert.equal(await page.locator('#choice-contract').inputValue(),'four');
  await page.evaluate(()=>{const section=document.createElement('section');section.id='choice-new-parent';document.body.append(section);section.append(document.getElementById('choice-contract'));});await page.waitForFunction(()=>document.querySelector('#choice-new-parent > select + .md-choice-field'));
  await page.evaluate(()=>document.getElementById('choice-contract').disabled=true);await page.waitForFunction(()=>[...document.querySelectorAll('[data-choice-for=choice-contract] button')].every(b=>b.disabled));
  assert.deepEqual(errors,[]);console.log('PASS unified choices across laboratory, 3D, Moon and dynamic pane controls; native state changes, option replacement, relocation, disabled state and phone layout');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
