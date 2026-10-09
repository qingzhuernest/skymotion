/**
 * Ground-based comparison at the same UTC instant as the space scene.
 * This module owns no clock or lab state. Camera movement never changes its coordinates.
 */
(function (global) {
  'use strict';

  const SUN = { id: 'Sun', name: '太阳', color: '#ffd584' };
  const MOON = { id: 'Moon', name: '月球', color: '#d9e7ff' };

  function create({ host, onSelect }) {
    const canvas = document.createElement('canvas');
    canvas.className = 'observer-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '同一 UTC 时刻的本地天空方位与高度');
    const readout = document.createElement('div');
    readout.className = 'observer-readout';
    const note = document.createElement('p');
    note.className = 'observer-note';
    note.textContent =
      '几何中心高度，不计折射；地平线上不等于肉眼可见。只显示当前时刻，不绘制全天轨道。';
    host.append(canvas, readout, note);

    const context = canvas.getContext('2d');
    let lastInput = null;
    let lastKey = '';
    let entries = [];
    let width = 0;
    let height = 0;
    let hitTargets = [];
    let phase = null;
    let location = null;

    function select(entry) {
      if (typeof entry.index === 'number' && typeof onSelect === 'function') onSelect(entry.index);
    }

    function calculate(input) {
      const lat = Number(input.observer?.lat ?? 39.9);
      const lon = Number(input.observer?.lon ?? 116.4);
      const date = input.date;
      if (
        !Number.isFinite(lat) ||
        Math.abs(lat) > 90 ||
        !Number.isFinite(lon) ||
        Math.abs(lon) > 180 ||
        !date ||
        !Number.isFinite(date.getTime())
      ) {
        entries = [];
        location = null;
        phase = null;
        return;
      }
      const bodies = global.SolarSpaceModel.bodies;
      const index =
        typeof input.selected === 'number'
          ? input.selected
          : bodies.findIndex((body) => body.id === input.selected);
      const selected = bodies[index];
      const targets = [SUN, MOON];
      if (input.view !== 'earthmoon' && selected && selected.id !== 'Earth') {
        targets.push({
          ...selected,
          index,
          color: `#${selected.color.toString(16).padStart(6, '0')}`,
        });
      }
      const observer = new Astronomy.Observer(lat, lon, 0);
      entries = targets.map((body) => {
        const equator = Astronomy.Equator(body.id, date, observer, true, true);
        // No refraction argument: matches skyRaw()'s geometric-horizon convention.
        const horizon = Astronomy.Horizon(date, observer, equator.ra, equator.dec);
        return { ...body, altitude: horizon.altitude, azimuth: horizon.azimuth };
      });
      location = { lat, lon };
      phase = input.view === 'earthmoon' ? input.snapshot.moonIllumination : null;
    }

    function updateReadouts() {
      readout.replaceChildren();
      readout.style.gridTemplateColumns = `repeat(${Math.max(1, entries.length)}, minmax(0, 1fr))`;
      entries.forEach((entry) => {
        const element = document.createElement(typeof entry.index === 'number' ? 'button' : 'div');
        element.className = 'observer-body-readout';
        if (element.tagName === 'BUTTON') {
          element.type = 'button';
          element.addEventListener('click', () => select(entry));
        }
        const name = document.createElement('strong');
        name.textContent = entry.name;
        name.style.color = entry.color;
        const value = document.createElement('span');
        value.textContent = `高 ${entry.altitude.toFixed(1)}° · 方 ${entry.azimuth.toFixed(1)}°`;
        const visibility = document.createElement('small');
        visibility.textContent =
          entry.altitude < -30
            ? '低于图示范围 · 地平线下'
            : entry.altitude < 0
              ? '地平线下'
              : '几何地平线上';
        if (Math.abs(location.lat) > 89.99 || entry.altitude > 89.9) {
          value.textContent = `${entry.altitude.toFixed(1)}° 高度 · 方位需结合参考方向`;
          visibility.textContent = '极点或天顶附近，方位不唯一或敏感';
        }
        element.append(name, value, visibility);
        readout.append(element);
      });
      if (phase !== null) {
        const element = document.createElement('div');
        element.className = 'observer-phase-readout';
        element.textContent = `地心照明 ${(phase * 100).toFixed(1)}%（非当地朝向）`;
        readout.append(element);
      }
      if (!entries.length) readout.textContent = '请设置有效的观测地点与 UTC 日期。';
      canvas.setAttribute(
        'aria-label',
        entries
          .map(
            (entry) =>
              `${entry.name}高度${entry.altitude.toFixed(1)}度，方位${entry.azimuth.toFixed(1)}度`,
          )
          .join('；') || '本地天空图，等待有效日期与地点',
      );
    }

    function draw() {
      if (!context || !width || !height) return;
      const ctx = context;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#14283a';
      ctx.fillRect(0, 0, width, height);
      const compact = height < 220 || width < 320;
      const tiny = height < 100;
      const left = compact ? 32 : 40;
      const right = width - 14;
      const top = tiny ? 18 : compact ? 27 : 36;
      const bottom = height - (tiny ? 16 : compact ? 26 : 31);
      if (right <= left || bottom <= top) return;
      const x = (azimuth) => left + (azimuth / 360) * (right - left);
      const y = (altitude) => bottom - ((altitude + 30) / 120) * (bottom - top);
      ctx.fillStyle = '#18333c';
      ctx.fillRect(left, y(0), right - left, bottom - y(0));
      ctx.font = `${compact ? 10 : 11}px system-ui, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      (tiny ? [0, 90] : [-30, 0, 30, 60, 90]).forEach((altitude) => {
        ctx.strokeStyle = altitude === 0 ? '#8eb8c6' : '#30495e';
        ctx.lineWidth = altitude === 0 ? 1.5 : 0.7;
        ctx.beginPath();
        ctx.moveTo(left, y(altitude));
        ctx.lineTo(right, y(altitude));
        ctx.stroke();
        ctx.fillStyle = '#b9cad9';
        ctx.fillText(`${altitude}°`, left - 6, y(altitude));
      });
      ctx.textAlign = 'center';
      [0, 90, 180, 270, 360].forEach((azimuth, i) => {
        ctx.strokeStyle = '#30495e';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(x(azimuth), top);
        ctx.lineTo(x(azimuth), bottom);
        ctx.stroke();
        ctx.fillStyle = '#b9cad9';
        ctx.fillText(
          (width < 240
            ? ['北', '东', '南', '西', '北']
            : ['北 0°', '东 90°', '南 180°', '西 270°', '北'])[i],
          Math.min(right - 8, Math.max(left + 8, x(azimuth))),
          bottom + (tiny ? 10 : 16),
        );
      });
      ctx.textAlign = 'left';
      ctx.fillStyle = '#c3d4e3';
      const coordinates = location
        ? `${Math.abs(location.lat).toFixed(1)}°${location.lat < 0 ? 'S' : 'N'} · ${Math.abs(location.lon).toFixed(1)}°${location.lon < 0 ? 'W' : 'E'}`
        : '请选择观察地点';
      ctx.fillText(
        width < 240 ? coordinates : `${coordinates} · 方位北起顺时针`,
        width < 240 ? 8 : left,
        compact ? 12 : 16,
      );
      const labelBoxes = [];
      hitTargets = [];
      entries.forEach((entry) => {
        if (entry.altitude < -30) return;
        const px = x(entry.azimuth),
          py = y(entry.altitude);
        const radius = entry.id === 'Sun' ? 5 : 4;
        ctx.save();
        ctx.shadowColor = entry.color;
        ctx.shadowBlur = entry.id === 'Sun' ? 12 : 6;
        ctx.fillStyle = entry.color;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        hitTargets.push({ x: px, y: py, entry });
        if (!lastInput.names) return;
        const label = entry.name;
        const labelWidth = ctx.measureText(label).width;
        // Try both sides and several heights; suppress the label rather than overlap.
        for (const dy of [-12, 12, -25, 25]) {
          let drawn = false;
          for (const side of [1, -1]) {
            const bx = side > 0 ? px + 9 : px - 9 - labelWidth;
            const by = py + dy - 6;
            const box = { x: bx, y: by, w: labelWidth, h: 12 };
            if (bx < left || bx + labelWidth > right || by < top || by + 12 > bottom) continue;
            if (
              labelBoxes.some(
                (old) =>
                  box.x < old.x + old.w + 5 &&
                  box.x + box.w + 5 > old.x &&
                  box.y < old.y + old.h + 3 &&
                  box.y + box.h + 3 > old.y,
              )
            )
              continue;
            ctx.fillStyle = entry.color;
            ctx.textAlign = 'left';
            ctx.fillText(label, bx, by + 6);
            labelBoxes.push(box);
            drawn = true;
            break;
          }
          if (drawn) break;
        }
      });
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(0, bounds.width);
      height = Math.max(0, bounds.height);
      const dpr = Math.min(2, global.devicePixelRatio || 1);
      const targetWidth = Math.round(width * dpr),
        targetHeight = Math.round(height * dpr);
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      if (context) context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function render(input) {
      lastInput = { ...input, names: input.names !== false };
      const key = [
        input.date?.getTime(),
        input.observer?.lat,
        input.observer?.lon,
        input.view,
        input.selected,
      ].join(':');
      if (key !== lastKey) {
        lastKey = key;
        calculate(lastInput);
        updateReadouts();
      }
      resize();
    }

    canvas.addEventListener('click', (event) => {
      const bounds = canvas.getBoundingClientRect();
      const px = event.clientX - bounds.left,
        py = event.clientY - bounds.top;
      const target = hitTargets
        .filter((item) => typeof item.entry.index === 'number')
        .sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[0];
      if (target && Math.hypot(target.x - px, target.y - py) <= 16) select(target.entry);
    });

    return {
      render,
      resize,
      canvas,
      state: () => ({
        observer: location ? { ...location } : null,
        entries: entries.map(({ id, altitude, azimuth }) => ({ id, altitude, azimuth })),
        moonIllumination: phase,
      }),
    };
  }

  global.SolarSpaceObserver = { create };
})(globalThis);
