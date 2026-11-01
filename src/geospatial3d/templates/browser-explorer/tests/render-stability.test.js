import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  overviewNear,
  createOverviewDepth,
  freezeStaticTransforms,
} from "../src/render-stability.js";
import { createMinimap } from "../src/minimap.js";

test("Overview near improves depth in empty space and never advances into the map bounds", () => {
  const box = new THREE.Box3(
    new THREE.Vector3(-100, -20, -100),
    new THREE.Vector3(100, 40, 100),
  );
  for (const p of [
    new THREE.Vector3(0, 455, 0),
    new THREE.Vector3(300, 5, 0),
    new THREE.Vector3(0, 5, 0),
    new THREE.Vector3(0, 5000, 0),
  ]) {
    const near = overviewNear(p, box, "aerial"),
      distance = box.distanceToPoint(p);
    assert.ok(near >= 0.08 && near <= 64);
    if (distance > 1) assert.ok(near <= distance * 0.1);
    assert.equal(overviewNear(p, box, "first"), 0.08);
    assert.equal(overviewNear(p, box, "third"), 0.08);
  }
  assert.ok(overviewNear(new THREE.Vector3(0, 455, 0), box, "aerial") >= 16);
  const root = new THREE.Mesh(new THREE.BoxGeometry(200, 40, 200));
  const camera = new THREE.PerspectiveCamera(45, 1, 0.08, 9000);
  camera.position.set(0, 455, 0);
  const depth = createOverviewDepth(camera, root);
  depth.update("aerial");
  assert.ok(camera.near >= 16);
  depth.update("first");
  assert.equal(camera.near, 0.08);
  assert.equal(camera.far, 9000);
});

test("static world matrices are retained exactly and animated layers are left alone", () => {
  const root = new THREE.Group(),
    child = new THREE.Mesh(new THREE.BoxGeometry());
  root.position.set(10, 2, -3);
  child.position.set(3, 1, 4);
  root.add(child);
  root.updateWorldMatrix(true, true);
  const matrix = child.matrixWorld.clone();
  assert.equal(freezeStaticTransforms(root), 2);
  root.updateMatrixWorld(true);
  assert.deepEqual(child.matrixWorld.elements, matrix.elements);
  assert.equal(child.matrixAutoUpdate, false);
  const animated = new THREE.Group();
  animated.add(new THREE.SkinnedMesh(new THREE.BoxGeometry()));
  assert.equal(freezeStaticTransforms(animated), 0);
  assert.equal(animated.matrixAutoUpdate, true);
});

test("minimap avoids identical redraws but invalidates pose, target, route and clear", () => {
  const prior = globalThis.document;
  const noop = () => {};
  const background = new Proxy({}, { get: () => noop, set: () => true });
  let draws = 0;
  const context = new Proxy(
    { drawImage: () => draws++ },
    { get: (o, k) => o[k] || noop, set: (o, k, v) => ((o[k] = v), true) },
  );
  globalThis.document = {
    createElement: () => ({ getContext: () => background }),
  };
  try {
    const draw = createMinimap(
        { width: 200, height: 200, getContext: () => context },
        [],
        100,
        [],
      ),
      p = { x: 0, z: 0 };
    draw(p, 0, null);
    draw(p, 0, null, []);
    draw(p, 0, null, null);
    assert.equal(draws, 1);
    p.x = 0.001;
    draw(p, 0, null);
    assert.equal(draws, 2);
    draw(p, 0.1, null);
    draw(p, 0.1, { x: 5, z: 3 });
    assert.equal(draws, 4);
    draw(p, 0.1, { x: 5, z: 3 });
    assert.equal(draws, 4);
    const route = [
      [0, 0],
      [1, 1],
    ];
    draw(p, 0.1, { x: 5, z: 3 }, route);
    draw(p, 0.1, { x: 5, z: 3 }, route);
    assert.equal(draws, 5);
    draw(p, 0.1, null, []);
    assert.equal(draws, 6);
  } finally {
    globalThis.document = prior;
  }
});
