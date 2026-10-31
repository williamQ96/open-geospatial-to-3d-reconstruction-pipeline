// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createRouter, routeSample } from "../src/routing.js";
import { createRouteView } from "../src/navigation-view.js";

test("routing follows connected paths around an obstacle and rejects disconnected destinations", () => {
  const nodes = [
    [0, 0],
    [0, 30],
    [30, 30],
    [30, 0],
    [500, 0],
    [500, 30],
  ];
  const edges = [
    [0, 1, 30, "path"],
    [1, 2, 30, "path"],
    [2, 3, 30, "path"],
    [4, 5, 30, "path"],
  ];
  const clear = (a, b) => a[0] === b[0] && Math.abs(a[1] - b[1]) < 1;
  const router = createRouter({ version: 1, nodes_enu_m: nodes, edges }, clear);
  const result = router.route([0, 0], [30, 0]);
  assert.equal(result.distance, 90);
  assert.deepEqual(result.points, nodes.slice(0, 4));
  assert.equal(router.route([0, 0], [500, 0]), null);
  assert.equal(router.route([200, 200], [30, 0]), null);
  assert.deepEqual(
    routeSample(
      [
        [0, 0],
        [0, 10],
        [10, 10],
      ],
      15,
    ).point,
    [5, 10],
  );
});
test("route ribbon follows terrain, chevrons advance toward B and clear removes geometry", () => {
  const scene = new THREE.Scene(),
    view = createRouteView(scene, (x, z) => x * 0.01 + z * 0.02);
  view.set({
    points: [
      [0, 0],
      [0, 30],
    ],
    distance: 30,
  });
  assert.equal(view.root.children.length, 4);
  const arrows = view.root.children[1],
    a = new THREE.Matrix4(),
    b = new THREE.Matrix4();
  view.update(0);
  arrows.getMatrixAt(0, a);
  view.update(1);
  arrows.getMatrixAt(0, b);
  assert.ok(b.elements[14] < a.elements[14]);
  assert.ok(Number.isFinite(b.elements[13]));
  assert.equal(arrows.material.color.getHex(), 0xffffff);
  view.clear();
  assert.equal(view.root.children.length, 0);
});
