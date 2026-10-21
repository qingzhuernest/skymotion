const {addTool}=require('./diagram-test-helpers.cjs');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.SKY_MOTION_PLAYWRIGHT||'playwright');
const base=(process.env.SKY_MOTION_TEST_URL||'http://127.0.0.1:8974/').replace(/\/?$/,'/');
(async()=>{const b=await chromium.launch({executablePath:process.env.SKY_MOTION_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--use-angle=swiftshader']});const errors=[];try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'space/index.en.html');await require('./diagram-test-helpers.cjs').enterCustomization(p);await require('./diagram-test-helpers.cjs').openWorkbench(p);await addTool(p,'note');await p.keyboard.press('Enter');
 const canvas=p.locator('#stage canvas:not(.dt-overlay)').first(),r=await canvas.boundingBox();
 const labels=await p.locator('#stage button.label').evaluateAll(nodes=>nodes.map((n,index)=>({index,text:n.textContent,r:n.getBoundingClientRect().toJSON()})).filter(v=>v.index<8&&v.index!==2&&v.r.width&&v.r.y>220&&v.r.y<500));assert(labels.length);
 const label=labels[0],x=label.r.x+label.r.width/2,y=label.r.y+label.r.height/2;
 for(const [key,value]of [['x',(x-r.x)/r.width*100],['y',(y-r.y)/r.height*100]]){await p.locator(`[data-field="${key}"]`).fill(String(value));await p.locator(`[data-field="${key}"]`).press('Tab');}
 await p.locator('.dt-collapse').click();assert.equal(await p.evaluate(({x,y})=>document.elementFromPoint(x,y).matches('button.label'),{x,y}),true);
 const before=await p.evaluate(()=>({reference:SkyDiagramTools.read('solar-system')[0],camera:SolarSpaceView.readSelection()})),cdp=await p.context().newCDPSession(p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+32,y:y-18,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const after=await p.evaluate(()=>({reference:SkyDiagramTools.read('solar-system')[0],camera:SolarSpaceView.readSelection()}));assert.notDeepEqual(after.reference,before.reference);assert.deepEqual(after.camera,before.camera);
 // Closing the editor restores the same planet label's native action.
 await p.locator('.dt-head button').last().click();await p.locator('#stage button.label').filter({hasText:new RegExp('^'+label.text+'$')}).click();await p.waitForFunction(i=>SolarSpaceView.readSelection().selected===i,label.index);
 await p.close();assert.deepEqual(errors,[]);console.log('PASS annotation drag over a real planet button, unchanged camera/selection, native planet action after closing editor');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
