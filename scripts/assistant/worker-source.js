import { env, pipeline } from '@huggingface/transformers';
const base = new URL('.', self.location.href);
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = new URL('models/', base).href;
env.backends.onnx.wasm.wasmPaths = new URL('runtime/', base).href;
env.backends.onnx.wasm.numThreads = 1;
let session;
async function load() {
  const [metadata, data] = await Promise.all([
    fetch(new URL('semantic-manifest.json', base)).then(r=>{if(!r.ok)throw Error('manifest');return r.json();}),
    fetch(new URL('index.bin', base)).then(r=>{if(!r.ok)throw Error('index');return r.arrayBuffer();})
  ]);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
  if (digest !== metadata.indexSha256 || data.byteLength !== metadata.records.length*512*4) throw Error('index mismatch');
  const embed = await pipeline('feature-extraction','bge-small-zh-v1.5', {dtype:'int8',device:'wasm',
    progress_callback:event=>{if(event.status==='progress')self.postMessage({type:'progress',progress:event.progress});}
  });
  return {metadata,vectors:new Float32Array(data),embed};
}
// One queue prevents concurrent inference. The UI discards obsolete request IDs.
let queue = Promise.resolve();
self.onmessage = ({data}) => {
  queue = queue.then(async()=>{
    try {
      session ||= load();
      const {metadata,vectors,embed} = await session;
      if(metadata.version !== data.version) throw Error('knowledge version mismatch');
      const start = performance.now();
      const tensor = await embed(data.query.slice(0,500),{pooling:'cls',normalize:true});
      if(tensor.data.length!==512)throw Error('embedding dimensions');
      const matches = metadata.records.map((id,i)=>{
        let score=0;for(let d=0;d<512;d++)score+=tensor.data[d]*vectors[i*512+d];
        return {id,score};
      }).sort((a,b)=>b.score-a.score).slice(0,5);
      self.postMessage({type:'result',id:data.id,matches,ms:performance.now()-start});
    }catch(error){session=null;self.postMessage({type:'error',id:data.id,reason:String(error?.message||error).slice(0,240)});}
  });
};
