/** Move a single parameter panel between the desktop rail and mobile dialog. */
(() => {
  const drawer = document.getElementById('spaceDrawer');
  const opener = document.getElementById('spaceParameters');
  const closer = document.getElementById('spaceDrawerClose');
  const panel = document.querySelector('.side');
  const home = document.getElementById('spaceSidebarHost');
  const mobile = matchMedia('(max-width:760px)');
  function sync() {
    const overlay = mobile.matches || document.body.classList.contains('space-immersive');
    if (!overlay && drawer.open) {
      generation++; animation?.cancel(); closing = false;
      drawer.style.transform = ''; drawer.close();
    }
    (overlay ? document.getElementById('spaceDrawerBody') : home).append(panel);
    opener.setAttribute('aria-expanded', String(drawer.open));
  }
  let closing = false, animation = null, generation = 0;
  const lowMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function closeDrawer() {
    if (!drawer.open || closing) return;
    closing = true;
    const token = ++generation;
    animation?.cancel();
    animation = lowMotion.matches ? null : SkyMotionUI.springPanel(drawer,
      [{transform: drawer.style.transform || 'translateX(0)'}, {transform: 'translateX(-100%)'}]);
    (animation?.finished.catch(() => {}) || Promise.resolve()).then(() => {
      if (token !== generation) return;
      drawer.style.transform = ''; drawer.close(); closing = false;
    });
  }
  const openDrawer = () => {
    sync();
    generation++; closing = false; animation?.cancel();
    drawer.style.transform = '';
    if (!drawer.open) drawer.showModal();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
      animation = SkyMotionUI.springPanel(drawer, [{transform: 'translateX(-100%)'}, {transform: 'translateX(0)'}]);
    opener.setAttribute('aria-expanded', 'true');
  };
  closer.onclick = closeDrawer;
  drawer.addEventListener('cancel', event => { event.preventDefault(); closeDrawer(); });
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
      closeDrawer();
  });
  let start = null;
  const handle = drawer.querySelector('.drawer-head');
  handle.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    handle.setPointerCapture(event.pointerId);
  });
  handle.style.touchAction = 'pan-y';
  handle.addEventListener('pointermove', event => {
    if (start?.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) * 1.5) drawer.style.transform = `translateX(${Math.min(0, dx)}px)`;
  });
  handle.addEventListener('pointerup', (event) => {
    if (
      start?.id === event.pointerId &&
      event.clientX - start.x < -55 &&
      Math.abs(event.clientY - start.y) < 50
    )
      closeDrawer();
    start = null;
    if (!closing) drawer.style.transform = '';
  });
  handle.addEventListener('pointercancel', () => {
    start = null;
    if (!closing) drawer.style.transform = '';
  });
  mobile.addEventListener('change', sync);
  window.addEventListener('space:layout', sync);
  sync();
  SkyMotionUI.installRail({ shell: document.querySelector('.space-shell'), rail: panel,
    button: opener, mobile, openDrawer, overlay: () => document.body.classList.contains('space-immersive') });
})();
