// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";

// Spatial art direction, independent of camera distance. Exported GLBs stay PBR.
export function createContextFog(config) {
  if (!config) return null;
  const ring = config.polygon_enu_m;
  if (
    !Array.isArray(ring) ||
    ring.length < 3 ||
    ring.length > 16 ||
    ring.some(
      (p) =>
        !Array.isArray(p) ||
        p.length !== 2 ||
        p.some((v) => !Number.isFinite(v)),
    ) ||
    !Number.isFinite(config.transition_m) ||
    config.transition_m <= 0 ||
    !/^#[0-9a-f]{6}$/i.test(config.color) ||
    !Number.isFinite(config.strength) ||
    config.strength < 0 ||
    config.strength > 0.95 ||
    !Number.isFinite(config.desaturation) ||
    config.desaturation < 0 ||
    config.desaturation > 1
  )
    throw Error("Invalid background haze configuration");
  const uniforms = {
    contextRing: { value: ring.map((p) => new THREE.Vector2(p[0], -p[1])) },
    contextTransition: { value: config.transition_m },
    contextStrength: { value: config.strength },
    contextDesaturation: { value: config.desaturation },
    contextTint: { value: new THREE.Color(config.color) },
  };
  const applied = new WeakMap();
  const bakedGeometry = new WeakMap(),
    bakedMeshes = new WeakSet();
  let cachedVertices = 0,
    cachedMeshes = 0;
  let enabled = true;
  const field = `
    varying float vContextHaze;
    uniform vec2 contextRing[${ring.length}];
    uniform float contextTransition, contextStrength, contextDesaturation;
    uniform vec3 contextTint;
    float contextWeight(vec2 p) {
      bool inside=false;float gap=1e10;
      for(int i=0;i<${ring.length};i++) {
        vec2 a=contextRing[i],b=contextRing[(i+1)%${ring.length}];
        vec2 edge=b-a;
        float t=clamp(dot(p-a,edge)/max(dot(edge,edge),0.0001),0.0,1.0);
        gap=min(gap,length(p-a-edge*t));
        if((a.y>p.y)!=(b.y>p.y)) {
          float crossX=(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x;
          if(p.x<crossX)inside=!inside;
        }
      }
      return inside?0.0:smoothstep(0.0,contextTransition,gap)*contextStrength;
    }
  `;
  function weightAt(x, z) {
    let inside = false,
      gap = Infinity;
    for (let i = 0; i < ring.length; i++) {
      const a = uniforms.contextRing.value[i],
        b = uniforms.contextRing.value[(i + 1) % ring.length];
      const dx = b.x - a.x,
        dz = b.y - a.y;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((x - a.x) * dx + (z - a.y) * dz) /
            Math.max(dx * dx + dz * dz, 0.0001),
        ),
      );
      gap = Math.min(gap, Math.hypot(x - a.x - dx * t, z - a.y - dz * t));
      if (
        a.y > z != b.y > z &&
        x < ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x
      )
        inside = !inside;
    }
    const t = Math.max(0, Math.min(1, gap / config.transition_m));
    return inside ? 0 : t * t * (3 - 2 * t);
  }
  const api = {
    config,
    get enabled() {
      return enabled;
    },
    setEnabled(on) {
      enabled = !!on;
      uniforms.contextStrength.value = enabled ? config.strength : 0;
    },
    apply(material) {
      if (applied.has(material)) return;
      const record = { baked: false };
      applied.set(material, record);
      const previous = material.onBeforeCompile,
        cache = material.customProgramCacheKey.bind(material);
      const key = cache();
      material.onBeforeCompile = function (shader, renderer) {
        previous.call(this, shader, renderer);
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\n" +
              (record.baked
                ? "attribute float contextHazeWeight; varying float vContextHaze; uniform float contextStrength;"
                : field),
          )
          .replace(
            "#include <project_vertex>",
            "#include <project_vertex>\nvContextHaze=" +
              (record.baked
                ? "contextHazeWeight*contextStrength;"
                : "contextWeight((modelMatrix*vec4(transformed,1.0)).xz);"),
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying float vContextHaze;\nuniform float contextDesaturation;\nuniform vec3 contextTint;",
          )
          .replace(
            "#include <tonemapping_fragment>",
            `
          float contextHaze=vContextHaze;
          float contextLuma=dot(gl_FragColor.rgb,vec3(0.2126,0.7152,0.0722));
          gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(contextLuma),contextHaze*contextDesaturation);
          gl_FragColor.rgb=mix(gl_FragColor.rgb,contextTint,contextHaze);
          #include <tonemapping_fragment>`,
          );
      };
      material.customProgramCacheKey = () =>
        key +
        "|spatial-context-haze-v3|" +
        ring.length +
        (record.baked ? "|baked" : "|dynamic");
      material.needsUpdate = true;
    },
    // Call only after final placement of a static map layer. The shader still
    // interpolates the exact same per-vertex field; only its repeated work moves
    // to load time. Moving/skinned/instanced inputs retain the original path.
    bakeMesh(mesh, materials = [mesh.material].flat()) {
      if (
        !mesh.isMesh ||
        mesh.isSkinnedMesh ||
        mesh.isInstancedMesh ||
        mesh.morphTargetInfluences?.length
      )
        return false;
      mesh.updateWorldMatrix(true, false);
      let geometry = mesh.geometry;
      const key = mesh.matrixWorld.elements.join(",");
      let cached = bakedGeometry.get(geometry);
      if (
        (cached && cached.key !== key) ||
        (!cached && geometry.hasAttribute("contextHazeWeight"))
      ) {
        geometry = geometry.clone();
        mesh.geometry = geometry;
        cached = null;
      }
      if (!cached) {
        const pos = geometry.attributes.position,
          values = new Float32Array(pos.count),
          p = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
          p.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
          values[i] = weightAt(p.x, p.z);
        }
        geometry.setAttribute(
          "contextHazeWeight",
          new THREE.BufferAttribute(values, 1),
        );
        bakedGeometry.set(geometry, { key });
        cachedVertices += pos.count;
      }
      for (const material of materials) {
        api.apply(material);
        const record = applied.get(material);
        if (!record.baked) {
          record.baked = true;
          material.needsUpdate = true;
        }
      }
      if (!bakedMeshes.has(mesh)) {
        bakedMeshes.add(mesh);
        cachedMeshes++;
      }
      return true;
    },
    state: () => ({
      cachedMeshes,
      cachedVertices,
      additionalBytes: cachedVertices * 4,
    }),
  };
  return api;
}
