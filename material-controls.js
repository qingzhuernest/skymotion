/** Material 3 Expressive presentation. Never writes experiment values or handles gestures. */
(() => {
  const painted = new WeakMap();
  function updateRange(input) {
    if (!input?.matches?.('input[type="range"]')) return;
    const min = input.min === '' ? 0 : Number(input.min);
    const max = input.max === '' ? 100 : Number(input.max);
    const value = Number(input.value);
    const fraction =
      max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
    const percent = `${Math.round(fraction * 10000) / 100}%`;
    if (painted.get(input) === percent) return;
    input.style.setProperty('--md-range-progress', percent);
    painted.set(input, percent);
  }
  function updateRanges(root = document) {
    root.querySelectorAll('input[type="range"]').forEach(updateRange);
  }
  window.SkyMaterial = Object.freeze({ updateRange, updateRanges });
  // Native pointer and keyboard input keep their own behavior.
  document.addEventListener('input', (event) => updateRange(event.target), true);
  document.addEventListener('change', (event) => updateRange(event.target), true);
  function install() {
    updateRanges();
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes') updateRange(record.target);
        else
          for (const node of record.addedNodes) {
            if (
              node.nodeType !== 1 ||
              node.namespaceURI !== 'http://www.w3.org/1999/xhtml'
            )
              continue;
            updateRange(node);
            updateRanges(node);
          }
      }
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['min', 'max', 'value', 'type'],
    });
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
