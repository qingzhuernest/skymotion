/**
 * 日晷三维装置的显示与交互；计算结果由日晷模块提供。
 */
function openSundialDialog() {
  if (state.body !== 'sun') return;
  stop();
  const panel = $('sundialPanel');
  panel.hidden = false;
  if (!panel.open) panel.showModal();
  document.body.classList.add('sundial-open');
  schedule();
}
/* Interactive oblique projection of the same polar-axis needle geometry. */
let sundialView = 'device';
function sundialDeviceFrame(kind, model, w, h) {
  const center = { x: w * 0.5, y: h * 0.54 },
    R = Math.min(w * 0.37, h * 0.31),
    scale = R / sundialRadius,
    pitch = 0.65,
    yaw = -0.34;
  const local = (p) =>
    kind === 'horizontal'
      ? { u: p.x, v: p.z, n: p.y }
      : {
          u: model.equatorial.face * p.x,
          v: p.y * model.meridian.y + p.z * model.meridian.z,
          n: model.equatorial.face * (p.y * model.northPole.y + p.z * model.northPole.z),
        };
  const project = (p) => ({
    x: center.x + scale * (p.u * Math.cos(yaw) + p.v * Math.sin(yaw)),
    y:
      center.y -
      scale *
        ((-p.u * Math.sin(yaw) + p.v * Math.cos(yaw)) * Math.sin(pitch) + p.n * Math.cos(pitch)),
  });
  return { center, R, scale, local, project };
}
function drawSundialDevice(kind, model) {
  const canvas = $(kind === 'horizontal' ? 'horizontalDial' : 'equatorialDial');
  if (!canPaint(canvas)) return;
  const { c, w, h } = resize(canvas),
    frame = sundialDeviceFrame(kind, model, w, h),
    { project, local, center } = frame,
    device = model[kind],
    circle = (n = 0, r = sundialRadius) =>
      Array.from({ length: 121 }, (_, i) =>
        project({ u: Math.sin(i * 3 * rad) * r, v: Math.cos(i * 3 * rad) * r, n }),
      );
  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, model.daylight ? '#f9f0d9' : '#e7eaf0');
  bg.addColorStop(1, model.daylight ? '#eadcbd' : '#cfd7df');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  const fill = (points, color) => {
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    c.fillStyle = color;
    c.fill();
  };
  const base = circle(-0.012);
  fill(base, '#a68a5a');
  const face = circle();
  fill(face, model.daylight ? '#e8cf91' : '#c5c3b9');
  poly(c, face, '#a88b50', 2);
  for (const radius of [0.22, 0.7, 0.93])
    poly(c, circle(0, sundialRadius * radius), '#ac8e5555', 1);
  const ticks = [];
  if (kind !== 'horizontal' || !device.degenerate)
    for (let hour = 0; hour < 24; hour++) {
      const ray = sundialHourRay(kind, hour, model),
        end = project({ u: ray.x * sundialRadius * 0.96, v: ray.v * sundialRadius * 0.96, n: 0 }),
        start = project({ u: ray.x * sundialRadius * 0.15, v: ray.v * sundialRadius * 0.15, n: 0 }),
        lit = bodyPosition(hour * 60).y > 1e-10;
      poly(c, [start, end], lit ? '#826437aa' : '#9e988666', hour % 3 === 0 ? 1.5 : 0.7);
      if (
        hour % 3 === 0 &&
        (Math.abs(model.latitude) > 10 || kind === 'equatorial' || hour % 6 === 0)
      ) {
        const p = project({
          u: ray.x * sundialRadius * 0.81,
          v: ray.v * sundialRadius * 0.81,
          n: 0,
        });
        text(c, String(hour).padStart(2, '0'), p.x, p.y, lit ? '#584322' : '#938b78', 11);
      }
      ticks.push({ ...end, time: hour * 60 });
    }
  sundialPlots.set(kind, { ticks, frame, model });
  let shadowAnnotation = null;
  const shadow = sundialPlanePoint(kind, model);
  if (shadow) {
    const len = Math.hypot(shadow.x, shadow.v),
      outside = len > sundialRadius,
      f = outside ? sundialRadius / len : 1,
      end = project({ u: shadow.x * f, v: shadow.v * f, n: 0.001 });
    c.save();
    c.lineCap = 'round';
    poly(c, [center, end], '#30231528', 13);
    poly(c, [center, end], '#30231555', 8);
    poly(c, [center, end], '#352a1ddd', 4.8);
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
        '#463423',
        2.4,
      );
    } else {
      c.beginPath();
      c.arc(end.x, end.y, 4, 0, Math.PI * 2);
      c.fillStyle = '#352a1d';
      c.fill();
    }
    shadowAnnotation = { end, label: outside ? '影子延伸至盘外' : '影尖' };
    c.restore();
  }
  const needle = project(local(device.needle));
  c.save();
  c.lineCap = 'round';
  poly(c, [center, needle], '#163c39', 6);
  poly(c, [center, needle], '#72b8a8', 2);
  c.restore();
  c.fillStyle = '#e1fff0';
  c.beginPath();
  c.arc(needle.x, needle.y, 3.2, 0, Math.PI * 2);
  c.fill();
  if (model.daylight && device.available) {
    const sunLocal = local(model.position),
      start = project({
        u: local(device.needle).u + sunLocal.u * 0.15,
        v: local(device.needle).v + sunLocal.v * 0.15,
        n: local(device.needle).n + sunLocal.n * 0.15,
      });
    poly(c, [start, needle], '#bf852eaa', 1.5, [4, 3]);
    text(c, '阳光', clamp(start.x, 26, w - 26), clamp(start.y - 12, 52, h - 46), '#8f641d', 11);
  }
  if (shadowAnnotation) {
    const { end, label } = shadowAnnotation,
      tx = clamp(end.x - 45, 55, w - 70),
      ty = clamp(end.y + 29, 65, h - 55);
    poly(c, [end, { x: tx, y: ty - 8 }], '#5e4934aa', 1);
    c.fillStyle = '#fff6dfee';
    c.fillRect(tx - 38, ty - 9, 76, 18);
    text(c, label, tx, ty, '#4f3920', 11);
    c.beginPath();
    c.arc(end.x, end.y, 3.5, 0, Math.PI * 2);
    c.fillStyle = '#2e251a';
    c.fill();
    c.strokeStyle = '#fff4cd';
    c.lineWidth = 1.5;
    c.stroke();
  }
  text(
    c,
    kind === 'horizontal'
      ? '水平盘面 · 晷针指向天极'
      : model.equatorial.face > 0
        ? '赤道盘面 · 朝北天极的受光面'
        : '赤道盘面 · 朝南天极的受光面',
    w / 2,
    22,
    '#6e5736',
    w < 340 ? 11 : 12,
  );
  text(
    c,
    !model.daylight
      ? '太阳在地平线上或下方 · 无直射日影'
      : !device.available
        ? kind === 'horizontal'
          ? '赤道处经典水平日晷退化'
          : '阳光平行盘面 · 无法读时'
        : '拖动盘面上的影子方向 · ' + hhmm(model.trueMinutes),
    w / 2,
    h - 22,
    '#6e5736',
    11,
  );
}
function sundialSetTime(time) {
  if (state.body !== 'sun') return;
  stop();
  state.time = clamp(time, 0, workbenchTimeMax());
  schedule();
}
function sundialDragTime(kind, x, y) {
  const plot = sundialPlots.get(kind);
  if (!plot?.frame) return null;
  const { frame, model } = plot;
  if (kind === 'horizontal' && model.horizontal.degenerate) return null;
  const o = frame.project({ u: 0, v: 0, n: 0 }),
    a = frame.project({ u: 1, v: 0, n: 0 }),
    b = frame.project({ u: 0, v: 1, n: 0 }),
    ax = a.x - o.x,
    ay = a.y - o.y,
    bx = b.x - o.x,
    by = b.y - o.y,
    det = ax * by - ay * bx,
    dx = x - o.x,
    dy = y - o.y,
    u = (dx * by - dy * bx) / det,
    v = (ax * dy - ay * dx) / det;
  if (Math.hypot(u, v) < 0.025) return null;
  const H =
    kind === 'horizontal'
      ? Math.atan2(u / Math.abs(Math.sin(model.phi)), v / model.hemisphere)
      : Math.atan2(u / model.equatorial.face, v);
  return Math.round((((720 + H * deg * 4) % 1440) + 1440) % 1440);
}
function initSundialDevice() {
  const panel = $('sundialPanel');
  $('sundialStickyTime').oninput = (e) => sundialSetTime(Number(e.target.value));
  $('openSundials').onclick = openSundialDialog;
  $('closeSundials').onclick = () => panel.close();
  panel.addEventListener('close', () => {
    document.body.classList.remove('sundial-open');
    stop();
    schedule();
  });
  panel.addEventListener('click', (e) => {
    if (e.target !== panel) return;
    const r = panel.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      panel.close();
  });
  document.querySelectorAll('[data-dial-view]').forEach(
    (b) =>
      (b.onclick = () => {
        sundialView = b.dataset.dialView;
        schedule();
      }),
  );
  $('sundialNeedleLength').oninput = (e) => {
    sundialLength = Number(e.target.value) / 100;
    schedule();
  };
  $('sundialTime').oninput = (e) => sundialSetTime(Number(e.target.value));
  $('sundialDate').onchange = (e) => {
    setDate(e.target.value);
    e.target.value = state.date;
    schedule();
  };
  $('sundialPlay').onclick = () => {
    if (state.playing && !state.solarDateMode) stop();
    else {
      enableSolarDateMode(false);
      if (state.time >= 1440) state.time = 0;
      state.playing = true;
    }
    schedule();
  };
  for (const [kind, id] of [
    ['horizontal', 'horizontalDial'],
    ['equatorial', 'equatorialDial'],
  ]) {
    const canvas = $(id);
    canvas.style.touchAction = 'none';
    let drag = null;
    canvas.addEventListener('pointerdown', (e) => {
      if (state.body !== 'sun' || sundialView !== 'device') return;
      const r = canvas.getBoundingClientRect(),
        x = e.clientX - r.left,
        y = e.clientY - r.top,
        plot = sundialPlots.get(kind);
      if (!plot?.frame) return;
      const o = plot.frame.project({ u: 0, v: 0, n: 0 });
      if (Math.hypot(x - o.x, y - o.y) > plot.frame.R + 25) return;
      drag = { x: e.clientX, y: e.clientY, moved: false };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4 && !drag.moved) return;
      drag.moved = true;
      const r = canvas.getBoundingClientRect(),
        time = sundialDragTime(kind, e.clientX - r.left, e.clientY - r.top);
      if (time !== null) sundialSetTime(time);
    });
    canvas.addEventListener('pointerup', () => {
      if (drag?.moved) {
        canvas.dataset.suppressClick = '1';
        setTimeout(() => delete canvas.dataset.suppressClick, 0);
      }
      drag = null;
    });
    canvas.addEventListener('pointercancel', () => (drag = null));
    canvas.addEventListener(
      'click',
      (e) => {
        if (canvas.dataset.suppressClick) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      },
      true,
    );
  }
}
function renderSundialDeviceControls() {
  if (state.body !== 'sun' || !$('sundialPanel').open) return;
  $('sundialNeedleValue').textContent = Math.round(sundialLength * 100) + ' cm';
  $('sundialNeedleLength').value = Math.round(sundialLength * 100);
  $('sundialTime').value = state.time;
  $('sundialTime').max = workbenchTimeMax();
  $('sundialStickyTime').value = state.time;
  $('sundialStickyTime').max = workbenchTimeMax();
  $('sundialStickyClock').textContent = hhmm(state.time, true);
  $('sundialTimeValue').textContent = hhmm(state.time, true);
  if (document.activeElement !== $('sundialDate')) $('sundialDate').value = state.date;
  $('sundialPlay').textContent =
    state.playing && !state.solarDateMode ? '⏸ 暂停日影' : '▶ 演示一天';
  document.querySelectorAll('[data-dial-view]').forEach((b) => {
    const active = b.dataset.dialView === sundialView;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  $('sundialInteractionHint').textContent =
    sundialView === 'device'
      ? '在盘面拖动影子方向，或点击时刻刻度；滑动时间、演示一天均联动两种日晷。夜间没有直射日影。'
      : '点击盘面刻度调时，或使用上方时间滑动条。安装侧视展示晷针和盘面的实际夹角。';
}
