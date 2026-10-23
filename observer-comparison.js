/** Shared comparisons use the native ephemerides and never mutate the baseline. */
(() => {
  const cache = new Map(),
    R = Math.PI / 180;
  const colors = ['#b5cebd', '#dfb2ac', '#d8c59e', '#c7bdd8', '#d6d8c7', '#d2bda5'];
  const en = () => document.documentElement.lang.startsWith('en');
  const refs = () => window.SkyDiagramTools?.observers?.() || [];
  function memo(key, fn) {
    if (cache.has(key)) return cache.get(key);
    const value = fn();
    if (cache.size > 120) cache.delete(cache.keys().next().value);
    cache.set(key, value);
    return value;
  }
  function at(instant, lat, lon) {
    const date = new Date(instant),
      observer = new Astronomy.Observer(lat, lon, 0),
      eq = Astronomy.Equator('Sun', date, observer, true, true),
      h = Astronomy.Horizon(date, observer, eq.ra, eq.dec),
      a = h.altitude * R,
      z = h.azimuth * R;
    return {
      alt: h.altitude,
      az: h.azimuth,
      x: Math.cos(a) * Math.sin(z),
      y: Math.sin(a),
      z: Math.cos(a) * Math.cos(z),
    };
  }
  function basis() {
    return !state.manual && state.observerTimeBasis === 'utc' ? 'utc' : 'solar';
  }
  function sample(o, time = state.time) {
    if (state.manual) return solar(o.lat, state.dec, time);
    return basis() === 'utc'
      ? at(instantUTC(time, state.date, state.lon).getTime(), o.lat, o.lon)
      : skyRaw('Sun', time, state.date, o.lat, o.lon);
  }
  const siteColors = new Map();
  function color(id) {
    if (!siteColors.has(id)) siteColors.set(id, colors[siteColors.size % colors.length]);
    return siteColors.get(id);
  }
  function name(o) {
    return o.customLabel
      ? o.label
      : window.skyTranslate?.(o.label.split('|')[en() ? 1 : 0]) || o.label.split('|')[en() ? 1 : 0];
  }
  function enabled() {
    return (
      ['lab', 'diagrams'].includes(document.body.dataset.page) &&
      state.body === 'sun' &&
      window.SkyCustomization?.active === true
    );
  }
  function sites() {
    if (!enabled()) return [];
    const references = refs(),
      key = JSON.stringify([
        'sites',
        en(),
        references,
        state.date,
        state.time,
        state.lon,
        state.manual,
        state.dec,
        basis(),
      ]);
    return memo(key, () =>
      references.map((o) => {
        const utc =
            basis() === 'utc'
              ? instantUTC().getTime()
              : state.manual
                ? null
                : instantUTC(state.time, state.date, o.lon).getTime(),
          clock = utc === null ? null : observerClockAt(utc, o.lon);
        return {
          ...o,
          color: color(o.id),
          name: name(o),
          date: state.manual ? state.date : (clock?.date ?? null),
          time: state.manual ? state.time : (clock?.time ?? null),
          clockValid: state.manual || !!clock,
          utc,
          position: sample(o),
        };
      }),
    );
  }
  function times() {
    if (!enabled()) return [];
    return (window.SkyDiagramTools?.times?.() || []).map((o) => ({
      ...o,
      name: name(o),
      color: '#d8c59e',
      date: state.date,
      position: state.manual
        ? solar(state.lat, state.dec, o.time)
        : skyRaw('Sun', o.time, state.date, state.lat, state.lon),
    }));
  }
  function points(o) {
    return memo(
      JSON.stringify([
        'path',
        o.lat,
        o.lon,
        state.date,
        state.lon,
        basis(),
        state.manual,
        state.manual ? state.dec : 0,
      ]),
      () => Array.from({ length: 97 }, (_, i) => ({ time: i * 15, ...sample(o, i * 15) })),
    );
  }
  function events(o) {
    if (!o.clockValid) return [];
    return SkyDiagramSampling.events(
      o.date,
      0,
      'Sun',
      o.lat,
      o.lon,
      state.manual ? state.dec : null,
    );
  }
  function stroke(c, pts, color, dash = []) {
    let previous = null;
    c.strokeStyle = color;
    c.lineWidth = 1.5;
    c.setLineDash(dash);
    c.beginPath();
    for (const p of pts) {
      if (!p || p.hidden || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        previous = null;
        continue;
      }
      if (!previous || (Number.isFinite(p.wrap) && Math.abs(p.wrap - previous.wrap) > 180))
        c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
      previous = p;
    }
    c.stroke();
    c.setLineDash([]);
  }
  function dot(c, p, color, r = 3) {
    if (!p || p.hidden || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    c.fillStyle = color;
    c.beginPath();
    c.arc(p.x, p.y, r, 0, Math.PI * 2);
    c.fill();
  }
  let occupiedLabels = [];
  function label(c, m, value, p, color) {
    if (!p || p.hidden) return;
    c.fillStyle = color;
    c.font = `11px ${getComputedStyle(document.body).fontFamily}`;
    c.textAlign = 'left';
    let text = String(value);
    while (text.length > 2 && c.measureText(text).width > m.w - 24) text = text.slice(0, -2) + '…';
    const width = c.measureText(text).width;
    for (const [dx, dy] of [
      [7, -8],
      [7, 18],
      [-width - 7, -8],
      [-width - 7, 18],
      [7, -26],
      [7, 36],
    ]) {
      const x = Math.max(8, Math.min(m.w - width - 8, p.x + dx)),
        y = Math.max(16, Math.min(m.h - 12, p.y + dy));
      const box = { x, y: y - 12, w: width + 5, h: 16 };
      if (
        occupiedLabels.some(
          (q) =>
            box.x < q.x + q.w && box.x + box.w > q.x && box.y < q.y + q.h && box.y + box.h > q.y,
        )
      )
        continue;
      occupiedLabels.push(box);
      if (window.skyFillText) skyFillText(c, text, x, y);
      else c.fillText(text, x, y);
      return;
    }
  }
  function geometryRay(c, m, o, ring) {
    const a = o.lat * R,
      d = (o.lon - state.lon) * R,
      q = [Math.cos(a) * Math.cos(d), Math.sin(a), Math.cos(a) * Math.sin(d)],
      north = [-Math.sin(a) * Math.cos(d), Math.cos(a), -Math.sin(a) * Math.sin(d)],
      east = [-Math.sin(d), 0, Math.cos(d)],
      p = o.position,
      sun = q.map((v, i) => v * p.y + north[i] * p.z + east[i] * p.x);
    if (ring)
      stroke(
        c,
        Array.from({ length: 73 }, (_, i) => {
          const t = (i * Math.PI) / 36;
          return m.project(
            q.map((v, j) => v + 0.34 * (north[j] * Math.cos(t) + east[j] * Math.sin(t))),
          );
        }),
        o.color,
      );
    const tip = m.project(q.map((v, i) => v + sun[i] * 0.65));
    stroke(c, [m.project(q), tip], o.color, p.alt < 0 ? [3, 4] : []);
    dot(c, m.project(q), o.color, 4);
    return tip;
  }
  const report = new Map();
  function paint(m) {
    occupiedLabels = [];
    if (!['sky', 'globe', 'altitude', 'azimuth', 'geometry'].includes(m.type) || m.body !== 'sun')
      return;
    const list = sites(),
      marks = times();
    report.set(m.type, {
      basis: basis(),
      sites: list.map((o) => ({
        id: o.id,
        lat: o.lat,
        lon: o.lon,
        utc: o.utc,
        date: o.date,
        time: o.time,
        position: o.position,
        color: o.color,
        clockValid: o.clockValid,
      })),
      times: marks.map((o) => ({
        id: o.id,
        source: o.source,
        date: o.date,
        time: o.time,
        position: o.position,
      })),
    });
    if (!list.length && !marks.length) return;
    const c = m.c;
    c.save();
    try {
      if (m.clip) {
        c.beginPath();
        c.rect(...m.clip);
        c.clip();
      }
      for (const o of list) {
        if (m.type === 'globe') {
          if (o.source !== m.id) {
            const p = m.project(o.lat, o.lon);
            dot(c, p, o.color, 4);
            label(c, m, o.name, p, o.color);
          }
        } else if (m.type === 'altitude') {
          stroke(
            c,
            points(o).map((p) => m.project(p.time, p.alt)),
            o.color,
          );
          dot(c, m.project(state.time, o.position.alt), o.color, 4);
        } else if (m.type === 'azimuth') {
          const i = list.indexOf(o);
          for (const e of events(o)) {
            const p = m.project(e.az, Math.max(0.4, 0.94 - i * 0.045));
            stroke(c, [m.project(0, 0), p], o.color, [3, 4]);
            dot(c, p, o.color);
          }
        } else if (m.type === 'geometry') geometryRay(c, m, o, true);
        else {
          const ps = points(o);
          for (let i = 1; i < ps.length; i++)
            stroke(
              c,
              [m.projectSky(ps[i - 1]), m.projectSky(ps[i])],
              o.color,
              ps[i].alt < 0 ? [3, 4] : [],
            );
          dot(c, m.projectSky(o.position), o.color, 4);
        }
      }
      for (const o of marks) {
        const text = SkyDiagramSampling.clock(o.time);
        if (m.type === 'globe') {
          const utc = state.manual ? null : instantUTC(o.time),
            eq = utc ? sunEquatorial(utc) : null,
            lat = eq?.dec ?? state.dec,
            lon = utc
              ? ((eq.ra * 15 - Astronomy.SiderealTime(utc) * 15 + 540) % 360) - 180
              : ((state.lon - (o.time - 720) / 4 + 540) % 360) - 180,
            p = m.project(lat, lon);
          if (!p.hidden) {
            c.strokeStyle = o.color;
            c.beginPath();
            c.arc(p.x, p.y, 5, 0, Math.PI * 2);
            c.stroke();
            label(c, m, text + (en() ? ' subsolar' : ' 直射点'), p, o.color);
          }
        } else if (m.type === 'altitude' && o.source !== m.id) {
          const p = m.project(o.time, o.position.alt);
          stroke(c, [m.project(o.time, m.low), m.project(o.time, m.high)], o.color, [3, 4]);
          dot(c, p, o.color);
          label(c, m, text, p, o.color);
        } else if (m.type === 'sky' && o.source !== m.id) {
          const p = m.projectSky(o.position);
          dot(c, p, o.color, 4);
          label(c, m, text, p, o.color);
        } else if (m.type === 'azimuth') {
          const p = m.project(o.position.az, 0.62);
          stroke(c, [m.project(0, 0), p], o.color, [2, 4]);
          dot(c, p, o.color);
          label(c, m, text, p, o.color);
        } else if (m.type === 'geometry') {
          const p = geometryRay(c, m, { ...o, lat: state.lat, lon: state.lon }, false);
          label(c, m, text, p, o.color);
        }
      }
    } finally {
      c.restore();
    }
    c.save();
    c.font = `11px ${getComputedStyle(document.body).fontFamily}`;
    c.textAlign = 'left';
    let x = m.clip ? m.clip[0] + 4 : 12,
      y = m.type === 'sky' ? 64 : 18;
    for (const o of list) {
      let text = o.name + (!o.clockValid ? (en() ? ' · date out of range' : ' · 日期越界') : '');
      if (text.length > 14) text = text.slice(0, 12) + '…';
      const width = c.measureText(text).width + 22;
      if (x + width > m.w - 12) {
        x = 12;
        y += 17;
      }
      if (y > Math.min(m.type === 'sky' ? 98 : 65, m.h * 0.25)) break;
      c.fillStyle = o.color;
      c.fillRect(x, y - 7, 10, 2);
      if (window.skyFillText) skyFillText(c, text, x + 15, y - 3);
      else c.fillText(text, x + 15, y - 3);
      x += width;
    }
    c.restore();
  }
  window.SkyObserverComparison = {
    paint,
    color,
    sites: () => JSON.parse(JSON.stringify(sites())),
    read: () => Object.fromEntries(report),
  };
})();
