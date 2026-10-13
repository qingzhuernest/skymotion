/** Preload every static page and its shared assets without running hidden scenes. */
(() => {
  if (document.body?.dataset.embedded === 'true') return;
  const base = new URL('.', document.currentScript.src);
  const status = window.skyPageCache = { state: 'loading', completed: 0, total: 0, failed: [] };
  window.skyPageCacheReady = (async () => {
    try {
      const response = await fetch(new URL('page-cache-manifest.json', base), { cache: 'no-cache', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Preload manifest unavailable');
      const manifest = await response.json();
      const files = [...new Set([...manifest.pages, ...(manifest.assets || [])])];
      status.total = files.length;
      let cursor = 0;
      async function worker() {
        while (cursor < files.length) {
          const file = files[cursor++];
          try {
            const result = await fetch(new URL(file, base), { cache: 'force-cache', credentials: 'same-origin', priority: 'low' });
            if (!result.ok) throw new Error(String(result.status));
            await result.arrayBuffer();
          } catch { status.failed.push(file); }
          status.completed++;
        }
      }
      await Promise.all(Array.from({ length: 4 }, worker));
      status.state = status.failed.length ? 'partial' : 'ready';
    } catch { status.state = 'failed'; }
    document.dispatchEvent(new CustomEvent('skymotion:preloaded', { detail: status }));
    return status;
  })();
})();
