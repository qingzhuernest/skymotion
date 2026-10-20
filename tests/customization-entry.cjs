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
   await p.locator('.layout-launch').click();
   await p.locator('.diagram-tool-launch:visible').waitFor();
   await p.locator('#spaceImmersive').click();
   await p.waitForFunction(()=>document.querySelector('.head-actions .language-actions'));
   assert(await p.locator('.layout-launch').isVisible());
   assert(await p.locator('.language-toggle').isVisible());
   await p.locator('.diagram-tool-launch:visible').click();
   await p.locator('.dt-panel').waitFor({state:'visible'});
   assert(await p.locator('.layout-launch').isVisible());
   await p.locator('.layout-launch').click();
   assert.equal(await p.evaluate(()=>SkyCustomization.active),false);
   assert.equal(await p.locator('.dt-panel').isVisible(),false);
   assert.equal(await p.locator('.diagram-tool-launch:visible').count(),0);
   await p.locator('#spaceImmersive').click();
   await p.waitForFunction(()=>document.querySelector('.language-nav > .language-actions'));
   assert(await p.locator('.layout-launch').isVisible());
   await p.goto(base+'lab'+(mobile?'.en':'')+'.html',{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.SkyLabComparison && !document.querySelector('.layout-launch').disabled);
   await p.locator('.layout-launch').click();
   if(mobile) await p.locator('#uiParametersButton').click();
   assert.equal(await p.evaluate(()=>document.querySelector('#controls .section-head').nextElementSibling.id),'labComparisons');
   assert.equal(await p.evaluate(()=>SkyDiagramTools.read('lab-sky').length),0,'entering customization must not invent any objects');
   assert.match(await p.locator('#labComparisons').innerText(),mobile?/One place · different times/:/同一地点 · 不同时间/);
   await p.locator('[data-comparison-action=build]').click();
   await p.waitForFunction(()=>window.SkySceneBuilder?.read() && document.body.classList.contains('scene-builder-active'));
   assert.equal(await p.evaluate(()=>SkySceneBuilder.read().objects.length),0,'new ground starts empty, without an unexplained example circle');
   await p.locator('.sb-add').waitFor({state:'visible'});
   if(mobile) await p.locator('#uiDrawerClose').click();
   await p.locator('button[data-body=moon]').click();
   await p.waitForFunction(()=>state.body==='moon');
   if(!mobile) await p.locator('[data-rail-section=conditions]').click();
   if(mobile) await p.locator('#uiParametersButton').click();
   await p.locator('[data-comparison-action=build]').click();
   await p.waitForFunction(()=>document.body.classList.contains('scene-builder-active') && SkySceneBuilder.read()?.objects.length===0);
   assert.deepEqual(await p.locator('#builderGround').evaluate(n=>[...n.getContext('2d').getImageData(0,0,1,1).data]),[19,36,56,255],'builder uses the same background as the original diagram');
   await p.locator('.sb-add [data-object-kind=circle]').click();
   await p.locator('#builderGround').focus();await p.keyboard.press('Enter');
   assert.equal(await p.evaluate(()=>SkySceneBuilder.read().objects.length),1);
   assert.equal(await p.evaluate(()=>SkySceneBuilder.read().objects[0].kind),'circle');
   if(!mobile){
    await p.locator('[data-rail-section=conditions]').click();assert(await p.locator('#place').isVisible());
    await p.locator('[data-rail-section=references]').click();assert(await p.locator('.sb-add').isVisible());
   }
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS persistent 3D customization entry in normal/immersive desktop and phone, explicit mode gate, native Lab comparisons, no invented references, empty solar and lunar builders, matching plot palette and explicit circle placement, original conditions accessible');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
