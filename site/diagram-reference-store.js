/** Reference state, persistence and history; independent of editor DOM and drawing. */
(() => {
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const stableJSON = (value) => JSON.stringify(value, (key, item) =>
    !item || Array.isArray(item) || typeof item !== 'object' ? item :
      Object.fromEntries(Object.keys(item).sort().map((name) => [name, item[name]])));
  function create({ schema, validDate, storage = globalThis }) {
    const states = new Map();
    let serial = 0;
    const nextId = () => 'd' + Date.now() + ++serial;
    const draftKey = (m) => 'sky-diagram-draft-v2:' + m.id + ':' + (m.body || 'shared');
    function persist(m, s) {
      try {
        storage.sessionStorage.setItem(
          draftKey(m),
          JSON.stringify({ version: 1, objects: s.objects }),
        );
      } catch {}
    }
    function stateFor(m) {
      const key = m.id + ':' + (m.body || 'shared');
      if (!states.has(key)) {
        let objects = [],
          stored = false,
          repairNeeded = false;
        try {
          const raw = storage.localStorage.getItem('sky-diagram-tools-v1:' + key);
          if (raw !== null) {
            try {
              const v = JSON.parse(raw);
              if (v?.version === 1 && Array.isArray(v.objects)) {
                objects = clean(v.objects, m);
                stored = true;
                repairNeeded = stableJSON(objects) !== stableJSON(v.objects);
              } else repairNeeded = true;
            } catch {
              repairNeeded = true;
            }
          }
        } catch {}
        const saved = JSON.stringify(objects);
        try {
          const v = JSON.parse(storage.sessionStorage.getItem(draftKey(m)));
          if (v?.version === 1 && Array.isArray(v.objects)) objects = clean(v.objects, m);
        } catch {}
        states.set(key, { objects, undo: [], redo: [], stored, saved, repairNeeded });
      }
      const entry = states.get(key);
      entry.model = { id: m.id, type: m.type, body: m.body || 'shared' };
      return entry;
    }
    function clean(objects, model) {
      return schema.normalize(objects, model, {
        validDate,
        nextId,
      });
    }
    const numberedLabel = (title, number) =>
      title.split('|').map((text) => text + ' ' + number).join('|');
    const siblings = (objects, type) => objects.filter((o) => o.type === type && !o.customLabel);
    const nextNumber = (objects) => Math.max(1, ...objects.map((o) => o.copyNumber || 1)) + 1;
    function createReference(definition, model, objects, values = {}) {
      const object = {
        id: nextId(), type: definition.id, label: definition.title,
        visible: true, locked: false, customLabel: false,
      };
      for (const field of definition.fields) {
        const value = ['date', 'time', 'lat', 'lon'].includes(field.value)
          ? model[field.value] : field.value;
        object[field.name] = value ?? field.value;
      }
      if (model.type === 'analemma' && definition.id === 'track') {
        object.clock = model.clock ?? 720;
        object.basis = model.basis || 'clock';
        object.offset = model.offset ?? 8;
      }
      Object.assign(object, values);
      const related = siblings(objects, definition.id);
      if (!object.customLabel && related.length) {
        object.copyNumber = nextNumber(related);
        if (values.label === undefined)
          object.label = numberedLabel(definition.title, object.copyNumber);
      }
      if (object.autoLabel) {
        const base = object.autoLabel;
        let candidate = base, number = 1;
        while (objects.some((o) => (o.autoLabel || o.label) === candidate))
          candidate = numberedLabel(base, ++number);
        object.label = object.autoLabel = candidate;
      }
      if (object.customLabel && object.name === undefined) object.name = object.label;
      return object;
    }
    function duplicateReference(s, object, model) {
      const duplicate = { ...copy(object), id: nextId(), locked: false };
      for (const field of ['name', ...(object.customLabel ? ['label'] : [])]) {
        if (!object[field]) continue;
        let number = 2;
        while (s.objects.some((other) => other[field] === object[field] + ' ' + number))
          number++;
        duplicate[field] = object[field] + ' ' + number;
      }
      if (!object.customLabel) {
        duplicate.copyNumber = nextNumber(siblings(s.objects, object.type));
        const title = object.autoLabel
          ? object.autoLabel.split('|').map((text) => text.replace(/ \d+$/, '')).join('|')
          : schema.forModel(model).find((definition) => definition.id === object.type).title;
        duplicate.label = numberedLabel(title, duplicate.copyNumber);
        if (object.autoLabel) duplicate.autoLabel = duplicate.label;
      }
      return duplicate;
    }
    function saveReferences(model) {
      const s = stateFor(model), saved = JSON.stringify(s.objects);
      storage.localStorage.setItem(
        'sky-diagram-tools-v1:' + model.id + ':' + (model.body || 'shared'),
        JSON.stringify({ version: 1, objects: s.objects }),
      );
      Object.assign(s, { saved, stored: true, repairNeeded: false });
    }
    function travelReferences(model, from, selection) {
      const s = stateFor(model);
      if (!s[from].length) return false;
      s[from === 'undo' ? 'redo' : 'undo'].push({ objects: copy(s.objects), selected: selection });
      const snapshot = s[from].pop();
      s.objects = snapshot.objects;
      s.lastSelected = s.objects.some((object) => object.id === snapshot.selected)
        ? snapshot.selected : null;
      persist(model, s);
      return true;
    }
    function record(s, before, beforeSelected, model) {
      if (JSON.stringify(before) === JSON.stringify(s.objects)) return false;
      s.undo.push({ objects: before, selected: beforeSelected });
      if (s.undo.length > 30) s.undo.shift();
      s.redo = [];
      persist(model, s);
      return true;
    }
    function checkpoint() {
      const previous = copy([...states]);
      const previousSerial = serial;
      return () => {
        const keys = new Set(previous.map(([key]) => key));
        for (const [key, saved] of states)
          if (!keys.has(key)) {
            try {
              storage.sessionStorage.removeItem(draftKey(saved.model));
            } catch {}
          }
        states.clear();
        for (const [key, saved] of previous) {
          states.set(key, saved);
          persist(saved.model, saved);
        }
        serial = previousSerial;
      };
    }
    return Object.freeze({ stateFor, clean, persist, nextId, record,
      create: createReference, duplicate: duplicateReference, save: saveReferences, travel: travelReferences,
      checkpoint, values: () => states.values() });
  }
  globalThis.SkyReferenceStore = Object.freeze({ create });
})();
