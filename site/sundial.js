/**
 * 水平式与赤道式日晷的投影、读数和控件同步。
 */
/* Two polar-axis sundials, linked to the existing geometric Sun model. */
let sundialLength = 0.18;
const sundialRadius = 0.32,
  sundialPlots = new Map();
function sundialModel(position = bodyPosition(), latitude = state.lat) {
  const phi = latitude * rad,
    sin = Math.sin(phi),
    cos = Math.cos(phi),
    hemisphere = latitude < 0 ? -1 : 1,
    northPole = { x: 0, y: sin, z: cos },
    meridian = { x: 0, y: -cos, z: sin },
    dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
    daylight = position.y > 1e-10,
    planeLight = dot(northPole, position),
    face = Math.abs(planeLight) < 1e-8 ? 1 : planeLight < 0 ? -1 : 1,
    cosHour = cos * position.y - sin * position.z,
    hourAngle = Math.atan2(-position.x, cosHour) * deg,
    trueMinutes = (((720 + hourAngle * 4) % 1440) + 1440) % 1440;
  const horizontal = {
    degenerate: Math.abs(sin) < 1e-8,
    available: false,
    needle: { x: 0, y: sundialLength * Math.abs(sin), z: sundialLength * cos * hemisphere },
    point: null,
  };
  if (daylight && !horizontal.degenerate) {
    const a = horizontal.needle,
      k = a.y / position.y;
    horizontal.point = { x: a.x - k * position.x, y: 0, z: a.z - k * position.z };
    horizontal.available = true;
  }
  const equatorial = {
    face,
    available: false,
    glancing: Math.abs(planeLight) < Math.sin(2 * rad),
    needle: { x: 0, y: sundialLength * northPole.y * face, z: sundialLength * northPole.z * face },
    point: null,
  };
  if (daylight && Math.abs(planeLight) > 1e-8) {
    const a = equatorial.needle,
      k = sundialLength / Math.abs(planeLight);
    equatorial.point = {
      x: a.x - k * position.x,
      y: a.y - k * position.y,
      z: a.z - k * position.z,
    };
    equatorial.available = true;
  }
  return {
    position,
    latitude,
    phi,
    hemisphere,
    northPole,
    meridian,
    daylight,
    planeLight,
    hourAngle,
    trueMinutes,
    horizontal,
    equatorial,
  };
}
function sundialHourRay(kind, hour, model) {
  const H = (hour * 15 - 180) * rad;
  if (kind === 'horizontal') {
    const x = Math.abs(Math.sin(model.phi)) * Math.sin(H),
      v = model.hemisphere * Math.cos(H),
      n = Math.hypot(x, v);
    return { x: x / (n || 1), v: v / (n || 1) };
  }
  return { x: model.equatorial.face * Math.sin(H), v: Math.cos(H) };
}
function sundialPlanePoint(kind, model) {
  const p = model[kind].point;
  if (!p) return null;
  return kind === 'horizontal'
    ? { x: p.x, v: p.z }
    : { x: model.equatorial.face * p.x, v: p.y * model.meridian.y + p.z * model.meridian.z };
}
function drawSundialSide(c, w, h, kind, model) {
  const center = { x: w / 2, y: kind === 'horizontal' ? h - 40 : h - 75 },
    ground = h - 28,
    k = 42,
    phi = model.phi;
  poly(
    c,
    [
      { x: 20, y: ground },
      { x: w - 20, y: ground },
    ],
    '#c2b597',
    1,
    [3, 3],
  );
  text(c, Math.abs(model.latitude) > 89.99999999 ? '南*' : '南', 24, ground + 11, '#8a7c65', 10);
  text(
    c,
    Math.abs(model.latitude) > 89.99999999 ? '北*' : '北',
    w - 24,
    ground + 11,
    '#8a7c65',
    10,
  );
  text(c, '安装侧视 · 南北剖面', 20, h - 115, '#75664e', 11, 'left');
  if (kind === 'horizontal') {
    poly(
      c,
      [
        { x: 30, y: center.y },
        { x: w - 30, y: center.y },
      ],
      '#aa884e',
      4,
    );
    const needle = {
      x: center.x + k * Math.cos(phi) * model.hemisphere,
      y: center.y - k * Math.abs(Math.sin(phi)),
    };
    poly(c, [center, needle], '#3a8479', 4);
    text(
      c,
      '晷面水平 · 晷针仰角 ' + Math.abs(model.latitude).toFixed(1) + '°',
      w / 2,
      h - 12,
      '#6c604a',
      11,
    );
  } else {
    const plane = { x: k * Math.sin(phi), y: k * Math.cos(phi) };
    poly(c, [{ x: center.x, y: ground }, center], '#aa9d82', 3);
    poly(
      c,
      [
        { x: center.x - plane.x, y: center.y - plane.y },
        { x: center.x + plane.x, y: center.y + plane.y },
      ],
      '#aa884e',
      4,
    );
    const axis = { x: k * Math.cos(phi), y: -k * Math.sin(phi) };
    poly(
      c,
      [
        { x: center.x - axis.x, y: center.y - axis.y },
        { x: center.x + axis.x, y: center.y + axis.y },
      ],
      '#3a8479',
      4,
    );
    text(
      c,
      '晷面倾角 ' + (90 - Math.abs(model.latitude)).toFixed(1) + '° · 针面垂直',
      w / 2,
      h - 12,
      '#6c604a',
      11,
    );
  }
}
function drawSundial(kind, model) {
  if (sundialView === 'device') {
    drawSundialDevice(kind, model);
    return;
  }
  const canvas = $(kind === 'horizontal' ? 'horizontalDial' : 'equatorialDial');
  if (!canPaint(canvas)) return;
  const { c, w, h } = resize(canvas),
    center = { x: w / 2, y: h * 0.35 },
    R = Math.min(w * 0.36, h * 0.245),
    device = model[kind],
    map = (p) => ({
      x: center.x + (p.x / sundialRadius) * R,
      y: center.y - (p.v / sundialRadius) * R,
    }),
    night = !model.daylight;
  c.fillStyle = night ? '#e5dfd2' : '#e8d3a1';
  c.beginPath();
  c.arc(center.x, center.y, R, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#b29765';
  c.lineWidth = 3;
  c.stroke();
  for (const ratio of [0.24, 0.7, 0.92]) {
    c.beginPath();
    c.arc(center.x, center.y, R * ratio, 0, Math.PI * 2);
    c.strokeStyle = '#bea67d66';
    c.lineWidth = 1;
    c.stroke();
  }
  text(
    c,
    kind === 'horizontal'
      ? '晷面俯视 · 北向上'
      : !model.daylight
        ? '夜间参考盘面 · 无直射日影'
        : !model.equatorial.available
          ? '阳光平行晷面 · 无有效受光面'
          : model.equatorial.face > 0
            ? '受光面：朝北天极的一面'
            : '受光面：朝南天极的一面',
    w / 2,
    16,
    '#726146',
    w < 340 ? 11 : 12,
  );
  const ticks = [];
  if (kind !== 'horizontal' || !device.degenerate)
    for (let hour = 0; hour < 24; hour++) {
      const ray = sundialHourRay(kind, hour, model),
        outer = { x: center.x + ray.x * R * 0.95, y: center.y - ray.v * R * 0.95 },
        inner = { x: center.x + ray.x * R * 0.17, y: center.y - ray.v * R * 0.17 },
        lit = bodyPosition(hour * 60).y > 1e-10,
        major = hour % 3 === 0;
      poly(c, [inner, outer], lit ? '#96774799' : '#b6ad9c55', major ? 1.3 : 0.7);
      const label = { x: center.x + ray.x * R * 0.83, y: center.y - ray.v * R * 0.83 };
      if (major && (Math.abs(model.latitude) >= 10 || kind === 'equatorial' || hour % 6 === 0))
        text(c, String(hour).padStart(2, '0'), label.x, label.y, lit ? '#665332' : '#aa9d84', 11);
      ticks.push({ ...outer, time: hour * 60 });
    }
  sundialPlots.set(kind, { ticks, center, R, model });
  if (kind === 'horizontal') {
    for (const [name, x, v] of [
      ['北', 0, 1],
      ['南', 0, -1],
      ['东', 1, 0],
      ['西', -1, 0],
    ])
      text(
        c,
        name + (Math.abs(model.latitude) > 89.99999999 ? '*' : ''),
        center.x + x * (R + 15),
        center.y - v * (R + 14),
        '#85714d',
        11,
      );
  }
  const p = sundialPlanePoint(kind, model);
  if (p) {
    const length = Math.hypot(p.x, p.v),
      outside = length > sundialRadius,
      f = outside ? sundialRadius / length : 1,
      end = map({ x: p.x * f, v: p.v * f });
    c.save();
    c.lineCap = 'round';
    poly(c, [center, end], '#b4782a44', 9);
    poly(c, [center, end], '#73512d', 3.2);
    if (outside) {
      const dx = end.x - center.x,
        dy = end.y - center.y,
        n = Math.hypot(dx, dy) || 1;
      poly(
        c,
        [
          { x: end.x - (dx / n) * 9 - (dy / n) * 4, y: end.y - (dy / n) * 9 + (dx / n) * 4 },
          end,
          { x: end.x - (dx / n) * 9 + (dy / n) * 4, y: end.y - (dy / n) * 9 - (dx / n) * 4 },
        ],
        '#aa602d',
        2,
      );
    } else {
      c.fillStyle = '#b56931';
      c.beginPath();
      c.arc(end.x, end.y, 4, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  if (kind === 'horizontal') {
    const end = map({ x: 0, v: device.needle.z });
    poly(c, [center, end], '#3a8479', 3.5);
  }
  c.fillStyle = '#3a8479';
  c.strokeStyle = '#f7f0df';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(center.x, center.y, 4.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  if (!device.available)
    text(
      c,
      !model.daylight
        ? '太阳在地平线上或下方'
        : kind === 'horizontal'
          ? '赤道处，水平日晷退化'
          : '阳光平行晷面，无法读时',
      w / 2,
      h * 0.35 + R + 37,
      '#877455',
      11,
    );
  else text(c, '当地真太阳时 ' + hhmm(model.trueMinutes), w / 2, h * 0.35 + R + 34, '#75582e', 12);
  drawSundialSide(c, w, h, kind, model);
}
function drawSundials() {
  if (state.body !== 'sun' || !$('sundialPanel').open) return;
  const model = sundialModel();
  drawSundial('horizontal', model);
  drawSundial('equatorial', model);
}
function renderSundials() {
  const panel = $('sundialPanel'),
    sun = state.body === 'sun';
  $('sundialLauncher').hidden = !sun;
  panel.hidden = !sun;
  if (!sun && panel.open) panel.close();
  if (!sun || !panel.open) return;
  renderSundialDeviceControls();
  const model = sundialModel();
  $('sundialSolarClock').textContent = hhmm(state.time, true);
  const offset = state.sundialOffset ?? 8;
  if (document.activeElement !== $('sundialOffset')) $('sundialOffset').value = offset;
  $('sundialWatchLabel').textContent = '对照钟表时 · UTC' + (offset >= 0 ? '+' : '') + offset;
  if (state.manual) {
    $('sundialWatchClock').textContent = '—';
    $('sundialClockNote').textContent =
      '理想实验只比较太阳方向和日晷刻度，不对应某个真实 UTC 或钟表时。';
  } else {
    const utc = instantUTC(state.time),
      clock = new Date(utc.getTime() + offset * 3600000);
    $('sundialWatchClock').textContent =
      clock.toISOString().slice(5, 10) + ' ' + clock.toISOString().slice(11, 16);
    $('sundialClockNote').textContent =
      '日晷读当地真太阳时。对照钟表时与经度、UTC 偏移及均时差有关，二者不是同一种时间；日行迹的时间设置独立于这里。';
  }
  $('horizontalDialReading').textContent = model.horizontal.available
    ? hhmm(model.trueMinutes)
    : model.horizontal.degenerate
      ? '赤道处无法读时'
      : '无直射日影';
  $('equatorialDialReading').textContent = model.equatorial.available
    ? hhmm(model.trueMinutes) + (model.equatorial.glancing ? '（理想值）' : '')
    : model.daylight
      ? '光线平行晷面'
      : '无直射日影';
  $('horizontalDialNote').textContent =
    (model.horizontal.degenerate
      ? '赤道处晷针平卧，经典水平日晷退化。'
      : (Math.abs(state.lat) < 10 ? '接近赤道时刻度拥挤，装置不便精确读时。' : '') +
        '晷针向' +
        (state.lat < 0 ? '南' : '北') +
        '天极，仰角 ' +
        Math.abs(state.lat).toFixed(1) +
        '°。') + ' 不同于竖直立杆，其读时依靠晷针方向与时刻线。';
  $('equatorialDialNote').textContent =
    '晷面与水平面夹角 ' +
    (90 - Math.abs(state.lat)).toFixed(1) +
    '°，晷针穿过盘面、与地轴平行。' +
    (!model.daylight
      ? '当前太阳不在地平线上方，装置不能靠直射阳光读时。'
      : !model.equatorial.available
        ? '太阳光与晷面平行，此时无法用此日晷读时。'
        : model.equatorial.glancing
          ? '光线接近平行晷面，影尖很远、实际明暗对比弱；箭头只表示影尖超出盘面。'
          : model.equatorial.face > 0
            ? '目前照亮朝北天极的一面。'
            : '目前照亮朝南天极的一面。');
}
function initSundials() {
  initSundialDevice();
  for (const b of document.querySelectorAll('[data-dial-time]'))
    b.onclick = () => {
      stop();
      state.time = Number(b.dataset.dialTime);
      schedule();
    };
  $('sundialOffset').onchange = (e) => {
    const n = Number(e.target.value);
    state.sundialOffset = Number.isFinite(n) ? clamp(n, -12, 14) : 8;
    e.target.value = state.sundialOffset;
    schedule();
  };
  for (const [kind, id] of [
    ['horizontal', 'horizontalDial'],
    ['equatorial', 'equatorialDial'],
  ]) {
    const canvas = $(id);
    canvas.onclick = (e) => {
      if (
        state.body !== 'sun' ||
        canvas.dataset.suppressClick ||
        (sundialView === 'device' && sundialDragMode === 'orbit')
      )
        return;
      const r = canvas.getBoundingClientRect(),
        x = e.clientX - r.left,
        y = e.clientY - r.top;
      let best = 26,
        chosen = null;
      for (const p of sundialPlots.get(kind)?.ticks || []) {
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < best) {
          best = d;
          chosen = p;
        }
      }
      if (chosen) {
        stop();
        state.time = chosen.time;
        schedule();
      }
    };
    canvas.addEventListener('keydown', (e) => {
      if (state.body !== 'sun' || !['ArrowLeft', 'ArrowRight', 'Home'].includes(e.key)) return;
      e.preventDefault();
      stop();
      state.time =
        e.key === 'Home' ? 720 : clamp(state.time + (e.key === 'ArrowRight' ? 60 : -60), 0, 1440);
      schedule();
    });
  }
}
