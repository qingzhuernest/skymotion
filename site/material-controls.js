/** Google Material Web presentation; native selects remain the experiment value owners. */
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
      const all=[...group.children].filter(n=>n.matches('button,a,md-filter-chip'));
      const visible=all.filter(n=>!n.hidden);
      for(const child of all){
        const edge=visible.length===1&&child===visible[0]?'only':child===visible[0]?'first':child===visible.at(-1)?'last':'middle';
        if(child.dataset.choiceEdge!==edge)child.dataset.choiceEdge=edge;
      }
    };
    if(root.matches?.('.md-connected-choice'))sync(root);
    root.querySelectorAll?.('.md-connected-choice').forEach(sync);
  }
  const choices = new WeakMap();
  const pending = new Set();let choiceTask=false,choiceSequence=0;
  function queueChoice(select) {
    if(!select?.matches?.('select'))return;
    pending.add(select);if(choiceTask)return;choiceTask=true;
    queueMicrotask(()=>{choiceTask=false;const batch=[...pending];pending.clear();for(const item of batch)enhanceChoices(item);});
  }
  function syncChoices(select) { choices.get(select)?.sync(); }
  // State owners commit values explicitly; native prototypes are never modified.
  function setValue(control, value) {
    if (control.value === String(value)) return;
    control.value = value;
    if (control.matches('select')) queueChoice(control);
  }
  function enhanceChoices(select) {
    if (!select?.matches?.('select')) return;
    if (choices.has(select)) { syncChoices(select); return; }
    const key = select.id || 'md-choice-' + (++choiceSequence);
    const field = document.createElement('span');
    field.className = 'md-choice-field';
    field.dataset.choiceFor = key;
    // A control gesture must not start a camera drag or a pane focus gesture.
    for (const type of ['pointerdown', 'dblclick']) field.addEventListener(type, event => event.stopPropagation());
    select.classList.add('md-choice-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    let signature = '', widget, buttons = [];
    function caption() {
      const label = select.labels?.[0] || select.parentElement?.querySelector('label');
      return select.getAttribute('aria-label') || (label ? [...label.childNodes]
        .filter(n => n !== select && n !== field && !n.contains?.(select) && !n.contains?.(field))
        .map(n => n.textContent).join(' ').trim() : '') ||
        (document.documentElement.lang === 'en' ? 'Choose an option' : '选择选项');
    }
    function commit(value) {
      if (select.disabled) return;
      setValue(select, value);
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function sync() {
      if (!select.isConnected) { widget?.close?.(); field.remove(); return; }
      if (select.nextElementSibling !== field) select.after(field);
      const options = [...select.options], long = options.filter(o => !o.hidden).length > 4;
      field.hidden = select.hidden || select.style.display === 'none' || !options.length;
      const next = JSON.stringify(options.map(o => [o.value, o.textContent, o.disabled, o.hidden]));
      if (signature !== next) {
        signature = next;
        widget?.close?.();
        widget = document.createElement(long ? 'md-outlined-select' : 'div');
        widget.className = long ? 'md-choice-select' : 'preference-choices md-choice-buttons md-connected-choice';
        if (long) {
          widget.menuPositioning = 'popover';
          widget.quick = document.documentElement.dataset.reducedMotion === 'true';
          widget.addEventListener('input', event => event.stopPropagation());
          widget.addEventListener('change', event => { event.stopPropagation(); commit(widget.value); });
        } else {
          widget.setAttribute('role', 'group');
          widget.dataset.choiceCount = options.length;
        }
        buttons = options.map(option => {
          const item = document.createElement(long ? 'md-select-option' : 'md-filter-chip');
          item.dataset.choiceValue = option.value;
          if (long) {
            item.value = option.value;
            const headline = document.createElement('span');
            headline.slot = 'headline'; headline.textContent = option.textContent;
            item.append(headline);
          } else {
            item.label = option.textContent;
            item.onclick = () => { if (!item.disabled) commit(option.value); };
            item.onkeydown = event => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault(); event.stopPropagation();
              const visible = buttons.filter(b => !b.hidden && !b.disabled), i = visible.indexOf(item);
              const target = event.key === 'Home' ? visible[0] : event.key === 'End' ? visible.at(-1) :
                visible[(i + (event.key === 'ArrowLeft' ? -1 : 1) + visible.length) % visible.length];
              if (target) { target.focus(); target.click(); }
            };
          }
          widget.append(item);
          return item;
        });
        field.replaceChildren(widget);
      }
      widget.setAttribute('aria-label', caption());
      buttons.forEach((item, index) => {
        const option = options[index];
        item.hidden = option.hidden;
        item.disabled = select.disabled || option.disabled || Boolean(option.closest('optgroup')?.disabled);
        if (long) item.selected = option.selected;
        else {
          item.selected = option.selected;
          item.tabIndex = option.selected ? 0 : -1;
        }
      });
      if (long) { widget.disabled = select.disabled; widget.value = select.value; }
      else updateChoices(widget);
    }
    select.addEventListener('change', sync);
    select.addEventListener('focus', () => {
      (widget?.matches('md-outlined-select') ? widget : buttons.find(b => b.selected))?.focus({ preventScroll: true });
    });
    choices.set(select, { sync });
    select.after(field); sync();
  }
  function enhanceAll(root=document){if(root.matches?.('select'))queueChoice(root);root.querySelectorAll?.('select').forEach(queueChoice);}
  document.addEventListener('skymotion:language',()=>enhanceAll());
  window.SkyMaterial=Object.freeze({setValue,updateRange,updateRanges,updateChoices,enhanceChoices,syncChoices});
  // Native pointer and keyboard input keep their own behavior.
  document.addEventListener('input', (event) => updateRange(event.target), true);
  document.addEventListener('change', (event) => updateRange(event.target), true);
  function install() {
    updateRanges();
    updateChoices();
    enhanceAll();
    new MutationObserver((records) => {
      for (const record of records) {
        if(record.target.nodeType===1&&record.target.closest('.md-choice-field'))continue;
        for(const removed of record.removedNodes){if(removed.nodeType===1){if(removed.matches('select'))queueChoice(removed);removed.querySelectorAll('select').forEach(queueChoice);}}
        const select=record.target.nodeType===1?record.target.closest('select'):record.target.parentElement?.closest('select');if(select)queueChoice(select);
        if (record.type === 'attributes') { updateRange(record.target);const group=record.target.closest('.md-connected-choice');if(group)updateChoices(group); }
        else
          for (const node of record.addedNodes) {
            if (
              node.nodeType !== 1 ||
              node.namespaceURI !== 'http://www.w3.org/1999/xhtml'
            )
              continue;
            enhanceAll(node);
            updateRange(node);
            updateRanges(node);
            updateChoices(node);
          }
      }
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['min', 'max', 'value', 'type', 'hidden', 'class', 'disabled', 'label', 'selected', 'aria-label'],
      characterData:true,
    });
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
