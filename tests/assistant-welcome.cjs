const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 try{
  for(const route of ['index.html','index.en.html']){
   const page=await browser.newPage({viewport:{width:960,height:1280}});await page.goto(base+route);
   await page.waitForSelector('html[data-fonts-ready]');
   await page.locator('#welcomeSky').click({position:{x:480,y:640}});
   await page.waitForFunction(()=>!document.documentElement.classList.contains('welcome-opening'));
   await page.locator('.welcome-corner-links .assistant-launch').waitFor();
   assert.equal(await page.locator('.welcome-brand .preferences-launch,.welcome-brand .assistant-launch').count(),0);
   for(const width of [960,390]){
    await page.setViewportSize({width,height:width===390?844:1280});
    const controls=await page.locator('.welcome-corner-links').evaluate(group=>[...group.querySelectorAll('a,button')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,font:s.fontFamily,color:s.color,bg:s.backgroundColor,radius:s.borderRadius};}));
    assert.equal(controls.length,5);
    for(const control of controls){assert(control.x>=0&&control.right<=width+1);assert(control.bottom<=(width===390?844:1280));assert.equal(control.font,controls[0].font);assert.equal(control.color,controls[0].color);assert.equal(control.bg,controls[0].bg);assert.equal(control.radius,controls[0].radius);assert.equal(control.width,controls[0].width);}
    await page.screenshot({path:'/tmp/assistant142-welcome-'+route+'-'+width+'.png'});
   }
   await page.locator('.welcome-corner-links .assistant-launch').click();await page.waitForFunction(()=>document.querySelector('.assistant-dialog').open);await page.keyboard.press('Escape');
   await page.locator('.welcome-corner-links .preferences-launch').click();await page.waitForFunction(()=>document.querySelector('.preferences-dialog')?.open);await page.keyboard.press('Escape');
   await page.close();
  }
  console.log('PASS welcome Assistant and Settings join original three links, with matching geometry/font/colors; desktop/mobile bilingual; both dialogs work');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
