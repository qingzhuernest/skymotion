/** Reference transactions and old saves work without a browser or a second state model. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
context.window = context;
for (const name of ['diagram-tool-definitions', 'diagram-reference-store'])
  vm.runInContext(fs.readFileSync(`site/${name}.js`, 'utf8'), context);
const memory = () => {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
};
const storage = { localStorage: memory(), sessionStorage: memory() };
const create = () => context.SkyReferenceStore.create({ schema: context.SkyDiagramDefinitions,
  validDate: value => /^\d{4}-\d{2}-\d{2}$/.test(value), storage });
const model = { id: 'lab-sky', type: 'sky', body: 'sun', date: '2026-06-21', time: 720, lat: 39.9, lon: 116.4 };
const key = 'sky-diagram-tools-v1:lab-sky:sun';
const draftKey = 'sky-diagram-draft-v2:lab-sky:sun';
const raw = { id: 'a', type: 'time', label: 'Pinned', customLabel: true,
  name: 'Class A', time: 600, visible: true, locked: true };
const plain = value => JSON.parse(JSON.stringify(value));
storage.localStorage.setItem(key, JSON.stringify({ version: 1, objects: [raw] }));
const store = create(), state = store.stateFor(model);
assert.equal(store.stateFor({ ...model, date: '2026-12-21' }), state, 'one state per plot and body');
assert.equal(store.stateFor({ ...model, body: 'moon' }).objects.length, 0);
assert.equal(state.stored, true);
const definition = context.SkyDiagramDefinitions.forModel(model).find(d => d.id === 'time');
assert.equal(store.create(definition, model, []).time, 720);
assert.equal(store.create(definition, model, [{type:'time', copyNumber:9, customLabel:true}]).label, definition.title);
assert.equal(store.create(definition, model, [{type:'time', copyNumber:3}]).copyNumber, 4);
const created = store.create(definition, model, [], {label:'Annotation',customLabel:true,name:''});
assert.equal(created.name, '');

assert.equal(store.clean([{ ...raw, name: '' }], model)[0].name, '', 'an explicitly cleared list name stays independent of its annotation');
const before = plain(state.objects), duplicate = store.duplicate(state, state.objects[0], model);
assert.equal(duplicate.name, 'Class A 2');
assert.equal(duplicate.label, 'Pinned 2');
assert.equal(duplicate.locked, false);
assert.notEqual(duplicate.id, raw.id);
state.objects.push(duplicate);
assert.equal(store.record(state, before, raw.id, model), true);
assert.equal(store.travel(model, 'undo', duplicate.id), true);
assert.deepEqual(plain(state.objects), before);
assert.equal(state.lastSelected, raw.id);
assert.equal(store.travel(model, 'redo', raw.id), true);
assert.equal(state.lastSelected, duplicate.id);
assert.equal(store.record(state, plain(state.objects), duplicate.id, model), false);
assert.equal(create().stateFor(model).objects.length, 2, 'session draft precedes the old save');
const savedBefore = state.saved;
const local = storage.localStorage;
storage.localStorage = { setItem() { throw new Error('quota'); } };
assert.throws(() => store.save(model), /quota/);
assert.equal(state.saved, savedBefore, 'failed writes must not mark a draft saved');
storage.localStorage = local;
store.save(model);
assert.equal(state.repairNeeded, false);
assert.equal(JSON.parse(local.getItem(key)).objects.length, 2);
const restore = store.checkpoint();
const extra = { ...model, id: 'chart', type: 'altitude' };
store.stateFor(extra).objects.push({ ...raw, id: 'new' });
store.persist(extra, store.stateFor(extra));
state.objects.length = 0;
restore();
assert.equal(store.stateFor(model).objects.length, 2);
assert.equal(storage.sessionStorage.getItem('sky-diagram-draft-v2:chart:sun'), null);
assert.equal([...store.values()].some(s => s.model.id === 'chart'), false);
// A new edit after undo discards redo; retained history remains bounded.
const active = store.stateFor(model);
for (let i = 0; i < 35; i++) {
  const previous = plain(active.objects);
  active.objects[0].time = i;
  store.record(active, previous, raw.id, model);
}
assert.equal(active.undo.length, 30);
store.travel(model, 'undo', raw.id);
const previous = plain(active.objects);
active.objects[0].time = 700;
store.record(active, previous, raw.id, model);
assert.equal(active.redo.length, 0);
// Damaged saves cannot erase a valid draft or leak into another plot.
local.setItem(key, '{broken');
assert.equal(create().stateFor(model).objects.length, 2);
storage.sessionStorage.removeItem(draftKey);
const damaged = create().stateFor(model);
assert.equal(damaged.objects.length, 0);
assert.equal(damaged.repairNeeded, true);
console.log('PASS shared reference state, legacy saves, draft precedence, naming, undo/redo, quota failure and checkpoint rollback');
