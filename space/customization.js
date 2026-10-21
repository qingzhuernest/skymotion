/** One persistent customization switch, shared with the other scientific pages. */
(() => {
  if (window.spaceEmbedding?.enabled) return;
  let active = false;
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'layout-launch';
  launch.dataset.i18nSkip = '';
  launch.setAttribute('aria-controls', 'diagram-tool-panel');
  document.querySelector('.head-actions').prepend(launch);
  SkyCustomizationMode.install({
    launch,
    isActive: () => active,
    apply(value) {
      active = value;
    },
    changed() {
      window.dispatchEvent(new Event('space:layout'));
    },
  });
  function position() {
    const bar = document.querySelector('.language-nav'),
      actions = launch.closest('.language-actions');
    if (!bar || !actions) return;
    const immersive = document.body.classList.contains('space-immersive');
    const target = immersive ? document.querySelector('.head-actions') : bar;
    if (actions.parentElement !== target) {
      if (immersive) target.prepend(actions);
      else target.append(actions);
    }
  }
  new MutationObserver(position).observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  });
  document.addEventListener('skymotion:language', position);
  document.addEventListener('DOMContentLoaded', position, { once: true });
})();
