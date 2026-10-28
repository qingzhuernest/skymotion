/**
 * 月球星历、月相与月度观察。太阳和月球的时间管线分别处理。
 */
/* Astronomy Engine 2.1.19 (MIT). All horizon positions are unrefracted. */
const lunarCache = new Map(),
  noonCache = new Map();
function sunEquatorial(t) {
  return Astronomy.EquatorFromVector(
    Astronomy.RotateVector(
      Astronomy.Rotation_EQJ_EQD(t),
      Astronomy.GeoVector('Sun', t, true),
    ),
  );
}
function sunHourAngle(t, lon) {
  return (
    ((15 * (Astronomy.SiderealTime(t) + lon / 15 - sunEquatorial(t).ra) + 540) % 360) -
    180
  );
}
function solarNoonUTC(date, lon) {
  const key = date + ':' + lon;
  if (noonCache.has(key)) return noonCache.get(key);
  const t = new Date(date + 'T12:00:00Z');
  t.setTime(t.getTime() - lon * 4 * 60000);
  for (let i = 0; i < 4; i++) t.setTime(t.getTime() - sunHourAngle(t, lon) * 4 * 60000);
  if (noonCache.size > 40) noonCache.delete(noonCache.keys().next().value);
  noonCache.set(key, t.getTime());
  return t.getTime();
}
function instantUTC(time = state.time, date = state.date, lon = state.lon) {
  const t = new Date(solarNoonUTC(date, lon) + (time - 720) * 60000),
    target = (time - 720) / 4;
  for (let i = 0; i < 2; i++) {
    const error = ((sunHourAngle(t, lon) - target + 540) % 360) - 180;
    t.setTime(t.getTime() - error * 4 * 60000);
  }
  return t;
}
function skyRaw(body, time, date, lat, lon) {
  const t = instantUTC(time, date, lon),
    observer = new Astronomy.Observer(lat, lon, 0),
    eq = Astronomy.Equator(body, t, observer, true, true),
    h = Astronomy.Horizon(t, observer, eq.ra, eq.dec),
    a = h.altitude * rad,
    z = h.azimuth * rad;
  return {
    x: Math.cos(a) * Math.sin(z),
    y: Math.sin(a),
    z: Math.cos(a) * Math.cos(z),
    alt: h.altitude,
    az: h.azimuth,
  };
}
function refineExtremum(body, left, right, max) {
  for (let i = 0; i < 24; i++) {
    const a = left + (right - left) / 3,
      b = right - (right - left) / 3,
      aa = skyRaw(body, a, state.date, state.lat, state.lon).alt,
      bb = skyRaw(body, b, state.date, state.lat, state.lon).alt;
    if (aa < bb === max) left = a;
    else right = b;
  }
  return (left + right) / 2;
}
function ephemerisDay(body) {
  const key = [body, state.date, state.lat.toFixed(4), state.lon.toFixed(4)].join(':');
  if (lunarCache.has(key)) return lunarCache.get(key);
  const samples = [],
    nodes = [];
  let maxIndex = 0,
    minIndex = 0;
  for (let t = 0; t <= 1440; t += 5) {
    const p = skyRaw(body, t, state.date, state.lat, state.lon);
    samples.push(p);
    nodes.push({ time: t, alt: p.alt });
    if (p.alt > samples[maxIndex].alt) maxIndex = samples.length - 1;
    if (p.alt < samples[minIndex].alt) minIndex = samples.length - 1;
  }
  let peak = maxIndex * 5,
    trough = minIndex * 5;
  if (maxIndex > 0 && maxIndex < 288)
    peak = refineExtremum(body, peak - 5, peak + 5, true);
  if (minIndex > 0 && minIndex < 288)
    trough = refineExtremum(body, trough - 5, trough + 5, false);
  const maxAlt = skyRaw(body, peak, state.date, state.lat, state.lon).alt,
    minAlt = skyRaw(body, trough, state.date, state.lat, state.lon).alt;
  nodes.push({ time: peak, alt: maxAlt }, { time: trough, alt: minAlt });
  nodes.sort((a, b) => a.time - b.time);
  let rise = null,
    set = null,
    above = 0;
  const crossings = [];
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1],
      b = nodes[i];
    if (b.time - a.time < 1e-7) continue;
    if ((a.alt < 0 && b.alt >= 0) || (a.alt >= 0 && b.alt < 0)) {
      let lo = a.time,
        hi = b.time;
      for (let j = 0; j < 22; j++) {
        const mid = (lo + hi) / 2,
          alt = skyRaw(body, mid, state.date, state.lat, state.lon).alt;
        if (alt >= 0 === a.alt >= 0) lo = mid;
        else hi = mid;
      }
      const crossing = (lo + hi) / 2;
      crossings.push({ time: crossing, kind: a.alt < 0 ? 'rise' : 'set' });
      if (a.alt < 0) {
        if (rise === null) rise = crossing;
        above += b.time - crossing;
      } else {
        if (set === null) set = crossing;
        above += crossing - a.time;
      }
    } else if (a.alt >= 0 && b.alt >= 0) above += b.time - a.time;
  }
  const elapsed = (a, b) =>
    (instantUTC(b, state.date, state.lon) - instantUTC(a, state.date, state.lon)) / 60000;
  let physicalAbove = 0,
    intervalStart = 0,
    isAbove = samples[0].alt >= 0;
  for (const crossing of crossings) {
    if (isAbove) physicalAbove += elapsed(intervalStart, crossing.time);
    intervalStart = crossing.time;
    isAbove = crossing.kind === 'rise';
  }
  if (isAbove) physicalAbove += elapsed(intervalStart, 1440);
  const result = {
    noon: solarNoonUTC(state.date, state.lon),
    samples,
    rise,
    set,
    length: physicalAbove,
    timeAxisLength: above,
    peak,
    maxAlt,
    minAlt,
    crossings,
    boundaryPeak: peak === 0 || peak === 1440,
    kind:
      above > 1439.999
        ? '全天在地平线上方'
        : above < 0.001
          ? '全天在地平线下方'
          : '普通升落',
  };
  if (lunarCache.size > 16) lunarCache.delete(lunarCache.keys().next().value);
  lunarCache.set(key, result);
  return result;
}
let currentPositionCache = null;
function bodyPosition(time = state.time) {
  if (arguments.length === 0 && !(state.body === 'sun' && state.manual)) {
    const key = [state.body, state.date, state.lat, state.lon, state.time].join(':');
    if (currentPositionCache?.key === key) return currentPositionCache.position;
    const position = skyRaw(
      state.body === 'moon' ? 'Moon' : 'Sun',
      time,
      state.date,
      state.lat,
      state.lon,
    );
    if (Math.abs(position.alt) < 1e-6) {
      position.alt = 0;
      position.y = 0;
    }
    currentPositionCache = { key, position };
    return position;
  }
  if (state.body === 'sun' && state.manual) return solar(state.lat, state.dec, time);
  const day = ephemerisDay(state.body === 'moon' ? 'Moon' : 'Sun'),
    t = clamp(time, 0, 1440) / 5,
    i = Math.min(Math.floor(t), day.samples.length - 2),
    f = t - i,
    a = day.samples[i],
    b = day.samples[i + 1];
  const x = a.x + (b.x - a.x) * f,
    y = a.y + (b.y - a.y) * f,
    z = a.z + (b.z - a.z) * f,
    n = Math.hypot(x, y, z);
  return {
    x: x / n,
    y: y / n,
    z: z / n,
    alt: Math.asin(clamp(y / n, -1, 1)) * deg,
    az: (Math.atan2(x, z) * deg + 360) % 360,
  };
}
function bodyDay() {
  if (state.body === 'sun' && state.manual)
    return {
      ...daylight(state.lat, state.dec),
      peak: 720,
      maxAlt: solar(state.lat, state.dec, 720).alt,
    };
  const day = ephemerisDay(state.body === 'moon' ? 'Moon' : 'Sun');
  if (state.body === 'moon') return day;
  return {
    ...day,
    kind:
      day.kind === '全天在地平线上方'
        ? '极昼'
        : day.kind === '全天在地平线下方'
          ? '极夜'
          : '普通昼夜',
  };
}
function sunContext() {
  if (state.body === 'sun' && state.manual)
    return {
      dec: state.dec,
      lon: ((state.lon - (state.time - 720) / 4 + 540) % 360) - 180,
      utc: null,
    };
  const utc = instantUTC(),
    eq = sunEquatorial(utc);
  return {
    dec: eq.dec,
    lon: ((eq.ra * 15 - Astronomy.SiderealTime(utc) * 15 + 540) % 360) - 180,
    utc,
  };
}
function lunarPhase() {
  const t = instantUTC(),
    angle = Astronomy.MoonPhase(t),
    fraction = Astronomy.Illumination('Moon', t).phase_fraction;
  const near = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
  const name =
    near(angle, 0) < 7
      ? '新月附近'
      : near(angle, 180) < 7
        ? '满月附近'
        : near(angle, 90) < 7
          ? '上弦附近'
          : near(angle, 270) < 7
            ? '下弦附近'
            : angle < 90
              ? '盈娥眉月'
              : angle < 180
                ? '盈凸月'
                : angle < 270
                  ? '亏凸月'
                  : '残月';
  return { angle, fraction, name, date: t };
}
const seasonCache = new Map();
function seasonDate(angle, month) {
  const key = [state.date.slice(0, 4), state.lon, angle].join(':');
  if (seasonCache.has(key)) return seasonCache.get(key);
  const year = state.date.slice(0, 4),
    event = Astronomy.SearchSunLongitude(
      angle,
      new Date(year + '-' + String(month).padStart(2, '0') + '-01T00:00:00Z'),
      35,
    );
  const utc = event.date,
    utcMinutes = utc.getUTCHours() * 60 + utc.getUTCMinutes() + utc.getUTCSeconds() / 60,
    meanHour = (utcMinutes + state.lon * 4 - 720) / 4,
    equation = (((sunHourAngle(utc, state.lon) - meanHour + 540) % 360) - 180) * 4,
    mean = new Date(utc.getTime() + (state.lon * 4 + equation) * 60000);
  const value = mean.toISOString().slice(0, 10);
  if (seasonCache.size > 64) seasonCache.clear();
  seasonCache.set(key, value);
  return value;
}
// Original lunar face illustration, cached once. Features are not a registered lunar map.
let lunarFace = null;
function lunarFaceTexture() {
  if (lunarFace) return lunarFace;
  lunarFace = document.createElement('canvas');
  lunarFace.width = lunarFace.height = 256;
  const c = lunarFace.getContext('2d');
  c.fillStyle = '#c8c7c3';
  c.fillRect(0, 0, 256, 256);
  let seed = 2105;
  const random = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  // Irregular, soft basaltic plains avoid the former featureless blue appearance.
  for (const [x, y, rx, ry] of [
    [86, 76, 35, 24],
    [130, 59, 32, 23],
    [166, 86, 29, 36],
    [67, 117, 23, 32],
    [119, 107, 27, 24],
    [111, 145, 21, 16],
  ]) {
    const shade = c.createRadialGradient(x, y, 3, x, y, Math.max(rx, ry));
    shade.addColorStop(0, '#777772aa');
    shade.addColorStop(1, '#77777200');
    c.fillStyle = shade;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0.25, 0, Math.PI * 2);
    c.fill();
  }
  for (let i = 0; i < 220; i++) {
    const x = 12 + random() * 232,
      y = 12 + random() * 232,
      r = 0.6 + random() ** 3 * 6;
    c.fillStyle = '#62625d16';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#f4f2e428';
    c.lineWidth = 0.7;
    c.beginPath();
    c.arc(x, y, r, -2.8, 0.3);
    c.stroke();
  }
  return lunarFace;
}
function drawMoon(c, x, y, r, phase, brightAngle = null) {
  c.save();
  if (Number.isFinite(brightAngle)) {
    c.translate(x, y);
    c.rotate(brightAngle);
    c.translate(-x, -y);
  }
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.clip();
  const dark = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  dark.addColorStop(0, '#484b50');
  dark.addColorStop(1, '#24282e');
  c.fillStyle = dark;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  const k = 1 - 2 * phase.fraction,
    sign = Number.isFinite(brightAngle) ? 1 : phase.angle < 180 ? 1 : -1,
    steps = r > 20 ? 64 : 24;
  c.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / steps,
      px = x + sign * r * Math.cos(a),
      py = y + r * Math.sin(a);
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  for (let i = steps; i >= 0; i--) {
    const a = -Math.PI / 2 + (Math.PI * i) / steps;
    c.lineTo(x + sign * k * r * Math.cos(a), y + r * Math.sin(a));
  }
  c.closePath();
  const lit = c.createRadialGradient(x + sign * r * 0.3, y - r * 0.4, 0, x, y, r * 1.5);
  lit.addColorStop(0, '#f5f3eb');
  lit.addColorStop(0.6, '#dbdad3');
  lit.addColorStop(1, '#9b9c98');
  c.fillStyle = lit;
  c.fill();
  // Clip texture to the existing illuminated path; phase area and limb angle stay unchanged.
  c.save();
  c.clip();
  c.globalCompositeOperation = 'multiply';
  c.drawImage(lunarFaceTexture(), x - r, y - r, r * 2, r * 2);
  c.restore();
  c.restore();
  c.strokeStyle = '#c6dcf78a';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.stroke();
}

