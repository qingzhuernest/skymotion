const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  A = require('../site/astronomy.js');
const sandbox = vm.createContext({ Astronomy: A, Date });
for (const f of ['model.js', 'population.js'])
  vm.runInContext(fs.readFileSync('site/space/' + f, 'utf8'), sandbox);
const P = sandbox.SolarSpacePopulation,
  M = sandbox.SolarSpaceModel,
  data = JSON.parse(fs.readFileSync('site/space/assets/population.json', 'utf8'));
assert.equal(data.satellites.length, 455);
assert.equal(data.smallBodies.length, 1212);
const tally = {};
for (const s of data.satellites) tally[s.host] = (tally[s.host] || 0) + 1;
assert.deepEqual(tally, { Earth: 1, Mars: 2, Jupiter: 115, Saturn: 291, Uranus: 30, Neptune: 16 });
for (const spec of [...data.satellites, ...data.smallBodies]) {
  const p = P.prepare(spec, A, M);
  for (const days of [p.epochDays, p.epochDays + 1, p.epochDays - 1, p.epochDays + 36525]) {
    const v = P.position(p, days),
      r = Math.hypot(v.x, v.y, v.z);
    assert(Number.isFinite(r));
    assert(r >= p.semimajor * (1 - p.e) - 1e-10 && r <= p.semimajor * (1 + p.e) + 1e-10);
  }
  const end = P.position(p, p.epochDays + (2 * Math.PI) / p.motion),
    start = P.position(p, p.epochDays);
  assert(
    Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z) < 1e-8,
    'one-period closure',
  );
}
for (const e of [0, 0.1, 0.8, 0.9679, 0.999])
  for (const m of [-400, -2, 0, 0.000001, 2, 400]) {
    const E = P.solveKepler(m, e),
      wrapped = ((m % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    assert(Math.abs(E - e * Math.sin(E) - wrapped) < 1e-11);
  }
assert.throws(() => P.solveKepler(0, 1));
const retro = P.prepare(
  data.satellites.find((x) => x.name === 'Triton'),
  A,
  M,
);
const v1 = P.position(retro, retro.epochDays),
  v2 = P.position(retro, retro.epochDays + 0.001);
const cross = {
  x: v1.y * v2.z - v1.z * v2.y,
  y: v1.z * v2.x - v1.x * v2.z,
  z: v1.x * v2.y - v1.y * v2.x,
};
const pole = A.RotationAxis('Neptune', new Date('2000-01-01T12:00:00Z')).north;
const n = M.sceneVector(pole);
assert(cross.x * n.x + cross.y * n.y + cross.z * n.z < 0, 'Triton retrograde preserved');
const t = A.JupiterMoons(new Date('2026-10-09T12:00:00Z'));
assert(Math.hypot(t.io.x, t.io.y, t.io.z) * 149597870.7 > 400000);
console.log(
  'PASS 455 satellite / 1,212 small-body ellipses, epochs, finite bounds, periods, high-e solver, Triton retrograde and Galilean state units',
);

// The display transform must preserve direction, radial order and zoom scaling.
for (const host of ['Earth', 'Jupiter', 'Saturn']) {
  let previous = 0;
  for (const ratio of [1.1, 2, 6, 60, 1000]) {
    const v = { x: (ratio * 6371) / 149597870.7, y: 0, z: 0 };
    const d = P.displaySatellite(v, 1, 6371, host);
    assert(d.x > previous && d.y === 0 && d.z === 0);
    assert(d.x > (host === 'Saturn' ? 2.3 : 1));
    const scaled = P.displaySatellite(v, 2, 6371, host);
    assert(Math.abs(scaled.x - 2 * d.x) < 1e-12);
    previous = d.x;
  }
}
console.log('PASS compact satellite order, planet/ring clearance and world-scale zoom');
