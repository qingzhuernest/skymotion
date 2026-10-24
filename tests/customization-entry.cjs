/** Public entry points: 3D mode gate, explicit empty builder, and discoverable Lab comparisons. */
const assert = require('node:assert/strict');
const {chromium} = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8992/').replace(/\/?$/, '/');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium', args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try {
  for (const mobile of [false, true]) {
   const context = await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}, isMobile:mobile, hasTouch:mobile});
   const p = await context.newPage(), errors=[]; p.on('pageerror', e=>errors.push(e.message));
   await p.goto(base+'space/index'+(mobile?'.en':'')+'.html',{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.SkyCustomization && document.querySelector('.language-actions .layout-launch'));
   assert.equal(await p.locator('.layout-launch').count(),1);
   assert.equal(await p.evaluate(()=>SkyCustomization.active),false);
   await p.waitForFunction(()=>document.querySelector('.dt-overlay'));
   assert.equal(await p.locator('.diagram-tool-launch:visible').count(),0);
   await require('./diagram-test-helpers.cjs').toggleCustomization(p);
   await p.locator('.dt-panel:visible,.diagram-tool-launch:visible').first().waitFor();
   if(!mobile){await p.locator('.dt-panel.dt-docked').waitFor({state:'visible'});const bounds=await p.evaluate(()=>({panel:document.querySelector('.dt-panel').getBoundingClientRect().right,plot:document.querySelector('.stage').getBoundingClientRect().left}));assert(bounds.panel<=bounds.plot,'3D editor stays in the left rail without covering the scene');await p.locator('[data-rail-section=conditions]').click();assert(await p.locator('.side .card').first().isVisible());await p.locator('[data-rail-section=references]').click();}
   await p.locator('#spaceImmersive').click();
   await p.waitForFunction(()=>document.querySelector('.head-actions .language-actions'));await p.waitForFunction(()=>getComputedStyle(document.querySelector('.layout-launch')).backgroundColor==='rgb(36, 87, 107)');assert.equal(await p.locator('.layout-launch').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(36, 87, 107)','immersive customization retains the same approved green');
   assert(await p.locator('.layout-launch').isVisible());
   assert(await p.locator('.language-toggle').isVisible());
   await require('./diagram-test-helpers.cjs').openWorkbench(p);
   await require('./diagram-test-helpers.cjs').openWorkbench(p);await p.locator('.dt-panel').waitFor({state:'visible'});
   assert(await p.locator('.layout-launch').isVisible());
   await require('./diagram-test-helpers.cjs').toggleCustomization(p);
   assert.equal(await p.evaluate(()=>SkyCustomization.active),false);
   assert.equal(await p.locator('.dt-panel').isVisible(),false);
   assert.equal(await p.locator('.diagram-tool-launch:visible').count(),0);
   await p.locator('#spaceImmersive').click();
   await p.waitForFunction(()=>document.querySelector('.language-nav > .language-actions'));
   assert(await p.locator('.layout-launch').isVisible());
   await p.goto(base+'lab'+(mobile?'.en':'')+'.html',{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.SkyWorkbenchMenu && !document.querySelector('.layout-launch').disabled);
   await require('./diagram-test-helpers.cjs').toggleCustomization(p);
   await require('./diagram-test-helpers.cjs').openWorkbench(p);await p.locator('.dt-panel').waitFor({state:'visible'});
   assert.equal(await p.locator('#labComparisons').count(),0);
   assert.equal(await p.evaluate(()=>SkyDiagramTools.read('lab-sky').length),0,'entry must not invent objects');
   await require('./diagram-test-helpers.cjs').openLibrary(p);await p.locator('[data-build-kind=rod]').click();
   await p.waitForFunction(()=>document.body.classList.contains('scene-builder-active'));
   assert.equal(await p.evaluate(()=>SkySceneBuilder.read().objects.length),0,'placing is pending, not an implicit object');
   await require('./diagram-test-helpers.cjs').closeDrawer(p);await p.locator('#observationBody').selectOption('moon');await p.waitForFunction(()=>state.body==='moon'&&SkySceneBuilder.read()?.objects.length===0);
   assert.deepEqual(await p.locator('#builderGround').evaluate(n=>[...n.getContext('2d').getImageData(0,0,1,1).data]),[19,36,56,255]);
   if(mobile)await require('./diagram-test-helpers.cjs').openDrawer(p);
   await p.locator('.sb-add-toggle').click();await p.locator('.sb-add [data-object-kind=circle]').click();
   await require('./diagram-test-helpers.cjs').closeDrawer(p);await p.locator('#builderGround').focus();await p.keyboard.press('Enter');
   assert.equal(await p.evaluate(()=>SkySceneBuilder.read().objects.length),1);
   assert.equal(await p.evaluate(()=>SkySceneBuilder.read().objects[0].kind),'circle');
   await p.goto(base+'analemma'+(mobile?'.en':'')+'.html');await p.waitForFunction(()=>window.SkyCustomization&&!document.querySelector('.layout-launch').disabled&&document.querySelector('.language-actions .layout-launch'));assert.equal(await p.locator('.diagram-tool-launch:visible').count(),0);await require('./diagram-test-helpers.cjs').toggleCustomization(p);await require('./diagram-test-helpers.cjs').openWorkbench(p);await p.locator('.dt-panel').waitFor({state:'visible'});assert(await p.locator('.language-actions .layout-launch').isVisible());await p.waitForFunction(()=>getComputedStyle(document.querySelector('.language-actions .layout-launch')).backgroundColor==='rgb(36, 87, 107)');const palette=await p.evaluate(()=>{const token=name=>{const probe=document.createElement('i');probe.style.color=`var(${name})`;document.body.append(probe);const value=getComputedStyle(probe).color;probe.remove();return value};return {primary:token('--design-primary'),surface:token('--design-surface'),active:getComputedStyle(document.querySelector('.language-actions .layout-launch')).backgroundColor,buttons:[...document.querySelectorAll('.language-actions button,.dt-panel button')].filter(n=>n.getBoundingClientRect().width&&n.getBoundingClientRect().height).map(n=>getComputedStyle(n).backgroundColor)}});assert.equal(palette.primary,'rgb(36, 87, 107)','the original approved green accent is retained');assert.equal(palette.active,palette.primary,'Finish customizing uses the same original green');assert(palette.buttons.every(color=>!['rgb(234, 240, 252)','rgb(219, 231, 252)','rgb(225, 237, 255)','rgb(220, 234, 255)'].includes(color)),'legacy blue control fills are absent');await require('./diagram-test-helpers.cjs').toggleCustomization(p);assert.equal(await p.locator('.diagram-tool-launch:visible').count(),0);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS persistent 3D customization entry in normal/immersive desktop and phone, explicit mode gate, native Lab comparisons, no invented references, empty solar and lunar builders, matching plot palette and explicit circle placement, original conditions accessible');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
