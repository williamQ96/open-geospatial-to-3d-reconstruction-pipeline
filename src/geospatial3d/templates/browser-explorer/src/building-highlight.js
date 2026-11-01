// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { insidePolygon, isBlocked } from "./world.js";
import { setEmissive } from "./presentation.js";

export function resolveBuildingHit(hit, records) {
  if (!hit) return null;
  const data = hit.object.userData;
  if (data.asset_kind === "context-building-batch") {
    return (
      data.asset_ids.find((id) => {
        const b = records.get(id);
        return (
          b &&
          (insidePolygon(hit.point.x, -hit.point.z, b.footprint_enu_m) ||
            isBlocked(hit.point.x, hit.point.z, [b], Infinity, 0.05))
        );
      }) || null
    );
  }
  const id = data.asset_id || hit.object.name;
  return records.has(id) ? id : null;
}

// Individual art meshes use gentle emissive tint. Batches retain their draw-call
// savings: only the hovered/selected footprint gets a lightweight edge cue.
export function createBuildingHighlight(scene, meshesById, records) {
  let hover = null,
    selected = null;
  const outlines = new Map();
  function paint(id, color) {
    if (!id) return;
    const mesh = meshesById.get(id);
    if (mesh) {
      setEmissive(mesh, color);
      return;
    }
    let outline = outlines.get(id);
    if (!color) {
      if (outline) {
        scene.remove(outline);
        outline.geometry.dispose();
        outline.material.dispose();
        outlines.delete(id);
      }
      return;
    }
    if (!outline) {
      const b = records.get(id);
      if (!b) return;
      const points = [],
        ring = b.footprint_enu_m;
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i],
          c = ring[(i + 1) % ring.length];
        for (const y of [b.base_z_m + 0.1, b.roof_z_m + 0.1])
          points.push(
            new THREE.Vector3(a[0], y, -a[1]),
            new THREE.Vector3(c[0], y, -c[1]),
          );
        points.push(
          new THREE.Vector3(a[0], b.base_z_m + 0.1, -a[1]),
          new THREE.Vector3(a[0], b.roof_z_m + 0.1, -a[1]),
        );
      }
      outline = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: 0xf5e7b2,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        }),
      );
      outline.name = "Building interaction outline";
      scene.add(outline);
      outlines.set(id, outline);
    }
    outline.material.opacity = id === selected ? 0.8 : 0.4;
  }
  function refresh(id) {
    paint(id, id === selected ? 0x273d1d : id === hover ? 0x11180e : 0);
  }
  return {
    hover(id) {
      if (id === hover) return;
      const previous = hover;
      hover = id;
      refresh(previous);
      refresh(id);
    },
    select(id) {
      const previous = selected;
      selected = id;
      refresh(previous);
      refresh(id);
    },
    refresh() {
      refresh(selected);
      if (hover !== selected) refresh(hover);
    },
    get hovered() {
      return hover;
    },
  };
}
