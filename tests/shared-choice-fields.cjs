/** Selection fields share one renderer without changing their existing state owners. */
const assert=require('node:assert/strict');
const{chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));
 await page.addInitScript(()=>{window.originalChoiceSetters=[[HTMLSelectElement.prototype,'value'],[HTMLSelectElement.prototype,'selectedIndex'],[HTMLOptionElement.prototype,'selected']].map(([prototype,key])=>[prototype,key,Object.getOwnPropertyDescriptor(prototype,key).set]);});
 const field=id=>page.locator(`.md-choice-field[data-choice-for="${id}"]`);
 try{
  for(const route of ['lab.html','space/index.html','lunar/index.html']){
   await page.goto(base+route+'?lang=en');await page.waitForSelector('html[data-fonts-ready]');assert(await page.evaluate(()=>originalChoiceSetters.every(([prototype,key,setter])=>Object.getOwnPropertyDescriptor(prototype,key).set===setter)),'Native choice setters must remain unchanged');
   await page.waitForFunction(()=>[...document.querySelectorAll('select')].every(select=>select.classList.contains('md-choice-native')&&select.nextElementSibling?.classList.contains('md-choice-field')));
   if(route==='lab.html'){
    await field('place').locator('summary').click();const choose=await page.locator('#place').evaluate(select=>[...select.options].find(option=>option.value!==select.value&&option.value!=='custom').value);
    await field('place').locator('[data-choice-value="'+choose+'"]').click();assert.equal(await page.locator('#place').inputValue(),choose);assert.equal(await page.evaluate(()=>state.lat),Number(choose.split(',')[0]));
    await page.locator('.layout-launch').click();await page.waitForFunction(()=>document.querySelectorAll('.workspace-pane-tools select').length>0);await page.waitForFunction(()=>[...document.querySelectorAll('.workspace-pane-tools select')].every(s=>s.nextElementSibling?.matches('.md-choice-field')));
    await page.waitForFunction(()=>skyWorkspacePresentation.editing);
    await page.evaluate(()=>skyWorkspacePresentation.openOverview());await page.waitForFunction(()=>skyWorkspacePresentation.active);
    for(const id of ['skyPanel','skyTopPanel','skyHorizonPanel','skyObserverPanel']){await page.evaluate(id=>skyWorkspacePresentation.addView(id),id);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));}
    for(const id of await page.evaluate(()=>skyWorkspacePresentation.views.filter(id=>!['skyPanel','skyTopPanel','skyHorizonPanel','skyObserverPanel'].includes(id)))){await page.evaluate(id=>skyWorkspacePresentation.removeView(id),id);}
    const currentViews=await page.evaluate(()=>skyWorkspacePresentation.views);assert.equal(currentViews.length,4,JSON.stringify(currentViews));
    await page.setViewportSize({width:960,height:1000});
    const pane=page.locator('.ui-diagram-card:visible').nth(3),before=await pane.locator('canvas').first().boundingBox();
    await pane.locator('.workspace-pane-tools .md-choice-disclosure > summary').click();
    const popup=pane.locator('.md-choice-panel');await popup.waitFor({state:'visible'});assert.equal(await page.locator('input[type=search]').count(),0);const bounds=await popup.boundingBox(),after=await pane.locator('canvas').first().boundingBox();
    assert(bounds.width>=300&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=960&&bounds.y+bounds.height<=1000,JSON.stringify(bounds));assert(Math.abs(before.height-after.height)<1,'chooser changed pane canvas height');
    for(const box of await popup.locator('button:visible').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})))){assert(box.width>=120,JSON.stringify(box));assert(box.height>=44&&box.height<120,JSON.stringify(box));}
    await page.screenshot({path:'/tmp/settings122-four-pane-choice.png'});
    await popup.locator('[data-choice-value=chartPanel]').click();await page.waitForFunction(()=>skyWorkspacePresentation.views.includes('chartPanel'));assert.equal(await page.locator('.md-choice-panel:popover-open').count(),0);

   }else if(route.startsWith('space')){
    await field('spaceSpeed').locator('[data-choice-value="30"]').click();assert.equal(await page.locator('#spaceSpeed').inputValue(),'30');
    await page.evaluate(()=>{SkyMaterial.setValue(document.getElementById('spaceSpeed'),'2');});await page.waitForFunction(()=>document.querySelector('[data-choice-for=spaceSpeed] [data-choice-value="2"]').getAttribute('aria-pressed')==='true');
   }else{
    await field('lens').locator('[data-choice-value="70"]').click();assert.equal(await page.locator('#lens').inputValue(),'70');
   }
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,route+' overflows');await page.setViewportSize({width:1280,height:1000});
  }
  await page.evaluate(()=>{const select=document.createElement('select');select.id='choice-contract';document.body.append(select);select.add(new Option('First','one'));select.add(new Option('Second','two'));});
  await field('choice-contract').locator('[data-choice-value=two]').click();assert.equal(await page.locator('#choice-contract').inputValue(),'two');
  await page.evaluate(()=>{document.getElementById('choice-contract').replaceChildren(new Option('Third','three'),new Option('Fourth','four'));});await field('choice-contract').locator('[data-choice-value=four]').click();assert.equal(await page.locator('#choice-contract').inputValue(),'four');
  await page.evaluate(()=>{const select=document.getElementById('choice-contract');window.choiceEvents=[];for(const type of ['input','change'])select.addEventListener(type,()=>choiceEvents.push(type));SkyMaterial.setValue(select,'three');});
  await page.waitForFunction(()=>document.querySelector('[data-choice-for=choice-contract] [data-choice-value=three]').getAttribute('aria-pressed')==='true');
  assert.deepEqual(await page.evaluate(()=>choiceEvents),[],'Programmatic commits must not create user events');
  await page.evaluate(()=>{const select=document.getElementById('choice-contract');select.selectedIndex=1;SkyMaterial.syncChoices(select);});
  assert.equal(await field('choice-contract').locator('[data-choice-value=four]').getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{const section=document.createElement('section');section.id='choice-new-parent';document.body.append(section);section.append(document.getElementById('choice-contract'));});await page.waitForFunction(()=>document.querySelector('#choice-new-parent > select + .md-choice-field'));
  await page.evaluate(()=>document.getElementById('choice-contract').disabled=true);await page.waitForFunction(()=>[...document.querySelectorAll('[data-choice-for=choice-contract] button')].every(b=>b.disabled));
  assert.deepEqual(errors,[]);console.log('PASS unified choices across laboratory, 3D, Moon and dynamic pane controls; native state changes, option replacement, relocation, disabled state and phone layout');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
