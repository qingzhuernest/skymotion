// Build only the assistant runtime. Scientific application scripts remain buildless.
import { build, transform } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { env, pipeline } from '@huggingface/transformers';
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = root + 'site/assistant/';
await mkdir(output + 'runtime', { recursive: true });
await build({
  entryPoints: [root + 'scripts/assistant/worker-source.js'],
  outfile: output + 'worker.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  supported: { 'template-literal': false },
  legalComments: 'external',
});
await cp(
  root + 'scripts/assistant/node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm',
  output + 'runtime/ort-wasm-simd-threaded.jsep.wasm',
);
const glue = await readFile(
  root + 'scripts/assistant/node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs',
  'utf8',
);
await writeFile(
  output + 'runtime/ort-wasm-simd-threaded.jsep.mjs',
  (
    await transform(glue, {
      format: 'esm',
      target: 'es2022',
      minify: true,
      supported: { 'template-literal': false },
    })
  ).code,
);
if (process.argv.includes('--runtime-only')) {
  const knowledge = JSON.parse(await readFile(output + 'knowledge-version.json', 'utf8'));
  const manifest = JSON.parse(await readFile(output + 'semantic-manifest.json', 'utf8'));
  const bytes = await readFile(output + 'index.bin');
  if (
    manifest.version !== knowledge.version ||
    manifest.indexSha256 !== createHash('sha256').update(bytes).digest('hex')
  )
    throw Error('Index/knowledge mismatch: run the full build');
  console.log('Worker bundled; verified existing knowledge/index version', knowledge.version);
  process.exit(0);
}
env.allowRemoteModels = false;
env.localModelPath = output + 'models/';
env.backends.onnx.wasm.numThreads = 1;
const knowledge = JSON.parse(await readFile(output + 'knowledge.json', 'utf8'));
const version = JSON.parse(await readFile(output + 'knowledge-version.json', 'utf8'));
const embed = await pipeline('feature-extraction', 'bge-small-zh-v1.5', {
  dtype: 'int8',
  device: 'cpu',
});
const documents = [];
for (const card of knowledge.records) {
  const prefix = [card.title, ...card.aliases.filter((x) => /\p{Script=Han}/u.test(x))]
    .join(' ')
    .slice(0, 140);
  const text = [card.answer, ...card.steps, card.fullText || ''].join('\n');
  for (let start = 0; start < text.length; start += 280)
    documents.push({ id: card.id, text: prefix + ' ' + text.slice(start, start + 320) });
}
const vectors = new Float32Array(documents.length * 512);
for (let i = 0; i < documents.length; i++) {
  const tensor = await embed(documents[i].text, {
    pooling: 'cls',
    normalize: true,
    truncation: true,
    max_length: 512,
  });
  if (tensor.data.length !== 512 || !tensor.data.every(Number.isFinite))
    throw Error('Invalid BGE output');
  vectors.set(tensor.data, i * 512);
  if (i % 100 === 0) console.log('Embedded', i, '/', documents.length);
}
const data = Buffer.from(vectors.buffer);
await writeFile(output + 'index.bin', data);
await writeFile(
  output + 'semantic-manifest.json',
  JSON.stringify(
    {
      version: version.version,
      dimensions: 512,
      records: documents.map((r) => r.id),
      knowledgeRecords: knowledge.records.length,
      documentChunkChars: 320,
      model: 'Xenova/bge-small-zh-v1.5',
      revision: '75c43b069aac4d136ba6bc1122f995fedcfd2781',
      dtype: 'int8',
      pooling: 'cls',
      normalize: true,
      queryPrefix: '',
      indexSha256: createHash('sha256').update(data).digest('hex'),
      transformers: '3.8.1',
    },
    null,
    2,
  ) + '\n',
);
await embed.dispose();
console.log('Assistant model and index ready:', vectors.length, 'floats');
