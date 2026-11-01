// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
export async function loadWildlifeFactory(url, yawCorrection = -Math.PI / 2) {
  const asset = await new GLTFLoader().loadAsync(url);
  return (properties = {}) => {
    const root = new THREE.Group(),
      body = asset.scene.clone(true);
    body.rotation.y = yawCorrection;
    body.scale.setScalar(properties.scale || 1);
    const materials = [];
    body.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = false;
        o.receiveShadow = true;
        if (properties.furColor) {
          o.material = o.material.clone();
          o.material.color.set(properties.furColor);
          materials.push(o.material);
        }
      }
    });
    root.add(body);
    root.name = "Low-poly campus squirrel";
    return {
      root,
      dispose() {
        for (const m of materials) m.dispose();
        root.removeFromParent();
      },
    };
  };
}
