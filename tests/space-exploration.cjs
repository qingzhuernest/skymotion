/** Regression: history shares the existing coordinate model and never invents a closed orbit. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Astronomy = require('../astronomy.js');
const sandbox = { Astronomy, Date };
vm.createContext(sandbox);
for (const file of ['model.js', 'exploration.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../space', file), 'utf8'), sandbox);
}
const Model = sandbox.SolarSpaceModel;
const Exploration = sandbox.SolarSpaceExploration;
function close(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}
function vectorClose(actual, expected) {
  for (const axis of ['x', 'y', 'z']) close(actual[axis], expected[axis]);
}

const dates = ['2026-06-21T12:00:00Z', '2028-03-01T18:30:00Z', '2026-01-01T00:00:00Z'];
for (const iso of dates) {
  const date = new Date(iso);
  const snapshot = Model.snapshot(date);
  const before = JSON.stringify(snapshot);
  for (const [index, body] of Model.bodies.entries()) {
    const history = Exploration.trail({ date, bodyId: body.id, days: 30, segments: 12 });
    assert.equal(history.points.length, 13);
    assert.equal(history.end.getTime(), date.getTime());
    assert.equal(history.start.getTime(), date.getTime() - 30 * Model.DAY_MS);
    const start = Model.snapshot(history.start).planets[index];
    const end = snapshot.planets[index];
    vectorClose(history.points[0], start.display);
    vectorClose(history.points.at(-1), end.display);
    vectorClose(history.points.at(-1).physical, end.physical);
    assert.notEqual(JSON.stringify(history.points[0]), JSON.stringify(history.points.at(-1)));
    const distance = Exploration.actualDistance(snapshot, index);
    assert.equal(distance.bodyId, body.id);
    assert.equal(distance.unit, 'AU');
    assert.equal(distance.reference, 'sun');
    close(distance.value, Math.hypot(end.physical.x, end.physical.y, end.physical.z));
  }
  const moon = Exploration.trail({ date, bodyId: 'Moon', days: 90, frame: 'geocentric' });
  vectorClose(moon.points.at(-1).physical, snapshot.moon);
  const scale = Model.MOON_DISPLAY_SCALE;
  for (const axis of ['x', 'y', 'z']) close(moon.points.at(-1)[axis], snapshot.moon[axis] * scale);
  const distance = Exploration.actualDistance(snapshot, 'Moon');
  close(
    distance.value,
    Math.hypot(snapshot.moon.x, snapshot.moon.y, snapshot.moon.z) * 149597870.7,
    1e-8,
  );
  assert.equal(distance.unit, 'km');
  assert.equal(distance.reference, 'earth');
  assert.equal(
    JSON.stringify(snapshot),
    before,
    'snapshot must not be changed by distance readouts',
  );
  assert.equal(date.toISOString(), new Date(iso).toISOString(), 'caller date must not be changed');
}

const leap = Exploration.trail({
  date: new Date('2028-03-01T00:00:00Z'),
  bodyId: 'Earth',
  days: 1,
});
assert.equal(leap.start.toISOString(), '2028-02-29T00:00:00.000Z');
const crossingYear = Exploration.trail({
  date: new Date('2026-01-01T00:00:00Z'),
  bodyId: 'Mars',
  days: 365,
});
assert.equal(crossingYear.start.toISOString(), '2025-01-01T00:00:00.000Z');
const base = { date: new Date('2026-06-21T12:00:00Z'), bodyId: 'Earth', days: 30 };
for (const days of [0, -30, 366, NaN, Infinity, '30']) {
  assert.throws(() => Exploration.trail({ ...base, days }));
}
for (const segments of [0, 1, 513, 4.5, NaN, '96']) {
  assert.throws(() => Exploration.trail({ ...base, segments }));
}
for (const date of [new Date('invalid'), null, '2026-06-21', 1]) {
  assert.throws(() => Exploration.trail({ ...base, date }));
}
for (const invalid of [
  { bodyId: 'Sun' },
  { bodyId: 'Moon' },
  { frame: 'geocentric' },
  { frame: 'invalid' },
])
  assert.throws(() => Exploration.trail({ ...base, ...invalid }));
for (const selected of [-1, 8, 2.5, null, 'Sun']) {
  assert.throws(() => Exploration.actualDistance(Model.snapshot(base.date), selected));
}
assert.throws(() => Exploration.actualDistance(null, 'Earth'));
assert.throws(() => Exploration.actualDistance({ moon: { x: NaN, y: 0, z: 0 } }, 'Moon'));

// Rendering detail can change without changing the scientific interval or endpoints.
for (const bodyId of ['Earth', 'Jupiter', 'Moon']) {
  const frame = bodyId === 'Moon' ? 'geocentric' : 'heliocentric';
  const fine = Exploration.trail({ ...base, bodyId, frame, days: 90, segments: 96 });
  const quick = Exploration.trail({ ...base, bodyId, frame, days: 90, segments: 48 });
  assert.equal(fine.start.getTime(), quick.start.getTime());
  assert.equal(fine.end.getTime(), quick.end.getTime());
  vectorClose(fine.points[0], quick.points[0]);
  vectorClose(fine.points.at(-1), quick.points.at(-1));
  for (let i = 0; i <= 48; i++) vectorClose(fine.points[i * 2], quick.points[i]);
}
const fractional = Exploration.trail({ ...base, days: 1.234567891, segments: 48 });
assert.equal(fractional.end.getTime(), base.date.getTime());
vectorClose(fractional.points.at(-1), Model.snapshot(base.date).planets[2].display);

console.log(
  'PASS: selected-body historical endpoints, 24 planet trails, 3 Moon trails, true distances, leap/year crossings, immutable snapshots, and invalid input guards',
);

// CPU observation, not a device/GPU benchmark; no timing threshold is part of correctness.
const { performance } = require('node:perf_hooks');
for (const bodyId of ['Earth', 'Jupiter', 'Moon']) {
  const frame = bodyId === 'Moon' ? 'geocentric' : 'heliocentric';
  Exploration.trail({ ...base, bodyId, frame });
  const samples = [];
  for (let count = 0; count < 10; count++) {
    const start = performance.now();
    Exploration.trail({ ...base, bodyId, frame, segments: 96 });
    samples.push(performance.now() - start);
  }
  const average = samples.reduce((a, b) => a + b) / samples.length;
  console.log(
    `CPU sample ${bodyId}: 97 points, mean ${average.toFixed(2)} ms, max ${Math.max(...samples).toFixed(2)} ms (10 runs)`,
  );
}
