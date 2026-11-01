// SPDX-License-Identifier: Apache-2.0
// Original stylized teaching-room kit. Geometry is intentionally generic/inferred.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function createClassroom() {
  const root = new THREE.Group();
  root.name = "Generic classroom v1";
  root.userData = {
    template: "classroom-v1",
    dimensions_m: [24, 4.2, 18],
    accuracy: "Inferred generic room; not a surveyed building interior",
  };
  const colliders = [];
  const materials = Object.fromEntries(
    Object.entries({
      plaster: 0xe9e4d5,
      floor: 0xc9c0aa,
      wood: 0xb88a53,
      green: 0x28584c,
      metal: 0x52635b,
      chair: 0xb0bd83,
      glass: 0xb5d8e1,
      cream: 0xf8eac9,
    }).map(([k, color]) => [
      k,
      new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
    ]),
  );
  function box(name, x, y, z, w, h, d, material, solid = false) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      materials[material],
    );
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    if (solid) colliders.push({ x, z, halfX: w / 2, halfZ: d / 2 });
    return mesh;
  }
  box("Warm matte floor", 0, -0.15, 0, 24, 0.3, 18, "floor");
  const ceiling = box("Classroom ceiling", 0, 4.3, 0, 24, 0.2, 18, "cream");
  box("Front wall", 0, 2.1, -9, 24, 4.2, 0.25, "plaster");
  box("Left wall", -12, 2.1, 0, 0.25, 4.2, 18, "plaster");
  box("Right wall", 12, 2.1, 0, 0.25, 4.2, 18, "plaster");
  box("Rear wall left", -6.65, 2.1, 9, 10.7, 4.2, 0.25, "plaster");
  box("Rear wall right", 6.65, 2.1, 9, 10.7, 4.2, 0.25, "plaster");
  box("Door lintel", 0, 3.6, 9, 2.6, 1.2, 0.25, "plaster");
  const exit = box(
    "Return to campus door",
    0,
    1.5,
    8.99,
    2.5,
    3,
    0.18,
    "green",
  );
  box("Door glass", 0, 1.95, 8.87, 1.65, 1.2, 0.05, "glass");
  box("Door handle", 0.9, 1.15, 8.82, 0.1, 0.28, 0.08, "cream");
  box("Teaching board", 0, 2.15, -8.82, 8, 1.95, 0.12, "green");
  box("Board ledge", 0, 1.12, -8.65, 8.25, 0.12, 0.3, "wood");
  for (let i = 0; i < 5; i++)
    box("Chalk line", -2.5 + i * 0.8, 2.4, -8.74, 0.45, 0.035, 0.015, "cream");
  box("Teaching desk", 0, 0.9, -6.75, 2.6, 0.14, 1.1, "wood", true);
  for (const z of [-4, -0.8, 2.4])
    for (const x of [-7.8, -3.9, 0, 3.9, 7.8]) {
      box("Student desktop", x, 0.8, z, 2.5, 0.12, 1.05, "wood", true);
      for (const side of [-1, 1])
        box("Desk legs", x + side * 1, 0.38, z, 0.1, 0.76, 0.75, "metal");
      box("Chair seat", x, 0.45, z + 1.05, 0.66, 0.12, 0.66, "chair", true);
      box("Chair back", x, 0.85, z + 1.33, 0.66, 0.8, 0.1, "chair");
      for (const dx of [-0.25, 0.25])
        for (const dz of [-0.25, 0.25])
          box(
            "Chair legs",
            x + dx,
            0.2,
            z + 1.05 + dz,
            0.055,
            0.4,
            0.055,
            "metal",
          );
    }
  for (const side of [-1, 1])
    for (const z of [-5.8, -1.8, 2.2, 6.2]) {
      box("Window frame", side * 11.83, 2.4, z, 0.12, 2.2, 2.65, "cream");
      box("Window sky", side * 11.75, 2.4, z, 0.04, 1.95, 2.4, "glass");
      box("Window mullion", side * 11.7, 2.4, z, 0.08, 1.95, 0.07, "cream");
    }
  // Open ceiling keeps the room readable in Overview; no unseen exterior world.
  for (const z of [-5, 0, 5])
    box("Soft ceiling fixture", 0, 4, z, 5, 0.12, 0.55, "cream");
  root.updateMatrixWorld(true);
  // Keep the interactive exit separate; batch the static kit by material.
  for (const [name, material] of Object.entries(materials)) {
    const parts = root.children.filter(
      (mesh) => mesh !== exit && mesh !== ceiling && mesh.material === material,
    );
    if (!parts.length) continue;
    const geometry = mergeGeometries(
      parts.map((mesh) => {
        mesh.geometry.applyMatrix4(mesh.matrixWorld);
        return mesh.geometry;
      }),
    );
    const batch = new THREE.Mesh(geometry, material);
    batch.name = `Classroom ${name}`;
    batch.receiveShadow = true;
    root.add(batch);
    for (const mesh of parts) {
      root.remove(mesh);
      mesh.geometry.dispose();
    }
  }
  return {
    root,
    exit,
    ceiling,
    colliders,
    blocked(x, z, radius = 0.32) {
      return (
        Math.abs(x) > 11.5 ||
        Math.abs(z) > 8.45 ||
        colliders.some(
          (c) =>
            Math.abs(x - c.x) < c.halfX + radius &&
            Math.abs(z - c.z) < c.halfZ + radius,
        )
      );
    },
  };
}
