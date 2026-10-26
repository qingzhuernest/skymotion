/** One preference owner for all pages; no experiment data is stored here. */
(() => {
  'use strict';
  const key = 'skymotion-preferences', root = document.documentElement;
  const defaults = Object.freeze({theme:'system', nightStart:'22:00', nightEnd:'07:00', pureBlack:false,
    palette:'sage', primary:'#255c43',surfaceMode:'theme',surfaceColor:'#e2e9de',canvasMode:'theme',canvasColor:'#132438', contrast:'standard', uiScale:1, readingScale:1,
    leading:1.85, width:100, density:'standard', motion:'system', welcomeMotion:true,
    smoothScroll:true, orbits:true, names:true, stars:true, quality:'standard', zoom:'standard', rememberRail:true});
  const options = {theme:['light','dark','system','schedule'],palette:['sage','blue','gray','custom'],
    surfaceMode:['theme','custom'],canvasMode:['theme','custom'],contrast:['standard','high'],density:['standard','compact'],motion:['system','reduce'],
    quality:['low','standard','high'],zoom:['low','standard','high']};
  const ranges = {uiScale:{min:.8,max:1.5,step:.01},readingScale:{min:.8,max:2,step:.01},
    leading:{min:1.5,max:2.4,step:.01},width:{min:80,max:120,step:1}};
  function migrate(preferences, version) {
    if(!preferences||typeof preferences!=='object'||Array.isArray(preferences))return preferences;
    const next={...preferences};
    if(version===1){
      if(typeof next.leading==='string')next.leading={standard:1.85,loose:2.15}[next.leading] ?? next.leading;
      if(typeof next.width==='string')next.width={narrow:80,standard:100,wide:120}[next.width] ?? next.width;
    }
    return next;
  }
  const groups = {
    appearance:['theme','nightStart','nightEnd','pureBlack','palette','primary','surfaceMode','surfaceColor','canvasMode','canvasColor','contrast'],
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
      const valid = ranges[name] ? typeof value==='number' && Number.isFinite(value) && value>=ranges[name].min && value<=ranges[name].max : options[name] ? options[name].includes(value) :
        typeof defaults[name] === 'boolean' ? typeof value === 'boolean' :
        ['primary','surfaceColor','canvasColor'].includes(name) ? typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) :
        typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
      if (!valid) { if (strict) throw Error('invalid'); else continue; }
      next[name] = value;
    }
    return next;
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if ([1,2].includes(saved?.version)) state = {...defaults, ...validate(migrate(saved.preferences,saved.version), false)};
    } catch { storageOK = false; }
    if (state.nightStart === state.nightEnd) { state.nightStart = defaults.nightStart; state.nightEnd = defaults.nightEnd; }
  }
  function language() { return root.lang === 'en' ? 'en' : 'zh'; }
  const t = (zh,en) => language() === 'en' ? en : zh;
  const reduce = () => state.motion === 'reduce' || systemMotion.matches;
  let lastReduced,canvasStyle=Object.freeze({custom:false,color:'#132438',ink:'#e4eef3'});
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
    if(state.surfaceMode==='custom') {
      const bg=state.surfaceColor,paint=window.SkyThemePaint,fg=paint.foreground(bg),away=fg==='#000000'?'#ffffff':'#000000';
      const setRole=(name,value)=>root.style.setProperty('--design-'+name,value);
      setRole('paper',bg);setRole('ink',fg);setRole('muted',fg);
      for(const [name,amount] of Object.entries({surface:.08,inset:.12,'surface-low':.04,'surface-high':.16,'surface-highest':.2,'disabled-surface':.12}))setRole(name,paint.mix(bg,away,amount));
      const primary=paint.readable(colors.primary,bg,state.contrast==='high'?7:4.5);
      setRole('accent',primary);setRole('accent-hover',primary);setRole('on-action',paint.foreground(primary));
      setRole('line',paint.readable(colors.outline,bg,3));setRole('disabled-ink',fg);
      root.style.colorScheme=fg==='#ffffff'?'dark':'light';
    }
    root.style.setProperty('--interface-color-scheme',root.style.colorScheme);
    canvasStyle=Object.freeze({custom:state.canvasMode==='custom',color:state.canvasColor,ink:window.SkyThemePaint.foreground(state.canvasColor)});
    root.dataset.customCanvas=String(canvasStyle.custom);
    if(canvasStyle.custom)root.style.setProperty('--design-plot',canvasStyle.color);else root.style.removeProperty('--design-plot');
    root.style.setProperty('--canvas-background',canvasStyle.color);root.style.setProperty('--canvas-ink',canvasStyle.ink);
    if(isDark && state.pureBlack) root.style.setProperty('--design-paper','#000000');
    root.style.setProperty('--ui-font-scale',state.uiScale);
    root.style.setProperty('--reading-scale',state.readingScale);
    root.style.setProperty('--reading-width',(state.width*.75)+'ch');
    root.style.setProperty('--reading-leading',String(state.leading));
    root.dataset.density=state.density;root.dataset.reducedMotion=String(reduce());
    root.dataset.smoothScroll=String(state.smoothScroll&&!reduce());
    if(lastReduced!==reduce()) {lastReduced=reduce();for(const fn of motionListeners)fn({matches:lastReduced});}
    for(const fn of subscribers) fn({...state});
    document.dispatchEvent(new CustomEvent('skymotion:preferences',{detail:{...state}}));
    if(document.body) requestAnimationFrame(()=>dispatchEvent(new Event('resize')));
    refresh();
  }
  function save() {
    try {localStorage.setItem(key,JSON.stringify({version:2,preferences:state}));storageOK=true;}
    catch {storageOK=false;}
  }
  function set(patch) {
    const next={...state,...validate(patch)};
    if(next.nightStart===next.nightEnd)throw Error('schedule');
    if(patch.surfaceMode==='custom'||patch.surfaceColor!==undefined)next.pureBlack=false;
    if(patch.pureBlack===true)next.surfaceMode='theme';
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
    if(![1,2].includes(parsed?.version))throw Error('version');
    const preferences=validate(migrate(parsed.preferences,parsed.version));
    if(parsed.language!==undefined&&!['zh','en'].includes(parsed.language))throw Error('language');
    const next={...state,...preferences};
    if(next.nightStart===next.nightEnd)throw Error('schedule');
    return {preferences,language:parsed.language};
  }
  load();
  window.SkyPreferences = {get:()=>({...state}),set,reset,subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);},
    reducedMotion, export:()=>JSON.stringify({version:2,preferences:state,language:language()},null,2),parseImport,
    get canvasStyle(){return canvasStyle;},
    canvasInk:(color,minimum=4.5)=>canvasStyle.custom?window.SkyThemePaint.readable(color,canvasStyle.color,minimum):color,
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
    surfaceMode:['页面与面板背景','Page & panel background'],surfaceColor:['自选页面背景','Custom page background'],canvasMode:['科学画布背景','Scientific canvas background'],canvasColor:['自选画布背景','Custom canvas background'],palette:['配色','Palette'],primary:['自选主色','Custom primary color'],contrast:['对比度','Contrast'],uiScale:['界面字号','Interface text size'],
    readingScale:['文档字号','Document text size'],leading:['文档行距','Document line spacing'],width:['文档正文宽度','Document width'],language:['语言','Language'],
    density:['界面密度','Interface density'],motion:['减少动画','Reduced motion'],welcomeMotion:['欢迎页背景动效','Welcome background motion'],
    smoothScroll:['平滑滚动','Smooth scrolling'],orbits:['轨道线','Orbit lines'],names:['天体名称','Body labels'],stars:['背景星点','Background stars'],
    quality:['渲染质量','Rendering quality'],zoom:['三维缩放灵敏度','3D zoom sensitivity'],rememberRail:['记住桌面侧栏状态','Remember desktop sidebar']};
  const values={theme:['跟随主题','Follow theme'],light:['浅色','Light'],dark:['深色','Dark'],system:['跟随系统','System'],schedule:['定时','Scheduled'],sage:['鼠尾草绿','Sage'],blue:['雾蓝','Mist blue'],gray:['暖灰','Warm gray'],custom:['自选','Custom'],standard:['标准','Standard'],high:['增强／高','High'],low:['低／省电','Low'],loose:['宽松','Relaxed'],narrow:['窄','Narrow'],wide:['宽','Wide'],compact:['紧凑','Compact'],reduce:['减少','Reduce'],zh:['中文','中文'],en:['English','English']};
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
    if(ranges[name]) {control=node('input',{id,type:'range',...ranges[name]});}
    else if(name==='language'||options[name]) {
      control=node('select',{id});
      for(const value of name==='language'?['zh','en']:options[name])control.append(node('option',{value},typeof value==='number'?Math.round(value*100)+'%':copy(({quality:{low:['省电','Power saving'],standard:['标准','Standard'],high:['清晰','Clear']},contrast:{standard:['标准','Standard'],high:['增强','Enhanced']},zoom:{low:['低','Low'],standard:['标准','Standard'],high:['高','High']}}[name]?.[value]) || values[value])));
    }else if(typeof defaults[name]==='boolean')control=node('input',{id,type:'checkbox',role:'switch'});
    else control=node('input',{id,type:['primary','surfaceColor','canvasColor'].includes(name)?'color':'time'});
    if(ranges[name]) {
      const container=node('div',{class:'preference-range'});
      const value=node('output',{for:id,id:id+'-value','aria-live':'off'});
      const stepper = (direction) => {
        const button=node('button',{type:'button',class:'md-range-step','aria-label':t(direction<0?'减小':'增大',direction<0?'Decrease ':'Increase ')+copy(labels[name])},direction<0?'−':'+');
        button.onclick=()=>{direction<0?control.stepDown():control.stepUp();control.dispatchEvent(new Event('input',{bubbles:true}));};
        return button;
      };
      container.append(stepper(-1),control,stepper(1),value);row.append(container);
    }else row.append(control);
    const colorMode=name==='primary'?{palette:'custom'}:name==='surfaceColor'?{surfaceMode:'custom'}:name==='canvasColor'?{canvasMode:'custom'}:null;
    if(colorMode) {
      const hex=node('input',{id:'pref-'+name+'-hex',type:'text',pattern:'#[0-9a-fA-F]{6}',maxlength:'7','aria-label':copy(labels[name])+' '+t('十六进制值','hex color')});
      hex.addEventListener('change',()=>{if(!/^#[\da-f]{6}$/i.test(hex.value)){hex.setAttribute('aria-invalid','true');notify(t('请输入 #RRGGBB 格式颜色','Use a #RRGGBB color'));return;}hex.removeAttribute('aria-invalid');set({[name]:hex.value,...colorMode});});row.append(hex);
    }
    control.addEventListener(ranges[name]?'input':'change',async()=>{
      try{
        if(name==='language')await window.skySetLanguage(control.value);
        else set({[name]:control.type==='checkbox'?control.checked:typeof defaults[name]==='number'?Number(control.value):control.value,...(colorMode||{})});
        notify(storageOK?t('已保存','Saved'):t('当前浏览器无法保存设置，仅本页有效','Storage is unavailable; changes apply to this page only'));
      }catch{notify(t('无法应用。夜间开始和结束需不同；颜色需有效。','Could not apply. Night times must differ and colors must be valid.'));refresh();}
    });
    if(name==='language') {
      control.classList.add('md-select-native');control.tabIndex=-1;control.setAttribute('aria-hidden','true');
      label.id=id+'-label';label.removeAttribute('for');
      const choices=node('div',{class:'preference-language md-connected-choice',role:'group','aria-labelledby':label.id});
      for(const [value,text] of [['zh','中文'],['en','English']]) {
        const button=node('button',{type:'button','data-language-choice':value,'aria-pressed':String(language()===value)},text);
        button.onclick=()=>{control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}));};choices.append(button);
      }
      row.append(choices);window.SkyMaterial?.updateChoices(choices);
    } else if(control.tagName==='SELECT')window.SkyMaterial?.enhanceSelect(control);
    return row;
  }
  function refresh() {
    if(!dialog)return;
    for(const name of Object.keys(labels)) {
      const input=dialog.querySelector('#pref-'+name);if(!input)continue;
      const value=name==='language'?language():state[name];
      if(input.type==='checkbox')input.checked=value;else input.value=value;
      if(input.tagName==='SELECT')window.SkyMaterial?.syncSelect(input);
      if(name==='language')dialog.querySelectorAll('[data-language-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.languageChoice===value)));
      if(ranges[name]) {
        const text=name==='leading'?Number(value).toFixed(2)+t(' 倍','×'):Math.round(Number(value)*(name==='width'?1:100))+'%';
        dialog.querySelector('#pref-'+name+'-value').textContent=text;
        input.setAttribute('aria-valuetext',text);window.SkyMaterial?.updateRange(input);
      }
    }
    for(const name of ['primary','surfaceColor','canvasColor'])dialog.querySelector('#pref-'+name+'-hex').value=state[name];
    for(const name of ['nightStart','nightEnd'])dialog.querySelector(`[data-setting="${name}"]`).hidden=state.theme!=='schedule';
    dialog.querySelector('[data-setting="pureBlack"]').hidden=!dark();
    dialog.querySelector('[data-setting="primary"]').hidden=state.palette!=='custom';
    dialog.querySelector('[data-setting="surfaceColor"]').hidden=state.surfaceMode!=='custom';
    dialog.querySelector('[data-setting="canvasColor"]').hidden=state.canvasMode!=='custom';
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
      if(category==='appearance')section.append(node('p',{class:'preference-note'},t('定时使用设备本地时间。页面和画布可分别自选底色；纯黑与自选页面背景互斥。真实天空、地表和天体纹理保留物理着色。','Schedules use device local time. Page and canvas backgrounds are independent. Pure black and a custom page background are alternatives. Natural sky, ground and body textures retain their physical colors.')));
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
        importBtn.onclick=()=>file.click();file.onchange=async()=>{try{if(!file.files[0])return;if(file.files[0].size>65536)throw Error('size');pendingImport=parseImport(await file.files[0].text());showConfirmation(t('导入将覆盖文件包含的偏好与语言，不修改实验或收藏。是否应用？','Import overwrites the preferences and language included in the file, without changing experiments or favorites. Apply?'),()=>{set(pendingImport.preferences);if(pendingImport.language)window.skySetLanguage(pendingImport.language).catch(()=>notify(t('语言切换未完成，请重试','Language change failed; please retry')));});}catch{notify(t('无法导入：请使用有效的设置文件（版本 1 或 2，最大 64 KB）。','Import failed: use a valid version 1 or 2 settings file, up to 64 KB.'));}finally{file.value='';}};
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
    dialog.addEventListener('close',()=>{window.SkyMaterial?.dismissSelect();confirmation.hidden=true;pendingImport=null;pendingReset=null;launcher?.focus({preventScroll:true});});
    dialog.addEventListener('cancel',event=>{if(!confirmation.hidden){event.preventDefault();confirmation.hidden=true;pendingImport=null;pendingReset=null;}});
    document.body.append(dialog);refresh();filter();
  }
  function mount() {
    if(document.body?.dataset.embedded==='true'||parent!==window)return;
    const bar=document.querySelector('.language-nav,.welcome-brand');if(!bar)return;
    const nav=bar.querySelector('.page-nav');
    const immersive=document.body.classList.contains('space-immersive');
    let host=immersive?document.querySelector('.head-actions'):nav;
    if(!host){host=bar.querySelector('.language-actions');if(!host){host=node('div',{class:'language-actions'});bar.append(host);}}
    if(!launcher){
      launcher=node('button',{type:'button',class:'preferences-launch','data-i18n-skip':'','aria-haspopup':'dialog'},t('设置','Settings'));
      launcher.onclick=()=>{if(!dialog)build();dialog.showModal();dialog.querySelector('.preferences-search').focus();};
    }
    launcher.classList.toggle('md-outlined-action',host!==nav);
    launcher.textContent=t('设置','Settings');launcher.setAttribute('aria-label',t('设置','Settings'));
    if(launcher.parentElement!==host)host.append(launcher);
  }
  addEventListener('space:layout',mount);
  document.addEventListener('skymotion:header-ready',mount);
  document.addEventListener('skymotion:language',()=>{
    if(launcher){launcher.setAttribute('aria-label',t('设置','Settings'));launcher.title=t('设置','Settings');}
    if(dialog){window.SkyMaterial?.dismissSelect();const open=dialog.open,focusId=document.activeElement?.id;dialog.remove();dialog=null;if(open){build();dialog.showModal();(focusId&&dialog.querySelector('#'+CSS.escape(focusId))||dialog.querySelector('.preferences-search')).focus();}}
    mount();
  });
  // Registered before experiment shortcuts: a modal owns Escape even in a focused pane.
  addEventListener('keydown',event=>{
    if(!dialog?.open||event.key!=='Escape'||event.isComposing)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(window.SkyMaterial?.dismissSelect())return;
    if(!confirmation.hidden){confirmation.hidden=true;pendingImport=null;pendingReset=null;confirmTrigger?.focus();}
    else dialog.close();
  },true);
  document.addEventListener('DOMContentLoaded',()=>{mount();apply();},{once:true});
})();
