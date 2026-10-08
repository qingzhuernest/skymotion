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
function illuminationAt(lat, lon, context = sunContext()) {
  const p = lat * rad,
    d = context.dec * rad,
    h = (lon - context.lon) * rad;
  return Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(h);
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
    uiWorkspace?.selected !== 'riseSetPanel'
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
function drawEventCompass(m) {
  if (!canPaint($('eventCompass'))) return;
  const { c, w, h } = resize($('eventCompass')),
    cx = w / 2,
    cy = h / 2,
    r = Math.max(12, Math.min(Math.min(w, h) * 0.39, Math.min(w, h) / 2 - 24));
  poly(
    c,
    [
      { x: cx - r, y: cy },
      { x: cx + r, y: cy },
    ],
    '#60799777',
  );
  poly(
    c,
    [
      { x: cx, y: cy - r },
      { x: cx, y: cy + r },
    ],
    '#60799777',
  );
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
    text(
      c,
      label,
      cx + (r + 12) * Math.sin(a * rad),
      cy - (r + 12) * Math.cos(a * rad),
      '#c4d6e9',
      12,
    );
  if (!m.pole)
    for (const [key, col] of [
      ['rise', '#ffc35a'],
      ['set', '#9ebaff'],
    ]) {
      const e = m[key];
      if (!e.position) continue;
      const a = e.position.az * rad,
        p = { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
      poly(c, [{ x: cx, y: cy }, p], col, 2);
      c.fillStyle = col;
      c.beginPath();
      c.arc(p.x, p.y, 4, 0, Math.PI * 2);
      c.fill();
      text(
        c,
        key === 'rise' ? '出' : '落',
        cx + r * 0.62 * Math.sin(a),
        cy - r * 0.62 * Math.cos(a),
        col,
        12,
      );
    }
  c.fillStyle = '#78cfff';
  c.beginPath();
  c.arc(cx, cy, 3, 0, Math.PI * 2);
  c.fill();
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
function drawEarthGeometry() {
  if (!canPaint($('earthGeometry'))) return;
  const { c, w, h } = resize($('earthGeometry')),
    m = geometryModel(),
    R = Math.min(w * 0.27, h * 0.29),
    cx = w * 0.45,
    cy = h * 0.53;
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
    eye = [0.6 * Math.sqrt(0.91), 0.3, 0.8 * Math.sqrt(0.91)],
    project = (v) => ({
      x: cx + R * (0.8 * v[0] - 0.6 * v[2]),
      y: cy - R * (-0.18 * v[0] + Math.sqrt(0.91) * v[1] - 0.24 * v[2]),
    }),
    scale = (v, k) => v.map((x) => x * k),
    add = (a, b) => a.map((v, i) => v + b[i]);
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
  ring([0, 0, 0], [1, 0, 0], [0, 0, 1], 1, '#abaef4', 1.5);
  ring([0, 0, 0], [1, 0, 0], [0, 1, 0], 1, '#7394b760');
  const axisTop = project([0, 1.3, 0]),
    axisBottom = project([0, -1.3, 0]);
  poly(c, [axisBottom, axisTop], '#fa9c89', 2);
  text(c, '北极 / 地轴', axisTop.x, axisTop.y - 12, '#fac0b0', 12);
  text(c, '南极', axisBottom.x, axisBottom.y + 13, '#fac0b0', 12);
  if (m.eclipticNormal) {
    const tip = project(scale(m.eclipticNormal, 1.22));
    poly(c, [project(scale(m.eclipticNormal, -1.22)), tip], '#b9a8db88', 1, [4, 4]);
    text(c, '黄道法线', tip.x + 8, tip.y + 10, '#b9a8db', 11, 'left');
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
  c.beginPath();
  plane.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.closePath();
  c.fillStyle = '#76d4bd30';
  c.fill();
  poly(c, plane, '#76d4bd', 1.5);
  const observer = project(m.q),
    zenith = project(scale(m.q, 1.55));
  poly(c, [project([0, 0, 0]), zenith], '#82c7ff', 1.5, [4, 4]);
  text(c, '当地天顶', zenith.x, zenith.y - 13, '#a4d7ff', 12);
  const rayEnd = project(add(m.q, scale(m.sun, 0.83)));
  poly(c, [rayEnd, observer], '#ffc35a', 2, bodyPosition().alt < 0 ? [4, 4] : []);
  glow(c, rayEnd.x, rayEnd.y, 5);
  c.fillStyle = '#82c7ff';
  c.strokeStyle = '#fff';
  c.beginPath();
  c.arc(observer.x, observer.y, 4, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  text(c, '观察者', observer.x, observer.y + 17, '#c5e6ff', 12);
  text(c, '太阳', rayEnd.x + 12, rayEnd.y + 7, '#ffda8b', 12, 'left');
  $('geometryObserver').textContent =
    '观察纬度 ' + coord(state.lat, 'lat') + ' · 太阳高度 ' + bodyPosition().alt.toFixed(1) + '°';
  $('geometryExplanation').textContent =
    '地平面与当地天顶垂直。改变纬度会改变地轴相对当地地平面的倾斜；改变日期和时刻会改变太阳相对地平面的方向。';
  $('geometryNote').textContent =
    '三维关系的二维投影：地球按球形近似、作透明示意，远侧圆弧用虚线表示；观察者和地平面大小为示意。太阳方向线不表示光能穿过地球，太阳低于地平线时方向线改为虚线。' +
    (m.obliquity === null
      ? '理想实验不对应实际公转位置，隐藏黄道法线。'
      : '地轴与黄道法线实际夹角约 ' + m.obliquity.toFixed(2) + '°，图上的投影夹角不等于实际夹角。');
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
function chooseMapObserver(location) {
  if (!location) return;
  stop();
  state.lat = location.lat;
  state.lon = location.lon;
  state.place = 'custom';
  $('place').value = 'custom';
  schedule();
}
function initCoverage() {
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
