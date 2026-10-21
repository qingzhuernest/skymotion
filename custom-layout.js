/** Presentation-only workspaces. One set of scientific canvases and one shared clock. */
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
    undo: ['撤销布局调整', 'Undo layout change'],
    redo: ['重做布局调整', 'Redo layout change'],
    reset: ['恢复默认布局', 'Reset layout'],
    one: ['单图', 'One view'],
    two: ['双图', 'Two views'],
    four: ['四图', 'Four views'],
    options: ['布局与收藏', 'Layout & saved views'],
    choose: ['选择要添加的图解', 'Choose a diagram to add'],
    main: ['设为主图', 'Make main view'],
    equalize: ['恢复均等比例', 'Equalize proportions'],
    closeOptions: ['关闭布局设置', 'Close layout settings'],
    move: ['拖动交换位置；方向键调整顺序', 'Drag to swap; arrow keys to reorder'],
    close: ['移除此图', 'Remove view'],
    focus: ['专注此图', 'Focus this view'],
    back: ['返回组合', 'Back to all views'],
    divider: ['调整左右比例', 'Resize columns'],
    rowDivider: ['调整上下比例', 'Resize rows'],
    shared: [
      '所有图解共用地点、日期与观测时刻。',
      'Every view shares the same location, date and observation time.',
    ],
    help: [
      '添加图解、交换位置，或拖动分隔线调整比例。专注查看一张图后，按 Esc 返回组合。',
      'Add a view, swap positions, or drag a divider to resize. Focus on a diagram and press Esc to return.',
    ],
    phoneHelp: [
      '点击标签切换图解。在“布局与收藏”中调整顺序，保存常用组合。',
      'Switch diagrams with the tabs. Reorder and save combinations in Layout & saved views.',
    ],
    contextPanel: ['直射点与昼夜', 'Subsolar point'],
    chartPanel: ['全天太阳高度', 'Daily altitude'],
    riseSetPanel: ['日出日落方位', 'Sunrise and sunset'],
    solarGeometryPanel: ['地轴与地平面', 'Axis and horizon'],
    count: ['图解数量', 'View count'],
    arrange: ['排列方式', 'Arrangement'],
    columns: ['左右并排', 'Side by side'],
    rows: ['上下排列', 'Stacked'],
    balanced: ['均衡排列', 'Balanced'],
    featured: ['主图与辅图', 'Main view + supporting views'],
    templates: ['快速组合', 'Quick combinations'],
    daylight: ['昼夜与高度', 'Daylight & altitude'],
    bearings: ['升落与地轴', 'Bearings & axis'],
    overview: ['四图总览', 'Four-view overview'],
    order: ['图解顺序', 'View order'],
    before: ['向前移', 'Move earlier'],
    after: ['向后移', 'Move later'],
    saved: ['我的收藏', 'Saved layouts'],
    name: ['组合名称', 'Layout name'],
    rename: ['重命名收藏', 'Rename saved layout'],
    saveName: ['保存名称', 'Save name'],
    update: ['用当前布局更新收藏', 'Update with current layout'],
    cancelEdit: ['取消重命名', 'Cancel renaming'],
    undoSaved: ['撤销收藏修改', 'Undo saved-layout change'],
    nameConflict: ['请输入不同的组合名称。', 'Enter a different layout name.'],
    renamed: ['收藏已重命名。', 'Saved layout renamed.'],
    updated: ['收藏已更新。', 'Saved layout updated.'],
    restored: ['已撤销收藏修改。', 'Saved-layout change undone.'],
    current: ['当前布局', 'Current layout'],
    exact: ['精确调整比例', 'Exact proportions'],
    columnShare: ['左栏比例（%）', 'Left column (%)'],
    rowShare: ['上栏比例（%）', 'Top row (%)'],
    proportionHint: [
      '输入 30–70，确认后更新画布。',
      'Enter 30–70; the view updates when you commit.',
    ],
    save: ['保存组合', 'Save layout'],
    empty: [
      '还没有收藏。保存当前组合，下次可直接使用。',
      'No saved layouts yet. Save this combination to use it again.',
    ],
    limit: [
      '最多保存五个组合；同名保存会更新原组合。',
      'Save up to five layouts. Reuse a name to update it.',
    ],
    saveHint: [
      '只保存布局，日期、地点与读数保持不变。',
      'Only the layout is saved. Dates, location and readings stay unchanged.',
    ],
    profile: ['我的组合', 'My layout'],
    delete: ['删除收藏', 'Delete saved layout'],
    savedStatus: ['组合已保存。', 'Layout saved.'],
    memoryStatus: [
      '组合仅用于本次访问，浏览器未允许保存。',
      'Available for this visit; browser storage is unavailable.',
    ],
    deleted: ['收藏已删除。', 'Saved layout deleted.'],
    applied: ['已应用组合。', 'Layout applied.'],
    added: ['图解已添加。', 'View added.'],
    removed: ['图解已移除，可撤销。', 'View removed. You can undo this change.'],
  };
  const moonWords = {
    contextPanel: ['月相与关系', 'Moon phase and relationships'],
    chartPanel: ['逐日照明比例', 'Daily illumination'],
    riseSetPanel: ['月出月落方位', 'Moonrise and moonset'],
    solarGeometryPanel: ['行星伴月', 'Moon–planet comparison'],
    daylight: ['月相与照明', 'Phase and illumination'],
    bearings: ['升落与伴月', 'Rise/set and planets'],
  };
  let workspaceBody = state.body,
    customizing = false,
    normalSelection = null;
  const t = (k) =>
      (workspaceBody === 'moon' && moonWords[k] ? moonWords[k] : words[k])[
        document.documentElement.lang === 'en' ? 1 : 0
      ],
    copy = (x) => JSON.parse(JSON.stringify(x));
  const key = (version) =>
    `skymotion-workspace-v${version || 3}-${mobile.matches ? 'narrow' : 'wide'}${workspaceBody === 'moon' ? '-moon' : ''}`;
  const fresh = () => ({
    version: 3,
    enabled: false,
    views: ids.slice(0, 2),
    ratio: 50,
    rowRatio: 50,
    axis: 'columns',
    featured: true,
    active: 0,
  });
  function sanitize(d) {
    if (
      !d ||
      ![2, 3].includes(d.version) ||
      !Array.isArray(d.views) ||
      !d.views.length ||
      d.views.length > 4 ||
      new Set(d.views).size !== d.views.length ||
      d.views.some((id) => !ids.includes(id)) ||
      !Number.isFinite(d.ratio) ||
      d.ratio < 30 ||
      d.ratio > 70 ||
      !Number.isInteger(d.active) ||
      d.active < 0 ||
      d.active >= d.views.length
    )
      return null;
    if (
      d.version === 3 &&
      (!['columns', 'rows'].includes(d.axis) ||
        !Number.isFinite(d.rowRatio) ||
        d.rowRatio < 30 ||
        d.rowRatio > 70 ||
        typeof d.featured !== 'boolean')
    )
      return null;
    return {
      version: 3,
      enabled: d.enabled === true,
      views: [...d.views],
      ratio: d.ratio,
      rowRatio: d.version === 3 ? d.rowRatio : 50,
      axis: d.version === 3 ? d.axis : 'columns',
      featured: d.version === 3 ? d.featured : false,
      active: d.active,
    };
  }
  function load() {
    try {
      return (
        sanitize(JSON.parse(localStorage.getItem(key()))) ||
        sanitize(JSON.parse(localStorage.getItem(key(2)))) ||
        fresh()
      );
    } catch {
      return fresh();
    }
  }
  const profileKey = () => 'skymotion-saved-layouts-v1' + (workspaceBody === 'moon' ? '-moon' : '');
  function loadProfiles() {
    try {
      const saved = JSON.parse(localStorage.getItem(profileKey()));
      if (saved?.version !== 1 || !Array.isArray(saved.items)) return [];
      const names = new Set();
      return saved.items
        .filter((p) => {
          if (
            !p ||
            typeof p.name !== 'string' ||
            !p.name.trim() ||
            p.name.length > 40 ||
            names.has(p.name) ||
            !sanitize(p.layout)
          )
            return false;
          names.add(p.name);
          return true;
        })
        .slice(0, 5)
        .map((p) => ({ name: p.name, layout: sanitize(p.layout) }));
    } catch {
      return [];
    }
  }
  let data = load(),
    profiles = loadProfiles(),
    profileUndo = [],
    editingProfile = null,
    editDraft = '',
    undo = [],
    redo = [],
    focused = null,
    gesture = null,
    optionOpen = false,
    statusKey = '';
  const icon = (path) => `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${path}"/></svg>`;
  function button(parent, word, fn, path, withLabel = false) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.word = word;
    if (path) b.innerHTML = icon(path);
    if (!path || withLabel) {
      const span = document.createElement('span');
      span.className = 'workspace-button-label';
      span.textContent = t(word);
      b.append(span);
    }
    b.onclick = fn;
    parent.append(b);
    return b;
  }
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'layout-launch';
  launch.dataset.i18nSkip = '';
  launch.disabled = true;
  shell.id ||= 'customizable-workspace';
  launch.setAttribute('aria-controls', shell.id);
  shell.querySelector('.ui-heading').append(launch);
  const bar = document.createElement('div');
  bar.id = 'layoutTools';
  bar.className = 'workspace-toolbar';
  bar.dataset.i18nSkip = '';
  const viewbar = shell.querySelector('.ui-viewbar'),
    navigation = document.createElement('div');
  navigation.className = 'workspace-navigation';
  viewbar.before(navigation);
  navigation.append(viewbar, bar);
  const presets = document.createElement('div');
  presets.className = 'workspace-presets';
  presets.setAttribute('role', 'group');
  const presetButtons = [1, 2, 4].map((n, i) =>
    button(
      presets,
      ['one', 'two', 'four'][i],
      () =>
        change(() => {
          data.views = [...data.views, ...ids.filter((id) => !data.views.includes(id))].slice(0, n);
          data.active = Math.min(data.active, n - 1);
        }),
      n === 1
        ? 'M4 5h16v14H4z'
        : n === 2
          ? 'M4 5h16v14H4zM12 5v14'
          : 'M4 5h16v14H4zM12 5v14M4 12h16',
      true,
    ),
  );
  const backButton = button(
    bar,
    'back',
    () => {
      focused = null;
      apply();
    },
    'm9 5-7 7 7 7M3 12h18',
    true,
  );
  const layoutHistory = document.createElement('div');
  layoutHistory.className = 'workspace-layout-history';
  function travel(from, to) {
    if (!from.length) return;
    cancel();
    to.push(copy(data));
    data = from.pop();
    focused = null;
    save();
    apply();
  }
  const undoButton = button(
    layoutHistory,
    'undo',
    () => travel(undo, redo),
    'M9 5 4 10l5 5M4 10h10a5 5 0 0 1 0 10',
    true,
  );
  const redoButton = button(
    layoutHistory,
    'redo',
    () => travel(redo, undo),
    'm15 5 5 5-5 5M20 10H10a5 5 0 0 0 0 10',
    true,
  );
  const optionsButton = button(
    bar,
    'options',
    () => toggleOptions(),
    'M4 7h16M4 17h16M8 4v6M16 14v6',
    true,
  );
  const tabs = document.createElement('div');
  tabs.className = 'workspace-tabs';
  tabs.setAttribute('role', 'tablist');
  navigation.after(tabs);
  const live = document.createElement('span');
  live.className = 'workspace-sr';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  bar.append(live);
  const panel = document.createElement('section');
  panel.id = 'workspaceOptions';
  panel.className = 'workspace-options';
  panel.dataset.i18nSkip = '';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  document.body.append(panel);
  optionsButton.setAttribute('aria-controls', panel.id);
  optionsButton.setAttribute('aria-expanded', 'false');
  const nativePopover = typeof panel.showPopover === 'function';
  if (nativePopover) panel.setAttribute('popover', 'auto');
  const panelHead = document.createElement('div');
  panelHead.className = 'workspace-options-head';
  const panelTitle = document.createElement('h2');
  panelHead.append(panelTitle);
  button(panelHead, 'closeOptions', () => closeOptions(true), 'm7 7 10 10M17 7 7 17');
  panel.append(panelHead, layoutHistory);
  function section(word) {
    const wrap = document.createElement('section'),
      h = document.createElement('h3');
    h.dataset.wordHeading = word;
    wrap.append(h);
    panel.append(wrap);
    return wrap;
  }
  const quickLayout = section('count');
  quickLayout.append(presets);
  const arrange = section('arrange'),
    axisGroup = document.createElement('div');
  axisGroup.className = 'workspace-choice-group';
  arrange.append(axisGroup);
  const axisButtons = ['columns', 'rows'].map((axis) =>
    button(
      axisGroup,
      axis,
      () => change(() => (data.axis = axis)),
      axis === 'columns' ? 'M4 5h16v14H4zM12 5v14' : 'M4 5h16v14H4zM4 12h16',
      true,
    ),
  );
  const featuredGroup = document.createElement('div');
  featuredGroup.className = 'workspace-choice-group';
  arrange.append(featuredGroup);
  const featuredButtons = [false, true].map((v) =>
    button(
      featuredGroup,
      v ? 'featured' : 'balanced',
      () => change(() => (data.featured = v)),
      v ? 'M4 5h16v14H4zM14 5v14M14 12h6' : 'M4 5h16v14H4zM12 5v7M4 12h16',
      true,
    ),
  );
  const equalizeButton = button(arrange, 'equalize', () =>
    change(() => {
      data.ratio = 50;
      data.rowRatio = 50;
    }),
  );
  const proportions = document.createElement('fieldset');
  proportions.className = 'workspace-proportions';
  const proportionTitle = document.createElement('legend');
  proportionTitle.dataset.wordHeading = 'exact';
  proportions.append(proportionTitle);
  const proportionFields = ['ratio', 'rowRatio'].map((key, i) => {
    const label = document.createElement('label'),
      text = document.createElement('span'),
      input = document.createElement('input');
    text.dataset.wordHeading = i ? 'rowShare' : 'columnShare';
    input.type = 'number';
    input.min = '30';
    input.max = '70';
    input.step = '1';
    input.dataset.proportion = key;
    input.onchange = () => {
      const n = input.valueAsNumber;
      if (Number.isFinite(n))
        change(() => {
          data[key] = Math.max(30, Math.min(70, Math.round(n)));
        });
      input.value = data[key];
    };
    label.append(text, input);
    proportions.append(label);
    return input;
  });
  const proportionHint = document.createElement('p');
  proportionHint.className = 'workspace-settings-hint';
  proportionHint.dataset.wordHeading = 'proportionHint';
  proportions.append(proportionHint);
  arrange.append(proportions);
  const available = section('choose'),
    availableChoices = document.createElement('div');
  availableChoices.className = 'workspace-choice-group workspace-add-choices';
  available.append(availableChoices);
  const availableButtons = ids.map((id) => {
    const b = button(availableChoices, id, () =>
      change(() => {
        data.views.push(id);
        data.active = data.views.length - 1;
      }, 'added'),
    );
    b.dataset.addView = id;
    return b;
  });
  const quick = section('templates');
  quick.className = 'workspace-quick';
  const templates = [
    ['daylight', ['contextPanel', 'chartPanel']],
    ['bearings', ['riseSetPanel', 'solarGeometryPanel']],
    ['overview', ids],
  ];
  for (const [word, views] of templates)
    button(quick, word, () =>
      change(() => {
        data = { ...fresh(), enabled: true, views: [...views] };
      }, 'applied'),
    );
  const orderSection = section('order'),
    orderList = document.createElement('div');
  orderList.className = 'workspace-order-list';
  orderSection.append(orderList);
  const savedSection = section('saved'),
    profileList = document.createElement('div');
  profileList.className = 'workspace-profile-list';
  savedSection.append(profileList);
  const undoSavedButton = button(
    savedSection,
    'undoSaved',
    undoProfiles,
    'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12',
    true,
  );
  undoSavedButton.className = 'workspace-undo-saved';
  undoSavedButton.hidden = true;
  const saveForm = document.createElement('form');
  saveForm.className = 'workspace-save-form';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.maxLength = 40;
  nameInput.autocomplete = 'off';
  saveForm.append(nameInput);
  const saveButton = button(saveForm, 'save', () => {});
  saveButton.type = 'submit';
  savedSection.append(saveForm);
  const saveHint = document.createElement('p');
  saveHint.className = 'workspace-settings-hint';
  savedSection.append(saveHint);
  const panelStatus = document.createElement('p');
  panelStatus.className = 'workspace-settings-status';
  panelStatus.id = 'workspaceSavedStatus';
  panelStatus.setAttribute('role', 'status');
  savedSection.append(panelStatus);
  const panelFoot = document.createElement('div');
  panelFoot.className = 'workspace-options-foot';
  button(panelFoot, 'reset', () =>
    change(() => {
      data = { ...fresh(), enabled: true };
    }),
  );
  panel.append(panelFoot);
  saveForm.onsubmit = (e) => {
    e.preventDefault();
    let name = nameInput.value.trim();
    if (!name) {
      let number = 1;
      while (profiles.some((p) => p.name === `${t('profile')} ${number}`)) number++;
      name = `${t('profile')} ${number}`;
    }
    const existing = profiles.findIndex((p) => p.name === name);
    if (existing < 0 && profiles.length >= 5) {
      announce('limit');
      return;
    }
    mutateProfiles(() => {
      const item = { name, layout: copy(data) };
      if (existing >= 0) profiles[existing] = item;
      else profiles.push(item);
    }, 'savedStatus');
    nameInput.value = '';
  };
  function persistProfiles(word) {
    const active = document.activeElement,
      action = active?.dataset.word,
      name = active?.dataset.profileName;
    let stored = true;
    try {
      localStorage.setItem(profileKey(), JSON.stringify({ version: 1, items: profiles }));
    } catch {
      stored = false;
    }
    renderProfiles();
    if (name) {
      const row = [...profileList.querySelectorAll('[data-saved-name]')].find(
        (row) => row.dataset.savedName === name,
      );
      const target =
        row?.querySelector(`[data-word="${action}"]:not(:disabled)`) ||
        row?.querySelector('.workspace-profile-apply');
      target?.focus();
    }
    announce(stored ? word : 'memoryStatus');
  }
  function mutateProfiles(fn, word) {
    const before = copy(profiles);
    fn();
    if (JSON.stringify(before) !== JSON.stringify(profiles)) {
      profileUndo.push(before);
      if (profileUndo.length > 10) profileUndo.shift();
    }
    persistProfiles(word);
  }
  function undoProfiles() {
    if (!profileUndo.length) return;
    profiles = profileUndo.pop();
    editingProfile = null;
    persistProfiles('restored');
    (profileUndo.length ? undoSavedButton : nameInput).focus();
  }
  const presentation = (layout) => JSON.stringify({ ...layout, enabled: false, active: 0 });

  const controls = new Map();
  for (const id of ids) {
    const head = cards[id].querySelector('.ui-diagram-card-head'),
      tools = document.createElement('div');
    tools.className = 'workspace-pane-tools';
    tools.dataset.i18nSkip = '';
    const handle = button(tools, 'move', () => {}, 'M8 5h1m6 0h1M8 12h1m6 0h1M8 19h1m6 0h1');
    handle.className = 'workspace-grip';
    const select = document.createElement('select');
    for (const choice of ids) {
      const option = document.createElement('option');
      option.value = choice;
      select.append(option);
    }
    tools.append(select);
    select.onchange = () => {
      const chosen = select.value,
        focusAfter = focused ? chosen : null;
      change(
        () => {
          const from = data.views.indexOf(id),
            other = data.views.indexOf(chosen);
          if (other >= 0)
            [data.views[from], data.views[other]] = [data.views[other], data.views[from]];
          else data.views[from] = chosen;
        },
        undefined,
        focusAfter,
      );
      if (focusAfter) controls.get(chosen).select.focus();
    };
    const focus = button(
      tools,
      'focus',
      () => {
        focused = id;
        data.active = data.views.indexOf(id);
        apply();
        backButton.focus();
      },
      'M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5',
    );
    focus.className = 'workspace-focus-button';
    const close = button(
      tools,
      'close',
      () =>
        change(() => {
          const selected = data.views[data.active];
          data.views = data.views.filter((x) => x !== id);
          data.active = Math.max(
            0,
            data.views.includes(selected)
              ? data.views.indexOf(selected)
              : Math.min(data.active, data.views.length - 1),
          );
        }, 'removed'),
      'm7 7 10 10M17 7 7 17',
    );
    head.prepend(tools);
    controls.set(id, { handle, select, focus, close });
    handle.addEventListener('pointerdown', (e) => start(e, id));
    handle.addEventListener('lostpointercapture', cancel);
    handle.addEventListener('keydown', (e) => {
      if (!api.active || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key))
        return;
      e.preventDefault();
      move(id, ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 1);
      handle.focus();
    });
    head.addEventListener('dblclick', (e) => {
      if (!mobile.matches && data.views.length > 1 && !e.target.closest('button,select')) {
        focused = id;
        apply();
        backButton.focus();
      }
    });
  }
  const splitters = {};
  for (const axis of ['x', 'y']) {
    const split = document.createElement('div');
    split.className = `workspace-divider workspace-divider-${axis}`;
    split.tabIndex = 0;
    split.dataset.splitAxis = axis;
    split.setAttribute('role', 'separator');
    split.setAttribute('aria-orientation', axis === 'x' ? 'vertical' : 'horizontal');
    split.setAttribute('aria-valuemin', '30');
    split.setAttribute('aria-valuemax', '70');
    plot.append(split);
    splitters[axis] = split;
    split.addEventListener('pointerdown', (e) => start(e, null, axis));
    split.addEventListener('lostpointercapture', cancel);
    split.ondblclick = () => change(() => (data[axis === 'x' ? 'ratio' : 'rowRatio'] = 50));
    split.onkeydown = (e) => {
      const keys = axis === 'x' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      change(() => {
        const k = axis === 'x' ? 'ratio' : 'rowRatio';
        data[k] = Math.max(
          30,
          Math.min(70, data[k] + (e.key === keys[0] ? -1 : 1) * (e.shiftKey ? 10 : 5)),
        );
      });
    };
  }
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
      if (workspaceBody !== state.body) {
        cancel();
        closeOptions();
        save();
        workspaceBody = state.body;
        data = load();
        data.enabled = customizing;
        profiles = loadProfiles();
        undo = [];
        redo = [];
        profileUndo = [];
        focused = null;
        editingProfile = null;
        statusKey = '';
        profileList.dataset.signature = '';
        queueMicrotask(apply);
      }
      const active = customizing && data.enabled && uiWorkspace.selected === 'solarCompare',
        leaving = api.active && !active,
        entering = !api.active && active;
      api.active = active;
      // Activating a saved layout must also restore its resize handles.
      if (entering) queueMicrotask(apply);
      if (leaving) {
        cancel();
        closeOptions();
        focused = null;
        for (const id of ids) plot.insertBefore(cards[id], splitters.x);
      }
      api.visibleIds = new Set(
        mobile.matches ? [data.views[data.active]] : focused ? [focused] : data.views,
      );
      shell.classList.toggle('workspace-active', active);
      uiViewHidden(bar, !active);
      uiViewHidden(launch, false);
    },
  });
  function save() {
    try {
      localStorage.setItem(key(), JSON.stringify(data));
    } catch {}
  }
  function announce(word) {
    statusKey = word;
    live.textContent = t(word);
    panelStatus.textContent = t(word);
  }
  function change(fn, status, focusAfter = null) {
    cancel();
    const before = copy(data);
    fn();
    if (JSON.stringify(before) === JSON.stringify(data)) {
      if (status) announce(status);
      return;
    }
    undo.push(before);
    if (undo.length > 20) undo.shift();
    redo = [];
    focused = focusAfter;
    save();
    apply();
    if (status) announce(status);
  }
  function move(id, delta) {
    const i = data.views.indexOf(id),
      next = i + delta;
    if (next < 0 || next >= data.views.length) return;
    change(() => {
      const selected = data.views[data.active];
      [data.views[i], data.views[next]] = [data.views[next], data.views[i]];
      data.active = data.views.indexOf(selected);
    });
  }
  function labelButtons(root) {
    for (const b of root.querySelectorAll('button[data-word]')) {
      b.title = t(b.dataset.word);
      b.setAttribute(
        'aria-label',
        t(b.dataset.word) + (b.dataset.profileName ? ' ' + b.dataset.profileName : ''),
      );
      const span = b.querySelector('.workspace-button-label');
      if (span) span.textContent = t(b.dataset.word);
    }
  }
  function labels() {
    noteTitle.textContent = t('launch');
    noteShared.textContent = t('shared');
    noteHelp.textContent = t(mobile.matches ? 'phoneHelp' : 'help');
    presets.setAttribute('aria-label', t('arrange'));
    panelTitle.textContent = t('options');
    panel.setAttribute('aria-label', t('options'));
    nameInput.setAttribute('aria-label', t('name'));
    nameInput.placeholder = t('name');
    if (statusKey) {
      live.textContent = t(statusKey);
      panelStatus.textContent = t(statusKey);
    }
    saveHint.textContent = profiles.length >= 5 ? t('limit') : t('saveHint');
    labelButtons(bar);
    labelButtons(panel);
    for (const h of panel.querySelectorAll('[data-word-heading]'))
      h.textContent = t(h.dataset.wordHeading);
    for (const [id, c] of controls) {
      labelButtons(c.handle.parentElement);
      c.select.setAttribute('aria-label', t(id));
      for (const o of c.select.options) o.textContent = t(o.value);
      c.select.value = id;
      c.close.disabled = data.views.length === 1;
      c.focus.disabled = data.views.length === 1;
    }
    splitters.x.setAttribute('aria-label', t('divider'));
    splitters.y.setAttribute('aria-label', t('rowDivider'));
  }
  function renderOrder() {
    const focus = document.activeElement,
      position = focus?.dataset.orderId,
      direction = focus?.dataset.direction;
    orderList.replaceChildren();
    for (const [id, i] of data.views.map((id, i) => [id, i])) {
      const row = document.createElement('div');
      row.className = 'workspace-order-row';
      const name = document.createElement('span');
      name.textContent = t(id);
      row.append(name);
      const main = button(
        row,
        'main',
        () =>
          change(() => {
            const selected = data.views[data.active];
            data.views.splice(i, 1);
            data.views.unshift(id);
            data.active = data.views.indexOf(selected);
            data.featured = true;
          }),
        'M4 5h16v14H4zM14 5v14M14 12h6',
      );
      main.dataset.mainView = id;
      main.disabled = i === 0;
      for (const [delta, word, path] of [
        [-1, 'before', 'm7 14 5-5 5 5'],
        [1, 'after', 'm7 10 5 5 5-5'],
      ]) {
        const b = button(row, word, () => move(id, delta), path);
        b.dataset.orderId = id;
        b.dataset.direction = String(delta);
        b.disabled = i + delta < 0 || i + delta >= data.views.length;
      }
      orderList.append(row);
    }
    labelButtons(orderList);
    if (position) {
      const b = orderList.querySelector(
        `[data-order-id="${position}"][data-direction="${direction}"]`,
      );
      if (b && !b.disabled) b.focus();
      else orderList.querySelector('button:not(:disabled)')?.focus();
    }
  }
  function focusProfile(name) {
    [...profileList.querySelectorAll('[data-word="rename"]')]
      .find((b) => b.dataset.profileName === name)
      ?.focus();
  }
  function finishEditing(name) {
    editingProfile = null;
    renderProfiles();
    focusProfile(name);
  }
  function renderProfiles() {
    undoSavedButton.hidden = !profileUndo.length;
    const signature = document.documentElement.lang + JSON.stringify(profiles) + editingProfile;
    for (const row of profileList.querySelectorAll('[data-saved-name]')) {
      const profile = profiles.find((p) => p.name === row.dataset.savedName);
      const same = profile && presentation(profile.layout) === presentation(data);
      row.dataset.current = String(Boolean(same));
      const marker = row.querySelector('.workspace-current-marker');
      if (marker) {
        marker.hidden = !same;
        marker.textContent = t('current');
      }
      const update = row.querySelector('[data-word="update"]');
      if (update) update.disabled = Boolean(same);
    }
    if (profileList.dataset.signature === signature) return;
    profileList.dataset.signature = signature;
    profileList.replaceChildren();
    if (!profiles.length) {
      const p = document.createElement('p');
      p.className = 'workspace-settings-hint';
      p.textContent = t('empty');
      profileList.append(p);
    }
    for (const profile of profiles) {
      const row = document.createElement('div');
      row.className = 'workspace-profile-row';
      row.dataset.savedName = profile.name;
      row.dataset.current = String(presentation(profile.layout) === presentation(data));
      if (editingProfile === profile.name) {
        const form = document.createElement('form'),
          input = document.createElement('input');
        form.className = 'workspace-profile-editor';
        form.noValidate = true;
        input.type = 'text';
        input.value = editDraft;
        input.maxLength = 40;
        input.setAttribute('aria-label', t('name'));
        input.oninput = () => {
          editDraft = input.value;
          input.removeAttribute('aria-invalid');
        };
        form.append(input);
        button(form, 'saveName', () => {}).type = 'submit';
        button(form, 'cancelEdit', () => finishEditing(profile.name), 'm7 7 10 10M17 7 7 17');
        form.onsubmit = (e) => {
          e.preventDefault();
          const name = input.value.trim();
          if (!name || profiles.some((p) => p !== profile && p.name === name)) {
            input.setAttribute('aria-invalid', 'true');
            input.setAttribute('aria-errormessage', panelStatus.id);
            announce('nameConflict');
            input.focus();
            return;
          }
          editingProfile = null;
          mutateProfiles(() => {
            profile.name = name;
          }, 'renamed');
          focusProfile(name);
        };
        row.append(form);
        profileList.append(row);
        continue;
      }
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.className = 'workspace-profile-apply';
      const title = document.createElement('span'),
        marker = document.createElement('small');
      title.textContent = profile.name;
      marker.className = 'workspace-current-marker';
      marker.textContent = t('current');
      marker.hidden = presentation(profile.layout) !== presentation(data);
      apply.append(title, marker);
      apply.onclick = () =>
        change(() => {
          data = { ...copy(profile.layout), enabled: true };
        }, 'applied');
      row.append(apply);
      const update = button(
        row,
        'update',
        () =>
          mutateProfiles(() => {
            profile.layout = copy(data);
          }, 'updated'),
        'M4 4h14l2 2v14H4zM8 4v6h8V4M8 20v-6h8v6',
      );
      update.dataset.profileName = profile.name;
      update.disabled = presentation(profile.layout) === presentation(data);
      const rename = button(
        row,
        'rename',
        () => {
          editingProfile = profile.name;
          editDraft = profile.name;
          renderProfiles();
          const input = profileList.querySelector('.workspace-profile-editor input');
          input.focus();
          input.select();
        },
        'm4 16 11-11 4 4-11 11H4zM13 7l4 4',
      );
      rename.dataset.profileName = profile.name;
      const remove = button(
        row,
        'delete',
        () => {
          mutateProfiles(() => {
            profiles = profiles.filter((p) => p !== profile);
          }, 'deleted');
          undoSavedButton.focus();
        },
        'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7',
      );
      remove.dataset.profileName = profile.name;
      profileList.append(row);
    }
    labelButtons(profileList);
    saveHint.textContent = profiles.length >= 5 ? t('limit') : t('saveHint');
  }
  function apply() {
    const previousFocus = document.activeElement;
    api.sync();
    plot.style.setProperty('--workspace-ratio', data.ratio + '%');
    plot.style.setProperty('--workspace-row-ratio', data.rowRatio + '%');
    plot.dataset.workspaceCount = data.views.length;
    plot.dataset.workspaceAxis = data.axis;
    plot.dataset.workspaceFeatured = String(data.featured);
    plot.dataset.workspaceFocus = String(Boolean(focused));
    undoButton.disabled = !undo.length;
    redoButton.disabled = !redo.length;
    quickLayout.hidden = Boolean(focused);
    backButton.hidden = !focused;
    arrange.hidden = mobile.matches || data.views.length === 1;
    axisGroup.hidden = data.views.length === 4;
    equalizeButton.disabled = data.ratio === 50 && data.rowRatio === 50;
    available.hidden = data.views.length === ids.length;
    availableButtons.forEach((b, i) => {
      b.hidden = data.views.includes(ids[i]);
    });
    featuredGroup.hidden = data.views.length !== 3;
    proportionFields.forEach((input, i) => {
      const axis = i ? 'rows' : 'columns';
      input.value = data[i ? 'rowRatio' : 'ratio'];
      input.disabled = data.views.length === 2 && data.axis !== axis;
    });
    axisButtons.forEach((b, i) => {
      b.setAttribute('aria-pressed', String(data.axis === ['columns', 'rows'][i]));
      b.disabled = data.views.length === 1;
    });
    featuredButtons.forEach((b, i) =>
      b.setAttribute('aria-pressed', String(data.featured === [false, true][i])),
    );
    presetButtons.forEach((b, i) =>
      b.setAttribute('aria-pressed', String(data.views.length === [1, 2, 4][i])),
    );
    for (const [id, card] of Object.entries(cards))
      card.dataset.workspacePosition = String(data.views.indexOf(id));
    for (const id of api.active ? data.views : ids) plot.insertBefore(cards[id], splitters.x);
    for (const axis of ['x', 'y']) {
      const split = splitters[axis];
      split.setAttribute('aria-valuenow', String(data[axis === 'x' ? 'ratio' : 'rowRatio']));
      split.hidden =
        !api.active ||
        mobile.matches ||
        Boolean(focused) ||
        data.views.length === 1 ||
        (data.views.length === 2 && data.axis !== (axis === 'x' ? 'columns' : 'rows'));
    }
    if (tabs.dataset.order !== data.views.join(',')) {
      tabs.dataset.order = data.views.join(',');
      tabs.replaceChildren();
      data.views.forEach((id, i) => {
        const b = button(tabs, id, () => {
          data.active = i;
          save();
          apply();
        });
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-controls', cards[id].id || (cards[id].id = 'workspace-' + id));
      });
    }
    for (const [b, i] of [...tabs.children].map((b, i) => [b, i])) {
      b.setAttribute('aria-selected', String(i === data.active));
      b.tabIndex = i === data.active ? 0 : -1;
    }
    labels();
    if (optionOpen) {
      renderOrder();
      renderProfiles();
      placeOptions();
    }
    renderUIWorkspace();
    if (
      previousFocus?.isConnected &&
      previousFocus !== document.activeElement &&
      !previousFocus.disabled &&
      previousFocus.closest('.workspace-toolbar,.workspace-pane-tools,.workspace-options')
    )
      previousFocus.focus({ preventScroll: true });
    schedule();
  }
  function placeOptions() {
    if (!optionOpen) return;
    const r = optionsButton.getBoundingClientRect(),
      width = Math.min(360, innerWidth - 24);
    panel.style.width = width + 'px';
    panel.style.left = Math.max(12, Math.min(innerWidth - width - 12, r.right - width)) + 'px';
    panel.style.top = Math.max(12, Math.min(r.bottom + 8, innerHeight - 180)) + 'px';
    panel.style.maxHeight = Math.max(150, innerHeight - parseFloat(panel.style.top) - 12) + 'px';
  }
  function closeOptions(restore = false) {
    if (!optionOpen) return;
    optionOpen = false;
    editingProfile = null;
    statusKey = '';
    optionsButton.setAttribute('aria-expanded', 'false');
    if (nativePopover && panel.matches(':popover-open')) panel.hidePopover();
    panel.hidden = true;
    if (restore) optionsButton.focus();
  }
  function toggleOptions() {
    if (optionOpen) {
      closeOptions(true);
      return;
    }
    optionOpen = true;
    panel.hidden = false;
    statusKey = '';
    panelStatus.textContent = '';
    labels();
    renderOrder();
    renderProfiles();
    placeOptions();
    optionsButton.setAttribute('aria-expanded', 'true');
    if (nativePopover) panel.showPopover();
    panel.querySelector('button:not(:disabled)')?.focus();
  }
  if (nativePopover)
    panel.addEventListener('toggle', (e) => {
      if (e.newState === 'closed' && optionOpen) {
        editingProfile = null;
        optionOpen = false;
        statusKey = '';
        panel.hidden = true;
        optionsButton.setAttribute('aria-expanded', 'false');
      }
    });
  document.addEventListener('pointerdown', (e) => {
    if (optionOpen && !panel.contains(e.target) && !optionsButton.contains(e.target))
      closeOptions();
  });
  tabs.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    data.active =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? data.views.length - 1
          : (data.active + (e.key === 'ArrowLeft' ? -1 : 1) + data.views.length) %
            data.views.length;
    save();
    apply();
    tabs.children[data.active].focus();
  });
  SkyCustomizationMode.install({
    launch,
    isActive: () => customizing,
    canExit() {
      for (const frame of document.querySelectorAll('iframe')) {
        try {
          if (frame.contentWindow?.SkyDiagramTools?.leave?.() === false) return false;
        } catch {}
      }
      return true;
    },
    apply(value) {
      cancel();
      closeOptions();
      focused = null;
      if (value) {
        normalSelection = ['sceneBuilder', 'solarStudy'].includes(uiWorkspace.selected)
          ? 'contextPanel'
          : uiWorkspace.selected;
        customizing = true;
        data.enabled = true;
      } else {
        customizing = false;
        data.enabled = false;
        uiWorkspace.selected = normalSelection || 'contextPanel';
      }
      const hash = '#' + uiWorkspace.selected;
      if (location.hash !== hash) history.replaceState(history.state, '', hash);
    },
    changed() {
      for (const frame of document.querySelectorAll('iframe')) {
        try {
          frame.contentDocument?.dispatchEvent(
            new CustomEvent('skymotion:customization', { detail: { active: customizing } }),
          );
        } catch {}
      }
      save();
      apply();
      launch.focus({ preventScroll: true });
    },
  });
  function start(e, id, axis) {
    if (!api.active || mobile.matches || focused || e.button !== 0) return;
    e.preventDefault();
    cancel();
    closeOptions();
    const rect = plot.getBoundingClientRect(),
      bounds = e.currentTarget.getBoundingClientRect(),
      ghost = document.createElement('div');
    ghost.className = id ? 'workspace-ghost' : `workspace-guide workspace-guide-${axis}`;
    ghost.dataset.i18nSkip = '';
    if (id) ghost.textContent = t(id);
    else if (axis === 'x') {
      ghost.style.top = bounds.top + 'px';
      ghost.style.height = bounds.height + 'px';
    } else {
      ghost.style.left = bounds.left + 'px';
      ghost.style.width = bounds.width + 'px';
    }
    document.body.append(ghost);
    gesture = {
      pointer: e.pointerId,
      source: e.currentTarget,
      id,
      axis,
      rect,
      ghost,
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
  function targetAt(g, x, y) {
    return g.rects.find(
      (n) =>
        n.id !== g.id &&
        x >= n.rect.left &&
        x <= n.rect.right &&
        y >= n.rect.top &&
        y <= n.rect.bottom,
    )?.id;
  }
  function ratioAt(g, x, y) {
    return Math.max(
      30,
      Math.min(
        70,
        Math.round(
          (g.axis === 'x' ? (x - g.rect.left) / g.rect.width : (y - g.rect.top) / g.rect.height) *
            100,
        ),
      ),
    );
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
        g.target = targetAt(g, g.x, g.y);
        for (const [id, c] of Object.entries(cards))
          c.classList.toggle('workspace-drop', id === g.target);
      } else {
        const ratio = ratioAt(g, g.x, g.y);
        g.ghost.style.transform =
          g.axis === 'x'
            ? `translateX(${g.rect.left + (g.rect.width * ratio) / 100}px)`
            : `translateY(${g.rect.top + (g.rect.height * ratio) / 100}px)`;
      }
    });
  });
  window.addEventListener('pointerup', (e) => {
    const g = gesture;
    if (!g || e.pointerId !== g.pointer) return;
    const target = g.id ? targetAt(g, e.clientX, e.clientY) : null,
      ratio = g.id ? 0 : ratioAt(g, e.clientX, e.clientY);
    cancel();
    if (!g.moved) return;
    if (target)
      change(() => {
        const i = data.views.indexOf(g.id),
          j = data.views.indexOf(target);
        [data.views[i], data.views[j]] = [data.views[j], data.views[i]];
      });
    else if (!g.id) change(() => (data[g.axis === 'x' ? 'ratio' : 'rowRatio'] = ratio));
  });
  for (const name of ['pointercancel', 'blur', 'pagehide', 'popstate', 'hashchange'])
    window.addEventListener(name, cancel);
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') {
        if (gesture) {
          e.preventDefault();
          e.stopImmediatePropagation();
          cancel();
        } else if (optionOpen && editingProfile) {
          e.preventDefault();
          e.stopImmediatePropagation();
          finishEditing(editingProfile);
        } else if (optionOpen) {
          e.preventDefault();
          e.stopImmediatePropagation();
          closeOptions(true);
        } else if (focused) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const id = focused;
          focused = null;
          apply();
          controls.get(id).focus.focus();
        }
      } else if (
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        e.key.toLowerCase() === 'z' &&
        !e.target.closest('input,textarea,select') &&
        e.target.closest('.workspace-toolbar,.workspace-options,.workspace-pane-tools')
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        travel(e.shiftKey ? redo : undo, e.shiftKey ? undo : redo);
      }
    },
    true,
  );
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancel();
      closeOptions();
    }
  });
  window.addEventListener('storage', (event) => {
    if (event.key === profileKey() || event.key === null) {
      profiles = loadProfiles();
      profileUndo = [];
      editingProfile = null;
      if (optionOpen) renderProfiles();
    }
  });
  window.addEventListener('resize', () => {
    cancel();
    placeOptions();
  });
  document.addEventListener('skymotion:language', () => {
    labels();
    if (optionOpen) {
      renderOrder();
      renderProfiles();
    }
  });
  mobile.addEventListener('change', () => {
    cancel();
    closeOptions();
    focused = null;
    data = load();
    data.enabled = customizing;
    undo = [];
    redo = [];
    // Resizing switches the layout profile, never the diagram being edited.
    apply();
  });
  if (customizing && data.enabled && (!location.hash || location.hash === '#solarCompare'))
    uiWorkspace.selected = 'solarCompare';
  if (state.body === 'moon') state.companion = true;
  apply();
})();
