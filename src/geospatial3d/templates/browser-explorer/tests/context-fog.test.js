import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createContextFog } from "../src/context-fog.js";

const config = {
  polygon_enu_m: [
    [0, 0],
    [20, 0],
    [20, 30],
    [0, 30],
  ],
  transition_m: 100,
  strength: 0.7,
  desaturation: 0.5,
  color: "#d6e0da",
};
test("spatial haze uses fixed ENU geography, chains existing hooks and can switch off without changing geometry", () => {
  const fog = createContextFog(config),
    material = new THREE.MeshStandardMaterial();
  let calls = 0;
  material.onBeforeCompile = () => calls++;
  fog.apply(material);
  fog.apply(material);
  const shader = {
    uniforms: {},
    vertexShader: "#include <common>\n#include <project_vertex>",
    fragmentShader: "#include <common>\n#include <tonemapping_fragment>",
  };
  material.onBeforeCompile(shader, {});
  assert.equal(calls, 1);
  assert.deepEqual(shader.uniforms.contextRing.value[2].toArray(), [20, -30]);
  assert.match(shader.vertexShader, /inside\?0\.0/);
  assert.match(shader.vertexShader, /modelMatrix\*vec4\(transformed/);
  assert.doesNotMatch(shader.fragmentShader, /cameraPosition/);
  fog.setEnabled(false);
  assert.equal(shader.uniforms.contextStrength.value, 0);
  fog.setEnabled(true);
  assert.equal(shader.uniforms.contextStrength.value, 0.7);
});
test("haze rejects unsafe or incomplete configuration and remains optional", () => {
  assert.equal(createContextFog(null), null);
  for (const extra of [
    { transition_m: 0 },
    { strength: 2 },
    { desaturation: NaN },
    { color: "invalid" },
    {
      polygon_enu_m: [
        [0, 0],
        [1, NaN],
        [2, 2],
      ],
    },
  ])
    assert.throws(() => createContextFog({ ...config, ...extra }), /Invalid/);
});
