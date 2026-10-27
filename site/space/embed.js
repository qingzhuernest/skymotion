/** Embedded renderer mode: the original diagrams page supplies the only scientific clock. */
(() => {
  const enabled = new URLSearchParams(location.search).get('embed') === '1';
  window.spaceEmbedding = { enabled };
  if (!enabled) return;
  document.body.dataset.embedded = 'true';
  const status = document.createElement('p');
  status.className = 'space-embed-status';
  status.setAttribute('role', 'status');
  status.textContent = '正在同步观测时刻…';
  document.body.append(status);
  window.addEventListener('space:unavailable', () => {
    document.body.dataset.synchronized = 'true';
    status.remove();
  });
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    if (event.data?.type !== 'skymotion:sync') return;
    if (window.SolarSpaceView?.sync(event.data)) {
      // Reveal after the requested render, never show a different default date during loading.
      requestAnimationFrame(() => {
        document.body.dataset.synchronized = 'true';
        status.remove();
      });
    }
  });
  window.addEventListener('space:ready', () => {
    window.parent.postMessage({ type: 'skymotion:ready' }, location.origin);
  });
})();
