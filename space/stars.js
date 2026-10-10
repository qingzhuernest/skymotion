/** HYG J2000 reference sky. Apparent size and exposure are display choices, not stellar radii. */
(function (global) {
  'use strict';
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  function temperature(bv) {
    if (!Number.isFinite(bv)) return 6500;
    const colorIndex = clamp(bv, -0.4, 2);
    return 4600 * (1 / (0.92 * colorIndex + 1.7) + 1 / (0.92 * colorIndex + 0.62));
  }
  function color(bv) {
    // B−V → approximate blackbody colour; it does not model a telescope/filter response.
    const t = clamp(temperature(bv), 1800, 40000) / 100;
    const red = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
    const green =
      t <= 66
        ? 99.4708025861 * Math.log(t) - 161.1195681661
        : 288.1221695283 * (t - 60) ** -0.0755148492;
    const blue = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    return [red, green, blue].map((channel) => clamp(channel / 255, 0, 1));
  }
  function direction(raHours, decDegrees, Model, Engine) {
    const ra = (raHours * Math.PI) / 12;
    const dec = (decDegrees * Math.PI) / 180;
    return Model.sceneVector(
      new Engine.Vector(
        Math.cos(dec) * Math.cos(ra),
        Math.cos(dec) * Math.sin(ra),
        Math.sin(dec),
        Engine.MakeTime(new Date('2000-01-01T12:00:00Z')),
      ),
    );
  }

  function create(THREE, renderer, Model, Engine, invalidate) {
    const group = new THREE.Group();
    let skyGeometry = null,
      ordinaryCount = 0;
    const uniforms = {
      pixelRatio: { value: renderer.getPixelRatio() },
      skyExposure: { value: 1 },
      magnitudeLimit: { value: 6.5 },
    };
    const ready = fetch('assets/stars.json')
      .then((response) => {
        if (!response.ok) throw new Error('Star catalog unavailable');
        return response.json();
      })
      .then((catalog) => {
        if (catalog.epoch !== 'J2000' || !Array.isArray(catalog.stars))
          throw new Error('Invalid star catalog');
        const positions = [],
          colors = [],
          sizes = [],
          brightness = [],
          magnitudes = [];
        for (const [ra, dec, magnitude, bv] of catalog.stars) {
          if (
            ![ra, dec, magnitude].every(Number.isFinite) ||
            ra < 0 ||
            ra >= 24 ||
            Math.abs(dec) > 90
          )
            continue;
          const v = direction(ra, dec, Model, Engine);
          positions.push(v.x * 400, v.y * 400, v.z * 400);
          const rgb = color(bv);
          const linear = new THREE.Color().setRGB(...rgb, THREE.SRGBColorSpace);
          colors.push(linear.r, linear.g, linear.b);
          // Compress the magnitude range for a readable teaching display.
          sizes.push(2.6 + 9 * 10 ** (-0.2 * (magnitude + 1.5)));
          magnitudes.push(magnitude);
          brightness.push(clamp(10 ** (-0.16 * (magnitude - 1.5)), 0.03, 1));
        }
        ordinaryCount = magnitudes.filter((magnitude) => magnitude <= 6.5).length;
        const geometry = new THREE.BufferGeometry();
        skyGeometry = geometry;
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('starColor', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('starSize', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('starMagnitude', new THREE.Float32BufferAttribute(magnitudes, 1));
        geometry.setAttribute('starBrightness', new THREE.Float32BufferAttribute(brightness, 1));
        const material = new THREE.ShaderMaterial({
          uniforms,
          transparent: true,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
          vertexShader: `
            attribute vec3 starColor;
            attribute float starSize;
            attribute float starBrightness;
            attribute float starMagnitude;
            uniform float magnitudeLimit;
            uniform float pixelRatio;
            varying vec3 tint;
            varying float strength;
            varying float visibleStar;
            void main() {
              tint = starColor;
              strength = starBrightness;
              visibleStar = step(starMagnitude, magnitudeLimit);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = starSize * pixelRatio;
            }
          `,
          fragmentShader: `
            uniform float skyExposure;
            varying vec3 tint;
            varying float strength;
            varying float visibleStar;
            void main() {
              if (visibleStar < 0.5) discard;
              vec2 point = gl_PointCoord - vec2(0.5);
              float radius2 = dot(point, point);
              if (radius2 > 0.25) discard;
              float edge = 1.0 - smoothstep(0.15, 0.25, radius2);
              float core = exp(-40.0 * radius2);
              float halo = exp(-14.0 * radius2) * 0.18;
              gl_FragColor = vec4(tint, min(1.0, (core + halo) * strength * skyExposure) * edge);
              #include <colorspace_fragment>
            }
          `,
        });
        const points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        group.add(points);
        invalidate();
        return positions.length / 3;
      })
      .catch(() => 0); // The scientific scene keeps working if the optional local sky cannot load.
    return {
      group,
      ready,
      follow(camera) {
        // Stars are effectively at infinity: moving/zooming the camera must not create nearby-star parallax.
        group.position.copy(camera.position);
        uniforms.pixelRatio.value = renderer.getPixelRatio();
        // Raise the display exposure in immersive mode, without inventing
        // extra catalogue stars or changing their J2000 directions/colours.
        const immersive = document.body.classList.contains('space-immersive');
        uniforms.skyExposure.value = immersive ? 4.2 : 1;
        uniforms.magnitudeLimit.value = immersive ? 8.5 : 6.5;
        // The catalog is sorted by magnitude: ordinary mode submits only the bright prefix.
        skyGeometry?.setDrawRange(0, immersive ? Infinity : ordinaryCount);
      },
    };
  }
  global.SolarSpaceStars = { create, temperature, color, direction };
})(globalThis);
