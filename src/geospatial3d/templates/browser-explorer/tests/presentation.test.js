import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  createPresentation,
  sceneAssetUrl,
  setEmissive,
} from "../src/presentation.js";

test("context batches retain registered identities without creating a mesh per anonymous building", () => {
  const root = new THREE.Group(),
    batch = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshStandardMaterial(),
    );
  batch.userData = {
    asset_kind: "context-building-batch",
    asset_ids: ["a", "b"],
  };
  root.add(batch);
  const layer = createPresentation(root, { replaces_building_ids: ["a", "b"] });
  assert.equal(layer.groups.size, 0);
  assert.equal(layer.batchedIds.size, 2);
  assert.equal(layer.collisionMeshes.length, 1);
  layer.setToon(false);
  assert.equal(batch.material.isMeshStandardMaterial, true);
  assert.throws(
    () => createPresentation(root, { replaces_building_ids: ["a"] }),
    /Unregistered context/,
  );
});

test("presentation assets stay within the local scene directory", () => {
  assert.equal(
    sceneAssetUrl("/map/scene/", "art/pilot.glb"),
    "/map/scene/art/pilot.glb",
  );
  for (const path of [
    "../secret",
    "/other",
    "https://other/a.glb",
    "a/../../secret",
    "%2e%2e/secret",
    "a\\secret",
  ])
    assert.throws(() => sceneAssetUrl("/scene/", path));
});

test("multi-primitive metadata, selection and PBR/toon switching stay independent", () => {
  const root = new THREE.Group();
  const source = new THREE.MeshStandardMaterial({ color: "#b96f55" });
  for (const id of ["a", "b"]) {
    const group = new THREE.Group();
    group.userData = { asset_kind: "building", asset_id: id };
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), source));
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), source));
    root.add(group);
  }
  const layer = createPresentation(root, { replaces_building_ids: ["a", "b"] });
  assert.equal(layer.collisionMeshes.length, 4);
  for (const mode of [true, false, true]) {
    layer.setToon(mode);
    setEmissive(layer.groups.get("a"), 0x273d1d);
    for (const mesh of layer.collisionMeshes) {
      assert.equal(mesh.material.isMeshToonMaterial === true, mode);
      assert.equal(
        mesh.material.emissive.getHex(),
        mesh.userData.asset_id === "a" ? 0x273d1d : 0,
      );
    }
    setEmissive(layer.groups.get("a"), 0);
  }
  assert.equal(source.emissive.getHex(), 0);
  assert.throws(
    () =>
      createPresentation(new THREE.Group(), {
        replaces_building_ids: ["missing"],
      }),
    /Missing authored/,
  );
});
