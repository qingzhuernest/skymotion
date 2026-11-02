/** Real surface assets, resilient rendering and unchanged ephemerides in desktop/mobile views. */
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
(async()=>{
 const sources=JSON.parse(fs.readFileSync('site/space/textures/sources.json'));
 assert.equal(sources.license,'CC BY 4.0');assert.equal(sources.files.length,9);
 for(const file of sources.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync('site/space/textures/'+file.file)).digest('hex'),file.sha256,file.file);
 const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],shaderErrors=[],loaded=new Set();
  await page.route('**/assistant/**',r=>r.abort());await page.route('**/page-cache-manifest.json',r=>r.abort());
  page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error'&&/WebGLProgram|VALIDATE_STATUS|shader error/i.test(message.text()))shaderErrors.push(message.text());});
  page.on('response',response=>{if(response.url().includes('/space/textures/')&&response.status()===200)loaded.add(response.url().split('/').pop());});
  await page.goto(base+'space/');await page.waitForFunction(()=>typeof spaceState==='function');
  await page.waitForFunction(()=>!spaceState().scheduled);
  assert.equal(loaded.size,9,'All nine real texture assets load during initialization');
  const original=await page.evaluate(()=>JSON.stringify(spaceState().ephemeris));
  const focus=async value=>{await page.locator('#inspectBody').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));},value);await page.waitForFunction(()=>!spaceState().scheduled);};
  for(const value of ['0','1','2','3','4','5','6','7','moon']){
   await focus(value);assert((await page.evaluate(()=>spaceState().frames))>0);
   assert.equal(await page.evaluate(()=>JSON.stringify(spaceState().ephemeris)),original,'Changing appearance never changes physical vectors or date');
  }
  for(const value of ['4','5']){await page.setViewportSize({width:390,height:844});await focus(value);await page.locator('#stage').screenshot({path:'/tmp/space-after-mobile-'+value+'.png'});}
  assert.deepEqual(errors,[]);assert.deepEqual(shaderErrors,[]);
  const fallback=await browser.newPage();await fallback.route('**/space/textures/jupiter.jpg',r=>r.abort());await fallback.route('**/assistant/**',r=>r.abort());
  await fallback.goto(base+'space/');await fallback.waitForFunction(()=>typeof spaceState==='function');
  await fallback.locator('#inspectBody').evaluate(el=>{el.value='4';el.dispatchEvent(new Event('change',{bubbles:true}));});
  await fallback.waitForFunction(()=>!spaceState().scheduled);assert((await fallback.evaluate(()=>spaceState().frames))>0,'A failed image leaves a usable 3D model');
  console.log('PASS nine licensed image hashes and real requests, eight planets plus Moon, desktop/mobile shaders, invariant ephemerides, failed-image fallback');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
