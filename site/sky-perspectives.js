/** Independent projection surfaces sharing the original sky renderer, ephemeris and clock. */
(() => {
  if(!uiWorkspace||!document.body.hasAttribute('data-entry-view'))return;
  const modes={orbit:'skyPanel',top:'skyTopPanel',horizon:'skyHorizonPanel',observer:'skyObserverPanel'};
  const cameras={},surfaces=new Map();let signature='';
  const initial=view=>({view,yaw:-.55,pitch:.38,zoom:1,observerAz:180});
  for(const view of Object.keys(modes))cameras[view]=initial(view);
  const normalize=snapshot=>{
    const result={};if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))return result;
    for(const view of Object.keys(modes)){
      const camera=snapshot[view];if(!camera||typeof camera!=='object')continue;
      if(!['yaw','pitch','zoom','observerAz'].every(k=>Number.isFinite(camera[k])))continue;
      if(camera.zoom<.5||camera.zoom>2||camera.pitch<.05||camera.pitch>1.45||camera.observerAz<0||camera.observerAz>=360)continue;
      result[view]={...initial(view),...Object.fromEntries(['yaw','pitch','zoom','observerAz'].map(k=>[k,camera[k]]))};
    }return result;
  };
  for(const [view,id] of Object.entries(modes)){
    if(view==='orbit')continue;
    const card=document.createElement('section');card.className='ui-diagram-card';card.dataset.diagramCard=id;card.hidden=true;
    const head=document.createElement('div');head.className='ui-diagram-card-head';head.append(document.createElement('h2'));
    const surface=document.createElement('div');surface.className='sky-perspective-surface';surface.id=id+'-surface';surface.hidden=true;
    const canvas=document.createElement('canvas');canvas.id=id+'-canvas';canvas.tabIndex=0;canvas.style.touchAction='none';installSkyTrackScrub(canvas);
    canvas.setAttribute('aria-label',SkySiteCatalog.label(id,state.body)[0]);surface.append(canvas);
    const holder=document.createElement('div');holder.className='ui-diagram-surface';holder.append(surface);card.append(head,holder);uiWorkspace.plot.append(card);
    uiWorkspace.cards[id]=card;uiWorkspace.nodes.push(surface);surfaces.set(view,canvas);
    let drag=null;
    const persist=()=>window.skyWorkspacePresentation?.updateSkyCamera(view,cameras[view]);
    canvas.addEventListener('pointerdown',event=>{if(event.button!==0||event.defaultPrevented||view!=='observer')return;drag={id:event.pointerId,x:event.clientX,initial:{...cameras[view]}};canvas.setPointerCapture(event.pointerId);});
    canvas.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;cameras[view].observerAz=((drag.initial.observerAz-(event.clientX-drag.x)*.22)%360+360)%360;schedule();});
    canvas.addEventListener('pointerup',()=>{if(!drag)return;drag=null;persist();});
    for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{if(drag){cameras[view]={...drag.initial};drag=null;schedule();}});
    canvas.addEventListener('wheel',event=>{if(view!=='top')return;event.preventDefault();cameras[view].zoom=clamp(cameras[view].zoom*Math.exp(-event.deltaY*.001),.5,2);persist();schedule();},{passive:false});
    canvas.addEventListener('keydown',event=>{
      if(event.isComposing||event.ctrlKey||event.metaKey||event.altKey)return;
      if(view==='observer'&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();cameras[view].observerAz=(cameras[view].observerAz+(event.key==='ArrowLeft'?-5:5)+360)%360;persist();schedule();}
      if(event.key.toLowerCase()==='r'){event.preventDefault();cameras[view]=initial(view);persist();schedule();}
    });
  }
  window.SkyPerspectives={
    ids:modes,isSky:id=>Object.values(modes).includes(id),viewFor:id=>Object.keys(modes).find(view=>modes[view]===id),normalize,
    snapshot:()=>normalize(cameras),
    restore(snapshot){const nextSignature=state.body+JSON.stringify(snapshot||{});if(signature===nextSignature)return;signature=nextSignature;const normalized=normalize(snapshot);for(const view of Object.keys(modes))cameras[view]=normalized[view]||initial(view);},
    primaryView:()=>window.skyWorkspacePresentation?.active?'orbit':state.view,
    primaryDisplay:()=>window.skyWorkspacePresentation?.active?{...motionCamera(),view:'orbit'}:null,
    select(view){const api=window.skyWorkspacePresentation;if(!api?.active)return false;api.selectView(modes[view]);schedule();return true;},
    draw(){for(const [view,canvas]of surfaces)if(canPaint(canvas))drawSkyScene(state.body,canvas,cameras[view]);}
  };
})();
