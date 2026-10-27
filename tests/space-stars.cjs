/** Verify reference catalog and frame/color mapping independently of WebGL. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Astronomy = require('../site/astronomy.js');
const catalog = JSON.parse(fs.readFileSync('site/space/assets/stars.json', 'utf8'));
const context = vm.createContext({ Astronomy, Date });
for (const file of ['model.js', 'stars.js'])
  vm.runInContext(fs.readFileSync('site/space/' + file, 'utf8'), context);
const sky = context.SolarSpaceStars;
const model = context.SolarSpaceModel;
assert.equal(catalog.epoch, 'J2000');
assert.equal(catalog.license, 'CC BY-SA 4.0');
assert.equal(catalog.stars.length, 61816);
assert.equal(catalog.stars.filter((star) => star[2] <= 6.5).length, 8920);
assert.equal(catalog.limit, 8.5);
for (const [ra, dec, mag, bv] of catalog.stars) {
  assert(ra >= 0 && ra < 24 && dec >= -90 && dec <= 90 && mag <= 8.5);
  assert(bv === null || Number.isFinite(bv));
  const direction = sky.direction(ra, dec, model, Astronomy);
  assert(Math.abs(Math.hypot(direction.x, direction.y, direction.z) - 1) < 1e-12);
  assert(
    sky.color(bv).every((channel) => Number.isFinite(channel) && channel >= 0 && channel <= 1),
  );
}
const sirius = catalog.stars.find(
  ([ra, dec, mag]) =>
    Math.abs(ra - 6.752481) < 0.001 && Math.abs(dec + 16.716116) < 0.001 && mag < -1,
);
assert(sirius, 'Sirius position and visual brightness retained');
const polaris = catalog.stars.find(
  ([ra, dec]) => Math.abs(ra - 2.52975) < 0.005 && Math.abs(dec - 89.264109) < 0.001,
);
assert(polaris, 'Polaris retained near the J2000 north celestial pole');
const warm = sky.color(1.5),
  blue = sky.color(-0.2);
assert(warm[0] > warm[2] && blue[2] > blue[0], 'B-V determines warm and blue-white colors');
assert(sky.temperature(-0.2) > sky.temperature(1.5));
assert(sky.color(null).every(Number.isFinite));
console.log(
  'PASS 61,816 finite catalog stars, J2000 unit directions, Sirius/Polaris, magnitude limit and B-V color mapping',
);
