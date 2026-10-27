/** Versioned laboratory sessions; reject invalid fields without changing valid observations. */
(() => {
  'use strict';
  const version = 1,
    key = 'skyLabSession';
  let memory = null,
    memoryOnly = false;
  const record = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
  const inRange = (value, low, high) =>
    Number.isFinite(value) && value >= low && value <= high;
  function validDate(value) {
    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      value < '1900-01-01' ||
      value > '2100-12-31'
    )
      return false;
    const date = new Date(value + 'T12:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  // BEGIN GENERATED STATE SCHEMA
  // prettier-ignore
  const ranges = {
    "lat": [
      -90,
      90
    ],
    "lon": [
      -180,
      180
    ],
    "dec": [
      -23.44,
      23.44
    ],
    "time": [
      0,
      1440
    ],
    "observerAz": [
      0,
      360
    ],
    "yaw": [
      -1000000,
      1000000
    ],
    "pitch": [
      0.05,
      1.45
    ],
    "zoom": [
      0.65,
      1.35
    ],
    "height": [
      0.1,
      10
    ],
    "sundialOffset": [
      -12,
      14
    ],
    "globeCameraLat": [
      -90,
      90
    ],
    "globeCameraLon": [
      -180,
      180
    ],
    "analemmaClock": [
      0,
      1440
    ],
    "analemmaOffset": [
      -12,
      14
    ],
    "analemmaYaw": [
      -1000000,
      1000000
    ],
    "analemmaPitch": [
      0.08,
      1.45
    ],
    "analemmaZoom": [
      0.65,
      1.15
    ],
    "analemmaTilt": [
      0,
      45
    ],
    "analemmaEccentricity": [
      0,
      0.1
    ]
  };
  // prettier-ignore
  const choices = {
    "view": [
      "orbit",
      "top",
      "horizon",
      "observer"
    ],
    "earthView": [
      "globe",
      "map"
    ],
    "globeDragMode": [
      "view",
      "location"
    ],
    "observerTimeBasis": [
      "solar",
      "utc"
    ],
    "observerConstraint": [
      "free",
      "latitude",
      "longitude"
    ],
    "analemmaBasis": [
      "clock",
      "apparent"
    ],
    "analemmaView": [
      "dome",
      "sky",
      "equatorial"
    ],
    "planet": [
      "Mercury",
      "Venus",
      "Mars",
      "Jupiter",
      "Saturn"
    ],
    "shadowZoom": [
      1,
      2,
      4,
      8,
      16
    ],
    "speed": [
      20,
      60,
      180
    ],
    "daysRate": [
      0.5,
      1,
      3
    ],
    "solarDateRate": [
      1,
      3,
      10
    ]
  };
  // prettier-ignore
  const cameraFields = [
    "yaw",
    "pitch",
    "zoom",
    "globeCameraLat",
    "globeCameraLon",
    "globeCameraReady",
    "analemmaYaw",
    "analemmaPitch",
    "analemmaZoom"
  ];
  // END GENERATED STATE SCHEMA
  function searchResult(value) {
    if (
      !record(value) ||
      !['date', 'fromDate', 'toDate'].every((field) => validDate(value[field])) ||
      !choices.planet.includes(value.body) ||
      !inRange(value.lat, -90, 90) ||
      !inRange(value.lon, -180, 180) ||
      !inRange(value.time, 0, 1440) ||
      !inRange(value.separation, 0, 180) ||
      value.fromDate > value.toDate
    )
      return null;
    return Object.fromEntries(
      ['date', 'fromDate', 'toDate', 'body', 'lat', 'lon', 'time', 'separation'].map(
        (field) => [field, value[field]],
      ),
    );
  }
  function sanitizeMode(source, defaults) {
    const result = { ...defaults, playing: false, solarDateLinkBackup: null };
    if (!record(source)) return result;
    for (const field of Object.keys(defaults)) {
      // Normalize the former workspace token to the sampler's canonical value.
      const value =
        field === 'analemmaBasis' && source[field] === 'solar'
          ? 'apparent'
          : source[field];
      if (
        field === 'body' ||
        field === 'playing' ||
        field === 'solarDateLinkBackup' ||
        field === 'place'
      )
        continue;
      if (field === 'date') {
        if (validDate(value)) result[field] = value;
      } else if (field === 'companionSearchResult') result[field] = searchResult(value);
      else if (ranges[field]) {
        if (inRange(value, ...ranges[field])) result[field] = value;
      } else if (choices[field]) {
        if (choices[field].includes(value)) result[field] = value;
      } else if (typeof defaults[field] === 'boolean' && typeof value === 'boolean')
        result[field] = value;
    }
    const place = typeof source.place === 'string' ? source.place : defaults.place;
    const coords = place.split(',').map(Number);
    result.place =
      coords.length === 2 &&
      coords.every(Number.isFinite) &&
      coords[0] === result.lat &&
      coords[1] === result.lon
        ? place
        : 'custom';
    return result;
  }
  function read() {
    let value;
    try {
      value = memoryOnly ? memory : JSON.parse(sessionStorage.getItem(key) || 'null');
    } catch {
      value = memory;
    }
    if (
      !record(value) ||
      (value.schemaVersion !== undefined && value.schemaVersion !== version)
    )
      return null;
    return value;
  }
  function write(value) {
    const payload = { ...value, schemaVersion: version };
    // A detached JSON snapshot keeps memory fallback from following later state mutations.
    try {
      const serialized = JSON.stringify(payload);
      memory = JSON.parse(serialized);
      try {
        sessionStorage.setItem(key, serialized);
        memoryOnly = false;
      } catch {
        memoryOnly = true;
      }
      return true;
    } catch {
      return false;
    }
  }
  // Capture every participant before committing any of them. Checkpoints restore
  // owner-local state, including undo stacks, rather than re-importing saved data.
  function transaction(steps) {
    const rollback = [];
    try {
      for (const step of steps) rollback.push(step.checkpoint());
    } catch (error) {
      return { ok: false, error, rollbackErrors: [] };
    }
    try {
      for (const step of steps)
        if (step.apply() === false) throw new Error('Experiment restore rejected');
      return { ok: true };
    } catch (error) {
      const rollbackErrors = [];
      for (const restore of rollback.reverse()) {
        try {
          restore();
        } catch (failure) {
          rollbackErrors.push(failure);
        }
      }
      return { ok: false, error, rollbackErrors };
    }
  }
  window.SkyMotionSession = {
    read,
    write,
    sanitizeMode,
    validDate,
    inRange,
    version,
    cameraFields,
    transaction,
  };
})();
