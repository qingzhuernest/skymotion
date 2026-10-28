/**
 * 图形下方的时间工作台；同步日期、时刻和播放控件。
 */
/* One reachable time control surface; scientific state remains mode-specific. */
function workbenchIsAnalemmaEntry() {
  return document.body.dataset.entryView === 'analemmaPanel';
}
let workbenchLastBody = null;
function workbenchBasis() {
  if (workbenchIsAnalemmaEntry()) return 'date';
  return state.body === 'moon'
    ? state.moonDayPlayback
      ? 'day'
      : 'date'
    : state.solarDateMode && !state.manual
      ? 'date'
      : 'day';
}
function workbenchTimeMax() {
  if (workbenchIsAnalemmaEntry()) return 1439;
  return state.body === 'sun' && state.solarDateMode && !state.manual ? 1439 : 1440;
}
function workbenchSetTime(value) {
  stop();
  state[workbenchIsAnalemmaEntry() ? 'analemmaClock' : 'time'] = clamp(
    Number(value) || 0,
    0,
    workbenchTimeMax(),
  );
  schedule();
}
function workbenchShiftDate(delta) {
  if (state.body === 'sun' && state.manual) return;
  stop();
  if (shiftDay(delta) && state.body === 'sun') state.dec = dateDec(state.date);
  schedule();
}
function workbenchSetBasis(basis) {
  if (workbenchIsAnalemmaEntry()) return;
  stop();
  if (state.body === 'moon') state.moonDayPlayback = basis === 'day';
  else if (!state.manual) enableSolarDateMode(basis === 'date');
  schedule();
}
function workbenchPlay() {
  if (workbenchIsAnalemmaEntry()) {
    $('analemmaPlay').onclick();
    return;
  }
  const basis = workbenchBasis();
  if (state.playing) {
    stop();
    schedule();
    return;
  }
  if (basis === 'date') {
    if (state.body === 'moon') $('moonPlay').onclick();
    else $('solarDatePlay').onclick();
  } else {
    stop();
    if (state.time >= 1440) state.time = 0;
    state.playing = true;
    motionLast = 0;
    schedule();
  }
}
function workbenchIsPlaying() {
  return workbenchIsAnalemmaEntry() ? analemmaPlaying : state.playing;
}
function renderTimeWorkbench() {
  const root = $('timeWorkbench');
  if (!root) return;
  const moon = state.body === 'moon',
    ideal = !moon && state.manual,
    observer =
      (document.body.dataset.page === 'lab' ||
        (typeof uiWorkspace !== 'undefined' &&
          (uiWorkspace?.selected === 'skyPanel' ||
            window.skyWorkspacePresentation?.visibleIds.has('skyPanel')))) &&
      state.view === 'observer' &&
      (state.body === 'sun' || !uiWorkspace?.moonPhase),
    basis = workbenchBasis(),
    datePanel = $('workbenchDatePanel'),
    dateHome = $('workbenchMain');
  const clockPanel = $('workbenchClockPanel');
  if (moon) {
    if (datePanel.nextElementSibling !== clockPanel)
      dateHome.insertBefore(datePanel, clockPanel);
  } else if (datePanel !== dateHome.lastElementChild) dateHome.append(datePanel);
  root.dataset.observationBody = state.body;
  if (workbenchLastBody !== state.body) {
    $('workbenchMore').open = false;
    workbenchLastBody = state.body;
  }
  root.dataset.observer = String(observer);
  root.dataset.basis = basis;
  root.dataset.ideal = String(ideal);
  $('workbenchBearingPanel').hidden = !observer;
  datePanel.hidden = ideal;
  $('workbenchDate').disabled = ideal;
  $('workbenchPrevDate').disabled = ideal || state.date === '1900-01-01';
  $('workbenchNextDate').disabled = ideal || state.date === '2100-12-31';
  if (document.activeElement !== $('workbenchDate'))
    $('workbenchDate').value = state.date;
  $('workbenchContext').textContent = moon
    ? '月球 · ' + (basis === 'date' ? '日期变化' : '一天内的时间变化')
    : ideal
      ? '太阳 · 理想实验'
      : basis === 'date'
        ? '太阳 · 日期变化'
        : '太阳 · 一天内的时间变化';
  window.SkyMaterial.setValue($('workbenchBasis'), basis);
  $('workbenchBasis').querySelector('[value="date"]').disabled = ideal;
  const analemmaPage = workbenchIsAnalemmaEntry(),
    clock = analemmaPage ? state.analemmaClock : state.time;
  $('workbenchClockLabel').textContent =
    basis === 'date' && !(moon && elementVisible($('phaseOrbit')))
      ? '固定观测时刻 · 当地真太阳时'
      : '观测时刻 · 当地真太阳时';
  $('workbenchClockText').textContent = hhmm(clock, true);
  $('workbenchClockText').hidden = clock < 1440;
  $('workbenchClockInput').hidden = clock >= 1440;
  const max = workbenchTimeMax();
  $('workbenchTime').max = max;
  $('workbenchTime').value = clock;
  $('workbenchTime').setAttribute('aria-valuetext', hhmm(clock, true) + ' 当地真太阳时');
  if (document.activeElement !== $('workbenchClockInput'))
    $('workbenchClockInput').value = clock >= 1440 ? '' : hhmm(Math.floor(clock));
  $('workbenchTimeBack').disabled = clock <= 0;
  $('workbenchTimeForward').disabled = clock >= max;
  if (analemmaPage)
    $('workbenchClockLabel').textContent =
      '固定观测时刻 · ' + (state.analemmaBasis === 'clock' ? '钟表时' : '真太阳时');
  $('workbenchMonthTools').hidden = !moon;
  if (document.activeElement !== $('workbenchMonth'))
    $('workbenchMonth').value = state.date.slice(0, 7);
  $('workbenchPrevMonth').disabled = state.date.slice(0, 7) === '1900-01';
  $('workbenchNextMonth').disabled = state.date.slice(0, 7) === '2100-12';
  $('workbenchBearing').value = state.observerAz ?? 180;
  $('workbenchBearingText').textContent =
    Math.round(state.observerAz ?? 180) + '° · ' + heading(state.observerAz ?? 180);
  const year = Number(state.date.slice(0, 4)),
    span = moon ? monthDays(state.date) : yearLength(year),
    selected = moon ? Number(state.date.slice(8)) : yearDay(state.date);
  $('workbenchDay').max = span;
  $('workbenchDay').value = selected;
  $('workbenchDay').setAttribute('aria-valuetext', state.date);
  $('workbenchDayLabel').textContent = moon ? '日期 · 本月' : '日期 · 本年';
  $('workbenchDayText').textContent = state.date.slice(5).replace('-', '月') + '日';
  $('workbenchDayStart').textContent = moon ? '1日' : '1月';
  $('workbenchDayMiddle').textContent = moon ? Math.ceil(span / 2) + '日' : '7月';
  $('workbenchDayEnd').textContent = moon ? span + '日' : '12月';
  const rate = $('workbenchSpeed'),
    rateKey = basis + ':' + state.body,
    choices =
      basis === 'day'
        ? [
            [20, '慢速'],
            [60, '常速'],
            [180, '快速'],
          ]
        : moon
          ? [
              [0.5, '0.5 天/秒'],
              [1, '1 天/秒'],
              [3, '3 天/秒'],
            ]
          : [
              [1, '1 天/秒'],
              [3, '3 天/秒'],
              [10, '10 天/秒'],
            ];
  if (rate.dataset.key !== rateKey) {
    rate.replaceChildren(
      ...choices.map(([v, label]) => {
        const option = document.createElement('option');
        option.value = v;
        option.textContent = label;
        return option;
      }),
    );
    rate.dataset.key = rateKey;
  }
  window.SkyMaterial.setValue(rate, basis === 'day' ? state.speed : moon ? state.daysRate : state.solarDateRate);
  $('workbenchLoop').checked =
    basis === 'day' ? state.loop : moon ? state.monthLoop : state.solarDateLoop;
  $('workbenchLoopLabel').textContent =
    basis === 'day' ? '循环当天' : moon ? '循环本月' : '循环本年';
  const playLabel = analemmaPage
    ? analemmaPlaying
      ? '⏸ 暂停'
      : '▶ 逐日播放'
    : state.playing
      ? '⏸ 暂停'
      : basis === 'day'
        ? '▶ 播放时刻'
        : !moon && state.date.endsWith('12-31') && !state.solarDateLoop
          ? '▶ 从年初播放'
          : '▶ 按天播放';
  // Keep the button's text node stable while frames update, including during a pointer press.
  const displayPlayLabel = (
    window.skyTranslate ? window.skyTranslate(playLabel) : playLabel
  ).replace(/^[▶⏸]\s*/, '');
  if ($('workbenchPlay').textContent !== displayPlayLabel)
    $('workbenchPlay').textContent = displayPlayLabel;
  $('workbenchPlay').setAttribute('aria-pressed', String(workbenchIsPlaying()));
  $('workbenchPlay').setAttribute('aria-label', displayPlayLabel);
  $('workbenchPlay').title = displayPlayLabel;
  $('workbenchHint').textContent = ideal
    ? '日期不参与理想实验；拖动时刻观察太阳与日影。'
    : basis === 'date'
      ? '日期播放保持观测时刻不变；拖动时刻滑块可随时调整这个固定时刻。'
      : '时刻播放保持日期不变；日期可用日历或日期滑块单独选择。';
  if (document.body.dataset.page === 'sundial')
    $('workbenchContext').textContent =
      '日晷 · ' + (basis === 'date' ? '固定时刻比较日期' : '一天内的影子变化');
  if (analemmaPage) {
    $('workbenchContext').textContent = '日行迹 · 全年同一时刻';
    $('workbenchBasis').disabled = true;
    $('workbenchHint').textContent =
      '逐日播放为 20 天/秒；时刻采用上方选择的时间依据，独立于主实验台。';
  }
  // ResizeObserver updates dock size; avoid forcing layout on every slider frame.
  if ($('workbenchMore').open) {
    const day = bodyDay();
    for (const [suffix, key] of [
      ['Rise', 'rise'],
      ['Peak', 'peak'],
      ['Set', 'set'],
    ]) {
      const b = $('workbench' + suffix),
        time = day[key];
      b.disabled = time === null;
      b.textContent =
        (key === 'rise'
          ? moon
            ? '月出'
            : '日出'
          : key === 'set'
            ? moon
              ? '月落'
              : '日落'
            : '当日最高') +
        ' ' +
        (time === null ? '当日无' : hhmm(time, true));
    }
  }
}
function initTimeWorkbench() {
  document.body.classList.add('has-time-workbench');
  $('workbenchTime').oninput = (e) => workbenchSetTime(e.target.value);
  $('workbenchClockInput').onchange = (e) => {
    if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(e.target.value)) {
      const [hour, minute] = e.target.value.split(':').map(Number);
      workbenchSetTime(hour * 60 + minute);
    } else schedule();
  };
  for (const [id, amount] of [
    ['workbenchTimeBack', -5],
    ['workbenchTimeForward', 5],
  ])
    $(id).onclick = () =>
      workbenchSetTime(
        (workbenchIsAnalemmaEntry() ? state.analemmaClock : state.time) +
          amount,
      );
  $('workbenchMonth').onchange = (e) => {
    selectMonth(e.target.value);
    e.target.value = state.date.slice(0, 7);
    schedule();
  };
  $('workbenchPrevMonth').onclick = () => {
    stop();
    $('moonPrevMonth').onclick();
  };
  $('workbenchNextMonth').onclick = () => {
    stop();
    $('moonNextMonth').onclick();
  };
  $('workbenchDate').onchange = (e) => {
    setDate(e.target.value);
    e.target.value = state.date;
    schedule();
  };
  $('workbenchPrevDate').onclick = () => workbenchShiftDate(-1);
  $('workbenchNextDate').onclick = () => workbenchShiftDate(1);
  $('workbenchDay').oninput = (e) =>
    setDate(
      state.body === 'moon'
        ? state.date.slice(0, 7) + '-' + String(e.target.value).padStart(2, '0')
        : dateAtYearDay(Number(state.date.slice(0, 4)), Number(e.target.value)),
    );
  $('workbenchBasis').onchange = (e) => workbenchSetBasis(e.target.value);
  const playButton = $('workbenchPlay');
  let pausedOnPress = false;
  playButton.addEventListener('pointerdown', (event) => {
    pausedOnPress = false;
    if (!event.isPrimary || event.button !== 0 || !workbenchIsPlaying()) return;
    // Pause immediately; a delayed or cancelled click cannot let the clock keep advancing.
    stop();
    renderTimeWorkbench();
    schedule();
    pausedOnPress = true;
  });
  playButton.onclick = (event) => {
    if (pausedOnPress && event.detail !== 0) {
      pausedOnPress = false;
      return;
    }
    pausedOnPress = false;
    workbenchPlay();
  };
  $('workbenchSpeed').onchange = (e) => {
    const value = Number(e.target.value);
    if (workbenchBasis() === 'day') state.speed = value;
    else if (state.body === 'moon') state.daysRate = value;
    else state.solarDateRate = value;
    schedule();
  };
  $('workbenchLoop').onchange = (e) => {
    if (workbenchBasis() === 'day') state.loop = e.target.checked;
    else if (state.body === 'moon') state.monthLoop = e.target.checked;
    else state.solarDateLoop = e.target.checked;
    schedule();
  };
  $('workbenchBearing').oninput = (e) => {
    state.observerAz = Number(e.target.value);
    schedule();
  };
  document.querySelectorAll('[data-workbench-look]').forEach(
    (b) =>
      (b.onclick = () => {
        state.observerAz = Number(b.dataset.workbenchLook);
        schedule();
      }),
  );
  for (const [id, key] of [
    ['workbenchRise', 'rise'],
    ['workbenchPeak', 'peak'],
    ['workbenchSet', 'set'],
  ])
    $(id).onclick = () => {
      const time = bodyDay()[key];
      if (time !== null) workbenchSetTime(time);
    };
  $('workbenchMore').addEventListener('toggle', () => {
    if ($('workbenchMore').open) renderTimeWorkbench();
  });
  // Populate shortcuts before the fold controller measures its expanded height.
  $('workbenchMore').addEventListener('motion-disclosure-opening', renderTimeWorkbench);
  for (const id of ['workbenchClockInput', 'workbenchDate', 'workbenchMonth'])
    $(id).addEventListener('focus', () => {
      if (state.playing || analemmaPlaying) {
        stop();
        schedule();
      }
    });
  const oldMoonPlay = $('moonPlay').onclick;
  $('moonPlay').onclick = () => {
    state.moonDayPlayback = false;
    oldMoonPlay();
  };
  const resize = new ResizeObserver((entries) => {
    const h =
      entries[0].borderBoxSize?.[0]?.blockSize ||
      entries[0].target.getBoundingClientRect().height;
    if (h > 0)
      document.documentElement.style.setProperty(
        '--time-workbench-space',
        Math.ceil(h + 24) + 'px',
      );
  });
  resize.observe($('timeWorkbench'));
}
