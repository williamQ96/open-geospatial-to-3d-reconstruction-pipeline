// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { distance, routeSample } from "./routing.js";

export function createRouteView(scene, ground) {
  const root = new THREE.Group();
  root.name = "Outdoor navigation";
  scene.add(root);
  const blue = new THREE.MeshBasicMaterial({
    color: 0x2584ef,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -12,
  });
  const white = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -12,
  });
  let ribbon = null,
    arrows = null,
    points = [],
    length = 0;
  const dummy = new THREE.Object3D();
  function clear() {
    for (const obj of [...root.children]) {
      root.remove(obj);
      obj.geometry.dispose();
      if (obj.material !== blue && obj.material !== white)
        obj.material.dispose();
    }
    ribbon = arrows = null;
    points = [];
    length = 0;
  }
  function set(route) {
    clear();
    if (!route || route.points.length < 2) return;
    const raw = route.points;
    points = [raw[0]];
    for (let i = 1; i < raw.length; i++) {
      const a = raw[i - 1],
        b = raw[i],
        n = Math.max(1, Math.ceil(distance(a, b) / 2));
      for (let j = 1; j <= n; j++)
        points.push([
          a[0] + ((b[0] - a[0]) * j) / n,
          a[1] + ((b[1] - a[1]) * j) / n,
        ]);
    }
    length = route.distance;
    const positions = [];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i],
        d = distance(a, b);
      if (d < 0.001) continue;
      const ox = (-(b[1] - a[1]) / d) * 1.15,
        on = ((b[0] - a[0]) / d) * 1.15;
      const v = (p, sign) => [
        p[0] + ox * sign,
        ground(p[0] + ox * sign, -p[1] - on * sign) + 0.12,
        -p[1] - on * sign,
      ];
      positions.push(
        ...v(a, -1),
        ...v(b, -1),
        ...v(b, 1),
        ...v(a, -1),
        ...v(b, 1),
        ...v(a, 1),
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    ribbon = new THREE.Mesh(geometry, blue);
    ribbon.renderOrder = 3;
    root.add(ribbon);
    // Two white diagonal strips form a ground-plane V pointing along local +Z.
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          -0.75, 0, -0.45, -0.52, 0, -0.65, 0.12, 0, 0.3, -0.75, 0, -0.45, 0.12,
          0, 0.3, -0.12, 0, 0.5, 0.75, 0, -0.45, 0.12, 0, 0.5, -0.12, 0, 0.3,
          0.75, 0, -0.45, -0.12, 0, 0.3, 0.52, 0, -0.65,
        ],
        3,
      ),
    );
    arrows = new THREE.InstancedMesh(
      g,
      white,
      Math.min(240, Math.max(1, Math.ceil(length / 8))),
    );
    arrows.frustumCulled = false;
    arrows.renderOrder = 4;
    root.add(arrows);
    for (const [index, p] of [points[0], points.at(-1)].entries()) {
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 0.18, 20),
        new THREE.MeshBasicMaterial({ color: index ? 0xffffff : 0x0f4caa }),
      );
      marker.position.set(p[0], ground(p[0], -p[1]) + 0.23, -p[1]);
      root.add(marker);
    }
  }
  function update(time) {
    if (!arrows || length < 0.01) return;
    for (let i = 0; i < arrows.count; i++) {
      const { point: p, direction: d } = routeSample(
        points,
        (i * 8 + time * 3) % length,
      );
      dummy.position.set(p[0], ground(p[0], -p[1]) + 0.16, -p[1]);
      dummy.rotation.set(0, Math.atan2(d[0], -d[1]), 0);
      dummy.updateMatrix();
      arrows.setMatrixAt(i, dummy.matrix);
    }
    arrows.instanceMatrix.needsUpdate = true;
  }
  return {
    root,
    set,
    clear,
    update,
    get points() {
      return points;
    },
    get length() {
      return length;
    },
  };
}
