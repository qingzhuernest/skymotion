const assert=require('node:assert/strict');
const{chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(/^\/(?:lab|diagrams)(?:\.en)?\.html$/.test(url.pathname)){res.writeHead(307,{location:url.pathname.replace(/\.html$/,'')});res.end();return;}const clean=/^\/(?:lab|diagrams)(?:\.en)?$/.test(url.pathname)?url.pathname+'.html':url.pathname;const file=path.resolve(root,'.'+clean);if(!file.startsWith(root+path.sep))throw Error();const data=await fs.readFile(file),mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'};res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';const browser=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--use-angle=swiftshader']});try{
 for(const suffix of['','.en']){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base+'lab'+suffix+'.html');assert(response.request().redirectedFrom(),'real server redirect precedes the page');await page.waitForFunction(()=>window.SkyCustomization&&!document.querySelector('.layout-launch').disabled);assert.equal(new URL(page.url()).pathname.replace(/\.html$/,''),'/lab'+suffix);
  await page.locator('.layout-launch').click();if(await page.locator('.diagram-tool-launch:visible').count())await page.locator('.diagram-tool-launch:visible').click();await require('./diagram-test-helpers.cjs').addTool(page,'observer');
  await page.locator('.page-nav a[href*="diagrams"]').click();await page.waitForFunction(()=>window.SkyCustomization?.active===true&&window.SkyObserverComparison?.sites().length===1);assert.equal(new URL(page.url()).pathname.replace(/\.html$/,''),'/diagrams'+suffix);
  await page.reload();await page.waitForFunction(()=>!!window.SkyCustomization);assert.equal(await page.evaluate(()=>SkyCustomization.active),false);
  await page.locator('.page-nav a[href*="lab"]').click();await page.waitForFunction(()=>!!window.SkyCustomization);assert.equal(await page.evaluate(()=>SkyCustomization.active),false);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS Chinese/English clean-URL redirects preserve one-use editing intent and city drafts; refresh and normal navigation remain normal');
 }finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}})().catch(e=>{console.error(e);process.exitCode=1;});
