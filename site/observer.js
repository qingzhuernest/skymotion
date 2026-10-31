/**
 * 地面观察者视角的天空投影与天体朝向。
 */
/* Ground observer: front half of the local unit sky, orthographic projection. */
const observerNames = { Sun: "太阳", Moon: "月球", ...companionPlanets },
  observerColors = {
    Sun: "#ffd37a",
    Moon: "#d6e6ff",
    Mercury: "#b8c5d0",
    Venus: "#fff0b8",
    Mars: "#ffaf91",
    Jupiter: "#efd2b1",
    Saturn: "#e5d9a9",
  };
const observerMinuteCache = new Map();
let observerTimeHome = null;
function observerPosition(body, time = state.time) {
  if (body === "Sun" && state.body === "sun" && state.manual)
    return solar(state.lat, state.dec, time);
  const minute = Math.floor(time),
    key = [body, state.date, state.lat, state.lon, minute].join(":");
  let pair = observerMinuteCache.get(key);
  if (!pair) {
    pair = [
      skyRaw(body, minute, state.date, state.lat, state.lon),
      skyRaw(
        body,
        Math.min(minute + 1, 1440),
        state.date,
        state.lat,
        state.lon,
      ),
    ];
    if (observerMinuteCache.size >= 84)
      observerMinuteCache.delete(observerMinuteCache.keys().next().value);
    observerMinuteCache.set(key, pair);
  }
  return mixDirection(pair[0], pair[1], time - minute);
}
function observerFrame(w, h, bearing = state.observerAz ?? 180) {
  const a = bearing * rad,
    base = h * 0.79,
    Rx = w * 0.46,
    Ry = h * 0.62;
  return {
    base,
    Rx,
    Ry,
    front: (p) => p.x * Math.sin(a) + p.z * Math.cos(a),
    project: (p) => ({
      x: w / 2 + (p.x * Math.cos(a) - p.z * Math.sin(a)) * Rx,
      y: base - p.y * Ry,
    }),
  };
}
/* The bright limb points toward the Sun in the Moon's tangent plane.
   Project that direction through this view, including its unequal X/Y scales.
   Hemisphere and time enter through the local sky vectors, never a latitude flip. */
