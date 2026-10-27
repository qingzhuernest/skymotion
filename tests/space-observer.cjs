/** Coordinate parity across local sky and space views; this is an internal regression, not independent accuracy certification. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const Astronomy = require('../site/astronomy.js');
const noop = () => {};
const context = new Proxy(
  { measureText: (s) => ({ width: s.length * 7 }) },
  { get: (o, k) => o[k] ?? noop },
);
function node(tag) {
  return {
    tagName: tag.toUpperCase(),
    style: {},
    children: [],
    append(...items) {
      this.children.push(...items);
    },
    replaceChildren() {
      this.children = [];
    },
    setAttribute: noop,
    addEventListener: noop,
    getContext: () => context,
    getBoundingClientRect: () => ({ width: 700, height: 350 }),
  };
}
const sandbox = {
  Astronomy,
  Date,
  Math,
  Number,
  document: { createElement: node },
  devicePixelRatio: 2,
};
vm.createContext(sandbox);
for (const name of ['model.js', 'observer.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../site/space/', name), 'utf8'), sandbox);
const diagram = sandbox.SolarSpaceObserver.create({ host: node('div') });
let count = 0,
  below = 0;
for (const stamp of [
  '1900-01-01T12:00:00Z',
  '2026-06-21T00:00:00Z',
  '2026-12-21T12:00:00Z',
  '2028-02-29T18:00:00Z',
  '2100-12-31T12:00:00Z',
]) {
  const date = new Date(stamp);
  for (const [lat, lon] of [
    [39.9, 116.4],
    [-33.9, 151.2],
    [0, 0],
    [89.99, 179.9],
    [-89.99, -179.9],
    [90, 0],
    [-90, 0],
  ]) {
    for (let selected = 0; selected < 8; selected++) {
      diagram.render({
        date,
        snapshot: sandbox.SolarSpaceModel.snapshot(date),
        observer: { lat, lon },
        view: selected === 2 ? 'earthmoon' : 'overview',
        selected,
        names: true,
      });
      const result = diagram.state();
      for (const entry of result.entries) {
        const observer = new Astronomy.Observer(lat, lon, 0);
        const eq = Astronomy.Equator(entry.id, date, observer, true, true);
        const horizon = Astronomy.Horizon(date, observer, eq.ra, eq.dec);
        assert(Math.abs(entry.altitude - horizon.altitude) < 1e-10);
        assert(Math.abs(entry.azimuth - horizon.azimuth) < 1e-10);
        assert(entry.altitude >= -90 && entry.altitude <= 90 && Number.isFinite(entry.azimuth));
        if (entry.altitude < 0) below++;
        count++;
      }
      if (selected === 2)
        assert(
          Math.abs(result.moonIllumination - Astronomy.Illumination('Moon', date).phase_fraction) <
            1e-12,
        );
    }
  }
}
diagram.render({
  date: new Date('bad'),
  observer: { lat: 0, lon: 0 },
  view: 'earthmoon',
  selected: 2,
});
assert.equal(diagram.state().entries.length, 0);
console.log(
  `PASS ${count} horizon values, ${below} below-horizon values retained, 35 lunar illumination cases, invalid dates, 1900–2100 and ±90° observer limits`,
);
