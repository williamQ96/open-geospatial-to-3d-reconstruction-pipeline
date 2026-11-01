// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";

export function createCharacter(properties = null) {
  const root = new THREE.Group();
  root.name = "whitebox-explorer";
  if (properties?.heightM) root.scale.setScalar(properties.heightM / 1.78);
  const white = new THREE.MeshStandardMaterial({
    color: 0xfaf8ee,
    roughness: 0.8,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0x68846c,
    roughness: 0.8,
  });
  const part = (geometry, material, x, y, z, parent = root) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  part(new THREE.SphereGeometry(0.19, 20, 14), white, 0, 1.58, 0);
  part(new THREE.CapsuleGeometry(0.2, 0.47, 6, 14), white, 0, 1.08, 0);
  // A small chest mark makes heading legible without adding non-placeholder detail.
  part(new THREE.BoxGeometry(0.14, 0.06, 0.025), accent, 0, 1.19, 0.19);
  const limb = (x, y, r, length) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    root.add(pivot);
    part(
      new THREE.CapsuleGeometry(r, length, 4, 10),
      white,
      0,
      -length / 2 - 0.03,
      0,
      pivot,
    );
    return pivot;
  };
  const arms = [limb(-0.29, 1.27, 0.065, 0.43), limb(0.29, 1.27, 0.065, 0.43)];
  const legs = [limb(-0.12, 0.75, 0.085, 0.54), limb(0.12, 0.75, 0.085, 0.54)];
  return {
    root,
    dispose() {
      const mats = new Set();
      root.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          mats.add(o.material);
        }
      });
      for (const m of mats) m.dispose();
      root.removeFromParent();
    },
    animate(time, moving, gait = {}) {
      const a = moving ? Math.sin(gait.phase ?? time * 10) * 0.45 : 0;
      arms[0].rotation.x = a;
      arms[1].rotation.x = -a;
      legs[0].rotation.x = -a;
      legs[1].rotation.x = a;
    },
  };
}
