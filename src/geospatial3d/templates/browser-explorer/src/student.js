// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

export async function loadStudentFactory(url) {
  const asset = await new GLTFLoader().loadAsync(url);
  return (variant = 0) => {
    const root = new THREE.Group(),
      body = clone(asset.scene);
    const bounds = new THREE.Box3().setFromObject(body),
      scale = 1.78 / (bounds.max.y - bounds.min.y);
    body.scale.setScalar(scale);
    body.position.y = -bounds.min.y * scale;
    body.traverse((mesh) => {
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      if (variant && mesh.material?.name.includes("Forest")) {
        mesh.material = mesh.material.clone();
        mesh.material.color.setHex(
          [0x204d3d, 0x42687a, 0xb18b55, 0x66765c][variant % 4],
        );
      }
    });
    root.name = "Rigged campus student";
    root.add(body);
    const mixer = new THREE.AnimationMixer(body),
      clips = asset.animations;
    const idle = mixer.clipAction(
      clips.find((c) => /Idle/i.test(c.name)) || clips[0],
    );
    const walk = mixer.clipAction(
      clips.find((c) => /Walk|Run/i.test(c.name)) || clips[0],
    );
    let active = idle,
      last = 0;
    idle.play();
    return {
      root,
      rigged: true,
      animate(time, moving) {
        const next = moving ? walk : idle;
        if (next !== active) {
          next.reset().fadeIn(0.18).play();
          active.fadeOut(0.18);
          active = next;
        }
        walk.timeScale = 0.7;
        mixer.update(Math.min(0.08, Math.max(0, time - last)));
        last = time;
      },
    };
  };
}
