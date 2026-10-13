/** Same-epoch comparison renderer. It consumes model output; it never computes ephemerides. */
(function (global) {
  'use strict';

  function create({ host, onSelect = () => {} }) {
    const canvas = document.createElement('canvas');
    canvas.className = 'space-compare-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '与三维画面同一 UTC 时刻的黄道俯视投影');
    host.append(canvas);
    const ctx = canvas.getContext('2d');
    let width = 1;
    let height = 1;
    let hits = [];
    let latest = null;
    let pointerStart = null;

    function resize() {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const ratio = Math.min(global.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (latest) render(latest);
    }

    function disc(point, radius, color, selected) {
      if (selected) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      const gradient = ctx.createRadialGradient(
        point.x - radius * 0.3,
        point.y - radius * 0.3,
        0,
        point.x,
        point.y,
        radius,
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, color);
      gradient.addColorStop(1, color);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function text(label, x, y, color = '#c0d0e0', align = 'left') {
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(label, x, y);
    }

    function arrow(from, to, color) {
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.moveTo(to.x - Math.cos(angle - 0.45) * 7, to.y - Math.sin(angle - 0.45) * 7);
      ctx.lineTo(to.x, to.y);
      ctx.lineTo(to.x - Math.cos(angle + 0.45) * 7, to.y - Math.sin(angle + 0.45) * 7);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }

    function render(input) {
      latest = input;
      const {
        snapshot,
        view = 'overview',
        selected = 2,
        orbitPaths = [],
        lunarPath = [],
        parallelRays = true,
        orbits = true,
        names = true,
      } = input;
      if (!snapshot) return;
      ctx.clearRect(0, 0, width, height);
      hits = [];
      const compact = height < 210 || width < 260;
      ctx.font = `${compact || width < 380 ? 11 : 12}px "SkyMotion Reading", serif`;
      ctx.textBaseline = 'middle';
      const earthmoon = view === 'earthmoon';
      text(
        compact ? (earthmoon ? '地心黄道俯视' : '日心黄道俯视') : '黄道北极上方俯视 · 平面投影',
        compact ? 10 : 16,
        compact ? 16 : 23,
        '#e3edf7',
      );
      const plotTop = compact ? 32 : 46;
      const plotBottom = height - (compact ? 26 : earthmoon ? 58 : 36);
      const origin = { x: width / 2, y: (plotTop + plotBottom) / 2 };
      const extent = Math.max(3, Math.min(width - 40, plotBottom - plotTop) / 2 - 9);
      const bounds = [];
      function project(vector, scale) {
        return { x: origin.x + vector.x * scale, y: origin.y + vector.z * scale };
      }
      function label(label, point, radius, color) {
        // Small projections use the readout below; eight overlapping names teach nothing.
        if (!names || compact) return;
        const size = ctx.measureText(label).width;
        let placed = null;
        for (const side of [1, -1]) {
          const x = Math.max(
            10,
            Math.min(width - size - 10, point.x + side * (radius + 8) - (side < 0 ? size : 0)),
          );
          for (const shift of [0, -17, 17, -34, 34]) {
            const y = point.y + shift;
            if (y < plotTop + 6 || y > plotBottom - 6) continue;
            if (
              bounds.some((b) => Math.abs(b.y - y) < 15 && x < b.x + b.w + 4 && x + size + 4 > b.x)
            )
              continue;
            placed = { x, y, w: size };
            break;
          }
          if (placed) break;
        }
        if (!placed) return;
        bounds.push(placed);
        if (Math.abs(placed.y - point.y) > 8) {
          ctx.beginPath();
          ctx.moveTo(point.x + radius, point.y);
          ctx.lineTo(placed.x - 3, placed.y);
          ctx.strokeStyle = '#8399b0';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
        text(label, placed.x, placed.y, color);
      }
      function path(points, scale, color) {
        if (!points.length) return;
        ctx.beginPath();
        points.forEach((v, index) => {
          const p = project(v, scale);
          if (index === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (earthmoon) {
        // Same independently enlarged Moon vector as the 3D view; discard only vertical y.
        const moonScale = 2.4 / 0.002569555;
        const scale = extent / 4.3;
        if (orbits) path(lunarPath, scale, '#7890ac66');
        const moon = project(
          { x: snapshot.moon.x * moonScale, z: snapshot.moon.z * moonScale },
          scale,
        );
        const sunLength = Math.hypot(snapshot.earthToSun.x, snapshot.earthToSun.z);
        if (sunLength > 1e-8) {
          const direction = {
            x: snapshot.earthToSun.x / sunLength,
            y: snapshot.earthToSun.z / sunLength,
          };
          for (let offset = -2; parallelRays && offset <= 2; offset++) {
            const cross = offset * Math.min(16, extent * 0.25);
            const from = {
              x: origin.x + direction.x * extent * 0.9 - direction.y * cross,
              y: origin.y + direction.y * extent * 0.9 + direction.x * cross,
            };
            arrow(
              from,
              { x: from.x - direction.x * extent * 1.3, y: from.y - direction.y * extent * 1.3 },
              '#f1c97666',
            );
          }
          if (!compact)
            text(
              parallelRays ? '太阳方向 / 平行入射光' : '太阳方向',
              Math.max(88, Math.min(width - 88, origin.x + direction.x * extent)),
              Math.max(50, Math.min(height - 58, origin.y + direction.y * extent)),
              '#f3d49a',
              'center',
            );
        }
        disc(origin, compact ? 7 : 11, '#719ec9', false);
        disc(moon, compact ? 4 : 6, '#c3cbd7', false);
        label('地球', origin, 11, '#b9d7f0');
        label('月球', moon, 6, '#e7edf5');
        ctx.setLineDash([4, 5]);
        const sunLength2 = Math.hypot(snapshot.earthToSun.x, snapshot.earthToSun.z);
        if (sunLength2 > 1e-8)
          arrow(
            origin,
            {
              x: origin.x + (snapshot.earthToSun.x / sunLength2) * extent * 0.83,
              y: origin.y + (snapshot.earthToSun.z / sunLength2) * extent * 0.83,
            },
            '#e9d09f',
          );
        ctx.setLineDash([]);
        text(
          `地心月面照明 ${(snapshot.moonIllumination * 100).toFixed(1)}%`,
          compact ? 10 : 16,
          height - (compact ? 12 : 36),
        );
        if (!compact) text('黄道投影省略倾角；圆点不表示月相', 16, height - 17, '#91a7bd');
      } else {
        const maxRadius = Math.max(
          ...snapshot.planets.map((planet) => Math.hypot(planet.display.x, planet.display.z)),
          ...orbitPaths.flatMap((points) => points.map((v) => Math.hypot(v.x, v.z))),
          1,
        );
        const scale = extent / maxRadius;
        if (orbits) orbitPaths.forEach((points) => path(points, scale, '#7890ac55'));
        disc(origin, compact ? 5 : 8, '#f6cd7c', false);
        label('太阳', origin, 8, '#f4d79c');
        snapshot.planets.forEach((planet, index) => {
          const body = global.SolarSpaceModel.bodies[index];
          const point = project(planet.display, scale);
          const giant = body.id === 'Jupiter' || body.id === 'Saturn';
          const radius = compact ? (giant ? 4 : 3) : giant ? 6 : 4;
          const color = `#${body.color.toString(16).padStart(6, '0')}`;
          disc(point, radius, color, index === selected);
          label(body.name, point, radius, index === selected ? '#ffffff' : '#bfd0e2');
          hits.push({ ...point, radius: 18, index });
        });
        if (compact) {
          const selectedBody = global.SolarSpaceModel.bodies[selected];
          const selectedPlanet = snapshot.planets[selected];
          if (selectedBody && selectedPlanet)
            text(
              `${selectedBody.name} · 距日 ${Math.hypot(selectedPlanet.physical.x, selectedPlanet.physical.y, selectedPlanet.physical.z).toFixed(2)} AU`,
              10,
              height - 12,
            );
        } else text('共用压缩距离；圆点大小不按真实比例', 16, height - 17, '#91a7bd');
      }
    }

    canvas.addEventListener('pointerdown', (event) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    });
    canvas.addEventListener('pointercancel', () => {
      pointerStart = null;
    });
    canvas.addEventListener('pointerup', (event) => {
      if (
        !pointerStart ||
        Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8
      ) {
        pointerStart = null;
        return;
      }
      pointerStart = null;
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const hit = hits
        .filter((p) => Math.hypot(p.x - x, p.y - y) < p.radius)
        .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
      if (hit) onSelect(hit.index);
    });
    resize();
    return { render, resize, canvas };
  }

  global.SolarSpaceCompare = { create };
})(globalThis);
