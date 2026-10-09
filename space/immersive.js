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
  let ownsFullscreen = false;
  let previousScroll = 0;
  let fullscreenPending = false;

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

  async function enter(requestFullscreen) {
    layout(true);
    if (
      !requestFullscreen ||
      !document.documentElement.requestFullscreen ||
      document.fullscreenElement
    )
      return;
    fullscreenPending = true;
    button.disabled = true;
    try {
      await document.documentElement.requestFullscreen();
      ownsFullscreen = true;
    } catch {
      // Safari/iOS or browser restrictions: the same full-window layout remains usable.
      ownsFullscreen = false;
    } finally {
      fullscreenPending = false;
      button.disabled = false;
    }
  }
  async function exit() {
    layout(false);
    if (ownsFullscreen && document.fullscreenElement) {
      ownsFullscreen = false;
      try {
        await document.exitFullscreen();
      } catch {
        /* The viewport layout has already restored. */
      }
    }
  }
  button.addEventListener('click', () => {
    if (fullscreenPending) return;
    if (active) void exit();
    else void enter(true);
  });
  document.addEventListener('fullscreenchange', () => {
    if (ownsFullscreen && !document.fullscreenElement) {
      ownsFullscreen = false;
      layout(false);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      active &&
      !document.querySelector('dialog[open]') &&
      !fullscreenPending
    )
      void exit();
  });
  if (new URLSearchParams(location.search).get('immersive') === '1') void enter(false);
})();
