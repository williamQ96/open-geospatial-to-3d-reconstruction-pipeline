import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  createBuildingHighlight,
  resolveBuildingHit,
} from "../src/building-highlight.js";

test("hover is subtle, selection takes priority and clearing one preserves the other", () => {
  const scene = new THREE.Scene(),
    a = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshStandardMaterial(),
    ),
    b = a.clone();
  b.material = a.material.clone();
  const h = createBuildingHighlight(
    scene,
    new Map([
      ["a", a],
      ["b", b],
    ]),
    new Map(),
  );
  h.hover("a");
  const hover = a.material.emissive.getHex();
  assert.ok(hover > 0);
  h.select("a");
  const selected = a.material.emissive.getHex();
  assert.ok(selected > hover);
  h.hover("b");
  assert.equal(a.material.emissive.getHex(), selected);
  assert.equal(b.material.emissive.getHex(), hover);
  h.select(null);
  assert.equal(a.material.emissive.getHex(), 0);
  assert.equal(b.material.emissive.getHex(), hover);
  h.hover(null);
  assert.equal(b.material.emissive.getHex(), 0);
});
test("batch picks resolve one stable ID including boundary hits; edge cues do not tint the batch", () => {
  const a = {
    id: "a",
    base_z_m: 0,
    roof_z_m: 5,
    footprint_enu_m: [
      [0, 0],
      [5, 0],
      [5, 5],
      [0, 5],
    ],
  };
  const records = new Map([["a", a]]),
    object = {
      userData: { asset_kind: "context-building-batch", asset_ids: ["a"] },
    };
  assert.equal(
    resolveBuildingHit({ object, point: new THREE.Vector3(5, 2, -2) }, records),
    "a",
  );
  assert.equal(
    resolveBuildingHit(
      { object, point: new THREE.Vector3(10, 2, -2) },
      records,
    ),
    null,
  );
  const scene = new THREE.Scene(),
    h = createBuildingHighlight(scene, new Map(), records);
  h.hover("a");
  assert.equal(scene.children.length, 1);
  h.select("a");
  assert.equal(scene.children.length, 1);
  h.hover(null);
  assert.equal(scene.children.length, 1);
  h.select(null);
  assert.equal(scene.children.length, 0);
});
