// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";

// A padded world AABB is a conservative lower bound on distance to map geometry.
// Increase near only in empty space outside it; walking retains its close-up plane.
export function overviewNear(position, bounds, view) {
  if (view !== "aerial" || bounds.isEmpty()) return 0.08;
  const safe = Math.max(
    0.08,
    Math.min(64, bounds.distanceToPoint(position) * 0.1),
  );
  return Math.max(0.08, 2 ** Math.floor(Math.log2(safe)));
}

export function createOverviewDepth(camera, root) {
  const bounds = new THREE.Box3().setFromObject(root).expandByScalar(8);
  return {
    update(view) {
      const near = overviewNear(camera.position, bounds, view);
      if (camera.near !== near) {
        camera.near = near;
        camera.updateProjectionMatrix();
      }
    },
  };
}

export function freezeStaticTransforms(root) {
  let animated = false;
  root.traverse((o) => {
    animated ||= o.isSkinnedMesh || o.animations.length > 0;
  });
  if (animated) return 0;
  root.updateWorldMatrix(true, true);
  let count = 0;
  root.traverse((o) => {
    o.matrixAutoUpdate = false;
    o.matrixWorldAutoUpdate = false;
    count++;
  });
  return count;
}
