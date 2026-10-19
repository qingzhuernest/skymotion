/** One persistent customization switch, shared with the other scientific pages. */
(() => {
  if (window.spaceEmbedding?.enabled) return;
  let active = false;
  const launch = document.createElement('button');
  launch.type = 'button'; launch.className = 'layout-launch'; launch.dataset.i18nSkip = '';
  launch.setAttribute('aria-controls', 'diagram-tool-panel');
  document.querySelector('.head-actions').prepend(launch);
  const en = () => document.documentElement.lang.startsWith('en');
  function label() {
    launch.textContent = en() ? (active ? 'Finish customizing' : 'Customize') : (active ? '完成自定义' : '进入自定义');
    launch.setAttribute('aria-pressed', String(active));
  }
  function change(value) {
    if (active === value) return true;
    if (!value && window.SkyDiagramTools?.leave() === false) return false;
    active = value; document.body.classList.toggle('customization-active', active); label();
    document.dispatchEvent(new CustomEvent('skymotion:customization', {detail:{active}}));
    window.dispatchEvent(new Event('space:layout'));
    return true;
  }
  window.SkyCustomization = {get active(){return active;}, enter:()=>change(true), exit:()=>change(false)};
  launch.onclick = () => change(!active);
  function position() {
    const bar = document.querySelector('.language-nav'), actions = launch.closest('.language-actions');
    if (!bar || !actions) return;
    const immersive = document.body.classList.contains('space-immersive');
    const target = immersive ? document.querySelector('.head-actions') : bar;
    if (actions.parentElement !== target) target.prepend(actions);
  }
  new MutationObserver(position).observe(document.body, {attributes:true, attributeFilter:['class']});
  document.addEventListener('skymotion:language', () => {label();position();});
  document.addEventListener('DOMContentLoaded', position, {once:true});
  label();
})();
