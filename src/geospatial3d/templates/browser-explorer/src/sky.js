// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { randomSource } from "./npc-templates.js";

export function createSky(scene) {
  const root = new THREE.Group();
  root.name = "Blue sky and soft block clouds";
  scene.add(root);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
    fog: false,
    vertexShader:
      "varying vec3 skyDirection; void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:
      "varying vec3 skyDirection;void main(){float h=clamp(normalize(skyDirection).y,0.0,1.0);vec3 c=mix(vec3(.74,.86,.92),vec3(.22,.53,.79),pow(h,.65));gl_FragColor=vec4(c,1.0);}",
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(6800, 24, 16), material);
  dome.renderOrder = -1000;
  root.add(dome);
  const rng = randomSource(19347),
    parts = [];
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2,
      distance = 2600 + rng() * 1000,
      x = Math.cos(angle) * distance,
      z = Math.sin(angle) * distance,
      y = 400 + rng() * 600;
    for (let j = 0; j < 5; j++) {
      const g = new RoundedBoxGeometry(
        190 + rng() * 150,
        42 + rng() * 18,
        130 + rng() * 110,
        2,
        8,
      );
      g.translate(x + (j - 2) * 110, y + (j % 2) * 9, z + (rng() - 0.5) * 130);
      parts.push(g);
    }
  }
  const cloudGeometry = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  const clouds = new THREE.Mesh(
    cloudGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xf6f8f3,
      transparent: true,
      opacity: 0.91,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  clouds.name = "Rounded voxel cloud layer";
  clouds.renderOrder = -999;
  root.add(clouds);
  return {
    update(camera, time, reduced = false) {
      root.position.copy(camera.position);
      if (!reduced) clouds.rotation.y = time * 0.00055;
    },
    state: () => ({ blue: true, clouds: 18, roundedEdges: true }),
  };
}
