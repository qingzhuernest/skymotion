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
  function updateChoices(root=document) {
    const sync=(group)=>{
      const all=[...group.children].filter(n=>n.matches('button,a'));
      const visible=all.filter(n=>!n.hidden);
      for(const child of all){
        const edge=visible.length===1&&child===visible[0]?'only':child===visible[0]?'first':child===visible.at(-1)?'last':'middle';
        if(child.dataset.choiceEdge!==edge)child.dataset.choiceEdge=edge;
      }
    };
    if(root.matches?.('.md-connected-choice'))sync(root);
    root.querySelectorAll?.('.md-connected-choice').forEach(sync);
  }
  window.SkyMaterial = Object.freeze({ updateRange, updateRanges, updateChoices });
  // Native pointer and keyboard input keep their own behavior.
  document.addEventListener('input', (event) => updateRange(event.target), true);
  document.addEventListener('change', (event) => updateRange(event.target), true);
  function install() {
    updateRanges();
    updateChoices();
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes') { updateRange(record.target);const group=record.target.closest('.md-connected-choice');if(group)updateChoices(group); }
        else
          for (const node of record.addedNodes) {
            if (
              node.nodeType !== 1 ||
              node.namespaceURI !== 'http://www.w3.org/1999/xhtml'
            )
              continue;
            updateRange(node);
            updateRanges(node);
            updateChoices(node);
          }
      }
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['min', 'max', 'value', 'type', 'hidden', 'class'],
    });
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
