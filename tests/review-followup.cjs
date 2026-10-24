/** Corrupt history envelopes, restoration failure recovery, visible font retry and stale output. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'lab.html');await p.waitForFunction(()=>!!history.state?.skyMotionInteraction&&!SkyMotionHistory.restoring);
 await p.evaluate(()=>{const saved=structuredClone(history.state);saved.skyMotionInteraction.snapshot.model.active.date='not-a-date';saved.skyMotionInteraction.snapshot.model.sun.lat=999;history.replaceState(saved,'',location.href)});
 await p.reload();await p.waitForFunction(()=>!!window.SkyMotionHistory&&!SkyMotionHistory.restoring);
 assert.equal(await p.evaluate(()=>state.date),'2026-06-21');assert.equal(await p.evaluate(()=>state.lat),39.9);assert.deepEqual(errors,[]);
 // A malformed field list must be ignored instead of throwing midway through restoration.
 await p.evaluate(()=>{const saved=structuredClone(history.state);saved.skyMotionInteraction.snapshot.fields=[null,42,['missing',{}]];history.replaceState(saved,'',location.href)});
 await p.reload();await p.waitForFunction(()=>!!window.SkyMotionHistory&&!SkyMotionHistory.restoring);assert.deepEqual(errors,[]);
 await p.evaluate(()=>{state.analemma=false;state.analemmaBasis='clock';state.analemmaClock=720;state.analemmaIdeal=false;state.solarDateMode=true;state.solarDateLink=true;prepareSolarDateMode();SkyMotionHistory.replaceExternal();window.dispatchEvent(new PopStateEvent('popstate',{state:history.state}));});
 await p.waitForFunction(()=>!SkyMotionHistory.restoring);
 assert.equal(await p.evaluate(()=>state.solarDateLinkBackup.analemma),false);
 await p.evaluate(()=>{state.solarDateLink=false;prepareSolarDateMode()});
 assert.equal(await p.evaluate(()=>state.analemma),false);assert.equal(await p.evaluate(()=>state.analemmaBasis),'clock');
 // Exercise the generation-aware finally even when an adapter throws unexpectedly.
 await p.evaluate(()=>{let fail=true;SkyMotionHistory.register({read:()=>({valid:true}),restore(){if(fail){fail=false;throw Error('test restoration failure')}}});});
 await p.waitForFunction(()=>!SkyMotionHistory.restoring);await p.close();console.log('PASS corrupt historical fields and adapter failures release the restore lock');
 const q=await browser.newPage({viewport:{width:390,height:844}});let blocked=true;
 await q.route('**/fonts/charter_*.woff2',r=>blocked?r.abort():r.continue());await q.goto(base+'lab.html?lang=zh');await q.waitForSelector('.language-toggle:not(:disabled)');
 const initial=await q.evaluate(()=>({date:state.date,time:state.time,lat:state.lat}));await q.locator('.language-toggle').click();
 await q.waitForSelector('.language-load-notice');assert(await q.locator('.language-load-notice').isVisible());assert.match(await q.locator('.language-load-notice').innerText(),/English/);assert.equal(await q.evaluate(()=>document.documentElement.lang),'zh-CN');
 blocked=false;await q.locator('.language-load-notice button').click();await q.waitForFunction(()=>document.documentElement.lang==='en');
 assert.equal(await q.locator('.language-load-notice').count(),0);assert.deepEqual(await q.evaluate(()=>({date:state.date,time:state.time,lat:state.lat})),initial); // Diagram routing moves companion controls outside .ui-parameters. Theme the component itself.
 for(const route of ['diagrams.html','diagrams.en.html']){
  await q.goto(base+route);await q.waitForSelector('.language-toggle:not(:disabled)');
  await q.locator('#observationBody').selectOption('moon');
  await require('./diagram-test-helpers.cjs').selectDiagram(q, 'companionModule');
  assert.equal(await q.locator('#companionClock').count(),0,'Redundant time shortcut is removed');
  await q.setViewportSize({width:1280,height:900});
  const dateBefore=await q.evaluate(()=>state.date);
  await q.locator('#workbenchClockInput').fill('11:00');
  await q.locator('#workbenchClockInput').press('Tab');
  assert.equal(await q.evaluate(()=>state.time),660,'Shared timeline still changes observation time');
  assert.equal(await q.evaluate(()=>state.date),dateBefore);
  await q.waitForFunction(()=>document.getElementById('companionObserverTime').textContent==='11:00');
  assert.equal(await q.locator('#companionObserverDate').textContent(),dateBefore);
  for(const width of [1280,960,390]){
   await q.setViewportSize({width,height:900});
   await q.waitForFunction(width=>Boolean(document.querySelector('.ui-parameters').closest('#uiParameterDrawer'))===(width<=760),width);
   if(width<=760){if(!await q.locator('#uiParameterDrawer').evaluate(d=>d.open))await q.locator('#uiParametersButton').click();}
   else if(await q.locator('.motion-menu-edge').isVisible())await q.locator('.motion-menu-edge').click();
   await q.locator('[data-rail-section=conditions]').click();
   await q.locator('#companionPlanet').waitFor({state:'visible'});
   const alignment=await q.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
    return {label:rect('.companion-toolbar label'),select:rect('#companionPlanet'),button:rect('#companionFind'),moment:rect('.companion-observer-moment'),location:rect('#companionObserverLocation')};
   });
   for(const item of [alignment.label,alignment.button,alignment.moment,alignment.location])assert(Math.abs(item.x-alignment.select.x)<1,'Controls and observation metadata share a left edge');
   assert(Math.abs(alignment.button.width-alignment.select.width)<1,'Select and search button have equal widths');
   assert(alignment.button.y>=alignment.select.bottom+6,'Search sits below the select with a deliberate gap');
   const theme=await q.evaluate(()=>{
    const css=el=>{const s=getComputedStyle(el);return {bg:s.backgroundColor,color:s.color,border:s.borderTopColor,width:s.borderTopWidth}};
    const token=name=>{const el=document.createElement('i');el.style.color=`var(${name})`;document.body.append(el);const value=getComputedStyle(el).color;el.remove();return value};
    return {surface:token('--design-surface'),primary:token('--design-primary'),muted:token('--design-muted'),line:token('--design-line'),
     cards:[...document.querySelectorAll('.companion-measures > div')].map(css),
     labels:[...document.querySelectorAll('.companion-measures span,.companion-measures small')].map(css),
     buttons:[...document.querySelectorAll('.companion-toolbar button')].map(css),status:css(document.getElementById('companionSearchStatus'))};
   });
   for(const card of theme.cards){assert.equal(card.bg,theme.surface,`${route} ${width}: companion card is paper, not legacy blue`);assert.equal(card.color,theme.primary);assert.equal(card.border,theme.line);assert.equal(card.width,'1px')}
   for(const label of theme.labels)assert.equal(label.color,theme.muted);
   for(const button of theme.buttons){assert.equal(button.bg,theme.surface);assert.equal(button.color,theme.primary);assert.equal(button.border,theme.line)}
   assert.equal(theme.status.color,theme.primary);
   await q.evaluate(()=>{const d=document.getElementById('uiParameterDrawer');if(d?.open)d.close()});
  }
  await require('./diagram-test-helpers.cjs').selectDiagram(q, 'chartPanel');
  for(const width of [1280,960,390]){
   await q.setViewportSize({width,height:900});
   const marker=await q.evaluate(()=>{
    const dot=document.querySelector('#chartPanel .panel-title .legend > .dot.sun-dot');
    const probe=document.createElement('i');probe.style.color='var(--design-primary)';document.body.append(probe);
    const expected=getComputedStyle(probe).color;probe.remove();
    return {actual:getComputedStyle(dot).backgroundColor,expected};
   });
   assert.equal(marker.actual,marker.expected,`${route} ${width}: fixed-time legend uses the interface accent`);
  }

 }
 console.log('PASS companion theme, aligned controls, structured observation metadata and lunar markers in both languages at 1280/960/390px');

 await q.close();console.log('PASS mobile language failure is visible and retries English without resetting the experiment');
}finally{await browser.close()}
 // Verify cache warming matches foreground font keys and prioritizes the chosen locale.
 const vm=require('node:vm'),manifest=JSON.parse(fs.readFileSync('page-cache-manifest.json','utf8')),requests=[];
 const sandbox={URL,Promise,setTimeout,CustomEvent:class{},addEventListener(){},document:{body:{dataset:{}},currentScript:{src:'https://example.test/page-cache.js'},readyState:'complete',documentElement:{lang:'zh-CN'},dispatchEvent(){}},fetch:async url=>{requests.push(String(url));return {ok:true,json:async()=>manifest,arrayBuffer:async()=>new ArrayBuffer(0)}}};
 sandbox.window={requestIdleCallback:fn=>fn()};vm.runInNewContext(fs.readFileSync('page-cache.js','utf8'),sandbox);await sandbox.window.skyPageCacheReady;
 assert.equal(sandbox.window.skyPageCache.state,'ready');assert.equal(requests.length,manifest.pages.length+manifest.assets.length+1);
 assert(requests.slice(1,13).every(url=>!url.includes('.en.html')));
 for(const weight of ['regular','bold'])assert(requests.includes(`https://example.test/fonts/reading-${weight}.woff2?v=${manifest.readingFontVersion}`));
 assert(!manifest.assets.some(name=>/interface-.*\.woff$|reading-regular\.woff$|welcome-sans\.woff$/.test(name)));
 assert(manifest.assets.includes('fonts/welcome-hand.ttf'));
 console.log('PASS all-page warming, locale priority and matching font cache URLs');
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'skymotion-freshness-'));
 try{
  const manifest=JSON.parse(fs.readFileSync('page-cache-manifest.json','utf8'));
  for(const name of [...manifest.pages,...manifest.assets,'page-cache-manifest.json','scripts/prerender-pages.py','scripts/site_sources.py']){const target=path.join(temporary,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(name,target)}
  const check=()=>spawnSync('python3',['scripts/prerender-pages.py','--dist',temporary,'--check'],{encoding:'utf8'});
  assert.equal(check().status,0,'Unmodified generated fixture must pass');
  const dictionary=path.join(temporary,'i18n-docs.json'),map=JSON.parse(fs.readFileSync(dictionary,'utf8'));map['欢迎页']='Welcome — updated';fs.writeFileSync(dictionary,JSON.stringify(map));
  const before=fs.readFileSync(path.join(temporary,'guide.en.html'),'utf8'),result=check();assert.notEqual(result.status,0);assert.match(result.stderr,/Stale generated files/);assert.equal(fs.readFileSync(path.join(temporary,'guide.en.html'),'utf8'),before);
  console.log('PASS stale generated output fails the read-only freshness gate');
 }finally{fs.rmSync(temporary,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exit(1)});
