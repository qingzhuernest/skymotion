/**
 * 跨页状态保存、静态页面适配与关联图解路由。
 */
/* Shared experiment layout: plot, controls and timeline occupy separate grid cells. */
let uiWorkspace = null;
function uiViewHidden(node, value) {
  if (node.hidden !== value) node.hidden = value;
}
function uiViewText(node, value) {
  const translated = window.skyTranslate ? window.skyTranslate(value) : value;
  if (node.textContent !== translated) node.textContent = translated;
}
function uiViewAttribute(node, name, value) {
  if (node.getAttribute(name) !== value) node.setAttribute(name, value);
}
function renderUIWorkspace() {
  if ($('uiPlaceText'))
    uiViewText(
      $('uiPlaceText'),
      coord(state.lat, 'lat') + ' · ' + coord(state.lon, 'lon'),
    );
  if (!uiWorkspace) return;
  if ($('observationContext')) {
    const mode = state.body === 'sun' && state.manual ? '理想实验' : '日期观测';
    const translate = (value) =>
      window.skyTranslate ? window.skyTranslate(value) : value;
    const parts = [translate(mode), translate(selectedPlaceName()), state.date];
    if (state.body === 'sun' && state.manual) parts.pop();
    uiViewText($('observationContext'), parts.join(' · '));
  }
  const u = uiWorkspace,
    moon = state.body === 'moon',
    page = document.body.dataset.page;
  for (const { source, target } of u.metricNoteLabels || [])
    uiViewText(target, source.textContent);
  if (page === 'diagrams') {
    if (!moon) {
      u.pendingLunar = false;
      u.lunarRequested = false;
    }
    const allowed = window.SkySiteCatalog.availableViews(
      state.body,
      window.SkyCustomization?.active !== false,
    ).map((view) => view.id);
    const requested = window.SkySiteCatalog.availableViews(state.body).find(
      (view) => view.id === u.selected,
    );
    // Editing-only deep links remain pending while the ordinary workspace is shown.
    // Do not rewrite their route before the explicit customization switch is used.
    if (window.SkyCustomization?.active === false && requested?.editing)
      u.selected = 'contextPanel';
    if (!allowed.includes(u.selected)) {
      u.selected = 'contextPanel';
      if (window.SkyMotionHistory && !SkyMotionHistory.restoring)
        SkyMotionHistory.setRoute('#contextPanel');
      else history.replaceState(history.state, '', '#contextPanel');
    }
    // Keep the current diagram and its rail until the prepared lesson can replace both.
    if (u.selected === 'lunarOrbit' && !u.lunarReady) {
      u.pendingLunar = !u.lunarError;
      u.selected = allowed.includes(u.lastVisibleDiagram)
        ? u.lastVisibleDiagram
        : 'contextPanel';
    }
    u.lastVisibleDiagram = u.selected;
    u.tabs.querySelectorAll('button').forEach((b) => {
      const labels = window.SkySiteCatalog.label(b.dataset.routeDiagram, state.body);
      uiViewText(b, labels?.[document.documentElement.lang === 'en' ? 1 : 0] || '');
      uiViewHidden(b, !allowed.includes(b.dataset.routeDiagram));
      uiViewAttribute(b, 'aria-selected', String(b.dataset.routeDiagram === u.selected));
      uiViewAttribute(
        b,
        'tabindex',
        String(b.dataset.routeDiagram === u.selected ? 0 : -1),
      );
      if (b.dataset.routeDiagram === 'lunarOrbit')
        uiViewAttribute(b, 'aria-busy', String(!!u.pendingLunar));
    });
    if (u.lastRevealedTab !== u.selected) {
      const activeTab = u.tabs.querySelector('[aria-selected="true"]');
      if (activeTab)
        u.tabs.scrollLeft =
          activeTab.offsetLeft - (u.tabs.clientWidth - activeTab.offsetWidth) / 2;
      u.lastRevealedTab = u.selected;
    }
    if (window.skyWorkspacePresentation) window.skyWorkspacePresentation.sync();
    const visibleNodes = new Set();
    const chosen = {
      skyPanel: $('stage'),
      analemmaPanel: $('analemmaCanvas'),
      contextPanel: moon ? $('phaseContent') : $('sunContextContent'),
      chartPanel: $('chart'),
      riseSetPanel: $('eventCompass'),
      solarGeometryPanel: $('earthGeometry'),
      companionModule: $('companionSky'),
      lunarOrbit: $('lunarOrbitPanel'),
      solarStudy: $('solarStudyPanel'),
      sceneBuilder: $('sceneBuilderPanel'),
      skyTopPanel:$('skyTopPanel-surface'),skyHorizonPanel:$('skyHorizonPanel-surface'),skyObserverPanel:$('skyObserverPanel-surface'),
    }[u.selected];
    const lunar = moon && u.selected === 'lunarOrbit';
    u.plot.closest('.ui-shell').classList.toggle('ui-lunar-orbit', lunar);
    document.body.classList.toggle('lunar-orbit-active', lunar);
    if (u.lunarFrame) {
      if (moon && !u.lunarFrame.getAttribute('src')) {
        u.loadLunar();
      }
      if (u.lunarActive !== lunar) {
        u.lunarActive = lunar;
        u.lunarFrame.contentWindow?.postMessage(
          { type: 'skymotion:lunar-active', active: lunar },
          location.origin,
        );
      }
    }
    u.updateLunarNotice?.();
    const comparing = u.selected === 'solarCompare';
    for (const [id, node] of [
      ['contextPanel', $('phaseContent')],
      ['solarGeometryPanel', $('companionSky')],
    ]) {
      const target =
        moon && comparing ? u.cards[id].querySelector('.ui-diagram-surface') : u.plot;
      if (node.parentElement !== target) target.append(node);
    }
    const comparisonInfo = document.querySelector(
      '.ui-diagram-details[data-for="solarCompare"]',
    );
    if (comparisonInfo)
      for (const child of comparisonInfo.children)
        if (
          !child.classList.contains('workspace-note') &&
          child.id !== 'uiCompareSettings'
        )
          uiViewHidden(child, moon);
    for (const [id, card] of Object.entries(u.cards)) {
      const labels = window.SkySiteCatalog.label(id, state.body);
      const text = labels?.[document.documentElement.lang === 'en' ? 1 : 0] || '';
      uiViewText(card.querySelector('h2'), text);
    }
    for (const [id, card] of Object.entries(u.cards)) {
      const visible =
        (comparing &&
          (!window.skyWorkspacePresentation?.active ||
            window.skyWorkspacePresentation.visibleIds.has(id))) ||
        (id === u.selected &&
          (!moon || ['skyPanel', 'chartPanel', 'riseSetPanel'].includes(id) || window.SkyPerspectives?.isSky(id)));
      uiViewHidden(card, !visible);
      if (visible)
        visibleNodes.add(
          moon && id === 'contextPanel'
            ? $('phaseContent')
            : moon && id === 'solarGeometryPanel'
              ? $('companionSky')
              : card.querySelector('.ui-diagram-surface').firstElementChild,
        );
    }
    if (chosen) visibleNodes.add(chosen);
    u.nodes.forEach((n) => uiViewHidden(n, !visibleNodes.has(n)));
    u.plot.dataset.kind = u.selected;
    u.plot.closest('.ui-shell').classList.toggle('ui-solar-compare', comparing);
    if ($('uiEarthSettings')) $('uiEarthSettings').hidden = moon;
    u.details.forEach((n) => (n.hidden = n.dataset.for !== u.selected && !(n.dataset.for==='skyPanel' && window.SkyPerspectives?.isSky(u.selected))));
    if ($('uiEarthSettings')) {
      const home = comparing ? $('uiCompareSettings') : $('contextPanel');
      if ($('uiEarthSettings').parentElement !== home) home.append($('uiEarthSettings'));
    }
    // This page has diagram-specific controls, rather than the sky laboratory's menu.
    $('studyMenu').hidden = true;
    $('seasonMenu').hidden = true; // The shared date slider already covers the full year.
    $('solarDateModeMenu').hidden = true; // Playback basis is set in the time workbench.
    const skyVisible =
      (u.selected === 'skyPanel' || window.SkyPerspectives?.isSky(u.selected)) ||
      (comparing && [...(window.skyWorkspacePresentation?.visibleIds || [])].some(id=>id==='skyPanel'||window.SkyPerspectives?.isSky(id)));
    const showOverlay = !moon && (skyVisible || u.selected === 'chartPanel' || comparing);
    $('displayMenu').hidden = !showOverlay && !skyVisible;
    $('track').closest('label').hidden = !skyVisible;
    $('angles').closest('label').hidden = !skyVisible;
    $('shadowMenu').hidden = moon || !skyVisible;
    $('solarOverlayBar').hidden = !showOverlay;
    $('displayContextNote').hidden = true;
    uiViewText(
      $('displayMenu').querySelector('.menu-section-name'),
      skyVisible ? '显示辅助' : '曲线叠加',
    );
    uiViewText($('displaySummary'), '同一地点与时刻的太阳、月球');
    uiViewText($('modelMenu').querySelector('.menu-section-name'), '太阳计算方式');
    $('compareControl').hidden = moon || !(u.selected === 'chartPanel' || comparing);
    $('modelMenu').querySelector('.menu-divider').hidden = true;
    uiViewText($('reset'), '重置当前图解条件');
    uiViewText(u.title, (moon ? '月球' : '太阳') + ' · 实验台');
    window.SkyWorkbenchMenu?.sync();
    window.SkySceneBuilder?.sync();
    window.SkySolarStudy?.sync();
    window.SkyDiagramTools?.syncVisibility();
  }
}
(() => {
  const page = document.body.dataset.page;
  for (const a of document.querySelectorAll('.page-nav a')) {
    const target = new URL(a.href, location.href).pathname
      .replace(/\/$/, '')
      .split('/')
      .pop()
      .replace(/(?:\.en)?\.html$/, '')
      .replace(/\.en$/, '');
    if (target === (page === 'diagrams' ? 'lab' : page))
      a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  document.body.insertBefore(document.querySelector('.page-nav'), $('labShell'));
  const saved = SkyMotionSession.read();
  if (saved) {
    for (const body of ['sun', 'moon']) {
      Object.assign(
        modeStates[body],
        SkyMotionSession.sanitizeMode(saved[body], modeStates[body]),
      );
      if (!modeStates[body].manual)
        modeStates[body].dec = dateDec(modeStates[body].date, modeStates[body].lon);
    }
    state = modeStates[saved.body === 'moon' ? 'moon' : 'sun'];
    if (SkyMotionSession.inRange(saved.sundialLength, 0.06, 0.3))
      sundialLength = saved.sundialLength;
    sundialView = saved.sundialView === 'plate' ? 'plate' : 'device';
  }
  const returnBody = state.body;
  function save() {
    if (workbenchIsAnalemmaEntry() || page === 'sundial') {
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
      modeStates.sun.dec = dateDec(modeStates.sun.date, modeStates.sun.lon);
    }
    SkyMotionSession.write({
      body: (workbenchIsAnalemmaEntry() || page === 'sundial') ? returnBody : state.body,
      sun: modeStates.sun,
      moon: modeStates.moon,
      sundialLength,
      sundialView,
    });
  }
  window.addEventListener('pagehide', save);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) location.reload();
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('a[href]')) save();
  });
  if (page === 'diagrams' && location.hash === '#lunarOrbit') state = modeStates.moon;
  if (page === 'diagrams' && location.hash === '#sceneBuilder') state = modeStates.sun;
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
  link('helpBtn', 'docs.html', '文档中心');
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
  if (workbenchIsAnalemmaEntry() || page === 'sundial') {
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
  $('workbenchMore').querySelector('summary').textContent = '播放与快捷时刻';
  const bodySwitch = document.querySelector('.body-switch');
  shell.querySelector('.ui-body-host').append(bodySwitch);
  if (workbenchIsAnalemmaEntry() || page === 'sundial')
    shell.querySelector('.ui-body-host').hidden = true;
  rail.tabIndex = -1;
  function addPlace() {
    const label = document.createElement('label');
    label.className = 'ui-field';
    label.textContent = '观察地点';
    label.append($('place'));
    rail.append(label, $('coordinatesMenu'));
    $('coordinatesMenu').open = true;
  }
  if (page === 'sundial') {
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
      button.textContent = { 540: '09:00', 720: '正午', 900: '15:00' }[
        button.dataset.dialTime
      ];
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
    for (const n of document.querySelectorAll(
      '.sundial-make,.sundial-question,.sundial-key',
    )) {
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
    document.querySelector('label[for=solarDateLink] span').textContent =
      '日行迹采用当前真太阳时';
    document.querySelector('#displayMenu .menu-content').append($('solarOverlayBar'));
    // Keep the flat switches together; expandable settings follow at the bottom.
    document.querySelector('#displayMenu .menu-content').append($('shadowMenu'));
    const modelContent = document.querySelector('#modelMenu > .menu-content');
    modelContent.append(
      modelContent.querySelector('.menu-divider'),
      $('solarDateModeMenu'),
    );
    uiWorkspace = {
      title,
      plot,
      rail,
      details: [],
      selected:
        location.hash.slice(1) || document.body.dataset.entryView || 'contextPanel',
      moonPhase: true,
      nodes: [],
      cards: {},
    };
    bar.classList.add('ui-tabs');
    bar.setAttribute('role', 'tablist');
    uiWorkspace.tabs = bar;
    for (const [id, name] of [
      ['skyPanel', '天空与日影'],
      ['skyTopPanel','俯视日影'],['skyHorizonPanel','地平视角'],['skyObserverPanel','仰望天空'],
      ['analemmaPanel', '日行迹'],
      ['contextPanel', '地球 / 月相'],
      ['chartPanel', '变化曲线'],
      ['riseSetPanel', '升落方位'],
      ['solarGeometryPanel', '地轴与地平面'],
      ['companionModule', '行星伴月'],
      ['lunarOrbit', '地升地落'],
      ['solarCompare', '四图对照'],
      ['solarStudy', '地点与时间'],
      ['sceneBuilder', '搭建实验'],
    ]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.routeDiagram = id;
      b.textContent = name;
      b.setAttribute('role', 'tab');
      b.onclick = () => {
        uiWorkspace.pendingLunar = false;
        uiWorkspace.lunarRequested = id === 'lunarOrbit';
        uiWorkspace.selected = id;
        const entry = window.SkySiteCatalog.views.find((view) => view.id === id);
        if (entry?.sidebar)
          window.SkyDiagramTools?.selectSidebar(entry.sidebar, { open: false });
        if (id === 'companionModule') state.companion = true;
        if (id === 'lunarOrbit') stop();
        if (location.hash !== '#' + id) {
          if (window.SkyMotionHistory) SkyMotionHistory.setRoute('#' + id);
          else history.pushState(null, '', '#' + id);
        }
        if (id === 'lunarOrbit' && uiWorkspace.lunarReady) {
          renderUIWorkspace();
          uiWorkspace.lunarLesson?.paint();
        }
        schedule();
      };
      bar.append(b);
    }
    bar.addEventListener('keydown', (event) => {
      if (
        !event.target.matches('[role="tab"]') ||
        !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
      )
        return;
      event.preventDefault();
      const tabs = [...bar.querySelectorAll('[role="tab"]')].filter((tab) => !tab.hidden);
      const index = tabs.indexOf(event.target);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      tabs[next].click();
    });
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
    const lunarPanel = document.createElement('section');
    lunarPanel.id = 'lunarOrbitPanel';
    lunarPanel.hidden = true;
    lunarPanel.dataset.preparing = '';
    const lunarFrame = document.createElement('iframe');
    lunarFrame.title = '地升地落互动演示';
    lunarFrame.setAttribute('allow', 'fullscreen');
    const notice = document.createElement('aside');
    notice.className = 'lunar-load-notice';
    notice.dataset.i18nSkip = '';
    notice.setAttribute('role', 'status');
    notice.hidden = true;
    const noticeText = document.createElement('span');
    const retry = document.createElement('button');
    retry.type = 'button';
    notice.append(noticeText, retry);
    plot.append(notice);
    let loadTimer = 0,
      loadGeneration = 0;
    const syncLanguage = () =>
      lunarFrame.contentWindow?.postMessage(
        {
          type: 'skymotion:language-sync',
          language: document.documentElement.lang === 'en' ? 'en' : 'zh',
        },
        location.origin,
      );
    uiWorkspace.updateLunarNotice = () => {
      const english = document.documentElement.lang === 'en';
      const failed = uiWorkspace.lunarError;
      notice.hidden =
        state.body !== 'moon' ||
        !(uiWorkspace.pendingLunar || (failed && uiWorkspace.lunarRequested));
      noticeText.textContent = failed
        ? english
          ? 'Earthrise could not load. Check your connection and retry.'
          : '地升地落未能加载，请检查网络后重试。'
        : english
          ? 'Preparing Earthrise… You can keep using the current diagram.'
          : '正在准备地升地落，可继续操作当前图解。';
      retry.hidden = !failed;
      retry.textContent = english ? 'Retry' : '重试';
    };
    const failLunar = (generation) => {
      if (generation !== loadGeneration || uiWorkspace.lunarReady) return;
      clearTimeout(loadTimer);
      uiWorkspace.lunarError = true;
      uiWorkspace.pendingLunar = false;
      renderUIWorkspace();
    };
    uiWorkspace.loadLunar = () => {
      clearTimeout(loadTimer);
      const generation = ++loadGeneration;
      uiWorkspace.lunarError = false;
      uiWorkspace.lunarReady = false;
      // Discard adopted controls from a partial attempt before mounting a new document.
      uiWorkspace.lunarLesson?.pause();
      uiWorkspace.lunarLesson = null;
      document
        .querySelectorAll('.lunar-controls-host,.lunar-timeline-host')
        .forEach((node) => node.remove());
      lunarPanel.dataset.preparing = '';
      const lang =
        document.documentElement.lang === 'en' ? 'index.en.html' : 'index.html';
      lunarFrame.src = 'lunar/' + lang + '?embedded=1&attempt=' + generation;
      loadTimer = setTimeout(() => failLunar(generation), 15000);
      uiWorkspace.updateLunarNotice();
    };
    retry.onclick = () => {
      uiWorkspace.pendingLunar = true;
      uiWorkspace.loadLunar();
      renderUIWorkspace();
    };
    lunarFrame.addEventListener('load', () => {
      try {
        const attempt = new URL(lunarFrame.contentWindow.location.href).searchParams.get(
          'attempt',
        );
        if (
          attempt === String(loadGeneration) &&
          !lunarFrame.contentWindow.LunarOrbitLesson
        )
          failLunar(loadGeneration);
      } catch {
        failLunar(loadGeneration);
      }
      syncLanguage();
      lunarFrame.contentWindow?.postMessage(
        { type: 'skymotion:lunar-active', active: uiWorkspace.lunarActive === true },
        location.origin,
      );
    });
    document.addEventListener('skymotion:language', () => {
      syncLanguage();
      uiWorkspace.updateLunarNotice();
    });
    lunarPanel.append(lunarFrame);
    plot.append(lunarPanel);
    uiWorkspace.nodes.push(lunarPanel);
    uiWorkspace.lunarFrame = lunarFrame;
    uiWorkspace.lunarRequested = location.hash === '#lunarOrbit';
    window.addEventListener('message', (event) => {
      if (
        event.origin !== location.origin ||
        event.source !== lunarFrame.contentWindow ||
        event.data?.type !== 'skymotion:lunar-ready' ||
        event.data.attempt !== String(loadGeneration)
      )
        return;
      clearTimeout(loadTimer);
      uiWorkspace.lunarLesson = lunarFrame.contentWindow.LunarOrbitLesson;
      if (!uiWorkspace.lunarLesson) return;
      uiWorkspace.lunarReady = true;
      uiWorkspace.lunarError = false;
      delete lunarPanel.dataset.preparing;
      if (uiWorkspace.lunarSnapshot)
        uiWorkspace.lunarLesson.restore(uiWorkspace.lunarSnapshot);
      if (
        (uiWorkspace.pendingLunar || uiWorkspace.lunarRequested) &&
        state.body === 'moon'
      )
        uiWorkspace.selected = 'lunarOrbit';
      uiWorkspace.pendingLunar = false;
      syncLanguage();
      renderUIWorkspace();
      if (uiWorkspace.lunarActive) uiWorkspace.lunarLesson.paint();
    });

    // Reuse the same canvases in single and comparison views; no duplicate pipelines.
    for (const [id, nodeId, name] of [
      ['contextPanel', 'sunContextContent', '直射点与昼夜'],
      ['chartPanel', 'chart', '全天太阳高度'],
      ['riseSetPanel', 'eventCompass', '日出日落方位'],
      ['solarGeometryPanel', 'earthGeometry', '地轴与地平面'],
      ['skyPanel', 'stage', '天空与日影'],
      ['analemmaPanel', 'analemmaCanvas', '日行迹'],
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
      surface.className = 'ui-diagram-surface md-dark-surface';
      surface.append($(nodeId));
      card.append(header, surface);
      plot.append(card);
      uiWorkspace.cards[id] = card;
    }
    uiWorkspace.cards.skyPanel
      .querySelector('.ui-diagram-card-head')
      .append(document.querySelector('.view-tabs'));
    const comparisonDetails = document.createElement('div');
    comparisonDetails.className = 'ui-diagram-details';
    comparisonDetails.dataset.for = 'solarCompare';
    comparisonDetails.innerHTML =
      '<h2>四图对照</h2><p>四张图共用同一地点、日期和观测时刻。拖动下方时间或日期滑块，同时比较太阳高度、升落方位、昼夜分布与当地地平面。</p><p>拖动地球上的观察点可联动四图；拖动其他球面位置或地轴图只改变视角。移动地点可选择固定同一 UTC 瞬间或当地真太阳时，也可沿纬线或经线移动。地轴图中红色为地轴、紫色为赤道面、绿色为地平面、蓝色为天顶、黄色为太阳方向。点击上方单图标签可放大查看。</p><div id="uiCompareSettings"></div>';
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
    const skySettings = document.createElement('div');
    skySettings.className = 'ui-diagram-details';
    skySettings.dataset.for = 'skyPanel';
    const context = document.createElement('p');
    context.className = 'ui-observation-context';
    context.id = 'observationContext';
    const explanation = document.querySelector('.model-explanation');
    const modelDetails = document.createElement('details');
    modelDetails.className = 'ui-model-details';
    const modelSummary = document.createElement('summary');
    uiViewText(modelSummary, '计算与比例说明');
    modelDetails.append(modelSummary);
    const metrics = document.querySelector('.metrics');
    const metricNotes = document.createElement('dl');
    metricNotes.className = 'ui-metric-notes';
    uiWorkspace.metricNoteLabels = [];
    for (const article of metrics.children) {
      const source = article.querySelector(
        ':scope > span, .metric-definition summary span',
      );
      const note = article.querySelector('small');
      if (!source || !note) continue;
      const target = document.createElement('dt');
      const description = document.createElement('dd');
      uiViewText(target, source.textContent);
      description.append(note);
      metricNotes.append(target, description);
      uiWorkspace.metricNoteLabels.push({ source, target });
    }
    modelDetails.append(metricNotes);
    for (const id of ['modelNote', 'plotNote', 'shadowScale', 'shadowTraceNote']) {
      const paragraph = document.getElementById(id);
      if (paragraph) modelDetails.append(paragraph);
    }
    explanation.append(modelDetails);
    skySettings.append(context, metrics, explanation);
    rail.prepend(skySettings);
    uiWorkspace.details.push(skySettings);
    const annualSettings = document.createElement('div');
    annualSettings.className = 'ui-diagram-details';
    annualSettings.dataset.for = 'analemmaPanel';
    for (const selector of [
      '.analemma-controls',
      '.analemma-comparison',
      '.analemma-advanced',
    ]) {
      const node = document.querySelector(selector);
      if (node) annualSettings.append(node);
    }
    rail.prepend(annualSettings);
    uiWorkspace.details.push(annualSettings);
    uiWorkspace.analemmaClockLinked = false;
    const earthSettings = document.createElement('div');
    earthSettings.id = 'uiEarthSettings';
    earthSettings.append(
      document.querySelector('.context-view-switch'),
      document.querySelector('.globe-notes'),
    );
    $('contextPanel').append(earthSettings);
    if (uiWorkspace.selected === 'companionModule') state.companion = true;
    $('lunarSkyDetails').open = true;
    if (page === 'diagrams') {
      const restoreDiagram = () => {
        uiWorkspace.selected =
          location.hash.slice(1) || document.body.dataset.entryView || 'contextPanel';
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
    drawerGeneration = 0,
    previousDrawerMobile = drawerMedia.matches;
  const lowMotion = matchMedia('(prefers-reduced-motion:reduce)');
  function animateDrawer(frames, duration) {
    drawerAnimation?.cancel();
    drawerAnimation = lowMotion.matches
      ? null
      : SkyMotionUI.springPanel(drawer, frames, duration);
    return drawerAnimation?.finished.catch(() => {}) || Promise.resolve();
  }
  function finishDrawerClose(restoreFocus = true) {
    drawerGeneration++;
    drawerAnimation?.cancel();
    drawer.style.transform = '';
    if (drawer.open) drawer.close();
    window.SkyDiagramTools?.syncVisibility();
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
    updateParameterPresentation();
    if (drawer.open) return;
    stop();
    // Opening controls changes playback UI, not the scientific image.
    renderTimeWorkbench();
    drawerReturnFocus = document.activeElement;
    $('uiDrawerTitle').textContent = title.textContent;
    drawer.showModal();
    parameterButton.setAttribute('aria-expanded', 'true');
    animateDrawer(
      [{ transform: 'translateX(-100%)' }, { transform: 'translateX(0)' }],
      220,
    );
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
    const shouldClose =
      event.type === 'pointerup' && swipe.dx < -65 && Math.abs(swipe.dy) < 40;
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
    const mobile = drawerMedia.matches,
      changed = mobile !== previousDrawerMobile,
      focusWasInMovingContent =
        rail.contains(document.activeElement) ||
        drawer.contains(document.activeElement) ||
        document.activeElement === parameterButton;
    previousDrawerMobile = mobile;
    const atDestination = drawerMedia.matches
      ? rail.parentElement === drawer
      : rail.parentElement === drawerHome.parentElement;
    if (!atDestination) {
      finishDrawerClose(false);
      if (drawerMedia.matches) drawer.append(rail);
      else drawerHome.after(rail);
    }
    if (changed && focusWasInMovingContent) {
      requestAnimationFrame(() => {
        const target = mobile
          ? parameterButton
          : document.querySelector('.motion-menu-edge:not([hidden])') ||
            document.querySelector('.motion-menu-grip:not([hidden])');
        if (
          target?.isConnected &&
          !target.closest('[inert]') &&
          target.getClientRects().length
        )
          target.focus({ preventScroll: true });
      });
    }
    schedule();
  }
  drawerMedia.addEventListener('change', updateParameterPresentation);
  updateParameterPresentation();
  shell.skyRailSync = SkyMotionUI.installRail({
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