let phaseOrbitLayout = null;
function drawPhasePanel() {
  if (!canPaint($('phaseOrbit')) && !canPaint($('phaseDisk'))) return;
  const phase = visualPhase(),
    { c, w, h } = resize($('phaseOrbit'));
  if (!w || !h) return;
  const center = { x: w * 0.37, y: h * 0.5 },
    sunX = w - 54;
  const r = Math.max(
    12,
    Math.min(w * 0.27, Math.max(12, (h - 128) * 0.5), sunX - center.x - 32),
  );
  text(c, '北黄极上方俯视', w / 2, center.y - r - 46, '#b6c8dc', 11);
  text(c, '尺寸与距离为示意', w / 2, center.y - r - 30, '#b6c8dc', 10);
  // Parallel rays are a local approximation of the distant Sun, not convergent beams.
  for (const fraction of [-0.8, -0.55, -0.3, 0, 0.3, 0.55, 0.8]) {
    const y = center.y + fraction * r,
      right = sunX - 14,
      left = Math.max(8, center.x - r - 12);
    poly(
      c,
      [
        { x: right, y },
        { x: left, y },
      ],
      '#ebc87870',
      1.2,
    );
    const arrowX = center.x + r * 0.62;
    poly(
      c,
      [
        { x: arrowX + 5, y: y - 3 },
        { x: arrowX, y },
        { x: arrowX + 5, y: y + 3 },
      ],
      '#f1d18dab',
      1.4,
    );
  }
  text(
    c,
    '← 平行太阳光',
    (sunX + center.x + r) / 2,
    center.y - r * 0.8 - 14,
    '#f1d18d',
    w < 260 ? 9 : 11,
  );
  glow(c, sunX, center.y, 12);
  text(c, '远处太阳', sunX, center.y + 27, '#ffe0a0', 10);
  c.strokeStyle = '#6789af6b';
  c.lineWidth = 1;
  c.setLineDash([3, 4]);
  c.beginPath();
  c.arc(center.x, center.y, r, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  function halfLit(x, y, r, color) {
    c.fillStyle = '#304258';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
    c.closePath();
    c.fill();
  }
  halfLit(center.x, center.y, Math.min(14, r * 0.28), '#80bfe8');
  text(c, '地球', center.x, center.y + 27, '#badbf5', 12);
  const cardinal = [
    ['新月', 0],
    ['上弦', 90],
    ['满月', 180],
    ['下弦', 270],
  ];
  for (const [label, angle] of cardinal) {
    const a = angle * rad,
      x = center.x + r * Math.cos(a),
      y = center.y - r * Math.sin(a);
    c.strokeStyle = '#7994b160';
    c.beginPath();
    c.arc(x, y, 4, 0, Math.PI * 2);
    c.stroke();
    const tx = angle === 0 ? x : angle === 180 ? x : x,
      ty = angle === 0 || angle === 180 ? y + 22 : angle === 90 ? y - 14 : y + 15;
    text(c, label, tx, ty, '#899fb9', 11);
  }
  const a = phase.angle * rad,
    x = center.x + r * Math.cos(a),
    y = center.y - r * Math.sin(a);
  poly(c, [center, { x, y }], '#c2d6ed88', 1, [3, 3]);
  halfLit(x, y, 8, '#eef4fc');
  c.strokeStyle = '#b7cde1';
  c.beginPath();
  c.arc(x, y, 8, 0, Math.PI * 2);
  c.stroke();
  phaseOrbitLayout = {
    center,
    r,
    moon: { x, y },
    sun: { x: sunX, y: center.y },
    sunHalo: 48,
  };
  text(c, '拖动月球', w / 2, center.y + r + 35, '#a9c4e0', 11);
  text(c, '连续调整日期与时刻', w / 2, center.y + r + 51, '#a9c4e0', 10);
  const disk = resize($('phaseDisk'));
  drawMoon(disk.c, disk.w / 2, disk.h / 2, Math.min(disk.w, disk.h) * 0.43, phase);
  window.SkyDiagramTools?.paint('phase', {
    type: 'phase',
    canvas: $('phaseOrbit'),
    c,
    w,
    h,
    body: state.body,
    date: state.date,
    time: state.time,
    lat: state.lat,
    lon: state.lon,
    center,
    radius: r,
    sunX,
    project: (angle) => ({
      x: center.x + r * Math.cos(angle * rad),
      y: center.y - r * Math.sin(angle * rad),
    }),
    phaseAt: (date, time) => Astronomy.MoonPhase(instantUTC(time, date, state.lon)),
    fractionAt: (date, time) =>
      Astronomy.Illumination('Moon', instantUTC(time, date, state.lon)).phase_fraction,
    pick: (x, y) => ({
      angle: (Math.atan2(center.y - y, x - center.x) * deg + 360) % 360,
    }),
  });
}

/** Dragging changes the real observation instant; no invented phase-angle formula is used. */
function initPhaseInteraction() {
  const canvas = $('phaseOrbit');
  let drag = null,
    pendingFrame = 0;
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    '北黄极上方月相示意：太阳光平行入射；拖动月球连续调整日期与时刻，左右方向键按日调整',
  );
  function pointerAngle(event) {
    const rect = canvas.getBoundingClientRect(),
      p = phaseOrbitLayout;
    if (!p) return null;
    const x = event.clientX - rect.left - p.center.x,
      y = p.center.y - (event.clientY - rect.top);
    return Math.hypot(x, y) < p.r * 0.2 ? null : Math.atan2(y, x) * deg;
  }
  function applyDrag() {
    pendingFrame = 0;
    if (!drag || state.body !== 'moon') return;
    const angle = (((drag.originPhase + drag.travel) % 360) + 360) % 360;
    const estimate =
      drag.originUTC.getTime() + (drag.travel / 360) * 29.530588 * 86400000;
    const event = Astronomy.SearchMoonPhase(angle, new Date(estimate - 4 * 86400000), 8);
    if (!event) return;
    const utc = event.date,
      hourAngle = sunHourAngle(utc, state.lon);
    const utcMinutes =
      utc.getUTCHours() * 60 +
      utc.getUTCMinutes() +
      utc.getUTCSeconds() / 60 +
      utc.getUTCMilliseconds() / 60000;
    const meanHour = (utcMinutes + state.lon * 4 - 720) / 4;
    const equationMinutes = (((hourAngle - meanHour + 540) % 360) - 180) * 4;
    const localDate = new Date(utc.getTime() + (state.lon * 4 + equationMinutes) * 60000)
      .toISOString()
      .slice(0, 10);
    if (localDate < '1900-01-01' || localDate > '2100-12-31') return;
    state.date = localDate;
    state.time = clamp(720 + hourAngle * 4, 0, 1440);
    state.manual = false;
    motionTransition = null;
    // Let the shared scheduler paint once after this coalesced input update.
    schedule();
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || state.body !== 'moon') return;
    const angle = pointerAngle(event);
    if (angle === null) return;
    stop();
    drag = {
      id: event.pointerId,
      originUTC: instantUTC(),
      originPhase: lunarPhase().angle,
      lastAngle: angle,
      travel: 0,
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('phase-dragging');
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const angle = pointerAngle(event);
    if (angle === null) return;
    drag.travel += ((angle - drag.lastAngle + 540) % 360) - 180;
    drag.lastAngle = angle;
    if (!pendingFrame) pendingFrame = requestAnimationFrame(applyDrag);
  });
  function finish(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (pendingFrame) {
      cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
      applyDrag();
    }
    drag = null;
    canvas.classList.remove('phase-dragging');
  }
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
    canvas.addEventListener(name, finish);
  canvas.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || state.body !== 'moon') return;
    event.preventDefault();
    event.stopPropagation();
    workbenchShiftDate(event.key === 'ArrowRight' ? 1 : -1);
  });
}
