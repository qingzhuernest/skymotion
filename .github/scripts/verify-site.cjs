/** Run every repository regression against one disposable local server. */
const fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8000','--bind','127.0.0.1'],{stdio:'ignore'});
 const cleanup=()=>{if(server.exitCode===null)server.kill()};
 process.on('SIGTERM',()=>{cleanup();process.exit(143)});process.on('SIGINT',()=>{cleanup();process.exit(130)});
 try{
  let ready=false;
  for(let attempt=0;attempt<50;attempt++){
   if(server.exitCode!==null)throw Error('Test server could not start');
   try{const response=await fetch('http://127.0.0.1:8000/');ready=response.ok;if(ready)break}catch{}
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!ready)throw Error('Test server did not become ready');
  const env={...process.env,SKY_MOTION_TEST_URL:'http://127.0.0.1:8000/'};
  for(const file of fs.readdirSync('tests').filter(name=>name.endsWith('.cjs')).sort()){
   console.log(`Running ${file}`);
   const result=spawnSync(process.execPath,[path.join('tests',file)],{env,stdio:'inherit',timeout:300000});
   if(result.error)throw result.error;
   if(result.status!==0)throw Error(`${file} failed (${result.status ?? result.signal})`);
  }
 }finally{cleanup()}
})().catch(error=>{console.error(error.message);process.exitCode=1});
