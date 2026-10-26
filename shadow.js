/**
 * 水平地面上的立杆阴影、杆尖轨迹与显示尺度。
 */
/* Horizontal ground, vertical gnomon: tip shadow = -height * horizontal Sun / vertical Sun. */
const shadowTraceCache = new Map();
let shadowPlot = null;
function shadowGroundRadius() {
  return 6.25 / (state.shadowZoom || 4);
}
function shadowTip(position, height = state.height) {
  if (position.y <= 1e-10) return null;
  const x = (-height * position.x) / position.y,
    z = (-height * position.z) / position.y;
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  return { x, y: 0, z, length: Math.hypot(x, z) };
}
// Clip each real segment, rather than clamping endpoints onto the circular rim.
function clipShadowSegment(a, b, radius) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    dd = dx * dx + dz * dz;
  if (dd < 1e-20) return Math.hypot(a.x, a.z) <= radius ? { a, b, start: 0, end: 1 } : null;
  const middle = -(a.x * dx + a.z * dz) / dd,
    nearX = a.x + middle * dx,
    nearZ = a.z + middle * dz,
    inside = radius * radius - nearX * nearX - nearZ * nearZ;
  if (inside < 0) return null;
  const span = Math.sqrt(inside / dd),
    start = Math.max(0, middle - span),
    end = Math.min(1, middle + span);
  if (end - start < 1e-12) return null;
  const at = (f) => ({ x: a.x + f * dx, y: 0, z: a.z + f * dz, t: a.t + (b.t - a.t) * f });
  return { a: at(start), b: at(end), start, end };
}
function shadowTipSegments() {
  const radius = shadowGroundRadius(),
    key = [
      state.manual ? 'ideal' : 'date',
      state.manual ? state.dec : state.date,
      state.lat,
      state.manual ? '' : state.lon,
      state.height,
      radius,
    ].join(':');
  if (shadowTraceCache.has(key)) return shadowTraceCache.get(key);
  const groups = [],
    samples = [];
  let previous = null;
  for (let t = 0; t <= 1440; t += 2) {
    const p = shadowTip(bodyPosition(t));
    if (p) {
      p.t = t;
      samples.push(p);
    }
    if (p && previous) {
      const cut = clipShadowSegment(previous, p, radius);
      if (cut) {
        const last = groups.at(-1),
          end = last?.points.at(-1);
        if (
          last &&
          Math.hypot(end.x - cut.a.x, end.z - cut.a.z) < 1e-7 &&
          Math.abs(end.t - cut.a.t) < 1e-7
        ) {
          last.points.push(cut.b);
          last.end = cut.b.t;
        } else groups.push({ points: [cut.a, cut.b], start: cut.a.t, end: cut.b.t });
      }
    }
    previous = p;
  }
  const result = { groups, samples, radius };
  if (shadowTraceCache.size >= 12) shadowTraceCache.delete(shadowTraceCache.keys().next().value);
  shadowTraceCache.set(key, result);
  return result;
}
function drawShadowTrace(c, project, radius) {
  shadowPlot = null;
  if (!state.shadowTrace) return;
  const data = shadowTipSegments(),
    map = (p) => project({ x: p.x / radius, y: 0, z: p.z / radius });
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (const group of data.groups) {
    const points = group.points.map(map);
    poly(c, points, '#89defb22', 7);
    poly(c, points, '#8bdbef', 2.2);
  }
  const clickable = [];
  for (const p of data.samples) {
    if (p.length > radius) continue;
    const q = map(p);
    clickable.push({ x: q.x, y: q.y, t: p.t });
    if (p.t % 60 === 0) {
      c.fillStyle = '#d6f5ff';
      c.beginPath();
      c.arc(q.x, q.y, 2.5, 0, Math.PI * 2);
      c.fill();
      if (p.t % 180 === 0) text(c, hhmm(p.t), q.x + 7, q.y - 9, '#b9e4ee', 11, 'left');
    }
  }
  c.restore();
  if (!data.groups.length) {
    const box = $('sky').getBoundingClientRect();
    text(
      c,
      data.samples.length ? '影迹在圆外，可减小放大倍数' : '当天无有限直射日影',
      box.width / 2,
      box.height * 0.76,
      '#b9e4ee',
      box.width < 420 ? 11 : 13,
    );
  }
  shadowPlot = { points: clickable };
}
function drawCurrentShadow(c, project, position, radius) {
  const tip = shadowTip(position);
  if (!tip) return;
  const origin = project({ x: 0, y: 0, z: 0 }),
    outside = tip.length > radius,
    factor = outside ? radius / tip.length : 1,
    end = project({ x: (tip.x * factor) / radius, y: 0, z: (tip.z * factor) / radius });
  c.save();
  c.lineCap = 'round';
  poly(c, [origin, end], '#b5ddff55', 10);
  poly(c, [origin, end], '#07101c', 6);
  poly(c, [origin, end], '#d2e9fa', 1.4);
  if (outside) {
    const dx = end.x - origin.x,
      dy = end.y - origin.y,
      n = Math.hypot(dx, dy) || 1;
    poly(
      c,
      [
        { x: end.x - (dx / n) * 10 - (dy / n) * 5, y: end.y - (dy / n) * 10 + (dx / n) * 5 },
        end,
        { x: end.x - (dx / n) * 10 + (dy / n) * 5, y: end.y - (dy / n) * 10 - (dx / n) * 5 },
      ],
      '#ffe1a0',
      2,
    );
  } else {
    c.fillStyle = '#ffd58b';
    c.strokeStyle = '#102337';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(end.x, end.y, 5.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    if (state.view === 'top' && tip.length / radius > 0.12)
      text(c, tip.length.toFixed(2) + ' m', end.x + 10, end.y + 13, '#ffe1a0', 12, 'left');
  }
  c.restore();
}
function updateShadowUI() {
  const sun = state.body === 'sun';
  $('shadowZoom').value = String(state.shadowZoom || 4);
  $('shadowTrace').checked = !!state.shadowTrace;
  $('shadowTraceKey').hidden = !sun || !state.shadowTrace || state.view === 'horizon';
  $('shadowTraceNote').hidden = !sun || !state.shadowTrace;
  $('shadowTraceNote').textContent =
    '杆尖影迹记录这一天有直射阳光时，竖直杆尖在水平地面上的影子位置；不是杆尖本身移动。圆点按整点标记，俯视时可点击轨迹切换时间。超出地面圆的部分裁切，减小放大倍数可看更多。';
  if (
    sun &&
    state.view !== 'horizon' &&
    (state.shadow || state.shadowTrace || (state.solarDateMode && state.solarDateTrail))
  )
    $('shadowScale').textContent =
      `日影地面放大 ${state.shadowZoom || 4}× · 地面圆半径 ${shadowGroundRadius().toFixed(2)} m（仅由倍率决定）· 影长数值保持真实，空间图立杆为示意；箭头表示当前影尖超出画面。`;
  if (sun && state.view === 'top') {
    $('viewHint').textContent =
      Math.abs(state.lat) > 89.99999999 ? '极点方位按经线参考' : '北向上 · 影尖影迹';
    $('plotNote').textContent =
      '天体轨迹是单位方向球的投影，不是地面的米制位置；地面圆单独使用下方标明的米制比例。太阳低于或沿地平线时无有限直射日影，天顶处影长为零。';
    $('sky').setAttribute(
      'aria-label',
      '俯视日影与杆尖影迹，北向上；可点击影迹切换时间，方向键调整时间',
    );
  }
}
function initShadow() {
  $('shadowZoom').onchange = (e) => {
    stop();
    const value = Number(e.target.value);
    state.shadowZoom = [1, 2, 4, 8, 16].includes(value) ? value : 4;
    schedule();
  };
  $('shadowTrace').onchange = (e) => {
    stop();
    state.shadowTrace = e.target.checked;
    if (state.shadowTrace) state.view = 'top';
    schedule();
  };
  $('shadowView').onclick = () => {
    stop();
    state.view = 'top';
    closeMenu();
    schedule();
    $('stage').scrollIntoView({
      behavior: !window.SkyPreferences?.smoothScroll ? 'instant' : 'smooth',
      block: 'center',
    });
    focusAfterReveal($('sky'));
  };
  $('sky').addEventListener('click', (e) => {
    if (state.body !== 'sun' || state.view !== 'top' || !state.shadowTrace || !shadowPlot) return;
    const r = e.currentTarget.getBoundingClientRect(),
      x = e.clientX - r.left,
      y = e.clientY - r.top;
    let best = 20,
      chosen = null;
    for (const p of shadowPlot.points) {
      const distance = Math.hypot(x - p.x, y - p.y);
      if (distance < best) {
        best = distance;
        chosen = p;
      }
    }
    if (chosen) {
      stop();
      state.time = chosen.t;
      schedule();
    }
  });
  $('sky').addEventListener('keydown', (e) => {
    if (
      state.body !== 'sun' ||
      state.view !== 'top' ||
      !['ArrowLeft', 'ArrowRight'].includes(e.key)
    )
      return;
    e.preventDefault();
    stop();
    state.time = clamp(
      state.time + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 10 : 1),
      0,
      1440,
    );
    schedule();
  });
}
