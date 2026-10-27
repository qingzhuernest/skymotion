/** Full-window observation reuses the existing renderer, controls and scientific clock. */
(() => {
  'use strict';
  const button = document.getElementById('spaceImmersive');
  const drawer = document.getElementById('spaceDrawer');
  if (!button || window.spaceEmbedding?.enabled) {
    if (button) button.hidden = true;
    return;
  }
  let active = false;
  let previousScroll = 0;

  function layout(next) {
    if (active === next) return;
    if (next) previousScroll = window.scrollY;
    for (const openDialog of document.querySelectorAll('dialog[open]')) openDialog.close();
    active = next;
    document.body.classList.toggle('space-immersive', active);
    button.textContent = active ? '退出沉浸' : '沉浸观察';
    button.setAttribute('aria-pressed', String(active));
    window.dispatchEvent(new Event('space:layout'));
    if (!active) {
      window.scrollTo(0, previousScroll);
      button.focus({ preventScroll: true });
    }
  }

  function enter() {
    layout(true);
  }
  function exit() {
    layout(false);
  }
  button.addEventListener('click', () => {
    if (active) exit();
    else enter();
  });
  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      active &&
      !event.defaultPrevented &&
      !document.querySelector('dialog[open]')
    )
      void exit();
  });
  window.SkyMotionImmersiveHistory = {
    read: () => active,
    restore: (next) => {
      if (next) layout(true);
      else void exit();
    },
  };
  if (new URLSearchParams(location.search).get('immersive') === '1') enter();
})();
