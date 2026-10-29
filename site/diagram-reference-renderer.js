/** Read-only reference rendering and hit geometry; no editor DOM, drafts or history. */
(() => {
  function create({ tr, en, stateFor, skyPosition, getObservation }) {
    const R = Math.PI / 180;
    function textLayout(m, value, p, bounds = null) {
      const c = m.c;
      c.save();
      c.font = `12px "${en() ? 'SkyMotion Charter' : 'SkyMotion Reading'}",serif`;
      let label = String(value),
        width = c.measureText(label).width;
      const [left, top, w, h] = bounds || [0, 0, m.w, m.h],
        available = Math.max(12, w - 12);
      if (width > available) {
        while (label.length && c.measureText(label + '…').width > available)
          label = label.slice(0, -1);
        label += '…';
        width = c.measureText(label).width;
      }
      c.restore();
      return {
        text: label,
        width,
        x: Math.max(left + 6, Math.min(left + w - 6 - width, p.x)),
        y: Math.max(top + 14, Math.min(top + h - 8, p.y)),
      };
    }
    const trackColors = ['#c4d9bf', '#e5b9a5', '#dfd2a4', '#d2c1d8', '#b9d4ce'];
    function helper(m) {
      const { c, w, h } = m,
        col = '#f2d7a3';
      return {
        c,
        w,
        h,
        line(a, b, dashed = false) {
          if (!a || !b) return;
          c.beginPath();
          c.setLineDash(dashed ? [4, 4] : []);
          c.strokeStyle = this.color || col;
          c.lineWidth = this.width || 1.5;
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.stroke();
          c.setLineDash([]);
        },
        path(points, dashed = false) {
          let previous = null;
          for (const p of points) {
            if (!p || p.hidden) {
              previous = null;
              continue;
            }
            if (
              previous &&
              (!Number.isFinite(p.wrap) ||
                !Number.isFinite(previous.wrap) ||
                Math.abs(p.wrap - previous.wrap) <= 180)
            )
              this.line(previous, p, dashed);
            previous = p;
          }
        },
        dot(p, label) {
          if (!p || p.hidden) return;
          c.fillStyle = this.color || col;
          c.beginPath();
          c.arc(p.x, p.y, 4, 0, 7);
          c.fill();
          if (label) this.text(label, { x: p.x + 8, y: p.y - 8 });
        },
        text(label, p) {
          if (!p) return;
          const layout = textLayout(m, label, p, this.clipLabels ? m.clip : null);
          c.font = `12px "${en() ? 'SkyMotion Charter' : 'SkyMotion Reading'}",serif`;
          c.fillStyle = this.color || col;
          c.textAlign = 'left';
          if (window.skyFillText) window.skyFillText(c, layout.text, layout.x, layout.y);
          else c.fillText(layout.text, layout.x, layout.y);
        },
        circle(p, r) {
          if (!p) return;
          c.strokeStyle = this.color || col;
          c.lineWidth = this.width || 1.5;
          c.beginPath();
          c.arc(p.x, p.y, r, 0, 7);
          c.stroke();
        },
      };
    }
    function drawObject(o, m, H) {
      const { type } = m,
        at = m.project,
        label = o.customLabel ? o.label : tr(o.label);
      let metric = '';
      if (o.type === 'note') {
        H.text(label, { x: (m.w * o.x) / 100, y: (m.h * o.y) / 100 });
        return label;
      }
      if (o.type === 'emphasis') {
        H.circle(
          { x: (m.w * o.x) / 100, y: (m.h * o.y) / 100 },
          (Math.min(m.w, m.h) * o.radius) / 100,
        );
        return label;
      }
      if (type === 'sky') {
        const body = m.body === 'moon' ? 'Moon' : 'Sun',
          observation = getObservation(),
          position = (time, date = m.date, lat = m.lat, lon = m.lon) =>
            skyPosition(body, time, date, lat, lon);
        if (o.type === 'time') {
          const p = position(o.time);
          H.dot(m.projectSky(p), label + ' · ' + SkyDiagramSampling.clock(o.time));
          metric = SkyDiagramSampling.clock(o.time) + ' · ' + p.alt.toFixed(1) + '°';
        }
        if (o.type === 'observer') {
          const p =
            window.SkyObserverComparison?.sites().find((q) => q.id === o.id)?.position ||
            position(m.time, m.date, o.lat, o.lon);
          H.dot(m.projectSky(p), label);
          metric = p.alt.toFixed(1) + '° · ' + p.az.toFixed(1) + '°';
        }
        if (o.type === 'curve') {
          const points = SkyDiagramSampling.memo(
            JSON.stringify([
              'sky-date',
              body,
              o.date,
              m.lat,
              m.lon,
              observation.manual,
              observation.manual ? observation.dec : 0,
            ]),
            () => Array.from({ length: 97 }, (_, i) => position(i * 15, o.date)),
          );
          H.path(points.map(m.projectSky));
          metric = o.date;
        }
      }
      if (type === 'globe') {
        if (['observer', 'ray'].includes(o.type)) {
          const p = at(o.lat, o.lon);
          H.dot(p, label);
          if (m.sun) {
            const a = o.lat * R,
              l = (o.lon - m.sun.lon) * R,
              d = m.sun.dec * R,
              alt =
                Math.asin(
                  Math.max(
                    -1,
                    Math.min(
                      1,
                      Math.sin(a) * Math.sin(d) + Math.cos(a) * Math.cos(d) * Math.cos(l),
                    ),
                  ),
                ) / R;
            metric = `${label} · ${alt.toFixed(1)}° · ${tr(alt >= 0 ? '白昼|Daylight' : '夜晚|Night')}`;
            if (o.type === 'ray' && p && !p.hidden)
              H.line(p, m.rayAt?.(o.lat, o.lon), alt < 0);
          }
        }
        if (o.type === 'observer') {
          const linked = window.SkyObserverComparison?.sites().find((p) => p.id === o.id);
          if (linked) {
            const minute = Math.round(linked.time) % 1440;
            metric =
              `${label} · ${linked.position.alt.toFixed(1)}° · ` +
              (linked.clockValid
                ? `${linked.date} ${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
                : tr('日期超出范围|Date outside range'));
          }
        }
        if (o.type === 'latitude')
          H.path(Array.from({ length: 181 }, (_, i) => at(o.lat, -180 + i * 2)));
        if (o.type === 'longitude')
          H.path(Array.from({ length: 91 }, (_, i) => at(-90 + i * 2, o.lon)));
      }
      if (type === 'altitude') {
        if (o.type === 'curve') {
          const points = Array.from({ length: 145 }, (_, i) =>
            m.project(i * 10, m.value(i * 10, o.date)),
          );
          H.path(points, true);
          H.text(label, points[72]);
          metric = o.date;
        }
        if (o.type === 'level') H.line(at(0, o.alt), at(1440, o.alt), true);
        if (o.type === 'time') {
          const v = m.value(o.time, m.date);
          H.line(at(o.time, m.low), at(o.time, m.high), true);
          H.dot(at(o.time, v), label);
          metric = `${v.toFixed(2)} ${m.unit}`;
        }
        if (o.type === 'measure') {
          const a = m.value(o.a, m.date),
            b = m.value(o.b, m.date);
          H.dot(at(o.a, a), 'A');
          H.dot(at(o.b, b), 'B');
          H.line(at(o.a, a), at(o.b, b));
          metric = `Δt ${Math.abs(o.b - o.a)} min · Δh ${(b - a).toFixed(2)}°`;
        }
      }
      if (type === 'illumination') {
        const value = (date) => m.value(date),
          inMonth = (date) => date.slice(0, 7) === m.date.slice(0, 7),
          outside = tr(
            '日期不在当前月份；切换到对应月份查看标记。|Date outside this month; switch to its month to see the marker.',
          );
        const dateDot = (date, v, text) => {
          if (inMonth(date)) H.dot(m.project(Number(date.slice(8)), v), text);
        };
        if (o.type === 'curve') {
          const base = o.date.slice(0, 8),
            count = new Date(
              Number(o.date.slice(0, 4)),
              Number(o.date.slice(5, 7)),
              0,
            ).getDate();
          const points = Array.from({ length: Math.min(count, m.days) }, (_, i) =>
            m.project(i + 1, value(base + String(i + 1).padStart(2, '0'))),
          );
          H.path(points, true);
          H.text(o.date.slice(0, 7) + ' · ' + label, points[Math.floor(points.length / 2)]);
          metric = o.date.slice(0, 7);
        }
        if (o.type === 'level')
          H.line(m.project(1, o.value), m.project(m.days, o.value), true);
        if (o.type === 'date') {
          const v = value(o.date);
          dateDot(o.date, v, label + ' · ' + o.date);
          metric =
            o.date + ' · ' + v.toFixed(2) + '%' + (inMonth(o.date) ? '' : ' · ' + outside);
        }
        if (o.type === 'measure') {
          const a = value(o.a),
            b = value(o.b);
          dateDot(o.a, a, 'A · ' + o.a);
          dateDot(o.b, b, 'B · ' + o.b);
          metric =
            `A ${o.a} · ${a.toFixed(2)}% / B ${o.b} · ${b.toFixed(2)}% · Δ ${(b - a).toFixed(2)} ${tr('个百分点|pp')}` +
            (!inMonth(o.a) || !inMonth(o.b) ? ' · ' + outside : '');
        }
      }
      if (type === 'azimuth') {
        if (o.type === 'direction') {
          const p = at(o.az, 1);
          H.line(at(0, 0), p);
          H.dot(p, label);
          metric = o.az + '°';
        }
        if (o.type === 'ring') H.circle(at(0, 0), (m.radius * o.radius) / 100);
        if (o.type === 'events') {
          const events = m.events(o.date, o.obstruction);
          for (const [i, p] of events.entries()) {
            const q = at(p.az, i ? 0.88 : 1.1);
            H.line(at(0, 0), q, true);
            H.dot(q, `${label} ${SkyDiagramSampling.clock(p.time)}`);
          }
          metric = events.length
            ? events.map((x) => x.az.toFixed(1) + '°').join(' / ')
            : tr('此日未穿越指定遮挡角|No crossing of this obstruction angle');
        }
      }
      if (type === 'geometry') {
        const scale = (a, k) => a.map((x) => x * k),
          add = (a, b) => a.map((x, i) => x + b[i]);
        if (o.type === 'observer') {
          const a = o.lat * R,
            l = (o.lon - m.lon) * R,
            q = [Math.cos(a) * Math.cos(l), Math.sin(a), Math.cos(a) * Math.sin(l)];
          H.dot(at(q), label);
          H.line(at(q), at(scale(q, 1 + o.height)));
          metric = `${o.lat.toFixed(1)}°, ${o.lon.toFixed(1)}°`;
        }
        if (o.type === 'ring') {
          const center = o.plane === 'horizon' ? m.q : [0, 0, 0],
            u = o.plane === 'horizon' ? m.north : [1, 0, 0],
            v =
              o.plane === 'horizon'
                ? m.east
                : o.plane === 'equator'
                  ? [0, 0, 1]
                  : [0, 1, 0];
          H.path(
            Array.from({ length: 121 }, (_, i) => {
              const a = (i * Math.PI) / 60;
              return at(
                add(
                  center,
                  add(scale(u, o.radius * Math.cos(a)), scale(v, o.radius * Math.sin(a))),
                ),
              );
            }),
          );
        }
        if (o.type === 'angle') {
          const dir = (key) =>
              key === 'axis'
                ? [0, 1, 0]
                : key === 'sun'
                  ? m.sun
                  : key === 'north'
                    ? m.north
                    : m.q,
            a = dir(o.a),
            b = dir(o.b),
            angle =
              Math.acos(
                Math.max(
                  -1,
                  Math.min(
                    1,
                    a.reduce((n, x, i) => n + x * b[i], 0) /
                      (Math.hypot(...a) * Math.hypot(...b)),
                  ),
                ),
              ) / R;
          H.line(at([0, 0, 0]), at(scale(a, 1.4)));
          H.line(at([0, 0, 0]), at(scale(b, 1.4)));
          metric = angle.toFixed(3) + '°';
          H.text(metric, at(scale(a, 1.2)));
        }
        if (o.type === 'direction') {
          const q =
            o.direction === 'sun'
              ? m.sun
              : o.direction === 'axis'
                ? [0, 1, 0]
                : o.direction === 'north'
                  ? m.north
                  : m.q;
          H.line(at([0, 0, 0]), at(scale(q, 1.5)));
          H.dot(at(scale(q, 1.5)), label);
        }
      }
      if (type === 'phase') {
        if (o.type === 'rays') {
          for (let i = 0; i < o.count; i++) {
            const y = m.center.y + (i - (o.count - 1) / 2) * m.radius * o.spread;
            H.line(
              { x: m.sunX - 15, y },
              { x: Math.max(8, m.center.x - m.radius), y },
              true,
            );
          }
          return o.count + ' ' + tr('条平行光线|parallel rays');
        }
        const angle = o.type === 'snapshot' ? m.phaseAt(o.date, o.time) : o.angle,
          p = at(angle);
        H.dot(p, label);
        if (o.type === 'snapshot' && o.sight !== 'no') H.line(m.center, p, true);
        if (o.type === 'observer') H.line(m.center, p);
        metric = `${angle.toFixed(1)}° · ${tr('照明|Illuminated')} ${(o.type === 'snapshot' ? m.fractionAt(o.date, o.time) * 100 : (1 - Math.cos(angle * R)) * 50).toFixed(1)}%`;
      }
      if (type === 'companion') {
        if (o.type === 'snapshot') {
          const s = m.sample(o.date, o.time);
          const a = at(s.moon),
            b = at(s.planet);
          H.line(a, b, true);
          H.dot(a, label + ' A');
          H.dot(b, label + ' B');
          metric = `${o.date} · ${s.separation.toFixed(3)}°`;
        }
        if (o.type === 'trail') {
          const moon = [],
            planet = [];
          for (const s of m.trail(o)) {
            moon.push(at(s.moon));
            planet.push(at(s.planet));
          }
          H.path(moon);
          H.path(planet, true);
          metric = tr('前后|Before/after') + ' ' + o.hours + ' h';
        }
      }
      if (type === 'analemma') {
        if (o.type === 'track') {
          const samples = m.track(o);
          H.path(samples.map(at), true);
          if (samples[0]) H.dot(at(samples[0]));
          const signature = (q) =>
              JSON.stringify([
                q.lat,
                q.lon,
                q.clock,
                q.basis || 'clock',
                (q.basis || 'clock') === 'clock' ? (q.offset ?? m.offset) : 0,
              ]),
            primary = {
              lat: m.lat,
              lon: m.lon,
              clock: m.clock,
              basis: m.basis,
              offset: m.offset,
            },
            duplicate = stateFor(m).objects.some(
              (q) =>
                q.id !== o.id &&
                q.type === 'track' &&
                q.visible &&
                signature(q) === signature(o),
            );
          metric = `${Math.abs(o.lat).toFixed(2)}°${o.lat < 0 ? 'S' : 'N'} · ${Math.abs(o.lon).toFixed(2)}°${o.lon < 0 ? 'W' : 'E'} · ${SkyDiagramSampling.clock(o.clock)} · ${tr(o.basis === 'apparent' ? '真太阳时|Apparent solar time' : '钟表时|Clock time')}`;
          if (o.basis !== 'apparent')
            metric += ' · UTC' + (o.offset >= 0 ? '+' : '') + o.offset;
          if (signature(primary) === signature(o) || duplicate)
            metric +=
              ' · ' +
              tr(
                '条件相同，轨迹重合；请改变时刻、经度或切换天空视图比较纬度。|Matching conditions overlap. Change time or longitude, or use a sky view to compare latitudes.',
              );
        }
        if (o.type === 'date') {
          const p = m.sample(o.date);
          H.dot(at(p), label + ' ' + o.date);
          metric = `${p.alt.toFixed(2)}°`;
        }
        if (o.type === 'level') {
          if (m.view === 'equatorial')
            return tr(
              '此图不是高度坐标，请切换天空或天穹视图查看高度参考。|Switch to sky or dome view to see an altitude reference.',
            );
          H.path(
            Array.from({ length: 181 }, (_, i) => at({ az: i * 2, alt: o.alt })),
            true,
          );
        }
      }
      if (type === 'lunar') {
        const p = m.reference(o);
        H.dot(p, label);
        if (o.type === 'sight') H.line(p, m.earth, true);
        metric = m.readReference(o);
      }
      if (type === 'space') {
        if (o.type === 'plane') {
          const points = Array.from({ length: 101 }, (_, i) => {
            const a = (i * Math.PI) / 50,
              x = o.radius * Math.cos(a),
              y = o.radius * Math.sin(a);
            return at(
              o.plane === 'xz' ? [x, 0, y] : o.plane === 'xy' ? [x, y, 0] : [0, x, y],
            );
          });
          H.path(points, true);
        }
        if (['distance', 'angle'].includes(o.type)) {
          const a = m.planet(o.a),
            b = m.planet(o.b);
          if (a && b) {
            H.dot(at(a.display), o.a);
            H.dot(at(b.display), o.b);
            if (o.type === 'distance') {
              H.line(at(a.display), at(b.display));
              metric =
                Math.hypot(...a.physical.map((v, i) => v - b.physical[i])).toFixed(5) +
                ' AU';
            } else {
              H.line(at(a.display), at([0, 0, 0]));
              H.line(at([0, 0, 0]), at(b.display));
              const angle =
                Math.acos(
                  Math.max(
                    -1,
                    Math.min(
                      1,
                      a.physical.reduce((n, v, i) => n + v * b.physical[i], 0) /
                        (Math.hypot(...a.physical) * Math.hypot(...b.physical)),
                    ),
                  ),
                ) / R;
              metric = angle.toFixed(3) + '°';
            }
            H.text(metric, at(a.display));
          }
        }
        if (o.type === 'camera')
          metric = tr(
            '已保存此视角，可在属性中返回|Saved viewpoint; restore from its properties',
          );
      }
      return metric;
    }
    function anchor(m, o) {
      if (o.type === 'note')
        return textLayout(m, o.customLabel ? o.label : tr(o.label), {
          x: (m.w * o.x) / 100,
          y: (m.h * o.y) / 100,
        });
      if (o.type === 'emphasis') return { x: (m.w * o.x) / 100, y: (m.h * o.y) / 100 };
      if (m.type === 'sky' && o.type === 'time') return m.projectSky(m.position(o.time));
      if (m.type === 'globe' && ['observer', 'ray'].includes(o.type) && m.pick)
        return m.project(o.lat, o.lon);
      if (m.type === 'altitude' && o.type === 'time' && m.pick)
        return m.project(o.time, m.value(o.time, m.date));
      return null;
    }
    function hitAnchor(m, o) {
      const a = anchor(m, o);
      if (a) return a;
      if (m.type === 'sky' && o.type === 'observer') {
        const p =
          window.SkyObserverComparison?.sites().find((q) => q.id === o.id)?.position ||
          skyPosition('Sun', m.time, m.date, o.lat, o.lon);
        return m.projectSky(p);
      }
      return null;
    }
    return Object.freeze({ textLayout, helper, drawObject, anchor, hitAnchor, trackColors });
  }
  globalThis.SkyReferenceRenderer = Object.freeze({ create });
})();
