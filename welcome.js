/**
 * 欢迎页的全屏自由星空。仅是互动玩具，不读取或修改实验参数。
 * 星星用空间分桶寻找碰撞邻居；光晕使用预绘制贴图，避免逐帧生成渐变。
 */
(() => {
  const canvas = $('welcomeSky'),
    ctx = canvas.getContext('2d'),
    status = $('welcomeStarStatus');
  const stars = [],
    edges = new Map(),
    sparks = [],
    meteors = [];
  const collisionCell = 24,
    pointerRadius = 95,
    coarsePointer = matchMedia('(pointer:coarse)');
  let width = 0,
    height = 0,
    raf = 0,
    last = 0,
    paintTime = 0,
    clock = 0,
    pointerMovedAt = 0,
    nextMeteor = 0;
  let selected = -1,
    pointer = null,
    gesture = null,
    seed = 431;

  // One authored opening: letter-shaped constellations become the live star field.
  // Coordinates are vector geometry; no font fetch or Canvas text is involved.
  const letterPaths = [
    [[0,100],[30,0],[60,100]], [[12,62],[48,62]], // A
    [[123,0],[123,100],[105,100],[91,88],[86,69],[91,50],[105,40],[123,44]], // d
    [[234,48],[220,40],[204,44],[195,59],[195,80],[204,96],[220,100],[234,91],[234,40],[234,100]], // a
    [[294,45],[280,40],[263,43],[254,54],[263,65],[283,74],[294,85],[286,97],[268,100],[254,94]], // s
    [[328,13],[328,87],[334,98],[347,97]], [[311,42],[347,42]], // t
    [[369,100],[369,40],[369,58],[380,44],[393,40],[402,45]], // r
    [[460,48],[446,40],[430,44],[421,59],[421,80],[430,96],[446,100],[460,91],[460,40],[460,100]], // a
  ];
  const openingNodes = [], openingLines = [];
  // Share coincident endpoints so the constellation has real junctions.
  const junctions = new Map();
  function openingNode(x, y) {
    const key = `${x.toFixed(2)},${y.toFixed(2)}`;
    if (!junctions.has(key)) {
      junctions.set(key, openingNodes.length);
      openingNodes.push({ x, y });
    }
    return junctions.get(key);
  }
  for (const path of letterPaths) {
    let previous = openingNode(...path[0]);
    for (let i = 1; i < path.length; i++) {
      const a = path[i-1], b = path[i];
      const steps = Math.ceil(Math.hypot(b[0]-a[0], b[1]-a[1]) / 22);
      for (let j = 1; j <= steps; j++) {
        const next = openingNode(a[0]+(b[0]-a[0])*j/steps, a[1]+(b[1]-a[1])*j/steps);
        openingLines.push([previous, next]);
        previous = next;
      }
    }
  }
  let opening = document.documentElement.classList.contains('welcome-opening'),
    openingReady = !document.documentElement.hasAttribute('data-language-pending'),
    openingTime = 0, openingSpread = 0;
  const openingContent = [...document.querySelectorAll('.welcome-brand,.welcome-layout,.welcome-quote')];
  if (opening) {
    openingContent.forEach(node => { node.inert = true; node.dataset.openingInert = ''; });
    Promise.resolve(window.skyFirstFontsReady).catch(() => {}).then(() => {
      openingReady = true;
      last = 0;
      request();
    });
  }
  function finishOpening() {
    if (!opening) return;
    opening = false;
    clearTimeout(window.skyOpeningSafety);
    document.documentElement.classList.remove('welcome-opening');
    document.documentElement.style.removeProperty('--opening-reveal');
    openingContent.forEach(node => { node.inert = false; delete node.dataset.openingInert; });
    try { sessionStorage.setItem('skymotion-ad-astra', '1'); } catch {}
    nextMeteor = 0;
    last = 0;
    request();
  }
  // Keyboard/touch users may proceed immediately; no invisible controls receive focus.
  document.addEventListener('keydown', () => { if (opening) finishOpening(); }, { capture: true });
  window.addEventListener('pagehide', finishOpening);

  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function makeGlow(color) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 48;
    const paint = sprite.getContext('2d'),
      gradient = paint.createRadialGradient(24, 24, 0, 24, 24, 24);
    gradient.addColorStop(0, color + '85');
    gradient.addColorStop(0.2, color + '25');
    gradient.addColorStop(1, color + '00');
    paint.fillStyle = gradient;
    paint.fillRect(0, 0, 48, 48);
    return sprite;
  }
  // A restrained deep-field palette: mostly ivory/white, with cool blue and warm amber/red.
  const palette = ['#eee9df', '#f2efea', '#d5e2ee', '#e9cc9b', '#bf8a72'];
  const glows = palette.map(makeGlow),
    goldGlow = makeGlow('#e9cc9b');
  const dust = Array.from({ length: 480 }, () => ({
    u: random(),
    v: random(),
    alpha: 0.12 + random() * 0.26,
  }));
  function point(star) {
    const target = { x: star.u * width, y: star.v * height };
    if (!opening || star.openingIndex === undefined) return target;
    const node = openingNodes[star.openingIndex];
    const scale = Math.min(width * 0.80 / 460, height * 0.26 / 100, 1.65);
    const x = (width - 460 * scale) / 2 + node.x * scale;
    const y = height * 0.46 - 50 * scale + node.y * scale;
    return { x: x + (target.x-x) * openingSpread, y: y + (target.y-y) * openingSpread };

  }
  function request() {
    if (width > 0 && height > 0 && !document.hidden && !raf) raf = requestAnimationFrame(frame);
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Number.isFinite(rect.width) ? Math.max(0, rect.width) : 0;
    height = Number.isFinite(rect.height) ? Math.max(0, rect.height) : 0;
    if (!width || !height) {
      pointer = gesture = null;
      last = 0;
      return;
    }
    // Density follows the viewport. Existing stars and their connections survive resizing.
    const count = Math.min(520, Math.max(160, Math.round((width * height) / 2800) + 80));
    while (stars.length < count) {
      const vx = (random() - 0.5) * 12,
        vy = (random() - 0.5) * 12;
      stars.push({
        openingIndex: stars.length < openingNodes.length ? stars.length : undefined,
        u: random(),
        v: random(),
        r: 0.9 + random() * 1.7,
        phase: random() * Math.PI * 2,
        vx,
        vy,
        driftX: vx,
        driftY: vy,
        flash: 0,
        sparkAt: 0,
        tint:
          Math.floor(random() * 10) < 6 ? Math.floor(random() * 2) : 2 + Math.floor(random() * 3),
      });
    }
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    last = paintTime = 0;
    request();
  }
  function pulse(x, y, color = '#c6e0ff') {
    if (!reducedMotion.matches && sparks.length < 28)
      sparks.push({ x, y, color, born: performance.now() });
    request();
  }
  function advance(dt, now) {
    const relax = 1 - Math.exp(-dt * 1.4),
      buckets = new Map();
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i],
        p = point(star);
      if (pointer && (!gesture || gesture.moved) && now - pointerMovedAt < 180) {
        const dx = p.x - pointer.x,
          dy = p.y - pointer.y,
          distance = Math.hypot(dx, dy);
        if (distance > 0.1 && distance < pointerRadius) {
          const push =
            (1 - distance / pointerRadius) *
            230 *
            dt *
            Math.max(0, 1 - (now - pointerMovedAt) / 180);
          star.vx += (dx / distance) * push;
          star.vy += (dy / distance) * push;
        }
      }
      star.vx += (star.driftX - star.vx) * relax;
      star.vy += (star.driftY - star.vy) * relax;
      const speed = Math.hypot(star.vx, star.vy);
      if (speed > 95) {
        star.vx *= 95 / speed;
        star.vy *= 95 / speed;
      }
      star.u += (star.vx * dt) / width;
      star.v += (star.vy * dt) / height;
      const mx = 4 / width,
        my = 4 / height;
      if (star.u < mx || star.u > 1 - mx) {
        star.u = Math.max(mx, Math.min(1 - mx, star.u));
        star.vx *= -1;
        star.driftX *= -1;
      }
      if (star.v < my || star.v > 1 - my) {
        star.v = Math.max(my, Math.min(1 - my, star.v));
        star.vy *= -1;
        star.driftY *= -1;
      }
      star.flash = Math.max(0, star.flash - dt * 2);
      const pos = point(star),
        cx = Math.floor(pos.x / collisionCell),
        cy = Math.floor(pos.y / collisionCell);
      for (let ox = -1; ox <= 1; ox++)
        for (let oy = -1; oy <= 1; oy++) {
          for (const j of buckets.get(`${cx + ox},${cy + oy}`) || []) collide(star, stars[j], now);
        }
      const key = `${cx},${cy}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(i);
    }
  }
  function collide(a, b, now) {
    const dx = (a.u - b.u) * width,
      dy = (a.v - b.v) * height;
    const distance = Math.hypot(dx, dy),
      contact = a.r + b.r + 5;
    if (distance >= contact) return;
    const nx = distance > 0.01 ? dx / distance : 1,
      ny = distance > 0.01 ? dy / distance : 0;
    const correction = (contact - distance) * 0.5;
    a.u += (nx * correction) / width;
    a.v += (ny * correction) / height;
    b.u -= (nx * correction) / width;
    b.v -= (ny * correction) / height;
    const approach = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if (approach >= 0) return;
    const impulse = -approach * 0.88;
    a.vx += impulse * nx;
    a.vy += impulse * ny;
    b.vx -= impulse * nx;
    b.vy -= impulse * ny;
    a.flash = b.flash = 1;
    if (approach < -12 && now - a.sparkAt > 350) {
      a.sparkAt = b.sparkAt = now;
      const p = point(a);
      pulse(p.x, p.y);
    }
  }
  function frame(now) {
    raf = 0;
    if (!width || !height || document.hidden) {
      last = 0;
      return;
    }
    // Keep touch-screen scenes near 60 frames/s even on high-refresh displays.
    const interval = coarsePointer.matches ? 16 : 15;
    if (!reducedMotion.matches && now - paintTime < interval) {
      request();
      return;
    }
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = paintTime = now;
    if (opening && (reducedMotion.matches || !document.documentElement.classList.contains('welcome-opening'))) finishOpening();
    if (opening && openingReady) {
      openingTime += dt;
      const travel = Math.max(0, Math.min(1, (openingTime - 1.35) / 2.7));
      openingSpread = travel * travel * (3 - 2 * travel);
      const reveal = Math.max(0, Math.min(1, (openingTime - 2.7) / 1.35));
      document.documentElement.style.setProperty('--opening-reveal', reveal * reveal * (3-2*reveal));
      if (openingTime >= 4.05) finishOpening();
    }
    if (!reducedMotion.matches) {
      clock += dt;
      if (!opening) advance(dt, now);
    }
    if (!reducedMotion.matches && !opening) {
      if (!nextMeteor) nextMeteor = now + 1500;
      if (now >= nextMeteor) {
        if (meteors.length < 6) spawnMeteors(now, 1 + Math.round(random()));
        nextMeteor = now + 2400 + random() * 2600;
      }
    }
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#c6ddff';
    for (const mote of dust) {
      ctx.globalAlpha = mote.alpha * (opening ? openingSpread : 1);
      ctx.fillRect(mote.u * width, mote.v * height, 1, 1);
    }
    if (opening) {
      ctx.globalAlpha = 0.55 * (1-openingSpread) ** 2;
      ctx.strokeStyle = '#c8b99f';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      for (const [a,b] of openingLines) {
        const p = point(stars[a]), q = point(stars[b]);
        ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
      }
      ctx.stroke();
    }
    const connected = new Set();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#f6d38f88';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const [a, b] of edges.values()) {
      const p = point(stars[a]),
        q = point(stars[b]);
      connected.add(a);
      connected.add(b);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i],
        p = point(star),
        lit = connected.has(i) || selected === i || (!gesture?.moved && gesture?.hit.star === i);
      const near = pointer
        ? Math.max(0, 1 - Math.hypot(p.x - pointer.x, p.y - pointer.y) / pointerRadius)
        : 0;
      const letterStar = opening && star.openingIndex !== undefined;
      ctx.globalAlpha = letterStar ? 0.88 + 0.12 * Math.sin(clock + star.phase) :
        (lit ? 1 : 0.5 + 0.25 * Math.sin(clock * 0.7 + star.phase)) * (opening ? openingSpread : 1);
      if (star.r > 1.8 || lit || near > 0.4 || star.flash) {
        const size = 16 + near * 12 + star.flash * 14;
        ctx.drawImage(
          lit || letterStar ? goldGlow : glows[star.tint],
          p.x - size / 2,
          p.y - size / 2,
          size,
          size,
        );
      }
      ctx.fillStyle = letterStar ? '#eee9df' : lit ? '#ecd3a2' : palette[star.tint];
      ctx.beginPath();
      ctx.arc(p.x, p.y, star.r + near * 0.4, 0, Math.PI * 2);
      ctx.fill();
      if (selected === i || (keyboardStar === i && document.activeElement === canvas)) {
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ffdf9c';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i],
        age = (now - spark.born) / 650;
      if (age >= 1) {
        sparks.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = (1 - age) * 0.6;
      ctx.strokeStyle = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, 5 + age * 26, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const meteor = meteors[i],
        age = (now - meteor.born) / meteor.life;
      if (age < 0) continue;
      if (age >= 1) {
        meteors.splice(i, 1);
        continue;
      }
      const travel = reducedMotion.matches ? 0 : age * Math.min(width, height) * meteor.speed;
      const x = meteor.u * width + Math.cos(meteor.angle) * travel;
      const y = meteor.v * height + Math.sin(meteor.angle) * travel;
      ctx.globalAlpha = Math.sin(Math.PI * age) * meteor.brightness;
      if (reducedMotion.matches) {
        ctx.fillStyle = meteor.color;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const tail = meteor.tail * Math.min(1, age * 6);
        const tx = x - Math.cos(meteor.angle) * tail,
          ty = y - Math.sin(meteor.angle) * tail;
        const trail = ctx.createLinearGradient(tx, ty, x, y);
        trail.addColorStop(0, meteor.color + '00');
        trail.addColorStop(0.7, meteor.color + '65');
        trail.addColorStop(1, meteor.color);
        ctx.strokeStyle = trail;
        ctx.lineWidth = meteor.weight;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = meteor.color;
        ctx.beginPath();
        ctx.arc(x, y, meteor.weight, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(goldGlow, x - 8, y - 8, 16, 16);
      }
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    if (!reducedMotion.matches || sparks.length || meteors.length) request();
    else last = 0;
  }
  function edgeKey(a, b) {
    return `${Math.min(a, b)}:${Math.max(a, b)}`;
  }
  function interact(i) {
    const p = point(stars[i]);
    if (selected < 0) {
      selected = i;
      status.textContent = '这颗星亮了，再点另一颗连线';
    } else if (selected === i) {
      selected = -1;
      status.textContent = '已取消选星，可以从另一颗开始';
    } else {
      const key = edgeKey(selected, i);
      if (edges.has(key)) {
        edges.delete(key);
        status.textContent = `连线已拆开 · 还剩 ${edges.size} 条`;
      } else {
        edges.set(key, [selected, i]);
        status.textContent = `已连成 ${edges.size} 条线 · 再连同一对可拆开`;
      }
      selected = i;
    }
    syncConnectButton();
    pulse(p.x, p.y, '#ffdf9c');
    request();
  }
  function segmentDistance(p, a, b) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      square = dx * dx + dy * dy;
    const t = square ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / square)) : 0;
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }
  function hitTarget(p) {
    let nearest = -1,
      distance = coarsePointer.matches ? 44 : 32;
    stars.forEach((star, i) => {
      const q = point(star),
        d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < distance) {
        nearest = i;
        distance = d;
      }
    });
    if (nearest >= 0 && distance < 12) return { star: nearest };
    let edge = null,
      best = 9;
    for (const [key, [a, b]] of edges) {
      const d = segmentDistance(p, point(stars[a]), point(stars[b]));
      if (d < best) {
        best = d;
        edge = key;
      }
    }
    return edge ? { edge } : nearest >= 0 ? { star: nearest } : {};
  }
  function clickAt(p, hit = hitTarget(p)) {
    if (hit.star !== undefined) {
      interact(hit.star);
      return;
    }
    if (hit.edge && edges.has(hit.edge)) {
      edges.delete(hit.edge);
      status.textContent = `连线已拆开 · 还剩 ${edges.size} 条`;
    } else {
      selected = -1;
      status.textContent = '点亮附近的星星，开始一幅新星图';
    }
    syncConnectButton();
    pulse(p.x, p.y);
    request();
  }
  function pointerPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (opening) { finishOpening(); return; }
    if (!width || !height || !event.isPrimary || event.button !== 0) return;
    pointer = pointerPoint(event);
    gesture = {
      ...pointer,
      id: event.pointerId,
      moved: false,
      hit: hitTarget(pointer),
      tolerance: event.pointerType === 'mouse' ? 8 : 14,
    };
    canvas.setPointerCapture(event.pointerId);
    request();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!width || !height || !event.isPrimary) return;
    const next = pointerPoint(event);
    if (!pointer || Math.hypot(next.x - pointer.x, next.y - pointer.y) > 0.5)
      pointerMovedAt = performance.now();
    pointer = next;
    if (gesture && Math.hypot(pointer.x - gesture.x, pointer.y - gesture.y) > gesture.tolerance)
      gesture.moved = true;
    request();
  });
  canvas.addEventListener('pointerup', (event) => {
    if (gesture?.id === event.pointerId) {
      if (!gesture.moved) clickAt(pointerPoint(event), gesture.hit);
      gesture = null;
    }
    if (event.pointerType !== 'mouse') pointer = null;
  });
  for (const type of ['pointercancel', 'pointerleave'])
    canvas.addEventListener(type, () => {
      pointer = gesture = null;
      request();
    });
  canvas.addEventListener('keydown', (event) => {
    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'Escape'].includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    if (event.key === 'Escape') {
      clear();
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      const next = selected < 0 ? 0 : selected;
      // Direction keys move keyboard focus without losing the previous connection endpoint.
      interact(keyboardStar < 0 ? next : keyboardStar);
      return;
    }
    const origin = keyboardStar < 0 ? 0 : keyboardStar,
      from = point(stars[origin]);
    const dx = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const dy = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    let best = Infinity,
      next = origin;
    stars.forEach((star, i) => {
      const p = point(star),
        x = p.x - from.x,
        y = p.y - from.y,
        forward = x * dx + y * dy;
      if (i === origin || forward <= 0) return;
      const d = Math.hypot(x, y),
        score = d * (1 + 2 * (1 - forward / d));
      if (score < best) {
        best = score;
        next = i;
      }
    });
    keyboardStar = next;
    status.textContent = '已选中一颗星，按空格操作';
    request();
  });
  let keyboardStar = -1;
  canvas.addEventListener('focus', request);
  canvas.addEventListener('blur', () => {
    keyboardStar = -1;
    request();
  });
  function clear() {
    edges.clear();
    sparks.length = 0;
    selected = keyboardStar = -1;
    status.textContent = '连线已清空，星空还在，重新开始吧';
    syncConnectButton();
    request();
  }
  // One control introduces connecting, then becomes clear once the graph has edges.
  function syncConnectButton() {
    const button = $('welcomeConnect');
    button.textContent = edges.size ? '清空连线' : '星空连线';
    button.setAttribute(
      'aria-label',
      edges.size ? `清空全部 ${edges.size} 条连线` : '连线：点两颗星连接',
    );
  }
  $('welcomeConnect').onclick = () => {
    if (edges.size) clear();
    else {
      selected = -1;
      status.textContent = '';
      request();
    }
  };
  function spawnMeteors(now, count) {
    for (let i = 0; i < count && meteors.length < 10; i++) {
      const leftward = random() < 0.3;
      meteors.push({
        u: leftward ? 0.65 + random() * 0.3 : 0.05 + random() * 0.6,
        v: 0.04 + random() * 0.6,
        angle: leftward ? Math.PI - (0.2 + random() * 0.8) : 0.2 + random() * 0.9,
        speed: 0.6 + random() * 0.65,
        tail: 28 + random() * 75,
        weight: 0.8 + random() * 1.3,
        color: ['#e7d6ae', '#d6e5f4', '#f2e9dc'][Math.floor(random() * 3)],
        brightness: 0.5 + random() * 0.5,
        life: 1000 + random() * 800,
        born: now + i * 180,
      });
    }
  }
  $('welcomeMeteor').onclick = () => {
    spawnMeteors(performance.now(), reducedMotion.matches ? 1 : 4);
    status.textContent = reducedMotion.matches ? '一颗亮星出现在星空中' : '几颗流星正划过星空';
    request();
  };
  document.addEventListener('visibilitychange', () => {
    last = 0;
    nextMeteor = 0;
    pointer = gesture = null;
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else request();
  });
  reducedMotion.addEventListener('change', () => {
    sparks.length = 0;
    pointer = null;
    last = 0;
    request();
  });
  new ResizeObserver(resize).observe(canvas);
  resize();
  request();
})();
