/**
 * 统一动画调度与视觉插值；科学输入和精确读数仍由各计算模块提供。
 */
/* One frame scheduler; visual interpolation never changes scientific input state. */
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
let motionRAF = 0,
  motionLast = 0,
  motionUI = 0,
  motionTarget = null,
  motionTransition = null,
  motionCameraValue = null,
  motionFrameTime = 0;
const visibleCanvases = new WeakMap(),
  companionViewMotion = { value: null, target: null };
function elementVisible(node) {
  return (
    !!node &&
    (node.checkVisibility
      ? node.checkVisibility({ contentVisibilityAuto: true })
      : node.getClientRects().length > 0)
  );
}
function canPaint(canvas) {
  if (!elementVisible(canvas)) return false;
  const known = visibleCanvases.get(canvas);
  if (known !== undefined) return known;
  const r = canvas.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
}
function requestMotionFrame() {
  if (!motionRAF && !document.hidden) motionRAF = requestAnimationFrame(motionFrame);
}
function snapshotMotion() {
  return {
    body: state.body,
    date: state.date,
    time: state.time,
    lat: state.lat,
    lon: state.lon,
    planet: state.planet,
    manual: state.manual,
    view: state.view,
    solarDateMode: state.solarDateMode,
  };
}
function syncMotionTarget() {
  const next = snapshotMotion(),
    old = motionTarget;
  motionTarget = next;
  if (!old || old.body !== next.body) {
    motionTransition = null;
    motionCameraValue = { yaw: state.yaw, pitch: state.pitch, zoom: state.zoom };
    companionViewMotion.value = null;
    return;
  }
  const changed = ['date', 'time', 'lat', 'lon', 'planet', 'manual'].some(
    (k) => old[k] !== next[k],
  );
  if (changed) {
    const adjacent =
      old.time === next.time &&
      old.lat === next.lat &&
      old.lon === next.lon &&
      old.planet === next.planet &&
      Math.abs(new Date(next.date) - new Date(old.date)) === 86400000;
    if (
      (next.body === 'moon' || (next.body === 'sun' && next.solarDateMode && !next.manual)) &&
      adjacent &&
      !old.manual &&
      !reducedMotion.matches
    ) {
      const fromTime = instantUTC(old.time, old.date, old.lon),
        toTime = instantUTC(next.time, next.date, next.lon),
        body = next.body === 'moon' ? 'Moon' : 'Sun',
        phase = next.body === 'moon' || isMoonOverlayActive();
      motionTransition = {
        body: next.body,
        from: old,
        to: next,
        start: performance.now(),
        duration:
          next.body === 'moon' && state.playing && !state.moonDayPlayback
            ? 1000 / state.daysRate
            : Math.min(280, 800 / (next.body === 'moon' ? state.daysRate : state.solarDateRate)),
        linear: next.body === 'moon' && state.playing && !state.moonDayPlayback,
        positions: new Map(),
        previousDay: lunarCache.get(
          [body, old.date, old.lat.toFixed(4), old.lon.toFixed(4)].join(':'),
        ),
        overlayPreviousDay:
          next.body === 'sun'
            ? lunarCache.get(['Moon', old.date, old.lat.toFixed(4), old.lon.toFixed(4)].join(':'))
            : null,
      };
      if (phase) {
        motionTransition.phaseFrom = {
          angle: Astronomy.MoonPhase(fromTime),
          fraction: Astronomy.Illumination('Moon', fromTime).phase_fraction,
        };
        motionTransition.phaseTo = {
          angle: Astronomy.MoonPhase(toTime),
          fraction: Astronomy.Illumination('Moon', toTime).phase_fraction,
        };
      }
      requestMotionFrame();
    } else {
      motionTransition = null;
    }
  }
  // Parameter and view changes keep the observation canvas at full opacity.
}
function motionProgress() {
  if (!motionTransition) return 1;
  const t = clamp((motionFrameTime - motionTransition.start) / motionTransition.duration, 0, 1);
  return motionTransition.linear ? t : t * t * (3 - 2 * t);
}
function mixDirection(a, b, f) {
  const x = a.x + (b.x - a.x) * f,
    y = a.y + (b.y - a.y) * f,
    z = a.z + (b.z - a.z) * f,
    n = Math.hypot(x, y, z) || 1;
  return {
    x: x / n,
    y: y / n,
    z: z / n,
    alt: Math.asin(clamp(y / n, -1, 1)) * deg,
    az: (Math.atan2(x, z) * deg + 360) % 360,
  };
}
function visualPosition(body, exact) {
  if (!motionTransition || motionTransition.body !== state.body) return exact;
  const tr = motionTransition;
  let pair = tr.positions.get(body);
  if (!pair) {
    pair = [
      skyRaw(body, tr.from.time, tr.from.date, tr.from.lat, tr.from.lon),
      skyRaw(body, tr.to.time, tr.to.date, tr.to.lat, tr.to.lon),
    ];
    tr.positions.set(body, pair);
  }
  return mixDirection(pair[0], pair[1], motionProgress());
}
function visualPhase() {
  const phase = lunarPhase();
  if (!motionTransition?.phaseFrom || motionTransition.body !== state.body) return phase;
  const tr = motionTransition,
    f = motionProgress(),
    da = ((tr.phaseTo.angle - tr.phaseFrom.angle + 540) % 360) - 180;
  return {
    ...phase,
    angle: (tr.phaseFrom.angle + da * f + 360) % 360,
    fraction: tr.phaseFrom.fraction + (tr.phaseTo.fraction - tr.phaseFrom.fraction) * f,
  };
}
function visualTrackPosition(time, target, body = state.body === 'moon' ? 'Moon' : 'Sun') {
  const primary = body === (state.body === 'moon' ? 'Moon' : 'Sun'),
    samples = (primary ? motionTransition?.previousDay : motionTransition?.overlayPreviousDay)
      ?.samples;
  if (!samples || motionTransition.body !== state.body) return target;
  const t = clamp(time, 0, 1440) / 5,
    i = Math.min(Math.floor(t), samples.length - 2),
    from = mixDirection(samples[i], samples[i + 1], t - i);
  return mixDirection(from, target, motionProgress());
}
function visualChartDay() {
  if (!motionTransition || motionTransition.from.date.slice(0, 7) !== state.date.slice(0, 7))
    return Number(state.date.slice(8));
  const from = Number(motionTransition.from.date.slice(8)),
    to = Number(state.date.slice(8));
  return from + (to - from) * motionProgress();
}
function motionCamera() {
  return motionCameraValue || state;
}
function easeCompanionView(target) {
  if (!companionViewMotion.value || reducedMotion.matches) {
    companionViewMotion.value = { ...target };
  }
  companionViewMotion.target = target;
  if (Object.keys(target).some((k) => Math.abs(target[k] - companionViewMotion.value[k]) > 0.02))
    requestMotionFrame();
  return companionViewMotion.value;
}
function settleMotion() {
  motionTransition = null;
  motionLast = 0;
  companionViewMotion.value = null;
}
function revealMotion(nodes, duration = 240) {
  if (reducedMotion.matches) return;
  for (const node of nodes) {
    if (!node || !elementVisible(node)) continue;
    node.getAnimations().forEach((a) => a.cancel());
    node.animate([{ transform: 'translateY(5px)' }, { transform: 'translateY(0)' }], {
      duration,
      easing: 'cubic-bezier(.2,.8,.2,1)',
    });
  }
}
function drawMotionCanvases() {
  if (canPaint($('eventCompass'))) drawEventCompass(eventModel());
  if (state.body === 'sun') {
    drawSolarSky();
    drawSunAltitudeChart();
    if (state.earthView === 'map') drawWorldMap();
    else drawGlobe();
    drawEarthGeometry();
    drawAnalemma();
    drawSundials();
  } else {
    drawLunarSky();
    drawLunarMonthChart();
    drawPhasePanel();
    if (state.companion && canPaint($('companionSky'))) drawCompanionSky(companionSnapshot());
  }
}
function motionFrame(now) {
  motionRAF = 0;
  motionFrameTime = now;
  const dt = motionLast ? Math.min((now - motionLast) / 1000, 0.15) : 0;
  motionLast = now;
  if (advanceAnalemma(dt)) framePending = true;
  if (state.playing) {
    if (state.body === 'sun' && state.solarDateMode) {
      solarDateAccumulator += dt * state.solarDateRate;
      const days = Math.floor(solarDateAccumulator);
      solarDateAccumulator -= days;
      for (let i = 0; i < days; i++) {
        if (!advanceSolarDatePlayback()) {
          framePending = true;
          break;
        }
        framePending = true;
      }
    } else if (state.body === 'sun' || state.moonDayPlayback) {
      const next = state.time + dt * state.speed;
      if (next >= 1440 && !state.loop) {
        state.time = 1440;
        stop();
        framePending = true;
      } else state.time = next % 1440;
    } else {
      lunarAccumulator += dt * state.daysRate;
      if (lunarAccumulator >= 1) {
        const steps = Math.floor(lunarAccumulator);
        lunarAccumulator -= steps;
        for (let i = 0; i < steps; i++) advanceLunarPlayback();
        framePending = true;
      }
    }
  }
  let cameraMoving = false;
  const target = { yaw: state.yaw, pitch: state.pitch, zoom: state.zoom };
  if (!motionCameraValue) motionCameraValue = { ...target };
  for (const key of Object.keys(target)) {
    const gap = target[key] - motionCameraValue[key];
    if (reducedMotion.matches || Math.abs(gap) < 0.0002) motionCameraValue[key] = target[key];
    else {
      motionCameraValue[key] += gap * (1 - Math.exp(-Math.max(dt, 0.016) * 24));
      cameraMoving = true;
    }
  }
  let viewMoving = false;
  const v = companionViewMotion.value,
    t = companionViewMotion.target;
  if (v && t)
    for (const key of ['halfSpan', 'low', 'high', 'center']) {
      const gap = key === 'center' ? ((t[key] - v[key] + 540) % 360) - 180 : t[key] - v[key];
      if (reducedMotion.matches || Math.abs(gap) < 0.02) v[key] = t[key];
      else {
        v[key] += gap * (1 - Math.exp(-Math.max(dt, 0.016) * 18));
        viewMoving = true;
      }
    }
  if (motionTransition && now - motionTransition.start >= motionTransition.duration)
    motionTransition = null;
  if (framePending || (state.playing && now - motionUI >= 100)) {
    framePending = false;
    render();
    motionUI = now;
  } else if (state.playing || analemmaPlaying || motionTransition || cameraMoving || viewMoving)
    drawMotionCanvases();
  if (
    state.playing ||
    analemmaPlaying ||
    motionTransition ||
    cameraMoving ||
    viewMoving ||
    framePending
  )
    requestMotionFrame();
  else motionLast = 0;
}
function initMotion() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) visibleCanvases.set(e.target, e.isIntersecting);
      schedule();
    },
    { rootMargin: '80px' },
  );
  document.querySelectorAll('canvas').forEach((c) => observer.observe(c));
  reducedMotion.addEventListener('change', () => {
    settleMotion();
    schedule();
  });
  document.addEventListener('visibilitychange', () => {
    motionLast = 0;
    if (document.hidden) {
      if (motionRAF) cancelAnimationFrame(motionRAF);
      motionRAF = 0;
    } else schedule();
  });
  document.querySelectorAll('details').forEach((d) =>
    d.addEventListener('toggle', () => {
      if (d.open && !d.closest('#controls')) revealMotion([...d.children].slice(1), 200);
      schedule();
    }),
  );
}

function focusAfterReveal(node) {
  requestAnimationFrame(() => requestAnimationFrame(() => node.focus({ preventScroll: true })));
}
