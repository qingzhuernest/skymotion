/** Chapter footers open their corresponding feature, rather than adjacent document sections. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const{chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
for(const doc of ['guide','project-guide','development-guide'])for(const lang of ['', '.en']){const source=fs.readFileSync('site/'+doc+lang+'.html','utf8');assert(!source.includes('document-chapter-links'));assert(!/rel="(?:prev|next)"/.test(source));assert(source.includes('document-section-actions'));}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function documentSection(section){await page.goto(base+'development-guide.html?lang=zh#'+section);await page.waitForSelector('html[data-fonts-ready]');if(await page.locator('.entrance-continue').isVisible())await page.locator('.entrance-continue').click();}
 try{
  await documentSection('references');await page.locator('#references .document-section-actions a').click();await page.waitForSelector('html[data-fonts-ready]');await page.waitForFunction(()=>SkyCustomization.active);await page.locator('.dt-panel').waitFor({state:'visible'});assert.equal(await page.locator('[data-rail-section=references]').getAttribute('aria-selected'),'true');
  await documentSection('builder');await page.locator('#builder .document-section-actions a').click();await page.waitForFunction(()=>window.uiWorkspace?.selected==='sceneBuilder'||typeof uiWorkspace!=='undefined'&&uiWorkspace.selected==='sceneBuilder');assert(await page.evaluate(()=>SkyCustomization.active));
  await documentSection('workspace');await page.locator('#workspace .document-section-actions a').click();await page.waitForSelector('html[data-fonts-ready]');await page.waitForFunction(()=>skyWorkspacePresentation.active);assert(await page.locator('.workbench-layout-section').evaluate(e=>e.open));
  // Every teaching task has one precise action, with no duplicate practice link.
  const data=JSON.parse(fs.readFileSync('docs/document-content.json','utf8'));
  const tasks=data.documents.find(d=>d.page==='guide').sections.filter(s=>/^任务/.test(s.title[0]));
  assert.equal(tasks.length,11);
  for(const task of tasks){assert.equal(task.actions.length,1);assert(!task.blocks.some(b=>b.kind==='links'&&b.items.some(i=>/Practice this chapter/.test(i.text[1]))));assert(!/^(diagrams|analemma)\.html/.test(task.actions[0].href));}
  for(const [id,view,body,control] of [['sun','skyPanel','sun','conditionsMenu'],['comparisons','solarCompare','sun',null],['seasons','chartPanel','sun','conditionsMenu'],['latitude','contextPanel','sun','conditionsMenu'],['shadow','skyTopPanel','sun','workbenchMore'],['moon','contextPanel','moon','conditionsMenu'],['sky','companionModule','moon',null],['analemma','analemmaPanel','sun',null]]){
   await page.goto(base+'guide.en.html#'+id);await page.waitForSelector('html[data-fonts-ready]');if(await page.locator('.entrance-continue').isVisible())await page.locator('.entrance-continue').click();
   const action=page.locator('#'+id+' .document-section-actions a');assert.equal(await action.count(),1);console.log('Task deep link',id,await action.getAttribute('href'));await action.click();
   try{await page.waitForFunction(({view,body})=>typeof state!=='undefined'&&typeof uiWorkspace!=='undefined'&&state.body===body&&uiWorkspace.selected===view,{view,body});}catch(error){console.log('Route failure',await page.evaluate(()=>({url:location.href,body:typeof state!=='undefined'?state.body:null,view:typeof uiWorkspace!=='undefined'?uiWorkspace?.selected:null,active:window.skyWorkspacePresentation?.activeView})));throw error;}
   if(control)assert(await page.locator('#'+control).evaluate(node=>node.open));
  }
  await documentSection('references');await page.locator('#references .document-section-actions').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/doclinks123-reference-footer.png'});
  assert.deepEqual(errors,[]);console.log('PASS no previous/next chapter footers in all six manuals; corresponding object editor, scene builder and layout links navigate and reveal their controls');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
