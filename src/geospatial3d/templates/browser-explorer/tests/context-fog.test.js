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

test("static haze caches the same per-vertex field in world coordinates, including shared geometry transforms", () => {
  const fog = createContextFog({
    ...config,
    polygon_enu_m: [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ],
    transition_m: 10,
  });
  const geometry = new THREE.BufferGeometry().setAttribute(
    "position",
    new THREE.Float32BufferAttribute([5, 0, -5, 15, 0, -5, 20, 0, -5], 3),
  );
  const a = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  const alternate = new THREE.MeshToonMaterial();
  fog.bakeMesh(a, [a.material, alternate]);
  assert.deepEqual(
    [...a.geometry.attributes.contextHazeWeight.array],
    [0, 0.5, 1],
  );
  const b = new THREE.Mesh(geometry, a.material);
  b.position.x = 5;
  fog.bakeMesh(b);
  assert.notEqual(a.geometry, b.geometry);
  assert.deepEqual(
    [...a.geometry.attributes.contextHazeWeight.array],
    [0, 0.5, 1],
  );
  assert.deepEqual(
    [...b.geometry.attributes.contextHazeWeight.array],
    [0, 1, 1],
  );
  for (const material of [a.material, alternate]) {
    const shader = {
      uniforms: {},
      vertexShader: "#include <common>\n#include <project_vertex>",
      fragmentShader: "#include <common>\n#include <tonemapping_fragment>",
    };
    material.onBeforeCompile(shader, {});
    assert.match(shader.vertexShader, /attribute float contextHazeWeight/);
    assert.doesNotMatch(shader.vertexShader, /for\(int/);
    assert.match(shader.vertexShader, /contextHazeWeight\*contextStrength/);
    fog.setEnabled(false);
    assert.equal(shader.uniforms.contextStrength.value, 0);
    fog.setEnabled(true);
    assert.equal(shader.uniforms.contextStrength.value, 0.7);
  }
  assert.deepEqual(fog.state(), {
    cachedMeshes: 2,
    cachedVertices: 6,
    additionalBytes: 24,
  });
  const skinned = new THREE.SkinnedMesh(
    geometry,
    new THREE.MeshStandardMaterial(),
  );
  assert.equal(fog.bakeMesh(skinned), false);
});
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
