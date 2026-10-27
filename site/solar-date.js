/**
 * 太阳固定时刻逐日比较、全年日期控制与联动状态。
 */
/* Fixed apparent solar time across calendar dates: independent of day playback. */
let solarDateAccumulator = 0,
  annualSolarProjection = null,
  annualShadowGeometry = null;
const annualSolarVectors = new WeakMap();
function prepareSolarDateMode() {
  if (state.body !== 'sun') return;
  if (state.solarDateMode && !state.manual && state.time >= 1440) {
    if (shiftDay(1)) {
      state.time -= 1440;
      state.dec = dateDec(state.date);
    } else state.time = 1439;
  }
  if (state.manual && state.solarDateMode) {
    state.solarDateMode = false;
    stop();
  }
  const linked = state.solarDateMode && state.solarDateLink && !state.manual;
  if (linked) {
    if (!state.solarDateLinkBackup)
      state.solarDateLinkBackup = {
        analemma: state.analemma,
        analemmaBasis: state.analemmaBasis,
        analemmaClock: state.analemmaClock,
        analemmaIdeal: state.analemmaIdeal,
      };
    state.analemma = true;
    state.analemmaBasis = 'apparent';
    state.analemmaClock = state.time;
    state.analemmaIdeal = false;
  } else if (state.solarDateLinkBackup) {
    Object.assign(state, state.solarDateLinkBackup);
    state.solarDateLinkBackup = null;
  }
}
function enableSolarDateMode(value) {
  stop();
  if (value) {
    state.manual = false;
    if (state.time >= 1440) {
      if (shiftDay(1)) state.time = 0;
      else state.time = 1439;
    }
    state.dec = dateDec(state.date);
  }
  state.solarDateMode = value;
  schedule();
}
function annualSolarSamples() {
  const source = analemmaYear({
    ...state,
    analemmaClock: state.time,
    analemmaBasis: 'apparent',
    analemmaIdeal: false,
  });
  let vectors = annualSolarVectors.get(source);
  if (!vectors) {
    vectors = source.map((p) => ({ ...p, ...analemmaVector(p) }));
    annualSolarVectors.set(source, vectors);
  }
  return vectors;
}
function annualSolarKey() {
  return [state.date.slice(0, 4), state.lat, state.lon, state.time].join(':');
}
function annualSolarPosition(fraction) {
  const points = annualSolarSamples(),
    index = clamp(fraction, 0, 1) * (points.length - 1),
    i = Math.min(Math.floor(index), points.length - 2);
  return mixDirection(points[i], points[i + 1], index - i);
}
function drawAnnualSolarTrail(c, project, w, h, camera) {
  const key = [annualSolarKey(), state.view, w, h, camera.yaw, camera.pitch, camera.zoom].join(':');
  if (annualSolarProjection?.key !== key)
    annualSolarProjection = {
      key,
      segments: skyTrackSegments(
        (t) => annualSolarPosition(t / 1440),
        project,
        state.view === 'horizon',
        40,
        w - 40,
      ),
    };
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  for (const segment of annualSolarProjection.segments)
    poly(
      c,
      segment.points,
      segment.above ? '#e8afff' : '#e8afff55',
      2,
      segment.above ? [] : [4, 4],
    );
  c.restore();
}
function annualShadowSegments(radius = shadowGroundRadius()) {
  const key = [annualSolarKey(), state.height, radius].join(':');
  if (annualShadowGeometry?.key === key) return annualShadowGeometry.data;
  const points = annualSolarSamples(),
    groups = [];
  let previous = null;
  for (let i = 0; i < points.length; i++) {
    const q = shadowTip(points[i]);
    if (q) q.t = i;
    if (q && previous) {
      const clipped = clipShadowSegment(previous, q, radius);
      if (clipped) {
        const last = groups.at(-1),
          end = last?.points.at(-1);
        if (
          last &&
          Math.hypot(end.x - clipped.a.x, end.z - clipped.a.z) < 1e-7 &&
          Math.abs(end.t - clipped.a.t) < 1e-7
        )
          last.points.push(clipped.b);
        else groups.push({ points: [clipped.a, clipped.b] });
      }
    }
    previous = q;
  }
  const data = { points, groups, radius };
  annualShadowGeometry = { key, data };
  return data;
}
function drawAnnualShadowTrail(c, project, radius) {
  const data = annualShadowSegments(radius),
    map = (p) => project({ x: p.x / radius, y: 0, z: p.z / radius });
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  for (const group of data.groups) {
    poly(c, group.points.map(map), '#84deb422', 6);
    poly(c, group.points.map(map), '#84deb4', 2.2);
  }
  for (const p of data.points) {
    if (!p.date.endsWith('-01')) continue;
    const tip = shadowTip(p);
    if (!tip || tip.length > radius) continue;
    const q = map(tip);
    c.fillStyle = '#b8f7d3';
    c.beginPath();
    c.arc(q.x, q.y, 2.4, 0, Math.PI * 2);
    c.fill();
  }
  if (!state.shadow) {
    const tip = shadowTip(visualPosition('Sun', bodyPosition()));
    if (tip && tip.length <= radius) {
      const q = map(tip);
      c.fillStyle = '#ffd58b';
      c.strokeStyle = '#102337';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(q.x, q.y, 5.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
  }
  c.restore();
}
function updateSolarDateMonths() {
  const box = $('solarDateMonths'),
    year = Number(state.date.slice(0, 4));
  if (box.dataset.year !== String(year)) {
    box.replaceChildren();
    for (let month = 1; month <= 12; month++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = month + '月';
      b.style.left =
        ((yearDay(`${year}-${String(month).padStart(2, '0')}-01`) - 1) / (yearLength(year) - 1)) *
          100 +
        '%';
      b.dataset.month = month;
      b.onclick = () => {
        const prefix = state.date.slice(0, 4) + '-' + String(month).padStart(2, '0');
        setDate(
          prefix +
            '-' +
            String(Math.min(Number(state.date.slice(8)), monthDays(prefix))).padStart(2, '0'),
        );
      };
      box.append(b);
    }
    box.dataset.year = year;
  }
  box
    .querySelectorAll('button')
    .forEach((b) =>
      b.classList.toggle(
        'selected-month',
        Number(b.dataset.month) === Number(state.date.slice(5, 7)),
      ),
    );
}
function renderSolarDateUI() {
  const sun = state.body === 'sun',
    active = sun && state.solarDateMode && !state.manual,
    linked = active && state.solarDateLink;
  $('solarDateModeBar').hidden = !sun;
  $('solarDateTimeline').hidden = !active;
  for (const id of ['solarDateMode', 'solarDateModeMenuToggle']) {
    $(id).checked = !!state.solarDateMode;
    $(id).disabled = state.manual;
  }
  $('solarDateModeHint').textContent = state.manual
    ? '理想实验不使用日期，请先在演示方式中恢复日期观测。'
    : active
      ? '每天保持同一当地真太阳时：太阳位置、竖直杆影与日晷随日期同步变化。'
      : '开启后保持观测时刻，用全年日期滑动条比较季节变化。';
  $('solarAnnualKey').hidden = !active || !state.solarDateTrail;
  for (const id of [
    'analemmaEnabled',
    'analemmaBasis',
    'analemmaClock',
    'analemmaOffset',
    'analemmaIdeal',
  ])
    $(id).disabled = linked;
  $('analemmaDateLinkNote').hidden = !linked;
  if (!sun) return;
  $('sunTimeline').hidden = active;
  if (!active) return;
  const year = Number(state.date.slice(0, 4));
  $('solarDateText').textContent = state.date;
  $('solarDateDay').max = yearLength(year);
  $('solarDateDay').value = yearDay(state.date);
  $('solarDateDay').setAttribute('aria-valuetext', state.date);
  if (document.activeElement !== $('solarDateYear')) $('solarDateYear').value = year;
  $('solarDateSpeed').value = state.solarDateRate;
  $('solarDateLoop').checked = state.solarDateLoop;
  $('solarDateTrail').checked = state.solarDateTrail;
  $('solarDateLink').checked = state.solarDateLink;
  $('solarDatePlay').textContent = state.playing
    ? 'Ⅱ 暂停'
    : state.date.endsWith('12-31') && !state.solarDateLoop
      ? '▶ 从年初播放'
      : '▶ 按日期播放';
  $('solarFixedTimeLabel').textContent = '固定 ' + hhmm(state.time) + ' · 当地真太阳时';
  $('solarFixedTime').value = state.time;
  $('solarFixedTimeText').textContent = hhmm(state.time);
  $('solarDatePrev').disabled = state.date === '1900-01-01';
  $('solarDateNext').disabled = state.date === '2100-12-31';
  updateSolarDateMonths();
  const s = bodyPosition(),
    tip = shadowTip(s);
  $('solarDateResults').textContent =
    hhmm(state.time) +
    ' · 太阳高度 ' +
    s.alt.toFixed(2) +
    '° · ' +
    (Math.abs(state.lat) > 89.99999999 || s.alt > 89.99
      ? '方位按特殊位置判读'
      : '方位 ' + s.az.toFixed(2) + '°') +
    ' · ' +
    (tip
      ? '竖杆影长 ' + tip.length.toFixed(2) + ' m'
      : s.alt === 0
        ? '地平线处无有限日影'
        : '当前无直射日影');
}
function advanceSolarDatePlayback() {
  const year = Number(state.date.slice(0, 4)),
    day = yearDay(state.date);
  if (day >= yearLength(year)) {
    if (!state.solarDateLoop) {
      stop();
      return false;
    }
    state.date = `${year}-01-01`;
  } else state.date = dateAtYearDay(year, day + 1);
  state.dec = dateDec(state.date);
  $('date').value = state.date;
  return true;
}
function initSolarDate() {
  for (const id of ['solarDateMode', 'solarDateModeMenuToggle'])
    $(id).onchange = (e) => enableSolarDateMode(e.target.checked);
  $('solarDateShow').onclick = () => {
    enableSolarDateMode(true);
    closeMenu();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (state.view === 'observer') $('workbenchMore').open = true;
        $('workbenchDay').focus({ preventScroll: true });
      }),
    );
  };
  $('solarDateDay').oninput = (e) =>
    setDate(dateAtYearDay(Number(state.date.slice(0, 4)), Number(e.target.value)));
  $('solarDateYear').onchange = (e) => {
    const year = Number(e.target.value);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      e.target.value = state.date.slice(0, 4);
      return;
    }
    const prefix = year + state.date.slice(4, 7);
    setDate(
      prefix +
        '-' +
        String(Math.min(Number(state.date.slice(8)), monthDays(prefix))).padStart(2, '0'),
    );
  };
  for (const [id, delta] of [
    ['solarDatePrev', -1],
    ['solarDateNext', 1],
  ])
    $(id).onclick = () => {
      stop();
      if (shiftDay(delta)) {
        state.dec = dateDec(state.date);
        schedule();
      }
    };
  $('solarFixedTime').oninput = (e) => {
    stop();
    state.time = Number(e.target.value);
    schedule();
  };
  $('solarDateSpeed').onchange = (e) => (state.solarDateRate = Number(e.target.value));
  $('solarDateLoop').onchange = (e) => {
    state.solarDateLoop = e.target.checked;
    schedule();
  };
  for (const [id, key] of [
    ['solarDateTrail', 'solarDateTrail'],
    ['solarDateLink', 'solarDateLink'],
  ])
    $(id).onchange = (e) => {
      stop();
      state[key] = e.target.checked;
      schedule();
    };
  $('solarDateUnlink').onclick = () => {
    stop();
    state.solarDateLink = false;
    prepareSolarDateMode();
    state.analemma = true;
    schedule();
  };
  $('solarDatePlay').onclick = () => {
    if (state.playing) {
      stop();
      schedule();
      return;
    }
    stop();
    if (state.date.endsWith('12-31') && !state.solarDateLoop) {
      state.date = state.date.slice(0, 4) + '-01-01';
      state.dec = dateDec(state.date);
    }
    state.playing = true;
    solarDateAccumulator = 0;
    motionLast = 0;
    schedule();
  };
}
