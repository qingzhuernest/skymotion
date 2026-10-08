/**
 * 欢迎页星空动画与交互。
 */
/* A bounded, fictional interactive star field; it never changes experiment state. */
(() => {
  const canvas = $('welcomeSky'),
    ctx = canvas.getContext('2d'),
    status = $('welcomeStarStatus');
  let raf = 0,
    last = 0,
    time = 0,
    w = 0,
    h = 0,
    selected = -1,
    links = [],
    sparks = [],
    meteors = [],
    pointer = null,
    pan = { x: 0, y: 0 },
    target = { x: 0, y: 0 };
  let seed = 431;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const stars = Array.from({ length: 90 }, () => ({
    u: 0.05 + random() * 0.9,
    v: 0.08 + random() * 0.84,
    r: 0.65 + random() * 1.7,
    phase: random() * Math.PI * 2,
    speed: 0.35 + random() * 0.6,
    depth: 0.5 + random() * 0.5,
  }));
  function request() {
    if (w > 0 && h > 0 && !document.hidden && !raf) raf = requestAnimationFrame(frame);
  }
  function position(star) {
    return { x: star.u * w + pan.x * star.depth, y: star.v * h + pan.y * star.depth };
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Number.isFinite(r.width) ? Math.max(0, r.width) : 0;
    h = Number.isFinite(r.height) ? Math.max(0, r.height) : 0;
    if (!w || !h || ![pan.x, pan.y, target.x, target.y].every(Number.isFinite)) {
      pan = { x: 0, y: 0 };
      target = { x: 0, y: 0 };
      pointer = null;
    }
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    request();
  }
  function frame(now) {
    raf = 0;
    if (!w || !h || document.hidden) {
      last = 0;
      return;
    }
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    if (!reducedMotion.matches) time += dt;
    const ease = reducedMotion.matches ? 1 : 1 - Math.exp(-Math.max(dt, 0.016) * 8);
    pan.x += (target.x - pan.x) * ease;
    pan.y += (target.y - pan.y) * ease;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i],
        p = position(s),
        near = pointer ? Math.max(0, 1 - Math.hypot(pointer.x - p.x, pointer.y - p.y) / 100) : 0,
        lit = links.includes(i),
        alpha = lit ? 1 : 0.42 + 0.32 * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = lit ? '#ffdc98' : '#dceaff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.r + near * 0.9, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.7 || lit || near > 0.45) {
        const r = lit ? 12 : 7 + near * 8,
          g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, lit ? '#ffd58955' : '#9dc9ff33');
        g.addColorStop(1, '#9dc9ff00');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffd58d88';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    links.forEach((i, n) => {
      const p = position(stars[i]);
      if (n) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    });
    ctx.stroke();
    if (selected >= 0 && (document.activeElement === canvas || links.includes(selected))) {
      const p = position(stars[selected]);
      ctx.strokeStyle = '#ffd58d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    sparks = sparks.filter((s) => now - s.start < 700);
    for (const s of sparks) {
      const t = (now - s.start) / 700,
        p = position(stars[s.i]);
      ctx.globalAlpha = (1 - t) * 0.7;
      ctx.strokeStyle = '#ffd896';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8 + t * 32, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    meteors = meteors.filter((m) => now - m.start < (reducedMotion.matches ? 1200 : 1000));
    for (const m of meteors) {
      const t = (now - m.start) / 1000;
      if (reducedMotion.matches) {
        ctx.fillStyle = '#ffe6b3';
        ctx.beginPath();
        ctx.arc(m.u * w, m.v * h, 3, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      const x = m.u * w + t * w * 0.35,
        y = m.v * h + t * h * 0.35,
        tail = Math.min(70, w * 0.16),
        g = ctx.createLinearGradient(x - tail, y - tail * 0.5, x, y);
      g.addColorStop(0, '#afcdff00');
      g.addColorStop(1, '#ffe6b3');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.globalAlpha = Math.sin(Math.PI * Math.min(t, 1));
      ctx.beginPath();
      ctx.moveTo(x - tail, y - tail * 0.5);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (!reducedMotion.matches || sparks.length || meteors.length) request();
    else last = 0;
  }
  function connect(i) {
    selected = i;
    if (links.at(-1) === i) return;
    if (links.length >= 8) links = [];
    links.push(i);
    if (!reducedMotion.matches) sparks.push({ i, start: performance.now() });
    status.textContent =
      links.length === 1
        ? '第一颗星亮了，再选一颗吧'
        : `已连接 ${links.length} 颗星 · 你的星图正在成形`;
    request();
  }
  canvas.addEventListener('pointermove', (e) => {
    if (!w || !h) {
      pointer = null;
      target = { x: 0, y: 0 };
      return;
    }
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    target = reducedMotion.matches
      ? { x: 0, y: 0 }
      : { x: (pointer.x / w - 0.5) * 12, y: (pointer.y / h - 0.5) * 9 };
    request();
  });
  canvas.addEventListener('pointerleave', () => {
    pointer = null;
    target = { x: 0, y: 0 };
    request();
  });
  canvas.addEventListener('click', (e) => {
    if (!w || !h) return;
    const r = canvas.getBoundingClientRect(),
      x = e.clientX - r.left,
      y = e.clientY - r.top;
    let nearest = 0,
      best = Infinity;
    stars.forEach((s, i) => {
      const p = position(s),
        d = Math.hypot(x - p.x, y - p.y);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    connect(nearest);
  });
  canvas.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Escape'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Escape') {
      clear();
      return;
    }
    if (e.key === ' ') {
      connect(selected < 0 ? 0 : selected);
      return;
    }
    if (selected < 0) selected = 0;
    else {
      const from = position(stars[selected]),
        dx = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0,
        dy = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      let best = Infinity,
        next = selected;
      stars.forEach((s, i) => {
        const p = position(s),
          x = p.x - from.x,
          y = p.y - from.y,
          forward = x * dx + y * dy;
        if (forward <= 0 || i === selected) return;
        const distance = Math.hypot(x, y),
          score = distance * (1 + 2 * (1 - forward / distance));
        if (score < best) {
          best = score;
          next = i;
        }
      });
      selected = next;
    }
    status.textContent = '已选中一颗星，按空格连接';
    request();
  });
  canvas.addEventListener('focus', request);
  canvas.addEventListener('blur', request);
  function clear() {
    links = [];
    sparks = [];
    selected = -1;
    status.textContent = '星图已清空，重新选一颗星吧';
    request();
  }
  $('welcomeClear').onclick = clear;
  $('welcomeMeteor').onclick = () => {
    if (meteors.length >= 3) return;
    meteors.push({ u: 0.1 + random() * 0.5, v: 0.12 + random() * 0.35, start: performance.now() });
    status.textContent = reducedMotion.matches ? '一颗亮星出现了' : '一颗流星划过天空';
    request();
  };
  document.addEventListener('visibilitychange', () => {
    last = 0;
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else request();
  });
  reducedMotion.addEventListener('change', () => {
    pan = { x: 0, y: 0 };
    target = { x: 0, y: 0 };
    sparks = [];
    last = 0;
    request();
  });
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  request();
})();
