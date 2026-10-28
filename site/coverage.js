/**
 * 专题读数、轨迹及图解；消费同一份天体位置结果。
 */
/* Teaching views share ephemerides, while Sun and Moon keep separate render flows. */
function yearLength(year) {
  return new Date(Date.UTC(year, 2, 0)).getUTCDate() === 29 ? 366 : 365;
}
function yearDay(date) {
  const y = Number(date.slice(0, 4));
  return (
    1 + Math.round((new Date(date + 'T12:00:00Z') - new Date(Date.UTC(y, 0, 1, 12))) / 86400000)
  );
}
function dateAtYearDay(year, day) {
  return new Date(Date.UTC(year, 0, Math.round(day), 12)).toISOString().slice(0, 10);
}
function updateYearSlider() {
  const y = Number(state.date.slice(0, 4));
  if (document.activeElement !== $('solarYear')) $('solarYear').value = y;
  $('solarYearDay').max = yearLength(y);
  $('solarYearDay').value = yearDay(state.date);
  $('solarYearDate').textContent = state.date;
  $('solarYearDay').setAttribute('aria-valuetext', state.date);
  $('solarYearHint').textContent = state.manual
    ? '拖动全年日期会恢复日期观测，保持当前观测时刻。'
    : '按天连续选择全年日期，保持当前观测时刻。';
  const ticks = $('solarMonthTicks');
  if (ticks.dataset.year !== String(y)) {
    ticks.replaceChildren();
    for (let m = 1; m <= 12; m++) {
      const b = document.createElement('button');
      b.textContent = m + '月';
      b.dataset.month = m;
      b.style.left =
        ((yearDay(`${y}-${String(m).padStart(2, '0')}-01`) - 1) / (yearLength(y) - 1)) * 100 + '%';
      b.title = '跳到 ' + m + ' 月（保留日号，月末自动调整）';
      b.onclick = () =>
        setDate(
          `${y}-${String(m).padStart(2, '0')}-${String(Math.min(Number(state.date.slice(8)), monthDays(`${y}-${String(m).padStart(2, '0')}`))).padStart(2, '0')}`,
        );
      ticks.append(b);
    }
    ticks.dataset.year = y;
  }
  ticks
    .querySelectorAll('button')
    .forEach((b) =>
      b.classList.toggle(
        'selected-month',
        Number(b.dataset.month) === Number(state.date.slice(5, 7)),
      ),
    );
}
function mapGeometry(w, h) {
  return { left: 34, right: w - 15, top: 26, bottom: h - 28 };
}
function mapLocation(x, y, w, h) {
  const g = mapGeometry(w, h);
  if (x < g.left || x > g.right || y < g.top || y > g.bottom) return null;
  return {
    lat: 90 - ((y - g.top) / (g.bottom - g.top)) * 180,
    lon: ((x - g.left) / (g.right - g.left)) * 360 - 180,
  };
}
const worldShadeCanvas = document.createElement('canvas');
worldShadeCanvas.width = 360;
worldShadeCanvas.height = 180;
const worldShadeContext = worldShadeCanvas.getContext('2d'),
  worldShadeImage = worldShadeContext.createImageData(360, 180),
  worldSinLat = Array.from({ length: 180 }, (_, y) => Math.sin(((89.5 - y) * Math.PI) / 180)),
  worldCosLat = Array.from({ length: 180 }, (_, y) => Math.cos(((89.5 - y) * Math.PI) / 180)),
  worldSinLon = Array.from({ length: 360 }, (_, x) => Math.sin(((x - 179.5) * Math.PI) / 180)),
  worldCosLon = Array.from({ length: 360 }, (_, x) => Math.cos(((x - 179.5) * Math.PI) / 180));
