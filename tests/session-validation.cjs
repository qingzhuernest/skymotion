/** Session corruption, legacy migration, valid observations and unavailable storage. */
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const app = fs.readFileSync('app.js', 'utf8').split('const seasons =')[0];
function load(storage) {
  const context = vm.createContext({ window: {}, document: {}, sessionStorage: storage });
  vm.runInContext(app + '\nwindow.defaults = { sun: initialSun, moon: initialMoon };', context);
  vm.runInContext(fs.readFileSync('experiment-storage.js', 'utf8'), context);
  return { api: context.window.SkyMotionSession, defaults: context.window.defaults };
}
let raw = '{broken';
const {api, defaults} = load({getItem: () => raw, setItem: (_, value) => {raw = value}});
assert.equal(api.read(), null);
raw = JSON.stringify({schemaVersion: 999, sun: {lat: 80}});
assert.equal(api.read(), null);
for (const value of [null, [], 42, 'invalid']) assert.equal(api.sanitizeMode(value, defaults.sun).lat, 39.9);
const invalid = api.sanitizeMode({lat: 999, lon: Infinity, date: '2023-02-29', time: -1, speed: 0, height: '5', view: 'invalid', planet: 'Earth', playing: true, analemmaEccentricity: NaN, companionSearchResult: {separation: 'oops'}}, defaults.moon);
for (const field of ['lat','lon','date','time','speed','height','view','planet','analemmaEccentricity']) assert.equal(invalid[field], defaults.moon[field], field);
assert.equal(invalid.playing, false);
assert.equal(invalid.companionSearchResult, null);
for(const date of ['1900-02-29','2101-01-01','2024-04-31','2024-1-01'])assert.equal(api.validDate(date),false);
for(const date of ['1900-01-01','2000-02-29','2024-02-29','2100-12-31'])assert.equal(api.validDate(date),true);
const valid = {...defaults.moon,lat:-90,lon:-180,date:'2024-02-29',time:1440,view:'observer',earthView:'map',planet:'Saturn',shadowZoom:16,place:'custom',companionSearchResult:{date:'2024-02-29',fromDate:'2024-02-01',toDate:'2024-03-01',body:'Saturn',lat:-90,lon:-180,time:1440,separation:2}};
raw = JSON.stringify({moon:valid,body:'moon'});
assert.equal(api.read().body,'moon'); // Unversioned production sessions remain readable.
const restored = api.sanitizeMode(api.read().moon,defaults.moon);
for(const field of ['lat','lon','date','time','view','earthView','planet','shadowZoom'])assert.equal(restored[field],valid[field],field);
assert.equal(restored.companionSearchResult.separation,2);
assert.equal(api.write({body:'moon',moon:valid}),true);
assert.equal(JSON.parse(raw).schemaVersion,1);
const blocked = load({getItem(){throw Error('denied')},setItem(){throw Error('denied')}}).api;
assert.equal(blocked.read(),null);assert(blocked.write({body:'sun',sun:valid}));valid.lat=0;assert.equal(blocked.read().sun.lat,-90);
const quota = load({getItem:()=>null,setItem(){throw Error('quota')}}).api;
assert(quota.write({body:'moon'}));assert.equal(quota.read().body,'moon');
console.log('PASS invalid session fields, legacy/versioned data, leap days, valid observations and storage-denied/quota fallback');

for (const basis of ['clock', 'apparent']) assert.equal(api.sanitizeMode({analemmaBasis:basis},defaults.sun).analemmaBasis,basis);
assert.equal(api.sanitizeMode({analemmaBasis:'solar'},defaults.sun).analemmaBasis,'apparent');
