/** Common comparisons live beside the Lab's original date and location controls. */
(() => {
  if(document.body.dataset.page!=='lab')return;
  const en=()=>document.documentElement.lang.startsWith('en');
  const tr=value=>value.split('|')[en()?1:0];
  const api=()=>window.SkyDiagramTools.comparisons;
  const node=(tag,cls,parent)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(parent)parent.append(n);return n;};
  const panel=node('details','menu-section lab-comparisons');panel.id='labComparisons';panel.hidden=true;panel.open=true;panel.dataset.i18nSkip='';
  document.querySelector('#controls .section-head').after(panel);
  const summary=node('summary','',panel),content=node('div','menu-content',panel);
  const intro=node('p','micro',content);
  const originNote=node('p','micro');
  const cityHelp=node('p','micro');
  const build=node('button','lc-add',content);build.type='button';build.dataset.comparisonAction='build';build.onclick=()=>{if(validate())window.SkySceneBuilder?.open();};
  const timeTitle=node('h3','',content),timeList=node('div','lc-list',content),timeEmpty=node('p','micro',content);
  const addTime=node('button','lc-add',content);addTime.type='button';addTime.dataset.comparisonAction='time';
  const cityTitle=node('h3','',content),basisSlot=node('div','lc-basis',content);
  basisSlot.append(document.querySelector('.observer-link-settings'));basisSlot.append(cityHelp);
  const cityList=node('div','lc-list',content),cityEmpty=node('p','micro',content);
  const cityAdder=node('div','lc-city-add',content),cityChoice=node('select','',cityAdder),addCity=node('button','',cityAdder);
  addCity.type='button';addCity.dataset.comparisonAction='observer';
  for(const option of document.querySelectorAll('#place option')){if(option.value==='custom')continue;const o=option.cloneNode(true);cityChoice.append(o);}
  cityChoice.value='51.5,-0.1';
  intro.after(build);content.append(originNote);
  const history=node('div','lc-history',content),undo=node('button','',history),redo=node('button','',history);undo.type=redo.type='button';undo.dataset.comparisonHistory='undo';redo.dataset.comparisonHistory='redo';
  const status=node('p','micro lc-status',content);status.setAttribute('role','status');
  const rows=new Map();let menuRow=null,serial=0;
  const menu=node('div','lc-menu',content);menu.id='lab-comparison-menu';menu.setAttribute('popover','auto');menu.setAttribute('role','menu');
  const actions={};for(const action of ['save','duplicate','remove']){const b=node('button','',menu);b.type='button';b.setAttribute('role','menuitem');b.tabIndex=-1;actions[action]=b;b.onclick=()=>{if(!validate())return;const {source,id}=menuRow.ref,ok=action==='save'?api().save(source):api()[action](source,id);menu.hidePopover();message(ok?(action==='save'?'已保存到此设备。|Saved to this device.':'已更新对照。|Comparison updated.'):'无法完成；保存不可用时可在图内自定义中导出备份。|Could not complete. Export a backup from Customize plot if saving is unavailable.');sync();};}
  function message(value){status.textContent=tr(value);}
  function validate(){if(panel.hidden)return true;const bad=content.querySelector('[aria-invalid=true]');if(!bad)return true;if(menu.matches(':popover-open'))menu.hidePopover();panel.open=true;document.getElementById('conditionsMenu').open=true;bad.focus();bad.scrollIntoView({block:'nearest'});return false;}
  function changed(row,input,key){
    let value=input.value;
    if(['lat','lon'].includes(key))value=value.trim()===''?NaN:Number(value);
    if(key==='time'){const match=/^(\d{2}):(\d{2})$/.exec(value);value=match&&Number(match[2])<60&&(Number(match[1])<24||match[1]==='24'&&match[2]==='00')?Number(match[1])*60+Number(match[2]):NaN;}
    const valid=key==='label'?value.trim().length>0&&value.length<=60:key==='lat'?Number.isFinite(value)&&Math.abs(value)<=90:key==='lon'?Number.isFinite(value)&&Math.abs(value)<=180:Number.isFinite(value)&&value>=0&&value<=1440;
    if(!valid){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',row.error.id);row.error.hidden=false;row.error.textContent=tr(key==='label'?'请输入名称（最多 60 字）。|Enter a name of up to 60 characters.':key==='time'?'请输入 00:00—24:00 的时刻。|Enter a time from 00:00 to 24:00.':'请输入有效经纬度：纬度 ±90°、经度 ±180°。|Enter valid coordinates: latitude ±90°, longitude ±180°.');return;}
    input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');row.error.hidden=!row.element.querySelector('[aria-invalid=true]');
    if(!api().patch(row.ref.source,row.ref.id,{[key]:value})){message('请先修正未完成的输入，或关闭图内编辑后重试。|Correct unfinished fields or close the plot editor and retry.');sync();}else message('有未保存的对照修改。|Unsaved comparison changes.');
  }
  function field(row,key,label,type='number'){
    const wrap=node('label','',row.fields),caption=node('span','',wrap),input=node('input','',wrap);input.type=type;input.dataset.comparisonField=key;input.id='lc-field-'+ ++serial;caption.dataset.label=label;input.onchange=()=>changed(row,input,key);input.onkeydown=e=>{if(e.isComposing)return;if(e.key==='Enter'){e.preventDefault();changed(row,input,key);}if(e.key==='Escape'){const raw=row.ref[key];input.value=key==='time'?clock(raw):raw;input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');row.error.hidden=!row.element.querySelector('[aria-invalid=true]');}};
    if(key==='label')input.maxLength=60;if(key==='time'){input.inputMode='numeric';input.placeholder='HH:MM';input.maxLength=5;}
    if(key==='lat'||key==='lon'){input.min=key==='lat'?-90:-180;input.max=key==='lat'?90:180;input.step='any';}
    row.inputs[key]=input;return input;
  }
  function createRow(ref){
    const element=node(ref.type==='observer'?'details':'div','lc-row'),row={element,inputs:{},ref};
    row.line=node(ref.type==='observer'?'summary':'div','lc-row-line',element);row.name=node('span','lc-name',row.line);
    const visibility=node('label','lc-visible',row.line);row.visibility=node('input','',visibility);row.visibility.type='checkbox';row.visibility.onchange=e=>{e.stopPropagation();if(!validate()||!api().patch(row.ref.source,row.ref.id,{visible:row.visibility.checked}))sync();};visibility.onclick=e=>e.stopPropagation();
    row.more=node('button','lc-more',row.line);row.more.type='button';row.more.setAttribute('aria-haspopup','menu');row.more.setAttribute('aria-controls',menu.id);row.more.setAttribute('aria-expanded','false');row.more.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>';
    row.more.onclick=e=>{e.preventDefault();e.stopPropagation();if(!validate())return;menuRow=row;menu.showPopover();const r=row.more.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(innerWidth-menu.offsetWidth-8,r.right-menu.offsetWidth))+'px';menu.style.top=Math.max(8,r.top-menu.offsetHeight-6)+'px';row.more.setAttribute('aria-expanded','true');menu.querySelector('button')?.focus();};
    row.fields=node('div','lc-fields',element);
    if(ref.type==='observer'){field(row,'label','名称|Name','text');field(row,'lat','纬度 / °|Latitude / °');field(row,'lon','经度 / °|Longitude / °');}
    else{field(row,'time','当地真太阳时|Local apparent solar time','text');row.line.prepend(row.inputs.time.parentElement);row.fields.hidden=true;row.name.hidden=true;}
    row.error=node('p','micro lc-error',element);row.error.id='lc-error-'+ ++serial;row.error.hidden=true;
    return row;
  }
  function clock(time){const minute=Math.round(time);return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');}
  addTime.onclick=()=>{if(!validate())return;const id=api().add('time',{time:Math.round(state.time)});if(!id){message('最多 40 个对象；请先删除一些对象。|Up to 40 objects; remove some first.');return;}sync();message('有未保存的对照修改。|Unsaved comparison changes.');const row=rows.get('lab-sky:'+id);row?.inputs.time.focus();};
  addCity.onclick=()=>{if(!validate())return;const [lat,lon]=cityChoice.value.split(',').map(Number),text=cityChoice.selectedOptions[0].textContent,dictionary=window.skyEnglishDictionary||{},chinese=Object.keys(dictionary).find(k=>dictionary[k]===text)||text,label=chinese.split(' · ')[0]+'|'+(dictionary[chinese]||text).split(' · ')[0],id=api().add('observer',{lat,lon,label,customLabel:false});if(!id){message('最多 40 个对象；请先删除一些对象。|Up to 40 objects; remove some first.');return;}sync();message('有未保存的对照修改。|Unsaved comparison changes.');const row=rows.get('lab-sky:'+id);if(row){row.element.open=true;row.inputs.label.focus();}};
  for(const [button,direction]of [[undo,'undo'],[redo,'redo']])button.onclick=()=>{if(validate()){api().travel(direction);sync();}};
  menu.addEventListener('toggle',e=>{if(e.newState==='closed')menuRow?.more.setAttribute('aria-expanded','false');});
  menu.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();menu.hidePopover();menuRow?.more.focus();}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const choices=[...menu.querySelectorAll('button')],i=choices.indexOf(document.activeElement);choices[e.key==='Home'?0:e.key==='End'?choices.length-1:(i+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length].focus();}});
  function sync(){
    const visible=window.SkyCustomization?.active===true,sun=state.body==='sun';panel.hidden=!visible;if(!visible){if(menu.matches(':popover-open'))menu.hidePopover();return;}
    for(const n of [timeTitle,timeList,timeEmpty,addTime,cityTitle,basisSlot,cityList,cityEmpty,cityAdder,history,status])n.hidden=!sun;
    summary.textContent=tr(sun?'地点与时间对照|Compare places and times':'实验物体与参考|Experiment objects');intro.textContent=tr(sun?'基准地点和日期在“日期与地点”中调整；当前时刻使用下方时间栏。添加的对照会显示在原图中。|Set the baseline in Date and location and the current time on the timeline. Comparisons appear in the original plot.':'在当前地点的地面上摆放物体，以月球方向作几何投影。地点和时刻仍用原来的控制调整。|Place objects on the ground at the current observation site, with geometric projections along the Moon direction. Keep using the original location and time controls.');
    originNote.textContent=tr('小圈表示原有观察者；自定义不会自动添加物体，已保存的对象会恢复。|The center ring marks the original observer. No objects are added automatically; saved objects reappear.');
    build.textContent=tr('摆放杆、球与参考圈|Place rods, spheres and circles');
    cityHelp.textContent=tr(state.observerTimeBasis==='utc'&&!state.manual?'固定同一 UTC 瞬间；添加城市后，各地太阳位置同步变化。|One shared UTC instant: added cities show their local solar positions together.':'当前按各地相同真太阳时比较；要比较同一瞬间，请在上方选择“固定同一瞬间（UTC）”。|Currently comparing equal local apparent solar times. To compare one instant, choose the shared UTC option above.');
    timeTitle.textContent=tr('同一地点 · 不同时间|One place · different times');cityTitle.textContent=tr('同一时间 · 不同地点|One time · different places');
    timeEmpty.textContent=tr('记录几个时刻，在原天空图中比较。|Pin times to compare them in the original sky.');cityEmpty.textContent=tr('添加地点；展开城市名称即可改经纬度。|Add a place; expand its name to edit coordinates.');
    addTime.textContent=tr('记录当前时刻|Pin current time');addCity.textContent=tr('添加地点|Add place');cityChoice.setAttribute('aria-label',tr('选择对照地点|Choose comparison place'));
    const originalOptions=[...document.querySelectorAll('#place option')];for(const option of cityChoice.options){const original=originalOptions.find(x=>x.value===option.value);if(original)option.textContent=original.textContent;}
    const basis=document.querySelector('[data-link-label=basis]');if(basis?.closest('.lc-basis'))basis.textContent=tr('对照时间规则|Comparison time basis');
    undo.textContent=tr('撤销|Undo');redo.textContent=tr('重做|Redo');const historyState=api().history();undo.disabled=!historyState.undo;redo.disabled=!historyState.redo;
    for(const [key,label]of Object.entries({save:'保存|Save',duplicate:'复制|Duplicate',remove:'删除|Delete'}))actions[key].textContent=tr(label);
    if(!sun)return;
    const refs=api().list(),keys=new Set(refs.map(o=>o.source+':'+o.id));
    for(const [key,row]of rows)if(!keys.has(key)){if(menuRow===row&&menu.matches(':popover-open'))menu.hidePopover();row.element.remove();rows.delete(key);}
    for(const ref of refs){const key=ref.source+':'+ref.id;let row=rows.get(key);if(!row){row=createRow(ref);rows.set(key,row);(ref.type==='observer'?cityList:timeList).append(row.element);}row.ref=ref;row.element.dataset.comparisonId=ref.id;row.element.dataset.comparisonSource=ref.source;row.name.textContent=ref.customLabel?ref.label:tr(ref.label);row.visibility.checked=ref.visible;row.visibility.setAttribute('aria-label',tr('显示|Show')+' '+row.name.textContent);row.more.setAttribute('aria-label',tr('更多操作|More actions')+' · '+row.name.textContent);
      for(const [key,input]of Object.entries(row.inputs)){input.parentElement.querySelector('span').textContent=tr(input.parentElement.querySelector('span').dataset.label);input.disabled=ref.locked&&['lat','lon','time'].includes(key);if(input!==document.activeElement&&!input.hasAttribute('aria-invalid'))input.value=key==='time'?clock(ref.time):['lat','lon'].includes(key)?Number(ref[key].toFixed(4)):key==='label'&&!ref.customLabel?tr(ref.label):ref[key];}
    }
    timeEmpty.hidden=refs.some(o=>o.type==='time');cityEmpty.hidden=refs.some(o=>o.type==='observer');
  }
  window.SkyLabComparison={sync,validate};
  document.addEventListener('skymotion:references',sync);
  document.addEventListener('skymotion:language',sync);
  document.addEventListener('skymotion:customization',()=>{if(window.SkyCustomization.active){document.getElementById('conditionsMenu').open=true;panel.open=true;}sync();});
  sync();
})();
