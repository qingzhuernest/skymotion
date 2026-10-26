/** Input handlers and form presentation; scientific calculations remain in the model modules. */
'use strict';
function setDate(v) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    isNaN(new Date(v + 'T12:00:00Z')) ||
    new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) !== v ||
    v < '1900-01-01' ||
    v > '2100-12-31'
  ) {
    $('date').value = state.date;
    return;
  }
  stop();
  state.date = v;
  state.manual = false;
  if (state.body === 'sun') state.dec = dateDec(v);
  $('date').value = v;
  schedule();
}
function stop() {
  analemmaPlaying = false;
  analemmaAccumulator = 0;
  settleMotion();
  state.playing = false;
  lunarAccumulator = 0;
  solarDateAccumulator = 0;
  $('play').textContent = '▶ 播放';
  $('moonPlay').textContent = '▶ 逐日播放';
}
['lat', 'lon'].forEach((k) =>
  $(k).addEventListener('input', (e) => {
    stop();
    chooseMapObserver(
      { lat: state.lat, lon: state.lon, [k]: +e.target.value },
      { constraint: false },
    );
  }),
);
$('place').addEventListener('change', (e) => {
  stop();
  const select = e.target,
    option = select.options[select.selectedIndex],
    values = option?.value.split(',').map(Number);
  if (
    !option ||
    option.value === 'custom' ||
    values.length !== 2 ||
    !values.every(Number.isFinite) ||
    Math.abs(values[0]) > 90 ||
    Math.abs(values[1]) > 180
  ) {
    state.place = 'custom';
    select.value = 'custom';
    schedule();
    return;
  }
  const selectedPlace = option.value;
  if (
    chooseMapObserver({ lat: values[0], lon: values[1] }, { constraint: false }) === false
  )
    return;
  state.place = selectedPlace;
  select.value = selectedPlace;
  $('lat').value = state.lat;
  $('lon').value = state.lon;
  schedule();
});
$('date').addEventListener('change', (e) => {
  if (e.target.value) setDate(e.target.value);
});
solarSeasonButtons.forEach(
  (b) =>
    (b.onclick = () =>
      setDate(seasonDate(Number(b.dataset.angle), Number(b.dataset.month)))),
);
$('dec').addEventListener('input', (e) => {
  stop();
  state.dec = +e.target.value;
  state.manual = true;
  schedule();
});
$('time').addEventListener('input', (e) => {
  state.time = +e.target.value;
  stop();
  schedule();
});
['track', 'shadow', 'compare', 'angles'].forEach(
  (k) =>
    ($(k).onchange = (e) => {
      state[k] = e.target.checked;
      schedule();
    }),
);
$('height').onchange = (e) => {
  stop();
  state.height = clamp(Number(e.target.value) || 1, 0.1, 10);
  e.target.value = state.height;
  schedule();
};
document.querySelectorAll('[data-view]').forEach(
  (b) =>
    (b.onclick = () => {
      if(window.SkyPerspectives?.select(b.dataset.view)) return;
      state.view = b.dataset.view;
      document
        .querySelectorAll('[data-view]')
        .forEach((x) => x.classList.toggle('active', x === b));
      schedule();
    }),
);
$('viewReset').onclick = () => {
  state.observerAz = 180;
  state.yaw = -0.55;
  state.pitch = 0.38;
  state.zoom = 1;
  schedule();
};
$('reset').onclick = () => {
  stop();
  Object.assign(state, state.body === 'moon' ? initialMoon : initialSun);
  if (state.body === 'sun') {
    sundialLength = 0.18;
    sundialView = 'device';
  }
  syncControls();
  schedule();
};
$('goRise').onclick = () => {
  state.time = bodyDay().rise;
  stop();
  schedule();
};
$('goSet').onclick = () => {
  state.time = bodyDay().set;
  stop();
  schedule();
};
$('goNoon').onclick = () => {
  state.time = clamp(bodyDay().peak, 0, 1440);
  stop();
  schedule();
};
let solarLast = 0,
  lunarLast = 0,
  lunarAccumulator = 0;
