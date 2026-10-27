/** Real telescope photographs: a labelled, enlarged background layer and an unmodified image viewer. */
(function (global) {
  'use strict';
  function create(THREE, Model, Engine, invalidate) {
    const group = new THREE.Group();
    group.visible = false;
    let catalog = null,
      loading = false,
      visible = false,
      loaded = 0;
    const meshes = [];
    const dialog = document.getElementById('nebulaViewer');
    const selector = document.getElementById('nebulaChoice');
    const button = document.getElementById('nebulaPhotos');
    function choose() {
      const entry = catalog?.[Number(selector.value) || 0];
      if (!entry) return;
      document.getElementById('nebulaTitle').textContent = entry.name;
      const photo = document.getElementById('nebulaImage');
      photo.onerror = () => {
        document.getElementById('nebulaCredit').textContent = '影像暂不可用，可打开NASA原始来源。';
      };
      photo.src = entry.file;
      photo.alt = entry.name + '的真实望远镜观测影像';
      const credit =
        entry.id === 'orion'
          ? 'NASA/JPL-Caltech/STScI'
          : entry.id === 'ring'
            ? 'NASA、ESA、C. R. O’Dell等；LBT：David Thompson'
            : 'NASA、ESA、M. Livio与哈勃20周年团队（STScI）';
      document.getElementById('nebulaCredit').textContent =
        credit + '。多波段／处理配色，不代表肉眼所见。';
      document.getElementById('nebulaSource').href = entry.source;
    }
    selector.onchange = choose;
    button.onclick = () => {
      if (!catalog) return;
      choose();
      dialog.showModal();
    };
    document.getElementById('nebulaClose').onclick = () => dialog.close();
    dialog.addEventListener('close', () => button.focus({ preventScroll: true }));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          dialog.close();
      }
    });
    function load() {
      if (loading) return;
      loading = true;
      fetch('assets/nebulae/catalog.json')
        .then((r) => {
          if (!r.ok) throw new Error('Missing nebula catalog');
          return r.json();
        })
        .then((entries) => {
          catalog = entries;
          for (const [index, entry] of entries.entries()) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = entry.name;
            selector.append(option);
            const direction = SolarSpaceStars.direction(entry.ra, entry.dec, Model, Engine);
            // Deliberately enlarged photos, not angular-size or naked-eye simulation.
            const span = entry.id === 'orion' ? 16 : entry.id === 'carina' ? 12 : 8;
            const texture = new THREE.TextureLoader().load(
              entry.file,
              () => {
                loaded++;
                invalidate();
              },
              undefined,
              () => invalidate(),
            );
            texture.colorSpace = THREE.SRGBColorSpace;
            const material = new THREE.ShaderMaterial({
              uniforms: { photo: { value: texture } },
              transparent: true,
              depthWrite: false,
              depthTest: true,
              blending: THREE.AdditiveBlending,
              toneMapped: false,
              vertexShader:
                'varying vec2 photoUv; void main(){photoUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
              fragmentShader:
                'uniform sampler2D photo;varying vec2 photoUv;void main(){vec2 edge=min(photoUv,1.0-photoUv);float fade=smoothstep(0.0,0.15,edge.x)*smoothstep(0.0,0.15,edge.y);gl_FragColor=vec4(texture2D(photo,photoUv).rgb,fade*0.35);\n#include <colorspace_fragment>\n}',
            });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
            mesh.scale.setScalar(2 * 410 * Math.tan((span * Math.PI) / 360));
            mesh.userData.direction = direction;
            mesh.frustumCulled = false;
            meshes.push(mesh);
            group.add(mesh);
          }
          button.disabled = false;
          invalidate();
        })
        .catch(() => {
          button.disabled = true;
          document.getElementById('nebulaHint').textContent =
            '星云影像未加载，其他观察功能仍可使用。';
        });
    }
    return {
      group,
      state: () => ({ loaded, visible }),
      update(camera, active, enabled) {
        visible = active && enabled;
        group.visible = visible;
        if (active && !catalog) load();
        for (const mesh of meshes) {
          const v = mesh.userData.direction;
          mesh.position.set(
            camera.position.x + v.x * 410,
            camera.position.y + v.y * 410,
            camera.position.z + v.z * 410,
          );
          mesh.quaternion.copy(camera.quaternion);
        }
        document.getElementById('nebulaHint').hidden = !visible;
      },
    };
  }
  global.SolarSpaceNebulae = { create };
})(globalThis);
