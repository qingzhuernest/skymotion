/** Local JPL mean elements: teaching approximations, separate from the original ephemerides. */
(function (global) {
  'use strict';
  const AU_KM = 149597870.7;
  const RAD = Math.PI / 180;
  const J2000 = Date.UTC(2000, 0, 1, 12);
  const DAY = 86400000;
  const galilean = { 501: 'io', 502: 'europa', 503: 'ganymede', 504: 'callisto' };

  function solveKepler(mean, eccentricity) {
    if (!Number.isFinite(mean) || !(eccentricity >= 0 && eccentricity < 1))
      throw new RangeError('Only finite elliptic elements are supported');
    const M = ((mean % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let E = eccentricity < 0.8 ? M : Math.PI;
    for (let step = 0; step < 24; step++) {
      const delta = (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
      E -= delta;
      if (Math.abs(delta) < 1e-13) break;
    }
    return E;
  }
  function epochDays(epoch) {
    if (typeof epoch === 'number') return epoch - 2451545;
    const [day, fraction = '0'] = epoch.split('.');
    return (Date.parse(day + 'T00:00:00Z') - J2000) / DAY + Number('0.' + fraction);
  }
  function prepare(row, Engine, Model) {
    const satellite = !!row.host;
    const semimajor = satellite ? row.a / AU_KM : row.a;
    if (!(semimajor > 0) || !(row.e >= 0 && row.e < 1)) throw new RangeError('Invalid ellipse');
    const node = (satellite ? row.node : row.om) * RAD;
    const inclination = row.i * RAD;
    const periapsis = row.w * RAD;
    let north;
    const time = Engine.MakeTime(new Date(J2000));
    if (!satellite || row.frame === 'ecliptic')
      north = Engine.RotateVector(Engine.Rotation_ECL_EQJ(), new Engine.Vector(0, 0, 1, time));
    else if (row.frame === 'Laplace') {
      const ra = row.poleRa * RAD,
        dec = row.poleDec * RAD;
      north = {
        x: Math.cos(dec) * Math.cos(ra),
        y: Math.cos(dec) * Math.sin(ra),
        z: Math.sin(dec),
      };
    } else if (row.frame === 'equatorial') north = Engine.RotationAxis(row.host, time).north;
    else throw new Error('Unsupported satellite reference frame');
    const length = Math.hypot(north.x, north.y);
    const x =
      length > 1e-12 ? { x: -north.y / length, y: north.x / length, z: 0 } : { x: 1, y: 0, z: 0 };
    const y = {
      x: north.y * x.z - north.z * x.y,
      y: north.z * x.x - north.x * x.z,
      z: north.x * x.y - north.y * x.x,
    };
    function convert(v) {
      return Model.sceneVector(
        new Engine.Vector(
          x.x * v.x + y.x * v.y + north.x * v.z,
          x.y * v.x + y.y * v.y + north.y * v.z,
          x.z * v.x + y.z * v.y + north.z * v.z,
          time,
        ),
      );
    }
    const cN = Math.cos(node),
      sN = Math.sin(node),
      ci = Math.cos(inclination),
      si = Math.sin(inclination),
      cw = Math.cos(periapsis),
      sw = Math.sin(periapsis);
    const p = convert({ x: cN * cw - sN * sw * ci, y: sN * cw + cN * sw * ci, z: sw * si });
    const q = convert({ x: -cN * sw - sN * cw * ci, y: -sN * sw + cN * cw * ci, z: cw * si });
    return {
      ...row,
      semimajor,
      p,
      q,
      epochDays: epochDays(row.epoch),
      mean: (satellite ? row.M : row.ma) * RAD,
      motion: (satellite ? 360 / row.period : row.n) * RAD,
    };
  }
  function position(orbit, ttDays) {
    const E = solveKepler(orbit.mean + orbit.motion * (ttDays - orbit.epochDays), orbit.e);
    const x = orbit.semimajor * (Math.cos(E) - orbit.e);
    const y = orbit.semimajor * Math.sqrt(1 - orbit.e * orbit.e) * Math.sin(E);
    return {
      x: orbit.p.x * x + orbit.q.x * y,
      y: orbit.p.y * x + orbit.q.y * y,
      z: orbit.p.z * x + orbit.q.z * y,
    };
  }
  function displaySatellite(vector, hostRadius, planetRadiusKm) {
    const km = Math.hypot(vector.x, vector.y, vector.z) * AU_KM;
    const length = hostRadius * (1.55 + 0.75 * Math.log1p(km / planetRadiusKm));
    const scale = length / Math.hypot(vector.x, vector.y, vector.z);
    return { x: vector.x * scale, y: vector.y * scale, z: vector.z * scale };
  }

  function create(THREE, renderer, Model, Engine, invalidate) {
    const group = new THREE.Group();
    // Small bodies are visibility markers, not discs scaled to their physical radii.
    // A soft circular sprite avoids the default square pixels overwhelming planets.
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const context = sprite.getContext('2d');
    const edge = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    edge.addColorStop(0, 'rgba(255,255,255,1)');
    edge.addColorStop(0.45, 'rgba(255,255,255,0.85)');
    edge.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = edge;
    context.fillRect(0, 0, 64, 64);
    const pointTexture = new THREE.CanvasTexture(sprite);
    const satellites = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: 0xd9e4ed,
        map: pointTexture,
        size: 1.6,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    );
    const asteroids = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: 0xb6a590,
        map: pointTexture,
        size: 1.2,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    );
    const comets = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: 0xb7ddeb,
        map: pointTexture,
        size: 2.2,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );
    for (const object of [satellites, asteroids, comets]) {
      object.frustumCulled = false;
      object.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
      object.geometry.setDrawRange(0, 0);
      group.add(object);
    }
    let data = null,
      key = '',
      snapshot = {
        loaded: false,
        satellites: 0,
        asteroids: 0,
        comets: 0,
        visibleSatellites: 0,
        approximate: true,
      };
    let loading = false;
    function load() {
      if (loading) return;
      loading = true;
      return fetch('assets/population.json')
        .then((r) => {
          if (!r.ok) throw new Error('Unavailable population snapshot');
          return r.json();
        })
        .then((catalog) => {
          data = {
            satellites: catalog.satellites.map((row) => prepare(row, Engine, Model)),
            smallBodies: catalog.smallBodies.map((row) => prepare(row, Engine, Model)),
          };
          snapshot = {
            ...snapshot,
            loaded: true,
            satellites: data.satellites.length,
            asteroids: data.smallBodies.filter((row) => row.kind === 'a').length,
            comets: data.smallBodies.filter((row) => row.kind === 'c').length,
          };
          document.getElementById('populationStatus').textContent =
            `JPL轨道目录：${snapshot.satellites}颗卫星、${snapshot.asteroids}颗主带小行星、${snapshot.comets}颗周期彗星。其他卫星与小天体采用固定平均要素近似，不是精密星历。`;
          invalidate();
          return true;
        })
        .catch(() => {
          document.getElementById('populationStatus').textContent =
            '小天体数据未加载；原太阳系模型仍可使用。';
          return false;
        });
    }
    function setPositions(object, values) {
      const previous = object.geometry.getAttribute('position');
      if (previous?.array.length === values.length) {
        previous.array.set(values);
        previous.needsUpdate = true;
      } else object.geometry.setAttribute('position', new THREE.Float32BufferAttribute(values, 3));
      object.geometry.setDrawRange(0, values.length / 3);
    }
    return {
      group,
      load,
      state: () => ({ ...snapshot }),
      update({
        date,
        view,
        selected,
        hosts,
        physical,
        active,
        showSatellites,
        showAsteroids,
        showComets,
      }) {
        group.visible = active && !!data;
        if (active && !data) load();
        if (!active || !data) return;
        satellites.visible = showSatellites;
        asteroids.visible = showAsteroids && view === 'overview';
        comets.visible = showComets && view === 'overview';
        const next = [
          date.getTime(),
          view,
          selected,
          showSatellites,
          showAsteroids,
          showComets,
        ].join(':');
        if (next === key) return;
        key = next;
        const tt = Engine.MakeTime(date).tt;
        const counts = [];
        if (showSatellites) {
          const jovian = Engine.JupiterMoons(date);
          for (const row of data.satellites) {
            const index = Model.bodies.findIndex((body) => body.id === row.host);
            if (
              index < 0 ||
              (view !== 'overview' && index !== selected) ||
              (view === 'earthmoon' && row.host === 'Earth')
            )
              continue;
            let v =
              row.host === 'Earth'
                ? physical.moon
                : galilean[row.code]
                  ? Model.sceneVector(jovian[galilean[row.code]])
                  : position(row, tt);
            const offset = displaySatellite(
              v,
              Model.bodies[index].size * hosts[index].scale,
              Model.bodies[index].radius,
            );
            counts.push(
              hosts[index].position.x + offset.x,
              hosts[index].position.y + offset.y,
              hosts[index].position.z + offset.z,
            );
          }
          setPositions(satellites, counts);
        }
        snapshot.visibleSatellites = counts.length / 3;
        if (view === 'overview') {
          const a = [],
            c = [];
          for (const row of data.smallBodies) {
            if ((row.kind === 'a' && !showAsteroids) || (row.kind === 'c' && !showComets)) continue;
            const v = Model.compress(position(row, tt));
            (row.kind === 'a' ? a : c).push(v.x, v.y, v.z);
          }
          if (showAsteroids) setPositions(asteroids, a);
          if (showComets) setPositions(comets, c);
        }
      },
      extent(index) {
        if (!data) return Model.bodies[index].size * 6;
        let maximum = Model.bodies[index].size * 2;
        for (const row of data.satellites.filter((r) => r.host === Model.bodies[index].id))
          maximum = Math.max(
            maximum,
            Model.bodies[index].size *
              (1.55 + 0.75 * Math.log1p((row.a * (1 + row.e)) / Model.bodies[index].radius)),
          );
        return maximum;
      },
    };
  }
  global.SolarSpacePopulation = {
    prepare,
    position,
    displaySatellite,
    solveKepler,
    epochDays,
    create,
  };
})(globalThis);
