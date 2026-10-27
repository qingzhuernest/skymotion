/** Transfer edit intent once on internal navigation; refreshing stays in normal mode. */
(() => {
  if(!['lab','diagrams'].includes(document.body.dataset.page))return;
  const key='sky-customization-next-page';
  // GPT Site redirects static filenames to clean URLs. Treat both as one route.
  const route=path=>typeof path==='string'?path.replace(/\.html$/,'').replace(/\/$/,''):'';
  let transfer=false;
  try{
    const pending=JSON.parse(sessionStorage.getItem(key));
    sessionStorage.removeItem(key);
    transfer=performance.getEntriesByType('navigation')[0]?.type!=='reload'&&
      pending?.active===true&&route(pending.path)===route(location.pathname)&&
      Date.now()-pending.at<15000&&document.referrer.startsWith(location.origin+'/');
  }catch{}
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');
    if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank')return;
    const url=new URL(a.href,location.href);
    if(route(url.pathname)===route(location.pathname)||url.origin!==location.origin||
       !/(?:lab|diagrams)(?:\.en)?(?:\.html)?\/?$/.test(url.pathname))return;
    if(window.SkyCustomization?.active&&(window.SkyLabComparison?.validate()===false||window.SkyDiagramTools?.leave()===false)){e.preventDefault();return;}
    try{sessionStorage.setItem(key,JSON.stringify({path:route(url.pathname),at:Date.now(),active:window.SkyCustomization?.active===true}));}catch{}
  });
  document.addEventListener('skymotion:ready',()=>{if(transfer)window.SkyCustomization?.enter();},{once:true});
})();
