/** Shared Material 3 Expressive controls; application state stays with its owner. */
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
  const selects = new WeakMap();
  let openSelect = null, selectSequence = 0;
  function dismissSelect() {
    if (!openSelect) return false;
    const { menu, trigger } = openSelect;
    if (menu.hidePopover && menu.matches(':popover-open')) menu.hidePopover();
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    openSelect = null;
    return true;
  }
  function syncSelect(select) { selects.get(select)?.sync(); }
  function enhanceSelect(select) {
    if (!select?.matches('select') || selects.has(select)) return;
    const wrapper = document.createElement('div');wrapper.className = 'md-select';
    select.before(wrapper);wrapper.append(select);
    select.classList.add('md-select-native');select.tabIndex = -1;select.setAttribute('aria-hidden', 'true');
    const id = select.id || 'md-select-' + (++selectSequence);
    const trigger = document.createElement('button');trigger.type = 'button';trigger.id = id + '-trigger';trigger.className = 'md-select-trigger';
    trigger.setAttribute('role', 'combobox');trigger.setAttribute('aria-haspopup', 'listbox');trigger.setAttribute('aria-expanded', 'false');
    const label = wrapper.parentElement.querySelector('label');
    if (label) {label.id ||= id + '-label';label.htmlFor = trigger.id;trigger.setAttribute('aria-labelledby', label.id + ' ' + id + '-value');}
    const value = document.createElement('span');value.id = id + '-value';
    trigger.append(value);trigger.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>');
    const menu = document.createElement('div');menu.id = id + '-menu';menu.className = 'md-select-menu';menu.hidden = true;menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-labelledby', label?.id || trigger.id);menu.setAttribute('popover', 'manual');
    trigger.setAttribute('aria-controls', menu.id);wrapper.append(trigger, menu);
    const items = [...select.options].map((option, index) => {
      const item = document.createElement('button');item.type = 'button';item.id = id + '-option-' + index;item.setAttribute('role', 'option');item.tabIndex = -1;item.textContent = option.textContent;item.disabled = option.disabled;item.dataset.value = option.value;
      item.onclick = () => {if(item.disabled)return;dismissSelect();trigger.focus();select.value = option.value;select.dispatchEvent(new Event('change', { bubbles: true }));};
      menu.append(item);return item;
    });
    let index = 0;
    function mark() {items.forEach((item,i)=>item.classList.toggle('md-menu-active', i === index));trigger.setAttribute('aria-activedescendant',items[index]?.id || '');items[index]?.scrollIntoView({block:'nearest'});}
    function sync() {value.textContent = select.selectedOptions[0]?.textContent || '';trigger.disabled = select.disabled;items.forEach((item,i)=>{item.setAttribute('aria-selected',String(select.options[i].selected));item.disabled=select.options[i].disabled;});}
    function position() {
      const bounds = trigger.getBoundingClientRect(), gap = 6, margin = 12;
      const width = Math.min(Math.max(bounds.width, 200), innerWidth - margin * 2);
      const roomBelow = innerHeight - bounds.bottom - margin - gap;
      const roomAbove = bounds.top - margin - gap;
      const above = roomBelow < Math.min(menu.scrollHeight, 240) && roomAbove > roomBelow;
      const height = Math.min(320, Math.max(100, above ? roomAbove : roomBelow));
      menu.style.width = width + 'px';menu.style.maxHeight = height + 'px';
      menu.style.left = Math.max(margin, Math.min(bounds.left, innerWidth - width - margin)) + 'px';
      menu.style.top = (above ? Math.max(margin, bounds.top - Math.min(menu.scrollHeight, height) - gap) : bounds.bottom + gap) + 'px';
    }
    function open() {dismissSelect();sync();menu.hidden = false;if (menu.showPopover) menu.showPopover();openSelect={menu,trigger,wrapper,position};trigger.setAttribute('aria-expanded','true');index=Math.max(0,select.selectedIndex);position();mark();}
    trigger.onclick = () => openSelect?.trigger === trigger ? dismissSelect() : open();
    trigger.onkeydown = event => {
      const keys=['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape','Tab'];
      if(!keys.includes(event.key))return;
      if(event.key==='Tab'){dismissSelect();return;}
      event.preventDefault();event.stopPropagation();
      if(event.key==='Escape'){dismissSelect();return;}
      if(openSelect?.trigger!==trigger){open();return;}
      if(event.key==='Enter'||event.key===' '){items[index]?.click();return;}
      const direction=event.key==='ArrowUp'?-1:1;
      index=event.key==='Home'?0:event.key==='End'?items.length-1:(index+direction+items.length)%items.length;
      for(let count=0;items[index]?.disabled&&count<items.length;count++)index=(index+direction+items.length)%items.length;
      mark();
    };
    select.addEventListener('change',sync);select.closest('dialog')?.addEventListener('close',dismissSelect);
    selects.set(select,{sync});sync();
  }
  document.addEventListener('pointerdown',event=>{if(openSelect&&!openSelect.wrapper.contains(event.target))dismissSelect();},true);
  document.addEventListener('scroll',()=>openSelect?.position(),true);
  addEventListener('resize',()=>openSelect?.position());
  window.SkyMaterial = Object.freeze({ updateRange, updateRanges, updateChoices, enhanceSelect, syncSelect, dismissSelect });
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
