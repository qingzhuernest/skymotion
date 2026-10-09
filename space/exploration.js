/** Selected-body history only. Ephemerides and display transforms belong to the shared model. */
(function (global) {
  'use strict';
  const Model = global.SolarSpaceModel;
  const Engine = global.Astronomy;
  const AU_KM = 149597870.7;
  const MOON_DISPLAY_SCALE = 2.4 / 0.002569555;
  const planetIds = new Set(Model.bodies.map((body) => body.id));

  function validVector(vector) {
    return vector && [vector.x, vector.y, vector.z].every(Number.isFinite);
  }

  function trail({ date, bodyId, days, segments = 96, frame = 'heliocentric' }) {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime()))
      throw new TypeError('Trail requires a finite UTC Date');
    if (!Number.isFinite(days) || days < 1 || days > 365)
      throw new RangeError('Trail days must be between 1 and 365');
    if (!Number.isInteger(segments) || segments < 2 || segments > 512)
      throw new RangeError('Trail segments must be an integer between 2 and 512');
    const moon = bodyId === 'Moon';
    if (!moon && !planetIds.has(bodyId)) throw new TypeError('Unsupported trail body');
    if (frame !== (moon ? 'geocentric' : 'heliocentric'))
      throw new TypeError('Moon trails are geocentric; planet trails are heliocentric');

    const end = new Date(date.getTime());
    const start = new Date(end.getTime() - days * Model.DAY_MS);
    if (!Number.isFinite(start.getTime())) throw new RangeError('Trail date interval is invalid');
    const points = Array.from({ length: segments + 1 }, (_, index) => {
      const instant = new Date(
        index === segments
          ? end.getTime()
          : start.getTime() + (index / segments) * (end.getTime() - start.getTime()),
      );
      const physical = Model.sceneVector(
        moon ? Engine.GeoMoon(instant) : Engine.HelioVector(bodyId, instant),
      );
      const display = moon
        ? {
            x: physical.x * MOON_DISPLAY_SCALE,
            y: physical.y * MOON_DISPLAY_SCALE,
            z: physical.z * MOON_DISPLAY_SCALE,
          }
        : Model.compress(physical);
      return { ...display, physical };
    });
    // Past → present, including both endpoints. Never synthesize a closing segment.
    return { points, start, end, days };
  }

  function actualDistance(snapshot, selected) {
    const bodyId =
      typeof selected === 'number' && Number.isInteger(selected)
        ? Model.bodies[selected]?.id
        : selected;
    const moon = bodyId === 'Moon';
    if (!moon && !planetIds.has(bodyId)) throw new TypeError('Unsupported distance body');
    const vector = moon
      ? snapshot?.moon
      : snapshot?.planets?.find((planet) => planet.id === bodyId)?.physical;
    if (!validVector(vector)) throw new TypeError('Distance requires a finite model snapshot');
    const distanceAU = Math.hypot(vector.x, vector.y, vector.z);
    return {
      bodyId,
      value: moon ? distanceAU * AU_KM : distanceAU,
      unit: moon ? 'km' : 'AU',
      reference: moon ? 'earth' : 'sun',
    };
  }

  global.SolarSpaceExploration = { trail, actualDistance };
})(globalThis);