// Exact geometric terminator as an antialiased vector contour.
// The coarse raster is used only for the continuous daytime brightness gradient.
let worldNightCache = null;
function worldNightLatitude(lon, context) {
  return (
    Math.atan(
      (-Math.cos(context.dec * rad) * Math.cos((lon - context.lon) * rad)) /
        Math.sin(context.dec * rad),
    ) * deg
  );
}
function worldNightPath(g, context) {
  const key = [g.left, g.right, g.top, g.bottom, context.dec, context.lon].join(':');
  if (worldNightCache?.key === key) return worldNightCache.path;
  const path = new Path2D(),
    mw = g.right - g.left,
    mh = g.bottom - g.top,
    xx = (lon) => g.left + ((lon + 180) / 360) * mw,
    yy = (lat) => g.top + ((90 - lat) / 180) * mh;
  if (Math.abs(context.dec) < 1e-10) {
    const bounds = [-180, 180];
    for (const a of [-90, 90]) bounds.push(((((context.lon + a + 180) % 360) + 360) % 360) - 180);
    bounds.sort((a, b) => a - b);
    for (let i = 1; i < bounds.length; i++)
      if (Math.cos(((bounds[i - 1] + bounds[i]) / 2 - context.lon) * rad) < 0)
        path.rect(xx(bounds[i - 1]), g.top, xx(bounds[i]) - xx(bounds[i - 1]), mh);
  } else {
    const edge = context.dec > 0 ? g.bottom : g.top;
    path.moveTo(g.left, edge);
    const steps = Math.max(360, Math.ceil(mw * 2)),
      lons = [];
    for (let i = 0; i <= steps; i++) lons.push(-180 + (i / steps) * 360);
    for (const a of [-90, 90]) lons.push(((((context.lon + a + 180) % 360) + 360) % 360) - 180);
    lons.sort((a, b) => a - b);
    for (const lon of lons) path.lineTo(xx(lon), yy(worldNightLatitude(lon, context)));
    path.lineTo(g.right, edge);
    path.closePath();
  }
  worldNightCache = { key, path };
  return path;
}
function drawWorldMap() {
  if (!canPaint($('worldMap'))) return;
  const { c, w, h } = resize($('worldMap')),
    g = mapGeometry(w, h),
    context = sunContext(),
    mw = g.right - g.left,
    mh = g.bottom - g.top,
    xx = (lon) => g.left + ((lon + 180) / 360) * mw,
    yy = (lat) => g.top + ((90 - lat) / 180) * mh;
  c.fillStyle = '#203b52';
  c.fillRect(g.left, g.top, mw, mh);
  if (earthPixels) c.drawImage(earth, g.left, g.top, mw, mh);
  const data = worldShadeImage.data,
    sd = Math.sin(context.dec * rad),
    cd = Math.cos(context.dec * rad),
    sl = Math.sin(context.lon * rad),
    cl = Math.cos(context.lon * rad);
  for (let y = 0; y < 180; y++)
    for (let x = 0; x < 360; x++) {
      const light =
          worldSinLat[y] * sd + worldCosLat[y] * cd * (worldCosLon[x] * cl + worldSinLon[x] * sl),
        j = (y * 360 + x) * 4;
      data[j] = 5;
      data[j + 1] = 14;
      data[j + 2] = 30;
      data[j + 3] = Math.round(45 * (1 - Math.sqrt(Math.max(0, light))));
    }
  worldShadeContext.putImageData(worldShadeImage, 0, 0);
  c.drawImage(worldShadeCanvas, g.left, g.top, mw, mh);
  c.save();
  c.beginPath();
  c.rect(g.left, g.top, mw, mh);
  c.clip();
  c.fillStyle = 'rgba(5,14,30,' + (195 - 45) / (255 - 45) + ')';
  c.fill(worldNightPath(g, context));
  c.restore();
  for (const lat of [-60, -30, 0, 30, 60]) {
    poly(
      c,
      [
        { x: g.left, y: yy(lat) },
        { x: g.right, y: yy(lat) },
      ],
      lat === 0 ? '#d3dcf199' : '#c9e0ee38',
      1,
      lat === 0 ? [4, 4] : [],
    );
    text(
      c,
      lat === 0 ? '0°' : Math.abs(lat) + '°' + (lat > 0 ? 'N' : 'S'),
      g.left - 5,
      yy(lat),
      '#bdcfdf',
      10,
      'right',
    );
  }
  for (const lon of [-180, -90, 0, 90, 180]) {
    poly(
      c,
      [
        { x: xx(lon), y: g.top },
        { x: xx(lon), y: g.bottom },
      ],
      '#c9e0ee38',
    );
    text(
      c,
      lon === 0 ? '0°' : Math.abs(lon) + '°' + (lon > 0 ? 'E' : 'W'),
      xx(lon),
      h - 10,
      '#bdcfdf',
      10,
      lon === -180 ? 'left' : lon === 180 ? 'right' : 'center',
    );
  }
  text(c, '90°N', g.left - 5, g.top, '#bdcfdf', 10, 'right');
  text(c, '90°S', g.left - 5, g.bottom, '#bdcfdf', 10, 'right');
  glow(c, xx(context.lon), yy(context.dec), 4);
  const ox = xx(state.lon),
    oy = yy(state.lat);
  c.fillStyle = '#77c9ff';
  c.strokeStyle = '#fff';
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(ox, oy, 4, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  $('mapCoordinates').textContent =
    '直射点 ' +
    coord(context.dec, 'lat') +
    ' / ' +
    coord(context.lon, 'lon') +
    ' · 观察地点 ' +
    coord(state.lat, 'lat') +
    ' / ' +
    coord(state.lon, 'lon');
  window.SkyDiagramTools?.paint('world-map', {
    type: 'globe',
    observeLocation: useReferenceObserver,
    canvas: $('worldMap'),
    c,
    w,
    h,
    body: state.body,
    date: state.date,
    time: state.time,
    lat: state.lat,
    lon: state.lon,
    sun: context,
    rayAt: (lat, lon) => {
      const a = solar(lat, context.dec, 720 + (lon - context.lon) * 4).az * rad;
      return { x: xx(lon) + 40 * Math.sin(a), y: yy(lat) - 40 * Math.cos(a) };
    },
    project: (lat, lon) => ({ x: xx(lon), y: yy(lat) }),
    pick: (x, y) =>
      x < g.left || x > g.right || y < g.top || y > g.bottom
        ? null
        : { lat: 90 - ((y - g.top) / mh) * 180, lon: ((x - g.left) / mw) * 360 - 180 },
  });
}
function updateEarthView(paint = true) {
  renderGlobeOptions();
  const map = state.earthView === 'map';
  $('earthGlobeView').hidden = map;
  $('earthMapView').hidden = !map;
  document.querySelectorAll('[data-earth-view]').forEach((b) => {
    const on = b.dataset.earthView === state.earthView;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  if (paint) {
    if (map) drawWorldMap();
    else drawGlobe();
  }
}
function eventPosition(time) {
  if (time === null) return null;
  return state.body === 'sun' && state.manual
    ? solar(state.lat, state.dec, time)
    : skyRaw(state.body === 'sun' ? 'Sun' : 'Moon', time, state.date, state.lat, state.lon);
}
function eventModel() {
  const d = bodyDay();
  return {
    rise: { time: d.rise, position: eventPosition(d.rise) },
    set: { time: d.set, position: eventPosition(d.set) },
    pole: Math.abs(state.lat) > 89.99999999,
  };
}
function updateEvents(paint = true) {
  if (
    document.body.dataset.page === 'diagrams' &&
    typeof uiWorkspace !== 'undefined' &&
    uiWorkspace?.selected !== 'riseSetPanel' &&
    !window.skyWorkspacePresentation?.visibleIds.has('riseSetPanel')
  )
    return;
  const m = eventModel(),
    moon = state.body === 'moon';
  $('eventTitle').textContent = moon ? '月出与月落方位' : '日出与日落方位';
  for (const key of ['rise', 'set']) {
    const id = key === 'rise' ? 'eventRise' : 'eventSet',
      label = moon ? (key === 'rise' ? '月出' : '月落') : key === 'rise' ? '日出' : '日落',
      e = m[key];
    $(id + 'Label').textContent = label;
    $(id).disabled = e.time === null;
    $(id + 'Clock').textContent =
      e.time === null ? '当天没有该升落事件' : hhmm(e.time, true) + ' · 点击跳转';
    $(id + 'Az').textContent =
      e.time === null
        ? '当日无'
        : m.pole
          ? '极点方位不唯一'
          : e.position.az.toFixed(1) + '° · ' + heading(e.position.az);
  }
  $('eventNote').textContent = m.pole
    ? '极点的正北方向不能唯一确定，图中不赋予升落方位。升落以天体中心穿越几何地平线为准，未计折射。'
    : (m.rise.time === null || m.set.time === null
        ? '当天可能没有一个或两个升落事件；高纬地区可出现全天在地平线上方或下方。 '
        : '') + '方位角从正北顺时针量起；按天体中心穿越几何地平线计算，未计大气折射。';
  if (paint) drawEventCompass(m);
}
const eventCompassCamera = { zoom: 1 };
let eventCompassLayout = null,
  eventCompassFeedback = '';
function drawEventCompass(m) {
  if (!canPaint($('eventCompass'))) return;
  const { c, w, h } = resize($('eventCompass')),
    cx = w / 2,
    cy = h / 2,
    r =
      Math.max(12, Math.min(Math.min(w, h) * 0.34, Math.min(w, h) / 2 - 36)) *
      eventCompassCamera.zoom;
  const project = (az, scale = 1) => ({
    x: cx + r * scale * Math.sin(az * rad),
    y: cy - r * scale * Math.cos(az * rad),
  });
  eventCompassLayout = { cx, cy, r, project, model: m, body: state.body, date: state.date };
  poly(c, [project(270), project(90)], '#60799777');
  poly(c, [project(0), project(180)], '#60799777');
  c.strokeStyle = '#7996b477';
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.stroke();
  for (const [label, a] of [
    ['北', 0],
    ['东', 90],
    ['南', 180],
    ['西', 270],
  ])
    text(c, label, project(a, (r + 12) / r).x, project(a, (r + 12) / r).y, '#c4d6e9', 12);
  if (!m.pole)
    for (const [key, col] of [
      ['rise', '#ffc35a'],
      ['set', '#9ebaff'],
    ]) {
      const e = m[key];
      if (!e.position) continue;
      const p = project(e.position.az);
      poly(c, [{ x: cx, y: cy }, p], col, 2);
      c.fillStyle = col;
      c.beginPath();
      c.arc(p.x, p.y, 4, 0, Math.PI * 2);
      c.fill();
      text(
        c,
        key === 'rise' ? '出' : '落',
        project(e.position.az, 0.62).x,
        project(e.position.az, 0.62).y,
        col,
        12,
      );
    }
  c.fillStyle = '#78cfff';
  c.beginPath();
  c.arc(cx, cy, 3, 0, Math.PI * 2);
  c.fill();
  window.SkyDiagramTools?.paint('bearings', {
    type: 'azimuth',
    canvas: $('eventCompass'),
    c,
    w,
    h,
    body: state.body,
    date: state.date,
    time: state.time,
    lat: state.lat,
    lon: state.lon,
    radius: r,
    project,
    events: (date, threshold) =>
      SkyDiagramSampling.events(
        date,
        threshold,
        state.body === 'moon' ? 'Moon' : 'Sun',
        state.lat,
        state.lon,
        state.body === 'sun' && state.manual ? state.dec : null,
      ),
  });

  text(
    c,
    eventCompassFeedback ||
      (document.documentElement.lang === 'en'
        ? 'Drag a rise/set point to change date · Click to jump to its time'
        : '拖动升落点调整日期与方位 · 点击跳转升落时刻'),
    w / 2,
    h - 12,
    '#a4bad0',
    w < 350 ? 9 : 11,
  );
}
/** Drag a physical rise/set marker to the nearest achievable bearing at the same location.
 * Dates are ranked by declination, then verified against the native geometric crossings.
 * Nothing assigns a freely invented azimuth to an astronomical event.
 */
function eventBearingCandidates(origin) {
  const moon = origin.body === 'moon',
    day = 86400000;
  const start = Date.parse(origin.date + 'T12:00:00Z');
  const year = Number(origin.date.slice(0, 4));
  const first = moon ? start - 35 * day : Date.UTC(year, 0, 1, 12);
  const last = moon ? start + 35 * day : Date.UTC(year + 1, 0, 1, 12) - day;
  const candidates = [];
  for (let instant = first; instant <= last; instant += day) {
    const date = new Date(instant).toISOString().slice(0, 10);
    if (date < '1900-01-01' || date > '2100-12-31') continue;
    const p = skyRaw(moon ? 'Moon' : 'Sun', 720, date, origin.lat, origin.lon);
    const sinDec =
      Math.sin(origin.lat * rad) * Math.sin(p.alt * rad) +
      Math.cos(origin.lat * rad) * Math.cos(p.alt * rad) * Math.cos(p.az * rad);
    const cosAz = sinDec / Math.cos(origin.lat * rad);
    candidates.push({
      date,
      distance: Math.abs(instant - start),
      az: Math.acos(clamp(cosAz, -1, 1)) * deg,
      events: null,
    });
  }
  return candidates;
}
function eventBearingDate(candidates, target, kind, origin) {
  const distance = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      error: distance(kind === 'rise' ? candidate.az : 360 - candidate.az, target),
    }))
    .sort((a, b) => a.error - b.error || a.candidate.distance - b.candidate.distance);
  let best = null;
  for (const { candidate } of ranked.slice(0, 16)) {
    candidate.events ||= SkyDiagramSampling.events(
      candidate.date,
      0,
      origin.body === 'moon' ? 'Moon' : 'Sun',
      origin.lat,
      origin.lon,
    );
    for (const event of candidate.events) {
      const position = (time) =>
        skyRaw(
          origin.body === 'moon' ? 'Moon' : 'Sun',
          time,
          candidate.date,
          origin.lat,
          origin.lon,
        );
      const rising = position(event.time + 0.05).alt > position(event.time - 0.05).alt;
      if (rising !== (kind === 'rise')) continue;
      const error = distance(event.az, target);
      // Bearings within a fraction of a degree favour the closer date, avoiding seasonal jumps.
      if (
        !best ||
        error < best.error - 0.15 ||
        (Math.abs(error - best.error) <= 0.15 && candidate.distance < best.distance)
      )
        best = { date: candidate.date, distance: candidate.distance, error };
    }
  }
  return best;
}
function initEventCompassInteraction() {
  const canvas = $('eventCompass'),
    pointers = new Map();
  let gesture = null,
    pending = null,
    frame = null;
  canvas.tabIndex = 0;
  canvas.style.touchAction = 'none';
  canvas.style.cursor = 'default';
  canvas.setAttribute(
    'aria-label',
    '升落方位图；拖动升落点改变日期和方位，点击跳转时刻，左右方向键调整日期，滚轮缩放，Home复位',
  );
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  function restore(g) {
    Object.assign(eventCompassCamera, g.camera);
    Object.assign(state, { date: g.date, manual: g.manual, dec: g.dec });
    $('date').value = state.date;
    eventCompassFeedback = '';
  }
  function adjust() {
    frame = null;
    const g = gesture,
      p = pending;
    pending = null;
    if (
      !g?.hit ||
      !p ||
      g.pinch ||
      g.body !== state.body ||
      g.lat !== state.lat ||
      g.lon !== state.lon
    )
      return;
    g.candidates ||= eventBearingCandidates(g);
    const b = canvas.getBoundingClientRect(),
      layout = eventCompassLayout;
    const target =
      (Math.atan2(p.x - b.left - layout.cx, layout.cy - (p.y - b.top)) * deg + 360) % 360;
    const best = eventBearingDate(g.candidates, target, g.hit, g);
    if (best) {
      setDate(best.date);
      eventCompassFeedback =
        best.error > 0.75
          ? (document.documentElement.lang === 'en'
              ? 'Nearest achievable bearing · '
              : '已到可实现的最近方位 · ') + best.date
          : best.date;
      schedule();
    }
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !eventCompassLayout || pointers.size >= 2) return;
    if (!pointers.size) {
      const b = canvas.getBoundingClientRect(),
        layout = eventCompassLayout;
      const hit = ['rise', 'set'].find((key) => {
        const event = layout.model[key];
        if (!event.position || layout.model.pole) return false;
        const p = layout.project(event.position.az);
        return Math.hypot(e.clientX - b.left - p.x, e.clientY - b.top - p.y) <= 20;
      });
      gesture = {
        camera: { ...eventCompassCamera },
        x: e.clientX,
        y: e.clientY,
        moved: false,
        hit,
        body: state.body,
        date: state.date,
        lat: state.lat,
        lon: state.lon,
        manual: state.manual,
        dec: state.dec,
      };
      eventCompassFeedback = '';
    } else {
      restore(gesture);
      gesture.pinch = true;
      gesture.moved = true;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    canvas.focus({ preventScroll: true });
    canvas.dataset.dragging = String(!!gesture.hit);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId) || !gesture) return;
    const oldDistance = pointers.size === 2 ? distance() : null;
    const now = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, now);
    if (!gesture.moved && Math.hypot(now.x - gesture.x, now.y - gesture.y) < 4) return;
    gesture.moved = true;
    if (oldDistance !== null) {
      if (oldDistance > 0)
        eventCompassCamera.zoom = clamp(
          (eventCompassCamera.zoom * distance()) / oldDistance,
          0.65,
          1.2,
        );
      schedule();
    } else if (gesture.hit && !gesture.pinch) {
      pending = now;
      if (frame === null) frame = requestAnimationFrame(adjust);
    }
  });
  function finish(e) {
    if (!pointers.has(e.pointerId)) return;
    const g = gesture;
    if (e.type === 'pointerup' && pending && !g.pinch) {
      if (frame !== null) cancelAnimationFrame(frame);
      adjust();
    }
    pointers.delete(e.pointerId);
    if (e.type !== 'pointerup' && g) {
      restore(g);
      eventCompassFeedback = '';
    }
    if (!pointers.size) {
      if (
        g &&
        e.type === 'pointerup' &&
        !g.moved &&
        g.hit &&
        g.body === state.body &&
        g.date === state.date
      ) {
        const time = eventModel()[g.hit].time;
        if (time !== null) {
          stop();
          state.time = time;
        }
      }
      gesture = null;
      pending = null;
      canvas.dataset.dragging = 'false';
    }
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    schedule();
  }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    canvas.addEventListener(event, finish);
  function cancel() {
    if (gesture) restore(gesture);
    gesture = null;
    pending = null;
    eventCompassFeedback = '';
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    for (const id of [...pointers.keys()]) {
      pointers.delete(id);
      if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    }
    canvas.dataset.dragging = 'false';
    schedule();
  }
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      eventCompassCamera.zoom = clamp(
        eventCompassCamera.zoom * Math.exp(-e.deltaY * 0.001),
        0.65,
        1.2,
      );
      schedule();
    },
    { passive: false },
  );
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gesture) {
      e.preventDefault();
      e.stopPropagation();
      cancel();
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'Home', '+', '=', '-'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Home') Object.assign(eventCompassCamera, { zoom: 1 });
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const date = new Date(state.date + 'T12:00:00Z');
      date.setUTCDate(date.getUTCDate() + (e.key === 'ArrowLeft' ? -1 : 1));
      setDate(date.toISOString().slice(0, 10));
    } else
      eventCompassCamera.zoom = clamp(
        eventCompassCamera.zoom * (e.key === '-' ? 0.9 : 1.1),
        0.65,
        1.2,
      );
    schedule();
  });
  window.addEventListener('blur', cancel);
}
function geometryModel() {
  const p = state.lat * rad,
    q = [Math.cos(p), Math.sin(p), 0],
    north = [-Math.sin(p), Math.cos(p), 0],
    east = [0, 0, 1],
    s = bodyPosition(),
    sun = q.map((v, i) => v * s.y + north[i] * s.z + east[i] * s.x),
    context = sunContext();
  let eclipticNormal = null,
    obliquity = null;
  if (context.utc) {
    const t = context.utc,
      v = Astronomy.RotateVector(Astronomy.Rotation_ECT_EQD(t), new Astronomy.Vector(0, 0, 1, t)),
      a = (Astronomy.SiderealTime(t) * 15 + state.lon) * rad;
    eclipticNormal = [
      v.x * Math.cos(a) + v.y * Math.sin(a),
      v.z,
      -v.x * Math.sin(a) + v.y * Math.cos(a),
    ];
    obliquity = Math.acos(clamp(v.z, -1, 1)) * deg;
  }
  return { q, north, east, sun, eclipticNormal, obliquity };
}
// Camera state is visual only: it never changes the observer or ephemeris inputs.
const geometryCamera = { yaw: Math.atan2(0.6, 0.8), pitch: Math.asin(0.3), zoom: 1 };
function resetGeometryCamera() {
  Object.assign(geometryCamera, { yaw: Math.atan2(0.6, 0.8), pitch: Math.asin(0.3), zoom: 1 });
  drawEarthGeometry();
}
function initGeometryCamera() {
  const canvas = $('earthGeometry'),
    pointers = new Map();
  let frame = 0;
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    '地轴与地平面三维投影；拖动或方向键旋转，双指或加减键缩放，Home复位',
  );
  function redraw() {
    if (!frame)
      frame = requestAnimationFrame(() => {
        frame = 0;
        drawEarthGeometry();
      });
  }
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener('pointermove', (e) => {
    const previous = pointers.get(e.pointerId);
    if (!previous) return;
    const oldDistance = pointers.size === 2 ? distance() : null;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (oldDistance !== null) {
      if (oldDistance > 0)
        geometryCamera.zoom = clamp((geometryCamera.zoom * distance()) / oldDistance, 0.6, 1.6);
    } else {
      geometryCamera.yaw -= (e.clientX - previous.x) * 0.008;
      geometryCamera.pitch = clamp(
        geometryCamera.pitch + (e.clientY - previous.y) * 0.008,
        -1.45,
        1.45,
      );
    }
    redraw();
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    canvas.addEventListener(event, (e) => pointers.delete(e.pointerId));
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      geometryCamera.zoom = clamp(geometryCamera.zoom * Math.exp(-e.deltaY * 0.001), 0.6, 1.6);
      redraw();
    },
    { passive: false },
  );
  canvas.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(e.key))
      return;
    e.preventDefault();
    if (e.key === 'Home') {
      resetGeometryCamera();
      return;
    }
    if (e.key === 'ArrowLeft') geometryCamera.yaw -= 0.08;
    if (e.key === 'ArrowRight') geometryCamera.yaw += 0.08;
    if (e.key === 'ArrowUp') geometryCamera.pitch -= 0.08;
    if (e.key === 'ArrowDown') geometryCamera.pitch += 0.08;
    if (e.key === '+' || e.key === '=') geometryCamera.zoom *= 1.1;
    if (e.key === '-') geometryCamera.zoom /= 1.1;
    geometryCamera.pitch = clamp(geometryCamera.pitch, -1.45, 1.45);
    geometryCamera.zoom = clamp(geometryCamera.zoom, 0.6, 1.6);
    redraw();
  });
}
function drawEarthGeometry() {
  if (!canPaint($('earthGeometry'))) return;
  const { c, w, h } = resize($('earthGeometry')),
    m = geometryModel(),
    R = Math.min(w * 0.27, h * 0.29) * geometryCamera.zoom,
    cx = w * 0.45,
    cy = h * 0.53;
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0),
    yaw = geometryCamera.yaw,
    pitch = geometryCamera.pitch,
    eye = [Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)],
    right = [Math.cos(yaw), 0, -Math.sin(yaw)],
    up = [-Math.sin(pitch) * Math.sin(yaw), Math.cos(pitch), -Math.sin(pitch) * Math.cos(yaw)],
    project = (v) => ({ x: cx + R * dot(v, right), y: cy - R * dot(v, up) }),
    scale = (v, k) => v.map((x) => x * k),
    add = (a, b) => a.map((v, i) => v + b[i]);
  const compact = w < 240 || h < 260;
  const label = (value, x, y, color, size = 12, align = 'center') =>
    text(c, value, x, clamp(y, 10, h - 10), color, compact ? 10 : size, align);
  const fill = c.createRadialGradient(cx - R * 0.4, cy - R * 0.3, R * 0.1, cx, cy, R);
  fill.addColorStop(0, '#436b8f');
  fill.addColorStop(1, '#203b57');
  c.fillStyle = fill;
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#81a5c46b';
  c.stroke();
  function ring(center, u, v, r, color, width = 1) {
    let ps = [],
      front = null;
    for (let a = 0; a <= 360; a += 3) {
      const q = add(center, add(scale(u, r * Math.cos(a * rad)), scale(v, r * Math.sin(a * rad)))),
        f = dot(q, eye) >= 0,
        p = project(q);
      if (front !== null && f !== front) {
        ps.push(p);
        poly(c, ps, color, width, front ? [] : [3, 4]);
        ps = [p];
      } else ps.push(p);
      front = f;
    }
    poly(c, ps, color, width, front ? [] : [3, 4]);
  }
  if (window.SkyDiagramTools?.visible('geometry', 'equator') !== false)
    ring([0, 0, 0], [1, 0, 0], [0, 0, 1], 1, '#abaef4', 1.5);
  ring([0, 0, 0], [1, 0, 0], [0, 1, 0], 1, '#7394b760');
  const axisTop = project([0, 1.3, 0]),
    axisBottom = project([0, -1.3, 0]);
  if (window.SkyDiagramTools?.visible('geometry', 'axis') !== false) {
    poly(c, [axisBottom, axisTop], '#fa9c89', 2);
    label(compact ? '北极' : '北极 / 地轴', axisTop.x, axisTop.y - 12, '#fac0b0', 12);
    label('南极', axisBottom.x, axisBottom.y + 13, '#fac0b0', 12);
  }
  if (m.eclipticNormal) {
    const tip = project(scale(m.eclipticNormal, 1.22));
    poly(c, [project(scale(m.eclipticNormal, -1.22)), tip], '#b9a8db88', 1, [4, 4]);
    if (!compact) label('黄道法线', tip.x + 8, tip.y + 10, '#b9a8db', 11, 'left');
  }
  // The local horizon is an actual tangent plane: every point has dot(q, observer)=1.
  const plane = [];
  for (let a = 0; a <= 360; a += 4)
    plane.push(
      project(
        add(
          m.q,
          add(scale(m.north, 0.5 * Math.cos(a * rad)), scale(m.east, 0.5 * Math.sin(a * rad))),
        ),
      ),
    );
  if (window.SkyDiagramTools?.visible('geometry', 'horizon') !== false) {
    c.beginPath();
    plane.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    c.fillStyle = '#76d4bd30';
    c.fill();
    poly(c, plane, '#76d4bd', 1.5);
  }
  const observer = project(m.q),
    zenith = project(scale(m.q, 1.55));
  if (window.SkyDiagramTools?.visible('geometry', 'zenith') !== false) {
    poly(c, [project([0, 0, 0]), zenith], '#82c7ff', 1.5, [4, 4]);
    if (!compact) label('当地天顶', zenith.x, zenith.y - 13, '#a4d7ff', 12);
  }
  const rayEnd = project(add(m.q, scale(m.sun, 0.83)));
  if (window.SkyDiagramTools?.visible('geometry', 'sun') !== false) {
    poly(c, [rayEnd, observer], '#ffc35a', 2, bodyPosition().alt < 0 ? [4, 4] : []);
    glow(c, rayEnd.x, rayEnd.y, 5);
  }
  c.fillStyle = '#82c7ff';
  c.strokeStyle = '#fff';
  c.beginPath();
  c.arc(observer.x, observer.y, 4, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  if (h >= 100) label('观察者', observer.x, observer.y + 17, '#c5e6ff', 12);
  if (window.SkyDiagramTools?.visible('geometry', 'sun') !== false)
    label('太阳', rayEnd.x + 12, rayEnd.y + 7, '#ffda8b', 12, 'left');
  $('geometryObserver').textContent =
    '观察纬度 ' + coord(state.lat, 'lat') + ' · 太阳高度 ' + bodyPosition().alt.toFixed(1) + '°';
  $('geometryExplanation').textContent =
    '地平面与当地天顶垂直。改变纬度会改变地轴相对当地地平面的倾斜；改变日期和时刻会改变太阳相对地平面的方向。';
  $('geometryNote').textContent =
    '三维关系的二维投影：地球按球形近似、作透明示意，远侧圆弧用虚线表示；观察者和地平面大小为示意。太阳方向线不表示光能穿过地球，太阳低于地平线时方向线改为虚线。' +
    (m.obliquity === null
      ? '理想实验不对应实际公转位置，隐藏黄道法线。'
      : '地轴与黄道法线实际夹角约 ' + m.obliquity.toFixed(2) + '°，图上的投影夹角不等于实际夹角。');
  window.SkyDiagramTools?.paint('geometry', {
    type: 'geometry',
    observeLocation: useReferenceObserver,
    canvas: $('earthGeometry'),
    c,
    w,
    h,
    body: state.body,
    date: state.date,
    time: state.time,
    lat: state.lat,
    lon: state.lon,
    ...m,
    lon: state.lon,
    project,
  });
}
function renderSolarCoverage() {
  updateYearSlider();
  updateEvents(false);
  $('solarGeometryPanel').hidden = false;
  updateEarthView(false);
}
function renderLunarCoverage() {
  if ($('lunarSkyDetails').open) updateEvents(false);
  $('solarGeometryPanel').hidden = true;
}
// Applying an independent reference is an explicit, reversible observation change.
function useReferenceObserver(location) {
  if (
    !location ||
    !Number.isFinite(location.lat) ||
    !Number.isFinite(location.lon) ||
    Math.abs(location.lat) > 90 ||
    Math.abs(location.lon) > 180
  )
    return;
  window.SkyMotionHistory?.beginExternal();
  const moved = chooseMapObserver(location, { constraint: false });
  requestAnimationFrame(() => window.SkyMotionHistory?.flush());
  return moved;
}
// Invert the apparent-solar clock at a fixed UTC instant, including local date rollover.
function observerClockAt(instant, lon) {
  const t = new Date(instant),
    time = 720 + 4 * sunHourAngle(t, lon),
    estimate = new Date(instant + lon * 240000).toISOString().slice(0, 10);
  let best = null;
  for (const offset of [0, -1, 1]) {
    const d = new Date(estimate + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + offset);
    const date = d.toISOString().slice(0, 10);
    if (!SkyMotionSession.validDate(date)) continue;
    const error = Math.abs(instantUTC(time, date, lon).getTime() - instant);
    if (!best || error < best.error) best = { date, time, error };
    if (error < 2) return best;
  }
  return best && best.error < 1000 ? best : null;
}
function chooseMapObserver(location, options = {}) {
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lon)) return false;
  stop();
  const origin = options.origin || state,
    sun = state.body === 'sun',
    constraint = sun && options.constraint !== false ? state.observerConstraint : 'free';
  const lat = constraint === 'latitude' ? origin.lat : clamp(location.lat, -90, 90),
    lon = constraint === 'longitude' ? origin.lon : clamp(location.lon, -180, 180);
  const instant =
      sun && state.observerTimeBasis === 'utc' && !state.manual
        ? (options.instant ?? instantUTC().getTime())
        : null,
    clock = instant === null ? null : observerClockAt(instant, lon);
  if (instant !== null && !clock) {
    window.SkyMaterial.setValue($('place'), state.place);
    const note = $('observerLinkReadout');
    if (note)
      note.textContent =
        document.documentElement.lang === 'en'
          ? 'This move would leave the supported date range (1900–2100).'
          : '此移动将超出支持日期范围（1900—2100 年）。';
    return false;
  }
  state.lat = lat;
  state.lon = lon;
  state.place = 'custom';
  if (clock) {
    state.date = clock.date;
    state.time = clock.time;
    state.dec = dateDec(state.date);
  }
  window.SkyMaterial.setValue($('place'), 'custom');
  schedule();
  return true;
}
function initCoverage() {
  initEventCompassInteraction();
  initGeometryCamera();
  $('solarYearDay').oninput = (e) =>
    setDate(dateAtYearDay(Number(state.date.slice(0, 4)), Number(e.target.value)));
  $('solarYear').onfocus = () => stop();
  $('solarYear').onchange = (e) => {
    const y = Number(e.target.value);
    if (Number.isInteger(y) && y >= 1900 && y <= 2100) {
      const month = state.date.slice(5, 7),
        day = Math.min(Number(state.date.slice(8)), monthDays(y + '-' + month));
      setDate(`${y}-${month}-${String(day).padStart(2, '0')}`);
    } else e.target.value = state.date.slice(0, 4);
  };
  document.querySelectorAll('[data-earth-view]').forEach(
    (b) =>
      (b.onclick = () => {
        state.earthView = b.dataset.earthView;
        schedule();
      }),
  );
  $('worldMap').onclick = (e) => {
    const r = $('worldMap').getBoundingClientRect();
    chooseMapObserver(mapLocation(e.clientX - r.left, e.clientY - r.top, r.width, r.height));
  };
  $('worldMap').onkeydown = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    chooseMapObserver({
      lat: clamp(state.lat + (e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0), -90, 90),
      lon: clamp(
        state.lon + (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0),
        -180,
        180,
      ),
    });
  };
  for (const [id, key] of [
    ['eventRise', 'rise'],
    ['eventSet', 'set'],
  ])
    $(id).onclick = () => {
      const t = bodyDay()[key];
      if (t === null) return;
      stop();
      state.time = t;
      if (state.body === 'moon') $('moonObservation').open = true;
      schedule();
    };
}
