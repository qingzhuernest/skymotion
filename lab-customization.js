/** A mode switch for the existing laboratory, preserving its native viewpoint controls. */
(() => {
  if(document.body.dataset.page!=='lab'||!uiWorkspace)return;
  let active=false;
  const launch=document.createElement('button');launch.type='button';launch.className='layout-launch';launch.dataset.i18nSkip='';launch.disabled=true;launch.setAttribute('aria-controls','stage');uiWorkspace.title.closest('.ui-heading').append(launch);
  function label(){launch.textContent=document.documentElement.lang.startsWith('en')?(active?'Finish customizing':'Customize'):(active?'完成自定义':'进入自定义');launch.setAttribute('aria-pressed',String(active));}
  function change(value){if(active===value)return true;if(!value&&(window.SkyLabComparison?.validate()===false||window.SkyDiagramTools?.leave?.()===false))return false;active=value;if(!active&&uiWorkspace.selected==='sceneBuilder')uiWorkspace.selected='contextPanel';document.body.classList.toggle('customization-active',active);label();document.dispatchEvent(new CustomEvent('skymotion:customization',{detail:{active}}));schedule();return true;}
  window.SkyCustomization={get active(){return active;},enter:()=>change(true),exit:()=>change(false)};
  launch.onclick=()=>change(!active);
  for(const b of document.querySelectorAll('[data-view],.ui-phase-button,.ui-moon-sky-button'))b.addEventListener('click',()=>{if(uiWorkspace.selected==='sceneBuilder'){uiWorkspace.selected='contextPanel';schedule();}});
  document.addEventListener('skymotion:language',label);document.addEventListener('skymotion:ready',()=>{launch.disabled=false;},{once:true});label();schedule();
})();
