/** Browser-local presentation preferences. Scientific state and the shared clock stay independent. */
(() => {
  if (
    document.body.dataset.page !== 'diagrams' ||
    typeof uiWorkspace === 'undefined' ||
    !uiWorkspace
  )
    return;
  const shell = document.querySelector('.ui-shell'),
    plot = uiWorkspace.plot,
    cards = uiWorkspace.cards;
  const ids = Object.keys(cards),
    mobile = matchMedia('(max-width:760px)');
  const words = {
    launch: ['我的工作区', 'My workspace'],
    standard: ['返回标准视图', 'Standard view'],
    undo: ['撤销布局调整', 'Undo layout change'],
    reset: ['恢复默认布局', 'Reset layout'],
    one: ['单图', 'One view'],
    two: ['双图', 'Two views'],
    four: ['四图', 'Four views'],
    move: ['拖动交换位置；方向键调整顺序', 'Drag to swap; arrow keys to reorder'],
    close: ['移除此图', 'Remove view'],
    divider: ['调整两图比例', 'Resize views'],
    shared: [
      '所有图解共用地点、日期与观测时刻。',
      'Every view shares the same location, date and observation time.',
    ],
    help: [
      '选择图解内容，拖动标题把手交换位置。拖动分隔线调整比例，松手后更新画布；方向键也可调整。',
      'Choose each diagram, drag a header grip to swap views, or drag the divider to resize after release. Arrow keys work too.',
    ],
    phoneHelp: [
      '点击上方标签切换图解，参数与时间控制保持原位。',
      'Switch diagrams with the tabs above. Settings and time controls stay in place.',
    ],
    contextPanel: ['直射点与昼夜', 'Subsolar point'],
    chartPanel: ['全天太阳高度', 'Daily altitude'],
    riseSetPanel: ['日出日落方位', 'Sunrise and sunset'],
    solarGeometryPanel: ['地轴与地平面', 'Axis and horizon'],
  };
  const t = (k) => words[k][document.documentElement.lang === 'en' ? 1 : 0],
    copy = (x) => JSON.parse(JSON.stringify(x));
  const fresh = () => ({
    version: 2,
    enabled: false,
    views: ids.slice(0, 2),
    ratio: 50,
    active: 0,
  });
  const key = () => `skymotion-workspace-v2-${mobile.matches ? 'narrow' : 'wide'}`;
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(key()));
      if (
        d?.version === 2 &&
        Array.isArray(d.views) &&
        d.views.length >= 1 &&
        d.views.length <= 4 &&
        new Set(d.views).size === d.views.length &&
        d.views.every((id) => ids.includes(id)) &&
        Number.isFinite(d.ratio) &&
        d.ratio >= 30 &&
        d.ratio <= 70 &&
        Number.isInteger(d.active) &&
        d.active >= 0 &&
        d.active < d.views.length
      )
        return { ...d, enabled: d.enabled === true };
    } catch {}
    return fresh();
  }
  let data = load(),
    undo = [],
    gesture = null;
  const icon = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'layout-launch';
  launch.dataset.i18nSkip = '';
  launch.disabled = true;
  shell.querySelector('.ui-heading').append(launch);
  document.addEventListener('skymotion:ready', () => (launch.disabled = false), { once: true });
  const bar = document.createElement('div');
  bar.id = 'layoutTools';
  bar.className = 'workspace-toolbar';
  bar.dataset.i18nSkip = '';
  shell.querySelector('.ui-visual').prepend(bar);
  function button(parent, word, fn, html) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.word = word;
    if (html) b.innerHTML = html;
    b.onclick = fn;
    parent.append(b);
    return b;
  }
  const presets = document.createElement('div');
  presets.className = 'workspace-presets';
  bar.append(presets);
  const presetButtons = [1, 2, 4].map((n, i) =>
    button(
      presets,
      ['one', 'two', 'four'][i],
      () =>
        change(() => {
          data.views = [...data.views, ...ids.filter((id) => !data.views.includes(id))].slice(0, n);
          data.active = Math.min(data.active, n - 1);
        }),
      icon(
        n === 1
          ? 'M4 5h16v14H4z'
          : n === 2
            ? 'M4 5h16v14H4zM12 5v14'
            : 'M4 5h16v14H4zM12 5v14M4 12h16',
      ),
    ),
  );
  const actions = document.createElement('div');
  actions.className = 'workspace-actions';
  bar.append(actions);
  const undoButton = button(
    actions,
    'undo',
    () => {
      if (undo.length) {
        data = undo.pop();
        save();
        apply();
      }
    },
    icon('M9 5 4 10l5 5M4 10h10a5 5 0 0 1 0 10'),
  );
  button(
    actions,
    'reset',
    () =>
      change(() => {
        data = { ...fresh(), enabled: true };
      }),
    icon('M4 10a8 8 0 1 1 1 8M4 4v6h6'),
  );
  button(actions, 'standard', () => {
    cancel();
    data.enabled = false;
    save();
    apply();
    launch.focus();
  });
  const tabs = document.createElement('div');
  tabs.className = 'workspace-tabs';
  tabs.setAttribute('role', 'tablist');
  bar.append(tabs);
  const controls = new Map();
  for (const id of ids) {
    const head = cards[id].querySelector('.ui-diagram-card-head'),
      tools = document.createElement('div');
    tools.className = 'workspace-pane-tools';
    tools.dataset.i18nSkip = '';
    const handle = button(tools, 'move', () => {}, icon('M8 5h1m6 0h1M8 12h1m6 0h1M8 19h1m6 0h1'));
    handle.className = 'workspace-grip';
    const select = document.createElement('select');
    select.setAttribute('aria-label', t(id));
    for (const choice of ids) {
      const o = document.createElement('option');
      o.value = choice;
      select.append(o);
    }
    select.onchange = () =>
      change(() => {
        data.views[data.views.indexOf(id)] = select.value;
      });
    tools.append(select);
    const close = button(
      tools,
      'close',
      () =>
        change(() => {
          data.views = data.views.filter((x) => x !== id);
          data.active = Math.min(data.active, data.views.length - 1);
        }),
      icon('m7 7 10 10M17 7 7 17'),
    );
    head.prepend(tools);
    controls.set(id, { handle, select, close });
    handle.addEventListener('pointerdown', (e) => start(e, id));
    handle.addEventListener('lostpointercapture', cancel);
    handle.addEventListener('keydown', (e) => {
      if (!api.active || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key))
        return;
      e.preventDefault();
      const i = data.views.indexOf(id),
        j = i + (['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 1);
      if (j >= 0 && j < data.views.length) {
        change(() => ([data.views[i], data.views[j]] = [data.views[j], data.views[i]]));
        handle.focus();
      }
    });
  }
  const divider = document.createElement('div');
  divider.className = 'workspace-divider';
  divider.tabIndex = 0;
  divider.setAttribute('role', 'separator');
  divider.setAttribute('aria-orientation', 'vertical');
  divider.setAttribute('aria-valuemin', '30');
  divider.setAttribute('aria-valuemax', '70');
  plot.append(divider);
  divider.addEventListener('pointerdown', (e) => start(e, null));
  divider.addEventListener('lostpointercapture', cancel);
  divider.ondblclick = () => change(() => (data.ratio = 50));
  divider.onkeydown = (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    change(
      () =>
        (data.ratio = Math.max(
          30,
          Math.min(70, data.ratio + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 10 : 5)),
        )),
    );
  };
  const note = document.createElement('div');
  note.className = 'workspace-note';
  note.dataset.i18nSkip = '';
  const noteTitle = document.createElement('h2'),
    noteShared = document.createElement('p'),
    noteHelp = document.createElement('p');
  note.append(noteTitle, noteShared, noteHelp);
  document.querySelector('.ui-diagram-details[data-for=solarCompare]').prepend(note);
  const api = (window.skyWorkspacePresentation = {
    active: false,
    visibleIds: new Set(),
    sync() {
      const active =
        data.enabled && state.body === 'sun' && uiWorkspace.selected === 'solarCompare';
      api.active = active;
      api.visibleIds = new Set(mobile.matches ? [data.views[data.active]] : data.views);
      shell.classList.toggle('workspace-active', active);
      uiViewHidden(bar, !active);
      uiViewHidden(launch, state.body !== 'sun');
    },
  });
  function save() {
    try {
      localStorage.setItem(key(), JSON.stringify(data));
    } catch {}
  }
  function change(fn) {
    cancel();
    undo.push(copy(data));
    if (undo.length > 20) undo.shift();
    fn();
    save();
    apply();
  }
  function labels() {
    noteTitle.textContent = t('launch');
    noteShared.textContent = t('shared');
    noteHelp.textContent = t(mobile.matches ? 'phoneHelp' : 'help');
    launch.textContent = t('launch');
    launch.setAttribute('aria-expanded', String(api.active));
    for (const b of bar.querySelectorAll('[data-word]')) {
      const word = b.dataset.word;
      b.title = t(word);
      b.setAttribute('aria-label', t(word));
      if (!b.querySelector('svg')) b.textContent = t(word);
    }
    for (const [id, c] of controls) {
      for (const b of [c.handle, c.close]) {
        b.title = t(b.dataset.word);
        b.setAttribute('aria-label', t(b.dataset.word));
      }
      c.select.setAttribute('aria-label', t(id));
      for (const o of c.select.options) {
        o.textContent = t(o.value);
        o.disabled = o.value !== id && data.views.includes(o.value);
      }
      c.select.value = id;
      c.close.disabled = data.views.length === 1;
    }
    divider.setAttribute('aria-label', t('divider'));
  }
  function apply() {
    api.sync();
    plot.style.setProperty('--workspace-ratio', data.ratio + '%');
    plot.dataset.workspaceCount = data.views.length;
    plot.dataset.workspaceActive = data.active;
    divider.setAttribute('aria-valuenow', String(data.ratio));
    divider.hidden = !api.active || mobile.matches || data.views.length === 1;
    undoButton.disabled = !undo.length;
    presetButtons.forEach((b, i) =>
      b.setAttribute('aria-pressed', String(data.views.length === [1, 2, 4][i])),
    );
    if (api.active) for (const id of data.views) plot.insertBefore(cards[id], divider);
    if (tabs.dataset.order !== data.views.join(',')) {
      tabs.dataset.order = data.views.join(',');
      tabs.replaceChildren();
      data.views.forEach((id, index) => {
        const b = button(tabs, id, () => {
          data.active = index;
          save();
          apply();
        });
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-controls', cards[id].id || (cards[id].id = 'workspace-' + id));
      });
    }
    [...tabs.children].forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === data.active));
      b.tabIndex = i === data.active ? 0 : -1;
    });
    labels();
    renderUIWorkspace();
    schedule();
  }
  tabs.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Home') data.active = 0;
    else if (e.key === 'End') data.active = data.views.length - 1;
    else
      data.active =
        (data.active + (e.key === 'ArrowLeft' ? -1 : 1) + data.views.length) % data.views.length;
    save();
    apply();
    tabs.children[data.active].focus();
  });
  launch.onclick = () => {
    data.enabled = true;
    uiWorkspace.selected = 'solarCompare';
    if (location.hash !== '#solarCompare') history.replaceState(history.state, '', '#solarCompare');
    save();
    apply();
  };
  function start(e, id) {
    if (!api.active || mobile.matches || e.button !== 0) return;
    e.preventDefault();
    cancel();
    const rect = plot.getBoundingClientRect(),
      ghost = document.createElement('div');
    ghost.className = id ? 'workspace-ghost' : 'workspace-guide';
    ghost.dataset.i18nSkip = '';
    if (id) ghost.textContent = t(id);
    else {
      ghost.style.top = rect.top + 'px';
      ghost.style.height = rect.height + 'px';
    }
    document.body.append(ghost);
    gesture = {
      pointer: e.pointerId,
      source: e.currentTarget,
      id,
      rect,
      ghost,
      ratio: data.ratio,
      target: null,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      rects: data.views.map((id) => ({ id, rect: cards[id].getBoundingClientRect() })),
    };
    window.skyWorkspaceInteracting = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function cancel() {
    if (!gesture) return;
    const g = gesture;
    gesture = null;
    if (g.raf) cancelAnimationFrame(g.raf);
    g.ghost.remove();
    for (const card of Object.values(cards)) card.classList.remove('workspace-drop');
    window.skyWorkspaceInteracting = false;
    try {
      if (g.source.hasPointerCapture(g.pointer)) g.source.releasePointerCapture(g.pointer);
    } catch {}
    schedule();
  }
  window.addEventListener('pointermove', (e) => {
    const g = gesture;
    if (!g || g.pointer !== e.pointerId) return;
    g.x = e.clientX;
    g.y = e.clientY;
    g.moved = true;
    if (g.raf) return;
    g.raf = requestAnimationFrame(() => {
      g.raf = 0;
      if (gesture !== g) return;
      if (g.id) {
        g.ghost.style.transform = `translate(${g.x + 12}px,${g.y + 12}px)`;
        g.target = g.rects.find(
          (n) =>
            n.id !== g.id &&
            g.x >= n.rect.left &&
            g.x <= n.rect.right &&
            g.y >= n.rect.top &&
            g.y <= n.rect.bottom,
        )?.id;
        for (const [id, c] of Object.entries(cards))
          c.classList.toggle('workspace-drop', id === g.target);
      } else {
        g.ratio = Math.max(
          30,
          Math.min(70, Math.round(((g.x - g.rect.left) / g.rect.width) * 100)),
        );
        g.ghost.style.transform = `translateX(${g.rect.left + (g.rect.width * g.ratio) / 100}px)`;
      }
    });
  });
  window.addEventListener('pointerup', (e) => {
    const g = gesture;
    if (!g || e.pointerId !== g.pointer) return;
    if (!g.id)
      g.ratio = Math.max(
        30,
        Math.min(70, Math.round(((e.clientX - g.rect.left) / g.rect.width) * 100)),
      );
    else
      g.target = g.rects.find(
        (n) =>
          n.id !== g.id &&
          e.clientX >= n.rect.left &&
          e.clientX <= n.rect.right &&
          e.clientY >= n.rect.top &&
          e.clientY <= n.rect.bottom,
      )?.id;
    cancel();
    if (!g.moved) return;
    if (g.id && g.target)
      change(() => {
        const i = data.views.indexOf(g.id),
          j = data.views.indexOf(g.target);
        [data.views[i], data.views[j]] = [data.views[j], data.views[i]];
      });
    else if (!g.id) change(() => (data.ratio = g.ratio));
  });
  for (const name of ['pointercancel', 'blur', 'pagehide']) window.addEventListener(name, cancel);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gesture) {
      e.preventDefault();
      cancel();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancel();
  });
  document.addEventListener('skymotion:language', labels);
  mobile.addEventListener('change', () => {
    cancel();
    data = load();
    undo = [];
    if (data.enabled && state.body === 'sun') uiWorkspace.selected = 'solarCompare';
    apply();
  });
  if (data.enabled && state.body === 'sun' && (!location.hash || location.hash === '#solarCompare'))
    uiWorkspace.selected = 'solarCompare';
  apply();
})();
