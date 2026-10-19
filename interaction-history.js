/** Browser Back/Forward for deliberate interactions, never for individual animation frames. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('embed') === '1') {
    // Embedded selections belong to the parent history and never create a second browser stack.
    const parentHistory = () => {
      try {
        return parent.SkyMotionHistory;
      } catch (_) {
        return null;
      }
    };
    const actionable = (target) =>
      target?.nodeType === 1 && target.closest('button,input,select,canvas');
    let pointerStart = null,
      skipClick = false;
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!actionable(event.target) || event.button !== 0) return;
        parentHistory()?.beginExternal();
        pointerStart = {
          x: event.clientX,
          y: event.clientY,
          canvas: Boolean(event.target.closest('canvas')),
        };
      },
      true,
    );
    document.addEventListener(
      'keydown',
      (event) => {
        if (
          actionable(event.target) &&
          event.key !== 'Tab' &&
          !event.altKey &&
          !event.metaKey &&
          !event.ctrlKey
        )
          parentHistory()?.beginExternal();
      },
      true,
    );
    for (const type of ['pointerup', 'pointercancel'])
      document.addEventListener(
        type,
        (event) => {
          skipClick =
            pointerStart?.canvas &&
            Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8;
          pointerStart = null;
          if (skipClick) {
            parentHistory()?.replaceExternal();
            setTimeout(() => {
              skipClick = false;
            }, 0);
          }
        },
        true,
      );
    for (const type of ['click', 'change'])
      document.addEventListener(
        type,
        (event) => {
          if (!skipClick && actionable(event.target)) parentHistory()?.endExternal();
        },
        true,
      );
    return;
  }
  let adapter = null,
    restoring = false,
    timer = 0,
    gesture = false,
    route = null;
  let restoreGeneration = 0;
  let last = '',
    inputField = null,
    inputUntil = 0,
    pendingInput = null,
    editing = null,
    pointerStart = null,
    skipClick = false;
  const key = 'skyMotionInteraction';
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const owned = (value) => value?.[key]?.page === location.pathname && value[key].version === 1;
  function read() {
    return {
      model: adapter?.read() || null,
      fields: [...document.querySelectorAll('input[id]:not([data-builder-field]),select[id]:not([data-builder-field])')].map((node) => [
        node.id,
        node.type === 'checkbox' || node.type === 'radio' ? node.checked : node.value,
      ]),
    };
  }
  function stateFor(snapshot) {
    return { ...history.state, [key]: { version: 1, page: location.pathname, snapshot } };
  }
  function replace(snapshot) {
    const signature = JSON.stringify(snapshot);
    if (owned(history.state) && signature === last) return;
    history.replaceState(stateFor(snapshot), '', location.href);
    last = signature;
  }
  function commit() {
    clearTimeout(timer);
    timer = 0;
    if (restoring || !adapter || gesture) return;
    const snapshot = read(),
      signature = JSON.stringify(snapshot);
    if (signature !== last || route) {
      if (pendingInput && pendingInput === inputField && performance.now() < inputUntil && !route)
        history.replaceState(stateFor(snapshot), '', location.href);
      else history.pushState(stateFor(snapshot), '', route || location.href);
      last = signature;
    }
    if (pendingInput) {
      inputField = pendingInput;
      inputUntil = performance.now() + 650;
    }
    pendingInput = null;
    route = null;
  }
  function begin() {
    if (restoring || !adapter || gesture) return;
    if (timer) commit();
    inputField = null;
    inputUntil = 0;
    pendingInput = null;
    // Freeze the state before this action, including the clock reached during playback.
    replace(read());
  }
  function queue(delay = 0) {
    if (restoring || !adapter || gesture) return;
    clearTimeout(timer);
    timer = setTimeout(commit, delay);
  }
  async function restore(snapshot) {
    if (!adapter) return;
    const fallback = read();
    const generation = ++restoreGeneration;
    restoring = true;
    clearTimeout(timer);
    timer = 0;
    gesture = false;
    route = null;
    try {
      // Reject malformed envelopes before changing any form or scientific state.
      if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) ||
          !snapshot.model || typeof snapshot.model !== 'object' || Array.isArray(snapshot.model) ||
          !Array.isArray(snapshot.fields)) snapshot = fallback;
      await Promise.allSettled(document.getAnimations()
        .filter(a => Number.isFinite(a.effect?.getComputedTiming().endTime))
        .map(a => { try { a.finish(); } catch {} return a.finished; }));
      if (generation !== restoreGeneration) return;
      for (const entry of snapshot.fields) {
        if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string') continue;
        const [id, value] = entry, node = document.getElementById(id);
        if (!node || !node.matches('input,select')) continue;
        if (node.type === 'checkbox' || node.type === 'radio') {
          if (typeof value === 'boolean') node.checked = value;
        } else if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) node.value = value;
      }
      adapter.restore(clone(snapshot.model));
      window.dispatchEvent(new Event('sky:history-restored'));
    } catch (error) {
      if (generation !== restoreGeneration) return;
      // An incompatible historical entry must not trap subsequent undo operations.
      try { adapter.restore(clone(fallback.model)); } catch (recoveryError) { console.warn('History recovery failed', recoveryError); }
      console.warn('Discarded incompatible history entry', error);
    } finally {
      if (generation === restoreGeneration) {
        restoring = false;
        replace(read());
      }
    }
  }
  window.SkyMotionHistory = {
    register(next) {
      adapter = next;
      if (owned(history.state)) void restore(history.state[key].snapshot);
      else replace(read());
    },
    setRoute(hash) {
      route = hash;
    },
    get restoring() {
      return restoring;
    },
    flush: commit,
    beginExternal: begin,
    endExternal: queue,
    replaceExternal() {
      if (adapter && !restoring) replace(read());
    },
  };
  const actionable = (target) =>
    target?.nodeType === 1 &&
    !target.closest(
      '.diagram-tools,.scene-builder,.motion-menu-grip,.motion-menu-edge,#uiParametersButton,#spaceParameters,#uiDrawerClose,#spaceDrawerClose',
    ) &&
    target.closest('button,input,select,a,canvas');
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!actionable(event.target) || event.button !== 0) return;
      editing = null;
      begin();
      gesture = true;
      pointerStart = {
        x: event.clientX,
        y: event.clientY,
        canvas: Boolean(event.target.closest('canvas')),
        snapshot: read(),
      };
    },
    true,
  );
  for (const type of ['pointerup', 'pointercancel'])
    document.addEventListener(
      type,
      (event) => {
        if (!gesture) return;
        gesture = false;
        skipClick =
          pointerStart?.canvas &&
          Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8;
        const parameterGesture =
          skipClick && adapter.parameterGesture?.(pointerStart.snapshot.model, read().model);
        pointerStart = null;
        if (skipClick) {
          if (parameterGesture) queue();
          else replace(read());
          setTimeout(() => {
            skipClick = false;
          }, 0);
        } else queue();
      },
      true,
    );
  document.addEventListener(
    'click',
    (event) => {
      if (!skipClick && actionable(event.target)) queue();
    },
    true,
  );
  document.addEventListener(
    'input',
    (event) => {
      if (!actionable(event.target)) return;
      pendingInput =
        event.target.matches('input') &&
        !['checkbox', 'radio'].includes(event.target.type)
          ? event.target.id
          : null;
      queue();
    },
    true,
  );
  document.addEventListener(
    'change',
    () => {
      gesture = false;
      pointerStart = null;
      queue();
    },
    true,
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Tab' || event.altKey || event.metaKey || event.ctrlKey) return;
      if (actionable(event.target)) {
        const continuingInput = event.target.id === inputField && performance.now() < inputUntil;
        if (!continuingInput && (editing !== event.target || !timer)) begin();
        editing = event.target;
        queue();
      }
    },
    true,
  );
  window.addEventListener('popstate', (event) => {
    if (owned(event.state)) void restore(event.state[key].snapshot);
  });
  window.addEventListener('pagehide', () => {
    // Persist the latest entry for cross-page return without adding an extra navigation.
    if (adapter && !restoring) replace(read());
  });
})();
