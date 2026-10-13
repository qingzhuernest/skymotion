/** Site-owned date/month controls; native fields retain ISO values and existing events. */
(() => {
  const installed = new WeakSet();
  let field = null, selected = '', year = 2026, month = 6, chooseMonth = false, chooseYear = false;
  const en = () => document.documentElement.lang === 'en';
  const label = (zh, english) => en() ? english : zh;
  const dialog = document.createElement('dialog');
  dialog.className = 'site-calendar';
  dialog.dataset.i18nSkip = '';
  dialog.setAttribute('aria-labelledby', 'siteCalendarTitle');
  const icon = direction => `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${direction < 0 ? 'M15 5 8 12l7 7' : 'm9 5 7 7-7 7'}"/></svg>`;
  function dateValue(y,m,d) { return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
  function allowed(value) { return (!field.min || value >= field.min) && (!field.max || value <= field.max); }
  function close() { dialog.getAnimations().forEach(a=>a.cancel()); dialog.close();dialog.style.setProperty('display','none','important'); field?.focus({preventScroll:true}); }
  function render() {
    const months = en() ? ['January','February','March','April','May','June','July','August','September','October','November','December'] : Array.from({length:12},(_,i)=>`${i+1}月`);
    const monthOnly = field.dataset.calendarType === 'month';
    const firstYear = Math.floor((year-1)/12)*12+1;
    dialog.innerHTML = `<div class="site-calendar-head"><button type="button" data-shift="-1" aria-label="${chooseYear?label('前十二年','Previous twelve years'):label('上一个月','Previous month')}">${icon(-1)}</button><button type="button" id="siteCalendarTitle" data-months>${chooseYear ? `${firstYear}–${Math.min(9999,firstYear+11)}` : en() ? `${months[month-1]} ${year}` : `${year}年${month}月`}</button><button type="button" data-shift="1" aria-label="${chooseYear?label('后十二年','Next twelve years'):label('下一个月','Next month')}">${icon(1)}</button></div><div class="site-calendar-year"><span>${label('年份','Year')}</span><button type="button" id="siteCalendarYear" aria-expanded="${chooseYear}">${year}</button></div><div class="site-calendar-grid ${monthOnly||chooseMonth||chooseYear?'site-calendar-months':''}"></div><div class="site-calendar-actions"><button type="button" data-cancel>${label('取消','Cancel')}</button><button type="button" data-confirm>${label('确定','Apply')}</button></div>`;
    const grid = dialog.querySelector('.site-calendar-grid');
    if (chooseYear) {
      for(let y=firstYear;y<=Math.min(9999,firstYear+11);y++){const b=document.createElement('button');b.type='button';b.textContent=String(y);b.onclick=()=>{year=y;chooseYear=false;render()};grid.append(b)}
    } else if (monthOnly || chooseMonth) {
      months.forEach((name,i) => {
        const b = document.createElement('button'); b.type='button'; b.textContent=name;
        const value=dateValue(year,i+1,1).slice(0,7);
        b.disabled=monthOnly&&!allowed(value); b.setAttribute('aria-pressed',String(selected.slice(0,7)===value));
        b.onclick=()=>{month=i+1;if(monthOnly){selected=value;render()}else{chooseMonth=false;render()}};
        grid.append(b);
      });
    } else {
      const weekdays=en()?['Sun','Mon','Tue','Wed','Thu','Fri','Sat']:['日','一','二','三','四','五','六'];
      weekdays.forEach(name=>{const s=document.createElement('span');s.textContent=name;s.className='site-calendar-weekday';grid.append(s)});
      const start=new Date(Date.UTC(year,month-1,1)); if(year<100)start.setUTCFullYear(year);
      for(let i=0;i<start.getUTCDay();i++){const s=document.createElement('span');s.setAttribute('aria-hidden','true');grid.append(s)}
      const end=new Date(Date.UTC(year,month,0));if(year<100)end.setUTCFullYear(year);
      for(let d=1;d<=end.getUTCDate();d++){
        const value=dateValue(year,month,d),b=document.createElement('button');b.type='button';b.textContent=String(d);b.dataset.date=value;
        b.setAttribute('aria-label',value);b.setAttribute('aria-pressed',String(value===selected));b.disabled=!allowed(value);
        b.onclick=()=>{selected=value;dialog.querySelector('[data-confirm]').disabled=false;grid.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))};
        grid.append(b);
      }
    }
    dialog.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{if(chooseYear){year=Math.max(1,Math.min(9999,year+Number(b.dataset.shift)*12));render();return}let m=month+Number(b.dataset.shift);if(m<1){year--;m=12}if(m>12){year++;m=1}if(year<1||year>9999)return;month=m;render()});
    dialog.querySelector('[data-months]').onclick=()=>{chooseYear=false;chooseMonth=!chooseMonth;render()};
    dialog.querySelector('#siteCalendarYear').onclick=()=>{chooseYear=!chooseYear;render()};
    dialog.querySelector('[data-cancel]').onclick=close;
    dialog.querySelector('[data-confirm]').disabled=!selected||!allowed(selected);
    dialog.querySelector('[data-confirm]').onclick=()=>{
      if(selected&&allowed(selected)&&selected!==field.value){window.SkyMotionHistory?.beginExternal();field.value=selected;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));window.SkyMotionHistory?.flush()}
      close();
    };
  }
  function open(input) {
    if(input.disabled)return;
    field=input;selected=input.value;const parts=(selected||'2026-06-21').split('-').map(Number);year=parts[0];month=parts[1]||1;chooseMonth=false;chooseYear=false;
    render();dialog.style.removeProperty('display');if(!dialog.isConnected)document.body.append(dialog);dialog.showModal();
    (dialog.querySelector('[aria-pressed="true"]')||dialog.querySelector('[data-months]')).focus();
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)dialog.animate([{opacity:.5,transform:'translateY(8px) scale(.98)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.22,1.15,.36,1)'});
  }
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close()}});
  addEventListener('keydown',event=>{if(dialog.open){if(event.key==='Escape'){event.preventDefault();close()}event.stopImmediatePropagation()}},true);
  document.addEventListener('skymotion:language',()=>{if(dialog.open)render()});
  function install() {
    document.querySelectorAll('input[type="date"],input[type="month"]').forEach(input=>{
      if(installed.has(input))return;installed.add(input);input.dataset.calendarType=input.type;input.type='text';input.classList.add('site-date-field');input.readOnly=true;
      input.setAttribute('aria-haspopup','dialog');
      input.addEventListener('click',event=>{event.preventDefault();open(input)});
      input.addEventListener('keydown',event=>{if(['Enter',' ','ArrowDown'].includes(event.key)){event.preventDefault();open(input)}});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();
