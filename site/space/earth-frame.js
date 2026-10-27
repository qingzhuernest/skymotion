/**
 * Earth body-fixed texture coordinates → the shared Three.js scene frame.
 * Local +X is Greenwich, +Y is north, +Z is 90° west. No texture-driven lighting shortcut.
 */
(function (global) {
  'use strict';
  const Engine = global.Astronomy;
  const Model = global.SolarSpaceModel;
  const radians = Math.PI / 180;
  const degrees = 180 / Math.PI;

  function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function frame(date, snapshot) {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime()))
      throw new TypeError('Earth orientation requires a finite UTC Date');
    const instant = new Date(date.getTime());
    const theta = Engine.SiderealTime(instant) * 15 * radians;
    const rotation = Engine.Rotation_EQD_EQJ(instant);
    const time = Engine.MakeTime(instant);
    function toScene(x, y, z) {
      return Model.sceneVector(Engine.RotateVector(rotation, new Engine.Vector(x, y, z, time)));
    }
    const localToScene = {
      x: toScene(Math.cos(theta), Math.sin(theta), 0),
      y: toScene(0, 0, 1),
      z: toScene(Math.sin(theta), -Math.cos(theta), 0),
    };
    // Consume exactly the same geometric Sun direction as the lights. The conventional
    // apparent Sun in the original laboratory includes aberration and differs by arcseconds.
    const sun = (snapshot || Model.snapshot(instant)).earthToSun;
    if (!sun || ![sun.x, sun.y, sun.z].every(Number.isFinite))
      throw new TypeError('Earth orientation requires a finite Sun direction');
    const length = Math.hypot(sun.x, sun.y, sun.z);
    if (!length) throw new TypeError('Sun direction cannot be zero');
    const localX = dot(sun, localToScene.x) / length;
    const localY = dot(sun, localToScene.y) / length;
    const localZ = dot(sun, localToScene.z) / length;
    const subsolar = {
      lat: Math.asin(Math.max(-1, Math.min(1, localY))) * degrees,
      lon: ((Math.atan2(-localZ, localX) * degrees + 540) % 360) - 180,
    };
    return { localToScene, north: { ...localToScene.y }, subsolar, date: instant };
  }

  global.SolarSpaceEarthFrame = { frame };
})(globalThis);
