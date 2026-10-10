/**
 * 跨页状态保存、静态页面适配与关联图解路由。
 */
/* Shared experiment layout: plot, controls and timeline occupy separate grid cells. */
let uiWorkspace = null;
function renderUIWorkspace() {
  if ($('uiPlaceText'))
    $('uiPlaceText').textContent = coord(state.lat, 'lat') + ' · ' + coord(state.lon, 'lon');
  if (!uiWorkspace) return;
  const u = uiWorkspace,
    moon = state.body === 'moon',
    page = document.body.dataset.page;
  const solarShortcut = document.querySelector('.page-nav a[href="analemma.html"]');
  if (solarShortcut && ['lab', 'diagrams'].includes(page)) solarShortcut.hidden = moon;
  if (page === 'lab') {
    u.title.textContent = moon ? '月相与月球视运动' : '太阳视运动';
    u.phaseButton.hidden = !moon;
    u.skyButton.hidden = !moon;
    u.phaseButton.setAttribute('aria-pressed', String(u.moonPhase));
    u.skyButton.setAttribute('aria-pressed', String(!u.moonPhase));
    document.querySelector('.view-tabs').hidden = moon && u.moonPhase;
    u.nodes.forEach((n) => (n.hidden = true));
    if (moon && u.moonPhase) $('phaseContent').hidden = false;
    else $('stage').hidden = false;
    u.plot.dataset.kind = moon && u.moonPhase ? 'phase' : 'sky';
  }
  if (page === 'diagrams') {
    const allowed = moon
      ? ['contextPanel', 'chartPanel', 'riseSetPanel', 'companionModule']
      : ['contextPanel', 'chartPanel', 'riseSetPanel', 'solarGeometryPanel', 'solarCompare'];
    if (!allowed.includes(u.selected)) {
      u.selected = 'contextPanel';
      if (window.SkyMotionHistory && !SkyMotionHistory.restoring)
        SkyMotionHistory.setRoute('#contextPanel');
      else history.replaceState(history.state, '', '#contextPanel');
    }
    u.tabs.querySelectorAll('button').forEach((b) => {
      b.textContent = {
        contextPanel: moon ? '月相与关系' : '直射点与昼夜',
        chartPanel: moon ? '逐日照明比例' : '全天高度曲线',
        riseSetPanel: moon ? '月出月落' : '日出日落',
        solarGeometryPanel: '地轴与地平面',
        companionModule: '行星伴月',
        solarCompare: '四图对照',
      }[b.dataset.diagram];
      b.hidden = !allowed.includes(b.dataset.diagram);
      b.setAttribute('aria-selected', String(b.dataset.diagram === u.selected));
    });
    u.nodes.forEach((n) => (n.hidden = true));
    const chosen = {
      contextPanel: moon ? $('phaseContent') : $('sunContextContent'),
      chartPanel: $('chart'),
      riseSetPanel: $('eventCompass'),
      solarGeometryPanel: $('earthGeometry'),
      companionModule: $('companionSky'),
    }[u.selected];
    const comparing = !moon && u.selected === 'solarCompare';
    for (const [id, card] of Object.entries(u.cards)) {
      const visible =
        comparing || (id === u.selected && (!moon || ['chartPanel', 'riseSetPanel'].includes(id)));
      card.hidden = !visible;
      if (visible) card.querySelector('.ui-diagram-surface').firstElementChild.hidden = false;
    }
    if (chosen) chosen.hidden = false;
    u.plot.dataset.kind = u.selected;
    u.plot.closest('.ui-shell').classList.toggle('ui-solar-compare', comparing);
    if ($('uiEarthSettings')) $('uiEarthSettings').hidden = moon;
    u.details.forEach((n) => (n.hidden = n.dataset.for !== u.selected));
    if ($('uiEarthSettings'))
      (comparing ? $('uiCompareSettings') : $('contextPanel')).append($('uiEarthSettings'));
    // This page has diagram-specific controls, rather than the sky laboratory's menu.
    $('studyMenu').hidden = true;
    $('seasonMenu').hidden = true; // The shared date slider already covers the full year.
    $('solarDateModeMenu').hidden = true; // Playback basis is set in the time workbench.
    $('track').closest('label').hidden = true;
    $('angles').closest('label').hidden = true;
    $('shadowMenu').hidden = true;
    const showOverlay = !moon && (u.selected === 'chartPanel' || comparing);
    $('displayMenu').hidden = !showOverlay;
    $('solarOverlayBar').hidden = !showOverlay;
    $('displayContextNote').hidden = true;
    $('displayMenu').querySelector('.menu-section-name').textContent = '曲线叠加';
    $('displaySummary').textContent = '同一地点与时刻的太阳、月球';
    $('modelMenu').querySelector('.menu-section-name').textContent = '太阳计算方式';
    $('compareControl').hidden = moon || !(u.selected === 'chartPanel' || comparing);
    $('modelMenu').querySelector('.menu-divider').hidden = true;
    $('reset').textContent = '重置当前图解条件';
    u.title.textContent = (moon ? '月球' : '太阳') + ' · 关联图解';
  }
}
(() => {
  const page = document.body.dataset.page;
  for (const a of document.querySelectorAll('.page-nav a'))
    if (a.getAttribute('href') === page + '.html') a.setAttribute('aria-current', 'page');
  document.body.insertBefore(document.querySelector('.page-nav'), $('labShell'));
  try {
    const saved = JSON.parse(sessionStorage.getItem('skyLabSession') || 'null');
    if (saved) {
      for (const body of ['sun', 'moon'])
        for (const key of Object.keys(modeStates[body])) {
          const v = saved[body]?.[key];
          if (
            key !== 'playing' &&
            key !== 'solarDateLinkBackup' &&
            v !== undefined &&
            typeof v === typeof modeStates[body][key]
          )
            modeStates[body][key] = v;
        }
      state = modeStates[saved.body === 'moon' ? 'moon' : 'sun'];
      if (Number.isFinite(saved.sundialLength))
        sundialLength = clamp(saved.sundialLength, 0.06, 0.3);
      sundialView = saved.sundialView === 'plate' ? 'plate' : 'device';
    }
  } catch {}
  const returnBody = state.body;
  function save() {
    if (page === 'analemma' || page === 'sundial') {
      for (const k of [
        'date',
        'lat',
        'lon',
        'place',
        ...(page === 'sundial'
          ? ['time', 'sundialOffset']
          : Object.keys(initialSun).filter((k) => k.startsWith('analemma'))),
      ])
        modeStates.sun[k] = state[k];
      modeStates.sun.dec = dateDec(modeStates.sun.date);
    }
    try {
      sessionStorage.setItem(
        'skyLabSession',
        JSON.stringify({
          body: ['analemma', 'sundial'].includes(page) ? returnBody : state.body,
          sun: modeStates.sun,
          moon: modeStates.moon,
          sundialLength,
          sundialView,
        }),
      );
    } catch {}
  }
  window.addEventListener('pagehide', save);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) location.reload();
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('a[href]')) save();
  });
  state.playing = false;
  $('labShell').hidden = false;
  $('labShell').inert = false;
  function link(id, url, text) {
    const old = $(id),
      a = document.createElement('a');
    a.id = id;
    a.className = 'page-link';
    a.href = url;
    a.textContent = text || old.textContent;
    old.replaceWith(a);
  }
  const life = $('lifeDevicesMenu'),
    lifeEntry = document.createElement('div');
  lifeEntry.id = 'lifeDevicesMenu';
  lifeEntry.className = 'life-devices-entry';
  lifeEntry.append($('sundialLink'));
  life.replaceWith(lifeEntry);
  link('helpBtn', 'guide.html');
  link('openSundials', 'sundial.html', '日晷实验台');
  link('sundialLink', 'sundial.html', '日晷实验台');
  link('analemmaLink', 'analemma.html', '日行迹与“8”字成因');
  // Space views have their own UTC clock and camera; opening them preserves laboratory state.
  const spaceMenu = document.createElement('details');
  spaceMenu.className = page === 'diagrams' ? 'menu-section' : 'menu-subsection';
  spaceMenu.innerHTML =
    '<summary>空间模型</summary><div class="menu-content"><a class="page-link" href="space/">太阳系三维模型</a><a class="page-link" href="space/?view=earthmoon">日地月空间关系</a></div>';
  if (page === 'lab') $('studyMenu').querySelector('.study-navigation').append(spaceMenu);
  for (const [id, target] of [
    ['eventsLink', 'riseSetPanel'],
    ['chartLink', 'chartPanel'],
    ['contextLink', 'contextPanel'],
    ['geometryLink', 'solarGeometryPanel'],
  ])
    link(id, 'diagrams.html#' + target);
  if (['analemma', 'sundial'].includes(page)) {
    state = {
      ...modeStates.sun,
      playing: false,
      manual: false,
      solarDateMode: false,
      solarDateLinkBackup: null,
    };
    state.dec = dateDec(state.date);
  }
  const shell = document.createElement('main');
  shell.className = 'ui-shell';
  shell.innerHTML =
    '<div class="ui-heading"><div><h1></h1><span id="uiPlaceText"></span></div><div class="ui-body-host"></div><button id="uiParametersButton" type="button" aria-haspopup="dialog" aria-controls="uiParameterDrawer" aria-expanded="false" aria-label="打开实验参数菜单"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4" /></svg><span>参数</span></button></div><div class="ui-grid"><section class="ui-visual" aria-label="实验图形"><div class="ui-viewbar"></div><div class="ui-plot"></div></section><aside class="ui-parameters" aria-label="实验参数"><h2>实验参数</h2></aside><div class="ui-timeline-host"></div></div>';
  const original = $('labShell').querySelector('main');
  $('labShell').querySelector('header').hidden = true;
  original.hidden = true;
  $('labShell').prepend(shell);
  const rail = shell.querySelector('.ui-parameters'),
    bar = shell.querySelector('.ui-viewbar'),
    plot = shell.querySelector('.ui-plot'),
    title = shell.querySelector('h1');
  shell.querySelector('.ui-timeline-host').append($('timeWorkbench'));
  rail.append($('workbenchMore'));
  if (page === 'diagrams') rail.append(spaceMenu);
  $('workbenchMore').querySelector('summary').textContent = '播放与快捷时刻';
  const bodySwitch = document.querySelector('.body-switch');
  shell.querySelector('.ui-body-host').append(bodySwitch);
  if (['analemma', 'sundial'].includes(page)) shell.querySelector('.ui-body-host').hidden = true;
  rail.tabIndex = -1;
  function addPlace() {
    const label = document.createElement('label');
    label.className = 'ui-field';
    label.textContent = '观察地点';
    label.append($('place'));
    rail.append(label, $('coordinatesMenu'));
    $('coordinatesMenu').open = true;
  }
  if (page === 'analemma') {
    title.textContent = '日行迹与“8”字成因';
    state.analemma = true;
    plot.append($('analemmaCanvas'));
    function group(name, open = false) {
      const d = document.createElement('details');
      d.className = 'menu-section';
      d.open = open;
      const summary = document.createElement('summary');
      summary.textContent = name;
      const content = document.createElement('div');
      content.className = 'menu-content';
      d.append(summary, content);
      rail.append(d);
      return content;
    }
    const observation = group('观测与图解', true);
    observation.append(
      document.querySelector('.analemma-controls'),
      document.querySelector('.analemma-comparison'),
    );
    addPlace();
    const location = group('观察地点');
    location.append(rail.querySelector('.ui-field'), $('coordinatesMenu'));
    $('coordinatesMenu').open = true;
    const advanced = document.querySelector('.analemma-advanced');
    advanced.open = false;
    rail.append(advanced);
    const reading = group('轨迹读数与说明');
    for (const id of [
      'analemmaLegend',
      'analemmaConditions',
      'analemmaViewHint',
      'analemmaResults',
      'analemmaExplanation',
    ])
      reading.append($(id));
    $('analemmaDay').hidden = true;
  } else if (page === 'sundial') {
    title.textContent = '日晷实验台';
    const panel = $('sundialPanel');
    panel.open = true;
    panel.close = () => (location.href = 'lab.html');
    bar.classList.add('ui-tabs');
    bar.innerHTML =
      '<div class="ui-sundial-types" role="tablist" aria-label="日晷类型"><button type="button" role="tab" data-kind="horizontal" aria-controls="horizontalDial" aria-selected="true">水平日晷</button><button type="button" role="tab" data-kind="equatorial" aria-controls="equatorialDial" aria-selected="false">赤道日晷</button></div>';
    plot.append($('horizontalDial'), $('equatorialDial'));
    $('equatorialDial').hidden = true;
    const readings = {
      horizontal: $('horizontalDialReading').closest('.sundial-reading'),
      equatorial: $('equatorialDialReading').closest('.sundial-reading'),
    };
    readings.horizontal.querySelector('span').textContent = '晷上读时';
    readings.equatorial.querySelector('span').textContent = '晷上读时';
    shell.classList.add('ui-sundial');
    const readout = document.createElement('div');
    readout.className = 'ui-sundial-readout';
    readout.append(readings.horizontal, readings.equatorial);
    const presets = document.querySelector('.sundial-toolbar > div');
    presets.classList.add('ui-sundial-presets');
    for (const button of presets.querySelectorAll('button'))
      button.textContent = { 540: '09:00', 720: '正午', 900: '15:00' }[button.dataset.dialTime];
    $('workbenchMore').querySelector('.workbench-extra').append(presets);
    plot.before(readout);
    const views = document.querySelector('.sundial-view-controls');
    views.querySelector('[data-dial-view=device]').textContent = '立体装置';
    views.querySelector('[data-dial-view=plate]').textContent = '盘面与安装';
    bar.append(views);
    const cameraTools = document.createElement('div');
    cameraTools.className = 'ui-sundial-camera-tools';
    cameraTools.id = 'sundialCameraTools';
    cameraTools.innerHTML =
      '<div role="group" aria-label="立体装置拖动方式"><button type="button" data-sundial-drag="orbit" aria-pressed="true">旋转装置</button><button type="button" data-sundial-drag="time" aria-pressed="false">拖影调时</button></div><button id="resetSundialCamera" type="button" aria-label="复位装置视角">复位</button>';
    for (const button of cameraTools.querySelectorAll('[data-sundial-drag]'))
      button.onclick = () => {
        sundialDragMode = button.dataset.sundialDrag;
        schedule();
      };
    cameraTools.querySelector('#resetSundialCamera').onclick = () => {
      for (const camera of Object.values(sundialCameras))
        Object.assign(camera, { pitch: 0.65, yaw: -0.34, zoom: 1 });
      schedule();
    };
    readout.append(cameraTools);
    const hint = $('sundialInteractionHint');
    hint.classList.add('ui-sundial-hint');
    plot.after(hint);
    function selectDial(kind) {
      for (const k of ['horizontal', 'equatorial']) {
        $(k + 'Dial').hidden = k !== kind;
        readings[k].hidden = k !== kind;
        $(k + 'DialNote').hidden = k !== kind;
      }
      bar
        .querySelectorAll('[data-kind]')
        .forEach((b) => b.setAttribute('aria-selected', String(b.dataset.kind === kind)));
      shell.dataset.sundialKind = kind;
      schedule();
    }
    bar
      .querySelectorAll('[data-kind]')
      .forEach((b) => (b.onclick = () => selectDial(b.dataset.kind)));
    selectDial('horizontal');
    function sundialGroup(name, open = false) {
      const group = document.createElement('details');
      group.className = 'menu-section';
      group.open = open;
      const summary = document.createElement('summary');
      summary.textContent = name;
      const content = document.createElement('div');
      content.className = 'menu-content';
      group.append(summary, content);
      rail.append(group);
      return content;
    }
    addPlace();
    const location = sundialGroup('观测地点', true);
    location.append(rail.querySelector('.ui-field'), $('coordinatesMenu'));
    $('coordinatesMenu').open = false;
    const device = sundialGroup('装置参数', true);
    device.append(
      document.querySelector('label[for=sundialNeedleLength]'),
      $('sundialNeedleLength'),
    );
    const lengthNote = document.createElement('p');
    lengthNote.className = 'micro';
    lengthNote.textContent = '针长只改变影长，不改变时刻线方向；赤道日晷两侧各取此长度。';
    device.append(lengthNote, $('horizontalDialNote'), $('equatorialDialNote'));
    const clocks = sundialGroup('钟表时对照');
    clocks.append(
      document.querySelector('label[for=sundialOffset]'),
      document.querySelector('.sundial-clock'),
    );
    const construction = sundialGroup('制作、安装与原理');
    const distinction = document.createElement('p');
    distinction.className = 'micro';
    distinction.textContent =
      '水平日晷：盘面水平，晷针指向天极，仰角等于当地纬度的绝对值。赤道日晷：盘面平行赤道面，晷针垂直盘面。立体视角中的视觉倾斜不代表盘面的安装倾角；点击上方“盘面与安装”查看侧视。';
    construction.append(distinction);
    for (const n of document.querySelectorAll('.sundial-make,.sundial-question,.sundial-key')) {
      if (n.classList.contains('sundial-make'))
        n.querySelector('summary').textContent =
          n.closest('.sundial-card').querySelector('h3').textContent + '的制作与安装';
      construction.append(n);
    }
  } else {
    rail.append($('controls'));
    $('controls').querySelector('.section-head').hidden = true;
    $('controls').querySelector('.date-navigation').hidden = true;
    document.querySelector('label[for=date]').hidden = true;
    document
      .querySelector('#solarDateModeMenu .menu-content')
      .append(document.querySelector('.solar-date-options'));
    document.querySelector('label[for=solarDateLink] span').textContent = '日行迹采用当前真太阳时';
    document.querySelector('#displayMenu .menu-content').append($('solarOverlayBar'));
    uiWorkspace = {
      title,
      plot,
      rail,
      details: [],
      selected: location.hash.slice(1) || 'contextPanel',
      moonPhase: true,
      nodes: [],
      cards: {},
    };
    if (page === 'lab') {
      bar.append(document.querySelector('.view-tabs'));
      const phase = document.createElement('button');
      phase.type = 'button';
      phase.textContent = '月相';
      phase.className = 'ui-phase-button';
      bar.prepend(phase);
      uiWorkspace.phaseButton = phase;
      phase.onclick = () => {
        uiWorkspace.moonPhase = true;
        schedule();
      };
      const sky = document.createElement('button');
      sky.type = 'button';
      sky.textContent = '月球天空';
      sky.className = 'ui-moon-sky-button';
      bar.prepend(sky);
      uiWorkspace.skyButton = sky;
      sky.onclick = () => {
        uiWorkspace.moonPhase = false;
        schedule();
      };
      for (const id of ['stage', 'phaseContent']) {
        plot.append($(id));
        uiWorkspace.nodes.push($(id));
      }
      rail.append(document.querySelector('.metrics'), document.querySelector('.model-explanation'));
      $('settingsBtn').onclick = $('uiParametersButton').onclick;
    } else {
      bar.classList.add('ui-tabs');
      bar.setAttribute('role', 'tablist');
      uiWorkspace.tabs = bar;
      for (const [id, name] of [
        ['contextPanel', '地球 / 月相'],
        ['chartPanel', '变化曲线'],
        ['riseSetPanel', '升落方位'],
        ['solarGeometryPanel', '地轴与地平面'],
        ['companionModule', '行星伴月'],
        ['solarCompare', '四图对照'],
      ]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.diagram = id;
        b.textContent = name;
        b.setAttribute('role', 'tab');
        b.onclick = () => {
          uiWorkspace.selected = id;
          if (id === 'companionModule') state.companion = true;
          if (location.hash !== '#' + id) {
            if (window.SkyMotionHistory) SkyMotionHistory.setRoute('#' + id);
            else history.pushState(null, '', '#' + id);
          }
          schedule();
        };
        bar.append(b);
      }
      for (const id of [
        'sunContextContent',
        'phaseContent',
        'chart',
        'eventCompass',
        'earthGeometry',
        'companionSky',
      ]) {
        plot.append($(id));
        uiWorkspace.nodes.push($(id));
      }
      // Reuse the same canvases in single and comparison views; no duplicate pipelines.
      for (const [id, nodeId, name] of [
        ['contextPanel', 'sunContextContent', '直射点与昼夜'],
        ['chartPanel', 'chart', '全天太阳高度'],
        ['riseSetPanel', 'eventCompass', '日出日落方位'],
        ['solarGeometryPanel', 'earthGeometry', '地轴与地平面'],
      ]) {
        const card = document.createElement('section');
        card.className = 'ui-diagram-card';
        card.dataset.diagramCard = id;
        card.hidden = true;
        const header = document.createElement('div');
        header.className = 'ui-diagram-card-head';
        const heading = document.createElement('h2');
        heading.textContent = name;
        header.append(heading);
        if (id === 'solarGeometryPanel') {
          card.classList.add('ui-geometry-card');
          const hint = document.createElement('span');
          hint.textContent = '拖动旋转 · 双指缩放';
          const reset = document.createElement('button');
          reset.type = 'button';
          reset.id = 'resetGeometryView';
          reset.textContent = '复位视角';
          reset.onclick = resetGeometryCamera;
          header.append(hint, reset);
        }
        const surface = document.createElement('div');
        surface.className = 'ui-diagram-surface';
        surface.append($(nodeId));
        card.append(header, surface);
        plot.append(card);
        uiWorkspace.cards[id] = card;
      }
      const comparisonDetails = document.createElement('div');
      comparisonDetails.className = 'ui-diagram-details';
      comparisonDetails.dataset.for = 'solarCompare';
      comparisonDetails.innerHTML =
        '<h2>四图对照</h2><p>四张图共用同一地点、日期和观测时刻。拖动下方时间或日期滑块，同时比较太阳高度、升落方位、昼夜分布与当地地平面。</p><p>球面与地轴图可分别拖动旋转；图解旋转不改变天文条件。地轴图中红色为地轴、紫色为赤道面、绿色为地平面、蓝色为天顶、黄色为太阳方向；小图省略部分文字标签。需要放大阅读时，点击上方相应的单图标签。</p><div id="uiCompareSettings"></div>';
      rail.prepend(comparisonDetails);
      uiWorkspace.details.push(comparisonDetails);
      for (const id of [
        'contextPanel',
        'chartPanel',
        'riseSetPanel',
        'solarGeometryPanel',
        'companionModule',
      ]) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ui-diagram-details';
        wrapper.dataset.for = id;
        wrapper.append($(id));
        rail.prepend(wrapper);
        uiWorkspace.details.push(wrapper);
      }
      const earthSettings = document.createElement('div');
      earthSettings.id = 'uiEarthSettings';
      earthSettings.append(
        document.querySelector('.context-view-switch'),
        document.querySelector('.globe-notes'),
      );
      $('contextPanel').append(earthSettings);
      if (uiWorkspace.selected === 'companionModule') state.companion = true;
    }
    $('lunarSkyDetails').open = true;
    if (page === 'diagrams') {
      const restoreDiagram = () => {
        uiWorkspace.selected = location.hash.slice(1) || 'contextPanel';
        if (uiWorkspace.selected === 'companionModule' && state.body === 'moon')
          state.companion = true;
        schedule();
      };
      window.addEventListener('hashchange', restoreDiagram);
      window.addEventListener('popstate', restoreDiagram);
    }
  }
  // A native modal supplies focus trapping and keeps the covered laboratory inert.
  // The same parameter nodes move between the desktop rail and the mobile drawer.
  const drawerMedia = matchMedia('(max-width:760px)'),
    drawerHome = document.createComment('desktop parameter rail'),
    drawer = document.createElement('dialog'),
    parameterButton = $('uiParametersButton');
  rail.before(drawerHome);
  drawer.id = 'uiParameterDrawer';
  drawer.className = 'ui-parameter-drawer';
  drawer.setAttribute('aria-labelledby', 'uiDrawerTitle');
  drawer.innerHTML =
    '<header class="ui-drawer-header"><div><span>实验参数</span><h2 id="uiDrawerTitle"></h2></div><button type="button" id="uiDrawerClose" aria-label="关闭参数菜单"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></header>';
  document.body.append(drawer);
  let drawerAnimation = null,
    drawerClosing = false,
    drawerReturnFocus = null,
    drawerGeneration = 0;
  const lowMotion = matchMedia('(prefers-reduced-motion:reduce)');
  function animateDrawer(frames, duration) {
    drawerAnimation?.cancel();
    drawerAnimation = lowMotion.matches ? null : SkyMotionUI.springPanel(drawer, frames, duration);
    return drawerAnimation?.finished.catch(() => {}) || Promise.resolve();
  }
  function finishDrawerClose(restoreFocus = true) {
    drawerGeneration++;
    drawerAnimation?.cancel();
    drawer.style.transform = '';
    if (drawer.open) drawer.close();
    drawerClosing = false;
    parameterButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus && drawerMedia.matches && drawerReturnFocus?.isConnected)
      drawerReturnFocus.focus({ preventScroll: true });
  }
  function closeParameters(immediate = false) {
    if (!drawer.open || drawerClosing) return;
    if (immediate) {
      finishDrawerClose(false);
      return;
    }
    drawerClosing = true;
    const generation = ++drawerGeneration;
    animateDrawer(
      [
        { transform: drawer.style.transform || 'translateX(0)' },
        { transform: 'translateX(-100%)' },
      ],
      180,
    ).then(() => {
      if (generation === drawerGeneration) finishDrawerClose();
    });
  }
  function openParameters() {
    if (!drawerMedia.matches) {
      rail.focus({ preventScroll: true });
      return;
    }
    if (drawer.open) return;
    stop();
    // Opening controls changes playback UI, not the scientific image.
    renderTimeWorkbench();
    drawerReturnFocus = document.activeElement;
    $('uiDrawerTitle').textContent = title.textContent;
    drawer.showModal();
    parameterButton.setAttribute('aria-expanded', 'true');
    animateDrawer([{ transform: 'translateX(-100%)' }, { transform: 'translateX(0)' }], 220);
    $('uiDrawerClose').focus({ preventScroll: true });
  }
  parameterButton.onclick = openParameters;
  $('settingsBtn').onclick = openParameters;
  $('uiDrawerClose').onclick = () => closeParameters();
  drawer.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeParameters();
  });
  drawer.addEventListener('click', (event) => {
    if (event.target !== drawer) return;
    const r = drawer.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      closeParameters();
  });
  drawer.addEventListener('close', () => {
    parameterButton.setAttribute('aria-expanded', 'false');
    schedule();
  });
  // Swipe only the header: slider drags and vertical parameter scrolling stay independent.
  const drawerHeader = drawer.querySelector('.ui-drawer-header');
  let swipe = null;
  drawerHeader.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button') || drawerClosing || event.button !== 0) return;
    drawerAnimation?.cancel();
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0 };
    drawerHeader.setPointerCapture(event.pointerId);
  });
  drawerHeader.addEventListener('pointermove', (event) => {
    if (!swipe || event.pointerId !== swipe.id) return;
    swipe.dx = event.clientX - swipe.x;
    swipe.dy = event.clientY - swipe.y;
    if (Math.abs(swipe.dx) > Math.abs(swipe.dy) * 1.5)
      drawer.style.transform = `translateX(${Math.min(0, swipe.dx)}px)`;
  });
  function endDrawerSwipe(event) {
    if (!swipe || event.pointerId !== swipe.id) return;
    const shouldClose = event.type === 'pointerup' && swipe.dx < -65 && Math.abs(swipe.dy) < 40;
    swipe = null;
    if (shouldClose) closeParameters();
    else {
      const from = drawer.style.transform || 'translateX(0)';
      drawer.style.transform = '';
      animateDrawer([{ transform: from }, { transform: 'translateX(0)' }], 150);
    }
  }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    drawerHeader.addEventListener(event, endDrawerSwipe);
  function updateParameterPresentation() {
    finishDrawerClose(false);
    if (drawerMedia.matches) drawer.append(rail);
    else drawerHome.after(rail);
    schedule();
  }
  drawerMedia.addEventListener('change', updateParameterPresentation);
  updateParameterPresentation();
  SkyMotionUI.installRail({
    shell,
    rail,
    button: parameterButton,
    mobile: drawerMedia,
    openDrawer: openParameters,
  });
  syncControls();
  render();
  new ResizeObserver(() => {
    schedule();
  }).observe(plot);
})();
