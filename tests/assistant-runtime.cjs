/** Exercise asynchronous ownership and cache/retry contracts without downloading another model. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.SKY_MOTION_PLAYWRIGHT || 'playwright');
const base = (process.env.SKY_MOTION_TEST_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
async function workerQueueContract() {
  const fs = require('node:fs'),
    vm = require('node:vm'),
    crypto = require('node:crypto');
  const vectors = new Float32Array(1024);
  vectors[1] = 1;
  vectors[512] = -1;
  const bytes = Buffer.from(vectors.buffer),
    messages = [],
    calls = [];
  const metadata = {
    version: 'contract',
    records: ['source', 'source'],
    indexSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
  const sandbox = {
    URL,
    performance,
    Float32Array,
    Uint8Array,
    crypto: crypto.webcrypto,
    env: { backends: { onnx: { wasm: {} } } },
    pipeline: async () => async (query) => {
      calls.push(query);
      const data = new Float32Array(512);
      data[0] = 1;
      return { data };
    },
    fetch: async (url) => ({
      ok: true,
      json: async () => metadata,
      arrayBuffer: async () =>
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    }),
    self: {
      location: { href: 'https://example.test/assistant/worker.js' },
      postMessage: (message) => messages.push(message),
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(
    fs.readFileSync('scripts/assistant/worker-source.js', 'utf8').replace(/^import[^;]+;/, ''),
    sandbox,
  );
  for (const [id, query] of [
    [1, 'first'],
    [2, 'second'],
    [3, 'cancelled'],
  ])
    sandbox.self.onmessage({ data: { id, query, version: 'contract' } });
  sandbox.self.onmessage({ data: { type: 'cancel', id: 3 } });
  await vm.runInContext('queue', sandbox);
  assert.deepEqual(
    messages.filter((x) => x.type === 'result').map((x) => x.id),
    [1, 2],
    'Independent queued requests both finish',
  );
  assert(!calls.includes('cancelled'), 'Cancelled queued inference is skipped');
  for (const result of messages.filter((x) => x.type === 'result'))
    assert.equal(
      result.matches[0].score,
      0,
      'Zero best-chunk score is preserved over a negative chunk',
    );
}

(async () => {
  await workerQueueContract();
  const browser = await chromium.launch({
    executablePath: process.env.SKY_MOTION_CHROMIUM || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage(),
      errors = [];
    await page.route('**/assistant/ui.js*', (route) => route.abort());
    await page.route('**/page-cache-manifest.json', (route) => route.abort());
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base + '404.html');
    const result = await page.evaluate(async (base) => {
      const workers = [];
      window.Worker = class {
        constructor(url) {
          this.url = String(url);
          this.posts = [];
          workers.push(this);
        }
        postMessage(data) {
          this.posts.push(data);
        }
        terminate() {
          this.terminated = true;
        }
        emit(data) {
          this.onmessage({ data });
        }
      };
      const check = (condition, label) => {
        if (!condition) throw Error(label);
      };
      const until = async (condition) => {
        for (let i = 0; i < 100; i++) {
          if (condition()) return;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        throw Error('Timed out waiting for fake Worker');
      };
      const { createRuntime } = await import(base + 'assistant/runtime.js?v=runtime-contract');
      const client = createRuntime(base + 'assistant/ui.js?v=runtime-contract');
      const [first, second] = await Promise.all([client.load(), client.load()]);
      check(first === second, 'Load is shared');
      const warm1 = client.prepare(),
        warm2 = client.prepare();
      await until(() => workers.length === 1);
      const original = workers[0];
      check(original.posts.length === 1, 'Preparation posts once');
      check(original.url.endsWith('?v=runtime-contract'), 'Worker version follows UI');
      original.emit({ type: 'ready' });
      await Promise.all([warm1, warm2]);
      const controller = new AbortController();
      const old = client.semantic('old', { signal: controller.signal }).then(
        () => false,
        (error) => error.name === 'AbortError',
      );
      await until(() => original.posts.some((post) => post.query === 'old'));
      const oldId = original.posts.at(-1).id;
      controller.abort();
      check(await old, 'Superseded request aborts');
      const fresh = client.semantic('fresh');
      await until(() => original.posts.some((post) => post.query === 'fresh'));
      original.emit({ type: 'result', id: oldId, matches: [{ id: 'stale', score: 1 }] });
      original.emit({
        type: 'result',
        id: original.posts.at(-1).id,
        matches: [{ id: 'fresh', score: 0.9 }],
      });
      check((await fresh)[0].id === 'fresh', 'Stale result cannot finish a newer request');
      check(workers.length === 1, 'Abort retains warm model');
      const failed = client.semantic('failure').then(
        () => false,
        () => true,
      );
      await until(() => original.posts.some((post) => post.query === 'failure'));
      original.emit({ type: 'error', id: original.posts.at(-1).id, reason: 'network' });
      check(await failed, 'Failure rejects owner');
      check(original.terminated, 'Failed Worker terminates');
      const retry = client.prepare();
      await until(() => workers.length === 2);
      original.emit({ type: 'error', reason: 'late old error' });
      workers[1].emit({ type: 'ready' });
      await retry;
      check(!workers[1].terminated, 'Old generation cannot kill retry');
      client.dispose();
      const earlyController = new AbortController();
      const early = client.semantic('early', { signal: earlyController.signal }).then(
        () => false,
        (error) => error.name === 'AbortError',
      );
      await until(() => workers.length === 3);
      earlyController.abort();
      check(await early, 'Abort while preparing rejects promptly');
      workers[2].emit({ type: 'ready' });
      await client.prepare();
      check(workers.length === 3, 'Background preparation survives query abort');
      client.dispose();
      return { records: first.knowledge.records.length, workers: workers.length };
    }, base);
    assert.equal(result.records, 633);
    assert.equal(result.workers, 3);
    assert.deepEqual(errors, []);
    console.log(
      'PASS shared eager preparation, versioned Worker, abort before/after ready, stale result/error isolation, retry and disposal',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
