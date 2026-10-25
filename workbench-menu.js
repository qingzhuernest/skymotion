/** One content tree for the sky laboratory, related diagrams and annual observations. */
(() => {
  if (!document.body.hasAttribute('data-entry-view') || !uiWorkspace) return;
  const rail = uiWorkspace.rail;
  const menu = document.createElement('section');
  menu.id = 'workbenchViews';
  menu.className = 'workbench-views';
  menu.dataset.i18nSkip = '';
  menu.hidden = true;
  rail.append(menu);
  const english = () => document.documentElement.lang === 'en';
  const tr = (zh, en) => (english() ? en : zh);
  const linkedSettings = rail.querySelector('.ui-linked-settings');
  const tree = document.createElement('div');
  tree.className = 'workbench-view-tree';
  menu.append(tree);
  const entries = [];
  const catalog = window.SkySiteCatalog;
  const groups = catalog.groups.map(([zh, en], group) => [
    zh,
    en,
    catalog.views
      .filter((view) => view.group === group)
      .map((view) => [view.id, ...(view.labels.sun || view.labels.moon)]),
    catalog.groupIds[group],
  ]);
  function select(id) {
    if (id === 'solarCompare') {
      window.skyWorkspacePresentation.openOverview();
      uiWorkspace.tabs.querySelector('[data-route-diagram=solarCompare]').click();
      schedule();
      return;
    }
    const layoutId = catalog.layoutId(id, state.body);
    if (!window.skyWorkspacePresentation?.selectView(layoutId)) {
      const tab = uiWorkspace.tabs.querySelector(`[data-route-diagram="${id}"]`);
      if (!tab || tab.hidden) return;
      tab.click();
    }
    schedule();
  }
  for (const [zh, en, items, key] of groups) {
    const group = document.createElement('details');
    group.open = true;
    group.className = 'workbench-content-group menu-section';
    group.dataset.group = key;
    const summary = document.createElement('summary');
    group.append(summary);
    tree.append(group);
    if (key === 'compare' && linkedSettings) {
      linkedSettings.classList.add('workbench-setting-row');
      group.append(linkedSettings);
    }
    for (const [id, name, translation] of items) {
      const row = document.createElement('div');
      row.className = 'workbench-content-row';
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.workbenchView = id;
      button.dataset.diagram = id;
      button.onclick = () => select(id);
      row.append(button);
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'workbench-add-view';
      add.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
      add.onclick = () => {
        const api = window.skyWorkspacePresentation;
        const layoutId = catalog.layoutId(id, state.body);
        if (api.views.includes(layoutId) && uiWorkspace.selected === 'solarCompare')
          api.removeView(layoutId);
        else api.addView(layoutId);
        sync();
      };
      row.append(add);
      group.append(row);
      entries.push({ id, name, translation, button, add, row });
    }
    group.dataset.zh = zh;
    group.dataset.en = en;
  }
  // Relocate the original controls: one owner, one event path, no duplicate tabs.
  const viewpoints = document.querySelector('.view-tabs');
  const skyEntry = entries.find((entry) => entry.id === 'skyPanel');
  if (viewpoints && skyEntry) {
    skyEntry.row.after(viewpoints);
    viewpoints.classList.remove('md-connected-choice', 'motion-segments');
    viewpoints.classList.add('workbench-viewpoints');
    viewpoints.addEventListener(
      'click',
      (event) => {
        if (event.target.closest('[data-view]')) select('skyPanel');
      },
      true,
    );
  }
  const layout = document.createElement('details');
  layout.className = 'workbench-layout-section menu-section';
  const summary = document.createElement('summary');
  layout.append(summary);
  const options = document.getElementById('workspaceOptions');
  if (options) layout.append(options);
  menu.append(layout);
  const annual = rail.querySelector('[data-for="analemmaPanel"]');
  const clockLink = document.createElement('label');
  clockLink.className = 'workbench-clock-link toggle-row';
  const follow = document.createElement('input');
  follow.type = 'checkbox';
  follow.setAttribute('role', 'switch');
  follow.id = 'analemmaFollowClock';
  follow.checked = uiWorkspace.analemmaClockLinked;
  follow.onchange = () => {
    stop();
    uiWorkspace.analemmaClockLinked = follow.checked;
    schedule();
  };
  const followText = document.createElement('span');
  const samplingClock = document.createElement('span');
  samplingClock.className = 'workbench-sampling-clock';
  uiWorkspace.cards.analemmaPanel
    .querySelector('.ui-diagram-card-head')
    .append(samplingClock);
  clockLink.append(followText, follow);
  annual?.prepend(clockLink);
  for (const id of ['analemmaClock', 'analemmaBasis']) {
    document.getElementById(id).addEventListener('change', () => {
      uiWorkspace.analemmaClockLinked = false;
      follow.checked = false;
    });
  }
  function sync() {
    const api = window.skyWorkspacePresentation;
    const editing = window.SkyCustomization?.active === true;
    const visible = api?.active ? api.visibleIds : new Set([uiWorkspace.selected]);
    syncSkyViewControls();

    for (const group of tree.children) {
      const title = group.querySelector('summary');
      uiViewText(title, tr(group.dataset.zh, group.dataset.en));
    }
    for (const entry of entries) {
      const available = uiWorkspace.tabs.querySelector(
        `[data-route-diagram="${entry.id}"]`,
      );
      uiViewHidden(entry.row, !available || available.hidden);
      const label = catalog.label(entry.id, state.body);
      const name = tr(...(label || [entry.name, entry.translation]));
      const layoutId = catalog.layoutId(entry.id, state.body);
      uiViewText(entry.button, name);
      uiViewAttribute(
        entry.button,
        'title',
        api?.active &&
          Object.hasOwn(uiWorkspace.cards, layoutId) &&
          !visible.has(layoutId)
          ? tr('在当前图位显示：', 'Show in the current pane: ') + name
          : tr('查看：', 'View: ') + name,
      );
      entry.row.classList.toggle(
        'workbench-current-view',
        api?.active ? api.activeView === layoutId : uiWorkspace.selected === entry.id,
      );
      const selected =
        entry.id === 'solarCompare' ? !!api?.active : visible?.has(layoutId);
      uiViewAttribute(entry.button, 'aria-pressed', String(!!selected));
      uiViewAttribute(
        entry.button,
        'aria-busy',
        String(entry.id === 'lunarOrbit' && !!uiWorkspace.pendingLunar),
      );
      uiViewHidden(entry.add, !editing || !Object.hasOwn(uiWorkspace.cards, layoutId));
      const included = api?.active && api.views.includes(layoutId);
      uiViewAttribute(
        entry.add,
        'aria-label',
        tr(
          included ? '移除：' : '加入组合：',
          included ? 'Remove: ' : 'Add to layout: ',
        ) + name,
      );
      uiViewAttribute(entry.add, 'aria-pressed', String(!!included));
      entry.add.disabled = !!included && api.views.length === 1;
    }
    for (const group of tree.children) {
      const setting = group.querySelector('.workbench-setting-row');
      uiViewHidden(
        group,
        ![...group.querySelectorAll('.workbench-content-row')].some(
          (row) => !row.hidden,
        ) &&
          (!setting || setting.hidden),
      );
    }
    uiViewText(summary, tr('排列与收藏', 'Arrangement & saved layouts'));
    uiViewHidden(layout, !editing);
    follow.checked = uiWorkspace.analemmaClockLinked;
    uiViewText(
      followText,
      tr(
        '跟随下方真太阳时（不含均时差的左右变化）',
        'Follow the apparent solar clock (removes equation-of-time motion)',
      ),
    );
    uiViewText(
      samplingClock,
      hhmm(state.analemmaClock) +
        ' · ' +
        tr(
          state.analemmaBasis === 'clock' ? '固定钟表时' : '固定真太阳时',
          state.analemmaBasis === 'clock'
            ? 'Fixed civil clock'
            : 'Fixed apparent solar time',
        ),
    );
    document.body.classList.toggle('workbench-editing', editing);
    window.SkyObserverExplanation?.sync();
  }
  window.SkyWorkbenchMenu = {
    sync,
    select,
    openLayout() {
      if (window.SkyDiagramTools?.selectSidebar('views') === false) return;
      layout.open = true;
      menu.hidden = false;
      options.hidden = false;
      const revealLayout = () => {
        const header = rail.querySelector('.motion-menu-header');
        rail.scrollTop +=
          layout.getBoundingClientRect().top -
          (header?.getBoundingClientRect().bottom || rail.getBoundingClientRect().top) -
          8;
      };
      requestAnimationFrame(() => {
        revealLayout();
        Promise.all(
          layout.getAnimations().map((animation) => animation.finished.catch(() => {})),
        ).then(revealLayout);
      });
      if (
        matchMedia('(max-width:760px)').matches &&
        !document.getElementById('uiParameterDrawer').open
      )
        document.getElementById('uiParametersButton').click();
    },
  };
  layout.addEventListener('toggle', () => {
    if (layout.open && options.hidden && window.SkyCustomization?.active)
      window.skyWorkspacePresentation.openOptions();
  });
  document.addEventListener('skymotion:language', sync);
  document.addEventListener('skymotion:customization', sync);
  // The existing tabs remain the routing mechanism; the sidebar is the sole visible catalog.
  uiWorkspace.tabs.classList.add('workbench-route-tabs');
  sync();
})();
