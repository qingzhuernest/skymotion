/** Observation-derived surface maps; display appearance never alters ephemerides. */
(function(global){
  'use strict';
  const base=new URL('textures/',document.currentScript.src);
  const cached=new Map();
  const surfaces={
    Mercury:{file:'mercury.jpg',saturation:.85},
    Venus:{file:'venus_atmosphere.jpg',saturation:.25,contrast:.35,mean:.5563},
    Mars:{file:'mars.jpg',saturation:.72},
    Jupiter:{file:'jupiter.jpg',saturation:.85,polarRatio:.935},
    Saturn:{file:'saturn.jpg',saturation:.8,polarRatio:.902,tilt:.47},
    Uranus:{file:'uranus.jpg',tint:0xa7bcba,mean:.5646,polarRatio:.977},
    Neptune:{file:'neptune.jpg',tint:0x9bb4bb,mean:.1230,polarRatio:.983},
    Moon:{file:'moon.jpg',saturation:1},
  };
  function loadMap(file,THREE,renderer){
    if(!cached.has(file)){
      const loading=new Promise((resolve,reject)=>new THREE.TextureLoader().load(new URL(file,base).href,map=>{
        map.colorSpace=THREE.SRGBColorSpace;
        map.wrapS=THREE.RepeatWrapping;
        map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
        resolve(map);
      },undefined,reject));
      cached.set(file,loading);
      loading.catch(()=>cached.delete(file));
    }
    return cached.get(file);
  }
  function colorResponse(material,surface,THREE){
    // The source maps enhance colors. Preserve observed structure, reduce the enhancement.
    // Ice-giant hues follow the 2024 visible-color reassessment; this is display tuning,
    // not a spectrophotometric reconstruction or a real-time cloud forecast.
    material.onBeforeCompile=shader=>{
      const saturation=surface.saturation??1;
      const response=surface.tint
        ? `diffuseColor.rgb=surfaceTint*surfaceLuma/${surface.mean.toFixed(4)};`
        : `diffuseColor.rgb=mix(vec3(surfaceLuma),diffuseColor.rgb,${saturation.toFixed(2)});`;
      if(surface.tint)shader.uniforms.surfaceTint={value:new THREE.Color(surface.tint)};
      shader.fragmentShader=(surface.tint?'uniform vec3 surfaceTint;\n':'')+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float surfaceLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        ${response}
        ${surface.contrast?`diffuseColor.rgb=mix(vec3(${surface.mean}),diffuseColor.rgb,${surface.contrast});`:''}
      `);
    };
    material.customProgramCacheKey=()=>JSON.stringify(surface);
  }
  function photoMaterial(surface,fallback,THREE,renderer,invalidate){
    const material=new THREE.MeshStandardMaterial({color:fallback,roughness:1,metalness:0});
    colorResponse(material,surface,THREE);
    loadMap(surface.file,THREE,renderer).then(map=>{
      material.map=map;material.color.set(0xffffff);material.needsUpdate=true;invalidate?.();
    }).catch(()=>invalidate?.()); // A failed image retains the usable, neutral base material.
    return material;
  }
  function ring(radius,THREE,renderer,invalidate){
    const inner=radius*1.11,outer=radius*2.33;
    const geometry=new THREE.RingGeometry(inner,outer,192);
    const position=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let i=0;i<position.count;i++)uv.setXY(i,(Math.hypot(position.getX(i),position.getY(i))-inner)/(outer-inner),.5);
    const material=new THREE.MeshStandardMaterial({color:0xbeb6a5,transparent:true,opacity:.92,side:THREE.DoubleSide,roughness:1,depthWrite:false});
    const mesh=new THREE.Mesh(geometry,material);
    mesh.rotation.x=-Math.PI/2+.47;
    const center=new THREE.Vector3();
    material.onBeforeCompile=shader=>{
      shader.uniforms.planetCenterView={value:center};
      shader.fragmentShader='uniform vec3 planetCenterView;varying vec3 ringPositionView;\n'+shader.fragmentShader;
      shader.vertexShader='varying vec3 ringPositionView;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nringPositionView=mvPosition.xyz;');
      // A thin ice-particle ring scatters light on both sides; opaque double-sided
      // Lambert lighting would incorrectly make the whole backlit ring black.
      shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
        #if NUM_POINT_LIGHTS > 0
          if(dot(normal,normalize(pointLights[0].position-ringPositionView))<0.0)normal=-normal;
        #endif
      `).replace('#include <map_fragment>',`#include <map_fragment>
        float ringLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        diffuseColor.rgb=mix(vec3(ringLuma),diffuseColor.rgb,.3)*2.4;
      `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
        #if NUM_POINT_LIGHTS > 0
          vec3 toSun=normalize(pointLights[0].position-ringPositionView);
          vec3 toPlanet=planetCenterView-ringPositionView;
          float ahead=dot(toPlanet,toSun);
          float clearance=length(toPlanet-toSun*ahead);
          float occultation=step(0.0,ahead)*(1.0-smoothstep(${(radius*.97).toFixed(5)},${(radius*1.01).toFixed(5)},clearance));
          reflectedLight.directDiffuse*=1.0-occultation;
          reflectedLight.directSpecular*=1.0-occultation;
        #endif
      `);
    };
    mesh.onBeforeRender=(_renderer,_scene,camera)=>{
      if(mesh.parent)mesh.parent.getWorldPosition(center).applyMatrix4(camera.matrixWorldInverse);
    };
    loadMap('saturn_ring_alpha.png',THREE,renderer).then(map=>{
      map.wrapS=THREE.ClampToEdgeWrapping;material.map=map;material.color.set(0xffffff);material.opacity=1;material.needsUpdate=true;invalidate?.();
    }).catch(()=>invalidate?.());
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

  function create(spec,THREE,renderer,invalidate){
    const surface=surfaces[spec.id];
    let material;
    if(spec.id==='Earth'){
      material=new THREE.MeshStandardMaterial({color:0x729bd8,roughness:.82,metalness:0});
      loadMap('../../earth.jpg',THREE,renderer).then(map=>{
        material.map=map;material.color.set(0xffffff);material.needsUpdate=true;invalidate?.();
      }).catch(()=>invalidate?.());
    }else material=photoMaterial(surface,spec.color,THREE,renderer,invalidate);
    const geometry=new THREE.SphereGeometry(spec.size,72,48);
    if(surface?.polarRatio)geometry.scale(1,surface.polarRatio,1);
    if(surface?.tilt)geometry.rotateX(surface.tilt);
    return {material,geometry,decorate(mesh){
      if(spec.id==='Saturn')mesh.add(ring(spec.size,THREE,renderer,invalidate));
      if(spec.id==='Earth')mesh.add(atmosphericEdge(spec.size,THREE));
    }};
  }
  function moon(THREE,renderer,radius=.12,invalidate){
    return {geometry:new THREE.SphereGeometry(radius,72,48),material:photoMaterial(surfaces.Moon,0xaaa9a3,THREE,renderer,invalidate)};
  }
  function sun(THREE,_renderer,radius=1.05){
    // The emitter remains a schematic light source, not a solar-observatory image.
    return {geometry:new THREE.SphereGeometry(radius,72,48),material:new THREE.MeshBasicMaterial({color:0xfff2d6,toneMapped:false})};
  }
  global.SolarSpaceAppearance={create,moon,sun};
})(globalThis);
