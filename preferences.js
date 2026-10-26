/** One preference owner for all pages; no experiment data is stored here. */
(() => {
  'use strict';
  const key = 'skymotion-preferences', root = document.documentElement;
  const defaults = Object.freeze({theme:'system', nightStart:'22:00', nightEnd:'07:00', pureBlack:false,
    palette:'sage', primary:'#255c43', contrast:'standard', uiScale:1, readingScale:1,
    leading:'standard', width:'standard', density:'standard', motion:'system', welcomeMotion:true,
    smoothScroll:true, orbits:true, names:true, stars:true, quality:'standard', zoom:'standard', rememberRail:true});
  const options = {theme:['light','dark','system','schedule'],palette:['sage','blue','gray','custom'],
    contrast:['standard','high'],uiScale:[1,1.1,1.25],readingScale:[1,1.15,1.3,1.5],leading:['standard','loose'],
    width:['narrow','standard','wide'],density:['standard','compact'],motion:['system','reduce'],
    quality:['low','standard','high'],zoom:['low','standard','high']};
  const groups = {
    appearance:['theme','nightStart','nightEnd','pureBlack','palette','primary','contrast'],
    reading:['uiScale','readingScale','leading','width','language'],layout:['density'],
    animation:['motion','welcomeMotion','smoothScroll'],space:['orbits','names','stars','quality'],
    operation:['zoom','rememberRail'],data:[]};
  const subscribers = new Set(), motionListeners = new Set();
  const systemDark = matchMedia('(prefers-color-scheme: dark)'), systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let storageOK = true, dialog, launcher, message, pendingImport = null, pendingReset = null, activeGroup = 'appearance';
  let state = {...defaults};
  function validate(input, strict = true) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('invalid');
    const next = {};
    for (const [name, value] of Object.entries(input)) {
      if (!Object.hasOwn(defaults, name)) continue;
      const valid = options[name] ? options[name].includes(value) :
        typeof defaults[name] === 'boolean' ? typeof value === 'boolean' :
        name === 'primary' ? typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) :
        typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
      if (!valid) { if (strict) throw Error('invalid'); else continue; }
      next[name] = value;
    }
    return next;
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved?.version === 1) state = {...defaults, ...validate(saved.preferences, false)};
    } catch { storageOK = false; }
    if (state.nightStart === state.nightEnd) { state.nightStart = defaults.nightStart; state.nightEnd = defaults.nightEnd; }
  }
  function language() { return root.lang === 'en' ? 'en' : 'zh'; }
  const t = (zh,en) => language() === 'en' ? en : zh;
  const reduce = () => state.motion === 'reduce' || systemMotion.matches;
  let lastReduced;
  const reducedMotion = {get matches(){return reduce();},addEventListener(type,fn){if(type==='change')motionListeners.add(fn);},removeEventListener(type,fn){if(type==='change')motionListeners.delete(fn);}};
  function dark() {
    if (state.theme === 'system') return systemDark.matches;
    if (state.theme !== 'schedule') return state.theme === 'dark';
    const now = new Date(), minute = now.getHours()*60+now.getMinutes();
    const parse = s => Number(s.slice(0,2))*60+Number(s.slice(3));
    const start=parse(state.nightStart),end=parse(state.nightEnd);
    return start < end ? minute >= start && minute < end : minute >= start || minute < end;
  }
  const roles = {'accent':'primary','accent-hover':'primary','on-action':'onPrimary','paper':'surface',
    'surface':'surfaceContainerLowest','inset':'surfaceContainer','surface-low':'surfaceContainerLow',
    'surface-high':'surfaceContainerHigh','surface-highest':'surfaceContainerHighest','secondary':'secondary',
    'secondary-container':'secondaryContainer','on-secondary-container':'onSecondaryContainer','tertiary':'tertiary',
    'tertiary-container':'tertiaryContainer','on-tertiary-container':'onTertiaryContainer','line':'outlineVariant',
    'ink':'onSurface','muted':'onSurfaceVariant','selected':'primaryContainer','on-selected':'onPrimaryContainer',
    'scrollbar':'outline','open-border':'outline','open-muted':'onSurfaceVariant','switch-line':'outline',
    'switch-idle':'surfaceContainerHighest','switch-thumb':'onSurfaceVariant','disabled-ink':'onSurfaceVariant',
    'disabled-surface':'surfaceContainer','range-track':'secondaryContainer','error-ink':'onErrorContainer',
    'error-line':'error','error-surface':'errorContainer','reading-final':'tertiary'};
  function apply() {
    const isDark=dark(), nativeSage=state.palette==='sage' && !isDark && state.contrast==='standard';
    root.dataset.theme = isDark?'dark':'light'; root.style.colorScheme=isDark?'dark':'light';
    const color = {sage:'#255c43',blue:'#385e78',gray:'#625b52',custom:state.primary}[state.palette];
    const colors=window.SkyThemeColors(color,isDark,state.contrast==='high'?1:0);
    for(const [role, source] of Object.entries(roles)) {
      if(nativeSage) root.style.removeProperty('--design-'+role);
      else root.style.setProperty('--design-'+role,colors[state.contrast==='high' && source==='outlineVariant'?'outline':source]);
    }
    if(isDark && state.pureBlack) root.style.setProperty('--design-paper','#000000');
    root.style.setProperty('--ui-font-scale',state.uiScale);
    root.style.setProperty('--reading-scale',state.readingScale);
    root.style.setProperty('--reading-width',({narrow:60,standard:75,wide:90}[state.width])+'ch');
    root.style.setProperty('--reading-leading',state.leading==='loose'?'2.15':'1.85');
    root.dataset.density=state.density;root.dataset.reducedMotion=String(reduce());
    root.dataset.smoothScroll=String(state.smoothScroll&&!reduce());
    if(lastReduced!==reduce()) {lastReduced=reduce();for(const fn of motionListeners)fn({matches:lastReduced});}
    for(const fn of subscribers) fn({...state});
    document.dispatchEvent(new CustomEvent('skymotion:preferences',{detail:{...state}}));
    if(document.body) requestAnimationFrame(()=>dispatchEvent(new Event('resize')));
    refresh();
  }
  function save() {
    try {localStorage.setItem(key,JSON.stringify({version:1,preferences:state}));storageOK=true;}
    catch {storageOK=false;}
  }
  function set(patch) {
    const next={...state,...validate(patch)};
    if(next.nightStart===next.nightEnd)throw Error('schedule');
    state=next;save();apply();return {...state};
  }
  function reset(group) {
    const patch = group ? Object.fromEntries(groups[group].filter(k=>k in defaults).map(k=>[k,defaults[k]])) : {...defaults};
    set(patch);
    if(!group||group==='reading')window.skySetLanguage?.('zh').catch(()=>notify(t('语言切换未完成，请重试','Language change failed; please retry')));
  }
  function parseImport(text) {
    if(new TextEncoder().encode(text).length>65536)throw Error('size');
    const parsed=JSON.parse(text);
    if(parsed?.version!==1)throw Error('version');
    const preferences=validate(parsed.preferences);
    if(parsed.language!==undefined&&!['zh','en'].includes(parsed.language))throw Error('language');
    const next={...state,...preferences};
    if(next.nightStart===next.nightEnd)throw Error('schedule');
    return {preferences,language:parsed.language};
  }
  load();
  window.SkyPreferences = {get:()=>({...state}),set,reset,subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);},
    reducedMotion, export:()=>JSON.stringify({version:1,preferences:state,language:language()},null,2),parseImport,
    get storageAvailable(){return storageOK;},get dark(){return dark();},
    get smoothScroll(){return state.smoothScroll&&!reduce();}};
  apply();
  for(const mq of [systemDark,systemMotion])mq.addEventListener('change',apply);
  setInterval(()=>{if(state.theme==='schedule' && (root.dataset.theme==='dark')!==dark())apply();},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});
  addEventListener('storage',event=>{if(event.key===key||event.key===null){state={...defaults};load();apply();}});
  addEventListener('message',event=>{
    if(parent===window||event.source!==parent||event.origin!==location.origin||event.data?.type!=='skymotion:preferences-sync')return;
    try{state={...defaults,...validate(event.data.preferences)};apply();}catch{}
  });
  const broadcast=()=>{for(const frame of document.querySelectorAll('iframe'))try{frame.contentWindow?.postMessage({type:'skymotion:preferences-sync',preferences:state},location.origin);}catch{}};
  subscribers.add(broadcast);
  document.addEventListener('load',event=>{if(event.target.tagName==='IFRAME')broadcast();},true);

  // Bilingual labels are owned here; the existing language walker must skip this dialog.
  const labels = {
    appearance:['外观与夜间','Appearance & night'],reading:['阅读与语言','Reading & language'],layout:['布局','Layout'],
    animation:['动画','Motion'],space:['三维显示','3D display'],operation:['操作与帮助','Controls & help'],data:['设置数据','Settings data'],
    theme:['主题模式','Theme'],nightStart:['夜间开始','Night starts'],nightEnd:['夜间结束','Night ends'],pureBlack:['纯黑页面背景','Pure black background'],
    palette:['配色','Palette'],primary:['自选主色','Custom primary color'],contrast:['对比度','Contrast'],uiScale:['界面字号','Interface text size'],
    readingScale:['文档字号','Document text size'],leading:['文档行距','Document line spacing'],width:['文档正文宽度','Document width'],language:['语言','Language'],
    density:['界面密度','Interface density'],motion:['减少动画','Reduced motion'],welcomeMotion:['欢迎页背景动效','Welcome background motion'],
    smoothScroll:['平滑滚动','Smooth scrolling'],orbits:['轨道线','Orbit lines'],names:['天体名称','Body labels'],stars:['背景星点','Background stars'],
    quality:['渲染质量','Rendering quality'],zoom:['三维缩放灵敏度','3D zoom sensitivity'],rememberRail:['记住桌面侧栏状态','Remember desktop sidebar']};
  const values={light:['浅色','Light'],dark:['深色','Dark'],system:['跟随系统','System'],schedule:['定时','Scheduled'],sage:['鼠尾草绿','Sage'],blue:['雾蓝','Mist blue'],gray:['暖灰','Warm gray'],custom:['自选','Custom'],standard:['标准','Standard'],high:['增强／高','High'],low:['低／省电','Low'],loose:['宽松','Relaxed'],narrow:['窄','Narrow'],wide:['宽','Wide'],compact:['紧凑','Compact'],reduce:['减少','Reduce'],zh:['中文','中文'],en:['English','English']};
  const copy = pair=>t(...pair);
  let confirmation, confirmTrigger;
  const node=(tag,attrs={},text)=>{const el=document.createElement(tag);for(const [k,v]of Object.entries(attrs)){if(k==='class')el.className=v;else el.setAttribute(k,v);}if(text!==undefined)el.textContent=text;return el;};
  function notify(text) {if(message)message.textContent=text;}
  function showConfirmation(text, action) {
    confirmTrigger=document.activeElement;
    confirmation.hidden=false;confirmation.querySelector('p').textContent=text;
    confirmation.querySelector('[data-confirm]').onclick=()=>{try{action();confirmation.hidden=true;pendingImport=null;pendingReset=null;confirmTrigger?.focus();notify(t('设置已更新','Settings updated'));}catch{notify(t('无法应用设置','Could not apply settings'));}};
    confirmation.querySelector('[data-cancel]').onclick=()=>{confirmation.hidden=true;pendingImport=null;pendingReset=null;confirmTrigger?.focus();};
    confirmation.querySelector('[data-cancel]').focus();
  }
  function field(name) {
    const row=node('div',{class:'preference-row','data-setting':name});
    const id='pref-'+name,label=node('label',{for:id},copy(labels[name]));row.append(label);
    let control;
    if(name==='language'||options[name]) {
      control=node('select',{id});
      for(const value of name==='language'?['zh','en']:options[name])control.append(node('option',{value},typeof value==='number'?Math.round(value*100)+'%':copy(({quality:{low:['省电','Power saving'],standard:['标准','Standard'],high:['清晰','Clear']},contrast:{standard:['标准','Standard'],high:['增强','Enhanced']},zoom:{low:['低','Low'],standard:['标准','Standard'],high:['高','High']}}[name]?.[value]) || values[value])));
    }else if(typeof defaults[name]==='boolean')control=node('input',{id,type:'checkbox',role:'switch'});
    else control=node('input',{id,type:name==='primary'?'color':'time'});
    row.append(control);
    if(name==='primary') {
      const hex=node('input',{id:'pref-primary-hex',type:'text',pattern:'#[0-9a-fA-F]{6}',maxlength:'7','aria-label':t('主色十六进制值','Primary hex color')});
      hex.addEventListener('change',()=>{if(!/^#[\da-f]{6}$/i.test(hex.value)){hex.setAttribute('aria-invalid','true');notify(t('请输入 #RRGGBB 格式颜色','Use a #RRGGBB color'));return;}hex.removeAttribute('aria-invalid');set({primary:hex.value,palette:'custom'});});row.append(hex);
    }
    control.addEventListener('change',async()=>{
      try{
        if(name==='language')await window.skySetLanguage(control.value);
        else set({[name]:control.type==='checkbox'?control.checked:typeof defaults[name]==='number'?Number(control.value):control.value,...(name==='primary'?{palette:'custom'}:{})});
        notify(storageOK?t('已保存','Saved'):t('当前浏览器无法保存设置，仅本页有效','Storage is unavailable; changes apply to this page only'));
      }catch{notify(t('无法应用。夜间开始和结束需不同；颜色需有效。','Could not apply. Night times must differ and colors must be valid.'));refresh();}
    });
    return row;
  }
  function refresh() {
    if(!dialog)return;
    for(const name of Object.keys(labels)) {
      const input=dialog.querySelector('#pref-'+name);if(!input)continue;
      const value=name==='language'?language():state[name];
      if(input.type==='checkbox')input.checked=value;else input.value=value;
    }
    dialog.querySelector('#pref-primary-hex').value=state.primary;
    for(const name of ['nightStart','nightEnd'])dialog.querySelector(`[data-setting="${name}"]`).hidden=state.theme!=='schedule';
    dialog.querySelector('[data-setting="pureBlack"]').hidden=!dark();
    dialog.querySelector('[data-setting="primary"]').hidden=state.palette!=='custom';
    for(const name of ['welcomeMotion','smoothScroll']){const input=dialog.querySelector('#pref-'+name);input.disabled=reduce();}
    if(!storageOK)notify(t('当前浏览器无法保存设置，仅本页有效','Storage is unavailable; changes apply to this page only'));
  }
  function filter(query='') {
    query=query.trim().toLocaleLowerCase();let count=0;
    for(const section of dialog.querySelectorAll('.preference-section')) {
      const category=section.dataset.category;
      const categoryMatch=section.querySelector('h3').textContent.toLocaleLowerCase().includes(query);
      let visible=!!query&&(categoryMatch||!section.querySelector('.preference-row')&&section.textContent.toLocaleLowerCase().includes(query));
      for(const row of section.querySelectorAll('.preference-row')) {
        const match=!query||categoryMatch||row.textContent.toLocaleLowerCase().includes(query);
        row.classList.toggle('preference-search-hidden',!match);if(match)visible=true;
      }
      section.hidden=query?!visible:category!==activeGroup;
      if(!section.hidden)count++;
    }
    dialog.querySelector('.preference-empty').hidden=count>0;
    for(const button of dialog.querySelectorAll('[data-category-link]'))button.setAttribute('aria-pressed',String(!query&&button.dataset.categoryLink===activeGroup));
  }
  function build() {
    dialog=node('dialog',{class:'preferences-dialog','data-i18n-skip':'','aria-labelledby':'preferences-title'});
    const header=node('header',{class:'preferences-heading'});header.append(node('h2',{id:'preferences-title'},t('设置','Settings')));
    const close=node('button',{type:'button',class:'md-outlined-action','aria-label':t('关闭设置','Close settings')},t('关闭','Close'));
    close.onclick=()=>dialog.close();header.append(close);dialog.append(header);
    const search=node('input',{type:'search',class:'preferences-search',placeholder:t('搜索设置','Search settings'),'aria-label':t('搜索设置','Search settings')});search.oninput=()=>filter(search.value);dialog.append(search);
    const layout=node('div',{class:'preferences-layout'}),nav=node('nav',{class:'preferences-categories','aria-label':t('设置分类','Settings categories')}),content=node('div',{class:'preferences-content'});
    for(const [category,fields] of Object.entries(groups)) {
      const button=node('button',{type:'button','data-category-link':category,'aria-controls':'preferences-'+category},copy(labels[category]));
      button.onclick=()=>{activeGroup=category;search.value='';filter();content.scrollTop=0;};nav.append(button);
      const section=node('section',{id:'preferences-'+category,class:'preference-section','data-category':category});section.append(node('h3',{},copy(labels[category])));
      for(const name of fields)section.append(field(name));
      if(category==='space')section.append(node('p',{class:'preference-note'},t('适用于三维天空。显示设置不改变科学计算精度。','Applies to 3D Sky. Display settings do not change scientific precision.')));
      if(category==='appearance')section.append(node('p',{class:'preference-note'},t('定时使用设备本地时间。纯黑仅影响深色页面背景；三维沉浸模式保持深色。','Schedules use device local time. Pure black affects dark page backgrounds; immersive 3D stays dark.')));
      if(category==='animation')section.append(node('p',{class:'preference-note'},t('减少动画也遵循系统偏好，不会暂停你主动播放的科学模拟。','System reduced-motion preferences are respected. User-started scientific playback continues.')));
      if(category==='operation') {
        const help=node('div',{class:'preferences-help'});help.append(node('h4',{},t('快捷键与手势','Keyboard & gestures')));
        const inSpace=document.body.dataset.page==='space';
        help.append(node('p',{},inSpace?t('三维画布获得焦点后：方向键旋转，＋／－缩放，R 重置视角。鼠标拖动旋转，滚轮缩放；触屏单指旋转、双指缩放。','With the 3D canvas focused: arrows rotate, +/− zoom, R resets. Drag to rotate and scroll to zoom; touch uses one-finger rotation and pinch zoom.'):t('实验台：拖动画面调整视角；可组合图双击进入专注，Esc 返回。三维天空支持方向键、＋／－和 R；进入该页查看手势说明。文档：使用目录和返回顶部；设置中可用 Tab 导航、Esc 关闭。','Lab: drag the scene to adjust its view; double-click a composable pane to focus, Esc to return. 3D Sky supports arrows, +/− and R; see that page for gestures. Documents: use contents and Back to top. Settings support Tab and Esc.')));section.append(help);
      }
      if(category==='data') {
        const exportBtn=node('button',{type:'button',class:'md-outlined-action'},t('导出设置','Export settings'));
        exportBtn.onclick=()=>{const url=URL.createObjectURL(new Blob([window.SkyPreferences.export()],{type:'application/json'}));const a=node('a',{href:url,download:'skymotion-settings.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
        const importBtn=node('button',{type:'button',class:'md-outlined-action'},t('导入设置','Import settings'));
        const file=node('input',{type:'file',accept:'.json,application/json',hidden:''});
        importBtn.onclick=()=>file.click();file.onchange=async()=>{try{if(!file.files[0])return;if(file.files[0].size>65536)throw Error('size');pendingImport=parseImport(await file.files[0].text());showConfirmation(t('导入将覆盖文件包含的偏好与语言，不修改实验或收藏。是否应用？','Import overwrites the preferences and language included in the file, without changing experiments or favorites. Apply?'),()=>{set(pendingImport.preferences);if(pendingImport.language)window.skySetLanguage(pendingImport.language).catch(()=>notify(t('语言切换未完成，请重试','Language change failed; please retry')));});}catch{notify(t('无法导入：请使用有效的设置文件（版本 1，最大 64 KB）。','Import failed: use a valid version 1 settings file, up to 64 KB.'));}finally{file.value='';}};
        section.append(node('p',{},t('设置保存在当前浏览器和站点。导出文件不含实验、收藏或布局。','Settings stay in this browser and site. Exports exclude experiments, favorites and layouts.')),exportBtn,importBtn,file);
        const all=node('button',{type:'button',class:'md-outlined-action'},t('恢复全部设置','Reset all settings'));all.onclick=()=>showConfirmation(t('恢复全部偏好和中文语言。保留实验、收藏和布局存档。','Reset all preferences and switch to Chinese. Experiments, favorites and layouts are preserved.'),()=>reset());section.append(all);
      }else {
        const resetBtn=node('button',{type:'button',class:'md-outlined-action preference-reset'},t('恢复本分类默认值','Reset this category'));
        resetBtn.onclick=()=>{pendingReset=category;showConfirmation(t('仅恢复本分类偏好，保留实验和收藏。','Reset only this category; experiments and favorites are preserved.'),()=>reset(pendingReset));};section.append(resetBtn);
      }
      content.append(section);
    }
    content.append(node('p',{class:'preference-empty',hidden:''},t('没有匹配的设置','No matching settings')));
    layout.append(nav,content);dialog.append(layout);
    confirmation=node('div',{class:'preferences-confirm',hidden:'',role:'group','aria-label':t('确认设置操作','Confirm settings change')});confirmation.append(node('p'),node('button',{type:'button',class:'md-outlined-action','data-cancel':''},t('取消','Cancel')),node('button',{type:'button',class:'md-outlined-action','data-confirm':''},t('确认','Confirm')));dialog.append(confirmation);
    message=node('p',{class:'preferences-message',role:'status','aria-live':'polite'});dialog.append(message);
    dialog.addEventListener('close',()=>{confirmation.hidden=true;pendingImport=null;pendingReset=null;launcher?.focus({preventScroll:true});});
    dialog.addEventListener('cancel',event=>{if(!confirmation.hidden){event.preventDefault();confirmation.hidden=true;pendingImport=null;pendingReset=null;}});
    document.body.append(dialog);refresh();filter();
  }
  function mount() {
    if(document.body?.dataset.embedded==='true'||parent!==window)return;
    const bar=document.querySelector('.language-nav,.welcome-brand');if(!bar)return;
    if(launcher?.isConnected) {
      const languageButton=bar.querySelector(':scope > .language-toggle');
      if(languageButton)launcher.parentElement.prepend(languageButton);
      return;
    }
    let host=bar.querySelector('.language-actions');
    if(!host){host=node('div',{class:'language-actions'});bar.append(host);}
    const languageButton=bar.querySelector('.language-toggle');
    if(languageButton&&languageButton.parentElement!==host)host.prepend(languageButton);
    if(!launcher){launcher=node('button',{type:'button',class:'preferences-launch md-outlined-action','data-i18n-skip':'','aria-haspopup':'dialog'},t('设置','Settings'));launcher.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--design-surface)"/><circle cx="15" cy="17" r="3" fill="var(--design-surface)"/></svg>';
      launcher.setAttribute('aria-label',t('设置','Settings'));launcher.title=t('设置','Settings');
      launcher.onclick=()=>{if(!dialog)build();dialog.showModal();dialog.querySelector('.preferences-search').focus();};}
    if(!launcher.isConnected)host.append(launcher);
  }
  document.addEventListener('skymotion:language',()=>{
    if(launcher){launcher.setAttribute('aria-label',t('设置','Settings'));launcher.title=t('设置','Settings');}
    if(dialog){const open=dialog.open,focusId=document.activeElement?.id;dialog.remove();dialog=null;if(open){build();dialog.showModal();(focusId&&dialog.querySelector('#'+CSS.escape(focusId))||dialog.querySelector('.preferences-search')).focus();}}
    mount();
  });
  // Registered before experiment shortcuts: a modal owns Escape even in a focused pane.
  addEventListener('keydown',event=>{
    if(!dialog?.open||event.key!=='Escape'||event.isComposing)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!confirmation.hidden){confirmation.hidden=true;pendingImport=null;pendingReset=null;confirmTrigger?.focus();}
    else dialog.close();
  },true);
  document.addEventListener('DOMContentLoaded',()=>{mount();apply();},{once:true});
})();
