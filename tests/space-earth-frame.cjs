/** Earth texture orientation and solar lighting use one geometric spatial frame. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Astronomy = require('../astronomy.js');
const sandbox = { Astronomy, Date };
vm.createContext(sandbox);
for (const file of ['model.js', 'earth-frame.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../space', file), 'utf8'), sandbox);
const Model = sandbox.SolarSpaceModel;
const EarthFrame = sandbox.SolarSpaceEarthFrame;
const rad = Math.PI / 180;
const deg = 180 / Math.PI;
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const norm = (a) => Math.hypot(a.x, a.y, a.z);
const angleDifference = (a, b) => ((a - b + 540) % 360) - 180;
function close(a, b, tolerance = 1e-12) {
  assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
}
function vectorClose(a, b) {
  for (const axis of ['x', 'y', 'z']) close(a[axis], b[axis]);
}
function toLocal(frame, scene) {
  return {
    x: dot(scene, frame.localToScene.x),
    y: dot(scene, frame.localToScene.y),
    z: dot(scene, frame.localToScene.z),
  };
}
function toScene(frame, local) {
  return Object.fromEntries(
    ['x', 'y', 'z'].map((axis) => [
      axis,
      frame.localToScene.x[axis] * local.x +
        frame.localToScene.y[axis] * local.y +
        frame.localToScene.z[axis] * local.z,
    ]),
  );
}
let maximumApparentDelta = 0;
for (const iso of [
  '1900-06-21T12:00:00Z',
  '2000-01-01T12:00:00Z',
  '2026-03-20T14:46:00Z',
  '2026-06-21T08:24:00Z',
  '2026-08-20T12:00:00Z',
  '2026-09-23T00:06:00Z',
  '2026-12-21T20:50:00Z',
  '2028-02-29T00:00:00Z',
  '2100-12-21T12:00:00Z',
]) {
  const date = new Date(iso);
  const originalTime = date.getTime();
  const snapshot = Model.snapshot(date);
  const originalSnapshot = JSON.stringify(snapshot);
  const frame = EarthFrame.frame(date, snapshot);
  for (const axis of ['x', 'y', 'z']) close(norm(frame.localToScene[axis]), 1);
  close(dot(frame.localToScene.x, frame.localToScene.y), 0);
  close(dot(frame.localToScene.x, frame.localToScene.z), 0);
  close(dot(frame.localToScene.y, frame.localToScene.z), 0);
  vectorClose(cross(frame.localToScene.x, frame.localToScene.y), frame.localToScene.z);
  vectorClose(frame.north, frame.localToScene.y);
  assert.equal(frame.date.getTime(), originalTime);
  assert.notEqual(frame.date, date);
  assert.equal(date.getTime(), originalTime);
  assert.equal(JSON.stringify(snapshot), originalSnapshot);

  const gast = Astronomy.SiderealTime(date) * 15 * rad;
  const eqdGreenwich = new Astronomy.Vector(
    Math.cos(gast),
    Math.sin(gast),
    0,
    Astronomy.MakeTime(date),
  );
  const expectedGreenwich = Model.sceneVector(
    Astronomy.RotateVector(Astronomy.Rotation_EQD_EQJ(date), eqdGreenwich),
  );
  vectorClose(expectedGreenwich, frame.localToScene.x);
  const eqdNorth = new Astronomy.Vector(0, 0, 1, Astronomy.MakeTime(date));
  vectorClose(
    Model.sceneVector(Astronomy.RotateVector(Astronomy.Rotation_EQD_EQJ(date), eqdNorth)),
    frame.north,
  );

  const subsolarLocal = {
    x: Math.cos(frame.subsolar.lat * rad) * Math.cos(frame.subsolar.lon * rad),
    y: Math.sin(frame.subsolar.lat * rad),
    z: -Math.cos(frame.subsolar.lat * rad) * Math.sin(frame.subsolar.lon * rad),
  };
  vectorClose(toScene(frame, subsolarLocal), snapshot.earthToSun);
  const west90 = toLocal(frame, frame.localToScene.z);
  close(Math.atan2(-west90.z, west90.x) * deg, -90);

  // Independent conventional apparent-equator reference, identical to the original app.
  const eq = Astronomy.EquatorFromVector(
    Astronomy.RotateVector(
      Astronomy.Rotation_EQJ_EQD(date),
      Astronomy.GeoVector('Sun', date, true),
    ),
  );
  const apparentLon = ((eq.ra * 15 - Astronomy.SiderealTime(date) * 15 + 540) % 360) - 180;
  const latDelta = Math.abs(frame.subsolar.lat - eq.dec);
  const lonDelta = Math.abs(angleDifference(frame.subsolar.lon, apparentLon));
  maximumApparentDelta = Math.max(maximumApparentDelta, latDelta, lonDelta);
  assert.ok(latDelta < 0.012 && lonDelta < 0.012, `Apparent/geometric mismatch at ${iso}`);
}

for (const [iso, minimum, maximum] of [
  ['2026-06-21T12:00:00Z', 23.3, 23.5],
  ['2026-12-21T12:00:00Z', -23.5, -23.3],
  ['2026-08-20T12:00:00Z', 12, 13],
  ['2026-03-20T14:46:00Z', -0.03, 0.03],
  ['2026-09-23T00:06:00Z', -0.03, 0.03],
]) {
  const { subsolar } = EarthFrame.frame(new Date(iso));
  assert.ok(subsolar.lat > minimum && subsolar.lat < maximum, `${iso}: ${subsolar.lat}`);
}
const midnight = new Date('2026-08-20T00:00:00Z');
const origin = EarthFrame.frame(midnight);
const after6h = EarthFrame.frame(new Date(midnight.getTime() + 6 * 3600000));
const after24h = EarthFrame.frame(new Date(midnight.getTime() + 24 * 3600000));
const sixHourAngle =
  Math.acos(Math.max(-1, Math.min(1, dot(origin.localToScene.x, after6h.localToScene.x)))) * deg;
assert.ok(sixHourAngle > 90 && sixHourAngle < 90.4, `6h spin ${sixHourAngle}`);
const dailyRemainder =
  Math.acos(Math.max(-1, Math.min(1, dot(origin.localToScene.x, after24h.localToScene.x)))) * deg;
assert.ok(dailyRemainder > 0.9 && dailyRemainder < 1.1, `24h sidereal remainder ${dailyRemainder}`);
for (const date of [null, 0, '2026-08-20', new Date('invalid')])
  assert.throws(() => EarthFrame.frame(date));
assert.throws(() => EarthFrame.frame(midnight, { earthToSun: { x: 0, y: 0, z: 0 } }));
assert.throws(() => EarthFrame.frame(midnight, { earthToSun: { x: NaN, y: 0, z: 1 } }));
console.log(
  `PASS: Earth right-handed orientation, Greenwich GAST, solstices/equinoxes, August northern subsolar latitude, 6h/24h spin, and invalid inputs. Maximum geometric/apparent delta ${(maximumApparentDelta * 3600).toFixed(2)} arcsec.`,
);
