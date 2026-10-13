/** Preload every static page and its shared assets without running hidden scenes. */
(() => {
  if (document.body?.dataset.embedded === 'true') return;
  const base = new URL('.', document.currentScript.src);
  const status = window.skyPageCache = { state: 'waiting', completed: 0, total: 0, failed: [] };
  window.skyPageCacheReady = (async () => {
    try {
      if (window.skyFirstFontsReady) await window.skyFirstFontsReady;
      if (document.readyState !== 'complete') await new Promise(resolve => addEventListener('load',resolve,{once:true}));
      await new Promise(resolve => (window.requestIdleCallback || (fn => setTimeout(fn, 100)))(resolve, { timeout: 500 }));
      status.state = 'loading';
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
            const assetUrl = new URL(file, base);
            if (/\.(js|css)$/.test(file) && manifest.resourceVersion) assetUrl.searchParams.set('v', manifest.resourceVersion);
            const result = await fetch(assetUrl, { cache: 'force-cache', credentials: 'same-origin', priority: 'low' });
            if (!result.ok) throw new Error(String(result.status));
            await result.arrayBuffer();
          } catch { status.failed.push(file); }
          status.completed++;
        }
      }
      await Promise.all(Array.from({ length: 2 }, worker));
      status.state = status.failed.length ? 'partial' : 'ready';
    } catch { status.state = 'failed'; }
    document.dispatchEvent(new CustomEvent('skymotion:preloaded', { detail: status }));
    return status;
  })();
})();
