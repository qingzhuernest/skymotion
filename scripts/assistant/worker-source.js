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
    fetch(new URL('semantic-manifest.json', base), { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw Error('manifest');
      return r.json();
    }),
    fetch(new URL('index.bin', base), { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw Error('index');
      return r.arrayBuffer();
    }),
  ]);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), (v) =>
    v.toString(16).padStart(2, '0'),
  ).join('');
  if (digest !== metadata.indexSha256 || data.byteLength !== metadata.records.length * 512 * 4)
    throw Error('index mismatch');
  const embed = await pipeline('feature-extraction', 'bge-small-zh-v1.5', {
    dtype: 'int8',
    device: 'wasm',
    progress_callback: (event) => {
      if (event.status === 'progress')
        self.postMessage({ type: 'progress', progress: event.progress });
    },
  });
  // Compile and run once now, before the visitor submits a query.
  await embed('太阳', { pooling: 'cls', normalize: true });
  return { metadata, vectors: new Float32Array(data), embed };
}
// One queue prevents concurrent inference. The UI discards obsolete request IDs.
let queue = Promise.resolve();
const active = new Set(),
  cancelled = new Set();
self.onmessage = ({ data }) => {
  if (data.type === 'cancel') {
    if (active.has(data.id)) cancelled.add(data.id);
    return;
  }
  if (data.type !== 'prepare') active.add(data.id);
  queue = queue.then(async () => {
    try {
      if (cancelled.has(data.id)) return;
      session ||= load();
      const { metadata, vectors, embed } = await session;
      if (metadata.version !== data.version) throw Error('knowledge version mismatch');
      if (data.type === 'prepare') {
        self.postMessage({ type: 'ready' });
        return;
      }
      if (cancelled.has(data.id)) return;
      const start = performance.now();
      const tensor = await embed(data.query.slice(0, 500), { pooling: 'cls', normalize: true });
      if (tensor.data.length !== 512) throw Error('embedding dimensions');
      const scores = new Map();
      metadata.records.forEach((id, i) => {
        let score = 0;
        for (let d = 0; d < 512; d++) score += tensor.data[d] * vectors[i * 512 + d];
        scores.set(id, Math.max(scores.get(id) ?? -Infinity, score));
      });
      const matches = Array.from(scores, ([id, score]) => ({ id, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);
      if (cancelled.has(data.id)) return;
      self.postMessage({ type: 'result', id: data.id, matches, ms: performance.now() - start });
    } catch (error) {
      if (cancelled.has(data.id)) return;
      session = null;
      self.postMessage({
        type: 'error',
        id: data.id,
        reason: String(error?.message || error).slice(0, 240),
      });
    } finally {
      active.delete(data.id);
      cancelled.delete(data.id);
    }
  });
};
