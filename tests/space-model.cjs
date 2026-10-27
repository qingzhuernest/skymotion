/** Node-only checks for coordinate handedness, ephemeris consistency and display-scale separation. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Astronomy = require('../site/astronomy.js');
const sandbox = { Astronomy, Date };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../site/space/model.js'), 'utf8'), sandbox);
const model = sandbox.SolarSpaceModel;
const length = (v) => Math.hypot(v.x, v.y, v.z);
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const close = (a, b, tolerance = 1e-11) => assert(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const epoch = new Date('2000-01-01T12:00:00Z');
const basis = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
].map((p) => model.sceneVector(new Astronomy.Vector(...p, epoch)));
close(dot(cross(basis[0], basis[1]), basis[2]), 1);
for (const vector of basis) close(length(vector), 1);
close(basis[2].y, Math.cos((23.43929111 * Math.PI) / 180), 1e-6);
close(basis[2].z, -Math.sin((23.43929111 * Math.PI) / 180), 1e-6);
let samples = 0;
for (const stamp of [
  '1900-01-01T12:00:00Z',
  '2000-01-01T12:00:00Z',
  '2026-06-21T12:00:00Z',
  '2028-02-29T12:00:00Z',
  '2100-12-31T12:00:00Z',
]) {
  const date = new Date(stamp),
    snapshot = model.snapshot(date);
  assert.equal(snapshot.planets.length, 8);
  for (const body of snapshot.planets) {
    const raw = Astronomy.HelioVector(body.id, date);
    close(length(body.physical), length(raw));
    close(dot(body.physical, body.display) / (length(body.physical) * length(body.display)), 1);
    assert(length(body.display) > 0 && Number.isFinite(length(body.display)));
    samples++;
  }
  const earth = snapshot.planets.find((p) => p.id === 'Earth').physical;
  close(length(snapshot.earthToSun), 1);
  close(dot(earth, snapshot.earthToSun) / length(earth), -1);
  close(length(snapshot.moon), length(Astronomy.GeoMoon(date)));
  const moonToEarth = { x: -snapshot.moon.x, y: -snapshot.moon.y, z: -snapshot.moon.z };
  const moonToSun = {
    x: -earth.x - snapshot.moon.x,
    y: -earth.y - snapshot.moon.y,
    z: -earth.z - snapshot.moon.z,
  };
  const geometricFraction =
    (1 + dot(moonToEarth, moonToSun) / (length(moonToEarth) * length(moonToSun))) / 2;
  close(snapshot.moonIllumination, geometricFraction, 0.0002);
  assert(snapshot.moonIllumination >= 0 && snapshot.moonIllumination <= 1);
}
for (const body of model.bodies) {
  const points = model.orbitalPath(body, epoch);
  assert.equal(points.length, 193);
  assert(points.every((p) => Number.isFinite(length(p)) && length(p) > 0));
}
assert.throws(() => model.snapshot(new Date(NaN)));
console.log(
  `PASS ${samples} planet samples, 5 lunar illumination checks, right-handed coordinates, finite sampled orbits and invalid-date rejection`,
);