$('play').onclick = () => {
  analemmaPlaying = false;
  analemmaAccumulator = 0;
  if (!state.playing && state.time >= 1440) state.time = 0;
  state.playing = !state.playing;
  if (!state.playing) settleMotion();
  motionLast = 0;
  solarLast = 0;
  $('play').textContent = state.playing ? 'Ⅱ 暂停' : '▶ 播放';
  schedule();
};
$('speed').onchange = (e) => (state.speed = +e.target.value);
$('loop').onchange = (e) => (state.loop = e.target.checked);
document.addEventListener('visibilitychange', () => {
  solarLast = 0;
  lunarLast = 0;
});
let drag = null;
$('sky').addEventListener('pointerdown', (e) => {
  if (drag || e.button !== 0 || !['orbit', 'observer'].includes((window.SkyPerspectives?.primaryView() || state.view))) return;
  drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
  $('sky').setPointerCapture(e.pointerId);
});
$('sky').addEventListener('pointermove', (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  if ((window.SkyPerspectives?.primaryView() || state.view) === 'observer') {
    state.observerAz =
      ((state.observerAz ?? 180) - (e.clientX - drag.x) * 0.35 + 360) % 360;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    schedule();
    return;
  }
  state.yaw += (e.clientX - drag.x) * 0.008;
  state.pitch = clamp(state.pitch + (e.clientY - drag.y) * 0.006, 0.05, 1.45);
  drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
  schedule();
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach((event) =>
  $('sky').addEventListener(event, (e) => {
    if (drag?.id === e.pointerId) drag = null;
  }),
);
window.addEventListener('blur', () => {
  drag = null;
});
$('sky').addEventListener(
  'wheel',
  (e) => {
    if (['horizon', 'observer'].includes((window.SkyPerspectives?.primaryView() || state.view))) return;
    e.preventDefault();
    state.zoom = clamp(state.zoom - e.deltaY * 0.0008, 0.65, 1.35);
    schedule();
  },
  { passive: false },
);
$('sky').onkeydown = (e) => {
  if ((window.SkyPerspectives?.primaryView() || state.view) === 'observer' && ['ArrowLeft', 'ArrowRight', 'Home'].includes(e.key)) {
    e.preventDefault();
    state.observerAz =
      e.key === 'Home'
        ? 180
        : ((state.observerAz ?? 180) + (e.key === 'ArrowRight' ? 5 : -5) + 360) % 360;
    schedule();
    return;
  }
  if ((window.SkyPerspectives?.primaryView() || state.view) !== 'orbit') return;
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  e.preventDefault();
  if (e.key === 'ArrowLeft') state.yaw -= 0.1;
  if (e.key === 'ArrowRight') state.yaw += 0.1;
  if (e.key === 'ArrowUp') state.pitch = clamp(state.pitch - 0.1, 0.05, 1.45);
  if (e.key === 'ArrowDown') state.pitch = clamp(state.pitch + 0.1, 0.05, 1.45);
  schedule();
};
initGlobeOptions();
const globe = $('globe');
let globeDrag = null,
  globeMoved = false;
globe.removeAttribute('title');
globe.style.cursor = 'grab';
globe.style.touchAction = 'none';
globe.setAttribute('aria-label', '地球昼夜图；拖动旋转并同步改变观察地点，点击选择地点');
function globeLocationAt(x, y, g) {
  let X = (x - g.cx) / g.r,
    Y = -(y - g.cy) / g.r;
  const distance = Math.hypot(X, Y);
  if (distance > 1) {
    X /= distance;
    Y /= distance;
  }
  const Z = Math.sqrt(Math.max(0, 1 - X * X - Y * Y)),
    lat = Math.asin(clamp(Y * Math.cos(g.p) + Z * Math.sin(g.p), -1, 1)) * deg,
    lon = g.lon + Math.atan2(X, Z * Math.cos(g.p) - Y * Math.sin(g.p)) * deg;
  return { lat, lon: ((lon + 540) % 360) - 180 };
}
function globeObserverPoint(g) {
  const p = state.lat * rad,
    d = (state.lon - g.lon) * rad;
  return {
    x: g.cx + g.r * Math.cos(p) * Math.sin(d),
    y:
      g.cy -
      g.r * (Math.sin(p) * Math.cos(g.p) - Math.cos(p) * Math.sin(g.p) * Math.cos(d)),
    visible: Math.sin(p) * Math.sin(g.p) + Math.cos(p) * Math.cos(g.p) * Math.cos(d) >= 0,
  };
}
globe.tabIndex = 0;
globe.addEventListener('pointerdown', (e) => {
  if (state.body === 'moon' || !e.isPrimary || e.button !== 0) return;
  const box = globe.getBoundingClientRect(),
    g = globeGeometry(box.width, box.height),
    x = (e.clientX - box.left - g.cx) / g.r,
    y = (e.clientY - box.top - g.cy) / g.r;
  if (x * x + y * y > 1) return;
  globeMoved = false;
  const observer = globeObserverPoint(g),
    direct =
      state.globeDragMode === 'view' &&
      observer.visible &&
      Math.hypot(e.clientX - box.left - observer.x, e.clientY - box.top - observer.y) <=
        18;
  const before = Object.fromEntries(
    [
      'lat',
      'lon',
      'date',
      'time',
      'place',
      'dec',
      'globeCameraLat',
      'globeCameraLon',
      'globeCameraReady',
    ].map((k) => [k, state[k]]),
  );
  if (direct) {
    state.globeCameraLat = g.p * deg;
    state.globeCameraLon = g.lon;
    state.globeCameraReady = true;
  }
  globeDrag = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    lat: g.p * deg,
    lon: g.l * deg,
    mode: direct ? 'observer' : state.globeDragMode,
    before,
    g,
    instant: instantUTC().getTime(),
    scale: 90 / g.r,
  };
  stop();
  globe.setPointerCapture(e.pointerId);
  globe.style.cursor = 'grabbing';
});
globe.addEventListener('pointermove', (e) => {
  if (!globeDrag || e.pointerId !== globeDrag.id) return;
  const dx = e.clientX - globeDrag.x,
    dy = e.clientY - globeDrag.y;
  if (!globeMoved && Math.hypot(dx, dy) < 3) return;
  globeMoved = true;
  if (globeDrag.mode === 'observer') {
    const box = globe.getBoundingClientRect();
    chooseMapObserver(
      globeLocationAt(e.clientX - box.left, e.clientY - box.top, globeDrag.g),
      {
        instant: globeDrag.instant,
        origin: globeDrag.before,
      },
    );
    return;
  }
  const lat = clamp(globeDrag.lat + dy * globeDrag.scale, -90, 90),
    lon = ((((globeDrag.lon - dx * globeDrag.scale + 180) % 360) + 360) % 360) - 180;
  if (globeDrag.mode === 'location') {
    chooseMapObserver(
      { lat, lon },
      { instant: globeDrag.instant, origin: globeDrag.before },
    );
  } else {
    state.globeCameraLat = lat;
    state.globeCameraLon = lon;
    state.globeCameraReady = true;
  }
  schedule();
});
const endGlobeDrag = (e) => {
  if (!globeDrag || e.pointerId !== globeDrag.id) return;
  if (e.type === 'pointercancel' && globeDrag.mode === 'observer') {
    Object.assign(state, globeDrag.before);
    schedule();
  }
  globeDrag = null;
  globe.style.cursor = 'grab';
  if (globe.hasPointerCapture(e.pointerId)) globe.releasePointerCapture(e.pointerId);
};
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
  globe.addEventListener(type, endGlobeDrag);
globe.onclick = (e) => {
  if (state.body === 'moon' || globeMoved) return;
  const b = $('globe').getBoundingClientRect(),
    g = globeGeometry(b.width, b.height),
    x = (e.clientX - b.left - g.cx) / g.r,
    y = -(e.clientY - b.top - g.cy) / g.r;
  if (x * x + y * y > 1) return;
  chooseMapObserver(globeLocationAt(e.clientX - b.left, e.clientY - b.top, g));
};
globe.addEventListener('keydown', (e) => {
  if (state.body !== 'sun') return;
  if (e.key === 'Escape' && globeDrag?.mode === 'observer') {
    e.preventDefault();
    endGlobeDrag({ pointerId: globeDrag.id, type: 'pointercancel' });
    return;
  }
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  const step = e.shiftKey ? 5 : 1;
  chooseMapObserver({
    lat: clamp(
      state.lat + (e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0),
      -90,
      90,
    ),
    lon:
      ((state.lon +
        (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0) +
        540) %
        360) -
      180,
  });
});
for (const type of ['blur', 'resize'])
  window.addEventListener(type, () => {
    if (globeDrag?.mode === 'observer')
      endGlobeDrag({ pointerId: globeDrag.id, type: 'pointercancel' });
  });
$('helpBtn').onclick = () => {
  stop();
  $('help').showModal();
};
$('closeHelp').onclick = $('startExplore').onclick = () => $('help').close();
$('help').onclick = (e) => {
  if (e.target === $('help')) {
    const r = $('help').getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      $('help').close();
  }
};
$('fullBtn').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    $('fullBtn').textContent = '浏览器未支持全屏';
  }
};
function selectObservationBody(body) {
  if (!Object.hasOwn(modeStates, body) || state.body === body) return;
  stop();
  state = modeStates[body];
  state.playing = false;
  lunarAccumulator = 0;
  solarLast = lunarLast = 0;
  syncControls();
  // Body selection is a mode boundary, not a continuous slider gesture. Finish
  // swapping body-owned views and layout buckets before the next action runs.
  render();
}
const observationBodyButtons = [...document.querySelectorAll('.body-switch [data-body]')];
for (const button of observationBodyButtons)
  button.onclick = () => selectObservationBody(button.dataset.body);
