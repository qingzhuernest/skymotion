/** UI roles have one definition; real controls follow the shared green in every mode. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const shared=['design-system.css','controls.css','diagram-tools.css','custom-layout.css','documents.css','language.css','interface-motion.css','solar-study.css','scene-builder.css',...fs.readdirSync(path.join(root,'space')).filter(n=>n.endsWith('.css')).map(n=>'space/'+n)];
for(const file of shared){const css=fs.readFileSync(path.join(root,file),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/url\([^)]*\)/g,'');assert(!/#[\da-f]{3,8}\b|\brgba?\s*\(/i.test(css),file+' defines a color instead of consuming ui-palette.css');}
for(const file of fs.readdirSync(root).filter(n=>n.endsWith('.css')&&n!=='ui-palette.css'))assert(!/#(?:315da8|244b8f|eaf0fc|dbe7fc|e1edff|dceaff)\b/i.test(fs.readFileSync(path.join(root,file),'utf8')),file+' reintroduces a legacy UI blue');
const sources=fs.readdirSync(root).filter(n=>n.endsWith('.html')).concat(['space/index.html','space/index.en.html','lunar/index.html','lunar/index.en.html']);
for(const file of sources){const html=fs.readFileSync(path.join(root,file),'utf8'),first=html.match(/<link\b[^>]*rel="stylesheet"[^>]*>/)?.[0];if(!first)continue;assert(first.includes('ui-palette.css'),file+' must load shared colors before components');}
console.log('PASS shared UI and 3D styles consume one palette; no legacy blue control definitions');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8999/').replace(/\/?$/,'/');
(async()=>{const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 for(const [route,width,touch]of [['lab.html',1280,false],['diagrams.en.html',960,true],['analemma.html',390,true],['space/index.en.html',1280,false]]){
  const page=await browser.newPage({viewport:{width,height:960},hasTouch:touch,isMobile:width<600}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+route);await page.waitForFunction(()=>window.SkyCustomization&&!document.querySelector('.layout-launch').disabled);await page.locator('.layout-launch').click();
  await require('./diagram-test-helpers.cjs').openWorkbench(page);await page.locator('.dt-panel').waitFor({state:'visible'});
  const dimensions=await page.locator('.dt-panel').evaluate(panel=>({header:panel.querySelector('.dt-scroll').getBoundingClientRect().top-panel.getBoundingClientRect().top,width:panel.clientWidth,scroll:panel.scrollWidth}));
  assert(dimensions.header<=(touch?124:100),route+' editor chrome consumes too much vertical space: '+dimensions.header);assert(dimensions.scroll<=dimensions.width+1,route+' editor toolbar overflows');
  assert(await page.locator('.dt-head .dt-help-toggle').isVisible());assert.equal(await page.locator('.dt-history button').count(),2);
  await page.locator('.dt-help-toggle').click();assert.equal(await page.locator('.dt-help-toggle').getAttribute('aria-expanded'),'true');assert(await page.locator('.dt-hint').isVisible());await page.locator('.dt-help-toggle').click();
  assert.equal(await page.locator('.layout-launch').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(36, 87, 107)');
  // A temporary probe proves callers use the role, rather than matching its current literal.
  await page.evaluate(()=>document.documentElement.style.setProperty('--design-accent','rgb(101, 61, 83)'));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.layout-launch')).backgroundColor==='rgb(101, 61, 83)');
  if(route.startsWith('space/')){await page.locator('#spaceImmersive').click();await page.waitForFunction(()=>document.querySelector('.head-actions .language-actions'));assert.equal(await page.locator('.layout-launch').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(101, 61, 83)');}
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.close();
 }
 console.log('PASS compact editor headers, reachable history/help, and shared accent propagation on desktop, tablet, phone and immersive 3D');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
