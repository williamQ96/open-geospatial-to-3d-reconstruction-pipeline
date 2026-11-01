// SPDX-License-Identifier: Apache-2.0
// Original world-space matte grain; portable assets retain baked colors/roughness.
export function applySurfaceGrain(material, strength = 0.065) {
  if (material.userData.surfaceGrain) return;
  material.userData.surfaceGrain = true;
  const previous = material.onBeforeCompile,
    key = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = (shader) => {
    previous.call(material, shader);
    shader.vertexShader = "varying vec3 grainWorld;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n grainWorld=(modelMatrix*vec4(position,1.0)).xyz;",
    );
    shader.fragmentShader =
      "varying vec3 grainWorld;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
   float fine=fract(sin(dot(floor(grainWorld.xz*7.0),vec2(127.1,311.7)))*43758.5453)-.5;
   float coarse=fract(sin(dot(floor(grainWorld.xz*.8),vec2(41.3,83.7)))*1758.923)-.5;
   float detail=1.0-smoothstep(.08,.8,max(fwidth(grainWorld.x),fwidth(grainWorld.z)));
   diffuseColor.rgb*=1.0+${strength.toFixed(4)}*(fine*detail+coarse*.35);`,
    );
  };
  material.customProgramCacheKey = () => key() + "|matte-ground-" + strength;
  material.needsUpdate = true;
}
