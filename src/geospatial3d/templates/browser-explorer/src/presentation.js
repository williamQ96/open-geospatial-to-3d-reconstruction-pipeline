// SPDX-License-Identifier: Apache-2.0
// Optional authored art layer. It never rewrites the measured scene manifest.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function sceneAssetUrl(base, name) {
  if (
    typeof name !== "string" ||
    !/^[\w./-]+$/.test(name) ||
    name.startsWith("/") ||
    name.split("/").includes("..")
  )
    throw new Error("Presentation asset must stay inside the scene directory.");
  return base + name;
}

export function setEmissive(object, color) {
  object?.traverse((child) => {
    if (!child.isMesh) return;
    for (const material of Array.isArray(child.material)
      ? child.material
      : [child.material])
      material.emissive?.setHex(color);
  });
}

export async function loadPresentation(base, name, buildingIds) {
  const response = await fetch(sceneAssetUrl(base, name));
  if (!response.ok)
    throw new Error("Could not load presentation: " + response.status);
  const config = await response.json();
  if (config.version !== 1 || !Array.isArray(config.replaces_building_ids))
    throw new Error("Unsupported presentation contract.");
  for (const id of config.replaces_building_ids)
    if (!buildingIds.has(id))
      throw new Error("Unknown presentation building: " + id);
  const gltf = await new GLTFLoader().loadAsync(
    sceneAssetUrl(base, config.asset_url),
  );
  return createPresentation(gltf.scene, config);
}

export function createPresentation(root, config) {
  const groups = new Map();
  const collisionMeshes = [];
  const materials = [];
  const ramp = new THREE.DataTexture(
    new Uint8Array([105, 185, 255]),
    3,
    1,
    THREE.RedFormat,
  );
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  root.traverse((object) => {
    if (!object.isMesh) return;
    for (
      let parent = object.parent;
      parent && !object.userData.asset_kind;
      parent = parent.parent
    )
      if (parent.userData.asset_kind)
        object.userData = { ...parent.userData, ...object.userData };
    object.castShadow = object.userData.asset_kind !== "landscape-surface";
    object.receiveShadow = true;
    const original = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone();
    const toToon = (source) =>
      new THREE.MeshToonMaterial({
        color: source.color.clone(),
        gradientMap: ramp,
        side: source.side,
        map: source.map,
        vertexColors: source.vertexColors,
      });
    const toon = Array.isArray(original)
      ? original.map(toToon)
      : toToon(original);
    materials.push({ object, original, toon });
    object.material = toon;
    if (object.userData.asset_kind === "landscape-surface") {
      for (const material of [original, toon].flat()) {
        material.polygonOffset = true;
        material.polygonOffsetFactor = -2;
        material.polygonOffsetUnits = -4;
      }
    }
    const id = object.userData.asset_id;
    if (id && object.userData.asset_kind === "building") {
      if (!config.replaces_building_ids.includes(id))
        throw new Error("Unregistered authored building: " + id);
      if (!groups.has(id)) groups.set(id, new THREE.Group());
      groups.get(id).add(object.clone());
      collisionMeshes.push(object);
    }
  });
  // Groups reference the same materials, while original nodes retain their exported transforms.
  for (const id of config.replaces_building_ids)
    if (!groups.has(id))
      throw new Error("Missing authored building geometry: " + id);
  return {
    root,
    config,
    groups,
    collisionMeshes,
    setToon(enabled) {
      for (const entry of materials) {
        const wireframe = [entry.object.material].flat()[0].wireframe;
        entry.object.material = enabled ? entry.toon : entry.original;
        for (const material of [entry.object.material].flat())
          material.wireframe = wireframe;
      }
      // Selection uses actual scene meshes in either material mode.
      for (const [id, group] of groups) {
        group.clear();
        for (const object of collisionMeshes)
          if (object.userData.asset_id === id) group.add(object.clone());
      }
    },
  };
}
