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
      history.replaceState(null, '', '#contextPanel');
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
    '<div class="ui-heading"><div><h1></h1><span id="uiPlaceText"></span></div><div class="ui-body-host"></div><button id="uiParametersButton" type="button">实验参数 ↓</button></div><div class="ui-grid"><section class="ui-visual" aria-label="实验图形"><div class="ui-viewbar"></div><div class="ui-plot"></div></section><aside class="ui-parameters" aria-label="实验参数"><h2>实验参数</h2></aside><div class="ui-timeline-host"></div></div>';
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
  $('workbenchMore').querySelector('summary').textContent = '播放与快捷时刻';
  const bodySwitch = document.querySelector('.body-switch');
  shell.querySelector('.ui-body-host').append(bodySwitch);
  if (['analemma', 'sundial'].includes(page)) shell.querySelector('.ui-body-host').hidden = true;
  $('uiParametersButton').onclick = () => {
    rail.scrollTop = 0;
    rail.focus({ preventScroll: true });
  };
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
      '<button type="button" data-kind="horizontal" aria-selected="true">水平日晷</button><button type="button" data-kind="equatorial" aria-selected="false">赤道日晷</button>';
    plot.append($('horizontalDial'), $('equatorialDial'));
    $('equatorialDial').hidden = true;
    const readings = {
      horizontal: $('horizontalDialReading').closest('.sundial-reading'),
      equatorial: $('equatorialDialReading').closest('.sundial-reading'),
    };
    readings.horizontal.querySelector('span').textContent = '水平日晷 · 晷上读时';
    readings.equatorial.querySelector('span').textContent = '赤道日晷 · 晷上读时';
    rail.prepend(readings.horizontal, readings.equatorial);
    function selectDial(kind) {
      for (const k of ['horizontal', 'equatorial']) {
        $(k + 'Dial').hidden = k !== kind;
        readings[k].hidden = k !== kind;
        $(k + 'DialNote').hidden = k !== kind;
      }
      bar
        .querySelectorAll('button')
        .forEach((b) => b.setAttribute('aria-selected', String(b.dataset.kind === kind)));
      schedule();
    }
    bar.querySelectorAll('button').forEach((b) => (b.onclick = () => selectDial(b.dataset.kind)));
    selectDial('horizontal');
    addPlace();
    rail.append(
      document.querySelector('label[for=sundialNeedleLength]'),
      $('sundialNeedleLength'),
      document.querySelector('.sundial-view-controls'),
      document.querySelector('.sundial-toolbar'),
      document.querySelector('.sundial-clock'),
      $('horizontalDialNote'),
      $('equatorialDialNote'),
      $('sundialInteractionHint'),
    );
    const info = document.createElement('details');
    info.className = 'ui-information';
    info.innerHTML = '<summary>制作、安装与模型说明</summary>';
    for (const n of document.querySelectorAll('.sundial-make,.sundial-question,.sundial-key'))
      info.append(n);
    rail.append(info);
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
          if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
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
  syncControls();
  render();
  new ResizeObserver(() => {
    schedule();
  }).observe(plot);
})();
