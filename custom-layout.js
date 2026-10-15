/** An opt-in, browser-local layout for the linked solar diagrams. No scientific state is saved here. */
(() => {
  if (document.body.dataset.page !== 'diagrams' || typeof uiWorkspace === 'undefined' || !uiWorkspace) return;
  const shell = document.querySelector('.ui-shell'), grid = shell.querySelector('.ui-grid');
  const plot = shell.querySelector('.ui-plot'), rail = document.querySelector('.ui-parameters');
  const mobile = matchMedia('(max-width:760px)'), tablet = matchMedia('(max-width:1000px)');
  const ids = ['timeline','contextPanel','chartPanel','riseSetPanel','solarGeometryPanel','parameters'];
  const panels = new Map([
    ['timeline',shell.querySelector('.ui-timeline-host')],
    ...Object.entries(uiWorkspace.cards), ['parameters',rail],
  ]);
  const words = {
    customize:['自定义布局','Customize layout'], arrange:['调整布局','Arrange layout'], done:['完成','Done'],
    hint:['拖动把手调整顺序，拖动右下角调整大小。','Drag a handle to reorder; drag the bottom corner to resize.'],
    mobileHint:['拖动把手调整顺序，也可使用前移、后移按钮。','Drag a handle to reorder, or use the move buttons.'],
    undo:['撤销','Undo'], reset:['恢复默认布局','Reset layout'], standard:['标准布局','Standard layout'],
    saved:['布局已保存在此浏览器。','Layout saved in this browser.'], memory:['布局用于当前页面，浏览器未允许保存。','Layout applies to this page; browser storage is unavailable.'],
    move:['拖动面板','Move panel'], before:['前移','Move earlier'], after:['后移','Move later'],
    width:['宽度','Width'], third:['三分之一','One third'], half:['一半','Half'], full:['整行','Full row'],
    resize:['调整面板大小','Resize panel'], parameters:['实验参数','Experiment settings'], timeline:['时间与播放','Time and playback'],
    contextPanel:['直射点与昼夜','Subsolar point and day–night'], chartPanel:['全天太阳高度','Daily solar altitude'],
    riseSetPanel:['日出日落方位','Sunrise and sunset bearings'], solarGeometryPanel:['地轴与地平面',"Earth’s axis and horizon"],
  };
  const t = key => words[key][document.documentElement.lang === 'en' ? 1 : 0];
  const icon = path => `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${path}"/></svg>`;
  const grip = icon('M8 5h1m6 0h1M8 12h1m6 0h1M8 19h1m6 0h1');
  const defaults = () => ({version:1, enabled:false, panels:ids.map(id=>({id,span: id==='parameters'||id==='timeline'?12:6,height:id==='timeline'?220:400}))});
  const key = () => 'skymotion-layout-diagrams-v1-'+(mobile.matches?'narrow':'wide');
  const copy = value => JSON.parse(JSON.stringify(value));
  function load() {
    const fresh=defaults();
    try {
      const saved=JSON.parse(localStorage.getItem(key()));
      if (saved?.version!==1 || !Array.isArray(saved.panels) || saved.panels.length!==ids.length) return fresh;
      const seen=new Set();
      for (const p of saved.panels) {
        if (!ids.includes(p.id)||seen.has(p.id)||![4,6,12].includes(p.span)||!Number.isInteger(p.height)||p.height<220||p.height>760) return fresh;
        if(p.id==='timeline'&&p.span!==12)return fresh;
        seen.add(p.id);
      }
      return {version:1,enabled:saved.enabled===true,panels:saved.panels.map(p=>({id:p.id,span:p.span,height:p.height}))};
    } catch { return fresh; }
  }
  let data=load(), editing=false, gesture=null, undo=[], statusKey='', applying=false, wasActive=false;
  const launch=document.createElement('button'); launch.type='button'; launch.className='layout-launch'; launch.dataset.i18nSkip='';
  launch.disabled=true;
  if(typeof window.skySetLanguage==='function')document.addEventListener('skymotion:ready',()=>{launch.disabled=false;},{once:true});
  else Promise.resolve(window.skyFirstFontsReady).catch(()=>{}).then(()=>{launch.disabled=false;});
  launch.setAttribute('aria-controls','layoutTools'); shell.querySelector('.ui-heading').append(launch);
  const toolbar=document.createElement('section'); toolbar.id='layoutTools'; toolbar.className='layout-toolbar'; toolbar.dataset.i18nSkip='';
  const hint=document.createElement('p'), actions=document.createElement('div'), status=document.createElement('p');
  status.className='layout-status'; status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
  toolbar.append(hint,actions,status); shell.querySelector('.ui-heading').after(toolbar);
  function button(parent,word,fn,html) {
    const b=document.createElement('button'); b.type='button'; b.dataset.layoutWord=word;
    if(html)b.innerHTML=html; b.addEventListener('click',fn); parent.append(b); return b;
  }
  const undoButton=button(actions,'undo',()=>{if(!undo.length)return;data=undo.pop();persist();apply();});
  button(actions,'reset',()=>change(()=>{data={...defaults(),enabled:true};}));
  button(actions,'standard',()=>{cancelGesture();data.enabled=false;editing=false;persist();apply();launch.focus();});
  const controls=new Map();
  for(const [id,panel] of panels) {
    panel.dataset.layoutPanel=id;
    const tools=document.createElement('div'); tools.className='layout-panel-tools'; tools.dataset.i18nSkip='';
    const handle=button(tools,'move',()=>{},grip); handle.className='layout-handle'; handle.dataset.layoutHandle=id;
    const title=document.createElement('span'); title.className='layout-panel-name';tools.append(title);
    const earlier=button(tools,'before',()=>move(id,-1),icon('m8 14 4-4 4 4'));
    const later=button(tools,'after',()=>move(id,1),icon('m8 10 4 4 4-4'));
    const label=document.createElement('label');label.className='layout-width';
    const labelText=document.createElement('span'), select=document.createElement('select');
    for(const [span,word] of [[4,'third'],[6,'half'],[12,'full']]){const option=document.createElement('option');option.value=span;option.dataset.layoutWord=word;select.append(option);}
    select.disabled=id==='timeline';
    select.addEventListener('change',()=>change(()=>{data.panels.find(p=>p.id===id).span=Number(select.value);}));
    label.append(labelText,select);tools.append(label);panel.prepend(tools);
    const resize=button(panel,'resize',()=>{},icon('M9 19 19 9m-4 10 4-4'));resize.className='layout-resize';resize.dataset.layoutResize=id;resize.dataset.i18nSkip='';
    controls.set(id,{tools,handle,title,earlier,later,labelText,select,resize});
    handle.addEventListener('lostpointercapture',()=>{if(gesture?.id===id)cancelGesture();});resize.addEventListener('lostpointercapture',()=>{if(gesture?.id===id)cancelGesture();});
    handle.addEventListener('pointerdown',event=>begin(event,id,false));resize.addEventListener('pointerdown',event=>begin(event,id,true));
    resize.addEventListener('keydown',event=>{
      if(!editing||!active()||mobile.matches||id==='timeline'||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();change(()=>{const p=data.panels.find(p=>p.id===id);if(event.key==='ArrowUp'||event.key==='ArrowDown')p.height=Math.max(280,Math.min(760,p.height+(event.key==='ArrowDown'?20:-20)));else{const spans=tablet.matches?[6,12]:[4,6,12],i=Math.max(0,spans.indexOf(p.span));p.span=spans[Math.max(0,Math.min(spans.length-1,i+(event.key==='ArrowRight'?1:-1)))];}});
    });
    handle.addEventListener('keydown',event=>{
      if(!editing||!active())return;
      if(['ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].includes(event.key)){
        event.preventDefault();move(id,event.key==='ArrowUp'||event.key==='ArrowLeft'?-1:1);
      }
    });
  }
  function active(){return data.enabled && state.body==='sun' && uiWorkspace.selected==='solarCompare';}
  function persist(){try{localStorage.setItem(key(),JSON.stringify(data));statusKey='saved';}catch{statusKey='memory';}}
  function change(fn){undo.push(copy(data));if(undo.length>20)undo.shift();fn();persist();apply();}
  function move(id,delta){const i=data.panels.findIndex(p=>p.id===id),next=i+delta;if(next<0||next>=ids.length)return;change(()=>{const p=data.panels.splice(i,1)[0];data.panels.splice(next,0,p);});controls.get(id).handle.focus({preventScroll:true});}
  function labels(){
    launch.textContent=t(editing?'done':active()?'arrange':'customize');launch.setAttribute('aria-expanded',String(editing));
    toolbar.setAttribute('aria-label',t('arrange'));hint.textContent=t(mobile.matches?'mobileHint':'hint');status.textContent=statusKey?t(statusKey):'';
    for(const b of actions.children)b.textContent=t(b.dataset.layoutWord);
    undoButton.disabled=!undo.length;
    for(const [id,c] of controls){
      c.title.textContent=t(id);c.labelText.textContent=t('width');
      c.handle.setAttribute('aria-label',t('move')+' · '+t(id));
      c.resize.setAttribute('aria-label',t('resize')+' · '+t(id));
      for(const b of [c.earlier,c.later]){b.setAttribute('aria-label',t(b.dataset.layoutWord)+' · '+t(id));b.title=t(b.dataset.layoutWord);}
      for(const option of c.select.options)option.textContent=t(option.dataset.layoutWord);
      const i=data.panels.findIndex(p=>p.id===id);c.earlier.disabled=i===0;c.later.disabled=i===ids.length-1;
    }
  }
  function apply(){
    if(applying)return;applying=true;
    const enabled=active();
    document.documentElement.classList.toggle('custom-layout-root',enabled);
    document.body.classList.toggle('custom-workspace',enabled);shell.classList.toggle('layout-active',enabled);shell.classList.toggle('layout-editing',enabled&&editing);
    toolbar.hidden=!(enabled&&editing);launch.hidden=state.body!=='sun';
    if(enabled){
      // Match DOM, reading and tab order to the visual order; retain every original node.
      for(const [index,p] of data.panels.entries()){
        const ordered=[...grid.children].filter(n=>n.dataset.layoutPanel);
        const node=panels.get(p.id);
        if(ordered[index]!==node)grid.insertBefore(node,ordered[index]||null);
      }
      rail.inert=false;rail.setAttribute('aria-hidden','false');
    }else{
      if(wasActive)for(const node of Object.values(uiWorkspace.cards))plot.append(node);
      const home=mobile.matches?document.querySelector('#uiParameterDrawer'):grid;
      if(home&&rail.parentElement!==home)home.append(rail);
      shell.skyRailSync?.();
    }
    wasActive=enabled;
    for(const [index,p] of data.panels.entries()){
      const panel=panels.get(p.id),c=controls.get(p.id);
      panel.style.setProperty('--layout-order',index);panel.style.setProperty('--layout-span',p.span);panel.style.setProperty('--layout-height',p.height+'px');c.select.value=p.span;
      c.tools.hidden=!(enabled&&editing);c.resize.hidden=!(enabled&&editing)||mobile.matches||p.id==='timeline';
    }
    labels();applying=false;schedule();
  }
  launch.addEventListener('click',()=>{
    if(!active()){
      if(uiWorkspace.selected!=='solarCompare')shell.querySelector('[data-diagram="solarCompare"]').click();
      renderUIWorkspace();data.enabled=true;editing=true;persist();
    }else editing=!editing;
    apply();
  });
  shell.querySelector('.ui-viewbar').addEventListener('click',event=>{
    if(event.target.closest('[data-diagram]')?.dataset.diagram!=='solarCompare'&&event.target.closest('[data-diagram]')){
      cancelGesture();data.enabled=false;editing=false;persist();apply();
    } else requestAnimationFrame(apply);
  });
  function cancelGesture(){
    if(!gesture)return;const g=gesture;gesture=null;
    cancelAnimationFrame(g.raf);clearInterval(g.scrollTimer);g.ghost.remove();panels.get(g.id).classList.remove('layout-moving');
    document.querySelectorAll('.layout-drop-target').forEach(p=>p.classList.remove('layout-drop-target'));
    document.body.classList.remove('layout-dragging');
    if(g.handle.hasPointerCapture(g.pointer))g.handle.releasePointerCapture(g.pointer);
  }
  function begin(event,id,resizing){
    if(event.button!==0||!editing||!active()||(resizing&&mobile.matches))return;
    event.preventDefault();event.stopPropagation();cancelGesture();
    const panel=panels.get(id),rect=panel.getBoundingClientRect(),ghost=document.createElement('div');
    ghost.className='layout-ghost';ghost.dataset.i18nSkip='';ghost.textContent=t(id);document.body.append(ghost);
    const handle=event.currentTarget;handle.setPointerCapture(event.pointerId);
    gesture={id,resizing,ghost,handle,pointer:event.pointerId,x:event.clientX,y:event.clientY,rect,raf:0,moved:false,target:null,span:data.panels.find(p=>p.id===id).span,height:data.panels.find(p=>p.id===id).height};
    ghost.style.left=(resizing?rect.left:event.clientX+14)+'px';ghost.style.top=(resizing?rect.top:event.clientY+14)+'px';
    if(resizing){ghost.style.width=rect.width+'px';ghost.style.height=rect.height+'px';}
    gesture.lastX=event.clientX;gesture.lastY=event.clientY;
    gesture.scrollTimer=setInterval(()=>{const g=gesture;if(!g||g.resizing||!g.moved)return;const y=g.lastY,dy=y<60?-18:y>innerHeight-60?18:0;if(dy){window.scrollBy(0,dy);onPointerMove({pointerId:g.pointer,clientX:g.lastX,clientY:y});}},50);
    panel.classList.add('layout-moving');document.body.classList.add('layout-dragging');
  }
  function onPointerMove(event){
    const g=gesture;if(!g||event.pointerId!==g.pointer)return;
    const x=event.clientX,y=event.clientY;g.lastX=x;g.lastY=y;g.moved ||= Math.hypot(x-g.x,y-g.y)>6;
    if(g.raf)cancelAnimationFrame(g.raf);
    g.raf=requestAnimationFrame(()=>{
      if(gesture!==g)return;
      if(g.resizing){
        const width=grid.getBoundingClientRect().width,desired=g.rect.width+x-g.x;
        const spans=tablet.matches?[6,12]:[4,6,12];g.span=spans.reduce((a,b)=>Math.abs(width*a/12-desired)<Math.abs(width*b/12-desired)?a:b);
        g.height=Math.max(280,Math.min(760,Math.round((g.rect.height+y-g.y)/20)*20));
        g.ghost.style.width=(width*g.span/12)+'px';g.ghost.style.height=g.height+'px';
      }else{
        g.ghost.style.transform=`translate(${x-g.x}px,${y-g.y}px)`;
        const candidates=[...panels].filter(([id,p])=>id!==g.id&&p.getClientRects().length);
        let best=Infinity;g.target=null;
        for(const [id,p] of candidates){const r=p.getBoundingClientRect();const inside=x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;const d=inside?-1:Math.hypot(x-Math.max(r.left,Math.min(x,r.right)),y-Math.max(r.top,Math.min(y,r.bottom)));if(d<best){best=d;g.target=id;g.after=y>r.top+r.height/2;}if(inside)break;}
        for(const [id,p] of panels)p.classList.toggle('layout-drop-target',id===g.target);
      }
      const r=grid.getBoundingClientRect();g.inside=x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
    });
  }
  window.addEventListener('pointermove',onPointerMove);
  function finish(event){
    const g=gesture;if(!g||event.pointerId!==g.pointer)return;
    const commit=event.type==='pointerup'&&g.moved&&(g.resizing||g.inside);
    cancelGesture();
    if(commit)change(()=>{
      if(g.resizing){const p=data.panels.find(p=>p.id===g.id);p.span=g.span;p.height=g.height;}
      else if(g.target){const from=data.panels.findIndex(p=>p.id===g.id),p=data.panels.splice(from,1)[0],to=data.panels.findIndex(p=>p.id===g.target);data.panels.splice(to+(g.after?1:0),0,p);}
    });
  }
  window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(gesture){e.preventDefault();cancelGesture();}else if(editing){editing=false;apply();launch.focus();}}});
  window.addEventListener('pagehide',cancelGesture);window.addEventListener('blur',cancelGesture);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelGesture();});
  document.addEventListener('skymotion:language',labels);
  mobile.addEventListener('change',()=>{cancelGesture();data=load();undo=[];editing=false;if(data.enabled&&state.body==='sun'){uiWorkspace.selected='solarCompare';renderUIWorkspace();}apply();});
  document.querySelectorAll('.body-switch button').forEach(b=>b.addEventListener('click',()=>{cancelGesture();editing=false;if(data.enabled&&state.body==='sun'){uiWorkspace.selected='solarCompare';renderUIWorkspace();}apply();}));
  window.addEventListener('popstate',()=>requestAnimationFrame(apply));
  const resize=new ResizeObserver(()=>{if(active())schedule();});for(const panel of panels.values())resize.observe(panel);
  if(data.enabled&&state.body==='sun'){
    uiWorkspace.selected='solarCompare';history.replaceState(history.state,'','#solarCompare');renderUIWorkspace();
  }
  apply();
})();
