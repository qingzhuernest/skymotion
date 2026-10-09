/** Independent space renderer. Physical vectors, display scaling and camera state are separate. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const Model = SolarSpaceModel;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    stage.insertAdjacentHTML(
      'beforeend',
      '<div class="error"><strong>这个浏览器无法启动三维画面</strong><p>这个模型需要 WebGL 2。</p><a href="../lab.html">返回太阳与月球实验台</a></div>',
    );
    for (const element of document.querySelectorAll(
      '.visual button,.timeline button,.timeline input,.side button,.side input,.side select',
    ))
      element.disabled = true;
    window.spaceState = () => ({ fallback: true });
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '太阳系三维模型；方向键旋转，加减键缩放');
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, 0.05, 800);
  const ambient = new THREE.AmbientLight(0x9ebce8, 0.48);
  const solarLight = new THREE.PointLight(0xfff0de, 2.1, 0, 0);
  const earthLight = new THREE.DirectionalLight(0xfff0de, 2.1);
  earthLight.visible = false;
  scene.add(ambient, solarLight, earthLight, earthLight.target);

  // Read only the laboratory's saved date; this module never writes its scientific state.
  let initial = new Date();
  try {
    const saved = JSON.parse(sessionStorage.getItem('skyLabSession') || 'null');
    const date = saved?.[saved.body || 'sun']?.date;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))
      initial = new Date(date + 'T12:00:00Z');
  } catch {}
  if (
    !Number.isFinite(initial.getTime()) ||
    initial.getUTCFullYear() < 1900 ||
    initial.getUTCFullYear() > 2100
  )
    initial = new Date(Date.UTC(2026, 9, 9));
  let year = initial.getUTCFullYear();
  let day =
    (Date.UTC(year, initial.getUTCMonth(), initial.getUTCDate(), 12) - Date.UTC(year, 0, 1, 12)) /
    Model.DAY_MS;
  $('day').max = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / Model.DAY_MS - 1;
  let playing = false;
  let selected = 2;
  let view = 'overview';
  let azimuth = -0.22;
  let elevation = 0.85;
  let distance = 90;
  let targetDistance = 90;
  let handle = null;
  let previous = 0;
  let frames = 0;
  let physical = null;
  let lastScienceDay = null;
  let labelBounds = [];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target = new THREE.Vector3();
  const smoothTarget = new THREE.Vector3();
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);
  const loader = new THREE.TextureLoader();

  function invalidate() {
    if (handle === null && !document.hidden) handle = requestAnimationFrame(frame);
  }
  function utcDate() {
    return new Date(Date.UTC(year, 0, 1, 12) + day * Model.DAY_MS);
  }
  function line(points, color, opacity) {
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p.x, p.y, p.z))),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
  }
  function bands(base) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 64; i++) {
      const tone = Math.sin(i * 1.7) * 20;
      ctx.fillStyle = `rgba(${tone > 0 ? '255,235,207' : '72,43,30'},${0.1 + Math.abs(tone) / 100})`;
      ctx.fillRect(0, i * 4, 512, 3 + Math.sin(i) * 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leaders.classList.add('label-leaders');
  stage.append(leaders);
  const planets = Model.bodies.map((spec, i) => {
    const material = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.92,
    });
    if (spec.id === 'Earth') {
      material.color.set(0xffffff);
      material.map = loader.load('../earth.jpg', invalidate);
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    }
    if (spec.id === 'Jupiter' || spec.id === 'Saturn') {
      material.color.set(0xffffff);
      material.map = bands(spec.id === 'Jupiter' ? '#c2a388' : '#d5c193');
    }
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(spec.size, 48, 32), material);
    scene.add(mesh);
    const orbit = line(
      Model.orbitalPath(spec, utcDate()),
      i === 2 ? 0x77b9e9 : 0x6383a6,
      i === 2 ? 0.6 : 0.24,
    );
    orbitGroup.add(orbit);
    const label = document.createElement('button');
    label.className = 'label';
    label.textContent = spec.name;
    label.onclick = () => select(i);
    $('labels').append(label);
    return { spec, mesh, orbit, label };
  });
  const picker = document.createElement('div');
  picker.className = 'planet-picker';
  picker.setAttribute('aria-label', '选择行星');
  for (const [index, spec] of Model.bodies.entries()) {
    const button = document.createElement('button');
    button.textContent = spec.name;
    button.dataset.planet = index;
    button.onclick = () => select(index);
    picker.append(button);
  }
  document
    .querySelector('.side .card')
    .insertBefore(picker, document.querySelector('.side .card .kicker'));
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.08, 1.85, 128),
    new THREE.MeshStandardMaterial({
      color: 0xbfac89,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      roughness: 1,
    }),
  );
  ring.rotation.x = -Math.PI / 2 + 0.47;
  planets[5].mesh.add(ring);
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd489 }),
  );
  scene.add(sun);
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 256;
  const glowContext = glowCanvas.getContext('2d');
  const gradient = glowContext.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,204,112,.75)');
  gradient.addColorStop(0.2, 'rgba(255,181,69,.28)');
  gradient.addColorStop(0.52, 'rgba(255,146,47,.055)');
  gradient.addColorStop(1, 'rgba(255,136,33,0)');
  glowContext.fillStyle = gradient;
  glowContext.fillRect(0, 0, 256, 256);
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  sunGlow.scale.set(9, 9, 1);
  scene.add(sunGlow);
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0xc0bcb4, roughness: 1 }),
  );
  const lunarOrbit = line([], 0xa4bddb, 0.4);
  const solarArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    2,
    0xffcf80,
    0.25,
    0.12,
  );
  const solarRays = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffcf80, transparent: true, opacity: 0.22 }),
  );
  scene.add(moon, lunarOrbit, solarArrow, solarRays);
  const moonLabel = document.createElement('button');
  moonLabel.className = 'label';
  moonLabel.textContent = '月球';
  moonLabel.onclick = () => select(2);
  $('labels').append(moonLabel);

  let seed = 314159;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const starPositions = [];
  for (let i = 0; i < 650; i++) {
    const longitude = random() * 2 * Math.PI;
    const colatitude = Math.acos(2 * random() - 1);
    const radius = 200 + random() * 50;
    starPositions.push(
      radius * Math.sin(colatitude) * Math.cos(longitude),
      radius * Math.cos(colatitude),
      radius * Math.sin(colatitude) * Math.sin(longitude),
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  scene.add(
    new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0xafbed5,
        size: 1.1,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.5,
      }),
    ),
  );

  function select(index) {
    selected = index;
    const spec = Model.bodies[index];
    $('name').textContent = spec.name;
    $('type').textContent = spec.type;
    $('distance').textContent = spec.au.toFixed(spec.au < 10 ? 2 : 1) + ' AU';
    $('period').textContent =
      spec.period < 1000
        ? spec.period.toFixed(2) + ' 天'
        : (spec.period / 365.26).toFixed(2) + ' 年';
    $('radius').textContent = spec.radius.toLocaleString('en-US') + ' km';
    $('focus').textContent = '靠近' + spec.name + '观察';
    $('info').textContent =
      index === 2
        ? '进入日地月关系可观察月球真实方向和星历照明比例。地月距离已放大；不据此判断食的发生。'
        : '轨道由星历采样；日心距离压缩，球体单独放大。可比较方向和运动，不直接按屏幕长度比较真实距离。';
    for (const button of picker.querySelectorAll('button')) {
      const active = Number(button.dataset.planet) === index;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    for (const [i, planet] of planets.entries()) {
      planet.label.classList.toggle('selected', i === index);
      planet.label.setAttribute('aria-pressed', String(i === index));
    }
    if (view !== 'overview') focus(index);
    invalidate();
  }
  function focus(index) {
    selected = index;
    view = index === 2 ? 'earthmoon' : 'focus';
    targetDistance =
      index === 2 ? earthMoonDistance() : Math.max(2.8, Model.bodies[index].size * 6.5);
    $('viewTitle').textContent =
      index === 2 ? '日地月关系 · 箭头指向太阳' : Model.bodies[index].name + '特写 · 旋转视角';
    $('overview').classList.remove('active');
    $('earthmoon').classList.toggle('active', index === 2);
    invalidate();
  }
  $('focus').onclick = () => focus(selected);
  $('earthmoon').onclick = () => {
    select(2);
    focus(2);
  };
  $('overview').onclick = () => {
    view = 'overview';
    targetDistance = overviewDistance();
    $('overview').classList.add('active');
    $('earthmoon').classList.remove('active');
    $('viewTitle').textContent = '太阳系总览 · 点击行星查看';
    invalidate();
  };
  $('reset').onclick = () => {
    azimuth = -0.22;
    elevation = 0.85;
    targetDistance =
      view === 'overview'
        ? overviewDistance()
        : view === 'earthmoon'
          ? earthMoonDistance()
          : Math.max(2.8, Model.bodies[selected].size * 6.5);
    invalidate();
  };
  $('play').onclick = () => {
    playing = !playing;
    $('play').textContent = playing ? '⏸ 暂停' : '▶ 播放日期';
    previous = 0;
    invalidate();
  };
  function pause() {
    playing = false;
    $('play').textContent = '▶ 播放日期';
  }
  $('day').oninput = (event) => {
    day = +event.target.value;
    pause();
    invalidate();
  };
  $('date').oninput = () => {
    const value = $('date').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    const date = new Date(value + 'T12:00:00Z');
    if (
      !Number.isFinite(date.getTime()) ||
      date.getUTCFullYear() < 1900 ||
      date.getUTCFullYear() > 2100
    )
      return;
    year = date.getUTCFullYear();
    day = (date.getTime() - Date.UTC(year, 0, 1, 12)) / Model.DAY_MS;
    $('day').max = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / Model.DAY_MS - 1;
    pause();
    invalidate();
  };
  $('orbits').onchange = invalidate;
  $('names').onchange = invalidate;
  $('parallelRays').onchange = invalidate;

  const pointers = new Map();
  let start = null;
  let moved = false;
  let lastPinch = 0;
  const surface = renderer.domElement;
  surface.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      start = { x: event.clientX, y: event.clientY };
      moved = false;
    }
    if (pointers.size > 1) moved = true;
    surface.setPointerCapture(event.pointerId);
  });
  surface.addEventListener('pointermove', (event) => {
    const before = pointers.get(event.pointerId);
    if (!before) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) moved = true;
    if (pointers.size === 1) {
      azimuth -= (event.clientX - before.x) * 0.006;
      elevation = Math.max(-1.4, Math.min(1.4, elevation + (event.clientY - before.y) * 0.005));
    } else {
      const [a, b] = [...pointers.values()];
      const separation = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinch && separation) targetDistance *= lastPinch / separation;
      targetDistance = Math.max(view === 'overview' ? 45 : 1.6, Math.min(300, targetDistance));
      lastPinch = separation;
    }
    invalidate();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    surface.addEventListener(type, (event) => {
      pointers.delete(event.pointerId);
      lastPinch = 0;
    });
  surface.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      targetDistance = Math.max(
        view === 'overview' ? 45 : 1.6,
        Math.min(300, targetDistance * Math.exp(event.deltaY * 0.001)),
      );
      invalidate();
    },
    { passive: false },
  );
  surface.addEventListener('keydown', (event) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', '='].includes(event.key))
      return;
    event.preventDefault();
    if (event.key === 'ArrowUp') elevation = Math.min(1.4, elevation + 0.08);
    if (event.key === 'ArrowDown') elevation = Math.max(-1.4, elevation - 0.08);
    if (event.key === 'ArrowLeft') azimuth -= 0.08;
    if (event.key === 'ArrowRight') azimuth += 0.08;
    if (event.key === '+' || event.key === '=') targetDistance *= 0.9;
    if (event.key === '-') targetDistance *= 1.1;
    targetDistance = Math.max(view === 'overview' ? 45 : 1.6, Math.min(300, targetDistance));
    invalidate();
  });
  surface.addEventListener('click', (event) => {
    if (moved) return;
    const bounds = stage.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(
      planets.filter((p) => p.mesh.visible).map((p) => p.mesh),
      false,
    )[0];
    if (hit) select(planets.findIndex((p) => p.mesh === hit.object));
  });

  function updateScience() {
    physical = Model.snapshot(utcDate());
    lastScienceDay = year + ':' + day;
    // The enlarged Moon is shown only in the local Earth view with parallel solar light.
    moon.position.set(
      physical.moon.x * (2.4 / 0.002569555),
      physical.moon.y * (2.4 / 0.002569555),
      physical.moon.z * (2.4 / 0.002569555),
    );
    earthLight.position.set(
      physical.earthToSun.x * 10,
      physical.earthToSun.y * 10,
      physical.earthToSun.z * 10,
    );
    solarArrow.setDirection(
      new THREE.Vector3(physical.earthToSun.x, physical.earthToSun.y, physical.earthToSun.z),
    );
    const towardSun = new THREE.Vector3(
      physical.earthToSun.x,
      physical.earthToSun.y,
      physical.earthToSun.z,
    );
    const across = new THREE.Vector3()
      .crossVectors(towardSun, new THREE.Vector3(0, 1, 0))
      .normalize();
    const rays = [];
    for (let offset = -3; offset <= 3; offset++) {
      const center = across.clone().multiplyScalar(offset);
      rays.push(
        center.clone().addScaledVector(towardSun, 5),
        center.clone().addScaledVector(towardSun, -5),
      );
    }
    solarRays.geometry.setFromPoints(rays);
    $('moonReadout').textContent =
      '地心月面照明比例：' +
      (physical.moonIllumination * 100).toFixed(1) +
      '%。箭头仅表示太阳方向，不表示太阳距离。';
  }
  function lunarPath() {
    const date = utcDate();
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const vector = Model.sceneVector(
        Astronomy.GeoMoon(new Date(date.getTime() + (i / 128) * 27.32 * Model.DAY_MS)),
      );
      points.push(
        new THREE.Vector3(
          vector.x * (2.4 / 0.002569555),
          vector.y * (2.4 / 0.002569555),
          vector.z * (2.4 / 0.002569555),
        ),
      );
    }
    lunarOrbit.geometry.dispose();
    lunarOrbit.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }
  let previousView = '';
  let orbitEpoch = year;
  let lunarOrbitStamp = null;
  function updateObjects() {
    if (lastScienceDay !== year + ':' + day) updateScience();
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const v = physical.planets[i].display;
      p.mesh.position.set(v.x, v.y, v.z);
      p.mesh.scale.setScalar(view === 'overview' ? 1.5 : view === 'earthmoon' ? 1.3 : 1);
      p.mesh.visible =
        view === 'overview' ||
        (view === 'focus' && i === selected) ||
        (view === 'earthmoon' && i === 2);
      p.orbit.visible = view === 'overview';
    }
    if (view === 'earthmoon') planets[2].mesh.position.set(0, 0, 0);
    sun.visible = sunGlow.visible = view === 'overview';
    moon.visible = solarArrow.visible = earthLight.visible = view === 'earthmoon';
    solarLight.visible = view !== 'earthmoon';
    solarRays.visible = view === 'earthmoon' && $('parallelRays').checked;
    $('parallelRays').closest('label').hidden = view !== 'earthmoon';
    orbitGroup.visible = $('orbits').checked && view === 'overview';
    lunarOrbit.visible = $('orbits').checked && view === 'earthmoon';
    $('moonReadout').hidden = view !== 'earthmoon';
    const stamp = playing
      ? year + ':' + Math.floor(day / 30)
      : utcDate().toISOString().slice(0, 10);
    if (view === 'earthmoon' && (view !== previousView || lunarOrbitStamp !== stamp)) {
      lunarPath();
      lunarOrbitStamp = stamp;
    }
    if (year !== orbitEpoch) {
      for (const p of planets) {
        p.orbit.geometry.dispose();
        p.orbit.geometry = new THREE.BufferGeometry().setFromPoints(
          Model.orbitalPath(p.spec, utcDate()).map((v) => new THREE.Vector3(v.x, v.y, v.z)),
        );
      }
      orbitEpoch = year;
    }
    previousView = view;
    if (view === 'overview' || view === 'earthmoon') target.set(0, 0, 0);
    else target.copy(planets[selected].mesh.position);
  }
  function placeLabel(label, position) {
    const projected = position.clone().project(camera);
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (
      !$('names').checked ||
      projected.z > 1 ||
      projected.z < -1 ||
      Math.abs(projected.x) > 1 ||
      Math.abs(projected.y) > 1
    ) {
      label.hidden = true;
      return;
    }
    let x = ((projected.x + 1) / 2) * width;
    let y = ((-projected.y + 1) / 2) * height + 13;
    const anchorX = x,
      anchorY = y - 13;
    x = Math.max(26, Math.min(width - 26, x));
    for (let attempt = 0; attempt < 5; attempt++) {
      if (!labelBounds.some((b) => Math.abs(b.x - x) < 56 && Math.abs(b.y - y) < 25)) break;
      y += 25;
    }
    if (y > height - 30 || y < 50) {
      label.hidden = true;
      return;
    }
    label.hidden = false;
    label.style.left = x + 'px';
    label.style.top = y + 'px';
    labelBounds.push({ x, y });
    const leader = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    for (const [key, v] of Object.entries({
      x1: anchorX,
      y1: anchorY,
      x2: x,
      y2: y,
    }))
      leader.setAttribute(key, v);
    leaders.append(leader);
  }
  function overviewDistance() {
    return Math.min(250, 90 / Math.min(1, camera.aspect));
  }
  function earthMoonDistance() {
    return 9 / Math.min(1, camera.aspect);
  }
  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const previousFit = overviewDistance();
    const previousMoonFit = earthMoonDistance();
    camera.aspect = width / height;
    if (view === 'overview') targetDistance *= overviewDistance() / previousFit;
    if (view === 'earthmoon') targetDistance *= earthMoonDistance() / previousMoonFit;
    camera.updateProjectionMatrix();
    invalidate();
  }
  new ResizeObserver(resize).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && handle !== null) {
      cancelAnimationFrame(handle);
      handle = null;
    }
    previous = 0;
    if (!document.hidden) invalidate();
  });
  surface.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    pause();
    $('viewTitle').textContent = '图形上下文暂停 · 等待恢复';
  });
  surface.addEventListener('webglcontextrestored', () => {
    $('viewTitle').textContent = '三维画面已恢复';
    invalidate();
  });
  function frame(now) {
    handle = null;
    if (document.hidden || !stage.clientWidth || !stage.clientHeight) return;
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 1 / 60;
    previous = now;
    if (playing) {
      day += dt * Number($('spaceSpeed').value);
      if (day > Number($('day').max)) {
        if ($('spaceLoop').checked) day = 0;
        else {
          day = Number($('day').max);
          pause();
        }
      }
    }
    updateObjects();
    const amount = reducedMotion ? 1 : 1 - Math.exp(-dt * 9);
    smoothTarget.lerp(target, amount);
    distance += (targetDistance - distance) * amount;
    camera.position.set(
      smoothTarget.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
      smoothTarget.y + Math.sin(elevation) * distance,
      smoothTarget.z + Math.cos(azimuth) * Math.cos(elevation) * distance,
    );
    camera.lookAt(smoothTarget);
    renderer.render(scene, camera);
    frames++;
    labelBounds = [];
    leaders.replaceChildren();
    for (const p of planets) {
      p.label.hidden = !p.mesh.visible;
      if (p.mesh.visible) placeLabel(p.label, p.mesh.position);
    }
    moonLabel.hidden = !moon.visible;
    if (moon.visible) placeLabel(moonLabel, moon.position);
    const date = utcDate();
    $('day').value = day;
    $('dayText').textContent =
      date.toISOString().slice(0, 10) + ' · ' + date.toISOString().slice(11, 16);
    if (document.activeElement !== $('date')) $('date').value = date.toISOString().slice(0, 10);
    $('overview').setAttribute('aria-pressed', String(view === 'overview'));
    $('earthmoon').setAttribute('aria-pressed', String(view === 'earthmoon'));
    if (
      playing ||
      Math.abs(distance - targetDistance) > 0.0001 ||
      smoothTarget.distanceTo(target) > 0.0001
    )
      handle = requestAnimationFrame(frame);
    else previous = 0;
  }
  select(2);
  if (new URLSearchParams(location.search).get('view') === 'earthmoon') focus(2);
  resize();
  window.spaceState = () => ({
    date: utcDate().toISOString(),
    day,
    year,
    playing,
    selected,
    view,
    azimuth,
    elevation,
    distance,
    frames,
    scheduled: handle !== null,
    renderWidth: surface.width,
    renderHeight: surface.height,
    ephemeris: physical,
    glCalls: renderer.info.render.calls,
    exposure: renderer.toneMappingExposure,
  });
})();
