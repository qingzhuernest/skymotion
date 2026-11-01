// Build only the assistant runtime. Scientific application scripts remain buildless.
import { build, transform } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { env, pipeline } from '@huggingface/transformers';
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = root + 'site/assistant/';
await mkdir(output + 'runtime', { recursive: true });
await build({ entryPoints:[root + 'scripts/assistant/worker-source.js'], outfile:output+'worker.js',
  bundle:true, format:'esm', platform:'browser', target:'es2022', minify:true,
  supported:{'template-literal':false},legalComments:'external' });
await cp(root+'scripts/assistant/node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm',
  output+'runtime/ort-wasm-simd-threaded.jsep.wasm');
const glue = await readFile(root+'scripts/assistant/node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs','utf8');
await writeFile(output+'runtime/ort-wasm-simd-threaded.jsep.mjs',(await transform(glue,{
  format:'esm',target:'es2022',minify:true,supported:{'template-literal':false}
})).code);
env.allowRemoteModels = false;
env.localModelPath = output + 'models/';
env.backends.onnx.wasm.numThreads = 1;
const knowledge = JSON.parse(await readFile(output+'knowledge.json','utf8'));
const version = JSON.parse(await readFile(output+'knowledge-version.json','utf8'));
const embed = await pipeline('feature-extraction','bge-small-zh-v1.5',{dtype:'int8',device:'cpu'});
const vectors = new Float32Array(knowledge.records.length * 512);
for (let i = 0; i < knowledge.records.length; i++) {
  const card = knowledge.records[i];
  const document = [card.title,...card.aliases.filter(x=>/\p{Script=Han}/u.test(x)),card.answer].join(' ');
  const tensor = await embed(document,{pooling:'cls',normalize:true});
  if (tensor.data.length !== 512 || !tensor.data.every(Number.isFinite)) throw Error('Invalid BGE output');
  vectors.set(tensor.data,i*512);
  if (i%100===0) console.log('Embedded',i,'/',knowledge.records.length);
}
const data = Buffer.from(vectors.buffer);
await writeFile(output+'index.bin',data);
await writeFile(output+'semantic-manifest.json',JSON.stringify({
  version:version.version, dimensions:512, records:knowledge.records.map(r=>r.id),
  model:'Xenova/bge-small-zh-v1.5',revision:'75c43b069aac4d136ba6bc1122f995fedcfd2781',
  dtype:'int8',pooling:'cls',normalize:true,queryPrefix:'',
  indexSha256:createHash('sha256').update(data).digest('hex'),
  transformers:'3.8.1'
},null,2)+'\n');
await embed.dispose();
console.log('Assistant model and index ready:',vectors.length,'floats');
