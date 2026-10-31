// SPDX-License-Identifier: Apache-2.0
// Original, exportable low-poly props. No brands, logos or third-party geometry.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function createCampusProp(kind = "car", color = 0x567a72) {
  const parts = [];
  function add(geometry, x, y, z, c, rotation = [0, 0, 0]) {
    geometry.rotateX(rotation[0]);
    geometry.rotateY(rotation[1]);
    geometry.rotateZ(rotation[2]);
    geometry.translate(x, y, z);
    if (geometry.index) geometry = geometry.toNonIndexed();
    const rgb = new THREE.Color(c),
      colors = [];
    for (let i = 0; i < geometry.attributes.position.count; i++)
      colors.push(rgb.r, rgb.g, rgb.b);
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.deleteAttribute("uv");
    parts.push(geometry);
  }
  const box = (w, h, d, x, y, z, c) =>
    add(new THREE.BoxGeometry(w, h, d), x, y, z, c);
  const wheel = (x, y, z, r = 0.32) =>
    add(new THREE.CylinderGeometry(r, r, 0.16, 10), x, y, z, 0x273334, [
      0,
      0,
      Math.PI / 2,
    ]);
  const beam = (a, b, r, c) => {
    const va = new THREE.Vector3(...a),
      vb = new THREE.Vector3(...b),
      g = new THREE.CylinderGeometry(r, r, va.distanceTo(vb), 6);
    g.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        vb.sub(va).normalize(),
      ),
    );
    add(
      g,
      ...va
        .add(new THREE.Vector3(...b))
        .multiplyScalar(0.5)
        .toArray(),
      c,
    );
  };
  if (["car", "van", "pickup"].includes(kind)) {
    const van = kind === "van";
    box(1.8, 0.65, van ? 4.7 : 4.2, 0, 0.7, 0, color);
    box(
      1.6,
      van ? 1.35 : 0.7,
      van ? 3.3 : 2.1,
      0,
      van ? 1.5 : 1.35,
      van ? -0.35 : -0.1,
      color,
    );
    box(1.62, 0.5, 0.045, 0, van ? 1.65 : 1.43, van ? 1.32 : 1, 0x69958e);
    box(1.62, 0.5, 0.045, 0, van ? 1.65 : 1.43, van ? -2 : -1.2, 0x69958e);
    for (const x of [-0.815, 0.815])
      box(0.045, 0.48, van ? 2.6 : 1.8, x, van ? 1.65 : 1.43, -0.13, 0x69958e);
    for (const x of [-0.91, 0.91])
      for (const z of [-1.3, 1.3]) wheel(x, 0.39, z, 0.36);
    for (const x of [-0.62, 0.62]) {
      box(0.35, 0.17, 0.055, x, 0.78, van ? 2.37 : 2.13, 0xf5edc7);
      box(0.35, 0.17, 0.055, x, 0.78, van ? -2.37 : -2.13, 0xa95143);
    }
    if (kind === "pickup") {
      box(1.3, 0.12, 1.2, 0, 1.09, -1.35, 0x394543);
    }
  } else {
    const bike = kind === "bicycle",
      r = bike ? 0.32 : 0.16,
      front = bike ? 0.65 : 0.58,
      back = -front;
    wheel(0, r, front, r);
    wheel(0, r, back, r);
    if (bike) {
      beam([0, r, back], [0, 0.9, -0.2], 0.045, color);
      beam([0, 0.9, -0.2], [0, r, front], 0.045, color);
      beam([0, r, back], [0, 0.45, 0], 0.045, color);
      beam([0, 0.45, 0], [0, r, front], 0.045, color);
      box(0.32, 0.1, 0.36, 0, 0.96, -0.2, 0x34433d);
    } else box(0.3, 0.1, 1.15, 0, 0.18, 0, color);
    beam([0, r, front], [0, 1.1, front - 0.1], 0.045, color);
    beam([-0.3, 1.1, front - 0.1], [0.3, 1.1, front - 0.1], 0.035, 0x283a34);
    // Original stylized rider; bent arms and legs, neutral green/yellow outfit.
    box(0.4, 0.54, 0.25, 0, bike ? 1.35 : 1.35, bike ? -0.16 : 0, 0x285d43);
    add(
      new THREE.SphereGeometry(0.16, 8, 6),
      0,
      1.81,
      bike ? -0.08 : 0,
      0xd3b89a,
    );
    add(
      new THREE.SphereGeometry(0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      0,
      1.85,
      bike ? -0.08 : 0,
      0xd3b64b,
    );
    for (const x of [-0.14, 0.14]) {
      beam([x, 1.45, 0], [x, 1.1, front - 0.1], 0.065, 0x285d43);
      beam([x, 1.08, -0.1], [x, 0.75, 0.27], 0.075, 0x333e42);
      beam(
        [x, 0.75, 0.27],
        [x, bike ? 0.4 : 0.27, bike ? 0 : -0.12],
        0.065,
        0x333e42,
      );
    }
  }
  const geometry = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
  );
  mesh.name = `Original campus ${kind}`;
  mesh.receiveShadow = true;
  mesh.userData = {
    asset_kind: "campus-prop",
    license: "CC-BY-4.0",
    author: "Open Campus contributors",
    kind,
  };
  return mesh;
}
