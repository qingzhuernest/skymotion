/** Presentation-only motion. Astronomy state and canvas gestures remain independent. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const easing = 'cubic-bezier(.2,0,0,1)';
  const springEasing = 'linear';

  function springFrames(from, to) {
    const frame = (progress, offset) =>
      Object.fromEntries([
        ['offset', offset],
        ...Object.keys(to).map((key) => {
          const start = parseFloat(from[key]),
            end = parseFloat(to[key]);
          const value = start + (end - start) * progress;
          return [key, `${key === 'width' || key === 'height' ? Math.max(1, value) : value}px`];
        }),
      ]);
    return [frame(0, 0), frame(1.065, 0.68), frame(0.985, 0.86), frame(1, 1)];
  }

  function springPanel(element, frames, duration = 420) {
    const width = element.getBoundingClientRect().width;
    const pixels = (transform) => {
      const value = /translateX\(([-.\d]+)(%|px)?\)/.exec(transform);
      return value ? Number(value[1]) * (value[2] === '%' ? width / 100 : 1) : 0;
    };
    const from = pixels(frames[0].transform),
      to = pixels(frames.at(-1).transform);
    return element.animate(
      [0, 1.085, 0.975, 1].map((progress, i) => ({
        transform: `translateX(${from + (to - from) * progress}px)`,
        offset: [0, 0.55, 0.79, 1][i],
        easing: i === 0 ? easing : 'ease-in-out',
      })),
      { duration: Math.max(420, duration), easing: springEasing },
    );
  }

  /** Native summary clicks (including keyboard clicks) keep a single, reversible fold. */
  function installDisclosures() {
    document
      .querySelectorAll('.ui-parameters details,.side details,.document-toc')
      .forEach((details) => {
        const summary = [...details.children].find((node) => node.tagName === 'SUMMARY');
        if (!summary) return;
        // Only this controller owns the fold. Native ::details-content height
        // transitions would otherwise run underneath the measured spring.
        details.classList.add('motion-disclosure');
        let animation = null,
          targetOpen = details.open,
          generation = 0;
        summary.addEventListener('click', (event) => {
          if (event.target.closest('a,button,input,select')) return;
          event.preventDefault();
          const from = details.getBoundingClientRect().height;
          animation?.cancel();
          const token = ++generation;
          targetOpen = animation ? !targetOpen : !details.open;
          animation = null;
          details.style.height = '';
          details.style.overflow = '';
          if (reduced.matches) {
            details.open = targetOpen;
            return;
          }
          // Measure the summary without toggling closed/open twice: toggles also schedule canvas work.
          const style = getComputedStyle(details);
          const closedHeight =
            summary.getBoundingClientRect().height +
            ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce(
              (sum, key) => sum + (parseFloat(style[key]) || 0),
              0,
            );
          if (!details.open) details.open = true;
          // Lazy labels/controls must be ready before measuring the spring target.
          if (targetOpen) details.dispatchEvent(new Event('motion-disclosure-opening'));
          const openedHeight = details.getBoundingClientRect().height;
          const to = targetOpen ? openedHeight : closedHeight;
          details.style.overflow = 'hidden';
          details.style.height = `${to}px`;
          animation = details.animate(
            [0, 1.085, 0.975, 1].map((progress, i) => ({
              height: `${Math.max(closedHeight, from + (to - from) * progress)}px`,
              offset: [0, 0.55, 0.79, 1][i],
              easing: i === 0 ? easing : 'ease-in-out',
            })),
            { duration: 420, easing: springEasing },
          );
          animation.finished
            .catch(() => {})
            .then(() => {
              if (token !== generation) return;
              details.open = targetOpen;
              details.style.height = '';
              details.style.overflow = '';
              animation = null;
            });
        });
      });
  }

  // Contextual controls emerge beside their parent switch; the canvas never scales.
  const reveals = new WeakMap();
  function revealOptions(group) {
    reveals.get(group)?.cancel();
    if (reduced.matches || !group.getClientRects().length) return;
    group.style.transformOrigin = 'left center';
    const animation = group.animate(
      [
        { opacity: 0.35, transform: 'translateX(-12px) scaleX(.88)', offset: 0 },
        { opacity: 1, transform: 'translateX(2px) scaleX(1.018)', offset: 0.68 },
        { opacity: 1, transform: 'translateX(-.5px) scaleX(.996)', offset: 0.86 },
        { opacity: 1, transform: 'translateX(0) scaleX(1)', offset: 1 },
      ],
      { duration: 380, easing },
    );
    reveals.set(group, animation);
  }
  const selected = (button) =>
    button.classList.contains('active') ||
    button.getAttribute('aria-selected') === 'true' ||
    button.getAttribute('aria-pressed') === 'true';

  function installSegments() {
    const selector =
      '.body-switch,.model-switch,.view-tabs,.context-view-switch,.globe-drag-options,.ui-viewbar,.ui-sundial-types,.sundial-view-controls,.ui-sundial-camera-tools [role="group"],.view-group';
    document.querySelectorAll(selector).forEach((group) => {
      const buttons = [...group.children].filter((node) => node.tagName === 'BUTTON');
      if (buttons.length < 2 || group.dataset.motionReady) return;
      group.dataset.motionReady = 'true';
      group.classList.add('motion-segments');
      const marker = document.createElement('span');
      marker.className = 'motion-selection';
      marker.setAttribute('aria-hidden', 'true');
      group.prepend(marker);
      let previous = null,
        animation = null;
      function update(animate = true) {
        const button = buttons.find((node) => selected(node) && node.getClientRects().length);
        buttons.forEach((node) => {
          if (node.classList.contains('motion-selected') !== (node === button))
            node.classList.toggle('motion-selected', node === button);
        });
        if (!button) {
          marker.hidden = true;
          previous = null;
          return;
        }
        if (animate && previous === button) return;
        // Layout coordinates stay stable while the containing options spring into view.
        const next = {
          left: `${button.offsetLeft}px`,
          top: `${button.offsetTop}px`,
          width: `${button.offsetWidth}px`,
          height: `${button.offsetHeight}px`,
        };
        if (
          previous === button &&
          Object.entries(next).every(([key, value]) => marker.style[key] === value)
        )
          return;
        const current = getComputedStyle(marker);
        const from = {
          left: current.left,
          top: current.top,
          width: current.width,
          height: current.height,
        };
        animation?.cancel();
        Object.assign(marker.style, next);
        marker.hidden = false;
        if (animate && previous && previous !== button && !reduced.matches)
          animation = marker.animate(springFrames(from, next), { duration: 360, easing });
        previous = button;
      }
      const observer = new MutationObserver(() => update());
      buttons.forEach((button) =>
        observer.observe(button, {
          attributes: true,
          attributeFilter: ['class', 'aria-selected', 'aria-pressed', 'hidden'],
        }),
      );
      // Only our own class mutation changes once; repeated renders do not restart motion.
      const resize = new ResizeObserver(() => update(false));
      resize.observe(group);
      buttons.forEach((button) => resize.observe(button));
      // Translation and font loading can move tabs without resizing their parent.
      const remeasure = () => requestAnimationFrame(() => update(false));
      document.addEventListener('skymotion:language', remeasure);
      document.fonts?.addEventListener('loadingdone', remeasure);
      update(false);
    });
    document.querySelectorAll('.view-tabs').forEach((group) => {
      let visible = Boolean(group.getClientRects().length);
      new MutationObserver(() => {
        const nextVisible = Boolean(group.getClientRects().length);
        if (nextVisible && !visible) revealOptions(group);
        if (!nextVisible) reveals.get(group)?.cancel();
        visible = nextVisible;
      }).observe(group, { attributes: true, attributeFilter: ['hidden'] });
      document.querySelector('.body-switch')?.addEventListener(
        'click',
        (event) => {
          const button = event.target.closest('button');
          if (button && !selected(button)) requestAnimationFrame(() => revealOptions(group));
        },
        true,
      );
    });
  }

  /** Default expanded on tablets/desktops; collapse is an explicit session preference. */
  function installRail({ shell, rail, button, mobile, openDrawer, overlay = () => false }) {
    if (!shell || !rail || !button || document.body.dataset.embedded === 'true') return;
    let collapsed = false;
    try {
      collapsed = sessionStorage.getItem('sky-menu-collapsed') === 'true';
    } catch (_) {}
    let previousModal = mobile.matches || overlay();
    rail.id ||= 'motionParameterRail';
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'motion-menu-edge';
    handle.textContent = '›';
    handle.setAttribute('aria-label', '展开参数菜单，也可向右拖动');
    handle.title = '展开菜单 · 向右拖动';
    shell.append(handle);
    const grip = document.createElement('button');
    grip.type = 'button';
    grip.className = 'motion-menu-grip';
    grip.textContent = '‹ 收起菜单';
    grip.title = '点击或向左拖动收起菜单';
    const menuHeader = document.createElement('div');
    menuHeader.className = 'motion-menu-header';
    menuHeader.append(grip);
    const navigation = rail.querySelector(':scope > .dt-rail-navigation');
    if (navigation) menuHeader.append(navigation);
    rail.prepend(menuHeader);
    function sync() {
      const modal = mobile.matches || overlay();
      const focusedBeforeSync = document.activeElement,
        focusWasOnButton = focusedBeforeSync === button,
        focusWasInRail = rail.contains(focusedBeforeSync);
      shell.classList.toggle('motion-rail-collapsed', collapsed && !modal);
      rail.inert = collapsed && !modal;
      rail.setAttribute('aria-hidden', String(collapsed && !modal));
      grip.hidden = modal;
      handle.hidden = modal || !collapsed;
      button.hidden = !modal;
      button.setAttribute(
        'aria-controls',
        modal ? (button.id === 'spaceParameters' ? 'spaceDrawer' : 'uiParameterDrawer') : rail.id,
      );
      if (modal) button.setAttribute('aria-haspopup', 'dialog');
      else {
        button.removeAttribute('aria-haspopup');
        button.setAttribute('aria-expanded', String(!collapsed));
      }
      const label = button.querySelector('span');
      if (label) label.textContent = modal ? '参数' : collapsed ? '展开菜单' : '收起菜单';
      else button.textContent = modal ? '参数' : collapsed ? '展开菜单' : '收起菜单';
      button.setAttribute(
        'aria-label',
        modal ? '打开实验参数菜单' : collapsed ? '展开实验参数菜单' : '收起实验参数菜单',
      );
      if (previousModal !== modal) {
        previousModal = modal;
        if (modal && focusWasInRail && !rail.closest('dialog')?.open)
          button.focus({ preventScroll: true });
        else if (!modal && (focusWasOnButton || (collapsed && focusWasInRail)))
          (collapsed ? handle : grip).focus({ preventScroll: true });
      } else if (!modal && collapsed && focusWasInRail) {
        handle.focus({ preventScroll: true });
      }
    }
    let railMotion = [],
      finishRailMotion = null;
    function setCollapsed(value) {
      if (collapsed === value) return;
      finishRailMotion?.();
      const modal = mobile.matches || overlay();
      const host = rail.closest('.space-sidebar-host') || rail;
      const content = [...shell.querySelectorAll('.ui-visual,.ui-timeline-host,.visual,.timeline')];
      const before = host.getBoundingClientRect();
      const starts = content.map((node) => node.getBoundingClientRect().left);
      const hostStyle = getComputedStyle(host);
      const padding = hostStyle.padding,
        border = hostStyle.border;
      collapsed = value;
      try {
        sessionStorage.setItem('sky-menu-collapsed', String(value));
      } catch (_) {}
      sync();
      if (modal || reduced.matches) return;
      const originalStyle = host.getAttribute('style');
      const end = host.getBoundingClientRect();
      shell.classList.add('motion-rail-animating');
      if (value) {
        // Keep the outgoing panel at its old bounds while the final grid is already allocated.
        Object.assign(host.style, {
          position: 'fixed',
          left: `${before.left}px`,
          top: `${before.top}px`,
          width: `${before.width}px`,
          height: `${before.height}px`,
          padding,
          border,
          opacity: '1',
          overflow: 'hidden',
          transform: 'none',
          transition: 'none',
          zIndex: '20',
        });
      }
      railMotion = [
        springPanel(
          host,
          value
            ? [{ transform: 'translateX(0)' }, { transform: `translateX(${-before.width - 16}px)` }]
            : [{ transform: `translateX(${-end.width - 16}px)` }, { transform: 'translateX(0)' }],
        ),
      ];
      content.forEach((node, index) => {
        const offset = starts[index] - node.getBoundingClientRect().left;
        if (Math.abs(offset) > 1)
          railMotion.push(
            springPanel(node, [
              { transform: `translateX(${offset}px)` },
              { transform: 'translateX(0)' },
            ]),
          );
      });
      const cleanup = () => {
        railMotion.forEach((animation) => animation.cancel());
        railMotion = [];
        if (originalStyle === null) host.removeAttribute('style');
        else host.setAttribute('style', originalStyle);
        shell.classList.remove('motion-rail-animating');
        if (finishRailMotion === cleanup) finishRailMotion = null;
      };
      finishRailMotion = cleanup;
      Promise.all(railMotion.map((animation) => animation.finished.catch(() => {}))).then(() => {
        if (finishRailMotion === cleanup) cleanup();
      });
    }
    button.onclick = () => (mobile.matches || overlay() ? openDrawer() : setCollapsed(!collapsed));
    grip.onclick = () => {
      setCollapsed(true);
      handle.focus({ preventScroll: true });
    };
    handle.onclick = () => {
      setCollapsed(false);
      grip.focus({ preventScroll: true });
    };
    function gesture(surface, opening) {
      let start = null,
        dragged = false;
      surface.style.touchAction = 'pan-y';
      surface.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        start = { id: event.pointerId, x: event.clientX, y: event.clientY };
        dragged = false;
        surface.setPointerCapture(event.pointerId);
      });
      surface.addEventListener('pointermove', (event) => {
        if (!start || event.pointerId !== start.id) return;
        const dx = event.clientX - start.x,
          dy = event.clientY - start.y;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          dragged = true;
          surface.style.transform = `translateX(${Math.max(-20, Math.min(20, dx * 0.2))}px)`;
        }
      });
      function end(event) {
        if (!start || event.pointerId !== start.id) return;
        const dx = event.clientX - start.x,
          dy = event.clientY - start.y;
        start = null;
        surface.style.transform = '';
        if (event.type === 'pointerup' && Math.abs(dy) < 40 && (opening ? dx > 40 : dx < -40)) {
          setCollapsed(!opening);
          (opening ? grip : handle).focus({ preventScroll: true });
        }
      }
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) =>
        surface.addEventListener(type, end),
      );
      surface.addEventListener(
        'click',
        (event) => {
          if (dragged) {
            event.preventDefault();
            event.stopImmediatePropagation();
            dragged = false;
          }
        },
        true,
      );
    }
    gesture(handle, true);
    gesture(grip, false);
    mobile.addEventListener('change', sync);
    window.addEventListener('space:layout', sync);
    document.addEventListener(
      'close',
      (event) => {
        if (event.target.tagName === 'DIALOG' && !mobile.matches && !overlay()) sync();
      },
      true,
    );
    sync();
    return sync;
  }
  window.SkyMotionUI = { installRail, installSegments, springPanel };
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      installSegments();
      installDisclosures();
    },
    { once: true },
  );
})();
