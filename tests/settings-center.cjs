/** User-visible preferences: shared state, real controls, accessibility and safe recovery. */
const assert = require('node:assert/strict');
const {chromium} = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base=(process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:38716/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:960}});
 const errors=[];
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 const page=await context.newPage();
 const open=async(p,route)=>{await p.goto(base+route);await p.waitForSelector('.language-toggle:not(:disabled)');await p.locator('.preferences-launch').click();await p.locator('dialog.preferences-dialog').waitFor({state:'visible'});};
 const category=async(p,name)=>{await p.locator(`[data-category-link="${name}"]`).click();};
 try {
  await open(page,'docs.html');
  await page.waitForFunction(()=>Math.abs(document.querySelector('dialog.preferences-dialog').getBoundingClientRect().width-920)<1);
  await page.selectOption('#pref-theme','dark');
  assert.equal(await page.getAttribute('html','data-theme'),'dark');
  await page.check('#pref-pureBlack');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--design-paper')),'#000000');
  await page.selectOption('#pref-palette','custom');await page.locator('#pref-primary-hex').fill('#ffffff');await page.locator('#pref-primary-hex').dispatchEvent('change');
  await page.selectOption('#pref-contrast','high');
  const ratios=await page.evaluate(()=>{
   const s=getComputedStyle(document.documentElement),read=k=>s.getPropertyValue('--design-'+k).trim();
   const l=hex=>{const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
   return [['ink','paper'],['on-action','accent'],['on-selected','selected']].map(([a,b])=>{const x=l(read(a)),y=l(read(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);});
  });assert(ratios.every(x=>x>=7),JSON.stringify(ratios));
  await page.selectOption('#pref-theme','schedule');await page.locator('#pref-nightStart').fill('22:00');await page.locator('#pref-nightEnd').fill('07:00');
  await page.clock.install({time:new Date(2026,9,26,23,0,0)});await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));assert.equal(await page.getAttribute('html','data-theme'),'dark');
  await page.clock.setSystemTime(new Date(2026,9,27,8,0,0));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));assert.equal(await page.getAttribute('html','data-theme'),'light');
  await page.selectOption('#pref-theme','system');await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await category(page,'reading');await page.selectOption('#pref-uiScale','1.25');assert.equal(await page.locator('.document-links a').first().evaluate(e=>getComputedStyle(e).fontSize),'17.5px');await page.selectOption('#pref-readingScale','1.5');await page.selectOption('#pref-leading','loose');await page.selectOption('#pref-width','wide');
  assert.equal(await page.locator('.document-content p').first().evaluate(e=>getComputedStyle(e).fontSize),'24px');
  await category(page,'animation');await page.selectOption('#pref-motion','reduce');assert.equal(await page.getAttribute('html','data-reduced-motion'),'true');assert(await page.locator('#pref-smoothScroll').isDisabled());
  await page.selectOption('#pref-motion','system');await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.documentElement.dataset.reducedMotion==='true');
  const second=await context.newPage();await second.goto(base+'lab.html');await second.waitForSelector('.language-toggle:not(:disabled)');await second.evaluate(()=>SkyPreferences.set({palette:'blue',theme:'light',uiScale:1}));await page.waitForFunction(()=>SkyPreferences.get().palette==='blue');
  await second.close();
  await page.locator('.preferences-search').fill('轨道');assert(await page.locator('#pref-orbits').isVisible());
  await page.locator('.preferences-search').fill('不存在的设置');assert(await page.locator('.preference-empty').isVisible());
  await page.locator('.preferences-search').fill('');await category(page,'data');
  const original=await page.evaluate(()=>SkyPreferences.export());
  for(const invalid of ['{',JSON.stringify({version:2,preferences:{}}),JSON.stringify({version:1,preferences:{uiScale:10}}),JSON.stringify({version:1,preferences:{nightStart:'07:00',nightEnd:'07:00'}})]) {
   assert(await page.evaluate(text=>{try{SkyPreferences.parseImport(text);return false;}catch{return true;}},invalid));
  }
  assert.equal(await page.evaluate(()=>SkyPreferences.export()),original);
  const file=page.locator('.preferences-dialog input[type=file]');
  await file.setInputFiles({name:'settings.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,preferences:{palette:'gray',uiScale:1.1}}))});
  await page.locator('.preferences-confirm').waitFor({state:'visible'});await page.locator('.preferences-confirm [data-cancel]').click();assert.equal(await page.evaluate(()=>SkyPreferences.get().palette),'blue');
  await file.setInputFiles({name:'settings.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,preferences:{palette:'gray',uiScale:1.1}}))});await page.locator('.preferences-confirm [data-confirm]').click();assert.equal(await page.evaluate(()=>SkyPreferences.get().palette),'gray');
  await page.keyboard.press('Escape');assert(await page.locator('.preferences-launch').evaluate(e=>e===document.activeElement));
  await page.reload();await page.waitForFunction(()=>window.SkyPreferences);assert.equal(await page.evaluate(()=>SkyPreferences.get().uiScale),1.1);
  console.log('PASS themes, schedule, contrast, reading, motion, search, storage, safe import and keyboard close');
  await page.emulateMedia({reducedMotion:'no-preference',colorScheme:'light'});await page.evaluate(()=>SkyPreferences.reset());
  await open(page,'space/');await category(page,'space');await page.uncheck('#pref-orbits');await page.uncheck('#pref-names');await page.uncheck('#pref-stars');await page.selectOption('#pref-quality','low');
  assert.equal(await page.locator('#orbits').isChecked(),false);assert.equal(await page.locator('#names').isChecked(),false);
  await page.keyboard.press('Escape');await page.check('#orbits');assert.equal(await page.evaluate(()=>SkyPreferences.get().orbits),true);
  await page.waitForFunction(()=>window.SolarSpaceView);await page.evaluate(()=>{const s=SolarSpaceView.readSelection();s.fields=s.fields.map(([k,v])=>[k,k==='names'?true:v]);SolarSpaceView.restoreSelection(s);});assert.equal(await page.evaluate(()=>SkyPreferences.get().names),true);
  await page.locator('#stage canvas').first().focus();await page.keyboard.press('r');
  for(let i=0;i<2;i++){await page.locator('#spaceImmersive').click();await page.waitForTimeout(100);assert.equal(await page.locator('.language-actions').count(),1);assert(await page.locator('.preferences-launch').isVisible());}
  await page.evaluate(()=>SkyPreferences.set({theme:'dark'}));
  await page.emulateMedia({media:'print'});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--design-ink').trim()),'#000000');
  await page.emulateMedia({media:'screen'});
  console.log('PASS 3D controls and restored displays synchronize with shared preferences');
  for(const route of ['lab.en.html','space/index.en.html','docs.en.html']){
   await page.setViewportSize({width:390,height:844});await open(page,route+'?lang=en');await page.evaluate(()=>SkyPreferences.set({uiScale:1.25,density:'compact',readingScale:1.5}));
   const bounds=await page.locator('.preferences-dialog').boundingBox();assert(bounds.x>=-1&&bounds.width<=391&&bounds.height<=845,JSON.stringify(bounds));
   await category(page,'reading');assert.equal(await page.locator('#pref-language').inputValue(),'en');
   assert(await page.locator('.preferences-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   await page.screenshot({path:'/tmp/settings-final-'+route.replace(/\W/g,'')+'.png'});
   await page.keyboard.press('Escape');
  }
  const blocked=await browser.newPage();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}});});await open(blocked,'docs.html');await blocked.selectOption('#pref-theme','dark');assert.equal(await blocked.getAttribute('html','data-theme'),'dark');assert.equal(await blocked.evaluate(()=>SkyPreferences.storageAvailable),false);await blocked.close();
  await page.setViewportSize({width:1280,height:960});
  await page.goto(base+'lab.html?lang=zh');await page.waitForFunction(()=>window.SkyWorkbenchMenu);
  await page.waitForSelector('.language-toggle:not(:disabled)');
  await page.evaluate(()=>skyWorkspacePresentation.openOverview());
  await page.locator('.ui-diagram-card:visible h2').first().dblclick();
  await page.waitForFunction(()=>document.querySelector('.ui-plot').dataset.workspaceFocus==='true');
  await page.waitForTimeout(300);
  const beforeHistory=await page.evaluate(()=>history.length);
  await page.locator('.preferences-launch').click();await page.selectOption('#pref-theme','dark');
  await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>history.length),beforeHistory);
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog.preferences-dialog').evaluate(d=>d.open),false);await page.locator('dialog.preferences-dialog').waitFor({state:'hidden'});
  assert.equal(await page.locator('.ui-plot').getAttribute('data-workspace-focus'),'true');
  console.log('PASS settings changes stay outside experiment history and Escape closes the modal');
  assert.deepEqual(errors,[]);console.log('PASS phone English, maximum text, no horizontal overflow, blocked storage and zero page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
