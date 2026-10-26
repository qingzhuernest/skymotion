/**
 * 共享状态、坐标计算、主绘图与基础事件。各专题脚本使用这里的状态和工具。
 */
'use strict';
const $ = (id) => document.getElementById(id),
  rad = Math.PI / 180,
  deg = 180 / Math.PI;
// BEGIN GENERATED STATE DEFAULTS
// prettier-ignore
const initialSun = {
  "body": "sun",
  "lat": 39.9,
  "lon": 116.4,
  "dec": 23.44,
  "time": 720,
  "date": "2026-06-21",
  "manual": false,
  "view": "orbit",
  "observerAz": 180,
  "yaw": -0.55,
  "pitch": 0.38,
  "zoom": 1,
  "playing": false,
  "track": true,
  "shadow": true,
  "shadowZoom": 4,
  "shadowTrace": false,
  "sundialOffset": 8,
  "solarDateMode": false,
  "solarDateRate": 3,
  "solarDateLoop": true,
  "solarDateTrail": true,
  "solarDateLink": true,
  "solarDateLinkBackup": null,
  "compare": false,
  "angles": true,
  "height": 1,
  "speed": 60,
  "loop": true,
  "daysRate": 1,
  "monthLoop": true,
  "place": "39.9,116.4",
  "earthView": "globe",
  "globeDragMode": "view",
  "observerTimeBasis": "solar",
  "observerConstraint": "free",
  "globeCameraLat": 39.9,
  "globeCameraLon": 116.4,
  "globeCameraReady": false,
  "moonOverlay": false,
  "analemma": false,
  "analemmaClock": 720,
  "analemmaBasis": "clock",
  "analemmaOffset": 8,
  "analemmaView": "dome",
  "analemmaCompare": false,
  "analemmaYaw": -0.55,
  "analemmaPitch": 0.38,
  "analemmaZoom": 1,
  "analemmaIdeal": false,
  "analemmaTilt": 23.44,
  "analemmaEccentricity": 0.0167
};
// prettier-ignore
const initialMoon = {
  ...initialSun,
  "body": "moon",
  "time": 1200,
  "moonDayPlayback": false,
  "companion": false,
  "planet": "Venus",
  "companionSearchResult": null
};
// END GENERATED STATE DEFAULTS
const modeStates = { sun: { ...initialSun }, moon: { ...initialMoon } };
let state = modeStates.sun;
const seasons = {
  '2026-03-20': { name: '春分', dec: 0 },
  '2026-06-21': { name: '夏至', dec: 23.44 },
  '2026-09-23': { name: '秋分', dec: 0 },
  '2026-12-22': { name: '冬至', dec: -23.44 },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function solar(lat, dec, time) {
  const p = lat * rad,
    d = dec * rad,
    h = (time / 4 - 180) * rad;
  const x = -Math.cos(d) * Math.sin(h),
    y = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(h),
    z = Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(h);
  const yy = Math.abs(y) < 1e-12 ? 0 : clamp(y, -1, 1);
  return {
    x,
    y: yy,
    z,
    alt: Math.asin(yy) * deg,
    az: (Math.atan2(x, z) * deg + 360) % 360,
  };
}
function daylight(lat, dec) {
  const p = lat * rad,
    d = dec * rad,
    a = Math.sin(p) * Math.sin(d),
    b = Math.cos(p) * Math.cos(d);
  if (Math.abs(b) < 1e-9) {
    if (a > 1e-9) return { kind: '极昼', length: 1440, rise: null, set: null };
    if (a < -1e-9) return { kind: '极夜', length: 0, rise: null, set: null };
    return { kind: '太阳沿地平线运行', length: null, rise: null, set: null };
  }
  const c = -a / b;
  if (c < -1 - 1e-12) return { kind: '极昼', length: 1440, rise: null, set: null };
  if (c > 1 + 1e-12) return { kind: '极夜', length: 0, rise: null, set: null };
  if (Math.abs(Math.abs(c) - 1) < 1e-12)
    return { kind: '地平线相切', length: c < 0 ? 1440 : 0, rise: null, set: null };
  const h = Math.acos(clamp(c, -1, 1)) * deg * 4;
  return { kind: '普通昼夜', length: h * 2, rise: 720 - h, set: 720 + h };
}
function hhmm(t, boundary = false) {
  if (t === null) return '—';
  if (t === 1440) return '24:00';
  if (boundary && t >= 1439.5) return '24:00';
  t = ((Math.round(t) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
function coord(v, axis) {
  return (
    Math.abs(v).toFixed(1) +
    '°' +
    (Math.abs(v) < 0.05 ? '' : axis === 'lat' ? (v > 0 ? 'N' : 'S') : v > 0 ? 'E' : 'W')
  );
}
function heading(a) {
  return ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][Math.round(a / 45) % 8];
}
function dateDec(date, lon = state.lon) {
  return sunEquatorial(new Date(solarNoonUTC(date, lon))).dec;
}
function selectedPlaceName() {
  const place = $('place'),
    option = place?.options[place.selectedIndex];
  return !option || option.value === 'custom'
    ? '自定义地点'
    : option.text.split(' · ')[0];
}
function resize(canvas) {
  const box = canvas.getBoundingClientRect(),
    dpr = Math.min(window.devicePixelRatio || 1, 2),
    w = box.width,
    h = box.height;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  c.skyNaturalBackdrop=false;
  return { c, w, h };
}
function poly(c, points, color, width = 1, dash = []) {
  if (!points.length) return;
  c.beginPath();
  points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.strokeStyle = !c.skyNaturalBackdrop ? (window.SkyPreferences?.canvasInk(color,3)||color) : color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.stroke();
  c.setLineDash([]);
}
function text(c, s, x, y, color = '#9cacc0', size = 12, align = 'center') {
  c.font = `${size}px "SkyMotion Reading", serif`;
  const canvasStyle=window.SkyPreferences?.canvasStyle;
  if(canvasStyle?.custom&&!c.skyNaturalBackdrop) {
    const width=c.measureText(String(s)).width;
    c.fillStyle=canvasStyle.color;
    c.fillRect(x-(align==='center'?width/2:align==='right'?width:0)-2,y-size*.65,width+4,size*1.3);
    c.fillStyle=window.SkyPreferences.canvasInk(color);
  }else c.fillStyle=color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(s, x, y);
}
function glow(c, x, y, r = 8) {
  const g = c.createRadialGradient(x, y, 0, x, y, r * 4);
  g.addColorStop(0, '#ffd57daa');
  g.addColorStop(1, '#ffd57d00');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r * 4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffe4a2';
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
// Split at the actual horizon and north seam, sharing boundary vertices.
function skyTrackSegments(positionAt, project, panorama = false, left = 40, right = 0) {
  const groups = [];
  function between(a, b, f) {
    const x = a.x + (b.x - a.x) * f,
      y = a.y + (b.y - a.y) * f,
      z = a.z + (b.z - a.z) * f,
      n = Math.hypot(x, y, z) || 1;
    return { x: x / n, y: y / n, z: z / n };
  }
  function add(a, b, ta, tb) {
    const above = a.y + b.y >= 0,
      pa = project(a),
      pb = project(b);
    if (panorama) {
      const edge = a.x + b.x < 0 ? right : left;
      for (const [v, p] of [
        [a, pa],
        [b, pb],
      ])
        if (Math.abs(v.x) < 1e-10 && v.z > 0) p.x = edge;
    }
    const previous = groups.at(-1),
      last = previous?.points.at(-1);
    if (
      previous &&
      previous.above === above &&
      Math.hypot(last.x - pa.x, last.y - pa.y) < 1e-6
    ) {
      previous.points.push(pb);
      previous.end = tb;
    } else groups.push({ above, points: [pa, pb], start: ta, end: tb });
  }
  let a = positionAt(0);
  for (let t = 3; t <= 1440; t += 3) {
    const b = positionAt(t),
      cuts = [0, 1];
    if (a.y * b.y < 0) cuts.push(a.y / (a.y - b.y));
    if (panorama && a.x * b.x < 0) {
      const f = a.x / (a.x - b.x),
        north = between(a, b, f);
      if (north.z > 0) cuts.push(f);
    }
    cuts.sort((a, b) => a - b);
    const unique = cuts.filter((f, i) => !i || f - cuts[i - 1] > 1e-10);
    for (let i = 1; i < unique.length; i++) {
      const f = unique[i - 1],
        g = unique[i];
      add(
        f === 0 ? a : between(a, b, f),
        g === 1 ? b : between(a, b, g),
        t - 3 + f * 3,
        t - 3 + g * 3,
      );
    }
    a = b;
  }
  return groups;
}
// The lunar path covers one calendar day, not a closed lunar rotation.
function drawMoonDayEndpoints(c, project, w, h, positionAt) {
  const ends = [
    { time: 0, label: '月 00:00', color: '#93dcec' },
    { time: 1440, label: '月 24:00', color: '#cbb8ff' },
  ].map((e) => ({ ...e, position: positionAt(e.time) }));
  for (const e of ends) e.point = project(e.position);
  const close =
    Math.hypot(ends[0].point.x - ends[1].point.x, ends[0].point.y - ends[1].point.y) < 80;
  const boxes = [];
  c.save();
  c.font = '11px "SkyMotion Reading", serif';
  ends.forEach((e, i) => {
    const p = e.point;
    if (p.x < 12 || p.x > w - 12 || p.y < 65 || p.y > h - 38) return;
    const other = ends[1 - i].point,
      side = p.x === other.x ? (i ? 1 : -1) : p.x < other.x ? -1 : 1,
      tw = c.measureText(e.label).width,
      bw = tw + 12;
    const bx = clamp(side < 0 ? p.x - 12 - bw : p.x + 12, 8, w - bw - 8),
      by = clamp(p.y + (close ? (i ? 12 : -30) : -26), 58, h - 38);
    poly(c, [p, { x: side < 0 ? bx + bw : bx, y: by + 10 }], e.color + '99', 1);
    boxes.push({ x: bx + bw / 2, y: by + 10, width: bw });
    c.fillStyle = '#102337ee';
    c.beginPath();
    c.roundRect(bx, by, bw, 20, 6);
    c.fill();
    text(c, e.label, bx + bw / 2, by + 10, e.color, 11);
    c.beginPath();
    c.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    c.fillStyle = e.color;
    c.fill();
    c.strokeStyle = '#102337';
    c.lineWidth = 1.5;
    c.stroke();
  });
  c.restore();
  return boxes;
}
const skyTrackCache = new Map();
function drawSkyScene(kind, canvas=$('sky'), display=null) {
  const view=display?.view ?? state.view;
  if (view === 'observer') {
    drawObserverSky(canvas,display);
    return;
  }
  if (!canPaint(canvas)) return;
  const camera = display || motionCamera();
  const { c, w, h } = resize(canvas),
    R = Math.min(w * 0.37, h * 0.41) * camera.zoom,
    C = { x: w * 0.5, y: h * 0.56 };
  let project;
  if (view === 'top') {
    project = (p) => ({ x: C.x + p.x * R, y: C.y - p.z * R });
  } else if (view === 'horizon') {
    project = (p) => {
      const az = (Math.atan2(p.x, p.z) * deg + 360) % 360,
        alt = Math.asin(clamp(p.y, -1, 1)) * deg;
      return {
        x: 40 + (az / 360) * (w - 80),
        y: h * 0.69 - (alt / 90) * (h * 0.49),
        wrap: az,
      };
    };
  } else {
    project = (p) => {
      const u = p.x * Math.cos(camera.yaw) + p.z * Math.sin(camera.yaw),
        v = -p.x * Math.sin(camera.yaw) + p.z * Math.cos(camera.yaw);
      return {
        x: C.x + u * R,
        y: C.y - v * R * Math.sin(camera.pitch) - p.y * R * Math.cos(camera.pitch),
      };
    };
  }
  if (view === 'horizon') {
    for (let a = 0; a <= 360; a += 45) {
      const x = 40 + (a / 360) * (w - 80);
      poly(
        c,
        [
          { x, y: 70 },
          { x, y: h * 0.79 },
        ],
        '#526a8128',
      );
      text(
        c,
        Math.abs(state.lat) > 89.99999999 ? a + '°参考' : heading(a) + ' ' + a + '°',
        x,
        h * 0.83,
        '#adc1d3',
        11,
      );
    }
    for (let a = 0; a <= 90; a += 30) {
      const y = h * 0.69 - (a / 90) * h * 0.49;
      poly(
        c,
        [
          { x: 32, y },
          { x: w - 32, y },
        ],
        a === 0 ? '#7498b9' : '#58708733',
        a === 0 ? 1.4 : 1,
      );
      text(c, a + '°', 18, y, '#8ea5bb', 10);
    }
    const g = c.createLinearGradient(0, h * 0.69, 0, h);
    g.addColorStop(0, '#36514366');
    g.addColorStop(1, '#1c302522');
    c.fillStyle = g;
    c.fillRect(32, h * 0.69, w - 64, h * 0.15);
  } else {
    const ground = [];
    for (let a = 0; a <= 360; a += 3)
      ground.push(project({ x: Math.sin(a * rad), y: 0, z: Math.cos(a * rad) }));
    c.beginPath();
    ground.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    c.fillStyle = '#253a385c';
    c.fill();
    poly(c, ground, '#698a9755', 1.2);
    for (let rr = 0.25; rr < 1; rr += 0.25) {
      const ps = [];
      for (let a = 0; a <= 360; a += 4)
        ps.push(project({ x: rr * Math.sin(a * rad), y: 0, z: rr * Math.cos(a * rad) }));
      poly(c, ps, '#698a9722');
    }
    for (let a = 0; a < 360; a += 30)
      poly(
        c,
        [
          project({ x: 0, y: 0, z: 0 }),
          project({ x: Math.sin(a * rad), y: 0, z: Math.cos(a * rad) }),
        ],
        '#698a9722',
      );
    if (view === 'orbit') {
      for (let a = 0; a < 180; a += 30) {
        const ps = [];
        for (let alt = 0; alt <= 180; alt += 3)
          ps.push(
            project({
              x: Math.cos(alt * rad) * Math.sin(a * rad),
              y: Math.sin(alt * rad),
              z: Math.cos(alt * rad) * Math.cos(a * rad),
            }),
          );
        poly(c, ps, '#6c95b426', 1, [3, 5]);
      }
      for (let alt = 30; alt <= 60; alt += 30) {
        const ps = [];
        for (let a = 0; a <= 360; a += 4)
          ps.push(
            project({
              x: Math.cos(alt * rad) * Math.sin(a * rad),
              y: Math.sin(alt * rad),
              z: Math.cos(alt * rad) * Math.cos(a * rad),
            }),
          );
        poly(c, ps, '#6c95b41f', 1, [3, 5]);
      }
    }
    [
      ['北', 0],
      ['东', 90],
      ['南', 180],
      ['西', 270],
    ].forEach(([s, a]) => {
      const p = project({ x: 1.1 * Math.sin(a * rad), y: 0, z: 1.1 * Math.cos(a * rad) });
      text(
        c,
        Math.abs(state.lat) > 89.99999999 ? a + '°参考' : s,
        p.x,
        p.y,
        s === '北' ? '#7dc6f4' : '#afc3d6',
        14,
      );
    });
  }
  function drawTrack(d, col, width, actual = false, positionFn = null) {
    const positionAt = (t) =>
        positionFn
          ? visualTrackPosition(t, positionFn(t), 'Moon')
          : actual
            ? visualTrackPosition(t, bodyPosition(t))
            : solar(state.lat, d, t),
      key = [
        kind,
        positionFn ? 'overlay' : actual ? 'actual' : 'ideal',
        state.date,
        state.lat,
        state.lon,
        state.manual,
        (actual && !state.manual) || positionFn ? 'date' : d,
        view,
        w,
        h,
        camera.yaw,
        camera.pitch,
        camera.zoom,
      ].join(':'),
      cacheable = !motionTransition;
    let segments = cacheable ? skyTrackCache.get(key) : null;
    if (!segments) {
      segments = skyTrackSegments(
        positionAt,
        project,
        view === 'horizon',
        40,
        w - 40,
      );
      if (cacheable) {
        if (skyTrackCache.size >= 12)
          skyTrackCache.delete(skyTrackCache.keys().next().value);
        skyTrackCache.set(key, segments);
      }
    }
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const segment of segments)
      poly(
        c,
        segment.points,
        segment.above ? col : col + '44',
        segment.above ? width : 1,
        segment.above ? [] : [4, 5],
      );
    c.restore();
  }
  if (kind === 'sun' && state.solarDateMode && state.solarDateTrail)
    drawAnnualSolarTrail(c, project, w, h, camera);
  if (kind === 'sun' && state.compare) {
    drawTrack(23.44, '#ff906b', 1.5);
    drawTrack(0, '#79d4bf', 1.5);
    drawTrack(-23.44, '#80b9f3', 1.5);
  }
  if (state.track)
    drawTrack(state.dec, kind === 'moon' ? '#b4cff5' : '#ffc35a', 2.7, true);
  if (kind === 'sun' && isMoonOverlayActive() && state.track)
    drawTrack(0, '#b4cff5', 2, true, moonOverlayPosition);
  if (state.track && (kind === 'moon' || isMoonOverlayActive()))
    drawMoonDayEndpoints(c, project, w, h, (t) =>
      visualTrackPosition(
        t,
        kind === 'moon' ? bodyPosition(t) : moonOverlayPosition(t),
        'Moon',
      ),
    );
  const s = visualPosition(kind === 'moon' ? 'Moon' : 'Sun', bodyPosition()),
    sun = project(s),
    origin = project({ x: 0, y: 0, z: 0 });
  if (view !== 'horizon') {
    const groundRadius =
      kind === 'sun' ? shadowGroundRadius() : 6.25 * Math.max(1, state.height);
    if (kind === 'sun' && state.solarDateMode && state.solarDateTrail)
      drawAnnualShadowTrail(c, project, groundRadius);
    if (kind === 'sun') drawShadowTrace(c, project, groundRadius);
    if (kind === 'sun' && state.shadow) drawCurrentShadow(c, project, s, groundRadius);
    if (state.angles) {
      poly(c, [origin, sun], s.alt >= 0 ? '#ffdb8366' : '#6c849644', 1, [4, 4]);
      if (view === 'orbit') {
        const foot = project({ x: s.x, y: 0, z: s.z });
        poly(c, [origin, foot, sun], '#c0d2e04a', 1, [3, 4]);
      }
    }
    c.fillStyle = '#8cd1ff';
    c.beginPath();
    c.arc(origin.x, origin.y, 5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#d3ecff';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(origin.x, origin.y, 9, 0, Math.PI * 2);
    c.stroke();
    if (view === 'orbit') {
      const tip = project({ x: 0, y: Math.min(state.height / groundRadius, 0.85), z: 0 });
      poly(c, [origin, tip], '#c8e6ff', 3);
    }
    text(
      c,
      kind === 'sun' ? '杆底 · 观察者' : '观察者',
      origin.x,
      origin.y + 21,
      '#9aafc2',
      11,
    );
  }
  if (s.alt < 0) {
    c.globalAlpha = 0.3;
  }
  if (kind === 'moon') drawMoon(c, sun.x, sun.y, 11, visualPhase());
  else glow(c, sun.x, sun.y, view === 'top' ? 6 : 8);
  c.globalAlpha = 1;
  if (sun.x > 20 && sun.x < w - 20 && sun.y > 45 && sun.y < h - 40)
    text(
      c,
      `${s.alt.toFixed(1)}°`,
      sun.x + 19,
      view === 'top' ? sun.y + 18 : sun.y - 13,
      '#ffe2a5',
      12,
      'left',
    );
  if (kind === 'sun' && isMoonOverlayActive()) {
    const m = visualPosition('Moon', moonOverlayPosition(state.time, true)),
      p = project(m);
    if (state.angles) poly(c, [origin, p], '#b4cff555', 1, [4, 4]);
    c.globalAlpha = m.alt < 0 ? 0.3 : 1;
    drawMoon(c, p.x, p.y, 10, visualPhase());
    c.globalAlpha = 1;
    if (p.x > 20 && p.x < w - 45 && p.y > 45 && p.y < h - 40)
      text(c, '月 ' + m.alt.toFixed(1) + '°', p.x + 16, p.y + 15, '#c8ddff', 12, 'left');
  }
  if (kind === 'sun' && view !== 'horizon') {
    const p = project({ x: 0.5, y: 0, z: 0 });
    text(c, (shadowGroundRadius() / 2).toFixed(2) + ' m', p.x, p.y + 16, '#92aebd', 10);
  }
  if (view === 'top' && kind === 'moon')
    text(
      c,
      (kind === 'moon' ? '月球' : '太阳') + '在地平面上的投影',
      w * 0.5,
      65,
      '#91a5b9',
      12,
    );
  paintLabReferences(c, w, h, project, kind, view);
}
function drawSunAltitudeChart() {
  if (!canPaint($('chart'))) return;
  const { c, w, h } = resize($('chart')),
    left = 35,
    right = w - 12,
    top = h < 100 ? 10 : 14,
    bottom = h - (h < 100 ? 22 : 27);
  const xx = (t) => left + (t / 1440) * (right - left),
    yy = (a) => top + ((90 - a) / 180) * (bottom - top);
  for (let a = -90; a <= 90; a += h < 100 ? 90 : 45) {
    const y = yy(a);
    poly(
      c,
      [
        { x: left, y },
        { x: right, y },
      ],
      a === 0 ? '#708399' : '#34475b66',
      1,
      a === 0 ? [4, 4] : [],
    );
    text(c, a + '°', left - 7, y, '#8fa2b6', 10, 'right');
  }
  for (let t = 0; t <= 1440; t += w < 260 ? 720 : 360) {
    const x = xx(t);
    text(
      c,
      t === 1440 ? '24:00' : hhmm(t),
      x,
      h - 8,
      '#8fa2b6',
      10,
      t === 1440 ? 'right' : 'center',
    );
  }
  function line(d, col, lw, actual = false, positionFn = null) {
    const ps = [];
    for (let t = 0; t <= 1440; t += 6)
      ps.push({
        x: xx(t),
        y: yy(
          (positionFn
            ? visualTrackPosition(t, positionFn(t), 'Moon')
            : actual
              ? bodyPosition(t)
              : solar(state.lat, d, t)
          ).alt,
        ),
      });
    poly(c, ps, col, lw);
    return ps;
  }
  if (state.compare) {
    line(23.44, '#ff906b88', 1);
    line(0, '#79d4bf88', 1);
    line(-23.44, '#80b9f388', 1);
  }
  const ps = line(state.dec, '#ffc35a', 2, true);
  c.beginPath();
  c.moveTo(xx(0), yy(-90));
  ps.forEach((p) => c.lineTo(p.x, p.y));
  c.lineTo(xx(1440), yy(-90));
  c.closePath();
  const g = c.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, '#ffc35a22');
  g.addColorStop(1, '#ffc35a00');
  c.fillStyle = g;
  c.fill();
  const s = bodyPosition(),
    x = xx(state.time),
    y = yy(s.alt);
  poly(
    c,
    [
      { x, y: top },
      { x, y: bottom },
    ],
    '#e4edf588',
    1,
    [3, 4],
  );
  c.fillStyle = '#ffc35a';
  c.beginPath();
  c.arc(x, y, 4, 0, Math.PI * 2);
  c.fill();
  if (isMoonOverlayActive()) {
    line(0, '#b4cff5', 1.7, true, moonOverlayPosition);
    const m = moonOverlayPosition(state.time, true);
    c.fillStyle = '#b4cff5';
    c.beginPath();
    c.arc(x, yy(m.alt), 4, 0, Math.PI * 2);
    c.fill();
  }
  window.SkyDiagramTools?.paint('chart', {
    type: 'altitude',
    canvas: $('chart'),
    c,
    w,
    h,
    body: state.body,
    date: state.date,
    time: state.time,
    lat: state.lat,
    lon: state.lon,
    low: -90,
    high: 90,
    unit: '°',
    clip: [left, top, right - left, bottom - top],
    project: (time, alt) => ({ x: xx(time), y: yy(alt) }),
    value: (time, date) => {
      const values = SkyDiagramSampling.memo(
        JSON.stringify(['altitude', date, state.lat, state.lon, state.manual, state.dec]),
        () =>
          Array.from(
            { length: 145 },
            (_, i) =>
              (state.manual
                ? solar(state.lat, state.dec, i * 10)
                : skyRaw('Sun', i * 10, date, state.lat, state.lon)
              ).alt,
          ),
      );
      const minute = Math.max(0, Math.min(1440, time)),
        index = minute / 10;
      if (Number.isInteger(index)) return values[index];
      return SkyDiagramSampling.memo(
        JSON.stringify([
          'altitude-point',
          date,
          state.lat,
          state.lon,
          state.manual,
          state.dec,
          minute,
        ]),
        () =>
          (state.manual
            ? solar(state.lat, state.dec, minute)
            : skyRaw('Sun', minute, date, state.lat, state.lon)
          ).alt,
      );
    },
    pick: (x) => ({
      time: Math.max(0, Math.min(1440, ((x - left) / (right - left)) * 1440)),
    }),
  });
}
// Render the orthographic Earth at display resolution on the GPU.
// The CPU path is reserved for browsers where WebGL is unavailable or lost.
let earthGPU = null,
  earthGPUFailed = false;
function createEarthGPU() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;
  function shader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const vertex = shader(
    gl.VERTEX_SHADER,
    'attribute vec2 position;varying vec2 screen;void main(){screen=position;gl_Position=vec4(position,0.0,1.0);}',
  );
  const fragment = shader(
    gl.FRAGMENT_SHADER,
    `precision highp float;
 varying vec2 screen;
 uniform vec4 rotation;
 uniform vec3 sun;
 uniform sampler2D earthTexture;
 uniform float textured;
 uniform float size;
 void main(){
  float rho=dot(screen,screen);
  if(rho>=1.0){gl_FragColor=vec4(0.0);return;}
  float z=sqrt(max(0.0,1.0-rho));
  float Y=screen.y*rotation.x+z*rotation.y;
  float A=z*rotation.x-screen.y*rotation.y;
  float X=A*rotation.z-screen.x*rotation.w;
  float Z=A*rotation.w+screen.x*rotation.z;
  vec3 direction=vec3(X,Y,Z);
  vec2 uv=vec2(atan(Z,X)/6.283185307179586+0.5,0.5-asin(clamp(Y,-1.0,1.0))/3.141592653589793);
  vec3 color=mix(vec3(50.0,111.0,156.0)/255.0,texture2D(earthTexture,uv).rgb,textured);
  float lit=dot(direction,sun);
  float shade=lit>0.0?0.52+0.48*sqrt(lit):0.16;
  float alpha=clamp((1.0-sqrt(rho))*size*0.5,0.0,1.0);
  gl_FragColor=vec4(color*shade*alpha,alpha);
 }`,
  );
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([50, 111, 156, 255]),
  );
  const uniforms = {};
  for (const name of ['rotation', 'sun', 'earthTexture', 'textured', 'size'])
    uniforms[name] = gl.getUniformLocation(program, name);
  gl.uniform1i(uniforms.earthTexture, 0);
  const gpu = {
    canvas,
    gl,
    uniforms,
    texture,
    loaded: false,
    key: null,
    lost: false,
    maxSize: Math.min(2048, gl.getParameter(gl.MAX_TEXTURE_SIZE)),
  };
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    gpu.lost = true;
    schedule();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    earthGPU = null;
    earthGPUFailed = false;
    schedule();
  });
  return gpu;
}
function drawEarthGPU(c, cx, cy, r, p, l, sun) {
  if (earthGPUFailed) return false;
  try {
    if (!earthGPU) earthGPU = createEarthGPU();
    const gpu = earthGPU;
    if (!gpu) {
      earthGPUFailed = true;
      return false;
    }
    if (gpu.lost) return false;
    const { gl, canvas, uniforms } = gpu;
    if (!gpu.loaded && earth.complete && earth.naturalWidth) {
      gl.bindTexture(gl.TEXTURE_2D, gpu.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, earth);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gpu.loaded = true;
      gpu.key = null;
    }
    const size = Math.max(
      64,
      Math.min(gpu.maxSize, Math.ceil(2 * r * Math.min(devicePixelRatio || 1, 2))),
    );
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = canvas.height = size;
      gpu.key = null;
    }
    const key = [size, p, l, ...sun, gpu.loaded].join(':');
    if (key !== gpu.key) {
      gl.viewport(0, 0, size, size);
      gl.uniform4f(uniforms.rotation, Math.cos(p), Math.sin(p), Math.cos(l), Math.sin(l));
      gl.uniform3f(uniforms.sun, ...sun);
      gl.uniform1f(uniforms.textured, gpu.loaded ? 1 : 0);
      gl.uniform1f(uniforms.size, size);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gpu.key = key;
    }
    c.drawImage(canvas, cx - r, cy - r, 2 * r, 2 * r);
    return true;
  } catch (error) {
    earthGPUFailed = true;
    return false;
  }
}

