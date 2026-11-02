/** Own network versions and Worker lifetime; never touch DOM or scientific state. */
export function createRuntime(scriptUrl) {
  const entry = new URL(scriptUrl),
    base = new URL('.', entry);
  const asset = (name, versioned = false) => {
    const url = new URL(name, base);
    if (versioned) url.search = entry.search;
    return url;
  };
  let loadPromise,
    state,
    worker,
    readiness,
    preparationTimer,
    sequence = 0;
  const pending = new Map();

  async function json(name) {
    const response = await fetch(asset(name), { cache: 'no-cache' });
    if (!response.ok) throw Error('Unable to load ' + name);
    return response.json();
  }
  function load() {
    if (!loadPromise)
      loadPromise = Promise.all([
        json('knowledge.json'),
        json('knowledge-version.json'),
        import(asset('search.js', true).href),
      ])
        .then(([knowledge, version, search]) => {
          if (
            knowledge.schema !== 1 ||
            knowledge.version !== version.version ||
            !Array.isArray(knowledge.records) ||
            knowledge.records.length !== version.records ||
            new Set(knowledge.records.map((card) => card.id)).size !== version.records
          ) {
            throw Error('Knowledge version or record set mismatch');
          }
          state = { knowledge, search, engine: search.createSearch(knowledge.records) };
          return state;
        })
        .catch((error) => {
          loadPromise = null;
          throw error;
        });
    return loadPromise;
  }
  function stop(channel, error) {
    if (worker !== channel) return;
    worker = null;
    clearTimeout(preparationTimer);
    readiness?.reject(error);
    readiness = null;
    for (const request of [...pending.values()]) request.finish(null, error);
    channel?.terminate();
  }
  function start() {
    if (readiness) return readiness.promise;
    let resolve, reject;
    const promise = new Promise((accept, decline) => {
      resolve = accept;
      reject = decline;
    });
    readiness = { promise, resolve, reject };
    let channel;
    try {
      channel = new Worker(asset('worker.js', true), { type: 'module' });
      worker = channel;
      preparationTimer = setTimeout(() => stop(channel, Error('Preparation timeout')), 120000);
      channel.onmessage = ({ data }) => {
        if (worker !== channel) return;
        if (data.type === 'ready') {
          clearTimeout(preparationTimer);
          readiness.resolve();
        } else if (data.type === 'error') stop(channel, Error(data.reason || 'Model unavailable'));
        else if (data.type === 'result') pending.get(data.id)?.finish(data.matches);
      };
      channel.onerror = (event) => {
        event.preventDefault?.();
        stop(channel, Error('Worker unavailable'));
      };
      channel.postMessage({ type: 'prepare', version: state.knowledge.version });
    } catch (error) {
      clearTimeout(preparationTimer);
      readiness = null;
      worker = null;
      channel?.terminate();
      reject(error);
    }
    return promise;
  }
  async function prepare() {
    await load();
    return start();
  }
  function abortError() {
    return new DOMException('Search superseded', 'AbortError');
  }
  function wait(promise, signal) {
    if (!signal) return promise;
    return new Promise((resolve, reject) => {
      const finish = (value, error) => {
        signal.removeEventListener('abort', abort);
        error ? reject(error) : resolve(value);
      };
      const abort = () => finish(null, abortError());
      signal.addEventListener('abort', abort, { once: true });
      promise.then(
        (value) => finish(value),
        (error) => finish(null, error),
      );
      if (signal.aborted) abort();
    });
  }
  async function semantic(query, { signal } = {}) {
    if (typeof query !== 'string' || !query.trim()) throw TypeError('Expected a nonempty query');
    if (signal?.aborted) throw abortError();
    await wait(prepare(), signal);
    if (signal?.aborted) throw abortError();
    const channel = worker,
      id = ++sequence;
    if (!channel) throw Error('Search is no longer prepared');
    return new Promise((resolve, reject) => {
      const finish = (value, error) => {
        if (!pending.has(id)) return;
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        pending.delete(id);
        error ? reject(error) : resolve(value);
      };
      const abort = () => {
        channel.postMessage({ type: 'cancel', id });
        finish(null, abortError());
      };
      const timer = setTimeout(() => stop(channel, Error('Inference timeout')), 90000);
      pending.set(id, { finish });
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
      else {
        try {
          channel.postMessage({ id, query, version: state.knowledge.version });
        } catch (error) {
          finish(null, error);
        }
      }
    });
  }
  return {
    load,
    prepare,
    semantic,
    dispose: () => {
      if (worker) stop(worker, Error('Search disposed'));
    },
  };
}
