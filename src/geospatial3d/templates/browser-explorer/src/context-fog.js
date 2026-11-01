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
  const applied = new WeakSet();
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
  return {
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
      applied.add(material);
      const previous = material.onBeforeCompile,
        cache = material.customProgramCacheKey.bind(material);
      const key = cache();
      material.onBeforeCompile = function (shader, renderer) {
        previous.call(this, shader, renderer);
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\n" + field)
          .replace(
            "#include <project_vertex>",
            "#include <project_vertex>\nvContextHaze=contextWeight((modelMatrix*vec4(transformed,1.0)).xz);",
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
        key + "|spatial-context-haze-v2|" + ring.length;
      material.needsUpdate = true;
    },
  };
}