let earthPixels = null,
  earthW = 0,
  earthH = 0;
const earth = new Image();
earth.onload = () => {
  const b = document.createElement('canvas');
  b.width = earth.width;
  b.height = earth.height;
  const c = b.getContext('2d');
  c.drawImage(earth, 0, 0);
  earthPixels = c.getImageData(0, 0, b.width, b.height).data;
  earthW = b.width;
  earthH = b.height;
  render();
};
earth.src = 'earth.jpg';
function globeCenter() {
  return state.globeDragMode !== 'location' && state.globeCameraReady
    ? { lat: state.globeCameraLat, lon: state.globeCameraLon }
    : { lat: state.lat, lon: state.lon };
}
function globeGeometry(w, h) {
  const center = globeCenter();
  return {
    cx: w / 2,
    cy: h / 2,
    r: Math.min(w, h) * 0.43,
    p: center.lat * rad,
    l: center.lon * rad,
    lon: center.lon,
  };
}
function renderGlobeOptions() {
  const linked = state.globeDragMode === 'location',
    settings = $('globeDragSettings');
  if (!settings) return;
  settings.hidden = state.earthView === 'map';
  document.querySelectorAll('[data-globe-drag-mode]').forEach((button) => {
    const active = button.dataset.globeDragMode === (linked ? 'location' : 'view');
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const english = document.documentElement.lang === 'en';
  $('globeDragExplanation').textContent = english
    ? linked
      ? 'Drag the globe to move the observation location. All solar diagrams update together.'
      : 'Drag the observer dot to update every solar diagram. Drag elsewhere to rotate the view only.'
    : linked
      ? '拖动地球会改变观测地点，各张太阳图解同时更新。'
      : '拖动观察点可联动各张太阳图解；拖动球面其他位置只旋转视角。';
  if (state.manual && state.observerTimeBasis === 'utc')
    state.observerTimeBasis = 'solar';
  $('observerTimeBasis').value = state.observerTimeBasis || 'solar';
  $('observerTimeBasis').querySelector('[value=utc]').disabled = state.manual;
  $('observerConstraint').value = state.observerConstraint || 'free';
  const utc = instantUTC().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  $('observerLinkReadout').textContent =
    (state.observerTimeBasis === 'utc'
      ? english
        ? 'Same instant · '
        : '同一瞬间 · '
      : english
        ? 'Same local apparent solar time · '
        : '同一当地真太阳时 · ') +
    utc +
    (state.manual
      ? english
        ? ' · Ideal model: local solar time only.'
        : ' · 理想实验仅固定当地真太阳时。'
      : '');
  const center = globeCenter(),
    p = state.lat * rad,
    cp = center.lat * rad,
    z =
      Math.sin(p) * Math.sin(cp) +
      Math.cos(p) * Math.cos(cp) * Math.cos((state.lon - center.lon) * rad);
  $('globeObserverVisibility').textContent =
    z < 0 ? '观察地点在球面背面，可点击“对准观察地点”。' : '';
  const label = linked
    ? '地球昼夜图；拖动改变观察地点，单击选择地点'
    : '地球昼夜图；拖动仅旋转视角，单击选择地点';
  $('globe').removeAttribute('title');
  $('globe').setAttribute('aria-label', label);
}
function initGlobeOptions() {
  const settings = document.createElement('div');
  settings.id = 'globeDragSettings';
  settings.className = 'globe-drag-settings';
  settings.innerHTML =
    '<span class="field-label">拖动地球</span><div class="globe-drag-options" role="group" aria-label="地球拖动方式"><button type="button" data-globe-drag-mode="view">仅旋转视角</button><button type="button" data-globe-drag-mode="location">联动观察地点</button></div><p id="globeDragExplanation"></p><button type="button" id="globeRecenter">对准观察地点</button><p id="globeObserverVisibility" aria-live="polite"></p>';
  document.querySelector('.globe-notes').prepend(settings);
  const link = document.createElement('div');
  link.className = 'observer-link-settings';
  link.dataset.i18nSkip = '';
  const english = document.documentElement.lang === 'en';
  link.innerHTML =
    '<label><span data-link-label="basis"></span><select id="observerTimeBasis"><option value="solar"></option><option value="utc"></option></select></label><label><span data-link-label="constraint"></span><select id="observerConstraint"><option value="free"></option><option value="latitude"></option><option value="longitude"></option></select></label><p id="observerLinkReadout" aria-live="off"></p>';
  settings.before(link);
  function labels() {
    const en = document.documentElement.lang === 'en';
    link.querySelector('[data-link-label=basis]').textContent = en
      ? 'When moving the location'
      : '移动地点时';
    link.querySelector('[data-link-label=constraint]').textContent = en
      ? 'Movement constraint'
      : '移动范围';
    for (const [id, values] of [
      [
        'observerTimeBasis',
        en
          ? ['Keep local apparent solar time', 'Keep the same instant (UTC)']
          : ['固定当地真太阳时', '固定同一瞬间（UTC）'],
      ],
      [
        'observerConstraint',
        en
          ? [
              'Free movement',
              'Along a parallel (fixed latitude)',
              'Along a meridian (fixed longitude)',
            ]
          : ['自由移动', '沿纬线（纬度不变）', '沿经线（经度不变）'],
      ],
    ])
      [...$(id).options].forEach((o, i) => (o.textContent = values[i]));
  }
  labels();
  document.addEventListener('skymotion:language', () => {
    labels();
    renderGlobeOptions();
  });
  for (const id of ['observerTimeBasis', 'observerConstraint'])
    $(id).onchange = () => {
      stop();
      state[id] = $(id).value;
      schedule();
    };
  settings.querySelectorAll('[data-globe-drag-mode]').forEach(
    (button) =>
      (button.onclick = () => {
        const center = globeCenter();
        state.globeDragMode = button.dataset.globeDragMode;
        state.globeCameraLat = center.lat;
        state.globeCameraLon = center.lon;
        state.globeCameraReady = state.globeDragMode === 'view';
        schedule();
      }),
  );
  $('globeRecenter').onclick = () => {
    state.globeCameraLat = state.lat;
    state.globeCameraLon = state.lon;
    state.globeCameraReady = true;
    schedule();
  };
}

const earthFallbackSize = 320;
const earthRasterCanvas = document.createElement('canvas');
earthRasterCanvas.width = earthRasterCanvas.height = earthFallbackSize;
const earthRasterContext = earthRasterCanvas.getContext('2d'),
  earthRasterImage = earthRasterContext.createImageData(
    earthFallbackSize,
    earthFallbackSize,
  );
let earthSurfaceCache = null;
// Allocate the CPU fallback buffers only if GPU rendering is unavailable.
let earthRays = null,
  earthIndices = null,
  earthVectors = null,
  earthColors = null;
function initEarthFallback() {
  if (earthRays) return;
  // Fixed screen rays and reusable numeric buffers avoid per-drag pixel objects.
  earthRays = [];
  for (let y = 0; y < earthFallbackSize; y++)
    for (let x = 0; x < earthFallbackSize; x++) {
      const ex = (x + 0.5 - earthFallbackSize / 2) / (earthFallbackSize / 2),
        ey = -(y + 0.5 - earthFallbackSize / 2) / (earthFallbackSize / 2),
        rho = ex * ex + ey * ey;
      if (rho <= 1)
        earthRays.push((y * earthFallbackSize + x) * 4, ex, ey, Math.sqrt(1 - rho));
    }
  earthIndices = new Uint32Array(earthRays.length / 4);
  earthVectors = new Float64Array((earthRays.length / 4) * 3);
  earthColors = new Uint8Array((earthRays.length / 4) * 3);
}
function earthSurface(p, l) {
  initEarthFallback();
  const key = [p, l, earthW, earthH].join(':');
  if (earthSurfaceCache?.key === key) return earthSurfaceCache;
  const cp = Math.cos(p),
    sp = Math.sin(p),
    cl = Math.cos(l),
    sl = Math.sin(l);
  for (let n = 0; n < earthIndices.length; n++) {
    const j = n * 4,
      k = n * 3,
      ex = earthRays[j + 1],
      ey = earthRays[j + 2],
      z = earthRays[j + 3],
      Y = ey * cp + z * sp,
      A = z * cp - ey * sp,
      X = A * cl - ex * sl,
      Z = A * sl + ex * cl;
    earthIndices[n] = earthRays[j];
    earthVectors[k] = X;
    earthVectors[k + 1] = Y;
    earthVectors[k + 2] = Z;
    if (earthPixels) {
      const tx = clamp(
          Math.floor((Math.atan2(Z, X) / Math.PI / 2 + 0.5) * earthW),
          0,
          earthW - 1,
        ),
        ty = clamp(
          Math.floor((0.5 - Math.asin(clamp(Y, -1, 1)) / Math.PI) * earthH),
          0,
          earthH - 1,
        ),
        i = (ty * earthW + tx) * 4;
      earthColors[k] = earthPixels[i];
      earthColors[k + 1] = earthPixels[i + 1];
      earthColors[k + 2] = earthPixels[i + 2];
    } else {
      earthColors[k] = 50;
      earthColors[k + 1] = 111;
      earthColors[k + 2] = 156;
    }
  }
  earthSurfaceCache = {
    key,
    indices: earthIndices,
    vectors: earthVectors,
    colors: earthColors,
  };
  return earthSurfaceCache;
}

function drawGlobe() {
  if (!canPaint($('globe'))) return;
  const { c, w, h } = resize($('globe')),
    g = globeGeometry(w, h),
    { cx, cy, r, p, l } = g;
  const context = sunContext(),
    sunLon = context.lon,
    d = context.dec * rad,
    sl = sunLon * rad;
  const sv = [Math.cos(d) * Math.cos(sl), Math.sin(d), Math.cos(d) * Math.sin(sl)];
  function proj(lat, lon) {
    const a = lat * rad,
      b = (lon - g.lon) * rad,
      xx = Math.cos(a) * Math.sin(b),
      yy = Math.sin(a) * Math.cos(p) - Math.cos(a) * Math.cos(b) * Math.sin(p),
      z = Math.sin(a) * Math.sin(p) + Math.cos(a) * Math.cos(b) * Math.cos(p);
    return { x: cx + xx * r, y: cy - yy * r, z };
  }
  // Rasterize an orthographic sphere; shade each point by its angle to the Sun.
  if (!drawEarthGPU(c, cx, cy, r, p, l, sv)) {
    const surface = earthSurface(p, l),
      data = earthRasterImage.data;
    for (let n = 0; n < surface.indices.length; n++) {
      const j = n * 3,
        i = surface.indices[n],
        lit =
          surface.vectors[j] * sv[0] +
          surface.vectors[j + 1] * sv[1] +
          surface.vectors[j + 2] * sv[2],
        k = lit > 0 ? 0.52 + 0.48 * Math.sqrt(lit) : 0.16;
      data[i] = surface.colors[j] * k;
      data[i + 1] = surface.colors[j + 1] * k;
      data[i + 2] = surface.colors[j + 2] * k;
      data[i + 3] = 255;
    }
    earthRasterContext.putImageData(earthRasterImage, 0, 0);
    c.drawImage(earthRasterCanvas, cx - r, cy - r, r * 2, r * 2);
  }
  c.save();
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.clip();
  for (let lat = -60; lat <= 60; lat += 30) {
    let ps = [];
    for (let lon = -180; lon <= 180; lon += 3) {
      const q = proj(lat, lon);
      if (q.z < 0) {
        poly(c, ps, '#afc9e32b');
        ps = [];
      } else ps.push(q);
    }
    poly(c, ps, '#afc9e32b');
  }
  for (let lon = -180; lon < 180; lon += 30) {
    let ps = [];
    for (let lat = -90; lat <= 90; lat += 3) {
      const q = proj(lat, lon);
      if (q.z < 0) {
        poly(c, ps, '#afc9e32b');
        ps = [];
      } else ps.push(q);
    }
    poly(c, ps, '#afc9e32b');
  }
  c.restore();
  c.strokeStyle = '#79abd866';
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.stroke();
  const sp = proj(context.dec, sunLon);
  if (sp.z > 0) glow(c, sp.x, sp.y, 4);
  const observer = proj(state.lat, state.lon);
  if (observer.z >= 0) {
    c.fillStyle = '#79d3ff';
    c.beginPath();
    c.arc(observer.x, observer.y, 4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#fff';
    c.stroke();
  }
  const northPole = proj(90, 0);
  if (northPole.z > 0.05) text(c, '北极', northPole.x, northPole.y - 9, '#afc5db', 10);
  window.SkyDiagramTools?.paint('earth', {
    type: 'globe',
    observeLocation: useReferenceObserver,
    canvas: $('globe'),
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
      const a = lat * rad,
        b = lon * rad,
        v = [
          Math.cos(a) * Math.cos(b) + sv[0] * 0.5,
          Math.sin(a) + sv[1] * 0.5,
          Math.cos(a) * Math.sin(b) + sv[2] * 0.5,
        ],
        l = g.lon * rad;
      return {
        x: cx + r * (-v[0] * Math.sin(l) + v[2] * Math.cos(l)),
        y:
          cy -
          r *
            (-v[0] * Math.sin(p) * Math.cos(l) +
              v[1] * Math.cos(p) -
              v[2] * Math.sin(p) * Math.sin(l)),
      };
    },
    project: (lat, lon) => {
      const q = proj(lat, lon);
      return { ...q, hidden: q.z < 0 };
    },
    pick: (x, y) => {
      const X = (x - cx) / r,
        Y = -(y - cy) / r,
        D = 1 - X * X - Y * Y;
      if (D < 0) return null;
      const Z = Math.sqrt(D),
        lat =
          Math.asin(Math.max(-1, Math.min(1, Y * Math.cos(p) + Z * Math.sin(p)))) * deg,
        lon = g.lon + Math.atan2(X, Z * Math.cos(p) - Y * Math.sin(p)) * deg;
      return { lat, lon: ((lon + 540) % 360) - 180 };
    },
  });
}
// Scope seasonal shortcuts once: the date picker also owns [data-date] cells.
const solarSeasonButtons = document.querySelectorAll(
  '#seasonButtons > button[data-angle][data-month]',
);
// A remembered sky orientation is current only while its sky pane is current.
function syncSkyViewControls() {
  const workspace = typeof uiWorkspace === 'undefined' ? null : uiWorkspace;
  const presentation = window.skyWorkspacePresentation;
  const skyCurrent =
    !document.body.hasAttribute('data-entry-view') ||
    !workspace ||
    (presentation?.active
      ? presentation.activeView === 'skyPanel'
      : workspace.selected === 'skyPanel');
  document.querySelectorAll('[data-view]').forEach((button) => {
    const selected = presentation?.active && window.SkyPerspectives
      ? presentation.views.includes(window.SkyPerspectives.ids[button.dataset.view])
      : skyCurrent && button.dataset.view === state.view;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
function updateUI() {
  document.body.dataset.body = state.body;
  document.body.dataset.skyView = window.SkyPerspectives?.primaryView() || state.view;
  const moon = state.body === 'moon',
    body = moon ? '月球' : '太阳',
    s = bodyPosition(),
    day =
      (moon && !$('lunarSkyDetails').open) ||
      (document.body.dataset.page === 'diagrams' &&
        typeof uiWorkspace !== 'undefined' &&
        uiWorkspace?.selected === 'contextPanel')
        ? null
        : bodyDay(),
    pole = Math.abs(state.lat) > 89.99999999,
    zenith = Math.abs(s.alt) > 89.99;
  $('latText').textContent =
    Math.abs(state.lat) < 0.05 ? '°' : state.lat > 0 ? '°N' : '°S';
  $('lonText').textContent =
    Math.abs(state.lon) < 0.05 ? '°' : state.lon > 0 ? '°E' : '°W';
  for (const k of ['lat', 'lon']) {
    if (document.activeElement !== $(k + 'Input'))
      $(k + 'Input').value = state[k].toFixed(1);
    $(k).value = state[k];
  }
  $('decText').textContent = coord(state.dec, 'lat');
  $('timeText').textContent = hhmm(state.time, true);
  $('dec').value = state.dec;
  $('time').value = state.time;
  $('bodyTitle').textContent = body + '视运动';
  $('chartTitle').textContent = body + '高度曲线';
  $('contextTitle').textContent = moon ? '月相与日地月关系' : '太阳直射点与昼夜';
  $('contextEyebrow').textContent = moon ? '月相形成' : '从地球看';
  $('sunContextContent').hidden = moon;
  $('phaseContent').hidden = !moon;
  $('contextExplanation').textContent = moon
    ? '月球反射太阳光，通常约有一半表面受太阳照射；照明比例指地球所见月圆盘的亮面面积比例，不是整个月球的受光面积比例。此处采用地心视月相近似，附近表示接近相位而非精确发生时刻。月相不是地球影子造成的。图中距离、大小和轨道为示意；实际轨道有倾角，新月或满月不一定发生日食、月食；此图未模拟食的遮挡与亮度变化。'
    : '经度用于定位与换算 UTC；轨迹使用当地真太阳时。';
  $('altLabel').textContent = body + '高度角';
  $('azLabel').textContent = body + '方位角';
  $('durationLabel').textContent = moon ? '地平线上方时长' : '白昼时长';
  $('durationDefinition').textContent =
    '按天体几何中心穿越高度角 0° 的理想地平线计算，未计大气折射、天体视半径和地形遮挡。' +
    (moon
      ? '月球地平视差已计入；实际月出、月落时刻仍可能不同。'
      : '实际太阳上缘通常早于此处日出时刻出现、晚于此处日落时刻消失；差值随纬度、季节、气象和观察者高度变化，不是固定 5 分钟。') +
    '时长按当日对应的 UTC 时间间隔统计。';
  $('fourthLabel').textContent = moon ? '月相 · 照明比例' : '地面影长';
  $('solarSettings').hidden = moon;
  $('moonDateNote').hidden = !moon;
  $('compareControl').hidden = moon;
  $('shadowControl').hidden = moon;
  $('heightControl').hidden = moon;
  $('restoreDate').hidden = !state.manual;
  const topViewLabel = moon ? '俯视方位' : '俯视日影';
  document.querySelector('[data-view="top"]').textContent =
    window.skyTranslate?.(topViewLabel) || topViewLabel;
  $('sky').setAttribute('aria-label', body + '当天轨迹交互图');
  $('chart').setAttribute('aria-label', body + '全天高度角曲线');
  $('altMetric').textContent = s.alt.toFixed(1) + '°';
  $('altNote').textContent = body + (s.alt >= 0 ? '在地平线上方' : '在地平线下方');
  $('azMetric').textContent = zenith ? '—' : s.az.toFixed(1) + '° · ' + heading(s.az);
  if (pole) $('azMetric').textContent = '极点方位不唯一';
  const length = !day || day.length === null ? null : Math.round(day.length);
  if (day) {
    $('dayMetric').textContent =
      length === null
        ? '地平线临界'
        : moon
          ? `${Math.floor(length / 60)}h ${length % 60}m`
          : day.kind === '普通昼夜' || day.kind === '地平线相切'
            ? `${Math.floor(length / 60)}h ${length % 60}m`
            : day.kind;
    $('dayNote').textContent =
      day.length === null
        ? '极点分日的理想化临界状态'
        : `当日最高 ${day.maxAlt.toFixed(1)}° · ${hhmm(day.peak, day.boundaryPeak)}`;
  }
  if (moon) {
    const phase = lunarPhase();
    $('phaseName').textContent = phase.name;
    $('phaseFraction').textContent =
      '可见圆盘亮面 ' + (phase.fraction * 100).toFixed(1) + '%';
    $('shadowMetric').textContent = (phase.fraction * 100).toFixed(1) + '%';
    $('shadowNote').textContent =
      phase.name + ' · ' + (phase.angle < 180 ? '逐渐盈满' : '逐渐亏缺');
  } else {
    const shadow = s.alt > 0 ? state.height / Math.tan(s.alt * rad) : null;
    $('shadowMetric').textContent =
      s.alt < 0
        ? '无日影'
        : s.alt === 0
          ? '趋于无穷'
          : shadow > 999
            ? '＞999 m'
            : shadow.toFixed(2) + ' m';
    $('shadowNote').textContent =
      s.alt <= 0
        ? '太阳低于或贴近地平线'
        : zenith
          ? '太阳在天顶附近，方位与影子方向不宜判读'
          : `影子朝向 ${heading((s.az + 180) % 360)} · 立杆高 ${state.height} m`;
  }
  if (day) {
    $('riseLabel').textContent = moon ? '月出' : '日出';
    $('setLabel').textContent = moon ? '月落' : '日落';
    $('peakLabel').textContent =
      state.body === 'sun' && state.manual ? '正午' : '日内最高';
    $('peakInline').textContent = hhmm(day.peak, true);
    $('riseInline').textContent = day.rise === null ? '当日无' : hhmm(day.rise);
    $('setInline').textContent = day.set === null ? '当日无' : hhmm(day.set);
    $('goRise').disabled = day.rise === null;
    $('goSet').disabled = day.set === null;
    $('goRise').title =
      day.rise === null ? '当日没有穿越地平线的上升时刻' : '跳到当天升起时刻';
    $('goSet').title =
      day.set === null ? '当日没有穿越地平线的下降时刻' : '跳到当天落下时刻';
  }
  $('dayBadge').textContent =
    Math.abs(s.alt) < 1e-6
      ? moon
        ? '月球在地平线上'
        : '太阳在地平线上'
      : moon
        ? s.alt > 0
          ? '月球在地平线上方'
          : '月球在地平线下方'
        : s.alt > 0
          ? '白昼'
          : '黑夜';
  $('dayBadge').style.color = moon ? '#b4cff5' : s.alt >= 0 ? '#ffe1a5' : '#a1c3e3';
  $('compareKey').hidden = moon || !state.compare;
  $('viewHint').textContent =
    pole && state.view === 'top'
      ? '极点方位按经线参考'
      : state.view === 'orbit'
        ? '拖动旋转 · 滚轮缩放'
        : state.view === 'top'
          ? moon
            ? '北向上 · 查看月球方位'
            : '北向上 · 影子背向太阳'
          : '方位展开 · 观察天体高度';
  const name = selectedPlaceName();
  $('sceneSubtitle').textContent =
    `${name} · ${coord(state.lat, 'lat')} · ${!moon && state.manual ? '自定直射纬度' : state.date}`;
  $('dateMode').textContent = state.manual
    ? '理想化实验 · 太阳赤纬已手动调整'
    : '随日期计算 · 可拖动进行理想化实验';
  solarSeasonButtons.forEach((button) => {
    const selected =
      !state.manual &&
      seasonDate(Number(button.dataset.angle), Number(button.dataset.month)) ===
        state.date;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  const context = sunContext();
  $('subsolar').textContent =
    coord(context.dec, 'lat') + ' / ' + coord(context.lon, 'lon');
  $('observerPos').textContent =
    coord(state.lat, 'lat') + ' / ' + coord(state.lon, 'lon');
  $('utcLabel').textContent = context.utc
    ? 'UTC ' +
      context.utc.toISOString().slice(0, 10) +
      ' ' +
      context.utc.toISOString().slice(11, 16)
    : '理想模型 · 不对应观测时刻';
  $('modelNote').textContent = moon
    ? '月相图标是固定朝向的示意，不代表本地月面朝向。'
    : state.manual
      ? '理想实验：赤纬固定，上中天设为 12:00。'
      : '日期观测：使用天文星历，时间为当地真太阳时。';
  if (!moon)
    $('modelNote').textContent +=
      ' 分至日按钮和季节对比线沿用北半球名称，南半球季节相反。';
  if (pole) $('modelNote').textContent += ' 极点方位不唯一，图中轴线按所选经线作参考。';
  $('plotNote').textContent =
    '中心穿越几何地平线为升落标准（未计折射）；虚线在地平线下。天体大小非实际比例。' +
    (isMoonOverlayActive() || state.view === 'observer'
      ? ' 月球轨迹只覆盖当天 00:00—24:00；月球沿轨道运动，一天后位置不同，两端通常不闭合，不是漏画。'
      : '');
  $('shadowScale').textContent =
    state.body === 'sun' && state.shadow && state.view !== 'horizon'
      ? `地面圆半径 ${(6.25 * Math.max(1, state.height)).toFixed(2)} m · 箭头表示影线超出范围`
      : '';
  $('dateMode').textContent = state.manual
    ? '理想实验：日期不参与轨迹计算'
    : '日期观测：拖动赤纬即切换理想实验';
  document.querySelectorAll('[data-model]').forEach((b) => {
    const on = (b.dataset.model === 'ideal') === state.manual;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  let insight;
  if (moon) {
    const phase = lunarPhase();
    insight = `当前为<strong>${phase.name}</strong>，可见月面照明比例 <strong>${(phase.fraction * 100).toFixed(1)}%</strong>。${s.alt >= 0 ? '月球在地平线上方，白天也可能出现；是否容易看见还取决于天空亮度和月相。' : '月球在地平线下方，可以展开观测时刻，选择月出或日内最高点；逐日播放始终保持所选时刻。'}${day && day.kind !== '普通升落' ? ' 当日' + day.kind + '。' : ''}`;
  } else if (!day)
    insight =
      '球面展示当前太阳直射点与昼夜分布；日出、日落和白昼时长请切换到日出日落图解查看。';
  else if (day.kind === '极昼')
    insight =
      '这里出现<strong>极昼</strong>：太阳全天保持在地平线上方。改变季节，观察全天轨迹怎样下移。';
  else if (day.kind === '极夜')
    insight =
      '这里出现<strong>极夜</strong>：太阳全天位于地平线下方，因此没有直射阳光形成的日影。';
  else if (day.kind === '地平线相切')
    insight =
      '太阳轨迹与<strong>地平线相切</strong>，没有通常意义上穿越地平线的日出、日落。这个理想化临界情形不计大气折射。';
  else if (day.length === null)
    insight =
      '极点在分日处于<strong>临界状态</strong>：理想模型中太阳沿地平线运行，不能用普通日出日落时刻描述。';
  else {
    const side = state.dec > 0 ? '北' : state.dec < 0 ? '南' : '赤道';
    insight = `当前太阳直射<strong>${side === '赤道' ? '赤道' : side + '半球'}</strong>，当地昼长约 <strong>${Math.floor(length / 60)} 小时 ${length % 60} 分</strong>。${s.alt > 0 ? '太阳越高，影子越短；切到俯视日影观察方向。' : '太阳已经落到地平线下；拖动时间回到白昼观察日影。'}`;
  }
  $('insight').innerHTML = insight;
  document.querySelectorAll('.body-switch [data-body]').forEach((button) => {
    const active = button.dataset.body === state.body;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  syncSkyViewControls();
}
function drawSolarSky() {
  drawSkyScene('sun',$('sky'),window.SkyPerspectives?.primaryDisplay());
}
function drawLunarSky() {
  if ($('lunarSkyDetails').open) drawSkyScene('moon',$('sky'),window.SkyPerspectives?.primaryDisplay());
}
function renderSolarPipeline() {
  updateUI();
  updateSolarControls();
  renderSolarCoverage();
}
function renderLunarPipeline() {
  updateUI();
  updateLunarControls();
  renderLunarCoverage();
}
let framePending = false;
function prepareObservationState() {
  const workspace = typeof uiWorkspace === 'undefined' ? null : uiWorkspace;
  if (document.body.hasAttribute('data-entry-view') && workspace) {
    const presentation = window.skyWorkspacePresentation;
    const visible = presentation?.active
      ? presentation.visibleIds
      : new Set([workspace.selected]);
    state.analemma = state.body === 'sun' && visible.has('analemmaPanel');
    if (state.analemma && workspace.analemmaClockLinked) {
      state.analemmaBasis = 'apparent';
      state.analemmaClock = Math.min(1439, state.time);
    }
    if (state.body === 'moon' && workspace.selected === 'solarCompare')
      state.companion = true;
  }
  prepareSolarDateMode();
  if (state.body === 'sun' && !state.manual) state.dec = sunContext().dec;
}
function render() {
  prepareObservationState();
  syncMotionTarget();
  updateWorkspaceLayout();
  if (state.body === 'moon') renderLunarPipeline();
  else renderSolarPipeline();
  updateMenu();
  updateShadowUI();
  updateWorkspaceUI();
  renderCompanion();
  renderObserverControls();
  renderSolarDateUI();
  renderAnalemma();
  renderSundials();
  renderTimeWorkbench();
  if (typeof renderUIWorkspace === 'function') renderUIWorkspace();
  drawMotionCanvases();
  window.SkyMaterial?.updateRanges();
  window.SolarSpaceLabCompare?.sync();
}
function schedule() {
  framePending = true;
  requestMotionFrame();
}
const monthPhaseCache = new Map();
function monthPhaseSamples() {
  const month = state.date.slice(0, 7),
    key = [month, state.time, state.lon].join(':');
  if (monthPhaseCache.has(key)) return monthPhaseCache.get(key);
  const values = [];
  for (let d = 1; d <= monthDays(state.date); d++)
    values.push(
      Astronomy.Illumination(
        'Moon',
        instantUTC(state.time, month + '-' + String(d).padStart(2, '0'), state.lon),
      ).phase_fraction * 100,
    );
  if (monthPhaseCache.size > 12) monthPhaseCache.clear();
  monthPhaseCache.set(key, values);
  return values;
}
function drawLunarMonthChart() {
  if (!canPaint($('chart'))) return;
  const { c, w, h } = resize($('chart')),
    left = 35,
    right = w - 12,
    top = 14,
    bottom = h - 27,
    values = monthPhaseSamples(),
    xx = (d) => left + ((d - 1) / (values.length - 1)) * (right - left),
    yy = (v) => bottom - (v / 100) * (bottom - top);
  for (const v of [0, 25, 50, 75, 100]) {
    poly(
      c,
      [
        { x: left, y: yy(v) },
        { x: right, y: yy(v) },
      ],
      '#34475b66',
    );
    text(c, v + '%', left - 7, yy(v), '#8fa2b6', 10, 'right');
  }
  for (const d of [1, 8, 15, 22, values.length])
    text(c, d + '日', xx(d), h - 8, '#8fa2b6', 10);
  poly(
    c,
    values.map((v, i) => ({ x: xx(i + 1), y: yy(v) })),
    '#b4cff5',
    2,
  );
  const day = visualChartDay(),
    index = Math.floor(day - 1),
    fraction = day - 1 - index,
    value =
      values[index] + ((values[index + 1] ?? values[index]) - values[index]) * fraction,
    x = xx(day);
  poly(
    c,
    [
      { x, y: top },
      { x, y: bottom },
    ],
    '#e4edf588',
    1,
    [3, 4],
  );
  c.fillStyle = '#b4cff5';
  c.beginPath();
  c.arc(x, yy(value), 4, 0, Math.PI * 2);
  c.fill();
  window.SkyDiagramTools?.paint('chart', {
    type: 'illumination',
    canvas: $('chart'),
    c,
    w,
    h,
    body: state.body,
    date: state.date,
    time: state.time,
    lat: state.lat,
    lon: state.lon,
    days: values.length,
    clip: [left, top, right - left, bottom - top],
    project: (day, value) => ({ x: xx(day), y: yy(value) }),
    value: (date) =>
      Astronomy.Illumination('Moon', instantUTC(state.time, date, state.lon))
        .phase_fraction * 100,
  });
}
function shiftDay(delta) {
  const d = new Date(state.date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  const v = d.toISOString().slice(0, 10);
  if (v < '1900-01-01' || v > '2100-12-31') return false;
  state.date = v;
  $('date').value = v;
  return true;
}
function advanceLunarPlayback() {
  if (state.monthLoop && Number(state.date.slice(8)) === monthDays(state.date))
    state.date = state.date.slice(0, 7) + '-01';
  else if (!shiftDay(1)) stop();
  $('date').value = state.date;
}

function paintLabReferences(c, w, h, project, kind, view=state.view) {
  if (
    document.body.dataset.page !== 'lab' &&
    !document.body.hasAttribute('data-entry-view')
  )
    return;
  const position = (time, date = state.date) =>
    kind === 'sun' && state.manual
      ? solar(state.lat, state.dec, time)
      : skyRaw(kind === 'moon' ? 'Moon' : 'Sun', time, date, state.lat, state.lon);
  const pick = (x, y) => {
    const samples = SkyDiagramSampling.memo(
      JSON.stringify([
        'lab-pick',
        kind,
        state.date,
        state.lat,
        state.lon,
        state.manual,
        state.manual ? state.dec : 0,
      ]),
      () =>
        Array.from({ length: 289 }, (_, i) => ({
          time: i * 5,
          position: position(i * 5),
        })),
    );
    let best = null;
    for (const sample of samples) {
      const p = project(sample.position);
      if (p.hidden) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (!best || d < best.d) best = { time: sample.time, d };
    }
    return best ? { time: best.time } : null;
  };
  window.SkyDiagramTools?.paint(c.canvas.id==='sky'?'lab-sky':'lab-sky-'+c.canvas.id, {
    type: 'sky',
    canvas: c.canvas,
    c,
    w,
    h,
    body: kind,
    date: state.date,
    time: state.time,
    lat: state.lat,
    lon: state.lon,
    view,
    projectSky: project,
    position,
    pick,
    observeLocation: useReferenceObserver,
  });
}