function moonBrightLimbAngle(moon, sun, frame) {
  const dot = moon.x * sun.x + moon.y * sun.y + moon.z * sun.z;
  const tangent = {
    x: sun.x - dot * moon.x,
    y: sun.y - dot * moon.y,
    z: sun.z - dot * moon.z,
  };
  const origin = frame.project({ x: 0, y: 0, z: 0 }),
    tip = frame.project(tangent),
    dx = tip.x - origin.x,
    dy = tip.y - origin.y;
  return Math.hypot(dx, dy) > 1e-8 ? Math.atan2(dy, dx) : null;
}
function observerBodies() {
  const bodies =
    state.body === "sun" && state.manual ? ["Sun"] : Object.keys(observerNames);
  return bodies.map((body) => ({
    body,
    name: observerNames[body],
    exact: observerPosition(body),
    position: visualPosition(body, observerPosition(body)),
  }));
}
function observerDayPosition(body, time) {
  if (state.body === "sun" && state.manual && body === "Sun")
    return solar(state.lat, state.dec, time);
  const day = ephemerisDay(body),
    t = clamp(time, 0, 1440) / 5,
    i = Math.min(Math.floor(t), day.samples.length - 2);
  return mixDirection(day.samples[i], day.samples[i + 1], t - i);
}
function drawObserverCurve(c, positionAt, frame, color) {
  let run = [],
    previous = null;
  const flush = () => {
    if (run.length > 1) poly(c, run, color, 1.4);
    run = [];
  };
  for (let time = 0; time <= 1440; time += 3) {
    const p = positionAt(time),
      visible = p.y >= 0 && frame.front(p) >= 0;
    if (previous) {
      const a = previous.p,
        cuts = [0, 1];
      for (const f of [
        a.y / (a.y - p.y),
        frame.front(a) / (frame.front(a) - frame.front(p)),
      ])
        if (f > 0 && f < 1) cuts.push(f);
      cuts.sort((a, b) => a - b);
      for (let i = 1; i < cuts.length; i++) {
        const f = cuts[i - 1],
          g = cuts[i],
          middle = mixDirection(a, p, (f + g) / 2);
        if (middle.y >= 0 && frame.front(middle) >= 0) {
          const start = frame.project(mixDirection(a, p, f)),
            end = frame.project(mixDirection(a, p, g));
          if (!run.length) run.push(start);
          run.push(end);
        } else flush();
      }
    }
    previous = { p, visible };
  }
  flush();
}
function drawObserverTrack(c, body, frame, color) {
  drawObserverCurve(
    c,
    (t) => visualTrackPosition(t, observerDayPosition(body, t), body),
    frame,
    color,
  );
}
/* Forward lies on the far (upper) half of the ground, beneath the visible sky. */
function drawObserverGround(c, w, h, frame, bearing = state.observerAz ?? 180) {
  const depth = h - frame.base,
    center = { x: w / 2, y: frame.base + depth * 0.53 },
    radius = frame.Rx * 0.7,
    rise = depth * 0.25;
  const project = (az) => {
    const a = az * rad,
      direction = { x: Math.sin(a), y: 0, z: Math.cos(a) };
    return {
      x: center.x + (frame.project(direction).x - center.x) * 0.7,
      y: center.y - frame.front(direction) * rise,
    };
  };
  for (const scale of [0.5, 1]) {
    c.beginPath();
    c.ellipse(center.x, center.y, radius * scale, rise * scale, 0, 0, Math.PI * 2);
    c.strokeStyle = "#b5dfcf44";
    c.lineWidth = 1;
    c.stroke();
  }
  for (let az = 0; az < 360; az += 90) {
    const end = project(az);
    poly(c, [center, end], "#b5dfcf44", 1);
    if (depth >= 76 && w >= 500) {
      text(c, (Math.abs(state.lat) > 89.99 ? "参考" : "") + heading(az),
        end.x, end.y - 7, az === 0 ? "#86d7f5" : "#d5e9dc", 11);
    }
  }
  // The viewer stays still; the ground and sky share the same world orientation.
  const tip = { x: center.x, y: center.y - rise * 0.65 };
  poly(c, [center, tip], "#e7c783", 1.5);
  poly(c, [{ x: tip.x - 4, y: tip.y + 5 }, tip, { x: tip.x + 4, y: tip.y + 5 }], "#e7c783", 1.5);
  c.beginPath();
  c.arc(center.x, center.y, 3, 0, Math.PI * 2);
  c.fillStyle = "#91d8f4";
  c.fill();
  text(c, "地面方位参考 · 面向 " + heading(bearing), w / 2, h - 5, "#c6ddd0", 10);
}
function drawObserverSky(canvas=$('sky'),display=null) {
  const bearing=display?.observerAz ?? state.observerAz ?? 180;
  if (!canPaint(canvas)) return;
  const { c, w, h } = resize(canvas),
    frame = observerFrame(w, h,bearing),
    bodies = observerBodies(),
    sun = bodies.find((p) => p.body === "Sun").position,
    day = sun.alt >= 0,
    twilight = sun.alt >= -18;
  c.skyNaturalBackdrop=true;
  const sky = c.createLinearGradient(0, 0, 0, frame.base);
  sky.addColorStop(0, day ? "#427ca9" : twilight ? "#142844" : "#071425");
  sky.addColorStop(1, day ? "#c2ddeb" : twilight ? "#a07464" : "#263c53");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, frame.base);
  const ground = c.createLinearGradient(0, frame.base, 0, h);
  ground.addColorStop(0, day ? "#52745c" : "#263d34");
  ground.addColorStop(1, day ? "#203e35" : "#142920");
  c.fillStyle = ground;
  c.fillRect(0, frame.base, w, h - frame.base);
  poly(
    c,
    [
      { x: 0, y: frame.base },
      { x: w, y: frame.base },
    ],
    day ? "#cfdfc8" : "#90aba0",
    1.5,
  );
  drawObserverGround(c, w, h, frame,bearing);
  if (state.angles) {
    for (const alt of [30, 60]) {
      const curve = [];
      for (let d = -90; d <= 90; d += 3) {
        const az = (bearing + d) * rad;
        curve.push(
          frame.project({
            x: Math.cos(alt * rad) * Math.sin(az),
            y: Math.sin(alt * rad),
            z: Math.cos(alt * rad) * Math.cos(az),
          }),
        );
      }
      poly(c, curve, "#d5e9ff22", 1, [3, 5]);
      text(
        c,
        alt + "°",
        w - 25,
        frame.base - Math.sin(alt * rad) * frame.Ry,
        day ? "#082331" : "#d0e5f2",
        10,
      );
    }
  }
  for (const offset of [-60, 0, 60]) {
    const az = (bearing + offset + 360) % 360,
      p = frame.project({ x: Math.sin(az * rad), y: 0, z: Math.cos(az * rad) });
    text(
      c,
      (Math.abs(state.lat) > 89.99 ? "参考" : heading(az)) +
        " " +
        Math.round(az) +
        "°",
      clamp(p.x, 35, w - 35),
      frame.base + 15,
      "#d6e3d4",
      11,
    );
  }
  text(
    c,
    "天顶 90°",
    w / 2,
    Math.max(55, frame.base - frame.Ry - 12),
    day ? "#082331" : "#dcebf5",
    11,
  );
  if (state.body === "sun" && state.solarDateMode && state.solarDateTrail)
    drawObserverCurve(
      c,
      (t) => annualSolarPosition(t / 1440),
      frame,
      "#e8afff",
    );
  const occupied = [];
  if (state.track) {
    drawObserverTrack(c, "Sun", frame, "#ffd37a77");
    if (!state.manual || state.body === "moon") {
      drawObserverTrack(c, "Moon", frame, "#c5ddff77");
      const project = (p) =>
        p.y >= 0 && frame.front(p) >= 0
          ? frame.project(p)
          : { x: -1e5, y: -1e5 };
      occupied.push(
        ...drawMoonDayEndpoints(c, project, w, h, (t) =>
          visualTrackPosition(t, observerDayPosition("Moon", t), "Moon"),
        ),
      );
    }
  }
  for (const item of bodies) {
    const p = item.position;
    if (p.y <= 0 || frame.front(p) < -1e-10) continue;
    const q = frame.project(p);
    if (item.body === "Sun") glow(c, q.x, q.y, 9);
    else if (item.body === "Moon")
      drawMoon(
        c,
        q.x,
        q.y,
        10,
        visualPhase(),
        moonBrightLimbAngle(p, sun, frame),
      );
    else {
      c.fillStyle = observerColors[item.body];
      c.beginPath();
      c.arc(q.x, q.y, item.body === "Venus" ? 3.7 : 2.7, 0, Math.PI * 2);
      c.fill();
    }
    // Labels move in screen space only; the body's computed position stays fixed.
    const labelX = clamp(q.x, 25, w - 25),
      baseY = clamp(q.y + 19, 62, frame.base - 12);
    const candidates = [baseY];
    for (let step = 1; step <= 8; step++)
      candidates.push(baseY + step * 16, baseY - step * 16);
    const ly =
      candidates.find(
        (y) =>
          y >= 62 &&
          y <= frame.base - 12 &&
          !occupied.some(
            (box) =>
              Math.abs(box.x - labelX) < (box.width || 48) / 2 + 16 &&
              Math.abs(box.y - y) < 16,
          ),
      ) ?? baseY;
    occupied.push({ x: labelX, y: ly, width: 32 });
    if (Math.abs(ly - (q.y + 19)) > 8)
      poly(
        c,
        [q, { x: labelX, y: ly - 7 }],
        observerColors[item.body] + "66",
        0.7,
      );
    text(
      c,
      item.name,
      labelX,
      ly,
      day ? "#082331" : observerColors[item.body],
      12,
    );
  }

  canvas.setAttribute(
    "aria-label",
    "地面观察者仰望天空，面向 " +
      bearing.toFixed(0) +
      " 度；只绘制地平线上方及前方的天体",
  );
  paintLabReferences(c,w,h,p=>({...frame.project(p),hidden:p.y<0||frame.front(p)<0}),state.body,'observer');
}
function arrangeObserverTime() {
  const active = state.view === "observer" && !window.skyWorkspacePresentation?.active,
    daily = active && state.body === "sun" && !state.solarDateMode,
    host = $("observerTimeHost"),
    timeline = $("sunTimeline");
  if (daily) {
    if (timeline.parentNode !== host) host.append(timeline);
  } else if (observerTimeHome && timeline.previousSibling !== observerTimeHome)
    observerTimeHome.after(timeline);
  $("observerClockPanel").hidden = daily;
  $("observerTime").value = state.time;
  $("observerTimeValue").textContent = hhmm(state.time, true);
  $("observerTimeLabel").textContent =
    state.body === "moon" || state.solarDateMode
      ? "固定当地真太阳时"
      : "当地真太阳时";
}
function renderObserverControls() {
  arrangeObserverTime();
  const active = state.view === "observer" && !window.skyWorkspacePresentation?.active;
  $("observerControls").hidden = !active;
  $("solarOverlayBar").hidden = state.body === "moon" || active;
  $("sky").style.touchAction = ["observer", "orbit", "horizon"].includes(window.SkyPerspectives?.primaryView() || state.view)
    ? "none"
    : "pan-y";
  if (!active) return;
  const bearing = state.observerAz ?? 180;
  $("observerAzimuth").value = bearing;
  $("observerBearing").textContent =
    Math.round(bearing) + "° · " + heading(bearing);
  const frame = observerFrame(400, 400),
    items = observerBodies(),
    box = $("observerBodies");
  if (!box.children.length)
    for (const [body, name] of Object.entries(observerNames)) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.skyBody = body;
      b.onclick = () => {
        const p = observerPosition(body);
        state.observerAz = p.az;
        schedule();
      };
      box.append(b);
    }
  for (const button of box.children) {
    const item = items.find((p) => p.body === button.dataset.skyBody);
    button.hidden = !item;
    if (!item) continue;
    const p = item.exact;
    button.textContent =
      item.name +
      " " +
      p.alt.toFixed(1) +
      "° · " +
      (p.y <= 0 ? "地平线下" : frame.front(p) < 0 ? "身后" : "前方");
    button.title = "转向" + item.name + " · 方位 " + p.az.toFixed(1) + "°";
  }
  $("modelNote").textContent =
    "仰望天空的月面亮边随当地天空几何方向转动；圆盘大小为示意，照明比例采用地心近似。月相原理图仍采用固定朝向。";
  const below = items.filter((p) => p.exact.y <= 0).map((p) => p.name);
  $("observerStatus").textContent =
    state.body === "sun" && state.manual
      ? "理想太阳实验仅显示太阳；恢复日期观测后可同时查看月球和行星。"
      : state.date +
        " · " +
        hhmm(state.time, true) +
        " 当地真太阳时" +
        (below.length
          ? "；地平线下：" + below.join("、")
          : "；所列天体均在地平线上方");
  $("viewHint").textContent = "拖动左右转身 · 下方选择天体";
  const sunAltitude = items.find((p) => p.body === "Sun").exact.alt;
  $("dayBadge").textContent =
    sunAltitude >= 0
      ? "白昼 · 标注几何位置"
      : sunAltitude >= -18
        ? "暮光 · 地面观察"
        : "夜空 · 地面观察";
  $("sky").style.touchAction = "none";
}
function initObserver() {
  const bearingPanel = document.querySelector(".observer-bearing-panel"),
    bearingLabel = bearingPanel.querySelector("label"),
    bearingInput = $("observerAzimuth");
  bearingLabel.htmlFor = "observerAzimuth";
  bearingPanel.prepend(bearingLabel);
  bearingLabel.after(bearingInput);
  observerTimeHome = document.createComment("home: observer Sun timeline");
  $("sunTimeline").before(observerTimeHome);
  $("observerTime").oninput = (e) => {
    stop();
    state.time = Number(e.target.value);
    schedule();
  };
  document.querySelectorAll("[data-look]").forEach(
    (b) =>
      (b.onclick = () => {
        state.observerAz = Number(b.dataset.look);
        schedule();
      }),
  );
  $("observerAzimuth").oninput = (e) => {
    state.observerAz = Number(e.target.value);
    schedule();
  };
}
