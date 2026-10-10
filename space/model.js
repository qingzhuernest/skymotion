/**
 * Space model: physical coordinates stay in AU; display scaling is applied separately.
 * EQJ → ECL → Three.js uses (x, z, -y), a rotation that preserves handedness.
 */
(function (global) {
  'use strict';
  const bodies = [
    {
      id: 'Mercury',
      name: '水星',
      type: '类地行星',
      radius: 2440,
      au: 0.387,
      period: 87.97,
      size: 0.23,
      color: 0xaaa093,
    },
    {
      id: 'Venus',
      name: '金星',
      type: '类地行星',
      radius: 6052,
      au: 0.723,
      period: 224.7,
      size: 0.38,
      color: 0xe5c397,
    },
    {
      id: 'Earth',
      name: '地球',
      type: '类地行星 · 我们的观测起点',
      radius: 6371,
      au: 1,
      period: 365.26,
      size: 0.44,
      color: 0x729bd8,
    },
    {
      id: 'Mars',
      name: '火星',
      type: '类地行星',
      radius: 3390,
      au: 1.524,
      period: 686.98,
      size: 0.33,
      color: 0xc17a56,
    },
    {
      id: 'Jupiter',
      name: '木星',
      type: '气态巨行星',
      radius: 69911,
      au: 5.203,
      period: 4332.59,
      size: 1.1,
      color: 0xd3b28f,
    },
    {
      id: 'Saturn',
      name: '土星',
      type: '气态巨行星',
      radius: 58232,
      au: 9.537,
      period: 10759.22,
      size: 0.87,
      color: 0xe0cc9d,
    },
    {
      id: 'Uranus',
      name: '天王星',
      type: '冰巨行星',
      radius: 25362,
      au: 19.19,
      period: 30688.5,
      size: 0.65,
      color: 0x91d3dd,
    },
    {
      id: 'Neptune',
      name: '海王星',
      type: '冰巨行星',
      radius: 24622,
      au: 30.07,
      period: 60182,
      size: 0.63,
      color: 0x597ddf,
    },
  ];
  const DAY_MS = 86400000;
  const rotation = Astronomy.Rotation_EQJ_ECL();
  function sceneVector(eqj) {
    const ecl = Astronomy.RotateVector(rotation, eqj);
    return { x: ecl.x, y: ecl.z, z: -ecl.y };
  }
  function compress(vector) {
    const radius = Math.hypot(vector.x, vector.y, vector.z);
    const scale = radius ? (6.8 * Math.pow(radius, 0.45)) / radius : 0;
    return { x: vector.x * scale, y: vector.y * scale, z: vector.z * scale };
  }
  function snapshot(date) {
    if (!Number.isFinite(date.getTime())) throw new Error('Invalid UTC date');
    const planets = bodies.map((body) => {
      const physical = sceneVector(Astronomy.HelioVector(body.id, date));
      return { id: body.id, physical, display: compress(physical) };
    });
    const moon = sceneVector(Astronomy.GeoMoon(date));
    const earth = planets.find((p) => p.id === 'Earth').physical;
    const length = Math.hypot(earth.x, earth.y, earth.z);
    const phase = Astronomy.Illumination('Moon', date);
    return {
      planets,
      moon,
      earthToSun: {
        x: -earth.x / length,
        y: -earth.y / length,
        z: -earth.z / length,
      },
      moonIllumination: phase.phase_fraction,
    };
  }
  function orbitalPath(body, date, segments = 192) {
    // Sample one approximate orbital period. Do not fabricate a closing segment.
    return Array.from({ length: segments + 1 }, (_, i) => {
      const time = new Date(date.getTime() + (i / segments) * body.period * DAY_MS);
      return compress(sceneVector(Astronomy.HelioVector(body.id, time)));
    });
  }
  global.SolarSpaceModel = {
    bodies,
    DAY_MS,
    // Shared teaching scale for Moon, its orbit and historical trail (AU → scene units).
    MOON_DISPLAY_SCALE: 1.5 / 0.002569555,
    sceneVector,
    compress,
    snapshot,
    orbitalPath,
  };
})(globalThis);
