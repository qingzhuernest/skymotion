/** One WebGL context, two views, and a clock independent of the ephemeris workbench. */
(() => {
  const $ = (id) => document.getElementById(id),
    M = LunarOrbitModel;
  const embedded = new URLSearchParams(location.search).get('embedded') === '1';
  if (embedded) document.body.classList.add('lunar-embedded');
  const words = {
    play: ['播放绕月飞行', 'Play lunar orbit'],
    pause: ['暂停飞行', 'Pause flight'],
    visible: ['地球在月面边缘上方', 'Earth is above the lunar limb'],
    partial: ['地球正在升起或落下', 'Earth is crossing the lunar limb'],
    hidden: ['地球被月球遮住', 'Earth is behind the Moon'],
    surface: [
      '固定月面：地球停在近乎同一方向',
      'Fixed surface: Earth stays in nearly the same direction',
    ],
    title: ['地球为什么会升落？', 'Why does Earth rise and set?'],
    surfaceTitle: ['固定在月面，会看到地升吗？', 'Does Earth rise from a fixed lunar site?'],
    lesson: [
      '宇航员绕月飞行时，观察位置不断改变，月球会遮住或露出地球。地升地落来自视线与月面边缘的相对运动。',
      'A lunar orbiter changes its observing position. The Moon reveals or hides Earth as the line of sight crosses the lunar limb.',
    ],
    surfaceLesson: [
      '在这个同步自转模型中，近地侧固定站点始终朝向地球。改变日地月构型会改变地球的亮面，却不会让地球每天升起落下。真实月球的天平动在此未模拟。',
      'In this synchronous-rotation model, the fixed near-side site keeps facing Earth. Changing the Sun–Earth–Moon geometry changes Earth’s illuminated fraction, without causing a daily rise or set. Lunar libration is not modeled.',
    ],
    minutes: ['分钟', 'min'],
  };
  const t = (k) => words[k][document.documentElement.lang === 'en' ? 1 : 0];
  const s = {
    mode: 'orbit',
    angle: 258,
    phase: 45,
    altitude: 100,
    seconds: 40,
    playing: false,
    follow: true,
    yaw: 0,
    pitch: 0,
    fov: 24,
  };
  let active = true,
    raf = 0,
    last = 0,
    renderer = null,
    disposed = false,
    scenes = null,
    bounds = null;
  document.querySelectorAll('[data-lunar-view]').forEach(
    (b) =>
      (b.onclick = () => {
        $('lunarStage').dataset.mobileView = b.dataset.lunarView;
        document
          .querySelectorAll('[data-lunar-view]')
          .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        resize();
      }),
  );
  const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  function text(id, value) {
    if ($(id).textContent !== value) $(id).textContent = value;
  }
  function refresh() {
    const surface = s.mode === 'surface',
      q = M.sample(s.angle, s.altitude, s.phase, surface);
    $('orbitAngle').disabled = surface;
    $('altitude').disabled = surface;
    $('speed').disabled = surface;
    $('playOrbit').disabled = surface;
    $('seekRise').disabled = surface;
    $('orbitAngle').value = s.angle;
    $('phaseAngle').value = s.phase;
    $('altitude').value = s.altitude;
    $('speed').value = s.seconds;
    $('lens').value = s.fov;
    $('playOrbit').setAttribute('aria-pressed', String(s.playing));
    text('positionValue', (surface ? 0 : s.angle).toFixed(1) + '°');
    text('phaseValue', s.phase.toFixed(0) + '°');
    $('playOrbit').querySelector('span').textContent = t(s.playing ? 'pause' : 'play');
    document
      .querySelectorAll('[data-mode]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === s.mode)));
    $('followEarth').setAttribute('aria-pressed', String(s.follow));
    text('visibilityText', t(surface ? 'surface' : q.visibility));
    text('earthAltitude', q.altitude.toFixed(1) + '°');
    text('horizonAltitude', q.horizon.toFixed(1) + '°');
    text('earthIllumination', (q.earthFraction * 100).toFixed(1) + '%');
    text('orbitPeriod', surface ? '—' : (q.period / 60).toFixed(1) + ' ' + t('minutes'));
    text('lessonTitle', t(surface ? 'surfaceTitle' : 'title'));
    text('lessonText', t(surface ? 'surfaceLesson' : 'lesson'));
    return q;
  }
  function invalidate() {
    if (!raf && active && !document.hidden && !disposed) raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    if (!active || disposed || document.hidden) {
      last = 0;
      return;
    }
    if (s.playing) {
      if (last) s.angle = (s.angle + (Math.min((now - last) / 1000, 0.08) * 360) / s.seconds) % 360;
      last = now;
    } else last = 0;
    const q = refresh();
    if (renderer && bounds) draw(q);
    if (s.playing) invalidate();
  }
  function pause() {
    s.playing = false;
    last = 0;
    invalidate();
  }
  $('playOrbit').onclick = () => {
    if (s.mode !== 'orbit') return;
    s.playing = !s.playing;
    last = 0;
    invalidate();
  };
  $('seekRise').onclick = () => {
    if (s.mode !== 'orbit') return;
    s.angle = M.riseAngle(s.altitude) - 1;
    s.playing = true;
    s.follow = true;
    s.yaw = s.pitch = 0;
    last = 0;
    invalidate();
  };
  $('resetOrbit').onclick = () => {
    Object.assign(s, {
      mode: 'orbit',
      angle: 258,
      phase: 45,
      altitude: 100,
      seconds: 40,
      playing: false,
      follow: true,
      yaw: 0,
      pitch: 0,
      fov: 24,
    });
    invalidate();
  };
  document.querySelectorAll('[data-mode]').forEach(
    (b) =>
      (b.onclick = () => {
        s.mode = b.dataset.mode;
        pause();
        s.follow = true;
        s.yaw = s.pitch = 0;
        invalidate();
      }),
  );
  $('orbitAngle').oninput = (e) => {
    s.angle = +e.target.value;
    pause();
  };
  $('phaseAngle').oninput = (e) => {
    s.phase = +e.target.value;
    invalidate();
  };
  $('altitude').onchange = (e) => {
    s.altitude = +e.target.value;
    invalidate();
  };
  $('speed').onchange = (e) => {
    s.seconds = +e.target.value;
    last = 0;
  };
  $('lens').onchange = (e) => {
    s.fov = +e.target.value;
    invalidate();
  };
  $('followEarth').onclick = () => {
    s.follow = !s.follow;
    s.yaw = s.pitch = 0;
    invalidate();
  };
  $('resetLook').onclick = () => {
    s.follow = true;
    s.yaw = s.pitch = 0;
    invalidate();
  };
  function stars(scene) {
    let seed = 12345;
    const random = () => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 4294967296;
      },
      p = [];
    for (let i = 0; i < 700; i++) {
      const y = random() * 2 - 1,
        a = random() * Math.PI * 2,
        r = Math.sqrt(1 - y * y);
      p.push(650 * r * Math.cos(a), 650 * y, 650 * r * Math.sin(a));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    scene.add(
      new THREE.Points(
        g,
        new THREE.PointsMaterial({
          color: 0xbcc6cc,
          size: 0.65,
          sizeAttenuation: false,
          transparent: true,
          opacity: 0.65,
        }),
      ),
    );
  }
  function ring(radius, color) {
    const points = [];
    for (let i = 0; i <= 192; i++) {
      const a = (i / 192) * Math.PI * 2;
      points.push(v(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 }),
    );
  }
  function setup() {
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: $('lunarCanvas'),
        antialias: true,
        alpha: false,
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      const overview = new THREE.Scene(),
        sky = new THREE.Scene();
      overview.background = new THREE.Color(0x0e1b29);
      sky.background = new THREE.Color(0x08121e);
      overview.add(new THREE.AmbientLight(0xb8c8d8, 1));
      sky.add(new THREE.AmbientLight(0x8799ad, 0.35));
      const mapLight = new THREE.DirectionalLight(0xfff3d5, 3),
        skyLight = new THREE.DirectionalLight(0xfff3d5, 3);
      mapLight.position.set(50, 0, 0);
      overview.add(mapLight);
      sky.add(skyLight);
      const surface = SolarSpaceAppearance.create(
          { id: 'Earth', size: 1 },
          THREE,
          renderer,
          invalidate,
        ),
        moon = SolarSpaceAppearance.moon(THREE, renderer, 1);
      const sphere = surface.geometry,
        moonSphere = new THREE.SphereGeometry(1, 192, 128);
      const earthMap = new THREE.Mesh(sphere, surface.material);
      earthMap.scale.setScalar(0.53);
      overview.add(earthMap);
      const moonMap = new THREE.Mesh(sphere, moon.material);
      moonMap.scale.setScalar(0.25);
      overview.add(moonMap);
      const lunarGround = new THREE.Mesh(moonSphere, moon.material);
      sky.add(lunarGround);
      const earthSky = new THREE.Mesh(sphere, surface.material);
      earthSky.position.set(-M.D / M.R, 0, 0);
      earthSky.scale.setScalar(M.E / M.R);
      sky.add(earthSky);
      const moonPath = ring(3.1, 0x78909f);
      overview.add(moonPath);
      const satellitePath = ring(0.65, 0x9ab5b8);
      overview.add(satellitePath);
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xf2d7a3 }),
      );
      overview.add(marker);
      const dotLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([v(), v(1, 0, 0)]),
        new THREE.LineBasicMaterial({ color: 0xf2d7a3, transparent: true, opacity: 0.55 }),
      );
      overview.add(dotLine);
      const sunArrow = new THREE.ArrowHelper(
        v(-1, 0, 0),
        v(3.7, 1, -2.4),
        1.3,
        0xd9c59b,
        0.15,
        0.08,
      );
      overview.add(sunArrow);
      stars(sky);
      const mapCamera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
      mapCamera.position.set(3, 7, 9);
      mapCamera.lookAt(0, 0, 0);
      const eye = new THREE.PerspectiveCamera(24, 1, 0.001, 1000);
      scenes = {
        overview,
        sky,
        skyLight,
        earthMap,
        moonMap,
        earthSky,
        marker,
        satellitePath,
        dotLine,
        mapCamera,
        eye,
        unusedGeometry: moon.geometry,
      };
      renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        $('lunarFailure').hidden = false;
        pause();
      });
      resize();
    } catch (e) {
      $('lunarFailure').hidden = false;
      if (renderer) renderer.dispose();
      renderer = null;
    }
  }
  function resize() {
    const stage = $('lunarStage'),
      r = stage.getBoundingClientRect();
    bounds = {
      frame: r,
      orbit: $('orbitView').getBoundingClientRect(),
      sky: $('astronautView').getBoundingClientRect(),
    };
    if (renderer && r.width && r.height) renderer.setSize(r.width, r.height, false);
    invalidate();
  }
  function projectLabel(id, p, camera, rect, extra = 0) {
    const q = p.clone().project(camera);
    const el = $(id);
    el.hidden = rect.width === 0 || q.z > 1 || Math.abs(q.x) > 1 || Math.abs(q.y) > 1;
    el.style.left = ((q.x + 1) * rect.width) / 2 + 'px';
    el.style.top = ((1 - q.y) * rect.height) / 2 + extra + 'px';
  }
  function draw(q) {
    const g = scenes,
      p = M.rad(s.phase),
      a = M.rad(s.mode === 'surface' ? 0 : s.angle),
      u = v(Math.cos(p), 0, Math.sin(p)),
      w = v(-Math.sin(p), 0, Math.cos(p));
    const moonPos = u.clone().multiplyScalar(3.1);
    g.moonMap.position.copy(moonPos);
    g.moonMap.rotation.y = -p;
    g.satellitePath.position.copy(moonPos);
    g.satellitePath.visible = s.mode === 'orbit';
    const marker = moonPos
      .clone()
      .addScaledVector(u, -Math.cos(a) * (s.mode === 'surface' ? 0.26 : 0.65))
      .addScaledVector(w, Math.sin(a) * 0.65);
    g.marker.position.copy(marker);
    const attr = g.dotLine.geometry.attributes.position;
    attr.setXYZ(0, moonPos.x, 0, moonPos.z);
    attr.setXYZ(1, marker.x, 0, marker.z);
    attr.needsUpdate = true;
    const pos = v(...q.position).multiplyScalar(1 / M.R),
      normal = v(...q.normal),
      earth = g.earthSky.position.clone().sub(pos).normalize();
    g.skyLight.position.set(Math.cos(p) * 100, 0, -Math.sin(p) * 100);
    const horizontal = earth.clone().addScaledVector(normal, -earth.dot(normal));
    if (horizontal.lengthSq() < 1e-8) horizontal.set(0, 1, 0);
    horizontal.normalize();
    let forward = s.follow
      ? earth
      : horizontal
          .clone()
          .multiplyScalar(Math.cos(M.rad(q.horizon + 8)))
          .addScaledVector(normal, Math.sin(M.rad(q.horizon + 8)))
          .normalize();
    const up = normal.clone().addScaledVector(forward, -normal.dot(forward));
    if (up.lengthSq() < 1e-8) up.set(0, 1, 0);
    up.normalize();
    const right = forward.clone().cross(up).normalize();
    forward = forward
      .multiplyScalar(Math.cos(s.yaw) * Math.cos(s.pitch))
      .addScaledVector(right, Math.sin(s.yaw) * Math.cos(s.pitch))
      .addScaledVector(up, Math.sin(s.pitch))
      .normalize();
    g.eye.position.copy(pos);
    g.eye.up.copy(up);
    g.eye.fov = s.fov;
    g.eye.lookAt(pos.clone().add(forward));
    renderer.setScissorTest(false);
    renderer.setClearColor(0x0d1825);
    renderer.clear();
    renderer.setScissorTest(true);
    for (const [rect, camera, scene] of [
      [bounds.orbit, g.mapCamera, g.overview],
      [bounds.sky, g.eye, g.sky],
    ]) {
      if (!rect.width || !rect.height) continue;
      const x = rect.left - bounds.frame.left,
        y = bounds.frame.bottom - rect.bottom;
      if (camera.isOrthographicCamera) {
        const h = Math.max(4.3, 4.3 / (rect.width / rect.height));
        camera.left = (-h * rect.width) / rect.height;
        camera.right = -camera.left;
        camera.top = h;
        camera.bottom = -h;
      } else camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setViewport(x, y, rect.width, rect.height);
      renderer.setScissor(x, y, rect.width, rect.height);
      renderer.render(scene, camera);
    }
    projectLabel('mapEarth', v(0, -0.6, 0), g.mapCamera, bounds.orbit);
    projectLabel('mapMoon', moonPos.clone().add(v(0, -0.35, 0)), g.mapCamera, bounds.orbit);
    projectLabel('mapObserver', marker, g.mapCamera, bounds.orbit, -24);
    projectLabel('skyEarth', g.earthSky.position, g.eye, bounds.sky, 22);
    $('skyEarth').hidden = q.visibility === 'hidden' || $('skyEarth').hidden;
  }
  let drag = null;
  $('orbitView').addEventListener('pointerdown', (e) => {
    if (!renderer || s.mode === 'surface') return;
    const hit = mapPoint(e);
    if (!hit) return;
    const moon = scenes.moonMap.position;
    drag = { kind: hit.distanceTo(moon) < 1.2 ? 'observer' : 'phase', id: e.pointerId };
    $('orbitView').setPointerCapture(e.pointerId);
    pause();
    moveMap(e);
  });
  function mapPoint(e) {
    const r = bounds?.orbit;
    if (!r?.width) return null;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      ),
      scenes.mapCamera,
    );
    return ray.ray.intersectPlane(new THREE.Plane(v(0, 1, 0), 0), v());
  }
  function moveMap(e) {
    if (!drag || !renderer) return;
    const hit = mapPoint(e);
    if (!hit) return;
    if (drag.kind === 'phase') {
      s.phase = (M.deg(Math.atan2(hit.z, hit.x)) + 360) % 360;
    } else {
      const d = hit.sub(scenes.moonMap.position),
        p = M.rad(s.phase);
      s.angle =
        (M.deg(
          Math.atan2(
            d.dot(v(-Math.sin(p), 0, Math.cos(p))),
            -d.dot(v(Math.cos(p), 0, Math.sin(p))),
          ),
        ) +
          360) %
        360;
    }
    invalidate();
  }
  $('orbitView').addEventListener('pointermove', (e) => {
    if (drag?.id === e.pointerId) moveMap(e);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    $('orbitView').addEventListener(type, () => {
      drag = null;
    });
  let look = null;
  $('astronautView').addEventListener('pointerdown', (e) => {
    if (e.target.closest('button,select,label')) return;
    look = { x: e.clientX, y: e.clientY, yaw: s.yaw, pitch: s.pitch, id: e.pointerId };
    $('astronautView').setPointerCapture(e.pointerId);
  });
  $('astronautView').addEventListener('pointermove', (e) => {
    if (!look || look.id !== e.pointerId) return;
    s.yaw = look.yaw - (e.clientX - look.x) * 0.004;
    s.pitch = Math.max(-1.1, Math.min(1.1, look.pitch + (e.clientY - look.y) * 0.004));
    invalidate();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    $('astronautView').addEventListener(type, () => {
      look = null;
    });
  window.addEventListener('message', (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== parent ||
      event.data?.type !== 'skymotion:lunar-active'
    )
      return;
    active = event.data.active === true;
    if (!active) {
      s.playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    } else {
      resize();
      invalidate();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      s.playing = false;
      last = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else invalidate();
  });
  document.addEventListener('skymotion:language', invalidate);
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe($('lunarStage'));
  window.addEventListener('pagehide', (e) => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    s.playing = false;
    if (!e.persisted && renderer) {
      disposed = true;
      const resources = new Set();
      for (const scene of [scenes?.overview, scenes?.sky])
        scene?.traverse((n) => {
          if (n.geometry) resources.add(n.geometry);
          for (const m of [n.material].flat().filter(Boolean)) {
            resources.add(m);
            for (const value of Object.values(m)) if (value?.isTexture) resources.add(value);
          }
        });
      resources.add(scenes?.unusedGeometry);
      resources.forEach((r) => r?.dispose());
      renderer.dispose();
    }
  });
  window.addEventListener('pageshow', () => {
    active = true;
    resize();
  });
  window.LunarOrbitLesson = {
    read: () => ({
      ...s,
      ...M.sample(s.angle, s.altitude, s.phase, s.mode === 'surface'),
      playing: s.playing,
    }),
    pause,
  };
  refresh();
  setup();
  invalidate();
})();
