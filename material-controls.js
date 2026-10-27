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
  const choices = new WeakMap();
  const openChoosers = new Set();
  const pending = new Set();let choiceTask=false,choiceSequence=0;
  function queueChoice(select) {
    if(!select?.matches?.('select'))return;
    pending.add(select);if(choiceTask)return;choiceTask=true;
    queueMicrotask(()=>{choiceTask=false;const batch=[...pending];pending.clear();for(const item of batch)enhanceChoices(item);});
  }
  function syncChoices(select) { choices.get(select)?.sync(); }
  function enhanceChoices(select) {
    if(!select?.matches?.('select'))return;
    if(choices.has(select)){syncChoices(select);return;}
    const key=select.id||'md-choice-'+(++choiceSequence),field=document.createElement('span');field.className='md-choice-field';field.dataset.choiceFor=key;
    const details=document.createElement('details'),summary=document.createElement('summary');details.className='md-choice-disclosure';details.append(summary);
    const panel=document.createElement('div');panel.className='md-choice-panel';panel.setAttribute('popover','manual');panel.hidden=true;
    const group=document.createElement('div');group.className='preference-choices md-choice-buttons md-connected-choice';group.setAttribute('role','group');
    select.classList.add('md-choice-native');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    let signature='',buttons=[],long=false;
    function positionPanel(){
      if(!field.isConnected||field.hidden||!details.open){closeChoice();return;}
      const rect=summary.getBoundingClientRect(),margin=12,gap=6,width=Math.min(380,innerWidth-margin*2);
      panel.style.width=width+'px';panel.style.maxHeight=Math.max(100,innerHeight-margin*2)+'px';
      const height=Math.min(panel.scrollHeight,innerHeight-margin*2),below=innerHeight-rect.bottom-margin-gap;
      panel.style.left=Math.max(margin,Math.min(rect.left,innerWidth-width-margin))+'px';
      panel.style.top=(below>=height?rect.bottom+gap:Math.max(margin,rect.top-height-gap))+'px';
    }
    function closeChoice(){if(panel.hidePopover&&panel.matches(':popover-open'))panel.hidePopover();panel.hidden=true;details.open=false;openChoosers.delete(popup);}
    const popup={field,close:closeChoice,position:positionPanel};
    details.addEventListener('toggle',()=>{
      if(!details.open){closeChoice();return;}
      for(const other of [...openChoosers])if(other!==popup)other.close();
      panel.hidden=false;if(panel.showPopover)panel.showPopover();openChoosers.add(popup);positionPanel();
    });
    function caption(){
      const label=select.labels?.[0]||select.parentElement.querySelector('label');
      return select.getAttribute('aria-label')||(label?[...label.childNodes].filter(n=>n!==select&&n!==field&&!n.contains?.(select)&&!n.contains?.(field)).map(n=>n.textContent).join(' ').trim():'')||(document.documentElement.lang==='en'?'Choose an option':'选择选项');
    }
    function syncVisibility(){for(const button of buttons)button.hidden=button.skyOption.hidden;updateChoices(group);}
    summary.addEventListener('click',event=>{if(select.disabled)event.preventDefault();});
    details.addEventListener('keydown',event=>{if(event.key==='Escape'&&details.open){event.preventDefault();event.stopPropagation();closeChoice();summary.focus();}});
    function sync(){
      if(!select.isConnected){closeChoice();field.remove();return;}
      if(select.nextElementSibling!==field)select.after(field);
      field.hidden=select.hidden||select.style.display==='none';
      const options=[...select.options];field.hidden=field.hidden||options.length===0;const next=JSON.stringify(options.map(o=>[o.value,o.textContent,o.disabled,o.hidden]));
      if(signature!==next){
        signature=next;const focused=document.activeElement?.closest('.md-choice-field')===field?document.activeElement.dataset.choiceValue:null;
        long=options.filter(o=>!o.hidden).length>4;field.classList.toggle('md-choice-many',long);group.dataset.choiceCount=options.length;
        group.replaceChildren();buttons=options.map((option,index)=>{
          const button=document.createElement('button');button.type='button';button.id=key+'-choice-'+index;button.dataset.choiceValue=option.value;button.textContent=option.textContent;button.skyOption=option;
          button.onclick=()=>{if(button.disabled)return;select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));if(long){closeChoice();summary.focus({preventScroll:true});}};
          button.onkeydown=event=>{
            if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
            event.preventDefault();event.stopPropagation();const visible=buttons.filter(b=>!b.hidden&&!b.disabled),i=visible.indexOf(button);
            const target=event.key==='Home'?visible[0]:event.key==='End'?visible.at(-1):visible[(i+(event.key==='ArrowLeft'?-1:1)+visible.length)%visible.length];
            if(target){target.focus();target.click();}
          };group.append(button);return button;
        });
        if(long){panel.append(group);details.append(panel);field.replaceChildren(details);}else {closeChoice();field.replaceChildren(group);}
        if(focused!==null)buttons.find(b=>b.dataset.choiceValue===focused)?.focus({preventScroll:true});
      }
      const label=caption();group.setAttribute('aria-label',label);summary.setAttribute('aria-label',label+': '+(select.selectedOptions[0]?.textContent||''));
      const text=select.selectedOptions[0]?.textContent||label;if(summary.textContent!==text)summary.textContent=text;
      summary.setAttribute('aria-disabled',String(select.disabled));
      buttons.forEach((button,index)=>{const option=options[index],selected=option.selected;button.setAttribute('aria-pressed',String(selected));button.tabIndex=selected||long?0:-1;button.disabled=select.disabled||option.disabled;});syncVisibility();
    }
    select.addEventListener('change',sync);select.addEventListener('focus',()=>{if(long)summary.focus({preventScroll:true});else buttons.find(b=>b.getAttribute('aria-pressed')==='true')?.focus({preventScroll:true});});
    choices.set(select,{sync});select.after(field);sync();
  }
  function enhanceAll(root=document){if(root.matches?.('select'))queueChoice(root);root.querySelectorAll?.('select').forEach(queueChoice);}
  // Keep native property semantics while synchronizing programmatic selection changes.
  for(const [prototype,key] of [[HTMLSelectElement.prototype,'value'],[HTMLSelectElement.prototype,'selectedIndex'],[HTMLOptionElement.prototype,'selected']]){
    const descriptor=Object.getOwnPropertyDescriptor(prototype,key);
    if(descriptor?.set)Object.defineProperty(prototype,key,{...descriptor,set(value){const before=descriptor.get.call(this);descriptor.set.call(this,value);if(before!==descriptor.get.call(this))queueChoice(this instanceof HTMLSelectElement?this:this.closest('select'));}});
  }
  document.addEventListener('pointerdown',event=>{for(const popup of [...openChoosers])if(!popup.field.contains(event.target))popup.close();},true);
  document.addEventListener('scroll',()=>{for(const popup of openChoosers)popup.position();},true);
  addEventListener('resize',()=>{for(const popup of openChoosers)popup.position();});
  document.addEventListener('skymotion:language',()=>{for(const popup of [...openChoosers])popup.close();enhanceAll();});
  window.SkyMaterial=Object.freeze({updateRange,updateRanges,updateChoices,enhanceChoices,syncChoices});
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
