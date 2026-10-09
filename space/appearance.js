/**
 * Planet appearance only. Textures are original, deterministic visual illustrations;
 * this module never reads dates, alters ephemerides, rotates bodies or starts an animation.
 * Coordinates of clouds, craters and ring texture are not a geographical dataset.
 */
(function (global) {
  'use strict';
  const WIDTH = 1024;
  const HEIGHT = 512;
  const TAU = Math.PI * 2;
  const cached = new Map();
  let field;
  let fineField;

  function clamp(value, low = 0, high = 1) {
    return Math.min(high, Math.max(low, value));
  }
  function noiseField() {
    if (field) return field;
    field = new Float32Array(WIDTH * HEIGHT);
    fineField = new Float32Array(WIDTH * HEIGHT);
    // Integer longitudinal frequencies make the texture continuous across its UV seam.
    for (let y = 0; y < HEIGHT; y++) {
      const latitude = (y / (HEIGHT - 1) - 0.5) * Math.PI;
      for (let x = 0; x < WIDTH; x++) {
        const longitude = (x / WIDTH) * TAU;
        let sum = 0;
        for (let octave = 0; octave < 5; octave++) {
          const frequency = 2 ** octave;
          sum +=
            (Math.sin(longitude * frequency + 2.3 * Math.sin(latitude * frequency * 1.7)) *
              Math.cos(latitude * frequency * 2.9 + octave * 1.91)) /
            frequency;
        }
        field[y * WIDTH + x] = sum / 1.9375;
        fineField[y * WIDTH + x] =
          Math.sin(longitude * 177 + Math.sin(latitude * 111) * 4) *
          Math.cos(latitude * 169 + Math.sin(longitude * 63)) *
          0.024;
      }
    }
    return field;
  }
  function random(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }
  function canvasPixels(width = WIDTH, height = HEIGHT) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    return { canvas, context, image: context.createImageData(width, height) };
  }
  function texture(canvas, THREE, renderer, color = true) {
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    result.wrapS = THREE.RepeatWrapping;
    result.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return result;
  }
  function mix(a, b, fraction) {
    return a.map((value, index) => value + (b[index] - value) * clamp(fraction));
  }
  function craters(height, seed) {
    const next = random(seed);
    for (let crater = 0; crater < 320; crater++) {
      const cx = next() * WIDTH;
      const cy = (0.08 + next() * 0.84) * HEIGHT;
      const radius = 2 + next() ** 3 * 24;
      const flatten = Math.max(0.35, Math.cos((cy / HEIGHT - 0.5) * Math.PI));
      const rx = radius / flatten;
      for (let dy = -Math.ceil(radius * 1.25); dy <= radius * 1.25; dy++) {
        const y = Math.round(cy + dy);
        if (y < 0 || y >= HEIGHT) continue;
        for (let dx = -Math.ceil(rx * 1.25); dx <= rx * 1.25; dx++) {
          const distance = Math.hypot(dx * flatten, dy) / radius;
          if (distance > 1.25) continue;
          const x = ((Math.round(cx + dx) % WIDTH) + WIDTH) % WIDTH;
          const rim = Math.exp(-(((distance - 0.94) / 0.11) ** 2)) * 0.14;
          const basin = -Math.exp(-((distance / 0.72) ** 4)) * 0.18;
          height[y * WIDTH + x] += rim + basin;
        }
      }
    }
  }
  function makeSurface(id, THREE, renderer) {
    if (cached.has(id)) return cached.get(id);
    const noise = noiseField();
    const relief = new Float32Array(noise);
    if (id === 'Moon' || id === 'Mercury') craters(relief, id === 'Moon' ? 2105 : 1021);
    const color = canvasPixels();
    const bump = canvasPixels();
    for (let y = 0; y < HEIGHT; y++) {
      const latitude = (y / (HEIGHT - 1) - 0.5) * Math.PI;
      for (let x = 0; x < WIDTH; x++) {
        const index = y * WIDTH + x;
        const longitude = (x / WIDTH) * TAU;
        const n = noise[index];
        const fine = fineField[index];
        let rgb;
        if (id === 'Mercury') {
          rgb = mix([91, 85, 79], [180, 170, 156], 0.49 + relief[index] * 0.46 + fine);
        } else if (id === 'Moon') {
          // Broad dark basaltic maria are illustrative, not an identified lunar map.
          const maria = clamp((-n - 0.18) * 3.8);
          rgb = mix([177, 176, 168], [73, 78, 78], maria);
          rgb = rgb.map((value) => value + (relief[index] - n) * 65 + fine * 180);
        } else if (id === 'Mars') {
          rgb = mix([82, 51, 38], [205, 137, 92], 0.63 + n * 0.6 + fine * 1.7);
          const cap = clamp((Math.abs(latitude) - 1.33 + n * 0.04) * 14);
          rgb = mix(rgb, [226, 220, 200], cap);
        } else if (id === 'Venus') {
          const cloud = 0.55 + 0.24 * Math.sin(latitude * 7 + n * 2.6) + n * 0.3;
          rgb = mix([162, 143, 109], [246, 231, 189], cloud);
        } else if (id === 'Jupiter' || id === 'Saturn') {
          const jupiter = id === 'Jupiter';
          const turbulence =
            Math.sin(longitude * 13 + Math.sin(latitude * 29) * 2.2) *
            Math.cos(latitude * 23 + Math.sin(longitude * 9)) *
            0.2;
          const warp = latitude * (jupiter ? 27 : 36) + n * (jupiter ? 1.8 : 0.8) + turbulence;

          const band = Math.sin(warp) * 0.25 + Math.sin(warp * 2.7 + n) * 0.1;
          rgb = jupiter
            ? mix([137, 100, 77], [232, 221, 196], 0.56 + band * 0.77 + n * 0.12 + fine * 1.8)
            : mix([168, 146, 103], [230, 217, 178], 0.66 + band * 0.65 + n * 0.1 + fine * 0.8);
          if (jupiter) {
            const dx = Math.atan2(Math.sin(longitude - 4.85), Math.cos(longitude - 4.85));
            const dy = latitude + 0.37;
            const storm = Math.hypot(
              (dx + Math.sin(dy * 39) * 0.013) / 0.26,
              (dy + Math.sin(dx * 31) * 0.007) / 0.115,
            );
            const edge = clamp((1.13 - storm + turbulence * 0.25) * 3.2);
            const swirl = Math.sin(storm * 17 + Math.atan2(dy, dx) * 3 + turbulence * 3) * 0.18;
            rgb = mix(rgb, mix([173, 104, 77], [210, 154, 110], 0.4 + swirl), edge);
          }
        } else if (id === 'Uranus' || id === 'Neptune') {
          const uranus = id === 'Uranus';
          const haze = 0.57 + Math.sin(latitude * 12 + n * 0.8) * 0.055 + n * 0.035;
          rgb = uranus
            ? mix([100, 164, 173], [173, 212, 212], haze)
            : mix([66, 111, 148], [136, 172, 189], haze);
          if (!uranus) {
            const clouds = clamp((n + Math.sin(latitude * 26) * 0.08 - 0.57) * 2) * 0.28;
            rgb = mix(rgb, [211, 226, 229], clouds);
          }
        } else {
          rgb = mix([239, 164, 56], [255, 234, 174], 0.62 + n * 0.18 + fine * 2);
        }
        const offset = index * 4;
        for (let channel = 0; channel < 3; channel++) {
          color.image.data[offset + channel] = clamp(rgb[channel], 0, 255);
          bump.image.data[offset + channel] = clamp(128 + relief[index] * 66 + fine * 220, 0, 255);
        }
        color.image.data[offset + 3] = bump.image.data[offset + 3] = 255;
      }
    }
    color.context.putImageData(color.image, 0, 0);
    bump.context.putImageData(bump.image, 0, 0);
    const rocky = ['Mercury', 'Mars', 'Moon'].includes(id);
    const result = {
      map: texture(color.canvas, THREE, renderer),
      bumpMap: rocky ? texture(bump.canvas, THREE, renderer, false) : null,
    };
    cached.set(id, result);
    return result;
  }

  function ring(THREE, renderer) {
    const strip = canvasPixels(1024, 1);
    const next = random(6221);
    for (let x = 0; x < 1024; x++) {
      const r = x / 1023;
      const density = 0.6 + Math.sin(r * 176) * 0.13 + Math.sin(r * 721) * 0.07 + next() * 0.1;
      const gap = r > 0.785 && r < 0.827;
      const edge = clamp(r * 25) * clamp((1 - r) * 25);
      const shade = r < 0.31 ? 0.67 : r > 0.827 ? 0.82 : 1;
      strip.image.data.set(
        [208 * shade, 195 * shade, 160 * shade, gap ? 7 : density * edge * 255],
        x * 4,
      );
    }
    strip.context.putImageData(strip.image, 0, 0);
    const geometry = new THREE.RingGeometry(1.08, 1.85, 160);
    const position = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    for (let i = 0; i < position.count; i++) {
      uv.setXY(i, (Math.hypot(position.getX(i), position.getY(i)) - 1.08) / 0.77, 0.5);
    }
    const ringTexture = texture(strip.canvas, THREE, renderer);
    ringTexture.wrapS = THREE.ClampToEdgeWrapping;
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        map: ringTexture,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide,
        roughness: 1,
        depthWrite: false,
      }),
    );
    // Preserve the existing illustrative ring orientation. No physical pole claim.
    mesh.rotation.x = -Math.PI / 2 + 0.47;
    return mesh;
  }

  function atmosphericEdge(radius, THREE) {
    // A thin visual shell only: Earth geometry, picking and illumination remain intact.
    // The same active scene lights gate the effect to the lit side. Ambient light is
    // deliberately excluded so a decorative rim cannot turn the night side into day.
    const material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        { rimColor: { value: new THREE.Color(0x6da8df) } },
      ]),
      lights: true,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      vertexShader: `
        varying vec3 edgeNormal;
        varying vec3 edgeView;
        void main() {
          vec4 positionView = modelViewMatrix * vec4(position, 1.0);
          edgeNormal = normalize(normalMatrix * normal);
          edgeView = -positionView.xyz;
          gl_Position = projectionMatrix * positionView;
        }
      `,
      fragmentShader: `
        #include <common>
        #include <lights_pars_begin>
        uniform vec3 rimColor;
        varying vec3 edgeNormal;
        varying vec3 edgeView;
        void main() {
          vec3 normalView = normalize(edgeNormal);
          float daylight = 0.0;
          #if NUM_POINT_LIGHTS > 0
          for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
            vec3 lightDirection = normalize(pointLights[i].position + edgeView);
            float strength = min(length(pointLights[i].color), 1.0);
            daylight = max(daylight, max(dot(normalView, lightDirection), 0.0) * strength);
          }
          #endif
          #if NUM_DIR_LIGHTS > 0
          for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
            float strength = min(length(directionalLights[i].color), 1.0);
            daylight = max(daylight, max(dot(normalView, directionalLights[i].direction), 0.0) * strength);
          }
          #endif
          float rim = pow(1.0 - max(dot(normalView, normalize(edgeView)), 0.0), 5.0);
          float opacity = rim * smoothstep(0.01, 0.32, daylight) * 0.14;
          if (opacity < 0.001) discard;
          gl_FragColor = vec4(rimColor, opacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const edge = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.014, 48, 32), material);
    edge.name = 'illustrative-lit-atmosphere';
    // Decorations must not intercept existing planet selection raycasts.
    edge.raycast = () => {};
    return edge;
  }

  function create(spec, THREE, renderer, invalidate) {
    let maps;
    if (spec.id === 'Earth') {
      const map = new THREE.TextureLoader().load('../earth.jpg', invalidate);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      maps = { map };
    } else {
      maps = makeSurface(spec.id, THREE, renderer);
    }
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      ...maps,
      roughness: spec.id === 'Earth' ? 0.82 : 0.97,
      bumpScale: spec.size * 0.004,
      metalness: 0,
    });
    return {
      material,
      geometry: new THREE.SphereGeometry(spec.size, 72, 48),
      decorate(mesh) {
        if (spec.id === 'Saturn') mesh.add(ring(THREE, renderer));
        if (spec.id === 'Earth') mesh.add(atmosphericEdge(spec.size, THREE));
      },
    };
  }
  function moon(THREE, renderer, radius = 0.12) {
    return {
      geometry: new THREE.SphereGeometry(radius, 72, 48),
      material: new THREE.MeshStandardMaterial({
        ...makeSurface('Moon', THREE, renderer),
        roughness: 1,
        bumpScale: radius * 0.006,
      }),
    };
  }
  function sun(THREE, renderer, radius = 1.05) {
    return {
      geometry: new THREE.SphereGeometry(radius, 72, 48),
      material: new THREE.MeshBasicMaterial({
        map: makeSurface('Sun', THREE, renderer).map,
        toneMapped: false,
      }),
    };
  }
  global.SolarSpaceAppearance = { create, moon, sun };
})(globalThis);
