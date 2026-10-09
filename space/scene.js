/** Independent space renderer. Physical vectors, display scaling and camera state are separate. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const Model = SolarSpaceModel;
  const embedded = window.spaceEmbedding?.enabled === true;
  let linkedView = 'overview';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    stage.insertAdjacentHTML(
      'beforeend',
      '<div class="error"><strong>这个浏览器无法启动三维画面</strong><p>这个模型需要 WebGL 2。</p><a href="../lab.html">返回太阳与月球实验台</a></div>',
    );
    for (const element of document.querySelectorAll(
      '.visual button,.visual input,.visual select,.timeline button,.timeline input,.side button,.side input,.side select',
    ))
      element.disabled = true;
    $('sceneTools').hidden = true;
    $('inspectionReadout').hidden = true;
    window.spaceState = () => ({ fallback: true });
    if (embedded) {
      stage.querySelector('.error').innerHTML =
        '<strong>无法启动三维画面</strong><p>这个浏览器需要支持 WebGL 2。原图解仍可使用，关闭“三维对照”即可继续。</p>';
      window.dispatchEvent(new Event('space:unavailable'));
    }
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
  let comparing = false;
  let reference = 'plane';
  const observer = { lat: 39.9, lon: 116.4 };
  try {
    const saved = JSON.parse(sessionStorage.getItem('skyLabSession') || 'null');
    const source = saved?.[saved.body === 'moon' ? 'moon' : 'sun'];
    if (Number.isFinite(source?.lat)) observer.lat = Math.max(-90, Math.min(90, source.lat));
    if (Number.isFinite(source?.lon)) observer.lon = Math.max(-180, Math.min(180, source.lon));
  } catch {}
  $('observerLat').value = observer.lat;
  $('observerLon').value = observer.lon;
  const comparison = SolarSpaceCompare.create({ host: $('planeHost'), onSelect: select });
  const observerDiagram = SolarSpaceObserver.create({ host: $('observerHost'), onSelect: select });
  function comparisonLayout() {
    $('spaceScenes').classList.toggle('is-comparing', comparing);
    $('companion').hidden = !comparing;
    $('planeHost').hidden = reference !== 'plane';
    $('observerHost').hidden = reference !== 'observer';
    $('observerSettings').hidden = !comparing || reference !== 'observer';
    for (const [id, active] of [
      ['singleView', !comparing],
      ['compareView', comparing],
      ['planeView', reference === 'plane'],
      ['observerView', reference === 'observer'],
    ]) {
      $(id).classList.toggle('active', active);
      $(id).setAttribute('aria-pressed', String(active));
    }
    resize();
    invalidate();
  }
  $('singleView').onclick = () => {
    comparing = false;
    comparisonLayout();
  };
  $('compareView').onclick = () => {
    comparing = true;
    comparisonLayout();
  };
  $('planeView').onclick = () => {
    reference = 'plane';
    comparisonLayout();
  };
  $('observerView').onclick = () => {
    reference = 'observer';
    comparisonLayout();
  };
  for (const [id, key, limit] of [
    ['observerLat', 'lat', 90],
    ['observerLon', 'lon', 180],
  ]) {
    $(id).addEventListener('change', () => {
      const value = Number($(id).value);
      if ($(id).value.trim() && Number.isFinite(value))
        observer[key] = Math.max(-limit, Math.min(limit, value));
      $(id).value = observer[key];
      invalidate();
    });
  }
  let playing = false;
  let selected = 2;
  let inspectingMoon = false;
  let cameraPreset = 'oblique';
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
  let trackedBody = '';
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);

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
  const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leaders.classList.add('label-leaders');
  stage.append(leaders);
  const planets = Model.bodies.map((spec, i) => {
    const appearance = SolarSpaceAppearance.create(spec, THREE, renderer, invalidate);
    const mesh = new THREE.Mesh(appearance.geometry, appearance.material);
    appearance.decorate?.(mesh);
    scene.add(mesh);
    const path = Model.orbitalPath(spec, utcDate());
    const orbit = line(path, i === 2 ? 0x77b9e9 : 0x6383a6, i === 2 ? 0.6 : 0.24);
    orbitGroup.add(orbit);
    const label = document.createElement('button');
    label.className = 'label';
    label.textContent = spec.name;
    label.onclick = () => {
      select(i);
      if (embedded) focus(i);
    };
    $('labels').append(label);
    return { spec, mesh, orbit, label, path };
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
  const solarAppearance = SolarSpaceAppearance.sun(THREE, renderer, 1.05);
  const sun = new THREE.Mesh(solarAppearance.geometry, solarAppearance.material);
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
  const lunarAppearance = SolarSpaceAppearance.moon(THREE, renderer, 0.12);
  const moon = new THREE.Mesh(lunarAppearance.geometry, lunarAppearance.material);
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
  moonLabel.onclick = focusMoon;
  $('labels').append(moonLabel);

  // History is separate from the forward full-orbit guide and uses the same UTC clock.
  const history = line([], 0xffffff, 0.85);
  history.material.vertexColors = true;
  history.frustumCulled = false;
  scene.add(history);
  let historyKey = '';
  let historyData = null;
  let historyCalculations = 0;
  const referencePlane = new THREE.GridHelper(80, 16, 0x68869d, 0x375269);
  referencePlane.material.transparent = true;
  referencePlane.material.opacity = 0.18;
  scene.add(referencePlane);

  for (const [index, spec] of Model.bodies.entries()) {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = spec.name;
    $('inspectBody').append(option);
  }
  const moonOption = document.createElement('option');
  moonOption.value = 'moon';
  moonOption.textContent = '月球';
  $('inspectBody').append(moonOption);
  $('inspectBody').onchange = () => {
    if ($('inspectBody').value === 'moon') focusMoon();
    else if ($('inspectBody').value !== '') {
      const index = Number($('inspectBody').value);
      if (Number.isInteger(index) && index >= 0 && index < planets.length) {
        select(index);
        focus(index);
      }
    }
    $('sceneTools').open = false;
  };
  for (const id of ['trailEnabled', 'trailDays', 'inspectInfo', 'referencePlane'])
    $(id).onchange = invalidate;
  for (const button of document.querySelectorAll('[data-camera]')) {
    button.onclick = () => {
      cameraPreset = button.dataset.camera;
      azimuth = cameraPreset === 'side' ? 0 : -0.22;
      // Stay just off the pole to preserve a stable camera up vector.
      elevation =
        cameraPreset === 'top'
          ? Math.PI / 2 - 0.001
          : cameraPreset === 'side'
            ? 0.06
            : obliqueElevation();
      targetDistance = fittedDistance();
      invalidate();
    };
  }
  document.addEventListener('pointerdown', (event) => {
    if (!$('sceneTools').contains(event.target)) $('sceneTools').open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && $('sceneTools').open) {
      $('sceneTools').open = false;
      $('sceneTools').querySelector('summary').focus();
    }
  });

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
    inspectingMoon = false;
    selected = index;
    const spec = Model.bodies[index];
    $('name').textContent = spec.name;
    $('type').textContent = spec.type;
    $('distance').previousElementSibling.textContent = '平均太阳距离';
    $('period').previousElementSibling.textContent = '公转周期';
    $('actualDistance').previousElementSibling.textContent = '当前太阳距离';
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
    inspectingMoon = false;
    selected = index;
    view = index === 2 ? 'earthmoon' : 'focus';
    targetDistance = index === 2 ? earthMoonDistance() : planetDistance(index);
    if (cameraPreset === 'oblique') elevation = obliqueElevation();
    $('viewTitle').textContent =
      index === 2 ? '日地月关系 · 箭头指向太阳' : Model.bodies[index].name + '特写 · 旋转视角';
    $('overview').classList.toggle('active', index !== 2);
    $('earthmoon').classList.toggle('active', index === 2);
    invalidate();
  }
  function focusMoon() {
    select(2);
    view = 'earthmoon';
    inspectingMoon = true;
    if (cameraPreset === 'oblique') elevation = obliqueElevation();
    targetDistance = moonDistance();
    $('overview').classList.remove('active');
    $('earthmoon').classList.add('active');
    $('viewTitle').textContent = '月球近景 · 外部相机视角';
    $('name').textContent = '月球';
    $('type').textContent = '地球的天然卫星';
    $('distance').previousElementSibling.textContent = '平均地球距离';
    $('distance').textContent = '384,400 km';
    $('period').previousElementSibling.textContent = '恒星公转周期';
    $('period').textContent = '27.32 天';
    $('radius').textContent = '1,737.4 km';
    $('actualDistance').previousElementSibling.textContent = '当前地球距离';
    $('focus').textContent = '靠近月球观察';
    $('info').textContent =
      '这是外部相机近景，亮面随视角变化；地心月面照明比例以星历读数为准。27.32天为恒星月，不等于约29.53天的月相周期。';
    for (const button of picker.children) {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    }
    invalidate();
  }
  $('focus').onclick = () => (inspectingMoon ? focusMoon() : focus(selected));
  $('earthmoon').onclick = () => {
    select(2);
    focus(2);
  };
  $('overview').onclick = () => {
    if (inspectingMoon) select(selected);
    view = 'overview';
    if (cameraPreset === 'oblique') elevation = obliqueElevation();
    targetDistance = overviewDistance();
    $('overview').classList.add('active');
    $('earthmoon').classList.remove('active');
    $('viewTitle').textContent = '太阳系总览 · 点击行星查看';
    invalidate();
  };
  $('reset').onclick = () => {
    if (embedded) {
      if (inspectingMoon) select(selected);
      if (linkedView === 'earthmoon') focus(2);
      else {
        view = 'overview';
        $('viewTitle').textContent = '太阳系总览 · 点击天体看近景';
      }
    }
    azimuth = -0.22;
    cameraPreset = 'oblique';
    elevation = obliqueElevation();
    targetDistance = fittedDistance();
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
      cameraPreset = 'custom';
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
      elevation = Math.max(
        -Math.PI / 2 + 0.001,
        Math.min(Math.PI / 2 - 0.001, elevation + (event.clientY - before.y) * 0.005),
      );
    } else {
      const [a, b] = [...pointers.values()];
      const separation = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinch && separation) targetDistance *= lastPinch / separation;
      targetDistance = Math.max(minimumDistance(), Math.min(300, targetDistance));
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
        minimumDistance(),
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
    if (event.key.startsWith('Arrow')) cameraPreset = 'custom';
    if (event.key === 'ArrowUp') elevation = Math.min(Math.PI / 2 - 0.001, elevation + 0.08);
    if (event.key === 'ArrowDown') elevation = Math.max(-Math.PI / 2 + 0.001, elevation - 0.08);
    if (event.key === 'ArrowLeft') azimuth -= 0.08;
    if (event.key === 'ArrowRight') azimuth += 0.08;
    if (event.key === '+' || event.key === '=') targetDistance *= 0.9;
    if (event.key === '-') targetDistance *= 1.1;
    targetDistance = Math.max(minimumDistance(), Math.min(300, targetDistance));
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
      [
        ...planets.filter((p) => p.mesh.visible).map((p) => p.mesh),
        ...(moon.visible ? [moon] : []),
      ],
      false,
    )[0];
    if (hit?.object === moon) focusMoon();
    else if (hit) select(planets.findIndex((p) => p.mesh === hit.object));
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
  let lunarPoints = [];
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
    lunarPoints = points;
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
      p.orbit.material.color.setHex(i === selected ? 0xd4b06e : 0x6383a6);
      p.orbit.material.opacity = i === selected ? 0.55 : 0.2;
      p.label.classList.toggle('selected', i === selected && !inspectingMoon);
      p.label.setAttribute('aria-pressed', String(i === selected && !inspectingMoon));
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
    moonLabel.classList.toggle('selected', inspectingMoon);
    moonLabel.setAttribute('aria-pressed', String(inspectingMoon));
    referencePlane.visible = $('referencePlane').checked && view !== 'focus';
    referencePlane.scale.setScalar(view === 'earthmoon' ? 0.15 : 1);
    const longMoonOption = $('trailDays').querySelector('[value="365"]');
    longMoonOption.disabled = view === 'earthmoon';
    if (view === 'earthmoon' && $('trailDays').value === '365') $('trailDays').value = '30';
    updateHistory();
    updateInspection();
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
        p.path = Model.orbitalPath(p.spec, utcDate());
        p.orbit.geometry = new THREE.BufferGeometry().setFromPoints(
          p.path.map((v) => new THREE.Vector3(v.x, v.y, v.z)),
        );
      }
      orbitEpoch = year;
    }
    previousView = view;
    if (inspectingMoon) target.copy(moon.position);
    else if (view === 'overview' || view === 'earthmoon') target.set(0, 0, 0);
    else target.copy(planets[selected].mesh.position);
  }

  function updateHistory() {
    history.visible = $('trailEnabled').checked;
    if (!history.visible) {
      $('trailNote').textContent =
        '开启后回溯当前UTC；蓝灰端较早，亮端为当前时刻。黄道参考面是固定J2000平面。';
      return;
    }
    const localMoon = view === 'earthmoon';
    const days = Number($('trailDays').value);
    const segments = localMoon
      ? Math.max(96, Math.ceil(days * 4))
      : Math.min(
          512,
          Math.max(playing ? 48 : 96, Math.ceil((days / Model.bodies[selected].period) * 96)),
        );
    const bodyId = localMoon ? 'Moon' : Model.bodies[selected].id;
    const key = [year, day, bodyId, days, segments].join(':');
    if (key === historyKey) return;
    historyData = SolarSpaceExploration.trail({
      date: utcDate(),
      bodyId,
      days,
      segments,
      frame: localMoon ? 'geocentric' : 'heliocentric',
    });
    historyData.bodyId = bodyId;
    historyCalculations++;
    historyKey = key;
    const geometry = new THREE.BufferGeometry().setFromPoints(
      historyData.points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    );
    const colors = [];
    const oldColor = new THREE.Color(0x426887);
    const nowColor = new THREE.Color(0xffd08a);
    for (let i = 0; i < historyData.points.length; i++) {
      const color = oldColor.clone().lerp(nowColor, i / segments);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    history.geometry.dispose();
    history.geometry = geometry;
    $('trailNote').textContent =
      (localMoon ? '月球地心' : Model.bodies[selected].name + '日心') +
      '轨迹：过去' +
      days +
      '天，亮端为当前UTC。距离按教学尺度显示。';
  }

  function updateInspection() {
    if (document.activeElement !== $('inspectBody'))
      $('inspectBody').value = inspectingMoon
        ? 'moon'
        : view === 'overview'
          ? ''
          : String(selected);
    const current = SolarSpaceExploration.actualDistance(
      physical,
      inspectingMoon ? 'Moon' : selected,
    );
    const formatDistance = (reading) =>
      reading.unit === 'km'
        ? Math.round(reading.value).toLocaleString('zh-CN') + ' km'
        : reading.value.toFixed(3) + ' AU';
    $('actualDistance').textContent = formatDistance(current);
    $('inspectionReadout').hidden = !$('inspectInfo').checked;
    const localMoon = view === 'earthmoon';
    const reading = localMoon ? SolarSpaceExploration.actualDistance(physical, 'Moon') : current;
    $('inspectTitle').textContent = inspectingMoon
      ? '月球'
      : localMoon
        ? '日地月'
        : Model.bodies[selected].name;
    $('inspectDistance').textContent =
      (reading.reference === 'earth' ? '月球距地球 ' : '距太阳 ') + formatDistance(reading);
    $('inspectPhase').hidden = !localMoon;
    if (localMoon)
      $('inspectPhase').textContent =
        '地心月面照明 ' + (physical.moonIllumination * 100).toFixed(1) + '%';
    for (const button of document.querySelectorAll('[data-camera]'))
      button.setAttribute('aria-pressed', String(button.dataset.camera === cameraPreset));
  }
  function placeLabel(label, position, radius = 0) {
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
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const rim = position.clone().addScaledVector(up, radius).project(camera);
    const radiusPixels = (Math.abs(rim.y - projected.y) * height) / 2;
    let y = ((-projected.y + 1) / 2) * height + radiusPixels + 10;
    const anchorX = x,
      anchorY = y - 10;
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
  function planetDistance(index) {
    return Math.max(2.8, Model.bodies[index].size * 6.5) / Math.min(1, camera.aspect);
  }
  function earthMoonDistance() {
    return 9 / Math.min(1, camera.aspect);
  }
  function moonDistance() {
    return 0.8 / Math.min(1, camera.aspect);
  }
  function obliqueElevation() {
    return view === 'overview' ? 0.85 : 0.28;
  }
  function fittedDistance() {
    return inspectingMoon
      ? moonDistance()
      : view === 'overview'
        ? overviewDistance()
        : view === 'earthmoon'
          ? earthMoonDistance()
          : planetDistance(selected);
  }
  function minimumDistance() {
    return inspectingMoon ? 0.35 : view === 'overview' ? 45 : 1.6;
  }
  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const previousFit = overviewDistance();
    const previousMoonFit = earthMoonDistance();
    const previousPlanetFit = planetDistance(selected);
    const previousMoonCloseFit = moonDistance();
    camera.aspect = width / height;
    if (view === 'overview') targetDistance *= overviewDistance() / previousFit;
    if (view === 'earthmoon')
      targetDistance *= inspectingMoon
        ? moonDistance() / previousMoonCloseFit
        : earthMoonDistance() / previousMoonFit;
    if (view === 'focus') targetDistance *= planetDistance(selected) / previousPlanetFit;
    camera.updateProjectionMatrix();
    comparison.resize();
    observerDiagram.resize();
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
    const previousTarget = target.clone();
    updateObjects();
    const nextTrackedBody = inspectingMoon
      ? 'Moon'
      : view === 'focus'
        ? Model.bodies[selected].id
        : '';
    if (nextTrackedBody && nextTrackedBody === trackedBody) {
      // Follow physical displacement immediately; only entry into a new closeup is eased.
      smoothTarget.x += target.x - previousTarget.x;
      smoothTarget.y += target.y - previousTarget.y;
      smoothTarget.z += target.z - previousTarget.z;
    }
    trackedBody = nextTrackedBody;
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
    if (comparing) {
      if (reference === 'plane')
        comparison.render({
          snapshot: physical,
          date: utcDate(),
          view,
          selected,
          orbitPaths: planets.map((p) => p.path),
          lunarPath: lunarPoints,
          orbits: $('orbits').checked,
          names: $('names').checked,
          parallelRays: $('parallelRays').checked,
        });
      else
        observerDiagram.render({
          snapshot: physical,
          date: utcDate(),
          view,
          selected,
          observer,
          names: $('names').checked,
        });
    }
    frames++;
    labelBounds = [];
    leaders.replaceChildren();
    for (const p of planets) {
      p.label.hidden = !p.mesh.visible;
      if (p.mesh.visible) placeLabel(p.label, p.mesh.position, p.spec.size * p.mesh.scale.x);
    }
    moonLabel.hidden = !moon.visible;
    if (moon.visible) placeLabel(moonLabel, moon.position, 0.12);
    const date = utcDate();
    $('day').value = day;
    $('dayText').textContent =
      date.toISOString().slice(0, 10) + ' · ' + date.toISOString().slice(11, 16);
    if (document.activeElement !== $('date')) $('date').value = date.toISOString().slice(0, 10);
    $('overview').setAttribute('aria-pressed', String(view !== 'earthmoon'));
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
    inspectingMoon,
    cameraPreset,
    cameraTargetError: smoothTarget.distanceTo(target),
    referencePlaneVisible: referencePlane.visible,
    history: historyData
      ? {
          bodyId: historyData.bodyId,
          start: historyData.start.toISOString(),
          end: historyData.end.toISOString(),
          days: historyData.days,
          points: historyData.points,
          visible: history.visible,
          calculations: historyCalculations,
        }
      : null,
    comparing,
    reference,
    observer: { ...observer },
    observerResult: reference === 'observer' ? observerDiagram.state() : null,
  });
  // A read-only bridge: parent local apparent solar time is converted to UTC before arriving here.
  let hasLinkedDate = false;
  window.SolarSpaceView = {
    sync(input) {
      if (!embedded || typeof input?.date !== 'string') return false;
      const date = new Date(input.date);
      if (!Number.isFinite(date.getTime())) return false;
      const nextView = input.view === 'earthmoon' ? 'earthmoon' : 'overview';
      const changeView = !hasLinkedDate || linkedView !== nextView;
      linkedView = nextView;
      hasLinkedDate = true;
      year = date.getUTCFullYear();
      day = (date.getTime() - Date.UTC(year, 0, 1, 12)) / Model.DAY_MS;
      $('day').max = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / Model.DAY_MS - 1;
      pause();
      if (changeView) {
        view = nextView;
        azimuth = -0.22;
        elevation = 0.85;
        select(2);
        if (view === 'overview') {
          targetDistance = overviewDistance();
          $('viewTitle').textContent = '太阳系总览 · 点击天体看近景';
        }
      }
      invalidate();
      return true;
    },
  };
  if (embedded) {
    $('reset').setAttribute('aria-label', '回到三维整体视图');
    $('reset').title = '回到三维整体视图';
    window.dispatchEvent(new Event('space:ready'));
  }
})();
