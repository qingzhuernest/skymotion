/** Verify recovery assets at root and GitHub project paths, including nested 404 URLs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const{execFileSync}=require('node:child_process');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'skymotion-deploy-'));
try{
  for(const base of ['', '/skymotion']){
    const output=path.join(root,base?'github':'cloudflare');
    execFileSync('python3',['.github/scripts/prepare_site.py','--output',output,'--base-path',base]);
    const manifest=JSON.parse(fs.readFileSync(path.join(output,'page-cache-manifest.json'),'utf8'));
    for(const file of [...manifest.pages,...manifest.assets])assert(fs.existsSync(path.join(output,file)),`Missing packaged asset ${file}`);
    for(const name of ['404.html','404.en.html']){
      const source=fs.readFileSync(path.join(output,name),'utf8');
      for(const match of source.matchAll(/(?:href|src)="([^"]+)"/g)){
        const url=new URL(match[1],`https://example.test${base}/unknown/nested/`);
        if(url.origin!=='https://example.test')continue;
        assert(url.pathname.startsWith(base+'/'),`${name}: escaped project path ${url.pathname}`);
        const file=url.pathname.slice(base.length+1)||'index.html';
        assert(fs.existsSync(path.join(output,file)),`${name}: missing recovery path ${file}`);
      }
    }
    console.log('PASS packaged preload manifest and both nested recovery pages',base||'/');
  }
}finally{fs.rmSync(root,{recursive:true,force:true})}