$('observationBody').addEventListener('keydown', (event) => {
  if (
    !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) ||
    !event.target.matches('[data-body]')
  )
    return;
  event.preventDefault();
  const index = observationBodyButtons.indexOf(event.target);
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? observationBodyButtons.length - 1
        : (index +
            (event.key === 'ArrowRight' ? 1 : -1) +
            observationBodyButtons.length) %
          observationBodyButtons.length;
  observationBodyButtons[next].focus();
  observationBodyButtons[next].click();
});
['lat', 'lon'].forEach((k) =>
  $(k + 'Input').addEventListener('change', (e) => {
    stop();
    const limit = k === 'lat' ? 90 : 180,
      value = e.target.value.trim() === '' ? state[k] : Number(e.target.value);
    state[k] = clamp(Number.isFinite(value) ? value : state[k], -limit, limit);
    e.target.value = state[k].toFixed(1);
    $(k).value = state[k];
    state.place = 'custom';
    $('place').value = 'custom';
    schedule();
  }),
);
$('restoreDate').onclick = () => setDate(state.date);
document.querySelectorAll('[data-model]').forEach(
  (b) =>
    (b.onclick = () => {
      stop();
      state.manual = b.dataset.model === 'ideal';
      if (!state.manual) state.dec = dateDec(state.date);
      schedule();
    }),
);
for (const [id, delta] of [
  ['prevDay', -1],
  ['nextDay', 1],
])
  $(id).onclick = () => {
    const d = new Date(state.date + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + delta);
    const date = d.toISOString().slice(0, 10);
    if (date >= '1900-01-01' && date <= '2100-12-31') setDate(date);
  };
