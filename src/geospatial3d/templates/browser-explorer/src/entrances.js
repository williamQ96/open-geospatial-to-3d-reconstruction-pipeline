// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { insidePolygon, isBlocked, sampleGround } from "./world.js";

// Estimated frontage, not a claim about real accessibility or surveyed doors.
// Per-ID ENU overrides can replace this inference without editing the shared viewer.
export function inferEntrances(buildings, half, overrides = {}) {
  return buildings
    .map((building) => {
      const ring = building.footprint_enu_m,
        candidates = [];
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i],
          b = ring[(i + 1) % ring.length];
        const dx = b[0] - a[0],
          dn = b[1] - a[1],
          length = Math.hypot(dx, dn);
        if (length < 1.3) continue;
        const east = (a[0] + b[0]) / 2,
          north = (a[1] + b[1]) / 2;
        let nx = -dn / length,
          nn = dx / length;
        if (insidePolygon(east + nx * 0.1, north + nn * 0.1, ring)) {
          nx *= -1;
          nn *= -1;
        }
        candidates.push({ east, north, nx, nn, length });
      }
      candidates.sort((a, b) => b.length - a.length);
      const override = overrides[building.id];
      if (
        Array.isArray(override?.position_enu_m) &&
        override.position_enu_m.length === 2 &&
        override.position_enu_m.every(Number.isFinite) &&
        Number.isFinite(override.outward_degrees)
      ) {
        const angle = (override.outward_degrees * Math.PI) / 180;
        candidates.unshift({
          east: override.position_enu_m[0],
          north: override.position_enu_m[1],
          nx: Math.sin(angle),
          nn: Math.cos(angle),
          authored: true,
        });
      }
      const clear = (p) =>
        !isBlocked(
          p.east + p.nx * 2.5,
          -p.north - p.nn * 2.5,
          buildings,
          half,
          0.5,
        );
      const candidate = candidates.find(clear) || candidates[0];
      if (!candidate) return null;
      const { east, north, nx, nn } = candidate;
      return {
        id: building.id,
        name: building.name || "Campus building",
        position: [east, -north],
        outward: [nx, -nn],
        approach: [east + nx * 2.5, -north - nn * 2.5],
        estimated: !candidate.authored,
        walkable: clear(candidate),
      };
    })
    .filter(Boolean);
}

export function createEntrances({
  scene,
  buildings,
  half,
  field,
  meshesById,
  overrides,
  onEnter,
}) {
  const entries = inferEntrances(buildings, half, overrides);
  const frameParts = [
    [-0.9, 1.4, 0, 0.15, 2.8, 0.24],
    [0.9, 1.4, 0, 0.15, 2.8, 0.24],
    [0, 2.8, 0, 1.95, 0.16, 0.24],
  ].map(([x, y, z, w, h, d]) =>
    new THREE.BoxGeometry(w, h, d).translate(x, y, z),
  );
  const frameGeometry = mergeGeometries(frameParts);
  frameParts.forEach((p) => p.dispose());
  const frame = new THREE.InstancedMesh(
    frameGeometry,
    new THREE.MeshStandardMaterial({ color: 0xead5a0, roughness: 0.85 }),
    entries.length,
  );
  const door = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.65, 2.65, 0.12).translate(0, 1.35, 0),
    new THREE.MeshStandardMaterial({ color: 0x285d51, roughness: 0.72 }),
    entries.length,
  );
  frame.name = "Estimated entrance frames";
  door.name = "Building entrance portals";
  const matrix = new THREE.Matrix4(),
    quaternion = new THREE.Quaternion(),
    ray = new THREE.Raycaster();
  for (const [i, entry] of entries.entries()) {
    let [x, z] = entry.position;
    const [nx, nz] = entry.outward;
    let y = sampleGround(field, x, z);
    const target = meshesById.get(entry.id);
    if (target) {
      target.updateWorldMatrix(true, true);
      ray.set(
        new THREE.Vector3(x + nx * 6, y + 1.35, z + nz * 6),
        new THREE.Vector3(-nx, 0, -nz),
      );
      ray.far = 12;
      const hit = ray
        .intersectObject(target, true)
        .find(
          (h) =>
            Math.abs(
              h.face.normal.clone().transformDirection(h.object.matrixWorld).y,
            ) < 0.35,
        );
      if (hit) {
        x = hit.point.x;
        z = hit.point.z;
        y = sampleGround(field, x, z);
      }
    }
    entry.position = [x + nx * 0.14, z + nz * 0.14];
    entry.ground = y;
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(nx, nz));
    matrix.compose(
      new THREE.Vector3(entry.position[0], y, entry.position[1]),
      quaternion,
      new THREE.Vector3(1, 1, 1),
    );
    frame.setMatrixAt(i, matrix);
    door.setMatrixAt(i, matrix);
  }
  frame.computeBoundingSphere();
  door.computeBoundingSphere();
  scene.add(frame, door);
  const button = document.createElement("button");
  button.className = "entrance-action";
  button.hidden = true;
  scene.userData.entranceCount = entries.length;
  document.querySelector("#app").append(button);
  let nearby = null;
  button.addEventListener("click", () => nearby && onEnter(nearby));
  return {
    entries,
    update(player, view, paused) {
      let nearest = null,
        best = 5;
      if (view !== "aerial" && !paused)
        for (const entry of entries) {
          const d = Math.hypot(
            player.x - entry.position[0],
            player.z - entry.position[1],
          );
          if (d < best && Math.abs(player.y - entry.ground) < 2.2) {
            best = d;
            nearest = entry;
          }
        }
      if (nearby !== nearest) {
        nearby = nearest;
        button.hidden = !nearby;
        if (nearby) button.textContent = `Enter ${nearby.name} · E`;
      }
    },
    activate() {
      if (nearby) {
        onEnter(nearby);
        return true;
      }
      return false;
    },
    pick(raycaster, wallDistance = Infinity) {
      const hit = raycaster.intersectObjects([door, frame], false)[0];
      if (hit && hit.distance <= wallDistance + 0.35) {
        onEnter(entries[hit.instanceId]);
        return true;
      }
      return false;
    },
    get nearby() {
      return nearby?.id || null;
    },
  };
}
