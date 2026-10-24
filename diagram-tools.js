/** Scientific reference objects for the existing plots. Does not mutate their experiment. */
(() => {
  const models = new Map(),
    states = new Map(),
    portals = new Map();
  const R = Math.PI / 180,
    copy = (x) => JSON.parse(JSON.stringify(x)),
    stableJSON = (value) =>
      JSON.stringify(value, (key, item) => {
        if (!item || Array.isArray(item) || typeof item !== 'object') return item;
        return Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((name) => [name, item[name]]),
        );
      });
  const validDate = (value) => window.SkyMotionSession.validDate(value);
  const en = () => document.documentElement.lang === 'en';
  const tr = (x) =>
    typeof x === 'string' ? x.split('|')[en() ? 1 : 0] || x.split('|')[0] : String(x);
  const E = (tag, cls, parent) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.append(e);
    return e;
  };
  const { definitions, common, titles } = window.SkyDiagramDefinitions;
  let current = null,
    selected = null,
    armed = null,
    serial = 0,
    drag = null,
    editing = true,
    nudging = null,
    visibilityTimer = 0;
  const panel = E('section', 'diagram-tools dt-panel', document.body);
  panel.hidden = true;
  panel.id = 'diagram-tool-panel';
  panel.dataset.i18nSkip = '';
  panel.setAttribute('role', 'region');
  const head = E('div', 'dt-head', panel),
    title = E('h2', '', head),
    close = E('button', '', head);
  close.type = 'button';
  close.textContent = '×';
  close.onclick = () => hide();
  title.id = 'diagram-tool-heading';
  panel.setAttribute('aria-labelledby', title.id);
  const fold = E('button', 'dt-collapse', panel);
  fold.type = 'button';
  fold.setAttribute('aria-expanded', 'true');
  fold.onclick = () => {
    panel.dataset.collapsed = String(panel.dataset.collapsed !== 'true');
    updateFold();
  };
  head.insertBefore(fold, close);
  function updateFold() {
    const collapsed = panel.dataset.collapsed === 'true';
    fold.textContent = tr(
      collapsed ? '展开工作台|Expand workbench' : '收起工作台|Collapse workbench',
    );
    fold.setAttribute('aria-label', fold.textContent);
    fold.setAttribute('aria-expanded', String(!collapsed));
  }
  function updateMode() {
    if (current)
      (current.host || current.canvas).classList.toggle(
        'dt-editing',
        !panel.hidden && customizationOn(),
      );
  }
  function setEditing(value) {
    finishNudge();
    cancelDrag();
    editing = value;
    armed = null;
    placementUI();
    repaint();
  }
  const tabs = E('nav', 'dt-tabs', panel),
    scroll = E('div', 'dt-scroll', panel),
    library = E('section', 'dt-library', scroll),
    objects = E('section', 'dt-objects', scroll),
    files = E('section', 'dt-files', scroll);
  let selectedSource = null;
  function selectedOwner() {
    return current && selectedSource && selectedSource !== current.id
      ? comparisonModel(selectedSource)
      : current;
  }
  function selectedKey() {
    return selectedSource && selectedSource !== current?.id
      ? selectedSource + ':' + selected
      : selected;
  }
  function entries() {
    if (!current) return [];
    const local = stateFor(current).objects.map((o) => ({ o, source: current.id }));
    if (
      current.body === 'sun' &&
      ['lab', 'diagrams'].includes(document.body.dataset.page)
    ) {
      for (const o of comparisonList())
        if (o.source !== current.id) local.push({ o, source: o.source });
    }
    return local;
  }
  let activeView = 'objects',
    pendingImport = null,
    clearPending = false,
    importRequest = 0,
    mountedRail = null,
    railScroll = 0,
    railNavigation = null,
    railView = 'conditions',
    referenceMode = true;
  const views = { library, objects, files },
    tabLabels = {
      library: '添加对象|Add object',
      objects: '返回对象|Back to objects',
      files: '方案|Plans',
    };
  for (const key of Object.keys(views)) {
    const b = E('button', '', tabs);
    b.type = 'button';
    b.dataset.dtView = key;
    b.onclick = () =>
      switchView(activeView === key && key !== 'objects' ? 'objects' : key);
  }
  function switchView(key, force = false) {
    if (!force) {
      commitActive();
      if (!validInputs()) return;
      if (armed) {
        armed = null;
        placementUI();
        repaint();
      }
      clearPending = false;
      updateFiles();
    }
    const positions = current ? (stateFor(selectedOwner()).viewScroll ??= {}) : {};
    positions[activeView] = scroll.scrollTop;
    if (key === 'files' && current && selectedSource !== current.id) {
      selectedSource = current.id;
      selected = stateFor(current).lastSelected || null;
    }
    activeView = key;
    scroll.dataset.view = key;
    for (const [name, section] of Object.entries(views)) section.hidden = name !== key;
    for (const b of tabs.querySelectorAll('[data-dt-view]')) {
      b.textContent = tr(tabLabels[b.dataset.dtView]);
      b.title = b.textContent;
      b.hidden = b.dataset.dtView === 'objects' && key === 'objects';
      b.setAttribute('aria-expanded', String(b.dataset.dtView === key));
      if (b.dataset.dtView === key) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    }
    scroll.scrollTop = positions[key] || 0;
  }
  // Only scroll the workbench's own content, never the surrounding page/canvas.
  function revealField(input) {
    const container = desktopSplit() && inspector.contains(input) ? inspector : scroll;
    revealWithin(input, container);
  }
  const desktopSplit = () =>
    matchMedia('(min-width:1000px) and (min-height:650px)').matches;
  function revealWithin(element, container) {
    const r = element.getBoundingClientRect(),
      bounds = container.getBoundingClientRect();
    if (r.bottom > bounds.bottom - 8) container.scrollTop += r.bottom - bounds.bottom + 8;
    else if (r.top < bounds.top + 8) container.scrollTop += r.top - bounds.top - 8;
  }
  const libraryTitle = E('h3', '', library),
    libraryIntro = E('p', 'dt-caption', library),
    cityPicker = E('label', 'dt-city-picker', library),
    cityCaption = E('span', '', cityPicker),
    citySelect = E('select', '', cityPicker),
    add = E('div', 'dt-add', library),
    recipe = E('button', 'dt-recipe', library);
  const goalLabel = E('div', 'dt-goal'),
    goalTitle = E('label', '', goalLabel),
    goal = E('select', '', goalLabel);
  goal.id = 'dt-experiment-goal';
  goalTitle.htmlFor = goal.id;
  goal.dataset.experimentGoal = '';
  library.insertBefore(goalLabel, cityPicker);
  const goalHelp = E('p', 'dt-purpose-help', goalLabel);
  const advanced = E('details', 'dt-advanced', library),
    advancedTitle = E('summary', '', advanced);
  advanced.append(add);
  goalLabel.append(cityPicker, recipe);
  const goalHints = {
    places:
      '使用同一 UTC 瞬间；选下方城市，随后可拖动经纬度。原地点保持不变。|Compare one shared UTC instant. Choose a city below, then drag its coordinates. The baseline stays unchanged.',
    times:
      '固定当前地点与日期，加入 09:00 和 15:00 两个时刻；拖动各自的时间滑条继续比较。|Keep this location and date; add 09:00 and 15:00 markers, then drag their time sliders.',
    shadow:
      '进入实验地面，点击放置一根杆；原地点、日期与时间仍决定光照。|Open the experiment ground and click to place a rod; the original location, date and time determine the light.',
    dates:
      '保留当前地点，添加另一个日期进行比较；可在对象属性中调整日期。|Keep this location and add another date to compare; adjust it in the object properties.',
    track:
      '比较不同纬度或时刻的日行迹；可在属性中独立调整每条轨迹。|Compare analemmas at different latitudes or times; adjust each track independently in its properties.',
  };
  goal.onchange = () => {
    recipe.hidden = !goal.value;
    if (
      goal.value === 'places' &&
      citySelect.value === [current.lat, current.lon].join(',')
    )
      citySelect.value = current.lat === -33.9 ? '51.5,-0.1' : '-33.9,151.2';
    goalHelp.textContent = tr(
      goalHints[goal.value] ||
        '选择实验目的，或展开下方“自由添加工具”逐个放置标记和说明。原图观测条件保持不变。|Choose an experiment, or expand Add individual tools below to place markers and notes one at a time. The original observation conditions stay unchanged.',
    );
  };
  recipe.type = 'button';
  recipe.onclick = startExperiment;
  recipe.hidden = true;
  citySelect.id = 'dt-add-city';
  cityCaption.textContent = tr('新增观察点的地点|Location for the new observer');
  for (const option of document.querySelectorAll('#place option')) {
    const copy = option.cloneNode(true);
    if (copy.value === 'custom') continue;
    citySelect.append(copy);
  }
  citySelect.value = document.querySelector('#place')?.value || '';
  const objectHeading = E('div', 'dt-object-heading', objects),
    objectTitle = E('h3', '', objectHeading),
    addAnother = E('button', 'dt-add-another', objectHeading);
  addAnother.type = 'button';
  addAnother.hidden = true;
  addAnother.onclick = () => {
    switchView('library');
    if (activeView === 'library') {
      scroll.scrollTop = 0;
      add.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
    }
  };
  const list = E('div', 'dt-list', objects),
    inspector = E('section', 'dt-inspector', objects),
    inspectorTitle = E('h3', '', inspector),
    form = E('div', 'dt-fields', inspector),
    result = E('p', 'dt-result', inspector),
    actions = E('div', 'dt-actions dt-footer', panel),
    status = E('p', 'dt-status', panel);
  const mobileBack = E('button', 'dt-back-list', objects);
  mobileBack.type = 'button';
  mobileBack.onclick = () => {
    panel.dataset.detail = 'false';
    scroll.scrollTop = 0;
    selectedRow()?.focus({ preventScroll: true });
  };
  objects.insertBefore(mobileBack, inspector);
  const referenceHelp = E('p', 'dt-reference-help', inspector);
  form.after(referenceHelp);
  const locationPanel = E('div', 'dt-location', inspector),
    locationInfo = E('p', '', locationPanel),
    locationApply = E('button', '', locationPanel);
  referenceHelp.after(locationPanel);
  locationApply.type = 'button';
  locationApply.dataset.observeLocation = '';
  const objectActions = E('div', 'dt-object-actions dt-actions', inspector),
    historyActions = E('div', 'dt-history dt-actions', panel);
  tabs.append(historyActions);
  const help = E('button', 'dt-help-toggle', historyActions);
  help.type = 'button';
  help.setAttribute('aria-expanded', 'false');
  help.setAttribute('aria-controls', 'dt-help-text');
  help.onclick = () => {
    panel.dataset.help = String(panel.dataset.help !== 'true');
    help.setAttribute('aria-expanded', panel.dataset.help);
  };
  const hint = E('p', 'dt-hint', panel),
    placement = E('button', 'dt-place', panel),
    cancelPlacement = E('button', 'dt-cancel-place', panel);
  cancelPlacement.type = 'button';
  cancelPlacement.hidden = true;
  cancelPlacement.onclick = () => {
    armed = null;
    placementUI();
    switchView('objects', true);
    repaint();
  };
  panel.insertBefore(cancelPlacement, tabs);
  panel.insertBefore(hint, tabs);
  panel.insertBefore(placement, tabs);
  hint.id = 'dt-help-text';
  status.setAttribute('role', 'status');
  status.id = 'diagram-tool-status';
  result.setAttribute('aria-live', 'polite');
  placement.type = 'button';
  placement.hidden = true;
  placement.onclick = () => placeAt(current.w / 2, current.h / 2);
  const fileTitle = E('h3', '', files),
    fileIntro = E('p', 'dt-caption', files),
    fileActions = E('div', 'dt-file-actions dt-actions', files),
    importReview = E('div', 'dt-import-review', files),
    fileInput = E('input', '', files);
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.hidden = true;
  fileInput.onchange = () => readImport(fileInput.files[0]);
  function placementUI() {
    updateMode();
    help.textContent = tr('操作提示|Help');
    help.title = help.textContent;
    panel.dataset.placing = String(!!armed);
    placement.hidden = cancelPlacement.hidden = !armed;
    cancelPlacement.textContent = tr('取消放置|Cancel placement');
    placement.textContent = tr('直接放在图中央|Place at the center');
    hint.textContent = armed
      ? tr('已选：|Selected: ') +
        tr(armed.title) +
        tr(
          '。点一下画布放置，或点击下方按钮直接添加。点“取消放置”或按 Esc 可取消。|. Tap the plot to place it, or use the button below. Choose Cancel placement or press Esc to cancel.',
        )
      : current && stateFor(current).objects.length >= 40
        ? tr(
            '已达到 40 个参考对象上限；删除一个后可继续添加。|40-reference limit reached; remove one to add another.',
          )
        : tr(
            '点选对象查看属性，拖动手柄调整；空白处沿用原图操作。方向键微调，Ctrl/Cmd+Z 撤销，Esc 取消当前操作。|Select an object to view properties and drag its handle to adjust it. Empty space uses the original plot controls. Arrow keys nudge, Ctrl/Cmd+Z undoes, and Esc cancels the current action.',
          );
  }
  const guideLink = E('a', 'dt-guide-link', hint);
  function contextualHelp() {
    if (armed || (current && stateFor(current).objects.length >= 40)) return;
    const descriptions = {
      sky: '原观测条件控制底部时间栏；所选对照有自己的滑条。经度比较先区分同一 UTC 瞬间与各地真太阳时。|The bottom timeline controls the baseline; comparisons have their own sliders. Distinguish one UTC instant from each location’s apparent solar time.',
      analemma:
        '赤纬与时角不随纬度变化；要比较纬度，请使用天空视图。钟表时与真太阳时产生的轨迹不同。|Declination and hour angle do not change with latitude; use the sky view to compare latitudes. Clock time and apparent solar time produce different tracks.',
      phase:
        '月相由日地月几何关系决定；示意中的距离与天体大小不是同一比例。|Moon phases follow Sun–Earth–Moon geometry; displayed distances and body sizes use different scales.',
      space:
        '相机移动只改变观察视角；观察站改变真实观测位置。天体大小和轨道距离采用教学尺度。|Moving the camera changes your viewpoint; moving a station changes the observer. Body sizes and orbital distances use teaching scales.',
      companion:
        '画面上的靠近不代表真实空间距离接近；地平线以下的位置不能直接观测。|Nearby positions on the plot do not imply nearby bodies in space. Positions below the horizon are not directly observable.',
    };
    hint.textContent = tr(
      descriptions[current?.type] ||
        '拖动滑条连续预览，输入框精确设置。方向键微调，Ctrl/Cmd+Z 撤销；拖动中按 Esc 恢复。保存仅写入此设备，不会跨浏览器同步。|Drag sliders to preview or type precise values. Arrow keys fine-tune, Ctrl/Cmd+Z undoes, and Escape cancels a drag. Saves stay on this device and do not sync across browsers.',
    );
    guideLink.textContent = tr('查看操作指南|Read the guide');
    guideLink.href =
      (document.body.dataset.page === 'space' || document.body.dataset.page === 'lunar'
        ? '../'
        : '') +
      (en() ? 'guide.en.html' : 'guide.html') +
      '#customization';
    hint.append(document.createTextNode(' '), guideLink);
  }
  function arm(def) {
    finishNudge();
    editing = true;
    armed = def;
    panel.dataset.detail = 'false';
    placementUI();
    if (current.canvas.tabIndex < 0) current.canvas.tabIndex = 0;
    if (document.getElementById('uiParameterDrawer')?.open)
      placement.focus({ preventScroll: true });
    else current.canvas.focus({ preventScroll: true });
  }
  function placeAt(x, y) {
    if (!armed || !current) return;
    const def = armed,
      point = ['note', 'emphasis'].includes(def.id)
        ? { x: (x / current.w) * 100, y: (y / current.h) * 100 }
        : current.pick?.(x, y);
    if (point === null) {
      status.textContent = tr('请在有效区域内选择|Choose a valid point');
      return;
    }
    armed = null;
    create(def, point);
  }
  const action = (zh, en, fn) => {
    const b = E('button', '', actions);
    b.type = 'button';
    b.dataset.dtLabel = zh + '|' + en;
    b.onclick = fn;
    return b;
  };
  const undo = action('撤销', 'Undo', () => travel('undo', 'redo')),
    redo = action('重做', 'Redo', () => travel('redo', 'undo'));
  undo.classList.add('dt-undo');
  redo.classList.add('dt-redo');
  historyActions.append(undo, redo);
  head.insertBefore(help, fold);
  const duplicate = action('复制', 'Duplicate', () => {
    if (!validInputs()) return;
    mutate((s) => {
      const o = s.objects.find((x) => x.id === selected);
      if (!o || s.objects.length >= 40) return;
      const q = copy(o);
      q.locked = false;
      q.id = 'd' + Date.now() + ++serial;
      if (o.customLabel) {
        let n = 2;
        while (s.objects.some((x) => x.label === o.label + ' ' + n)) n++;
        q.label = o.label + ' ' + n;
      } else {
        q.copyNumber =
          Math.max(
            1,
            ...s.objects
              .filter((x) => x.type === o.type && !x.customLabel)
              .map((x) => x.copyNumber || 1),
          ) + 1;
        const title = defs(selectedOwner()).find((d) => d.id === o.type).title;
        q.label = title
          .split('|')
          .map((x) => x + ' ' + q.copyNumber)
          .join('|');
      }
      if (['note', 'emphasis'].includes(q.type)) {
        let placed = false;
        for (let ring = 1; ring <= 10 && !placed; ring++)
          for (const [dx, dy] of [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const x = o.x + dx * ring * 3,
              y = o.y + dy * ring * 3;
            if (x < 0 || x > 100 || y < 0 || y > 100) continue;
            const box =
              q.type === 'note'
                ? textLayout(current, q.customLabel ? q.label : tr(q.label), {
                    x: (current.w * x) / 100,
                    y: (current.h * y) / 100,
                  })
                : null;
            const occupied = s.objects.some((v) => {
              if (!['note', 'emphasis'].includes(v.type)) return false;
              if (Math.hypot(v.x - x, v.y - y) < 2.5) return true;
              if (!box || v.type !== 'note') return false;
              const other = textLayout(current, v.customLabel ? v.label : tr(v.label), {
                x: (current.w * v.x) / 100,
                y: (current.h * v.y) / 100,
              });
              return (
                box.x < other.x + other.width + 6 &&
                box.x + box.width + 6 > other.x &&
                box.y < other.y + 20 &&
                box.y + 20 > other.y
              );
            });
            if (occupied) continue;
            q.x = x;
            q.y = y;
            placed = true;
            break;
          }
      }
      if (o.autoLabel && !o.customLabel) {
        q.autoLabel = o.autoLabel
          .split('|')
          .map((x) => x.replace(/ \d+$/, '') + ' ' + q.copyNumber)
          .join('|');
        q.label = q.autoLabel;
      }
      s.objects.push(q);
      selected = q.id;
    });
  });
  const remove = action('删除', 'Delete', () => {
    commitActive();
    if (validInputs())
      mutate((s) => {
        const index = s.objects.findIndex((o) => o.id === selected);
        s.objects = s.objects.filter((o) => o.id !== selected);
        selected =
          s.objects[Math.max(0, Math.min(index, s.objects.length - 1))]?.id || null;
      });
  });
  objectActions.append(duplicate, remove);
  const backward = action('向后叠放', 'Send backward', () => reorder(-1)),
    forward = action('向前叠放', 'Bring forward', () => reorder(1));
  objectActions.append(backward, forward);
  const saveAction = action('保存本图对象', 'Save plot objects', save);
  saveAction.title = 'Ctrl/Cmd+S';
  saveAction.setAttribute('aria-keyshortcuts', 'Control+s Meta+s');
  const exportAction = action('导出', 'Export', () => {
    commitActive();
    if (!current || !validInputs()) return;
    const blob = new Blob(
        [
          JSON.stringify(
            {
              version: 1,
              plot: current.type,
              body: current.body || 'shared',
              objects: stateFor(selectedOwner()).objects,
            },
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = `skymotion-${current.type}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  duplicate.title = 'Ctrl/Cmd+D';
  duplicate.setAttribute('aria-keyshortcuts', 'Control+d Meta+d');
  saveAction.dataset.save = '';
  const objectMenu = E('div', 'dt-object-menu', actions);
  objectMenu.id = 'dt-object-menu';
  objectMenu.setAttribute('popover', 'auto');
  objectMenu.setAttribute('role', 'menu');
  objectMenu.setAttribute('aria-label', tr('对象操作|Object actions'));
  objectMenu.append(saveAction, duplicate, remove);
  const more = E('button', 'dt-more');
  more.type = 'button';
  more.setAttribute('aria-haspopup', 'menu');
  more.setAttribute('aria-controls', objectMenu.id);
  more.setAttribute('aria-expanded', 'false');
  more.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>';
  for (const b of objectMenu.children) {
    b.setAttribute('role', 'menuitem');
    b.tabIndex = -1;
    b.addEventListener('click', () => {
      closeObjectMenu();
    });
  }
  function menuOpen() {
    return objectMenu.matches(':popover-open');
  }
  function closeObjectMenu() {
    if (menuOpen()) objectMenu.hidePopover();
    more.setAttribute('aria-expanded', 'false');
  }
  more.onclick = () => {
    if (menuOpen()) {
      closeObjectMenu();
      return;
    }
    commitActive();
    objectMenu.showPopover();
    more.setAttribute('aria-expanded', 'true');
    const r = more.getBoundingClientRect();
    objectMenu.style.left =
      Math.max(
        8,
        Math.min(
          innerWidth - objectMenu.offsetWidth - 8,
          r.right - objectMenu.offsetWidth,
        ),
      ) + 'px';
    objectMenu.style.top = Math.max(8, r.top - objectMenu.offsetHeight - 6) + 'px';
    objectMenu.querySelector('button:not(:disabled)')?.focus();
  };
  objectMenu.addEventListener('toggle', (e) => {
    more.setAttribute('aria-expanded', String(e.newState === 'open'));
  });
  objectMenu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeObjectMenu();
      more.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    const choices = [...objectMenu.querySelectorAll('button:not(:disabled)')],
      i = choices.indexOf(document.activeElement);
    choices[
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? choices.length - 1
          : (i + (e.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length
    ]?.focus();
  });
  actions.prepend(status);
  const importAction = action('导入 JSON', 'Import JSON', () => {
      commitActive();
      if (validInputs()) fileInput.click();
    }),
    clearAction = action('清空本图参考', 'Clear plot references', () => {
      commitActive();
      if (!validInputs()) return;
      if (!clearPending) {
        clearPending = true;
        clearAction.textContent = tr('确认清空（可撤销）|Confirm clear (undoable)');
        return;
      }
      mutate((s) => {
        s.objects = [];
        selected = null;
      });
      clearPending = false;
      updateFiles();
    });
  const planSave = E('button', '', fileActions);
  planSave.type = 'button';
  planSave.onclick = save;
  planSave.dataset.dtLabel = '保存本图对象|Save plot objects';
  fileActions.append(exportAction, importAction, clearAction);
  function reorder(delta) {
    if (!validInputs()) return;
    mutate((s) => {
      const i = s.objects.findIndex((o) => o.id === selected),
        j = i + delta;
      if (i >= 0 && j >= 0 && j < s.objects.length)
        [s.objects[i], s.objects[j]] = [s.objects[j], s.objects[i]];
    });
  }
  function updateFiles() {
    fileTitle.textContent = tr('本图方案|Plot plans');
    fileIntro.textContent = tr(
      '保存仅保留在此设备。导出 JSON 可以备份或转移到另一台设备；导入前可选择合并或替换。|Save keeps references on this device. Export JSON for backup or another device; review an import before merging or replacing.',
    );
    clearAction.textContent = tr(
      clearPending
        ? '确认清空（可撤销）|Confirm clear (undoable)'
        : '清空本图参考|Clear plot references',
    );
    clearAction.disabled = !current || !stateFor(selectedOwner()).objects.length;
  }
  async function readImport(file) {
    fileInput.value = '';
    if (!file || !current) return;
    const model = current,
      key = model.id + ':' + (model.body || 'shared'),
      request = ++importRequest;
    const stillCurrent = () =>
      request === importRequest &&
      !panel.hidden &&
      current &&
      key === current.id + ':' + (current.body || 'shared');
    try {
      if (file.size > 200000) throw Error('size');
      const text = await file.text();
      if (!stillCurrent()) return;
      const data = JSON.parse(text);
      if (
        data.version !== 1 ||
        data.plot !== model.type ||
        (data.body && data.body !== (model.body || 'shared')) ||
        !Array.isArray(data.objects) ||
        data.objects.length > 40
      )
        throw Error('schema');
      const accepted = clean(data.objects, model);
      if (!accepted.length && data.objects.length) throw Error('empty');
      pendingImport = accepted.map((o) => ({ ...o, id: 'd' + Date.now() + ++serial }));
      importReview.replaceChildren();
      const message = E('p', 'dt-caption', importReview);
      message.textContent =
        tr('可导入参考对象：|References ready to import: ') +
        accepted.length +
        (accepted.length !== data.objects.length
          ? tr('（不支持的对象已略过）| (unsupported objects skipped)')
          : '');
      for (const [mode, label] of [
        ['merge', '合并到本图|Merge into plot'],
        ['replace', '替换本图|Replace plot'],
        ['cancel', '取消|Cancel'],
      ]) {
        const b = E('button', '', importReview);
        b.type = 'button';
        b.textContent = tr(label);
        b.onclick = () => {
          if (mode === 'cancel') {
            pendingImport = null;
            importReview.replaceChildren();
            return;
          }
          if (!validInputs()) return;
          const imported = pendingImport;
          if (!imported) return;
          if (
            mode === 'merge' &&
            stateFor(selectedOwner()).objects.length + imported.length > 40
          ) {
            status.textContent = tr(
              '合并后超过 40 个对象；请改用替换或减少现有对象。|Merging exceeds 40 references; replace or remove some existing references.',
            );
            return;
          }
          mutate((s) => {
            s.objects =
              mode === 'replace' ? copy(imported) : [...s.objects, ...copy(imported)];
            selected = imported.at(-1)?.id || null;
          });
          pendingImport = null;
          importReview.replaceChildren();
          switchView('objects', true);
        };
      }
      status.textContent = tr(
        '文件已读取，选择合并或替换。|File ready; choose merge or replace.',
      );
    } catch {
      if (!stillCurrent()) return;
      pendingImport = null;
      importReview.replaceChildren();
      status.textContent = tr(
        '无法导入：请选择同一天体、同类图解的有效 JSON 文件（不超过 200 KB）。|Import failed. Choose valid JSON for this plot and body, up to 200 KB.',
      );
    }
  }
  function cityLabel() {
    const text =
        citySelect.selectedOptions[0]?.textContent || tr('观察点 / 城市|Observer / city'),
      dict = window.skyEnglishDictionary || {},
      zh = en() ? Object.keys(dict).find((k) => dict[k] === text) || text : text;
    return zh + '|' + (dict[zh] || text);
  }
  function makeObject(def, point) {
    const o = {
      id: 'd' + Date.now() + ++serial,
      type: def.id,
      label: def.title,
      visible: true,
      locked: false,
      customLabel: false,
    };
    for (const f of def.fields) {
      const v =
        typeof f.value === 'string' && ['date', 'time', 'lat', 'lon'].includes(f.value)
          ? current[f.value]
          : f.value;
      o[f.name] = v ?? f.value;
    }
    const siblings = stateFor(selectedOwner()).objects.filter(
      (v) => v.type === def.id && !v.customLabel,
    );
    if (siblings.length) {
      o.copyNumber = Math.max(...siblings.map((v) => v.copyNumber || 1)) + 1;
      o.label = def.title
        .split('|')
        .map((v) => v + ' ' + o.copyNumber)
        .join('|');
    }
    if (current.type === 'analemma' && def.id === 'track') {
      o.clock = current.clock ?? 720;
      o.basis = current.basis || 'clock';
      o.offset = current.offset ?? 8;
    }
    if (def.id === 'camera') o.camera = current.captureCamera?.();
    if (point) Object.assign(o, point);
    if (o.autoLabel) {
      const base = o.autoLabel;
      let n = 1,
        candidate = base;
      while (
        stateFor(current).objects.some((q) => (q.autoLabel || q.label) === candidate)
      ) {
        n++;
        candidate = base
          .split('|')
          .map((x) => x + ' ' + n)
          .join('|');
      }
      o.label = o.autoLabel = candidate;
    }
    return o;
  }
  function startExperiment() {
    commitActive();
    if (!validInputs() || !goal.value) return;
    if (goal.value === 'shadow') {
      SkySceneBuilder.open({ kind: 'rod' });
      return;
    }
    if (goal.value === 'places') {
      const coords = citySelect.value.split(',').map(Number);
      const values = {
        lat: coords[0],
        lon: coords[1],
        label: cityLabel(),
        autoLabel: cityLabel(),
        customLabel: false,
      };
      if (!coords.every(Number.isFinite)) return;
      const basis = document.querySelector('#observerTimeBasis');
      if (basis) {
        basis.value = 'utc';
        basis.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const def = defs(current).find(
        (d) => d.id === 'observer' && d.fields.some((f) => f.name === 'lat'),
      );
      if (def && ['lab-sky', 'earth', 'world-map'].includes(current.id))
        create(def, values);
      else {
        const id = comparisons.add('observer', values);
        if (id) {
          update();
          selectReference('lab-sky:' + id);
        }
      }
      return;
    }
    const kind =
      goal.value === 'times'
        ? 'time'
        : goal.value === 'track'
          ? 'track'
          : current.type === 'phase'
            ? 'snapshot'
            : 'curve';
    const def = defs(current).find((d) => d.id === kind);
    if (!def) return;
    selectedSource = current.id;
    const s = stateFor(current);
    if (s.objects.length + (kind === 'time' ? 2 : 1) > 40) return;
    mutate((s) => {
      for (const value of kind === 'time' ? [540, 900] : [null]) {
        const point =
          kind === 'time'
            ? { time: value }
            : kind === 'track'
              ? current.view === 'equatorial'
                ? { clock: ((current.clock ?? current.time ?? 720) + 180) % 1440 }
                : {
                    lat:
                      current.lat > 0
                        ? -Math.abs(current.lat)
                        : Math.abs(current.lat) || 40,
                  }
              : {
                  date:
                    current.date.slice(0, 4) +
                    (current.date.slice(5) < '07-01' ? '-12-21' : '-06-21'),
                };
        const object = makeObject(def, point);
        s.objects.push(object);
        selected = object.id;
      }
    });
    switchView('objects', true);
    showInspector();
    status.textContent = tr(
      '已建立对照。拖动所选对象的滑条继续探索；原观测条件保持不变。|Comparison ready. Drag the selected reference sliders to explore; the baseline is unchanged.',
    );
  }

  const draftKey = (m) => 'sky-diagram-draft-v2:' + m.id + ':' + (m.body || 'shared');
  function persist(m, s) {
    try {
      sessionStorage.setItem(
        draftKey(m),
        JSON.stringify({ version: 1, objects: s.objects }),
      );
    } catch {}
  }
  function stateFor(m) {
    const key = m.id + ':' + (m.body || 'shared');
    if (!states.has(key)) {
      let objects = [],
        stored = false,
        repairNeeded = false;
      try {
        const raw = localStorage.getItem('sky-diagram-tools-v1:' + key);
        if (raw !== null) {
          try {
            const v = JSON.parse(raw);
            if (v?.version === 1 && Array.isArray(v.objects)) {
              objects = clean(v.objects, m);
              stored = true;
              repairNeeded = stableJSON(objects) !== stableJSON(v.objects);
            } else repairNeeded = true;
          } catch {
            repairNeeded = true;
          }
        }
      } catch {}
      const saved = JSON.stringify(objects);
      try {
        const v = JSON.parse(sessionStorage.getItem(draftKey(m)));
        if (v?.version === 1 && Array.isArray(v.objects)) objects = clean(v.objects, m);
      } catch {}
      states.set(key, { objects, undo: [], redo: [], stored, saved, repairNeeded });
    }
    const entry = states.get(key);
    entry.model = { id: m.id, type: m.type, body: m.body || 'shared' };
    return entry;
  }
  function defs(model) {
    return window.SkyDiagramDefinitions.forModel(model);
  }
  function clean(objects, model) {
    return window.SkyDiagramDefinitions.normalize(objects, model, {
      validDate,
      nextId: () => 'd' + Date.now() + ++serial,
    });
  }
  function repaint() {
    if (!current) return;
    if (current.redraw) current.redraw();
    else if (typeof schedule === 'function') schedule();
  }
  function draftStatus() {
    if (!current) return;
    const s = stateFor(selectedOwner());
    status.textContent = s.repairNeeded
      ? tr(
          '已整理存档中的不兼容内容；保存以保留修正|Incompatible saved references were normalized; save to keep changes',
        )
      : JSON.stringify(s.objects) === s.saved
        ? tr(
            s.stored
              ? '已保存到此设备|Saved to this device'
              : '没有未保存的修改|No unsaved changes',
          )
        : tr('草稿已保留 · 有未保存的修改|Draft retained · Unsaved changes');
    status.title = tr(
      '草稿仅保留本次会话；保存本图对象只保存当前图。“排列与收藏”可连同观测条件保存完整实验。|Drafts last for this session. Save plot objects saves this plot only. Arrangement & saved layouts can include conditions and all experiment objects.',
    );
  }
  function record(s, before, beforeSelected = selected, model = selectedOwner()) {
    if (JSON.stringify(before) === JSON.stringify(s.objects)) return;
    s.undo.push({ objects: before, selected: beforeSelected });
    if (s.undo.length > 30) s.undo.shift();
    s.redo = [];
    persist(model, s);
    draftStatus();
    document.dispatchEvent(new Event('skymotion:references'));
  }
  const displayValue = (key, value) =>
    key === 'time' && Number.isFinite(value)
      ? String(Math.floor(value / 60)).padStart(2, '0') +
        ':' +
        String(Math.round(value) % 60).padStart(2, '0')
      : ['lat', 'lon', 'clock'].includes(key) && Number.isFinite(value)
        ? String(Number(value.toFixed(['lat', 'lon'].includes(key) ? 4 : 2)))
        : value;
  const coordinates = (lat, lon) =>
    `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'S' : 'N'} · ${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'W' : 'E'}`;
  let basisHome = null,
    basisNode = null;
  function restoreBasis() {
    if (basisNode && basisHome?.parentNode) basisHome.after(basisNode);
  }
  function updateLocation(m = selectedOwner()) {
    if (!m) return;
    const o = stateFor(m).objects.find((o) => o.id === selected),
      available = o?.type === 'observer' && typeof m.observeLocation === 'function';
    locationPanel.hidden = !available;
    if (!available) {
      restoreBasis();
      return;
    }
    const linked =
      m.body === 'sun' && ['lab', 'diagrams'].includes(document.body.dataset.page);
    if (linked) {
      basisNode = document.querySelector('.observer-link-settings');
      if (basisNode) {
        if (!basisHome) {
          basisHome = document.createComment('observer comparison settings');
          basisNode.before(basisHome);
        }
        locationPanel.append(basisNode);
      }
    }
    const same = Math.abs(o.lat - m.lat) < 1e-7 && Math.abs(o.lon - m.lon) < 1e-7;
    const text =
      tr(
        same
          ? linked
            ? '对照与基准地点相同，轨迹重合；拖动经纬度滑条即可分开比较。|Comparison and baseline locations match, so their paths overlap. Drag the coordinate sliders to separate them.'
            : '所有图解正在使用此观测地点。|All diagrams use this observation location.'
          : linked
            ? '对照城市，已同步到高度曲线、升落方位和地平面图。|Comparison city: synchronized with altitude, bearings and horizon diagrams.'
            : '独立参考点。|Independent reference.',
      ) + (same ? '' : '\n' + tr('当前观测：|Current: ') + coordinates(m.lat, m.lon));
    if (locationInfo.textContent !== text) locationInfo.textContent = text;
    locationApply.disabled = same;
    locationApply.textContent = tr(
      same
        ? '当前基准地点|Current baseline location'
        : '设为基准地点|Use as baseline location',
    );
  }
  locationApply.onclick = () => {
    commitActive();
    if (!validInputs() || !current) return;
    finishNudge();
    cancelDrag();
    const o = stateFor(selectedOwner()).objects.find((o) => o.id === selected);
    if (o?.type !== 'observer' || !current.observeLocation) return;
    if (current.observeLocation({ lat: o.lat, lon: o.lon }) === false) {
      status.textContent = tr(
        '此地点将超出支持日期范围；请调整日期或时间规则。|This location leaves the supported date range; adjust the date or time basis.',
      );
      return;
    }
    status.textContent = tr(
      '已更新观测地点；可用浏览器后退恢复。|Observation location updated; browser Back restores it.',
    );
  };
  function actionState() {
    if (!current) return;
    const s = stateFor(selectedOwner()),
      o = s.objects.find((o) => o.id === selected),
      index = s.objects.findIndex((o) => o.id === selected);
    backward.disabled = index <= 0;
    forward.disabled = index < 0 || index >= s.objects.length - 1;
    undo.disabled = !s.undo.length;
    redo.disabled = !s.redo.length;
    duplicate.disabled = !o || s.objects.length >= 40;
    remove.disabled = !o;
    for (const b of add.querySelectorAll('[data-tool-type]'))
      b.disabled =
        (stateFor(current).objects.length >= 40 && b.dataset.toolType !== 'build') ||
        (current.type === 'analemma' &&
          current.view === 'equatorial' &&
          b.dataset.toolType === 'level');
  }
  function validInputs() {
    const bad = form.querySelector('[aria-invalid="true"]');
    if (!bad) return true;
    panel.dataset.collapsed = 'false';
    panel.dataset.detail = 'true';
    updateFold();
    switchView('objects', true);
    status.textContent =
      bad.dataset.error || tr('请先修正标记的输入。|Correct the marked input first.');
    const drawer = document.getElementById('uiParameterDrawer');
    if (drawer?.contains(panel) && !drawer.open)
      document.getElementById('uiParametersButton')?.click();
    bad.focus({ preventScroll: true });
    revealField(bad);
    return false;
  }
  function fieldError(input, message) {
    input.setAttribute('aria-invalid', 'true');
    input.dataset.error = message;
    status.textContent = message;
    let error = input.parentElement.querySelector('.dt-field-error');
    if (!error) {
      error = E('small', 'dt-field-error', input.parentElement);
      error.id = 'dt-error-' + input.dataset.field;
    }
    error.textContent = message;
    input.setAttribute('aria-errormessage', error.id);
  }
  function clearFieldError(input) {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-errormessage');
    delete input.dataset.error;
    input.parentElement.querySelector('.dt-field-error')?.remove();
  }
  function updateSmall() {
    if (!current) return;
    const s = stateFor(selectedOwner());
    for (const b of list.querySelectorAll('[data-reference-id]')) {
      const o = s.objects.find((o) => o.id === b.dataset.referenceId.split(':').at(-1));
      if (o) {
        const label = o.customLabel ? o.label : tr(o.label);
        const swatch = b.querySelector('.dt-reference-swatch');
        b.textContent = label;
        if (swatch) b.prepend(swatch);
        b.parentElement
          .querySelector('input')
          ?.setAttribute('aria-label', tr('显示|Show') + ' ' + label);
      }
    }
    if (!s.objects.find((o) => o.id === selected)?.visible) result.textContent = '';
    updateLocation();
    const selectedObject = s.objects.find((o) => o.id === selected);
    const nameInput = form.querySelector('[data-field=label]');
    if (
      selectedObject &&
      nameInput &&
      !selectedObject.customLabel &&
      document.activeElement !== nameInput
    ) {
      nameInput.value = tr(selectedObject.label);
      nameInput.dataset.committedValue = nameInput.value;
    }
    const cities = form.querySelector('[data-city-edit]');
    if (cities && selectedObject)
      cities.value =
        [...cities.options].find(
          (option) =>
            option.value &&
            option.value
              .split(',')
              .map(Number)
              .every(
                (value, index) =>
                  Math.abs(value - selectedObject[index ? 'lon' : 'lat']) < 1e-6,
              ),
        )?.value || '';
    for (const input of form.querySelectorAll('[data-field]'))
      SkyParameterControls.sync(input);
    actionState();
  }
  function mutate(fn, keepFields = false) {
    finishNudge();
    if (!current) return;
    const s = stateFor(selectedOwner()),
      before = copy(s.objects),
      beforeSelected = selected;
    if (typeof state !== 'undefined' && typeof stop === 'function') stop();
    else current.pause?.();
    fn(s);
    record(s, before, beforeSelected);
    if (keepFields) draftStatus();
    keepFields ? updateSmall() : update();
    repaint();
  }
  function travel(from, to) {
    finishNudge();
    cancelDrag();
    if (!current) return;
    const s = stateFor(selectedOwner());
    if (!s[from].length) return;
    s[to].push({ objects: copy(s.objects), selected });
    const snapshot = s[from].pop();
    s.objects = snapshot.objects;
    persist(selectedOwner(), s);
    selected = s.objects.some((o) => o.id === snapshot.selected)
      ? snapshot.selected
      : null;
    draftStatus();
    update();
    repaint();
    document.dispatchEvent(new Event('skymotion:references'));
  }
  function commitActive() {
    const field = document.activeElement;
    if (
      form.contains(field) &&
      field.matches('input:not([type=checkbox]),select') &&
      field.dataset.committedValue !== field.value
    )
      field.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function save() {
    finishNudge();
    commitActive();
    if (!current || !validInputs()) return;
    cancelDrag();
    try {
      const owner = selectedOwner(),
        s = stateFor(owner);
      localStorage.setItem(
        'sky-diagram-tools-v1:' + owner.id + ':' + (owner.body || 'shared'),
        JSON.stringify({ version: 1, objects: s.objects }),
      );
      s.saved = JSON.stringify(s.objects);
      s.stored = true;
      s.repairNeeded = false;
      status.textContent = tr('已保存到此设备|Saved to this device');
    } catch {
      status.textContent = tr(
        '浏览器无法保存；仅本次访问有效|Storage unavailable; available for this visit',
      );
    }
  }
  function create(def, point) {
    selectedSource = current.id;
    editing = true;
    updateMode();
    if (stateFor(selectedOwner()).objects.length >= 40) {
      status.textContent = tr(
        '最多添加 40 个参考对象，请先删除一个。|Up to 40 references; remove one before adding another.',
      );
      return;
    }
    mutate((s) => {
      const o = makeObject(def, point);
      s.objects.push(o);
      selected = o.id;
    });
    switchView('objects', true);
    showInspector();
    const o = stateFor(current).objects.find((o) => o.id === selected);
    status.textContent =
      tr('已添加：|Added: ') +
      (o.customLabel ? o.label : tr(o.label)) +
      tr('。已打开对象属性。|. Its properties are now open.');
    if (
      o.type === 'observer' &&
      ((Math.abs(o.lat - current.lat) < 1e-7 && Math.abs(o.lon - current.lon) < 1e-7) ||
        entries().some(
          (q) =>
            q.o.id !== o.id &&
            q.o.type === 'observer' &&
            Math.abs(q.o.lat - o.lat) < 1e-7 &&
            Math.abs(q.o.lon - o.lon) < 1e-7,
        ))
    )
      status.textContent = tr(
        '已添加。地点相同，轨迹重合；可修改经纬度。|Added. These locations overlap; change the comparison coordinates.',
      );
    else if (o.type === 'curve' && o.date === current.date)
      status.textContent = tr(
        '已添加。对照日期相同，请在属性中更改日期。|Added. The dates match; change the comparison date in Properties.',
      );
    else if (o.type === 'time' && Math.abs(o.time - current.time) < 0.01)
      status.textContent = tr(
        '已记录当前时刻。可改为其他时刻进行对照。|Current time pinned. Change its time to compare another moment.',
      );
  }

  function showInspector() {
    panel.dataset.detail = 'true';
    mobileBack.textContent = tr('返回对象列表|Back to object list');
    if (desktopSplit()) {
      inspector.scrollTop = 0;
      const row = selectedRow();
      if (row) revealWithin(row, list);
      return;
    }
    scroll.scrollTop = Math.max(0, inspector.offsetTop - scroll.offsetTop - 8);
  }
  function rememberContext() {
    if (!current || panel.hidden) return;
    const s = stateFor(selectedOwner());
    s.lastSelected = selected;
    (s.viewScroll ??= {})[activeView] = scroll.scrollTop;
    s.inspectorScroll = inspector.scrollTop;
    s.listScroll = list.scrollTop;
  }
  function hide() {
    for (const input of form.querySelectorAll('[aria-invalid=true]')) {
      input.value = input.dataset.committedValue;
      clearFieldError(input);
    }
    closeObjectMenu();
    restoreBasis();
    clearTimeout(visibilityTimer);
    visibilityTimer = 0;
    rememberContext();
    ++importRequest;
    unmountPanel();
    document.body.classList.remove('diagram-workbench-active');
    finishNudge();
    const wasOpen = !panel.hidden;
    if (current) (current.host || current.canvas).classList.remove('dt-editing');
    cancelDrag();
    if (current) stateFor(selectedOwner()).lastSelected = selected;
    panel.hidden = true;
    armed = null;
    placement.hidden = true;
    syncLaunchers();
    if (current) portals.get(current.id)?.focus({ preventScroll: true });
    syncRailShell();
    if (wasOpen) repaint();
  }
  function open(m, preserveRail = false) {
    if (!customizationOn()) return false;
    if (!panel.hidden) {
      commitActive();
      if (!validInputs()) return false;
    }
    if (!preserveRail) railView = 'references';
    rememberContext();
    if (current?.id !== m.id) activeView = 'objects';
    ++importRequest;
    finishNudge();
    cancelDrag();
    if (current) (current.host || current.canvas).classList.remove('dt-editing');
    current = m;
    selectedSource = m.id;
    editing = true;
    const s = stateFor(m);
    selected = s.objects.some((o) => o.id === s.lastSelected) ? s.lastSelected : null;
    armed = null;
    panel.hidden = false;
    pendingImport = null;
    clearPending = false;
    importReview.replaceChildren();
    const remembered = s.viewScroll?.[activeView] || 0,
      inspectorPosition = s.inspectorScroll || 0,
      listPosition = s.listScroll || 0;
    scroll.scrollTop = 0;
    draftStatus();
    update();
    scroll.scrollTop = remembered;
    (s.viewScroll ??= {})[activeView] = remembered;
    inspector.scrollTop = inspectorPosition;
    list.scrollTop = listPosition;
    placePanel();
    if (
      !preserveRail &&
      document.body.hasAttribute('data-entry-view') &&
      matchMedia('(max-width:760px)').matches &&
      !document.getElementById('uiParameterDrawer')?.open
    )
      document.getElementById('uiParametersButton')?.click();
    syncLaunchers();
    panel.dataset.restoring = 'true';
    const epoch = importRequest;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (panel.hidden || current?.id !== m.id || epoch !== importRequest) return;
        scroll.scrollTop = Math.min(
          remembered,
          Math.max(0, scroll.scrollHeight - scroll.clientHeight),
        );
        inspector.scrollTop = inspectorPosition;
        list.scrollTop = listPosition;
        panel.dataset.restoring = 'false';
      }),
    );
    repaint();
  }
  const railPositions = { views: 0, conditions: 0, references: 0 };
  let emptyContext = null;
  function parameterRail() {
    return (
      document.querySelector('.ui-parameters') ||
      document.querySelector(
        'body[data-page=space]:not(.space-immersive) #spaceSidebarHost .side',
      )
    );
  }
  function persistentRailMode() {
    return (
      !!parameterRail() &&
      (document.body.hasAttribute('data-entry-view') ||
        (window.SkyCustomization?.active === true &&
          !matchMedia('(max-width:760px)').matches))
    );
  }
  function visibleModels() {
    return [...models.values()].filter(
      (m) =>
        (typeof state === 'undefined' || m.body === state.body) &&
        m.canvas.getBoundingClientRect().width > 0 &&
        m.canvas.getBoundingClientRect().height > 0,
    );
  }
  function chooseRail(kind) {
    commitActive();
    if (!validInputs() || window.SkyLabComparison?.validate() === false) return false;
    closeObjectMenu();
    const rail = parameterRail();
    if (!rail) return false;
    railPositions[railView] = rail.scrollTop;
    if (kind !== 'references') {
      referenceMode = editing;
      setEditing(false);
    } else {
      const target =
        current && visibleModels().some((m) => m.id === current.id)
          ? models.get(current.id)
          : visibleModels()[0];
      if (
        panel.hidden &&
        target &&
        !document.body.classList.contains('scene-builder-active')
      )
        open(target, true);
      setEditing(referenceMode);
    }
    railView = kind;
    syncRailShell();
    rail.scrollTop = railPositions[kind] || 0;
    return true;
  }
  function ensureRailNavigation(rail) {
    if (railNavigation?.closest('.ui-parameters, .side') === rail) return;
    rail.id ||= 'diagram-parameter-rail';
    railNavigation = E('nav', 'dt-rail-navigation', rail);
    railNavigation.dataset.i18nSkip = '';
    railNavigation.setAttribute('role', 'tablist');
    railNavigation.setAttribute('aria-label', tr('侧栏内容|Sidebar section'));
    (rail.querySelector(':scope > .motion-menu-header') || rail).append(railNavigation);
    for (const kind of document.body.hasAttribute('data-entry-view')
      ? ['views', 'conditions', 'references']
      : ['conditions', 'references']) {
      const b = E('button', '', railNavigation);
      b.type = 'button';
      b.id = 'dt-rail-' + kind;
      b.dataset.railSection = kind;
      b.setAttribute('role', 'tab');
      b.setAttribute(
        'aria-controls',
        kind === 'views' ? 'workbenchViews' : kind === 'conditions' ? rail.id : panel.id,
      );
      b.onclick = () => chooseRail(kind);
    }
    railNavigation.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const buttons = [...railNavigation.children].filter((button) => !button.hidden);
      const currentIndex = buttons.indexOf(e.target);
      const index =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? buttons.length - 1
            : (currentIndex + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) %
              buttons.length;
      const button = buttons[index];
      if (chooseRail(button.dataset.railSection)) button.focus({ preventScroll: true });
    });
    emptyContext = E('section', 'dt-context-empty', rail);
    emptyContext.dataset.i18nSkip = '';
    emptyContext.id = 'dt-reference-empty';
    emptyContext.setAttribute('role', 'region');
    emptyContext.setAttribute('aria-labelledby', 'dt-rail-references');
    emptyContext.hidden = true;
    const text = E('p', '', emptyContext),
      resume = E('button', '', emptyContext);
    resume.type = 'button';
    resume.onclick = () => {
      const available = visibleModels(),
        target = available.find((m) => m.id === current?.id) || available[0];
      if (target) open(target, true);
    };
  }
  function syncRailNavigation() {
    if (!railNavigation) return;
    railNavigation.setAttribute('aria-label', tr('侧栏内容|Sidebar section'));
    for (const b of railNavigation.children) {
      b.hidden = b.dataset.railSection === 'references' && !customizationOn();
      const chosen = b.dataset.railSection === railView;
      b.textContent = tr(
        b.dataset.railSection === 'views'
          ? '视图与布局|Views & layout'
          : b.dataset.railSection === 'conditions'
            ? '观测条件|Observation controls'
            : '图中对象|Plot objects',
      );
      b.setAttribute('aria-selected', String(chosen));
      b.tabIndex = chosen ? 0 : -1;
    }
  }
  function syncRailShell() {
    const rail = parameterRail() || railNavigation?.closest('.ui-parameters, .side');
    if (!rail) return;
    if (railView === 'references' && !customizationOn()) railView = 'conditions';
    const viewMenu = document.getElementById('workbenchViews');
    if (viewMenu) viewMenu.hidden = railView !== 'views';
    const persistent = persistentRailMode();
    if (persistent) ensureRailNavigation(rail);
    rail.classList.toggle('dt-navigation-ready', persistent);
    if (railNavigation) {
      railNavigation.hidden = !persistent && !mountedRail;
      if (persistent || mountedRail) rail.dataset.editorView = railView;
      else delete rail.dataset.editorView;
    }
    if (emptyContext) {
      emptyContext.hidden = !persistent || railView !== 'references' || !panel.hidden;
      emptyContext.firstElementChild.textContent = tr(
        visibleModels().length
          ? '图中编辑已收起。选择“继续编辑当前图”恢复，或切换到观测条件。|Plot editing is closed. Continue editing this plot, or choose Observation controls.'
          : '当前视图没有图内参考工具；可切换到观测条件，或选择其他图解。|This view has no plot-reference tools. Choose Observation controls or another diagram.',
      );
      const b = emptyContext.lastElementChild;
      b.textContent = tr('继续编辑当前图|Continue editing this plot');
      b.disabled = !visibleModels().length;
    }
    syncRailNavigation();
  }
  function unmountPanel() {
    if (!mountedRail) return;
    const previous = mountedRail;
    mountedRail = null;
    document.body.append(panel);
    previous.classList.remove('dt-rail-active');
    if (!persistentRailMode()) {
      previous.classList.remove('dt-navigation-ready');
      railNavigation?.remove();
      railNavigation = null;
      emptyContext?.remove();
      emptyContext = null;
      delete previous.dataset.editorView;
    }
    previous.scrollTop = railScroll;
  }
  function placePanel() {
    const rail = parameterRail();
    const r = rail?.getBoundingClientRect(),
      mobile = matchMedia('(max-width:760px)').matches;
    const docked =
      !!rail &&
      (document.body.hasAttribute('data-entry-view') ||
        (!mobile &&
          !!r &&
          r.width > 180 &&
          r.width < 450 &&
          r.left >= 0 &&
          r.height > 180));
    const focused = panel.contains(document.activeElement)
      ? document.activeElement
      : null;
    if (mountedRail && (!docked || mountedRail !== rail)) unmountPanel();
    panel.classList.toggle('dt-docked', docked);
    if (docked && !mountedRail) {
      mountedRail = rail;
      railScroll = rail.scrollTop;
      rail.classList.add('dt-rail-active');
      rail.append(panel);
      ensureRailNavigation(rail);
      rail.dataset.editorView = railView;
      rail.scrollTop = railPositions[railView] || 0;
    }
    panel.style.top = mobile ? 'auto' : '110px';
    panel.style.bottom = mobile ? '12px' : '16px';
    panel.style.left = '';
    panel.style.width = '';
    document.body.classList.toggle('diagram-workbench-active', docked);
    syncRailShell();
    if (focused && document.activeElement !== focused)
      focused.focus({ preventScroll: true });
  }
  // Tool creation, object navigation and properties render independently.
  function renderToolLibrary() {
    const available = defs(current),
      previous = goal.value;
    goal.replaceChildren();
    const choices = [['', '选择实验目的|Choose an experiment']];
    if (
      current.body === 'sun' &&
      ['lab', 'diagrams'].includes(document.body.dataset.page)
    )
      choices.push(['places', '同一时间 · 不同地点|Same instant · different places']);
    if (available.some((d) => d.id === 'time'))
      choices.push(['times', '同一地点 · 不同时刻|Same place · different times']);
    if (available.some((d) => ['curve', 'snapshot'].includes(d.id)))
      choices.push(['dates', '同一地点 · 不同日期|Same place · different dates']);
    if (available.some((d) => d.id === 'track'))
      choices.push([
        'track',
        current.view === 'equatorial'
          ? '比较不同时刻的日行迹|Compare analemmas at different times'
          : '比较不同纬度的日行迹|Compare analemmas at different latitudes',
      ]);
    if (
      window.SkySceneBuilder &&
      ['lab', 'diagrams'].includes(document.body.dataset.page)
    )
      choices.push(['shadow', '摆放竖杆 · 观察影子|Place a rod · observe its shadow']);
    for (const [value, title] of choices) {
      const option = E('option', '', goal);
      option.value = value;
      option.textContent = tr(title);
    }
    goal.value = choices.some(([key]) => key === previous) ? previous : '';
    goalLabel.hidden = choices.length === 1;
    const context = current.id + ':' + current.body + ':' + current.type;
    if (advanced.dataset.context !== context) {
      advanced.open = choices.length === 1;
      advanced.dataset.context = context;
    }
    goalTitle.textContent = tr('我想做什么实验|What would you like to compare?');
    advancedTitle.textContent = tr('自由添加工具|Add individual tools');
    goal.onchange();
    add.replaceChildren();
    const groups = new Map();
    for (const def of defs(current)) {
      const group = ['observer', 'time', 'track'].includes(def.id)
        ? '地点与时刻|Places and times'
        : '图上参考|Plot references';
      let target = groups.get(group);
      if (!target) {
        const heading = E('h4', 'dt-add-group', add);
        heading.textContent = tr(group);
        target = E('div', 'dt-add-group-tools', add);
        groups.set(group, target);
      }
      if (def.id === 'build') continue;
      const b = E('button', '', target);
      b.type = 'button';
      b.dataset.toolType = def.id;
      b.textContent = tr(def.title);
      b.onclick = () => {
        commitActive();
        if (!validInputs()) return;
        if (
          ['note', 'emphasis'].includes(def.id) ||
          (current.pick &&
            ['observer', 'time', 'phase'].includes(def.id) &&
            !(current.type === 'sky' && def.id === 'observer'))
        ) {
          arm(def);
        } else {
          const coords =
            def.id === 'observer' && !cityPicker.hidden
              ? citySelect.value.split(',').map(Number)
              : null;
          create(
            def,
            coords?.length === 2 && coords.every(Number.isFinite)
              ? {
                  lat: coords[0],
                  lon: coords[1],
                  label: cityLabel(),
                  autoLabel: cityLabel(),
                  customLabel: false,
                }
              : undefined,
          );
        }
      };
    }
    if (
      window.SkySceneBuilder &&
      ['lab', 'diagrams'].includes(document.body.dataset.page)
    ) {
      const heading = E('h4', 'dt-add-group', add);
      heading.textContent = tr(
        '实验物体 · 在实验地面中摆放|Experiment objects · place on the experiment ground',
      );
      const target = E('div', 'dt-add-group-tools', add);
      for (const [kind, label] of [
        ['rod', '杆|Rod'],
        ['sphere', '球|Sphere'],
        ['circle', '参考圈|Reference circle'],
        ['planeObject', '参考平面|Reference plane'],
        ['dial', '刻度盘|Dial'],
        ['observer', '观察站|Station'],
        ['marker', '标记点|Marker'],
        ['note', '地面文字|Ground note'],
      ]) {
        const b = E('button', '', target);
        b.type = 'button';
        b.dataset.buildKind = kind;
        b.textContent = tr(label);
        b.onclick = () => {
          commitActive();
          if (validInputs()) window.SkySceneBuilder.open({ kind });
        };
      }
    }
  }

  function renderObjectList(allEntries, s) {
    list.replaceChildren();
    if (!allEntries.length) {
      const empty = E('p', 'dt-empty', list);
      empty.textContent = tr(
        '还没有添加对象。点击上方“添加对象”，选择地点、时刻或图上参考。|No objects yet. Use Add object above to choose a place, time or plot reference.',
      );
    }
    for (const { o, source } of allEntries) {
      const token = source === current.id ? o.id : source + ':' + o.id;
      const row = E('div', 'dt-row', list),
        b = E('button', '', row);
      b.type = 'button';
      b.textContent = o.customLabel ? o.label : tr(o.label);
      b.setAttribute(
        'aria-pressed',
        String(o.id === selected && source === selectedOwner().id),
      );
      b.dataset.referenceId = token;
      b.dataset.referenceSource = source;
      if (current.type === 'analemma' && o.type === 'track') {
        b.classList.add('dt-track-label');
        b.style.setProperty(
          '--reference-color',
          trackColors[
            s.objects.filter((q) => q.type === 'track').indexOf(o) % trackColors.length
          ],
        );
      }
      if (
        o.type === 'observer' &&
        current.body === 'sun' &&
        window.SkyObserverComparison
      ) {
        const swatch = E('span', 'dt-reference-swatch');
        swatch.setAttribute('aria-hidden', 'true');
        swatch.style.setProperty('--reference-color', SkyObserverComparison.color(o.id));
        b.prepend(swatch);
      }
      b.onclick = () => selectReference(token);
      const toggle = E('label', 'dt-toggle', row),
        visible = E('input', '', toggle);
      visible.type = 'checkbox';
      visible.checked = o.visible;
      visible.setAttribute(
        'aria-label',
        tr('显示|Show') + ' ' + (o.customLabel ? o.label : tr(o.label)),
      );
      visible.onchange = () => {
        commitActive();
        if (!validInputs()) {
          visible.checked = !visible.checked;
          return;
        }
        if (source !== current.id) {
          comparisons.patch(source, o.id, { visible: visible.checked });
          update();
        } else {
          const owner = selectedSource;
          selectedSource = source;
          mutate(() => {
            o.visible = visible.checked;
          }, true);
          selectedSource = owner;
        }
      };
      if (o.id === selected && source === selectedOwner().id) row.append(more);
      else {
        const rowMore = E('button', 'dt-row-more', row);
        rowMore.type = 'button';
        rowMore.innerHTML = more.innerHTML;
        rowMore.setAttribute(
          'aria-label',
          tr('更多操作|More actions') + ' · ' + b.textContent,
        );
        rowMore.setAttribute('aria-haspopup', 'menu');
        rowMore.onclick = () => {
          selectReference(token);
          more.click();
        };
      }
    }
    if (
      window.SkySceneBuilder &&
      ['lab', 'diagrams'].includes(document.body.dataset.page)
    ) {
      const physical = SkySceneBuilder.listObjects();
      objectTitle.textContent =
        tr('图中对象|Plot objects') + ' · ' + (allEntries.length + physical.length);
      panel.dataset.empty = String(!allEntries.length && !physical.length);
      if (physical.length) {
        list.querySelector('.dt-empty')?.remove();
        for (const o of physical) {
          const row = E('div', 'dt-row dt-ground-row', list),
            b = E('button', '', row);
          b.type = 'button';
          b.textContent = o.label + tr(' · 实验地面| · Experiment ground');
          b.dataset.groundObject = o.id;
          b.onclick = () => SkySceneBuilder.open({ objectId: o.id });
        }
      }
    }
  }

  function referenceNameAtLocation(o) {
    if (
      o.customLabel ||
      o.type !== 'observer' ||
      !Number.isFinite(o.lat) ||
      !Number.isFinite(o.lon)
    )
      return;
    const option = [...citySelect.options].find((option) => {
      const [lat, lon] = option.value.split(',').map(Number);
      return Math.abs(lat - o.lat) < 1e-6 && Math.abs(lon - o.lon) < 1e-6;
    });
    if (option) {
      const text = option.textContent,
        dict = window.skyEnglishDictionary || {};
      const zh = en()
        ? Object.keys(dict).find((key) => dict[key] === text) || text
        : text;
      o.label = o.autoLabel = zh + '|' + (dict[zh] || text);
    } else
      o.label = o.autoLabel =
        '自定义地点 ' +
        coordinates(o.lat, o.lon) +
        '|Custom location ' +
        coordinates(o.lat, o.lon);
  }
  function attachReferenceControl(input, field, object) {
    if (field.options || (field.min === undefined && field.value !== 'date')) return;
    const owner = selectedOwner(),
      s = stateFor(owner);
    SkyParameterControls.attach(input, {
      kind: field.value === 'date' ? 'date' : 'number',
      label: tr(field.title),
      min: field.min,
      max: field.max,
      step: field.step,
      save,
      undo: (redo) => travel(redo ? 'redo' : 'undo', redo ? 'undo' : 'redo'),
      read: () => object[field.name],
      format: (value) => String(displayValue(field.name, value)),
      begin() {
        finishNudge();
        if (typeof stop === 'function') stop();
        else owner.pause?.();
        return { objects: copy(s.objects), object: copy(object) };
      },
      preview(value) {
        object[field.name] = value;
        if (['lat', 'lon'].includes(field.name)) referenceNameAtLocation(object);
        input.value = displayValue(field.name, value);
        input.dataset.committedValue = input.value;
        clearFieldError(input);
        updateSmall();
        status.textContent = tr(
          '预览中 · 松手应用，Esc 取消|Preview · release to apply, Escape to cancel',
        );
        const name = form.querySelector('[data-field=label]');
        if (name && !object.customLabel) name.value = tr(object.label);
        repaint();
        document.dispatchEvent(new Event('skymotion:references'));
      },
      commit(before) {
        record(s, before.objects, selected, owner);
        draftStatus();
        updateSmall();
      },
      cancel(before) {
        for (const key of Object.keys(object))
          if (!(key in before.object)) delete object[key];
        Object.assign(object, before.object);
        input.value = displayValue(field.name, object[field.name]);
        input.dataset.committedValue = input.value;
        draftStatus();
        updateSmall();
        repaint();
        document.dispatchEvent(new Event('skymotion:references'));
      },
    });
  }

  // One validation/commit path for every reference property, regardless of page.
  function commitReferenceField(n, f, o) {
    let v = n.value;
    if (f.min !== undefined) {
      if (f.name === 'time' && String(v).includes(':')) {
        const parts = /^(\d{1,2}):(\d{2})$/.exec(v);
        v =
          parts &&
          +parts[2] < 60 &&
          (+parts[1] < 24 || (+parts[1] === 24 && +parts[2] === 0))
            ? +parts[1] * 60 + +parts[2]
            : NaN;
      }
      v = Number(v);
      if (n.value.trim() === '' || !Number.isFinite(v)) {
        fieldError(
          n,
          tr(
            f.name === 'time'
              ? '请输入 00:00—24:00 的时刻。|Enter a time from 00:00 to 24:00.'
              : '请输入有效数值。|Enter a valid number.',
          ),
        );
        return;
      }
      v = Math.max(f.min, Math.min(f.max, v));
    }
    if (f.value === 'date' && !validDate(v)) {
      fieldError(
        n,
        tr(
          '请输入 1900-01-01 至 2100-12-31 之间的有效日期。|Enter a valid date between 1900-01-01 and 2100-12-31.',
        ),
      );
      return;
    }
    n.value = displayValue(f.name, v);
    clearFieldError(n);
    n.dataset.committedValue = n.value;
    mutate(() => {
      o[f.name] = v;
      if (['lat', 'lon'].includes(f.name)) referenceNameAtLocation(o);
    }, true);
    SkyParameterControls.sync(n);
    if (current.type === 'analemma' && f.name === 'basis') {
      const offset = form.querySelector('[data-field=offset]');
      if (offset) {
        offset.disabled = v === 'apparent';
        SkyParameterControls.sync(offset);
      }
    }
    if (current.type === 'illumination' && f.value === 'date')
      requestAnimationFrame(() => {
        if (!panel.hidden && selected === o.id) revealField(result);
      });
  }

  function renderInspector(s) {
    referenceHelp.hidden = current.type !== 'analemma';
    referenceHelp.textContent =
      current.type === 'analemma'
        ? tr(
            current.view === 'equatorial'
              ? '赤纬—时角图不随纬度改变。比较纬度请切换天空或天穹视图；每条轨迹可选择时间规则，钟表时使用指定时区。|Latitude does not change declination or hour angle. Compare latitudes in the sky or dome view. Each track has its own time basis; clock time uses the selected UTC offset.'
              : '对照轨迹沿用本图年份和模型。纬度、经度、每日时刻及时间规则独立设置；钟表时使用指定时区。|Tracks share this plot’s year and model. Set each location, daily time and time basis independently; clock time uses its selected UTC offset.',
          )
        : ' ';
    form.replaceChildren();
    const o = s.objects.find((o) => o.id === selected);
    inspector.hidden = !o;
    if (!o) panel.dataset.detail = 'false';
    objectActions.hidden = !o || s.objects.length < 2;
    if (
      o?.type === 'observer' &&
      ['lab', 'diagrams'].includes(document.body.dataset.page) &&
      current.body === 'sun'
    ) {
      referenceHelp.hidden = false;
      referenceHelp.textContent = tr(
        '仅调整这个对照地点，原观察者不变。同地点的轨迹会重合。|Only this comparison location changes; the baseline stays fixed. Identical locations overlap.',
      );
    }
    if (
      o &&
      ['time', 'curve', 'snapshot', 'track'].includes(o.type) &&
      current.type !== 'analemma'
    ) {
      referenceHelp.hidden = false;
      referenceHelp.textContent = tr(
        '只调整这个对照对象。拖动滑条立即预览；输入框用于精确设置。原地点、日期和底部时间栏保持不变。|Only this comparison changes. Drag to preview or type a precise value. The baseline location, date and bottom timeline stay unchanged.',
      );
    }
    inspectorTitle.textContent = tr(
      o
        ? '调整所选对象|Selected reference'
        : '选择一个对象以调整|Select a reference to adjust',
    );
    const resultKey =
      (selectedOwner()?.id || '') + ':' + (current.body || '') + ':' + selected;
    if (result.dataset.reference !== resultKey) {
      result.textContent = '';
      result.dataset.reference = resultKey;
    }
    if (o) {
      const def = defs(selectedOwner()).find((d) => d.id === o.type);
      const label = E('label', 'dt-name-edit', form);
      label.append(document.createTextNode(tr('名称 / 说明|Name / note')));
      const input = E('input', '', label);
      input.value = o.customLabel ? o.label : tr(o.label);
      input.maxLength = 60;
      input.dataset.field = 'label';
      input.dataset.committedValue = input.value;
      input.onchange = () => {
        const value = input.value.trim();
        mutate(() => {
          o.label = value || def.title;
          o.customLabel = !!value;
          if (!value) delete o.copyNumber;
        }, true);
        input.value = value || tr(def.title);
        input.dataset.committedValue = input.value;
      };
      if (
        def.fields.some((f) => f.name === 'lat') &&
        def.fields.some((f) => f.name === 'lon') &&
        citySelect.options.length
      ) {
        const label = E('label', 'dt-city-edit', form);
        label.append(
          document.createTextNode(
            tr('选择城市，再拖动微调|Choose a city, then drag to adjust'),
          ),
        );
        const cities = E('select', '', label);
        cities.dataset.cityEdit = '';
        const custom = E('option', '', cities);
        custom.value = '';
        custom.textContent = tr('自定义地点|Custom location');
        for (const option of citySelect.options) cities.append(option.cloneNode(true));
        cities.value =
          [...cities.options].find((option) => {
            const values = option.value.split(',').map(Number);
            return (
              values.length === 2 &&
              Math.abs(values[0] - o.lat) < 1e-6 &&
              Math.abs(values[1] - o.lon) < 1e-6
            );
          })?.value || '';
        cities.onchange = () => {
          if (!cities.value || !validInputs()) return;
          const [lat, lon] = cities.value.split(',').map(Number);
          mutate(() => {
            o.lat = lat;
            o.lon = lon;
            referenceNameAtLocation(o);
          });
          form.querySelector('[data-city-edit]')?.focus({ preventScroll: true });
        };
      }
      for (const f of def.fields) {
        const l = E('label', '', form);
        l.append(document.createTextNode(tr(f.title)));
        const n = E(f.options ? 'select' : 'input', '', l);
        if (f.options) {
          for (const opt of f.options) {
            const [value, ...label] = opt.split(':');
            const e = E('option', '', n);
            e.value = value;
            e.textContent = tr(label.join(':'));
          }
        } else {
          n.type = f.min !== undefined ? 'number' : 'text';
          if (f.min !== undefined) {
            n.min = f.min;
            n.max = f.max;
            n.step = f.step;
          }
          if (f.value === 'date') {
            n.type = 'date';
            n.dataset.nativeDate = '';
            n.classList.add('dt-date-input');
            n.min = '1900-01-01';
            n.max = '2100-12-31';
          }
          n.setAttribute('aria-describedby', status.id);
        }
        if (f.name === 'time') {
          n.type = 'text';
          n.inputMode = 'numeric';
          n.placeholder = 'HH:MM';
          n.maxLength = 5;
        }
        n.dataset.field = f.name;
        n.value = displayValue(f.name, o[f.name]);
        n.dataset.committedValue = n.value;
        if (
          current.type === 'analemma' &&
          ((current.view === 'equatorial' && f.name === 'lat') ||
            (f.name === 'offset' && o.basis === 'apparent'))
        )
          n.disabled = true;
        if (o.locked && ['x', 'y', 'lat', 'lon', 'time'].includes(f.name))
          n.disabled = true;
        n.onchange = () => commitReferenceField(n, f, o);
        attachReferenceControl(n, f, o);
      }
      form.append(label);
      if (anchor(selectedOwner(), o)) {
        const row = E('label', 'dt-lock', form),
          lock = E('input', '', row),
          text = E('span', '', row);
        lock.type = 'checkbox';
        lock.checked = !!o.locked;
        text.textContent = tr('锁定位置|Lock position');
        lock.onchange = () => {
          if (!validInputs()) {
            lock.checked = !!o.locked;
            return;
          }
          mutate(() => (o.locked = lock.checked), true);
          for (const field of form.querySelectorAll('[data-field]')) {
            field.disabled =
              !!o.locked &&
              ['x', 'y', 'lat', 'lon', 'time'].includes(field.dataset.field);
            SkyParameterControls.sync(field);
          }
        };
      }
      if (o.type === 'camera') {
        const b = E('button', '', form);
        b.type = 'button';
        b.textContent = tr('回到此相机|Restore this camera');
        b.onclick = () => current.restoreCamera?.(o.camera);
      }
    }
  }

  function update() {
    if (!current || panel.hidden) return;
    const scrollBefore = scroll.scrollTop,
      listBefore = list.scrollTop,
      inspectorBefore = inspector.scrollTop,
      s = stateFor(selectedOwner());
    panel.dataset.canvas = current.canvas.id;
    const allEntries = entries();
    panel.dataset.empty = String(!allEntries.length);
    updateFold();
    tabs.setAttribute('aria-label', tr('图中对象操作|Plot object actions'));
    title.textContent = tr(titles[current.type] || current.type);
    more.setAttribute('aria-label', tr('更多操作|More actions'));
    more.title = tr('保存本图对象、复制或删除|Save plot objects, duplicate or delete');
    mobileBack.textContent = tr('返回对象列表|Back to object list');
    panel.dataset.detail = panel.dataset.detail || 'false';
    libraryTitle.textContent = tr('添加图中对象|Add a plot object');
    libraryIntro.textContent = tr(
      '选择要添加的对象。地点和时刻直接用于原图对照；杆、球等会进入实验地面摆放。|Choose an object. Places and times compare within the original plot; rods and spheres open the experiment ground.',
    );
    objectTitle.textContent = tr('图中对象|Plot objects') + ' · ' + allEntries.length;
    addAnother.textContent = tr('添加对象|Add object');
    cityPicker.hidden = !(
      current.body === 'sun' &&
      ['lab', 'diagrams'].includes(document.body.dataset.page) &&
      citySelect.options.length
    );
    cityCaption.textContent = tr('新增观察点的地点|Location for the new observer');
    recipe.textContent = tr('开始这个实验|Start this experiment');
    switchView(activeView, true);
    close.setAttribute('aria-label', tr('收起图中编辑|Close plot editor'));
    placementUI();
    contextualHelp();
    panel.dataset.limit = String(stateFor(current).objects.length >= 40);
    if (stateFor(current).objects.length >= 40)
      hint.textContent = tr(
        '已达到 40 个参考对象上限；删除一个后可继续添加。|40-reference limit reached; remove one to add another.',
      );
    renderToolLibrary();
    renderObjectList(allEntries, s);
    renderInspector(s);
    for (const b of panel.querySelectorAll('[data-dt-label]')) {
      b.textContent = tr(b.dataset.dtLabel);
      b.title = b.textContent;
    }
    title.title = title.textContent;
    updateFiles();
    updateLocation();
    actionState();
    scroll.scrollTop = scrollBefore;
    list.scrollTop = listBefore;
    inspector.scrollTop = inspectorBefore;
    if (
      desktopSplit() &&
      activeView === 'objects' &&
      panel.dataset.collapsed !== 'true'
    ) {
      const row = selectedRow();
      if (row) revealWithin(row, list);
    }
  }
  function selectedRow() {
    return [...list.querySelectorAll('[data-reference-id]')].find(
      (b) => b.dataset.referenceId === selectedKey(),
    );
  }
  function focusSelectedRow() {
    const row = selectedRow();
    (row || undo).focus({ preventScroll: true });
    if (row) revealWithin(row, list);
  }
  function selectReference(id, edit = false) {
    commitActive();
    if (!validInputs()) return;
    finishNudge();
    switchView('objects', true);
    const parts = id.split(':');
    selectedSource = parts.length > 1 ? parts[0] : current.id;
    selected = parts.length > 1 ? parts.slice(1).join(':') : id;
    update();
    showInspector();
    const row = selectedRow();
    row?.focus({ preventScroll: true });
    if (desktopSplit() && row) revealWithin(row, list);
    if (edit) {
      const input = form.querySelector(
        'input:not(:disabled),select:not(:disabled),button',
      );
      input?.focus({ preventScroll: true });
      if (input) revealField(input);
    }
    repaint();
  }
  list.addEventListener('keydown', (e) => {
    if (
      !desktopSplit() ||
      !e.target.matches('[data-reference-id]') ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey
    )
      return;
    const rows = [...list.querySelectorAll('[data-reference-id]')],
      index = rows.indexOf(e.target);
    if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const next =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? rows.length - 1
            : Math.max(
                0,
                Math.min(rows.length - 1, index + (e.key === 'ArrowDown' ? 1 : -1)),
              );
      selectReference(rows[next].dataset.referenceId);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopImmediatePropagation();
      selectReference(e.target.dataset.referenceId, true);
    }
  });
  function textLayout(m, value, p, bounds = null) {
    const c = m.c;
    c.save();
    c.font = `12px "${en() ? 'SkyMotion Charter' : 'SkyMotion Reading'}",serif`;
    let label = String(value),
      width = c.measureText(label).width;
    const [left, top, w, h] = bounds || [0, 0, m.w, m.h],
      available = Math.max(12, w - 12);
    if (width > available) {
      while (label.length && c.measureText(label + '…').width > available)
        label = label.slice(0, -1);
      label += '…';
      width = c.measureText(label).width;
    }
    c.restore();
    return {
      text: label,
      width,
      x: Math.max(left + 6, Math.min(left + w - 6 - width, p.x)),
      y: Math.max(top + 14, Math.min(top + h - 8, p.y)),
    };
  }
  const trackColors = ['#c4d9bf', '#e5b9a5', '#dfd2a4', '#d2c1d8', '#b9d4ce'];
  function helper(m) {
    const { c, w, h } = m,
      col = '#f2d7a3';
    return {
      c,
      w,
      h,
      line(a, b, dashed = false) {
        if (!a || !b) return;
        c.beginPath();
        c.setLineDash(dashed ? [4, 4] : []);
        c.strokeStyle = this.color || col;
        c.lineWidth = this.width || 1.5;
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
        c.setLineDash([]);
      },
      path(points, dashed = false) {
        let previous = null;
        for (const p of points) {
          if (!p || p.hidden) {
            previous = null;
            continue;
          }
          if (
            previous &&
            (!Number.isFinite(p.wrap) ||
              !Number.isFinite(previous.wrap) ||
              Math.abs(p.wrap - previous.wrap) <= 180)
          )
            this.line(previous, p, dashed);
          previous = p;
        }
      },
      dot(p, label) {
        if (!p || p.hidden) return;
        c.fillStyle = this.color || col;
        c.beginPath();
        c.arc(p.x, p.y, 4, 0, 7);
        c.fill();
        if (label) this.text(label, { x: p.x + 8, y: p.y - 8 });
      },
      text(label, p) {
        if (!p) return;
        const layout = textLayout(m, label, p, this.clipLabels ? m.clip : null);
        c.font = `12px "${en() ? 'SkyMotion Charter' : 'SkyMotion Reading'}",serif`;
        c.fillStyle = this.color || col;
        c.textAlign = 'left';
        if (window.skyFillText) window.skyFillText(c, layout.text, layout.x, layout.y);
        else c.fillText(layout.text, layout.x, layout.y);
      },
      circle(p, r) {
        if (!p) return;
        c.strokeStyle = this.color || col;
        c.lineWidth = this.width || 1.5;
        c.beginPath();
        c.arc(p.x, p.y, r, 0, 7);
        c.stroke();
      },
    };
  }
  function drawObject(o, m, H) {
    const { type } = m,
      at = m.project,
      label = o.customLabel ? o.label : tr(o.label);
    let metric = '';
    if (o.type === 'note') {
      H.text(label, { x: (m.w * o.x) / 100, y: (m.h * o.y) / 100 });
      return label;
    }
    if (o.type === 'emphasis') {
      H.circle(
        { x: (m.w * o.x) / 100, y: (m.h * o.y) / 100 },
        (Math.min(m.w, m.h) * o.radius) / 100,
      );
      return label;
    }
    if (type === 'sky') {
      const body = m.body === 'moon' ? 'Moon' : 'Sun',
        position = (time, date = m.date, lat = m.lat, lon = m.lon) =>
          body === 'Sun' && state.manual
            ? solar(lat, state.dec, time)
            : skyRaw(body, time, date, lat, lon);
      if (o.type === 'time') {
        const p = position(o.time);
        H.dot(m.projectSky(p), label + ' · ' + SkyDiagramSampling.clock(o.time));
        metric = SkyDiagramSampling.clock(o.time) + ' · ' + p.alt.toFixed(1) + '°';
      }
      if (o.type === 'observer') {
        const p =
          window.SkyObserverComparison?.sites().find((q) => q.id === o.id)?.position ||
          position(m.time, m.date, o.lat, o.lon);
        H.dot(m.projectSky(p), label);
        metric = p.alt.toFixed(1) + '° · ' + p.az.toFixed(1) + '°';
      }
      if (o.type === 'curve') {
        const points = SkyDiagramSampling.memo(
          JSON.stringify([
            'sky-date',
            body,
            o.date,
            m.lat,
            m.lon,
            state.manual,
            state.manual ? state.dec : 0,
          ]),
          () => Array.from({ length: 97 }, (_, i) => position(i * 15, o.date)),
        );
        H.path(points.map(m.projectSky));
        metric = o.date;
      }
    }
    if (type === 'globe') {
      if (['observer', 'ray'].includes(o.type)) {
        const p = at(o.lat, o.lon);
        H.dot(p, label);
        if (m.sun) {
          const a = o.lat * R,
            l = (o.lon - m.sun.lon) * R,
            d = m.sun.dec * R,
            alt =
              Math.asin(
                Math.max(
                  -1,
                  Math.min(
                    1,
                    Math.sin(a) * Math.sin(d) + Math.cos(a) * Math.cos(d) * Math.cos(l),
                  ),
                ),
              ) / R;
          metric = `${label} · ${alt.toFixed(1)}° · ${tr(alt >= 0 ? '白昼|Daylight' : '夜晚|Night')}`;
          if (o.type === 'ray' && p && !p.hidden)
            H.line(p, m.rayAt?.(o.lat, o.lon), alt < 0);
        }
      }
      if (o.type === 'observer') {
        const linked = window.SkyObserverComparison?.sites().find((p) => p.id === o.id);
        if (linked) {
          const minute = Math.round(linked.time) % 1440;
          metric =
            `${label} · ${linked.position.alt.toFixed(1)}° · ` +
            (linked.clockValid
              ? `${linked.date} ${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
              : tr('日期超出范围|Date outside range'));
        }
      }
      if (o.type === 'latitude')
        H.path(Array.from({ length: 181 }, (_, i) => at(o.lat, -180 + i * 2)));
      if (o.type === 'longitude')
        H.path(Array.from({ length: 91 }, (_, i) => at(-90 + i * 2, o.lon)));
    }
    if (type === 'altitude') {
      if (o.type === 'curve') {
        const points = Array.from({ length: 145 }, (_, i) =>
          m.project(i * 10, m.value(i * 10, o.date)),
        );
        H.path(points, true);
        H.text(label, points[72]);
        metric = o.date;
      }
      if (o.type === 'level') H.line(at(0, o.alt), at(1440, o.alt), true);
      if (o.type === 'time') {
        const v = m.value(o.time, m.date);
        H.line(at(o.time, m.low), at(o.time, m.high), true);
        H.dot(at(o.time, v), label);
        metric = `${v.toFixed(2)} ${m.unit}`;
      }
      if (o.type === 'measure') {
        const a = m.value(o.a, m.date),
          b = m.value(o.b, m.date);
        H.dot(at(o.a, a), 'A');
        H.dot(at(o.b, b), 'B');
        H.line(at(o.a, a), at(o.b, b));
        metric = `Δt ${Math.abs(o.b - o.a)} min · Δh ${(b - a).toFixed(2)}°`;
      }
    }
    if (type === 'illumination') {
      const value = (date) => m.value(date),
        inMonth = (date) => date.slice(0, 7) === m.date.slice(0, 7),
        outside = tr(
          '日期不在当前月份；切换到对应月份查看标记。|Date outside this month; switch to its month to see the marker.',
        );
      const dateDot = (date, v, text) => {
        if (inMonth(date)) H.dot(m.project(Number(date.slice(8)), v), text);
      };
      if (o.type === 'curve') {
        const base = o.date.slice(0, 8),
          count = new Date(
            Number(o.date.slice(0, 4)),
            Number(o.date.slice(5, 7)),
            0,
          ).getDate();
        const points = Array.from({ length: Math.min(count, m.days) }, (_, i) =>
          m.project(i + 1, value(base + String(i + 1).padStart(2, '0'))),
        );
        H.path(points, true);
        H.text(o.date.slice(0, 7) + ' · ' + label, points[Math.floor(points.length / 2)]);
        metric = o.date.slice(0, 7);
      }
      if (o.type === 'level')
        H.line(m.project(1, o.value), m.project(m.days, o.value), true);
      if (o.type === 'date') {
        const v = value(o.date);
        dateDot(o.date, v, label + ' · ' + o.date);
        metric =
          o.date + ' · ' + v.toFixed(2) + '%' + (inMonth(o.date) ? '' : ' · ' + outside);
      }
      if (o.type === 'measure') {
        const a = value(o.a),
          b = value(o.b);
        dateDot(o.a, a, 'A · ' + o.a);
        dateDot(o.b, b, 'B · ' + o.b);
        metric =
          `A ${o.a} · ${a.toFixed(2)}% / B ${o.b} · ${b.toFixed(2)}% · Δ ${(b - a).toFixed(2)} ${tr('个百分点|pp')}` +
          (!inMonth(o.a) || !inMonth(o.b) ? ' · ' + outside : '');
      }
    }
    if (type === 'azimuth') {
      if (o.type === 'direction') {
        const p = at(o.az, 1);
        H.line(at(0, 0), p);
        H.dot(p, label);
        metric = o.az + '°';
      }
      if (o.type === 'ring') H.circle(at(0, 0), (m.radius * o.radius) / 100);
      if (o.type === 'events') {
        const events = m.events(o.date, o.obstruction);
        for (const [i, p] of events.entries()) {
          const q = at(p.az, i ? 0.88 : 1.1);
          H.line(at(0, 0), q, true);
          H.dot(q, `${label} ${SkyDiagramSampling.clock(p.time)}`);
        }
        metric = events.length
          ? events.map((x) => x.az.toFixed(1) + '°').join(' / ')
          : tr('此日未穿越指定遮挡角|No crossing of this obstruction angle');
      }
    }
    if (type === 'geometry') {
      const scale = (a, k) => a.map((x) => x * k),
        add = (a, b) => a.map((x, i) => x + b[i]);
      if (o.type === 'observer') {
        const a = o.lat * R,
          l = (o.lon - m.lon) * R,
          q = [Math.cos(a) * Math.cos(l), Math.sin(a), Math.cos(a) * Math.sin(l)];
        H.dot(at(q), label);
        H.line(at(q), at(scale(q, 1 + o.height)));
        metric = `${o.lat.toFixed(1)}°, ${o.lon.toFixed(1)}°`;
      }
      if (o.type === 'ring') {
        const center = o.plane === 'horizon' ? m.q : [0, 0, 0],
          u = o.plane === 'horizon' ? m.north : [1, 0, 0],
          v =
            o.plane === 'horizon'
              ? m.east
              : o.plane === 'equator'
                ? [0, 0, 1]
                : [0, 1, 0];
        H.path(
          Array.from({ length: 121 }, (_, i) => {
            const a = (i * Math.PI) / 60;
            return at(
              add(
                center,
                add(scale(u, o.radius * Math.cos(a)), scale(v, o.radius * Math.sin(a))),
              ),
            );
          }),
        );
      }
      if (o.type === 'angle') {
        const dir = (key) =>
            key === 'axis'
              ? [0, 1, 0]
              : key === 'sun'
                ? m.sun
                : key === 'north'
                  ? m.north
                  : m.q,
          a = dir(o.a),
          b = dir(o.b),
          angle =
            Math.acos(
              Math.max(
                -1,
                Math.min(
                  1,
                  a.reduce((n, x, i) => n + x * b[i], 0) /
                    (Math.hypot(...a) * Math.hypot(...b)),
                ),
              ),
            ) / R;
        H.line(at([0, 0, 0]), at(scale(a, 1.4)));
        H.line(at([0, 0, 0]), at(scale(b, 1.4)));
        metric = angle.toFixed(3) + '°';
        H.text(metric, at(scale(a, 1.2)));
      }
      if (o.type === 'direction') {
        const q =
          o.direction === 'sun'
            ? m.sun
            : o.direction === 'axis'
              ? [0, 1, 0]
              : o.direction === 'north'
                ? m.north
                : m.q;
        H.line(at([0, 0, 0]), at(scale(q, 1.5)));
        H.dot(at(scale(q, 1.5)), label);
      }
    }
    if (type === 'phase') {
      if (o.type === 'rays') {
        for (let i = 0; i < o.count; i++) {
          const y = m.center.y + (i - (o.count - 1) / 2) * m.radius * o.spread;
          H.line(
            { x: m.sunX - 15, y },
            { x: Math.max(8, m.center.x - m.radius), y },
            true,
          );
        }
        return o.count + ' ' + tr('条平行光线|parallel rays');
      }
      const angle = o.type === 'snapshot' ? m.phaseAt(o.date, o.time) : o.angle,
        p = at(angle);
      H.dot(p, label);
      if (o.type === 'snapshot' && o.sight !== 'no') H.line(m.center, p, true);
      if (o.type === 'observer') H.line(m.center, p);
      metric = `${angle.toFixed(1)}° · ${tr('照明|Illuminated')} ${(o.type === 'snapshot' ? m.fractionAt(o.date, o.time) * 100 : (1 - Math.cos(angle * R)) * 50).toFixed(1)}%`;
    }
    if (type === 'companion') {
      if (o.type === 'snapshot') {
        const s = m.sample(o.date, o.time);
        const a = at(s.moon),
          b = at(s.planet);
        H.line(a, b, true);
        H.dot(a, label + ' A');
        H.dot(b, label + ' B');
        metric = `${o.date} · ${s.separation.toFixed(3)}°`;
      }
      if (o.type === 'trail') {
        const moon = [],
          planet = [];
        for (const s of m.trail(o)) {
          moon.push(at(s.moon));
          planet.push(at(s.planet));
        }
        H.path(moon);
        H.path(planet, true);
        metric = tr('前后|Before/after') + ' ' + o.hours + ' h';
      }
    }
    if (type === 'analemma') {
      if (o.type === 'track') {
        const samples = m.track(o);
        H.path(samples.map(at), true);
        if (samples[0]) H.dot(at(samples[0]));
        const signature = (q) =>
            JSON.stringify([
              q.lat,
              q.lon,
              q.clock,
              q.basis || 'clock',
              (q.basis || 'clock') === 'clock' ? (q.offset ?? m.offset) : 0,
            ]),
          primary = {
            lat: m.lat,
            lon: m.lon,
            clock: m.clock,
            basis: m.basis,
            offset: m.offset,
          },
          duplicate = stateFor(m).objects.some(
            (q) =>
              q.id !== o.id &&
              q.type === 'track' &&
              q.visible &&
              signature(q) === signature(o),
          );
        metric = `${Math.abs(o.lat).toFixed(2)}°${o.lat < 0 ? 'S' : 'N'} · ${Math.abs(o.lon).toFixed(2)}°${o.lon < 0 ? 'W' : 'E'} · ${SkyDiagramSampling.clock(o.clock)} · ${tr(o.basis === 'apparent' ? '真太阳时|Apparent solar time' : '钟表时|Clock time')}`;
        if (o.basis !== 'apparent')
          metric += ' · UTC' + (o.offset >= 0 ? '+' : '') + o.offset;
        if (signature(primary) === signature(o) || duplicate)
          metric +=
            ' · ' +
            tr(
              '条件相同，轨迹重合；请改变时刻、经度或切换天空视图比较纬度。|Matching conditions overlap. Change time or longitude, or use a sky view to compare latitudes.',
            );
      }
      if (o.type === 'date') {
        const p = m.sample(o.date);
        H.dot(at(p), label + ' ' + o.date);
        metric = `${p.alt.toFixed(2)}°`;
      }
      if (o.type === 'level') {
        if (m.view === 'equatorial')
          return tr(
            '此图不是高度坐标，请切换天空或天穹视图查看高度参考。|Switch to sky or dome view to see an altitude reference.',
          );
        H.path(
          Array.from({ length: 181 }, (_, i) => at({ az: i * 2, alt: o.alt })),
          true,
        );
      }
    }
    if (type === 'lunar') {
      const p = m.reference(o);
      H.dot(p, label);
      if (o.type === 'sight') H.line(p, m.earth, true);
      metric = m.readReference(o);
    }
    if (type === 'space') {
      if (o.type === 'plane') {
        const points = Array.from({ length: 101 }, (_, i) => {
          const a = (i * Math.PI) / 50,
            x = o.radius * Math.cos(a),
            y = o.radius * Math.sin(a);
          return at(
            o.plane === 'xz' ? [x, 0, y] : o.plane === 'xy' ? [x, y, 0] : [0, x, y],
          );
        });
        H.path(points, true);
      }
      if (['distance', 'angle'].includes(o.type)) {
        const a = m.planet(o.a),
          b = m.planet(o.b);
        if (a && b) {
          H.dot(at(a.display), o.a);
          H.dot(at(b.display), o.b);
          if (o.type === 'distance') {
            H.line(at(a.display), at(b.display));
            metric =
              Math.hypot(...a.physical.map((v, i) => v - b.physical[i])).toFixed(5) +
              ' AU';
          } else {
            H.line(at(a.display), at([0, 0, 0]));
            H.line(at([0, 0, 0]), at(b.display));
            const angle =
              Math.acos(
                Math.max(
                  -1,
                  Math.min(
                    1,
                    a.physical.reduce((n, v, i) => n + v * b.physical[i], 0) /
                      (Math.hypot(...a.physical) * Math.hypot(...b.physical)),
                  ),
                ),
              ) / R;
            metric = angle.toFixed(3) + '°';
          }
          H.text(metric, at(a.display));
        }
      }
      if (o.type === 'camera')
        metric = tr(
          '已保存此视角，可在属性中返回|Saved viewpoint; restore from its properties',
        );
    }
    return metric;
  }
  // Direct manipulation uses the plot's existing projection and inverse pick.
  function anchor(m, o) {
    if (o.type === 'note')
      return textLayout(m, o.customLabel ? o.label : tr(o.label), {
        x: (m.w * o.x) / 100,
        y: (m.h * o.y) / 100,
      });
    if (o.type === 'emphasis') return { x: (m.w * o.x) / 100, y: (m.h * o.y) / 100 };
    if (m.type === 'sky' && o.type === 'time') return m.projectSky(m.position(o.time));
    if (m.type === 'globe' && ['observer', 'ray'].includes(o.type) && m.pick)
      return m.project(o.lat, o.lon);
    if (m.type === 'altitude' && o.type === 'time' && m.pick)
      return m.project(o.time, m.value(o.time, m.date));
    return null;
  }
  // Text may be visually clamped at an edge; movement starts where it is drawn.
  function movementOrigin(m, o) {
    const origin = copy(o);
    if (o.type === 'note') {
      const p = anchor(m, o);
      origin.x = (p.x / m.w) * 100;
      origin.y = (p.y / m.h) * 100;
    }
    return origin;
  }
  function hitAnchor(m, o) {
    const a = anchor(m, o);
    if (a) return a;
    if (m.type === 'sky' && o.type === 'observer') {
      const p =
        window.SkyObserverComparison?.sites().find((q) => q.id === o.id)?.position ||
        (state.manual
          ? solar(o.lat, state.dec, m.time)
          : skyRaw('Sun', m.time, m.date, o.lat, o.lon));
      return m.projectSky(p);
    }
    return null;
  }
  function pointAt(m, e) {
    const r = m.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * m.w,
      y: ((e.clientY - r.top) / r.height) * m.h,
    };
  }
  function beginDrag(id, e) {
    if (!customizationOn() || armed) return false;
    commitActive();
    if (!validInputs()) return true;
    finishNudge();
    if (drag) {
      cancelDrag();
      return true;
    }
    const m = models.get(id),
      p = pointAt(m, e),
      s = stateFor(m);
    const o = [...s.objects].reverse().find((o) => {
      if (!o.visible) return false;
      const a = hitAnchor(m, o);
      if (!a || a.hidden) return false;
      if (Math.hypot(p.x - a.x, p.y - a.y) <= 20) return true;
      if (o.type === 'note') {
        const label = o.customLabel ? o.label : tr(o.label);
        return p.y >= a.y - 16 && p.y <= a.y + 6 && p.x >= a.x && p.x <= a.x + a.width;
      }
      return false;
    });
    if (!o) return false;
    if (panel.hidden || current?.id !== id || railView !== 'references') {
      const keepCanvas =
        document.body.hasAttribute('data-entry-view') &&
        matchMedia('(max-width:760px)').matches;
      open(m, keepCanvas);
    }
    editing = true;
    if (typeof state !== 'undefined' && typeof stop === 'function') stop();
    else m.pause?.();
    const changed = selected !== o.id || selectedSource !== current.id;
    selectedSource = current.id;
    selected = o.id;
    switchView('objects', true);
    if (o.locked || !anchor(m, o)) {
      m.canvas.setPointerCapture(e.pointerId);
      if (m.canvas.tabIndex < 0) m.canvas.tabIndex = 0;
      m.canvas.focus({ preventScroll: true });
      update();
      if (changed) showInspector();
      status.textContent = tr(
        o.locked
          ? '位置已锁定，可在属性中解锁。|Position locked; unlock it in properties.'
          : '已选中对象，可在属性中调整。|Object selected; adjust its properties.',
      );
      repaint();
      return true;
    }
    drag = {
      id: e.pointerId,
      m,
      s,
      object: o.id,
      before: copy(s.objects),
      start: p,
      origin: movementOrigin(m, o),
      moved: false,
    };
    m.canvas.setPointerCapture(e.pointerId);
    if (m.canvas.tabIndex < 0) m.canvas.tabIndex = 0;
    m.canvas.focus({ preventScroll: true });
    update();
    if (changed) showInspector();
    repaint();
    return true;
  }
  function moveDrag(e) {
    if (!drag || e.pointerId !== drag.id) return false;
    const g = drag,
      p = pointAt(g.m, e),
      o = g.s.objects.find((o) => o.id === g.object);
    if (!o) return false;
    if (o.locked) return true;
    const dx = p.x - g.start.x,
      dy = p.y - g.start.y;
    if (!g.moved && Math.hypot(dx, dy) < 3) return true;
    g.moved = true;
    if (['note', 'emphasis'].includes(o.type)) {
      o.x = Number(
        Math.max(0, Math.min(100, g.origin.x + (dx / g.m.w) * 100)).toFixed(2),
      );
      o.y = Number(
        Math.max(0, Math.min(100, g.origin.y + (dy / g.m.h) * 100)).toFixed(2),
      );
    } else {
      const picked = g.m.pick?.(p.x, p.y);
      if (picked)
        for (const [key, value] of Object.entries(picked))
          o[key] =
            key === 'time'
              ? Math.round(value)
              : Number.isFinite(value)
                ? Number(value.toFixed(2))
                : value;
    }
    syncInputs(o);
    repaint();
    return true;
  }
  function finishDrag(cancel = false) {
    if (!drag) return;
    const g = drag;
    drag = null;
    if (cancel) g.s.objects = g.before;
    else record(g.s, g.before);
    if (g.m.canvas.hasPointerCapture(g.id)) g.m.canvas.releasePointerCapture(g.id);
    draftStatus();
    update();
    repaint();
  }
  function cancelDrag() {
    finishDrag(true);
  }
  function wireCanvas(id, canvas, surface = canvas) {
    let suppressClick = false;
    const owned = new Set(),
      consume = (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
      };
    surface.addEventListener(
      'click',
      (e) => {
        if (suppressClick) {
          suppressClick = false;
          consume(e);
        }
      },
      true,
    );
    surface.addEventListener(
      'pointerdown',
      (e) => {
        // A second finger during reference editing cancels the edit; it must not
        // leak a partial pinch gesture to the underlying scientific camera.
        if (owned.size && !owned.has(e.pointerId)) {
          owned.add(e.pointerId);
          canvas.setPointerCapture(e.pointerId);
          suppressClick = true;
          consume(e);
          cancelDrag();
          return;
        }
        const control = e.target.closest?.('button,input,select,a');
        if (control && !control.matches('.label')) return;
        suppressClick = false;
        if (e.button !== 0 || !e.isPrimary) return;
        if (armed && current?.id === id) {
          owned.add(e.pointerId);
          canvas.setPointerCapture(e.pointerId);
          suppressClick = true;
          consume(e);
          const p = pointAt(models.get(id), e);
          placeAt(p.x, p.y);
        } else if (beginDrag(id, e)) {
          owned.add(e.pointerId);
          suppressClick = true;
          consume(e);
        }
      },
      true,
    );
    surface.addEventListener(
      'pointermove',
      (e) => {
        if (owned.has(e.pointerId)) {
          moveDrag(e);
          consume(e);
        }
      },
      true,
    );
    surface.addEventListener(
      'pointerup',
      (e) => {
        if (owned.delete(e.pointerId)) {
          consume(e);
          if (drag?.id === e.pointerId) finishDrag();
        }
      },
      true,
    );
    for (const event of ['pointercancel', 'lostpointercapture'])
      surface.addEventListener(
        event,
        (e) => {
          if (owned.delete(e.pointerId)) {
            consume(e);
            if (drag?.id === e.pointerId) cancelDrag();
          }
        },
        true,
      );
    window.addEventListener('blur', () => {
      for (const pointer of owned)
        if (canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
      owned.clear();
    });
  }
  function paint(id, m) {
    if (!m.canvas || !m.w || !m.h) return;
    m = { ...m, id };
    models.set(id, m);
    syncRailShell();
    if (!portals.has(id)) {
      const b = E(
        'button',
        'diagram-tool-launch diagram-tools',
        m.host || m.canvas.parentElement,
      );
      b.type = 'button';
      b.dataset.i18nSkip = '';
      b.onclick = () => open(models.get(id));
      portals.set(id, b);
      (m.host || m.canvas.parentElement).classList.add('dt-host');
      wireCanvas(id, m.canvas, m.host || m.canvas);
    }
    const b = portals.get(id);
    b.textContent = tr('图内自定义|Customize plot');
    b.setAttribute('aria-label', tr(titles[m.type] || m.type) + ' · ' + b.textContent);
    syncLaunchers();
    if (current && current.id !== id) checkCurrentVisibility();
    if (
      current?.id === id &&
      (current.body !== m.body ||
        current.type !== m.type ||
        (m.type === 'analemma' && current.view !== m.view))
    ) {
      rememberContext();
      finishNudge();
      cancelDrag();
      current = m;
      selectedSource = m.id;
      const target = stateFor(m);
      selected = target.objects.some((o) => o.id === target.lastSelected)
        ? target.lastSelected
        : null;
      armed = null;
      pendingImport = null;
      clearPending = false;
      importReview.replaceChildren();

      const remembered = target.viewScroll?.[activeView] || 0,
        inspectorPosition = target.inspectorScroll || 0,
        listPosition = target.listScroll || 0;
      scroll.scrollTop = 0;
      update();
      scroll.scrollTop = remembered;
      (target.viewScroll ??= {})[activeView] = remembered;
      inspector.scrollTop = inspectorPosition;
      list.scrollTop = listPosition;
    }
    if (!customizationOn()) return;
    window.SkyObserverComparison?.paint(m);
    const s = stateFor(m),
      H = helper(m);
    m.c.save();
    try {
      for (const o of s.objects.filter((o) => o.visible)) {
        m.c.save();
        try {
          H.color =
            ['globe', 'sky'].includes(m.type) && o.type === 'observer'
              ? window.SkyObserverComparison?.color(o.id)
              : m.type === 'analemma' && o.type === 'track'
                ? trackColors[
                    s.objects.filter((q) => q.type === 'track').indexOf(o) %
                      trackColors.length
                  ]
                : null;
          H.width =
            m.type === 'analemma' && o.type === 'track' && o.id === selected ? 2.5 : 1.5;
          const focus = window.SkyDiagramTools.selectedReference;
          if (focus && ['observer', 'time'].includes(o.type)) {
            const on = focus.id === o.id && focus.source === m.id;
            m.c.globalAlpha = on ? 1 : 0.3;
            if (on) H.width = 2.5;
          }
          if (m.clip && !['note', 'emphasis'].includes(o.type)) {
            m.c.beginPath();
            m.c.rect(...m.clip);
            m.c.clip();
          }
          H.clipLabels = !!m.clip && !['note', 'emphasis'].includes(o.type);
          const metric = drawObject(o, m, H);
          if (current?.id === id && o.id === selected) {
            if (result.textContent !== (metric || '')) result.textContent = metric || '';
            if (!panel.hidden && editing) {
              const a = anchor(m, o);
              if (a && !a.hidden) {
                if (o.locked) {
                  m.c.strokeStyle = '#f2d7a3';
                  m.c.strokeRect(a.x - 5, a.y - 5, 10, 10);
                } else H.circle(a, 7);
              }
            }
          }
        } finally {
          m.c.restore();
        }
      }
    } catch (error) {
      console.warn('Diagram reference rejected', error);
    } finally {
      m.c.restore();
    }
    if (current?.id === id) {
      current = m;
      if (!panel.hidden) updateLocation(m);
    }
  }
  function customizationOn() {
    try {
      return (window.SkyCustomization || parent.SkyCustomization)?.active !== false;
    } catch {
      return true;
    }
  }
  function syncLaunchers() {
    for (const [key, button] of portals) {
      const source = models.get(key)?.canvas,
        active =
          !panel.hidden && current?.id === key && panel.getClientRects().length > 0;
      button.hidden =
        !customizationOn() ||
        active ||
        !source ||
        source.getBoundingClientRect().width < 1 ||
        source.getBoundingClientRect().height < 1;
      button.setAttribute('aria-expanded', String(active));
      button.setAttribute('aria-controls', panel.id);
    }
  }
  // Responsive reparenting can briefly report a zero-sized canvas. Close only
  // when it remains hidden, rather than discarding the editor during that frame.
  function checkCurrentVisibility() {
    if (!current || panel.hidden) return;
    if (current.canvas.getBoundingClientRect().width) {
      clearTimeout(visibilityTimer);
      visibilityTimer = 0;
      return;
    }
    if (visibilityTimer) return;
    const canvas = current.canvas;
    visibilityTimer = setTimeout(() => {
      visibilityTimer = 0;
      if (
        current?.canvas === canvas &&
        !panel.hidden &&
        !canvas.getBoundingClientRect().width
      ) {
        const next = visibleModels()[0];
        if (next) open(next, true);
        else hide();
      }
    }, 120);
  }
  function syncVisibility() {
    syncLaunchers();
    checkCurrentVisibility();
    syncRailShell();
  }
  // The Lab's native parameter menu edits the same reference stores as the plots.
  const comparisonSources = {
    'lab-sky': 'sky',
    earth: 'globe',
    'world-map': 'globe',
    chart: 'altitude',
  };
  let comparisonSource = 'lab-sky';
  function comparisonModel(source) {
    if (!comparisonSources[source]) return null;
    return {
      ...models.get(source),
      id: source,
      type: comparisonSources[source],
      body: 'sun',
      date: state.date,
      time: state.time,
      lat: state.lat,
      lon: state.lon,
    };
  }
  function comparisonList() {
    return Object.keys(comparisonSources).flatMap((source) => {
      const m = comparisonModel(source);
      return stateFor(m)
        .objects.filter((o) => o.type === 'observer' || o.type === 'time')
        .map((o) => ({ ...copy(o), source }));
    });
  }
  function comparisonChange(source, fn) {
    if (!customizationOn() || state.body !== 'sun') return false;
    commitActive();
    if (!validInputs()) return false;
    finishNudge();
    cancelDrag();
    const m = comparisonModel(source);
    if (!m) return false;
    const s = stateFor(m),
      before = copy(s.objects),
      last = s.lastSelected;
    if (fn(s, m) === false) return false;
    stop();
    comparisonSource = source;
    record(s, before, last, m);
    if (current?.id === source && current.body === 'sun') {
      selected = s.objects.some((o) => o.id === s.lastSelected) ? s.lastSelected : null;
      update();
    }
    schedule();
    return true;
  }
  function comparisonValid(o) {
    return (
      ['observer', 'time'].includes(o.type) &&
      typeof o.label === 'string' &&
      o.label.trim().length > 0 &&
      o.label.length <= (o.customLabel ? 60 : 160) &&
      (o.type === 'time'
        ? Number.isFinite(o.time) && o.time >= 0 && o.time <= 1440
        : Number.isFinite(o.lat) &&
          Math.abs(o.lat) <= 90 &&
          Number.isFinite(o.lon) &&
          Math.abs(o.lon) <= 180)
    );
  }
  const comparisons = {
    list: comparisonList,
    add(kind, values = {}) {
      let id = null;
      const ok = comparisonChange('lab-sky', (s, m) => {
        if (s.objects.length >= 40 || !['observer', 'time'].includes(kind)) return false;
        const def = defs(m).find((d) => d.id === kind),
          n = s.objects.filter((o) => o.type === kind).length + 1,
          o = {
            id: 'd' + Date.now() + ++serial,
            type: kind,
            label: def.title,
            visible: true,
            locked: false,
            customLabel: false,
            ...(kind === 'observer'
              ? { lat: state.lat, lon: state.lon }
              : { time: state.time }),
            ...values,
          };
        if (values.label !== undefined) o.customLabel = values.customLabel !== false;
        else if (n > 1) {
          o.copyNumber = n;
          o.label = def.title
            .split('|')
            .map((x) => x + ' ' + n)
            .join('|');
        }
        if (!comparisonValid(o)) return false;
        s.objects.push(o);
        s.lastSelected = o.id;
        id = o.id;
      });
      return ok ? id : null;
    },
    patch(source, id, patch) {
      return comparisonChange(source, (s) => {
        const o = s.objects.find((o) => o.id === id);
        if (!o || (o.locked && ['lat', 'lon', 'time'].some((k) => k in patch)))
          return false;
        const allowed = [
            'label',
            'visible',
            ...(o.type === 'observer' ? ['lat', 'lon'] : ['time']),
          ],
          next = { ...o };
        for (const key of allowed) if (key in patch) next[key] = patch[key];
        if ('label' in patch) next.customLabel = true;
        if (!comparisonValid(next) || typeof next.visible !== 'boolean') return false;
        Object.assign(o, next);
        s.lastSelected = id;
      });
    },
    remove(source, id) {
      return comparisonChange(source, (s) => {
        if (!s.objects.some((o) => o.id === id)) return false;
        s.objects = s.objects.filter((o) => o.id !== id);
        if (s.lastSelected === id) s.lastSelected = null;
      });
    },
    duplicate(source, id) {
      return comparisonChange(source, (s) => {
        const o = s.objects.find((o) => o.id === id);
        if (!o || s.objects.length >= 40) return false;
        const q = copy(o);
        q.id = 'd' + Date.now() + ++serial;
        q.locked = false;
        if (q.customLabel) {
          let n = 2;
          while (s.objects.some((x) => x.label === o.label + ' ' + n)) n++;
          q.label = o.label + ' ' + n;
        } else {
          q.copyNumber =
            Math.max(
              1,
              ...s.objects.filter((x) => x.type === o.type).map((x) => x.copyNumber || 1),
            ) + 1;
          const title = definitions[comparisonSources[source]].find(
            (d) => d.id === o.type,
          ).title;
          q.label = title
            .split('|')
            .map((x) => x + ' ' + q.copyNumber)
            .join('|');
        }
        s.objects.push(q);
        s.lastSelected = q.id;
      });
    },
    save(source) {
      const m = comparisonModel(source);
      if (!m) return false;
      try {
        const s = stateFor(m);
        localStorage.setItem(
          'sky-diagram-tools-v1:' + source + ':sun',
          JSON.stringify({ version: 1, objects: s.objects }),
        );
        s.saved = JSON.stringify(s.objects);
        s.stored = true;
        draftStatus();
        return true;
      } catch {
        return false;
      }
    },
    history() {
      const m = comparisonModel(comparisonSource),
        s = stateFor(m);
      return { undo: !!s.undo.length, redo: !!s.redo.length };
    },
    travel(from) {
      const to = from === 'undo' ? 'redo' : 'undo';
      commitActive();
      if (!validInputs()) return false;
      finishNudge();
      cancelDrag();
      const m = comparisonModel(comparisonSource),
        s = stateFor(m);
      if (!s[from].length) return false;
      s[to].push({ objects: copy(s.objects), selected: s.lastSelected });
      const snapshot = s[from].pop();
      s.objects = snapshot.objects;
      s.lastSelected = snapshot.selected;
      persist(m, s);
      draftStatus();
      if (current?.id === m.id) {
        selected = s.lastSelected;
        update();
      }
      stop();
      schedule();
      document.dispatchEvent(new Event('skymotion:references'));
      return true;
    },
  };
  window.SkyDiagramTools = {
    checkpoint() {
      const previous = copy([...states]);
      const selection = { selected, selectedSource, serial };
      return () => {
        const keys = new Set(previous.map(([key]) => key));
        for (const [key, saved] of states)
          if (!keys.has(key)) {
            try {
              sessionStorage.removeItem(draftKey(saved.model));
            } catch {}
          }
        states.clear();
        for (const [key, saved] of previous) {
          states.set(key, saved);
          persist(saved.model, saved);
        }
        ({ selected, selectedSource, serial } = selection);
        update();
        repaint();
      };
    },
    get selectedReference() {
      if (!current || !customizationOn()) return null;
      const owner = selectedOwner();
      const object = stateFor(owner).objects.find((o) => o.id === selected);
      return object && ['observer', 'time'].includes(object.type)
        ? { id: object.id, source: owner.id }
        : null;
    },
    snapshotExperiment() {
      commitActive();
      if (!validInputs()) return null;
      return [...states.values()]
        .filter((s) => s.model?.body === state.body)
        .map((s) => ({ ...s.model, objects: copy(s.objects) }));
    },
    prepareExperiment(raw) {
      if (!Array.isArray(raw) || raw.length > 30) return null;
      const keys = new Set(),
        result = [];
      for (const item of raw) {
        if (
          !item ||
          typeof item.id !== 'string' ||
          !/^[a-zA-Z0-9-]{1,60}$/.test(item.id) ||
          item.body !== state.body ||
          !Object.hasOwn(definitions, item.type) ||
          !Array.isArray(item.objects) ||
          item.objects.length > 40 ||
          keys.has(item.id)
        )
          return null;
        keys.add(item.id);
        const objects = clean(item.objects, item);
        if (objects.length !== item.objects.length) return null;
        result.push({ id: item.id, type: item.type, body: item.body, objects });
      }
      return result;
    },
    restoreExperiment(raw) {
      const prepared = this.prepareExperiment(raw);
      if (!prepared) return false;
      hide();
      const incoming = new Map(prepared.map((item) => [item.id, item]));
      for (const s of states.values())
        if (s.model?.body === state.body && !incoming.has(s.model.id))
          incoming.set(s.model.id, { ...s.model, objects: [] });
      for (const item of incoming.values()) {
        const s = stateFor(item);
        s.objects = copy(item.objects);
        s.lastSelected = null;
        s.undo = [];
        s.redo = [];
        persist(item, s);
      }
      selected = null;
      schedule();
      return true;
    },
    selectSidebar: chooseRail,
    openObjects(options = {}) {
      if (!customizationOn()) return false;
      const available = visibleModels(),
        target =
          available.find((m) => m.id === options.source) ||
          available.find((m) => m.id === current?.id) ||
          available[0];
      if (!target) return false;
      if (open(target) === false) return false;
      panel.dataset.detail = 'false';
      switchView(options.add ? 'library' : 'objects', true);
      if (options.id) {
        if (typeof options.id !== 'string') return false;
        const source = options.source || target.id;
        if (source !== target.id && (!comparisonSources[source] || target.body !== 'sun'))
          return false;
        selectReference(
          source === target.id ? options.id : source + ':' + options.id,
          true,
        );
      }
      return true;
    },
    comparisons,
    observers() {
      if (!customizationOn() || typeof state === 'undefined' || state.body !== 'sun')
        return [];
      return ['earth', 'world-map', 'lab-sky'].flatMap((id) =>
        stateFor({
          id,
          type: id === 'lab-sky' ? 'sky' : 'globe',
          body: 'sun',
          date: state.date,
          lat: state.lat,
          lon: state.lon,
        })
          .objects.filter((o) => o.type === 'observer' && o.visible)
          .map((o) => ({ ...copy(o), source: id })),
      );
    },
    times() {
      if (!customizationOn() || typeof state === 'undefined' || state.body !== 'sun')
        return [];
      return ['chart', 'lab-sky'].flatMap((id) =>
        stateFor({
          id,
          type: id === 'chart' ? 'altitude' : 'sky',
          body: 'sun',
          date: state.date,
          time: state.time,
          lat: state.lat,
          lon: state.lon,
        })
          .objects.filter((o) => o.type === 'time' && o.visible)
          .map((o) => ({ ...copy(o), source: id })),
      );
    },
    paint,
    syncVisibility,
    referenceColor: (index) => trackColors[index % trackColors.length],
    leave() {
      commitActive();
      if (!validInputs()) return false;
      hide();
      return true;
    },
    visible: (id, key) => {
      if (!customizationOn()) return true;
      const m = models.get(id);
      if (!m) return true;
      const refs = stateFor(m).objects.filter(
        (o) => o.type === 'visibility' && o.visible,
      );
      return !refs.length || refs.at(-1)[key] !== 'no';
    },
    read: (id) => {
      const m = models.get(id);
      return m ? copy(stateFor(m).objects) : null;
    },
    overlay(id, base) {
      const host =
        base.canvas.tagName === 'CANVAS' ? base.canvas.parentElement : base.canvas;
      let layer = host.querySelector('.dt-overlay');
      if (!layer) {
        layer = E('canvas', 'dt-overlay', host);
        layer.setAttribute('aria-hidden', 'true');
      }
      const w = base.canvas.clientWidth,
        h = base.canvas.clientHeight,
        dpr = Math.min(devicePixelRatio || 1, 2);
      if (layer.width !== Math.round(w * dpr) || layer.height !== Math.round(h * dpr)) {
        layer.width = Math.round(w * dpr);
        layer.height = Math.round(h * dpr);
      }
      layer.style.width = w + 'px';
      layer.style.height = h + 'px';
      const c = layer.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      paint(id, { ...base, host, w, h, c });
    },
  };
  document.addEventListener('skymotion:builder-open', () => {
    railView = 'references';
    syncRailShell();
  });
  document.addEventListener('skymotion:customization', () => {
    if (!customizationOn()) hide();
    else {
      railView = 'references';
      editing = true;
      requestAnimationFrame(() => {
        const target = visibleModels()[0];
        if (target && !document.body.classList.contains('scene-builder-active')) {
          open(target, true);
          switchView('objects', true);
        }
      });
    }
    syncRailShell();
    syncLaunchers();
    repaint();
  });
  function syncInputs(o) {
    for (const input of form.querySelectorAll('[data-field]'))
      if (input !== document.activeElement && input.dataset.field !== 'label') {
        input.value = displayValue(input.dataset.field, o[input.dataset.field]);
        input.dataset.committedValue = input.value;
      }
  }
  function finishNudge(cancel = false) {
    if (!nudging) return;
    const g = nudging;
    nudging = null;
    if (cancel) g.s.objects = g.before;
    else record(g.s, g.before);
    draftStatus();
    update();
    repaint();
  }
  function nudge(e) {
    if (
      !editing ||
      armed ||
      drag ||
      e.target !== current.canvas ||
      e.altKey ||
      e.metaKey ||
      e.ctrlKey ||
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
    )
      return false;
    const s = stateFor(selectedOwner()),
      o = s.objects.find((o) => o.id === selected);
    if (!o?.visible || !anchor(current, o)) return false;
    if (o.locked) {
      status.textContent = tr(
        o.locked
          ? '位置已锁定，可在属性中解锁。|Position locked; unlock it in properties.'
          : '已选中对象，可在属性中调整。|Object selected; adjust its properties.',
      );
      return true;
    }
    if (!nudging) {
      if (typeof state !== 'undefined' && typeof stop === 'function') stop();
      else current.pause?.();
      nudging = { s, before: copy(s.objects) };
      if (o.type === 'note') {
        const origin = movementOrigin(current, o);
        o.x = origin.x;
        o.y = origin.y;
      }
    }
    const fast = e.shiftKey ? 5 : 1,
      sign = ['ArrowLeft', 'ArrowDown'].includes(e.key) ? -1 : 1;
    if (['note', 'emphasis'].includes(o.type)) {
      const step = 0.2 * fast;
      if (e.key === 'ArrowLeft') o.x = Math.max(0, o.x - step);
      if (e.key === 'ArrowRight') o.x = Math.min(100, o.x + step);
      if (e.key === 'ArrowUp') o.y = Math.max(0, o.y - step);
      if (e.key === 'ArrowDown') o.y = Math.min(100, o.y + step);
      o.x = Number(o.x.toFixed(2));
      o.y = Number(o.y.toFixed(2));
    } else if (current.type === 'globe') {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        o.lon = Number((((o.lon + sign * 0.1 * fast + 540) % 360) - 180).toFixed(2));
      } else
        o.lat = Number(Math.max(-90, Math.min(90, o.lat + sign * 0.1 * fast)).toFixed(2));
    } else if (o.type === 'time')
      o.time = Math.max(0, Math.min(1440, o.time + sign * fast));
    syncInputs(o);
    repaint();
    return true;
  }
  document.addEventListener(
    'keydown',
    (e) => {
      if (
        panel.hidden ||
        e.isComposing ||
        e.keyCode === 229 ||
        objectMenu.contains(e.target)
      )
        return;
      if (e.target.matches('.parameter-scrub')) return;
      const modal = e.target.closest?.('dialog[open],:popover-open');
      if (modal && !panel.contains(modal)) return;
      const local = panel.contains(e.target) || e.target === current.canvas;
      if (
        form.contains(e.target) &&
        e.target.matches('input:not([type=checkbox])') &&
        e.key === 'Enter' &&
        !e.isComposing
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        commitActive();
        validInputs();
        return;
      }
      if (desktopSplit() && e.key === 'Escape' && form.contains(e.target)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.target.matches('input:not([type=checkbox])')) {
          e.target.value = e.target.dataset.committedValue;
          clearFieldError(e.target);
        }
        draftStatus();
        const row = selectedRow();
        row?.focus({ preventScroll: true });
        if (row) revealWithin(row, list);
        return;
      }
      if (desktopSplit() && e.key === 'Escape' && list.contains(e.target)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (current.canvas.tabIndex < 0) current.canvas.tabIndex = 0;
        current.canvas.focus({ preventScroll: true });
        return;
      }
      if (
        local &&
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'd' &&
        !e.target.matches('input,textarea,select')
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const fromList = list.contains(e.target);
        duplicate.click();
        if (fromList) focusSelectedRow();
        return;
      }
      if (local && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopImmediatePropagation();
        save();
        return;
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'z' &&
        !e.target.matches('input,textarea,select') &&
        local
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const fromList = list.contains(e.target);
        travel(e.shiftKey ? 'redo' : 'undo', e.shiftKey ? 'undo' : 'redo');
        if (fromList) focusSelectedRow();
        return;
      }
      if (drag && e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        cancelDrag();
        return;
      }
      if (nudging && e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        finishNudge(true);
        return;
      }
      if (nudge(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (
        !armed &&
        ((editing && e.target === current.canvas) ||
          (desktopSplit() &&
            list.contains(e.target) &&
            e.target.matches('[data-reference-id]'))) &&
        ['Delete', 'Backspace'].includes(e.key) &&
        stateFor(selectedOwner()).objects.some((o) => o.id === selected)
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const fromList = list.contains(e.target);
        remove.click();
        if (fromList) focusSelectedRow();
        return;
      }
      if (
        armed &&
        e.key === 'Enter' &&
        (e.target === current.canvas || e.target === placement)
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        placeAt(current.w / 2, current.h / 2);
      } else if (e.key === 'Escape' && (local || armed)) {
        e.preventDefault();
        e.stopPropagation();
        armed ? ((armed = null), update()) : hide();
      }
    },
    true,
  );
  document.addEventListener(
    'keyup',
    (e) => {
      if (
        nudging &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        finishNudge();
      }
    },
    true,
  );
  document.addEventListener('skymotion:language', () => {
    syncRailShell();
    for (const b of portals.values()) b.textContent = tr('图内自定义|Customize plot');
    draftStatus();
    update();
    repaint();
  });
  window.addEventListener('blur', () => {
    finishNudge();
    cancelDrag();
  });
  window.addEventListener('space:layout', () => {
    if (!panel.hidden) placePanel();
    else syncRailShell();
    syncLaunchers();
  });
  window.addEventListener('resize', () => {
    finishNudge();
    cancelDrag();
    if (!panel.hidden) {
      placePanel();
      if (form.contains(document.activeElement)) revealField(document.activeElement);
    } else syncRailShell();
  });
  if (typeof schedule === 'function') schedule();
  else window.dispatchEvent(new Event('space:layout'));
})();
