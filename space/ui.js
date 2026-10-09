/** Move a single parameter panel between the desktop rail and mobile dialog. */
(() => {
  const drawer = document.getElementById('spaceDrawer');
  const opener = document.getElementById('spaceParameters');
  const closer = document.getElementById('spaceDrawerClose');
  const panel = document.querySelector('.side');
  const home = document.getElementById('spaceSidebarHost');
  const mobile = matchMedia(
    '(max-width:900px), (pointer:coarse) and (max-width:1400px), (max-height:500px) and (max-width:1100px)',
  );
  function sync() {
    const overlay = mobile.matches || document.body.classList.contains('space-immersive');
    if (!overlay && drawer.open) drawer.close();
    (overlay ? document.getElementById('spaceDrawerBody') : home).append(panel);
    opener.setAttribute('aria-expanded', String(drawer.open));
  }
  opener.onclick = () => {
    sync();
    drawer.showModal();
    opener.setAttribute('aria-expanded', 'true');
  };
  closer.onclick = () => drawer.close();
  drawer.addEventListener('close', () => {
    opener.setAttribute('aria-expanded', 'false');
    opener.focus({ preventScroll: true });
  });
  drawer.addEventListener('click', (event) => {
    const r = drawer.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      drawer.close();
  });
  let start = null;
  const handle = drawer.querySelector('.drawer-head');
  handle.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointerup', (event) => {
    if (
      start?.id === event.pointerId &&
      event.clientX - start.x < -55 &&
      Math.abs(event.clientY - start.y) < 50
    )
      drawer.close();
    start = null;
  });
  handle.addEventListener('pointercancel', () => {
    start = null;
  });
  mobile.addEventListener('change', sync);
  window.addEventListener('space:layout', sync);
  sync();
})();
