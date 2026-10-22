/** A local-ground construction lesson. Geometry shares the current observer and clock. */
(() => {
  if (!['diagrams', 'lab'].includes(document.body.dataset.page) || !uiWorkspace) return;
  const strings = {
    title: ['搭建自己的实验', 'Build your experiment'],
    intro: [
      '从空白地面开始，选择杆、球或参考圈，再点击地面放置。已保存的方案会恢复；“示例”需手动选择。',
      'Start with empty ground. Choose a rod, sphere or circle, then click to place it. Saved scenes are restored; examples load only when chosen.',
    ],
    observe: ['观察', 'Observe'],
    edit: ['搭建', 'Build'],
    rod: ['杆', 'Rod'],
    circle: ['参考圈', 'Circle'],
    marker: ['标记点', 'Marker'],
    add: ['添加物体', 'Add objects'],
    count: ['杆的数量', 'Number of rods'],
    objects: ['场景物体', 'Scene objects'],
    props: ['物体属性', 'Object properties'],
    name: ['名称', 'Name'],
    x: ['东西位置 / m', 'East–west / m'],
    z: ['南北位置 / m', 'North–south / m'],
    height: ['高度 / m', 'Height / m'],
    radius: ['半径 / m', 'Radius / m'],
    plane: ['所在平面', 'Plane'],
    ground: ['水平地面', 'Ground'],
    vertical: ['竖直平面', 'Vertical'],
    lock: ['锁定位置', 'Lock position'],
    copy: ['复制', 'Duplicate'],
    remove: ['删除', 'Delete'],
    undo: ['撤销', 'Undo'],
    redo: ['重做', 'Redo'],
    save: ['保存地面方案', 'Save ground scene'],
    reset: ['清空地面', 'Clear ground'],
    saved: ['已保存到此设备', 'Saved to this device'],
    preview: ['预览中 · 松手应用，Esc 取消', 'Preview · release to apply, Escape to cancel'],
    dirty: ['本次访问的草稿 · 方案有未保存的修改', 'Session draft · Scene has unsaved changes'],
    memory: [
      '浏览器无法保存，仅本次访问有效。',
      'Browser storage is unavailable; this scene lasts for this visit.',
    ],
    invalid: ['已忽略不兼容的保存方案。', 'An incompatible saved scene was ignored.'],
    limit: ['最多放置 32 个物体。', 'A scene supports up to 32 objects.'],
    snap: ['吸附到 0.25 m 网格', 'Snap to a 0.25 m grid'],
    labels: ['显示名称', 'Show names'],
    placing: [
      '点击地面放置；Enter 放在中央，Esc 取消。',
      'Click the ground to place; Enter places at the center, Esc cancels.',
    ],
    hintEdit: [
      '点击物体选中，拖动底座移动；空白处取消选择。',
      'Select an object, then drag its base to move. Click empty ground to deselect.',
    ],
    hintObserve: [
      '拖动画面改变方向；选择“搭建”编辑物体。',
      'Drag to orbit the view; choose Build to edit objects.',
    ],
    selected: ['已选中', 'Selected'],
    none: ['选择物体以调整属性。', 'Select an object to edit its properties.'],
    night: [
      '光源在地平线下方，不绘制直射影子。',
      'The light source is below the horizon; no direct ground shadow.',
    ],
    shadow: ['影长', 'Shadow length'],
    outside: ['超出地面范围', 'Beyond the ground'],
    sun: ['太阳', 'Sun'],
    moon: ['月球', 'Moon'],
    alt: ['高度', 'Altitude'],
    north: ['北', 'N'],
    east: ['东', 'E'],
    south: ['南', 'S'],
    west: ['西', 'W'],
    scale: ['地面 12 × 12 m · 杆竖直', 'Ground 12 × 12 m · Upright rods'],
    model: [
      '参考圈与标记不遮光；不模拟物体之间的遮挡。',
      'Circles and markers are references; mutual object occlusion is not modeled.',
    ],
    locked: ['位置已锁定', 'Position locked'],
    empty: ['还没有物体，从上方添加一个。', 'No objects yet. Add one above.'],
    paused: ['调整物体时已暂停播放。', 'Playback paused while editing.'],
    canvas: [
      '实验地面。搭建模式下用方向键移动所选物体，Delete 删除；观察模式用左右键旋转。',
      'Experiment ground. In Build, arrows move the selected object and Delete removes it. In Observe, Left/Right rotates the view.',
    ],
    savedScene: ['当前方案', 'Current scene'],
    preset: ['示例', 'Examples'],
    pair: ['双杆测影', 'Two rods'],
    ring: ['圆周四杆', 'Four rods on a circle'],
    emptyScene: ['空白地面', 'Empty ground'],
  };
  Object.assign(strings, {
    sphere: ['球', 'Sphere'],
    planeObject: ['参考平面', 'Plane'],
    dial: ['角度刻度盘', 'Angle dial'],
    observer: ['观察站', 'Station'],
    note: ['文字说明', 'Text note'],
    elevation: ['离地高度 / m', 'Base elevation / m'],
    width: ['宽度 / m', 'Width / m'],
    depth: ['深度 / m', 'Depth / m'],
    tilt: ['倾斜角 / °', 'Tilt / °'],
    azimuth: ['倾斜朝向 / °', 'Tilt bearing / °'],
    lat: ['观察纬度 / °', 'Station latitude / °'],
    lon: ['观察经度 / °', 'Station longitude / °'],
    heading: ['观察朝向 / °', 'Station heading / °'],
    upright: ['保持竖直', 'Keep upright'],
    grounded: ['贴合地面', 'Attach to ground'],
    arrange: ['排列所选物体', 'Arrange selected objects'],
    circleArrange: ['沿参考圈排列', 'Arrange on circle'],
    spaceArrange: ['等距排列', 'Even spacing'],
    alignEast: ['东西对齐', 'Align east–west'],
    alignNorth: ['南北对齐', 'Align north–south'],
    arrangeHint: [
      '勾选多个物体；未多选时排列所有杆。',
      'Select multiple objects; otherwise arrange all rods.',
    ],
    measure: ['测量与记录', 'Measure and record'],
    distance: ['两点距离', 'Distance'],
    angleMeasure: ['三点夹角', 'Angle'],
    bearingMeasure: ['两点方向', 'Bearing'],
    shadowMeasure: ['固定影长读数', 'Pin shadow length'],
    trace: ['记录一天影尖', 'Record daily shadow tips'],
    motion: ['记录拖动轨迹', 'Record movement'],
    event: ['记录当前时刻', 'Record current time'],
    record: ['个人记录', 'Personal records'],
    compare: ['对照实验', 'Comparison'],
    createCompare: ['冻结为对照 A', 'Freeze as reference A'],
    dropCompare: ['关闭对照', 'Close comparison'],
    switchCompare: ['切换 A / B', 'Switch A / B'],
    compareHelp: [
      'A 保留创建时的物体与观测条件；B 随当前参数变化。',
      'A keeps its objects and conditions; B follows the current experiment.',
    ],
    compareA: ['对照 A（冻结条件）', 'Reference A (frozen)'],
    compareB: ['当前 B', 'Current B'],
    needTwo: ['请先勾选两个物体。', 'Select two objects first.'],
    needThree: [
      '请先勾选三个物体，第一个作为顶点。',
      'Select three objects; the first is the vertex.',
    ],
    needRod: ['请先选择一根杆。', 'Select a rod first.'],
    selectMany: ['加入多选', 'Add to selection'],
    riseRecord: ['记录日出 / 月出', 'Record rise'],
    noonRecord: ['记录最高时刻', 'Record culmination'],
    setRecord: ['记录日落 / 月落', 'Record set'],
    inclined: ['倾斜平面', 'Inclined plane'],
    noEvent: ['当天没有此升落事件。', 'This event does not occur today.'],
    stationNote: [
      '观察站读数按其经纬度计算；地面图中的位置仅用于摆放。',
      'Station readings use its coordinates; its ground position is illustrative.',
    ],
    clearRecords: ['清除测量与轨迹', 'Clear measurements and trails'],
  });
  strings.restored = [
    '已恢复此设备保存的方案。可在“示例”中选择“空白地面”重新开始，或点选物体后删除。',
    'Restored this device’s saved scene. Choose Empty ground under Examples to start over, or select an object and delete it.',
  ];
  strings.hintEdit = [
    '点击物体选中，拖动底座移动；拖动空白处旋转，滚轮缩放。',
    'Select an object and drag its base; drag empty ground to orbit and use the wheel to zoom.',
  ];
  strings.invalidReference = [
    '对照条件无效，已保留物体并移除该对照。',
    'Invalid reference conditions; objects were kept and the reference removed.',
  ];
  strings.count = ['一次添加数量', 'Objects per placement'];
  strings.model = [
    '杆与球按当前方向投影；圈、平面、刻度盘为参照，不模拟物体互相遮挡。',
    'Rods and spheres cast geometric shadows; circles, planes and dials are references. Mutual occlusion is not modeled.',
  ];
  const en = () => document.documentElement.lang === 'en';
  const t = (k) => strings[k][en() ? 1 : 0];
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const node = (tag, cls, parent) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.append(n);
    return n;
  };
  const panel = node('section', 'scene-builder sb-surface', uiWorkspace.plot);
  panel.id = 'sceneBuilderPanel';
  panel.dataset.i18nSkip = '';
  panel.hidden = true;
  const bar = node('div', 'sb-toolbar', panel),
    modes = node('div', 'sb-modes', bar);
  const button = (parent, key, fn) => {
    const n = node('button', '', parent);
    n.type = 'button';
    n.dataset.sbText = key;
    n.onclick = fn;
    return n;
  };
  let editing = true,
    pending = null,
    selected = null,
    yaw = -0.55,
    zoom = 1,
    view = null,
    gesture = null,
    ghost = null,
    language = '',
    body = '',
    active = false;
  let data,
    undo = [],
    redo = [],
    saved = '',
    statusKey = '',
    seq = 0,
    selectedMany = new Set(),
    reference = null,
    paintingReference = false,
    paintTarget = null;
  const buckets = new Map();
  modes.hidden = true;
  const observe = button(modes, 'observe', () => setMode(false)),
    build = button(modes, 'edit', () => {
      setMode(true);
      if (matchMedia('(max-width:760px)').matches)
        document.getElementById('uiParametersButton')?.click();
    });
  const actions = node('div', 'sb-actions', bar);
  const undoButton = button(actions, 'undo', () => travel(undo, redo)),
    redoButton = button(actions, 'redo', () => travel(redo, undo));
  const saveButton = button(actions, 'save', save);
  const canvas = node('canvas', 'sb-canvas', panel);
  canvas.id = 'builderGround';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'group');
  const referenceCanvas = node('canvas', 'sb-reference-canvas', panel);
  referenceCanvas.setAttribute('aria-hidden', 'true');
  referenceCanvas.hidden = true;
  const compareLabel = node('div', 'sb-compare-label', panel);
  compareLabel.hidden = true;
  const hud = node('div', 'sb-hud', panel),
    lightText = node('span', '', hud),
    scaleText = node('span', '', hud);
  scaleText.dataset.sbText = 'scale';
  const footer = node('div', 'sb-footer', panel),
    hint = node('span', '', footer),
    shadowText = node('span', 'sb-shadow', footer);
  const mobileProps = button(footer, 'props', () =>
    document.getElementById('uiParametersButton')?.click(),
  );
  mobileProps.className = 'sb-mobile-props';
  const rail = node('div', 'scene-builder sb-controls', uiWorkspace.rail);
  rail.dataset.i18nSkip = '';
  const grip = uiWorkspace.rail.querySelector('.motion-menu-grip');
  if (grip) grip.after(rail);
  else uiWorkspace.rail.prepend(rail);
  const conditions = node('button', 'sb-native-conditions', rail);
  conditions.hidden = true;
  conditions.type = 'button';
  conditions.dataset.i18nSkip = '';
  conditions.onclick = () => {
    document.querySelector('[data-rail-section=conditions]')?.click();
    const target = document.getElementById('controls');
    if (target)
      uiWorkspace.rail.scrollTop +=
        target.getBoundingClientRect().top - uiWorkspace.rail.getBoundingClientRect().top - 8;
  };
  const heading = node('h2', '', rail);
  heading.dataset.sbText = 'title';
  const intro = node('p', 'sb-intro', rail);
  intro.dataset.sbText = 'intro';
  const restoredNote = node('p', 'sb-intro', rail);
  restoredNote.hidden = true;
  const addHead = node('button', 'sb-add-toggle', rail);
  addHead.type = 'button';
  addHead.dataset.sbText = 'add';
  const tools = node('div', 'sb-add', rail);
  tools.hidden = true;
  addHead.onclick = () => {
    tools.hidden = !tools.hidden;
    addHead.setAttribute('aria-expanded', String(!tools.hidden));
  };
  addHead.setAttribute('aria-expanded', 'false');
  const placementActions = node('div', 'sb-placement-actions', rail),
    placeCenter = node('button', '', placementActions),
    cancelPlace = node('button', '', placementActions);
  placeCenter.type = cancelPlace.type = 'button';
  placeCenter.onclick = () => {
    if (pending) place(pending, { x: 0, z: 0 });
  };
  cancelPlace.onclick = () => {
    pending = null;
    update();
  };
  const addButtons = {};
  for (const kind of [
    'rod',
    'sphere',
    'circle',
    'planeObject',
    'dial',
    'observer',
    'marker',
    'note',
  ])
    addButtons[kind] = button(tools, kind, () => {
      setMode(true);
      pending = kind;
      selected = null;
      selectedMany.clear();
      update();
      const drawer = document.getElementById('uiParameterDrawer');
      if (drawer?.open) drawer.close();
      canvas.focus({ preventScroll: true });
    });
  for (const [kind, button] of Object.entries(addButtons)) button.dataset.objectKind = kind;
  const countWrap = node('label', 'sb-inline', rail);
  const countLabel = node('span', '', countWrap);
  countLabel.dataset.sbText = 'count';
  const count = node('input', '', countWrap);
  count.type = 'number';
  count.min = 1;
  count.max = 8;
  count.value = 1;
  count.setAttribute('aria-label', 'Number of rods');
  count.dataset.builderField = '';
  const options = node('div', 'sb-options', rail);
  function check(key, initial, fn) {
    const label = node('label', '', options),
      input = node('input', '', label);
    input.type = 'checkbox';
    input.checked = initial;
    input.dataset.builderField = '';
    input.onchange = () => fn(input.checked);
    const span = node('span', '', label);
    span.dataset.sbText = key;
    return input;
  }
  const snap = check('snap', true, () => {}),
    labels = check('labels', true, (v) =>
      change(() => {
        data.labels = v;
      }),
    );
  const listHead = node('h3', '', rail);
  listHead.dataset.sbText = 'objects';
  const list = node('div', 'sb-object-list', rail);
  list.setAttribute('role', 'group');
  const props = node('section', 'sb-properties', rail),
    propHead = node('h3', '', props);
  propHead.dataset.sbText = 'props';
  const noSelection = node('p', 'sb-intro', props);
  noSelection.dataset.sbText = 'none';
  const fields = node('div', 'sb-fields', props),
    inputs = {};
  for (const key of [
    'name',
    'x',
    'z',
    'elevation',
    'height',
    'radius',
    'width',
    'depth',
    'tilt',
    'azimuth',
    'plane',
    'lat',
    'lon',
    'heading',
  ]) {
    const label = node('label', '', fields),
      span = node('span', '', label);
    span.dataset.sbText = key;
    const input = node(key === 'plane' ? 'select' : 'input', '', label);
    input.dataset.builderField = '';
    input.dataset.field = key;
    inputs[key] = input;
    if (key === 'plane') {
      for (const k of ['ground', 'vertical', 'inclined']) {
        const option = node('option', '', input);
        option.value = k;
        option.dataset.sbText = k;
      }
    } else if (key === 'name') {
      input.type = 'text';
      input.maxLength = 32;
    } else {
      input.type = 'number';
      const ranges = {
        x: [-5, 5],
        z: [-5, 5],
        elevation: [0, 4],
        height: [0.25, 4],
        radius: [0.25, 4],
        width: [0.5, 8],
        depth: [0.5, 8],
        tilt: [0, 89],
        azimuth: [0, 360],
        lat: [-90, 90],
        lon: [-180, 180],
        heading: [0, 360],
      };
      [input.min, input.max] = ranges[key];
      input.step = ['x', 'z', 'elevation', 'height', 'radius', 'width', 'depth'].includes(key)
        ? 0.25
        : 0.1;
    }
    input.onchange = () => {
      const o = current();
      if (!o) return;
      let value = input.value;
      if (!['name', 'plane'].includes(key)) {
        value = Number(value);
        if (!Number.isFinite(value)) {
          update();
          return;
        }
        value = Math.max(+input.min, Math.min(+input.max, value));
      }
      change(() => {
        o[key] = value;
        if (key === 'name') o.autoName = false;
      });
    };
    if (input.type === 'number')
      SkyParameterControls.attach(input, {
        save,
        undo: (forward) => travel(forward ? redo : undo, forward ? undo : redo),
        label: () => t(key),
        min: +input.min,
        max: +input.max,
        step: +input.step,
        read: () => data?.objects.find((o) => o.id === selected)?.[key] ?? +input.min,
        begin() {
          stop();
          return clone(data);
        },
        preview(value) {
          if (current()) current()[key] = value;
          input.value = value;
          draw();
          status.textContent = t('preview');
        },
        commit(before) {
          record(before);
          update();
        },
        cancel(before) {
          data = clone(before);
          update();
        },
      });
  }
  const uprightLabel = node('label', 'sb-lock', props),
    upright = node('input', '', uprightLabel);
  upright.type = 'checkbox';
  upright.dataset.builderField = '';
  const uprightText = node('span', '', uprightLabel);
  uprightText.dataset.sbText = 'upright';
  upright.onchange = () =>
    change(() => {
      const o = current();
      if (o) {
        o.upright = upright.checked;
        if (o.upright) o.tilt = 0;
      }
    });
  const groundedLabel = node('label', 'sb-lock', props),
    grounded = node('input', '', groundedLabel);
  grounded.type = 'checkbox';
  grounded.dataset.builderField = '';
  const groundedText = node('span', '', groundedLabel);
  groundedText.dataset.sbText = 'grounded';
  grounded.onchange = () =>
    change(() => {
      const o = current();
      if (o) {
        o.grounded = grounded.checked;
        if (o.grounded) o.elevation = 0;
      }
    });
  const lockLabel = node('label', 'sb-lock', props),
    locked = node('input', '', lockLabel);
  locked.type = 'checkbox';
  locked.dataset.builderField = '';
  const lockText = node('span', '', lockLabel);
  lockText.dataset.sbText = 'lock';
  locked.onchange = () =>
    change(() => {
      if (current()) current().locked = locked.checked;
    });
  const propActions = node('div', 'sb-property-actions', props);
  propActions.hidden = true;
  const copyAction = button(propActions, 'copy', duplicate),
    removeAction = button(propActions, 'remove', remove);
  const objectMenu = node('div', 'sb-object-menu', rail);
  objectMenu.id = 'builder-object-menu';
  objectMenu.setAttribute('popover', 'auto');
  objectMenu.setAttribute('role', 'menu');
  const saveObject = button(objectMenu, 'save', save);
  objectMenu.append(copyAction, removeAction);
  for (const b of objectMenu.children) {
    b.setAttribute('role', 'menuitem');
    b.onclick = ((fn) => () => {
      objectMenu.hidePopover();
      fn();
    })(b.onclick);
  }
  objectMenu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      objectMenu.hidePopover();
      [...list.querySelectorAll('[data-object-id]')]
        .find((n) => n.dataset.objectId === selected)
        ?.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const buttons = [...objectMenu.querySelectorAll('button:not(:disabled)')],
      i = buttons.indexOf(document.activeElement);
    buttons[
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? buttons.length - 1
          : (i + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    ]?.focus();
  });
  const arrangementGroup = node('details', 'sb-tool-section', rail),
    arrangementTitle = node('summary', '', arrangementGroup);
  arrangementTitle.dataset.sbText = 'arrange';
  const arrangement = node('div', 'sb-tool-grid', arrangementGroup);
  for (const [key, mode] of [
    ['circleArrange', 'circle'],
    ['spaceArrange', 'space'],
    ['alignEast', 'east'],
    ['alignNorth', 'north'],
  ])
    button(arrangement, key, () => arrangeObjects(mode));
  const arrangementHint = node('p', 'sb-intro', arrangementGroup);
  arrangementHint.dataset.sbText = 'arrangeHint';
  const measureGroup = node('details', 'sb-tool-section', rail),
    measureTitle = node('summary', '', measureGroup);
  measureTitle.dataset.sbText = 'measure';
  const measuring = node('div', 'sb-tool-grid', measureGroup);
  for (const kind of ['distance', 'angleMeasure', 'bearingMeasure', 'shadowMeasure'])
    button(measuring, kind, () => addMeasurement(kind));
  button(measuring, 'trace', recordShadow);
  button(measuring, 'event', () => recordEvent('now'));
  for (const [key, event] of [
    ['riseRecord', 'rise'],
    ['noonRecord', 'peak'],
    ['setRecord', 'set'],
  ])
    button(measuring, key, () => recordEvent(event));
  const comparisonMobile = button(footer, 'switchCompare', () => {
    panel.dataset.referenceView =
      panel.dataset.referenceView === 'reference' ? 'current' : 'reference';
    resize();
  });
  comparisonMobile.className = 'sb-mobile-compare';
  const motionInput = check('motion', false, (v) => change(() => (data.recordMotion = v)));
  const recordList = node('div', 'sb-records', measureGroup);
  button(measuring, 'clearRecords', () =>
    change(() => {
      data.measurements = [];
      data.trails = [];
      data.notes = [];
    }),
  );
  const compareGroup = node('details', 'sb-tool-section', rail),
    compareTitle = node('summary', '', compareGroup);
  compareTitle.dataset.sbText = 'compare';
  const comparisonTools = node('div', 'sb-tool-grid', compareGroup);
  button(comparisonTools, 'createCompare', () =>
    change(() => {
      const snapshot = clone(data);
      delete snapshot.reference;
      data.reference = {
        scene: snapshot,
        condition: {
          body: state.body,
          date: state.date,
          time: state.time,
          lat: state.lat,
          lon: state.lon,
          manual: state.manual,
          dec: state.dec,
        },
      };
    }),
  );
  button(comparisonTools, 'dropCompare', () =>
    change(() => {
      delete data.reference;
      panel.dataset.referenceView = 'current';
    }),
  );
  const compareSwitch = button(comparisonTools, 'switchCompare', () => {
    panel.dataset.referenceView =
      panel.dataset.referenceView === 'reference' ? 'current' : 'reference';
    resize();
  });
  const compareHelp = node('p', 'sb-intro', compareGroup);
  compareHelp.dataset.sbText = 'compareHelp';
  const examples = node('details', 'sb-examples', rail),
    summary = node('summary', '', examples);
  summary.dataset.sbText = 'preset';
  const exampleActions = node('div', '', examples);
  for (const key of ['pair', 'ring', 'emptyScene'])
    button(exampleActions, key, () =>
      change(() => {
        data = example(key);
        selected = null;
        pending = null;
      }),
    );
  const note = node('p', 'sb-model-note', rail);
  note.dataset.sbText = 'model';
  const status = node('p', 'sb-status', rail);
  status.setAttribute('role', 'status');
  const key = () => `skymotion-scene-builder-v1-${state.body}`;
  const current = () => data.objects.find((o) => o.id === selected);
  const name = (o) => (o.autoName ? `${t(o.kind)} ${o.number}` : o.name);
  const make = (kind, x, z) => ({
    id: `o${Date.now().toString(36)}${++seq}`,
    number: seq,
    kind,
    x,
    z,
    height: 1.5,
    radius: kind === 'sphere' ? 0.6 : 2,
    plane: 'ground',
    elevation: 0,
    width: 3,
    depth: 2,
    tilt: 0,
    azimuth: 0,
    upright: true,
    grounded: true,
    lat: state.lat,
    lon: state.lon,
    heading: 0,
    name: '',
    autoName: true,
    locked: false,
  });
  function example(which = 'emptyScene') {
    if (which === 'emptyScene') return { version: 1, labels: true, objects: [] };
    const circle = make('circle', 0, 0);
    circle.radius = 2.5;
    const rods =
      which === 'ring'
        ? Array.from({ length: 4 }, (_, i) =>
            make('rod', 2.5 * Math.cos((i * Math.PI) / 2), 2.5 * Math.sin((i * Math.PI) / 2)),
          )
        : [make('rod', -1.8, 0), make('rod', 1.3, 0.8)];
    if (which !== 'ring') rods[1].height = 2.5;
    return { version: 1, labels: true, objects: [circle, ...rods, make('marker', 0, -2.5)] };
  }
  function measurementObjects(measurement, objects) {
    const count = { distance: 2, bearingMeasure: 2, angleMeasure: 3, shadowMeasure: 1 }[
      measurement?.kind
    ];
    if (
      !count ||
      !Array.isArray(measurement.ids) ||
      measurement.ids.length !== count ||
      new Set(measurement.ids).size !== count
    )
      return null;
    const selected = measurement.ids.map((id) => objects.find((o) => o.id === id));
    if (selected.some((o) => !o)) return null;
    if (measurement.kind === 'shadowMeasure' && selected[0].kind !== 'rod') return null;
    return selected;
  }
  function sanitize(raw) {
    if (!raw || raw.version !== 1 || !Array.isArray(raw.objects) || raw.objects.length > 32)
      return null;
    const result = { version: 1, labels: raw.labels !== false, objects: [] };
    const ids = new Set();
    for (const o of raw.objects) {
      if (
        !o ||
        !['rod', 'sphere', 'circle', 'planeObject', 'dial', 'observer', 'marker', 'note'].includes(
          o.kind,
        ) ||
        typeof o.id !== 'string' ||
        ids.has(o.id)
      )
        return null;
      ids.add(o.id);
      const v = make(o.kind, 0, 0);
      v.id = o.id;
      v.number = Number.isInteger(o.number) ? Math.max(1, Math.min(999, o.number)) : v.number;
      for (const [k, min, max] of [
        ['x', -5, 5],
        ['z', -5, 5],
        ['height', 0.25, 4],
        ['radius', 0.25, 4],
      ]) {
        if (!Number.isFinite(o[k])) return null;
        v[k] = Math.max(min, Math.min(max, o[k]));
      }
      v.name = typeof o.name === 'string' ? o.name.slice(0, 32) : '';
      v.autoName = o.autoName !== false;
      v.locked = o.locked === true;
      v.plane = ['ground', 'vertical', 'inclined'].includes(o.plane) ? o.plane : 'ground';
      for (const [k, min, max] of [
        ['elevation', 0, 4],
        ['width', 0.5, 8],
        ['depth', 0.5, 8],
        ['tilt', 0, 89],
        ['azimuth', 0, 360],
        ['lat', -90, 90],
        ['lon', -180, 180],
        ['heading', 0, 360],
      ])
        if (Number.isFinite(o[k])) v[k] = Math.max(min, Math.min(max, o[k]));
      v.upright = o.upright !== false;
      v.grounded = o.grounded !== false;
      if (v.upright && v.kind === 'rod') v.tilt = 0;
      if (v.grounded) v.elevation = 0;
      result.objects.push(v);
    }
    result.recordMotion = raw.recordMotion === true;
    result.measurements = Array.isArray(raw.measurements)
      ? raw.measurements
          .filter((x) => measurementObjects(x, result.objects))
          .slice(0, 30)
          .map((x) => ({ kind: x.kind, ids: [...x.ids] }))
      : [];
    result.trails = Array.isArray(raw.trails)
      ? raw.trails
          .filter(
            (x) =>
              x &&
              Array.isArray(x.points) &&
              x.points.length <= 300 &&
              x.points.every((p) => p === null || (Number.isFinite(p.x) && Number.isFinite(p.z))),
          )
          .slice(0, 20)
      : [];
    result.notes = Array.isArray(raw.notes)
      ? raw.notes.filter((x) => x && typeof x.text === 'string').slice(0, 50)
      : [];
    if (
      raw.reference?.scene &&
      typeof raw.reference.scene === 'object' &&
      !raw.reference.scene.reference
    ) {
      const scene = sanitize(raw.reference.scene),
        c = raw.reference.condition,
        condition = cleanCondition(c);
      if (scene && condition) result.reference = { scene, condition };
    }
    return result;
  }
  function cleanCondition(c) {
    const S = window.SkyMotionSession;
    if (
      !c ||
      !['sun', 'moon'].includes(c.body) ||
      !S.validDate(c.date) ||
      !S.inRange(c.time, 0, 1440) ||
      !S.inRange(c.lat, -90, 90) ||
      !S.inRange(c.lon, -180, 180) ||
      (c.manual !== undefined && typeof c.manual !== 'boolean') ||
      (c.manual === true && !S.inRange(c.dec, -23.44, 23.44))
    )
      return null;
    return {
      body: c.body,
      date: c.date,
      time: c.time,
      lat: c.lat,
      lon: c.lon,
      manual: c.manual === true,
      dec: S.inRange(c.dec, -23.44, 23.44) ? c.dec : 0,
    };
  }
  function selectBody() {
    if (body) buckets.set(body, { data, undo, redo, saved, selected, statusKey });
    body = state.body;
    const bucket = buckets.get(body);
    if (bucket) ({ data, undo, redo, saved, selected, statusKey } = bucket);
    else {
      data = example();
      undo = [];
      redo = [];
      selected = null;
      statusKey = '';
      let raw = null;
      try {
        raw = localStorage.getItem(key());
      } catch {
        statusKey = 'memory';
      }
      if (raw) {
        try {
          const parsed = JSON.parse(raw),
            clean = sanitize(parsed);
          if (clean) {
            data = clean;
            statusKey = 'restored';
            if (parsed.reference && !clean.reference) statusKey = 'invalidReference';
            seq = Math.max(seq, ...data.objects.map((o) => o.number));
          } else statusKey = 'invalid';
        } catch {
          statusKey = 'invalid';
        }
      }
      saved = JSON.stringify(data);
    }
    pending = null;
    selectedMany.clear();
    labels.checked = data.labels;
    update();
  }
  function message(k) {
    statusKey = k;
    updateStatus();
  }
  function updateStatus() {
    restoredNote.hidden = statusKey !== 'restored';
    restoredNote.textContent = t('restored');
    status.textContent = statusKey
      ? t(statusKey)
      : JSON.stringify(data) !== saved
        ? t('dirty')
        : t('savedScene');
  }
  function record(before) {
    if (JSON.stringify(before) === JSON.stringify(data)) return;
    undo.push(before);
    if (undo.length > 30) undo.shift();
    redo = [];
    if (statusKey !== 'memory') statusKey = '';
  }
  function change(fn) {
    stop();
    const before = clone(data);
    fn();
    record(before);
    update();
  }
  function travel(from, to) {
    cancelGesture();
    if (!from.length) return;
    stop();
    to.push(clone(data));
    data = from.pop();
    if (!current()) selected = null;
    pending = null;
    selectedMany.clear();
    statusKey = '';
    update();
  }
  function save() {
    cancelGesture();
    try {
      localStorage.setItem(key(), JSON.stringify(data));
      saved = JSON.stringify(data);
      message('saved');
    } catch {
      message('memory');
    }
  }
  function setMode(value) {
    cancelGesture();
    editing = value;
    pending = null;
    if (editing) stop();
    update();
  }
  function remove() {
    if (!current() && !selectedMany.size) return;
    change(() => {
      const ids = selectedMany.size ? selectedMany : new Set([selected]);
      data.objects = data.objects.filter((o) => !ids.has(o.id));
      selected = null;
      selectedMany.clear();
    });
  }
  function duplicate() {
    const o = current();
    if (!o) return;
    if (data.objects.length >= 32) {
      message('limit');
      return;
    }
    change(() => {
      const copy = {
        ...clone(o),
        id: make(o.kind, 0, 0).id,
        number: seq,
        x: Math.min(5, o.x + 0.5),
        z: Math.min(5, o.z + 0.5),
        locked: false,
      };
      data.objects.push(copy);
      selected = copy.id;
    });
  }
  function place(kind, p) {
    const n = Math.max(1, Math.min(8, Math.round(+count.value) || 1));
    if (data.objects.length + n > 32) {
      message('limit');
      return;
    }
    change(() => {
      for (let i = 0; i < n; i++) {
        const a = (i * 2 * Math.PI) / n,
          r = n > 1 ? 1.5 : 0;
        const o = make(
          kind,
          Math.max(-5, Math.min(5, p.x + Math.cos(a) * r)),
          Math.max(-5, Math.min(5, p.z + Math.sin(a) * r)),
        );
        data.objects.push(o);
        selected = o.id;
      }
      selectedMany = new Set([selected]);
      pending = null;
      ghost = null;
    });
  }
  const topOf = (o) => {
    const t = (o.kind === 'rod' ? o.tilt : 0) * rad,
      a = o.azimuth * rad;
    return {
      x: o.x + o.height * Math.sin(t) * Math.sin(a),
      z: o.z + o.height * Math.sin(t) * Math.cos(a),
      h: o.elevation + o.height * Math.cos(t),
    };
  };
  const lightAt = (c) =>
    c.manual && c.body === 'sun'
      ? solar(c.lat, c.dec, c.time)
      : skyRaw(c.body === 'moon' ? 'Moon' : 'Sun', c.time, c.date, c.lat, c.lon);
  function ringPosition(o, a) {
    const tilt = o.plane === 'vertical' ? Math.PI / 2 : o.plane === 'inclined' ? o.tilt * rad : 0,
      az = o.azimuth * rad,
      x = o.radius * Math.cos(a),
      z = o.radius * Math.sin(a) * Math.cos(tilt);
    return {
      x: o.x + x * Math.cos(az) - z * Math.sin(az),
      z: o.z + x * Math.sin(az) + z * Math.cos(az),
      h: o.elevation + o.radius * Math.sin(tilt) * (1 + Math.sin(a)),
    };
  }
  function group() {
    const selectedObjects = data.objects.filter((o) => selectedMany.has(o.id) && !o.locked);
    return selectedObjects.length > 1
      ? selectedObjects
      : data.objects.filter((o) => o.kind === 'rod' && !o.locked);
  }
  function arrangeObjects(mode) {
    const objects = group();
    if (objects.length < 2) {
      message('needTwo');
      return;
    }
    change(() => {
      const circle = data.objects.find((o) => o.kind === 'circle' && o.plane === 'ground'),
        cx = circle?.x || 0,
        cz = circle?.z || 0,
        r = Math.min(circle?.radius || 2.5, 5 - Math.abs(cx), 5 - Math.abs(cz));
      objects.forEach((o, i) => {
        if (mode === 'circle') {
          o.x = cx + r * Math.cos((i * 2 * Math.PI) / objects.length);
          o.z = cz + r * Math.sin((i * 2 * Math.PI) / objects.length);
        } else if (mode === 'space') {
          o.x = -3 + (6 * i) / (objects.length - 1);
          o.z = cz;
        } else if (mode === 'east') o.z = objects[0].z;
        else o.x = objects[0].x;
      });
    });
  }
  function addMeasurement(kind) {
    const ids = [...selectedMany];
    if (kind === 'shadowMeasure') {
      if (current()?.kind !== 'rod') {
        message('needRod');
        return;
      }
      ids.splice(0, ids.length, current().id);
    } else if (ids.length < (kind === 'angleMeasure' ? 3 : 2)) {
      message(kind === 'angleMeasure' ? 'needThree' : 'needTwo');
      return;
    }
    change(() => {
      (data.measurements ??= []).push({
        kind,
        ids: ids.slice(0, kind === 'angleMeasure' ? 3 : kind === 'shadowMeasure' ? 1 : 2),
      });
    });
  }
  function recordShadow() {
    const o = current();
    if (o?.kind !== 'rod') {
      message('needRod');
      return;
    }
    change(() => {
      const points = [],
        top = topOf(o);
      for (let time = 0; time <= 1440; time += 10) {
        const q =
          state.manual && state.body === 'sun'
            ? solar(state.lat, state.dec, time)
            : skyRaw(
                state.body === 'moon' ? 'Moon' : 'Sun',
                time,
                state.date,
                state.lat,
                state.lon,
              );
        points.push(
          q.y > 1e-6
            ? { x: top.x - (top.h * q.x) / q.y, z: top.z - (top.h * q.z) / q.y, time }
            : null,
        );
      }
      (data.trails ??= []).push({
        label: name(o) + ' · ' + state.date,
        points: points.slice(0, 300),
      });
      if (data.trails.length > 20) data.trails.shift();
    });
  }
  function recordEvent(kind) {
    const day = kind === 'now' ? null : bodyDay();
    let time = kind === 'now' ? state.time : day?.[kind];
    if (time && typeof time === 'object') time = time.time;
    if (!Number.isFinite(time)) {
      message('noEvent');
      return;
    }
    change(() => {
      const text = `${state.date} ${hhmm(time, true)} · ${t(kind === 'now' ? 'event' : kind === 'rise' ? 'riseRecord' : kind === 'set' ? 'setRecord' : 'noonRecord')}`;
      (data.notes ??= []).push({ text, time, date: state.date });
    });
  }
  function shadowEnds(o, q) {
    const top = topOf(o);
    return [
      { x: o.x - (o.elevation * q.x) / q.y, z: o.z - (o.elevation * q.z) / q.y },
      { x: top.x - (top.h * q.x) / q.y, z: top.z - (top.h * q.z) / q.y },
    ];
  }
  function shadowLength(o, q) {
    const [a, b] = shadowEnds(o, q);
    return Math.hypot(b.x - a.x, b.z - a.z);
  }
  function measurementValue(m, light) {
    const objects = measurementObjects(m, data.objects);
    if (!objects) return null;
    const [a, b, c] = objects;
    if (m.kind === 'shadowMeasure') {
      const top = topOf(a);
      return light.y > 1e-6
        ? {
            text: t('shadowMeasure') + ' ' + shadowLength(a, light).toFixed(2) + ' m',
            points: shadowEnds(a, light),
          }
        : null;
    }
    if (m.kind === 'angleMeasure') {
      const u = [b.x - a.x, b.z - a.z, b.elevation - a.elevation],
        v = [c.x - a.x, c.z - a.z, c.elevation - a.elevation],
        den = Math.hypot(...u) * Math.hypot(...v),
        value = den
          ? Math.acos(Math.max(-1, Math.min(1, u.reduce((n, x, i) => n + x * v[i], 0) / den))) / rad
          : null;
      return {
        text: t('angleMeasure') + ' ' + (value === null ? '—' : value.toFixed(2) + '°'),
        points: [b, a, c],
      };
    }
    return {
      text:
        m.kind === 'distance'
          ? t('distance') +
            ' ' +
            Math.hypot(b.x - a.x, b.z - a.z, b.elevation - a.elevation).toFixed(2) +
            ' m'
          : t('bearingMeasure') +
            ' ' +
            ((Math.atan2(b.x - a.x, b.z - a.z) / rad + 360) % 360).toFixed(2) +
            '°',
      points: [a, b],
    };
  }
  function update() {
    if (!data) return;
    copyAction.disabled = data.objects.length >= 32;
    removeAction.disabled = !current();
    if (matchMedia('(max-width:760px)').matches) {
      if (placementActions.parentElement !== panel) panel.append(placementActions);
    } else if (placementActions.parentElement !== rail)
      rail.insertBefore(placementActions, countWrap);
    modes.hidden = true;
    editing = true;
    placeCenter.textContent = en() ? 'Place at the center' : '放在地面中央';
    cancelPlace.textContent = en() ? 'Cancel placement' : '取消放置';
    placementActions.hidden = !pending;
    addHead.setAttribute('aria-expanded', String(!tools.hidden));
    observe.setAttribute('aria-pressed', String(!editing));
    build.setAttribute('aria-pressed', String(editing));
    panel.dataset.editing = String(editing);
    canvas.setAttribute('aria-label', t('canvas'));
    count.setAttribute('aria-label', t('count'));
    for (const [kind, b] of Object.entries(addButtons))
      b.setAttribute('aria-pressed', String(pending === kind));
    undoButton.disabled = !undo.length;
    redoButton.disabled = !redo.length;
    reference = data.reference || null;
    panel.dataset.comparing = String(!!reference);
    referenceCanvas.hidden = !reference;
    compareLabel.hidden = !reference;
    compareLabel.textContent = t('compareA') + '  |  ' + t('compareB');
    compareSwitch.disabled = !reference;
    comparisonMobile.hidden = !reference;
    motionInput.checked = data.recordMotion === true;
    labels.checked = data.labels;
    const focusedObject = list.contains(document.activeElement)
      ? document.activeElement.dataset.objectId
      : null;
    list.replaceChildren();
    if (!data.objects.length) {
      const p = node('p', 'sb-intro', list);
      p.textContent = t('empty');
    }
    for (const o of data.objects) {
      const row = node('div', 'sb-object-row', list),
        b = node('button', 'sb-object', row);
      b.type = 'button';
      b.dataset.objectId = o.id;
      b.setAttribute('aria-pressed', String(selected === o.id));
      const symbol = node('span', 'sb-object-symbol', b);
      symbol.textContent =
        o.kind === 'rod'
          ? '│'
          : ['circle', 'sphere', 'dial'].includes(o.kind)
            ? '○'
            : o.kind === 'planeObject'
              ? '▱'
              : '·';
      symbol.setAttribute('aria-hidden', 'true');
      const text = node('span', '', b);
      text.textContent = name(o);
      const info = node('small', '', b);
      info.textContent = o.locked
        ? '◇'
        : o.kind === 'rod'
          ? `${o.height} m`
          : o.kind === 'circle'
            ? `r ${o.radius} m`
            : '';
      b.onclick = () => {
        selected = o.id;
        selectedMany = new Set([o.id]);
        pending = null;
        update();
      };
      const pick = node('input', 'sb-select-box', row);
      pick.type = 'checkbox';
      pick.checked = selectedMany.has(o.id);
      pick.setAttribute('aria-label', t('selectMany') + ' ' + name(o));
      pick.onchange = () => {
        pick.checked ? selectedMany.add(o.id) : selectedMany.delete(o.id);
        selected = o.id;
        update();
      };
      const more = node('button', 'sb-row-more', row);
      more.type = 'button';
      more.setAttribute('aria-haspopup', 'menu');
      more.setAttribute('aria-controls', objectMenu.id);
      more.setAttribute('aria-label', (en() ? 'More actions' : '更多操作') + ' · ' + name(o));
      more.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>';
      more.onclick = () => {
        const r = more.getBoundingClientRect();
        selected = o.id;
        selectedMany = new Set([o.id]);
        update();
        objectMenu.showPopover();
        objectMenu.style.left =
          Math.max(
            8,
            Math.min(innerWidth - objectMenu.offsetWidth - 8, r.right - objectMenu.offsetWidth),
          ) + 'px';
        objectMenu.style.top = Math.max(8, r.top - objectMenu.offsetHeight - 6) + 'px';
        objectMenu.querySelector('button')?.focus();
      };
    }
    if (focusedObject)
      [...list.querySelectorAll('.sb-object')]
        .find((b) => b.dataset.objectId === focusedObject)
        ?.focus({ preventScroll: true });
    const o = current();
    uprightLabel.hidden = !o || o.kind !== 'rod';
    groundedLabel.hidden = !o;
    mobileProps.hidden = !o;
    noSelection.hidden = !!o;
    props.hidden = !o;
    fields.hidden = lockLabel.hidden = !o;
    propActions.hidden = true;
    if (o) {
      for (const [k, input] of Object.entries(inputs)) {
        input.parentElement.hidden =
          (k === 'height' && o.kind !== 'rod') ||
          (k === 'radius' && !['circle', 'sphere', 'dial'].includes(o.kind)) ||
          (k === 'plane' && !['circle', 'planeObject'].includes(o.kind)) ||
          (['width', 'depth'].includes(k) && o.kind !== 'planeObject') ||
          (['tilt', 'azimuth'].includes(k) && !['rod', 'circle', 'planeObject'].includes(o.kind)) ||
          (['lat', 'lon', 'heading'].includes(k) && o.kind !== 'observer');
        if (document.activeElement !== input) input.value = k === 'name' ? name(o) : o[k];
        input.disabled =
          (o.locked && ['x', 'z'].includes(k)) ||
          (k === 'tilt' &&
            ((o.kind === 'rod' && o.upright) ||
              (['circle', 'planeObject'].includes(o.kind) && o.plane !== 'inclined'))) ||
          (k === 'elevation' && o.grounded);
        SkyParameterControls.sync(input);
      }
      locked.checked = o.locked;
      upright.checked = o.upright;
      grounded.checked = o.grounded;
    }
    recordList.replaceChildren();
    for (const note of data.notes || []) {
      const p = node('p', '', recordList);
      p.textContent = note.text;
    }
    for (const [i, m] of (data.measurements || []).entries()) {
      const value = measurementValue(m, bodyPosition());
      if (value) {
        const p = node('p', '', recordList);
        p.dataset.measureIndex = i;
        p.textContent = value.text;
      }
    }
    hint.textContent = t(pending ? 'placing' : editing ? 'hintEdit' : 'hintObserve');
    updateStatus();
    translate();
    resize();
  }
  function translate() {
    for (const root of [panel, rail])
      for (const n of root.querySelectorAll('[data-sb-text]')) n.textContent = t(n.dataset.sbText);
  }
  const colors = {
    background: getComputedStyle(uiWorkspace.plot).backgroundColor,
    ink: '#d7e2ed',
    muted: '#a3b5c9',
    line: 'rgba(164,190,209,.14)',
    rod: '#f2d7a3',
    circle: '#b4c6d4',
    selected: '#f5e5b9',
  };
  const project = (x, z, h = 0) => ({
    x: view.cx + (x * Math.cos(yaw) - z * Math.sin(yaw)) * view.scale,
    y:
      view.cy + (x * Math.sin(yaw) + z * Math.cos(yaw)) * view.scale * 0.48 - h * view.scale * 0.85,
  });
  function ground(p) {
    const u = (p.x - view.cx) / view.scale,
      v = (p.y - view.cy) / (view.scale * 0.48);
    return { x: u * Math.cos(yaw) + v * Math.sin(yaw), z: -u * Math.sin(yaw) + v * Math.cos(yaw) };
  }
  function local(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function position(e) {
    const p = ground(local(e));
    if (snap.checked) {
      p.x = Math.round(p.x * 4) / 4;
      p.z = Math.round(p.z * 4) / 4;
    }
    return { x: Math.max(-5, Math.min(5, p.x)), z: Math.max(-5, Math.min(5, p.z)) };
  }
  function hit(p) {
    let best = null,
      d = 28;
    for (const o of data.objects) {
      const base = project(o.x, o.z, o.elevation),
        end = o.kind === 'rod' ? topOf(o) : { x: o.x, z: o.z, h: o.elevation },
        tip = project(end.x, end.z, end.h);
      let distance = Math.hypot(p.x - base.x, p.y - base.y);
      if (o.kind === 'rod') {
        const vx = tip.x - base.x,
          vy = tip.y - base.y,
          k = Math.max(
            0,
            Math.min(1, ((p.x - base.x) * vx + (p.y - base.y) * vy) / (vx * vx + vy * vy || 1)),
          );
        distance = Math.min(distance, Math.hypot(p.x - base.x - k * vx, p.y - base.y - k * vy));
      }
      if (o.kind === 'circle') {
        let prev = null;
        for (let a = 0; a <= Math.PI * 2 + 0.15; a += 0.12) {
          const q = (() => {
            const p = ringPosition(o, a);
            return project(p.x, p.z, p.h);
          })();
          if (prev) {
            const vx = q.x - prev.x,
              vy = q.y - prev.y,
              k = Math.max(
                0,
                Math.min(1, ((p.x - prev.x) * vx + (p.y - prev.y) * vy) / (vx * vx + vy * vy || 1)),
              );
            distance = Math.min(distance, Math.hypot(p.x - prev.x - k * vx, p.y - prev.y - k * vy));
          }
          prev = q;
        }
      }
      if (distance < d) {
        best = o;
        d = distance;
      }
    }
    return best;
  }
  let drawing = false;
  function draw() {
    if (!active || !view || drawing) return;
    drawing = true;
    try {
      const target = paintTarget || canvas,
        c = target.getContext('2d'),
        { w, h } = view,
        dpr = view.dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      c.fillStyle = colors.background;
      c.fillRect(0, 0, w, h);
      const line = (a, b, color, width = 1) => {
        c.strokeStyle = color;
        c.lineWidth = width;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      };
      const write = (text, p, color = colors.ink, size = 12, align = 'center') => {
        c.font = `${size}px "${en() ? 'SkyMotion Charter' : 'SkyMotion Reading'}",serif`;
        c.fillStyle = color;
        c.textAlign = align;
        if (window.skyFillText) window.skyFillText(c, text, p.x, p.y);
        else c.fillText(text, p.x, p.y);
      };
      const corners = [
        [-6, -6],
        [6, -6],
        [6, 6],
        [-6, 6],
      ].map(([x, z]) => project(x, z));
      c.beginPath();
      corners.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
      c.closePath();
      c.fillStyle = '#223547';
      c.fill();
      c.save();
      c.clip();
      for (let i = -6; i <= 6; i++) {
        line(project(i, -6), project(i, 6), colors.line);
        line(project(-6, i), project(6, i), colors.line);
      }
      line(project(-6, 0), project(6, 0), '#a3b5c966');
      line(project(0, -6), project(0, 6), '#a3b5c966');
      const light = paintingReference ? lightAt(reference.condition) : bodyPosition(),
        lit = light.y > 1e-6;
      if (lit)
        for (const o of data.objects) {
          if (o.kind === 'rod') {
            const tip = topOf(o),
              factor = Math.min(100, tip.h / light.y),
              base = Math.min(100, o.elevation / light.y);
            line(
              project(o.x - base * light.x, o.z - base * light.z),
              project(tip.x - factor * light.x, tip.z - factor * light.z),
              'rgba(5,13,22,.75)',
              Math.max(4, view.scale * 0.13),
            );
          }
          if (o.kind === 'sphere') {
            const h = o.elevation + o.radius,
              cx = o.x - (h * light.x) / light.y,
              cz = o.z - (h * light.z) / light.y,
              a = Math.atan2(light.z, light.x),
              major = o.radius / light.y;
            c.beginPath();
            for (let i = 0; i <= 64; i++) {
              const t = (i * Math.PI) / 32,
                u = Math.min(100, major) * Math.cos(t),
                v = o.radius * Math.sin(t),
                p = project(
                  cx + u * Math.cos(a) - v * Math.sin(a),
                  cz + u * Math.sin(a) + v * Math.cos(a),
                );
              i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y);
            }
            c.closePath();
            c.fillStyle = 'rgba(5,13,22,.75)';
            c.fill();
          }
        }
      for (const trail of data.trails || []) {
        let previous = null;
        c.setLineDash([3, 4]);
        for (const point of trail.points) {
          if (!point) {
            previous = null;
            continue;
          }
          const p = project(point.x, point.z);
          if (previous) line(previous, p, '#ecd7a8aa', 1.4);
          previous = p;
        }
        c.setLineDash([]);
      }
      for (const [index, measurement] of (data.measurements || []).entries()) {
        const value = measurementValue(measurement, light);
        if (value) {
          if (!paintingReference) {
            const row = recordList.querySelector(`[data-measure-index="${index}"]`);
            if (row && row.textContent !== value.text) row.textContent = value.text;
          }
          for (let i = 1; i < value.points.length; i++)
            line(
              project(value.points[i - 1].x, value.points[i - 1].z),
              project(value.points[i].x, value.points[i].z),
              '#eddcbd',
              1.4,
            );
          const p = project(value.points[0].x, value.points[0].z);
          write(value.text, { x: p.x + 8, y: p.y + 24 }, '#eddcbd', 11, 'left');
        }
      }

      c.restore();
      const circle = (o, ghosted = false) => {
        c.save();
        c.strokeStyle = o.id === selected ? colors.selected : colors.circle;
        c.lineWidth = o.id === selected ? 2 : 1.3;
        if (ghosted) c.setLineDash([4, 5]);
        c.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.04; a += 0.04) {
          const p = (() => {
            const p = ringPosition(o, a);
            return project(p.x, p.z, p.h);
          })();
          if (a === 0) c.moveTo(p.x, p.y);
          else c.lineTo(p.x, p.y);
        }
        c.stroke();
        c.restore();
      };
      for (const o of data.objects.filter((o) => ['circle', 'dial'].includes(o.kind))) circle(o);
      const annotations = [];
      for (const o of [...data.objects].sort((a, b) => project(a.x, a.z).y - project(b.x, b.z).y)) {
        const tip =
            o.kind === 'rod'
              ? topOf(o)
              : { x: o.x, z: o.z, h: o.elevation + (o.kind === 'sphere' ? 2 * o.radius : 0) },
          p = project(o.x, o.z, o.elevation),
          top = project(tip.x, tip.z, tip.h),
          chosen = o.id === selected;
        if (o.kind === 'rod') {
          line(p, top, '#0d1a28', 8);
          line(p, top, colors.rod, 4);
          c.fillStyle = colors.rod;
          c.beginPath();
          c.arc(top.x, top.y, 3, 0, 7);
          c.fill();
        }
        if (o.kind === 'sphere') {
          const center = project(o.x, o.z, o.elevation + o.radius),
            r = o.radius * view.scale,
            gradient = c.createRadialGradient(
              center.x - r * 0.3,
              center.y - r * 0.3,
              r * 0.1,
              center.x,
              center.y,
              r,
            );
          gradient.addColorStop(0, '#dfd5bb');
          gradient.addColorStop(1, '#536779');
          c.fillStyle = gradient;
          c.beginPath();
          c.arc(center.x, center.y, r, 0, 7);
          c.fill();
        }
        if (o.kind === 'planeObject') {
          const az = o.azimuth * rad,
            points = [
              [-0.5, -0.5],
              [0.5, -0.5],
              [0.5, 0.5],
              [-0.5, 0.5],
            ].map(([x, z]) => {
              const tilt =
                  o.plane === 'vertical' ? Math.PI / 2 : o.plane === 'inclined' ? o.tilt * rad : 0,
                dx = x * o.width,
                dz = z * o.depth * Math.cos(tilt);
              return project(
                o.x + dx * Math.cos(az) - dz * Math.sin(az),
                o.z + dx * Math.sin(az) + dz * Math.cos(az),
                o.elevation + o.depth * 0.5 * Math.sin(tilt) + z * o.depth * Math.sin(tilt),
              );
            });
          c.beginPath();
          points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
          c.closePath();
          c.fillStyle = '#b4c6d422';
          c.fill();
          c.strokeStyle = colors.circle;
          c.stroke();
        }
        if (o.kind === 'dial') {
          for (let a = 0; a < 360; a += 15) {
            const p1 = project(
                o.x + o.radius * 0.9 * Math.sin(a * rad),
                o.z + o.radius * 0.9 * Math.cos(a * rad),
                o.elevation,
              ),
              p2 = project(
                o.x + o.radius * Math.sin(a * rad),
                o.z + o.radius * Math.cos(a * rad),
                o.elevation,
              );
            line(p1, p2, colors.circle);
            if (a % 90 === 0)
              write(
                a + '°',
                project(
                  o.x + o.radius * 1.15 * Math.sin(a * rad),
                  o.z + o.radius * 1.15 * Math.cos(a * rad),
                  o.elevation,
                ),
                colors.muted,
                10,
              );
          }
        }
        if (o.kind === 'observer') {
          const a = o.heading * rad;
          line(
            p,
            project(o.x + 0.8 * Math.sin(a), o.z + 0.8 * Math.cos(a), o.elevation),
            colors.selected,
            2,
          );
          c.strokeStyle = colors.ink;
          c.beginPath();
          c.arc(p.x, p.y - 5, 5, 0, 7);
          c.stroke();
        }
        if (o.kind === 'note') write(name(o), { x: p.x, y: p.y - 14 }, colors.ink, 14);
        if (o.kind === 'marker') {
          c.strokeStyle = colors.ink;
          c.lineWidth = 1.5;
          c.beginPath();
          c.arc(p.x, p.y, 5, 0, 7);
          c.stroke();
          line({ x: p.x - 9, y: p.y }, { x: p.x + 9, y: p.y }, colors.ink);
          line({ x: p.x, y: p.y - 9 }, { x: p.x, y: p.y + 9 }, colors.ink);
        }
        if (chosen || editing) {
          c.strokeStyle = chosen ? colors.selected : '#a3b5c988';
          c.lineWidth = chosen ? 2 : 1;
          c.beginPath();
          c.ellipse(p.x, p.y, chosen ? 10 : 5, chosen ? 5 : 2.5, 0, 0, 7);
          c.stroke();
        }
        if (data.labels) annotations.push({ o, top, chosen });
      }
      const occupied = [];
      for (const { o, top, chosen } of annotations.sort(
        (a, b) => Number(b.chosen) - Number(a.chosen) || (a.o.kind === 'rod' ? -1 : 1),
      )) {
        c.font = `12px "${en() ? 'SkyMotion Charter' : 'SkyMotion Reading'}",serif`;
        const label = name(o),
          tw = c.measureText(label).width;
        for (const [dx, dy] of [
          [10, -14],
          [-tw - 10, -14],
          [10, 22],
          [-tw - 10, 22],
          [10, -38],
          [-tw - 10, 42],
          [10, 46],
        ]) {
          const box = { x: top.x + dx, y: top.y + dy - 12, w: tw + 5, h: 17 };
          if (
            box.x < 8 ||
            box.x + box.w > w - 8 ||
            box.y < 110 ||
            box.y + box.h > h - 55 ||
            occupied.some(
              (a) =>
                box.x < a.x + a.w + 5 &&
                box.x + box.w + 5 > a.x &&
                box.y < a.y + a.h + 4 &&
                box.y + box.h + 4 > a.y,
            )
          )
            continue;
          occupied.push(box);
          if (Math.abs(dy) > 30) line(top, { x: box.x, y: box.y + 9 }, '#a3b5c966');
          write(
            label,
            { x: box.x, y: box.y + 12 },
            chosen ? colors.selected : colors.ink,
            12,
            'left',
          );
          break;
        }
      }
      if (pending && ghost) {
        const p = project(ghost.x, ghost.z);
        c.save();
        c.setLineDash([4, 4]);
        line(p, project(ghost.x, ghost.z, pending === 'rod' ? 1.5 : 0), colors.selected, 2);
        c.strokeStyle = colors.selected;
        c.beginPath();
        c.ellipse(p.x, p.y, 12, 6, 0, 0, 7);
        c.stroke();
        c.restore();
      }
      for (const [key, x, z] of [
        ['north', 0, 6.5],
        ['south', 0, -6.5],
        ['east', 6.5, 0],
        ['west', -6.5, 0],
      ])
        write(t(key), project(x, z), colors.muted, 12);
      if (!paintingReference)
        lightText.textContent = `${t(state.body)} · ${t('alt')} ${light.alt.toFixed(1)}°`;
      const o = current();
      if (!paintingReference && o?.kind === 'observer') {
        const utc = instantUTC(),
          observer = new Astronomy.Observer(o.lat, o.lon, 0),
          eq = Astronomy.Equator(state.body === 'moon' ? 'Moon' : 'Sun', utc, observer, true, true),
          ideal =
            state.manual && state.body === 'sun'
              ? solar(o.lat, state.dec, state.time + (o.lon - state.lon) * 4)
              : null,
          hz = ideal
            ? { altitude: ideal.alt, azimuth: ideal.az }
            : Astronomy.Horizon(utc, observer, eq.ra, eq.dec);
        shadowText.textContent = `${o.lat.toFixed(1)}° / ${o.lon.toFixed(1)}° · ${t('alt')} ${hz.altitude.toFixed(2)}° · ${hz.azimuth.toFixed(2)}°`;
      } else if (!paintingReference)
        shadowText.textContent = !lit
          ? t('night')
          : o?.kind === 'rod'
            ? `${t('shadow')} ${shadowLength(o, light).toFixed(2)} m${shadowLength(o, light) > 6 ? ' · ' + t('outside') : ''}`
            : '';
    } finally {
      drawing = false;
    }
    if (!paintingReference && reference && referenceCanvas.clientWidth > 0) {
      const original = { data, view, paintTarget };
      paintingReference = true;
      try {
        paintTarget = referenceCanvas;
        data = reference.scene;
        const r = referenceCanvas.getBoundingClientRect(),
          dpr = Math.min(devicePixelRatio || 1, 2);
        referenceCanvas.width = Math.round(r.width * dpr);
        referenceCanvas.height = Math.round(r.height * dpr);
        view = {
          w: r.width,
          h: r.height,
          dpr,
          cx: r.width * 0.48,
          cy: r.height * 0.59,
          scale: Math.min(r.width / 19, r.height / 14) * zoom,
        };
        draw();
      } catch {
        delete original.data.reference;
        reference = null;
        queueMicrotask(() => {
          message('invalidReference');
          update();
        });
      } finally {
        data = original.data;
        view = original.view;
        paintTarget = original.paintTarget;
        paintingReference = false;
      }
    }
  }
  function resize() {
    if (!active) return;
    const r = canvas.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    if (gesture && view && (Math.abs(r.width - view.w) > 1 || Math.abs(r.height - view.h) > 1))
      cancelGesture();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (reference && matchMedia('(max-width:760px)').matches)
      compareLabel.textContent = t(
        panel.dataset.referenceView === 'reference' ? 'compareA' : 'compareB',
      );
    if (
      canvas.width !== Math.round(r.width * dpr) ||
      canvas.height !== Math.round(r.height * dpr)
    ) {
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    }
    view = {
      w: r.width,
      h: r.height,
      dpr,
      cx: r.width * 0.48,
      cy: r.height * 0.59,
      scale: Math.min(r.width / 19, r.height / 14) * zoom,
    };
    draw();
  }
  function cancelGesture() {
    if (!gesture) return;
    const g = gesture;
    gesture = null;
    if (g.before) data = g.before;
    if (g.yaw !== undefined) yaw = g.yaw;
    if (canvas.hasPointerCapture(g.id)) canvas.releasePointerCapture(g.id);
    update();
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !view) return;
    if (gesture) {
      if (gesture.id !== e.pointerId) cancelGesture();
      return;
    }
    canvas.focus({ preventScroll: true });
    const p = local(e);
    if (editing && pending) {
      place(pending, position(e));
      return;
    }
    const o = hit(p);
    if (!o) {
      selected = null;
      selectedMany.clear();
      gesture = { id: e.pointerId, start: p, yaw };
      canvas.setPointerCapture(e.pointerId);
      update();
      return;
    }
    selected = o?.id || null;
    selectedMany = new Set(o ? [o.id] : []);
    if (o && !o.locked) {
      stop();
      gesture = {
        id: e.pointerId,
        start: p,
        before: clone(data),
        object: o.id,
        trace: [{ x: o.x, z: o.z }],
        offset: ground(p),
        x: o.x,
        z: o.z,
      };
      canvas.setPointerCapture(e.pointerId);
    } else if (o?.locked) message('locked');
    update();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!view) return;
    if (!gesture) {
      if (pending) {
        ghost = position(e);
        draw();
      }
      return;
    }
    if (gesture.id !== e.pointerId) return;
    const p = local(e);
    if (gesture.yaw !== undefined) {
      yaw = gesture.yaw + (p.x - gesture.start.x) * 0.008;
      draw();
      return;
    }
    const o = current();
    if (!o || Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) < 3) return;
    const g = ground(p);
    o.x = Math.max(-5, Math.min(5, gesture.x + g.x - gesture.offset.x));
    o.z = Math.max(-5, Math.min(5, gesture.z + g.z - gesture.offset.z));
    if (snap.checked) {
      o.x = Math.round(o.x * 4) / 4;
      o.z = Math.round(o.z * 4) / 4;
    }
    if (data.recordMotion && gesture.trace.length < 250) gesture.trace.push({ x: o.x, z: o.z });
    draw();
  });
  canvas.addEventListener('pointerup', (e) => {
    if (gesture?.id !== e.pointerId) return;
    const g = gesture;
    gesture = null;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (g.before) {
      if (data.recordMotion && g.object) {
        const o = current();
        (data.trails ??= []).push({
          label: t('motion') + ' ' + name(o),
          points: g.trace || [
            { x: g.x, z: g.z },
            { x: o.x, z: o.z },
          ],
        });
      }
      record(g.before);
    }
    update();
  });
  for (const type of ['pointercancel', 'lostpointercapture'])
    canvas.addEventListener(type, (e) => {
      if (gesture?.id === e.pointerId) cancelGesture();
    });
  canvas.addEventListener('pointerleave', () => {
    if (!gesture) {
      ghost = null;
      draw();
    }
  });
  window.addEventListener('blur', cancelGesture);
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelGesture();
      pending = null;
      update();
      return;
    }
    if (pending && e.key === 'Enter') {
      e.preventDefault();
      place(pending, { x: 0, z: 0 });
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const o = current();
      if (editing && o && !o.locked) {
        change(() => {
          const step = e.shiftKey ? 1 : 0.25;
          if (e.key === 'ArrowLeft') o.x = Math.max(-5, o.x - step);
          if (e.key === 'ArrowRight') o.x = Math.min(5, o.x + step);
          if (e.key === 'ArrowUp') o.z = Math.min(5, o.z + step);
          if (e.key === 'ArrowDown') o.z = Math.max(-5, o.z - step);
        });
      } else if (!editing) {
        yaw += e.key === 'ArrowRight' ? 0.1 : e.key === 'ArrowLeft' ? -0.1 : 0;
        draw();
      }
    }
    if (editing && ['Delete', 'Backspace'].includes(e.key)) {
      e.preventDefault();
      remove();
    }
  });
  for (const root of [rail, panel])
    root.addEventListener('keydown', (e) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'z' &&
        !e.target.matches('input,textarea')
      ) {
        e.preventDefault();
        travel(e.shiftKey ? redo : undo, e.shiftKey ? undo : redo);
      }
    });
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      cancelGesture();
      zoom = Math.max(0.65, Math.min(1.5, zoom - e.deltaY * 0.001));
      resize();
    },
    { passive: false },
  );
  new ResizeObserver(resize).observe(canvas);
  window.SkySceneBuilder = {
    open(options = {}) {
      if (window.SkyCustomization?.active !== true) return;
      if (window.SkyDiagramTools?.leave() === false) return;
      if (body !== state.body) selectBody();
      editing = true;
      if (options.kind && addButtons[options.kind]) {
        pending = options.kind;
        selected = null;
        selectedMany.clear();
        tools.hidden = true;
      }
      if (options.objectId && data.objects.some((o) => o.id === options.objectId)) {
        selected = options.objectId;
        pending = null;
      }
      update();
      const drawer = document.getElementById('uiParameterDrawer');
      if (options.kind && drawer?.open) drawer.close();
      uiWorkspace.selected = 'sceneBuilder';
      document.dispatchEvent(new Event('skymotion:builder-open'));
      schedule();
    },
    sync() {
      const next =
        uiWorkspace.selected === 'sceneBuilder' && window.SkyCustomization?.active !== false;
      if (active && !next) {
        cancelGesture();
        if (window.SkyCustomization?.active)
          requestAnimationFrame(() =>
            requestAnimationFrame(() => window.SkyDiagramTools?.openObjects()),
          );
      }
      if (next && !active) document.dispatchEvent(new Event('skymotion:builder-open'));
      active = next;
      document.body.classList.toggle('scene-builder-active', active);
      if (!active) return;
      conditions.textContent = en() ? 'Observation controls ↓' : '观测条件 ↓';
      if (body !== state.body) selectBody();
      if (language !== document.documentElement.lang) {
        language = document.documentElement.lang;
        update();
      }
      resize();
    },
    listObjects() {
      if (body !== state.body) selectBody();
      return data.objects.map((o) => ({ id: o.id, label: name(o), kind: o.kind }));
    },
    read: () => (data ? clone(data) : null),
  };
  uiWorkspace.nodes.push(panel);
  document.addEventListener('skymotion:language', () => {
    language = '';
    if (active) update();
  });
  schedule();
})();
