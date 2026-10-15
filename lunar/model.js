/** Independent circular-orbit lesson; kilometres, seconds and radians. No ephemeris state. */
(function (root) {
  'use strict';
  const R = 1737.4,
    E = 6371,
    D = 384400,
    MU = 4902.800066;
  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function sample(angle = 258, altitude = 100, phase = 45, surface = false) {
    const h = surface ? 0 : clamp(Number(altitude) || 100, 50, 2000),
      r = R + h;
    const t = rad(surface ? 0 : angle),
      n = [-Math.cos(t), 0, Math.sin(t)];
    const position = n.map((x) => x * r),
      earthVector = [-D - position[0], 0, -position[2]];
    const distance = Math.hypot(...earthVector);
    const altitudeDeg = deg(Math.asin(clamp((D * Math.cos(t) - r) / distance, -1, 1)));
    const depression = deg(Math.acos(R / r)),
      angularRadius = deg(Math.asin(E / distance));
    const clearance = altitudeDeg + depression;
    return {
      position,
      normal: n,
      distance,
      altitude: altitudeDeg,
      horizon: depression ? -depression : 0,
      angularRadius,
      visibility:
        clearance + angularRadius < 0
          ? 'hidden'
          : clearance - angularRadius > 0
            ? 'visible'
            : 'partial',
      earthFraction: (1 + Math.cos(rad(phase))) / 2,
      moonFraction: (1 - Math.cos(rad(phase))) / 2,
      period: 2 * Math.PI * Math.sqrt((r * r * r) / MU),
      clearance,
    };
  }
  function riseAngle(altitude = 100) {
    let lo = 180,
      hi = 270;
    for (let i = 0; i < 60; i++) {
      const m = (lo + hi) / 2,
        s = sample(m, altitude);
      if (s.clearance + s.angularRadius < 0) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  }
  root.LunarOrbitModel = { R, E, D, MU, sample, riseAngle, rad, deg };
  if (typeof module !== 'undefined') module.exports = root.LunarOrbitModel;
})(globalThis);