function selectChartDateOrTime(e) {
  const r = $('chart').getBoundingClientRect(),
    f = clamp((e.clientX - r.left - 35) / (r.width - 47), 0, 1);
  stop();
  if (state.body === 'moon') {
    state.date =
      state.date.slice(0, 7) +
      '-' +
      String(1 + Math.round(f * (monthDays(state.date) - 1))).padStart(2, '0');
    $('date').value = state.date;
  } else state.time = f * 1440;
  schedule();
}
$('chart').addEventListener('pointerdown', (e) => {
  selectChartDateOrTime(e);
  $('chart').setPointerCapture(e.pointerId);
});
$('chart').addEventListener('pointermove', (e) => {
  if ($('chart').hasPointerCapture(e.pointerId)) selectChartDateOrTime(e);
});
function monthDays(date) {
  const [y, m] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
function syncControls() {
  for (const k of ['lat', 'lon', 'height', 'date', 'speed']) $(k).value = state[k];
  $('place').value = state.place;
  if ($('place').selectedIndex < 0) {
    state.place = 'custom';
    $('place').value = 'custom';
  }
  for (const k of ['track', 'shadow', 'compare', 'angles', 'loop'])
    $(k).checked = state[k];
  $('moonSpeed').value = state.daysRate;
  $('moonLoop').checked = state.monthLoop;
}
function updateSolarControls() {
  $('sunTimeline').hidden = false;
  $('moonTimeline').hidden = true;
  $('seasonButtons').hidden = false;
  $('chartEyebrow').textContent = '全天变化';
  $('chartLegend').textContent = '当前日期';
  $('chartHint').textContent = '点击或拖动曲线切换时间，虚线表示地平线。';
}
function updateLunarControls() {
  $('sunTimeline').hidden = true;
  $('moonTimeline').hidden = false;
  $('seasonButtons').hidden = true;
  $('date').value = state.date;
  $('moonMonth').value = state.date.slice(0, 7);
  $('moonDay').max = monthDays(state.date);
  $('moonDay').value = Number(state.date.slice(8));
  $('moonDateText').textContent = state.date;
  $('moonClock').value = state.time;
  $('moonClockText').textContent = hhmm(state.time, true);
  $('moonFixedClock').textContent = '固定 ' + hhmm(state.time, true) + ' · 当地真太阳时';
  $('moonDayLabels').innerHTML = [1, 8, 15, 22, monthDays(state.date)]
    .map((d) => '<span>' + d + ' 日</span>')
    .join('');
  $('bodyTitle').textContent = '月相实验室';
  $('sceneSubtitle').textContent += ' · ' + hhmm(state.time, true) + ' 固定观测';
  $('chartTitle').textContent = '可见月面照明比例';
  $('chartEyebrow').textContent = '本月变化';
  $('chartLegend').textContent = '固定观测时刻';
  $('chartHint').textContent =
    '点击或拖动曲线选择日期。月相周期约 29.53 天，不等于一个公历月。';
  $('chart').setAttribute('aria-label', '本月每天固定观测时刻的可见月面照明比例');
  $('plotNote').textContent =
    '月球轨迹覆盖所选日期的 00:00—24:00；月球沿轨道运动，一天后天空位置不同，两端通常不闭合，空隙不是漏画。月球相邻两次上中天的间隔平均约 24 小时 50 分钟，并非固定值。逐日播放比较相同时刻的位置；虚线在地平线下，升落按中心穿越几何地平线计算（未计折射）。';
  $('moonDateNote').textContent =
    '按天改变日期，保持观测时刻；可展开下方设置单独观察一天内的运动。';
  if ($('moonObservation').open) {
    const d = bodyDay();
    for (const [id, t] of [
      ['moonRise', d.rise],
      ['moonPeak', d.peak],
      ['moonSet', d.set],
    ]) {
      $(id).disabled = t === null;
      $(id + 'Time').textContent = t === null ? '当日无' : hhmm(t, true);
    }
  }
  $('moonPrevDay').disabled = state.date === '1900-01-01';
  $('moonNextDay').disabled = state.date === '2100-12-31';
  $('moonPrevMonth').disabled = state.date.slice(0, 7) === '1900-01';
  $('moonNextMonth').disabled = state.date.slice(0, 7) === '2100-12';
  $('moonPlay').textContent = state.playing ? 'Ⅱ 暂停' : '▶ 逐日播放';
}

function selectMonth(v) {
  if (
    !/^\d{4}-\d{2}$/.test(v) ||
    v < '1900-01' ||
    v > '2100-12' ||
    Number(v.slice(5)) < 1 ||
    Number(v.slice(5)) > 12
  )
    return;
  setDate(
    v +
      '-' +
      String(Math.min(Number(state.date.slice(8)), monthDays(v))).padStart(2, '0'),
  );
}
$('moonMonth').onchange = (e) => {
  selectMonth(e.target.value);
  e.target.value = state.date.slice(0, 7);
};
for (const [id, delta] of [
  ['moonPrevMonth', -1],
  ['moonNextMonth', 1],
])
  $(id).onclick = () => {
    const d = new Date(state.date.slice(0, 7) + '-01T12:00:00Z');
    d.setUTCMonth(d.getUTCMonth() + delta);
    selectMonth(d.toISOString().slice(0, 7));
  };
for (const [id, delta] of [
  ['moonPrevDay', -1],
  ['moonNextDay', 1],
])
  $(id).onclick = () => {
    stop();
    shiftDay(delta);
    schedule();
  };
$('moonDay').oninput = (e) =>
  setDate(state.date.slice(0, 7) + '-' + String(e.target.value).padStart(2, '0'));
$('moonClock').oninput = (e) => {
  stop();
  state.time = +e.target.value;
  schedule();
};
for (const [id, key] of [
  ['moonRise', 'rise'],
  ['moonPeak', 'peak'],
  ['moonSet', 'set'],
])
  $(id).onclick = () => {
    stop();
    state.time = bodyDay()[key];
    schedule();
  };
$('moonSpeed').onchange = (e) => (state.daysRate = +e.target.value);
$('moonLoop').onchange = (e) => (state.monthLoop = e.target.checked);
$('moonPlay').onclick = () => {
  state.playing = !state.playing;
  if (!state.playing) settleMotion();
  motionLast = 0;
  lunarAccumulator = 0;
  lunarLast = 0;
  schedule();
};
initCoverage();
initMenu();
initWorkspace();
initCompanion();
initAnalemma();
initShadow();
initObserver();
initSundials();
initSolarDate();
initTimeWorkbench();
initMotion();
initPhaseInteraction();
syncControls();
new ResizeObserver(schedule).observe($('stage'));
window.addEventListener('resize', schedule);
render();
