/** Presentation-only motion. Astronomy state and canvas gestures remain independent. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const easing = 'cubic-bezier(.2,0,0,1)';
  const selected = button => button.classList.contains('active') ||
    button.getAttribute('aria-selected') === 'true' || button.getAttribute('aria-pressed') === 'true';

  function installSegments() {
    const selector = '.body-switch,.model-switch,.view-tabs,.context-view-switch,.globe-drag-options,.ui-viewbar,.ui-sundial-types,.sundial-view-controls,.ui-sundial-camera-tools [role="group"],.view-group';
    document.querySelectorAll(selector).forEach(group => {
      const buttons = [...group.children].filter(node => node.tagName === 'BUTTON');
      if (buttons.length < 2 || group.dataset.motionReady) return;
      group.dataset.motionReady = 'true';
      group.classList.add('motion-segments');
      const marker = document.createElement('span');
      marker.className = 'motion-selection';
      marker.setAttribute('aria-hidden', 'true');
      group.prepend(marker);
      let previous = null, animation = null;
      function update(animate = true) {
        const button = buttons.find(node => selected(node) && node.getClientRects().length);
        buttons.forEach(node => {
          if (node.classList.contains('motion-selected') !== (node === button))
            node.classList.toggle('motion-selected', node === button);
        });
        if (!button) { marker.hidden = true; previous = null; return; }
        if (animate && previous === button) return;
        const frame = group.getBoundingClientRect(), box = button.getBoundingClientRect();
        const next = { left: `${box.left - frame.left - group.clientLeft + group.scrollLeft}px`,
          top: `${box.top - frame.top - group.clientTop + group.scrollTop}px`,
          width: `${box.width}px`, height: `${box.height}px` };
        if (previous === button && Object.entries(next).every(([key, value]) => marker.style[key] === value)) return;
        const current = getComputedStyle(marker);
        const from = { left: current.left, top: current.top, width: current.width, height: current.height };
        animation?.cancel();
        Object.assign(marker.style, next);
        marker.hidden = false;
        if (animate && previous && previous !== button && !reduced.matches)
          animation = marker.animate([from, next], { duration: 260, easing });
        previous = button;
      }
      const observer = new MutationObserver(() => update());
      buttons.forEach(button => observer.observe(button, { attributes: true,
        attributeFilter: ['class', 'aria-selected', 'aria-pressed', 'hidden'] }));
      // Only our own class mutation changes once; repeated renders do not restart motion.
      new ResizeObserver(() => update(false)).observe(group);
      update(false);
    });
  }

  /** Default expanded on tablets/desktops; collapse is an explicit session preference. */
  function installRail({ shell, rail, button, mobile, openDrawer, overlay = () => false }) {
    if (!shell || !rail || !button || document.body.dataset.embedded === 'true') return;
    let collapsed = false;
    try { collapsed = sessionStorage.getItem('sky-menu-collapsed') === 'true'; } catch (_) {}
    rail.id ||= 'motionParameterRail';
    const handle = document.createElement('button');
    handle.type = 'button'; handle.className = 'motion-menu-edge';
    handle.textContent = '›'; handle.setAttribute('aria-label', '展开参数菜单，也可向右拖动');
    handle.title = '展开菜单 · 向右拖动'; shell.append(handle);
    const grip = document.createElement('button');
    grip.type = 'button'; grip.className = 'motion-menu-grip';
    grip.textContent = '‹ 收起菜单'; grip.title = '点击或向左拖动收起菜单';
    rail.prepend(grip);
    function sync() {
      const modal = mobile.matches || overlay();
      shell.classList.toggle('motion-rail-collapsed', collapsed && !modal);
      rail.inert = collapsed && !modal;
      rail.setAttribute('aria-hidden', String(collapsed && !modal));
      grip.hidden = modal; handle.hidden = modal || !collapsed;
      button.hidden = !modal;
      button.setAttribute('aria-controls', modal ? (button.id === 'spaceParameters' ? 'spaceDrawer' : 'uiParameterDrawer') : rail.id);
      if (modal) button.setAttribute('aria-haspopup', 'dialog');
      else {
        button.removeAttribute('aria-haspopup');
        button.setAttribute('aria-expanded', String(!collapsed));
      }
      const label = button.querySelector('span');
      if (label) label.textContent = modal ? '参数' : collapsed ? '展开菜单' : '收起菜单';
      else button.textContent = modal ? '参数' : collapsed ? '展开菜单' : '收起菜单';
      button.setAttribute('aria-label', modal ? '打开实验参数菜单' : collapsed ? '展开实验参数菜单' : '收起实验参数菜单');
    }
    function setCollapsed(value) {
      collapsed = value;
      try { sessionStorage.setItem('sky-menu-collapsed', String(value)); } catch (_) {}
      sync();
    }
    button.onclick = () => mobile.matches || overlay() ? openDrawer() : setCollapsed(!collapsed);
    grip.onclick = () => { setCollapsed(true); handle.focus({ preventScroll: true }); };
    handle.onclick = () => { setCollapsed(false); grip.focus({ preventScroll: true }); };
    function gesture(surface, opening) {
      let start = null, dragged = false;
      surface.style.touchAction = 'pan-y';
      surface.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        start = { id: event.pointerId, x: event.clientX, y: event.clientY };
        dragged = false; surface.setPointerCapture(event.pointerId);
      });
      surface.addEventListener('pointermove', event => {
        if (!start || event.pointerId !== start.id) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          dragged = true;
          surface.style.transform = `translateX(${Math.max(-20, Math.min(20, dx * .2))}px)`;
        }
      });
      function end(event) {
        if (!start || event.pointerId !== start.id) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        start = null; surface.style.transform = '';
        if (event.type === 'pointerup' && Math.abs(dy) < 40 && (opening ? dx > 40 : dx < -40))
          { setCollapsed(!opening); (opening ? grip : handle).focus({ preventScroll: true }); }
      }
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => surface.addEventListener(type, end));
      surface.addEventListener('click', event => {
        if (dragged) { event.preventDefault(); event.stopImmediatePropagation(); dragged = false; }
      }, true);
    }
    gesture(handle, true); gesture(grip, false);
    mobile.addEventListener('change', sync);
    window.addEventListener('space:layout', sync);
    document.addEventListener('close', event => {
      if (event.target.tagName === 'DIALOG' && !mobile.matches && !overlay()) sync();
    }, true);
    sync(); return sync;
  }
  window.SkyMotionUI = { installRail, installSegments };
  document.addEventListener('DOMContentLoaded', installSegments, { once: true });
})();
