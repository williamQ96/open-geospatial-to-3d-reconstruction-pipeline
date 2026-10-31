// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";

export function createBuildingLabels(scene, viewport, camera, onSelect) {
  const renderer = new CSS2DRenderer();
  renderer.domElement.className = "label-layer";
  viewport.append(renderer.domElement);
  const entries = [];
  let enabled = true,
    selectedId = null,
    lastUpdate = -1,
    visibleCount = 0;
  const projected = new THREE.Vector3();
  return {
    renderer,
    populate(buildings) {
      for (const building of buildings) {
        if (!building.name) continue;
        const ring = building.footprint_enu_m;
        const x = ring.reduce((sum, p) => sum + p[0], 0) / ring.length;
        const north = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
        const button = document.createElement("button");
        button.className = "building-label";
        button.textContent = building.name;
        button.title = building.name;
        button.dataset.buildingId = building.id;
        button.setAttribute("aria-label", `Inspect ${building.name}`);
        button.addEventListener("pointerdown", (e) => e.stopPropagation());
        button.addEventListener("click", () => onSelect(building.id));
        const label = new CSS2DObject(button);
        label.position.set(x, building.roof_z_m + 3, -north);
        scene.add(label);
        entries.push({ building, label, button, position: label.position });
      }
    },
    resize(width, height) {
      renderer.setSize(width, height);
    },
    setEnabled(value) {
      enabled = value;
      lastUpdate = -1;
      renderer.domElement.hidden = !value && !selectedId;
    },
    setSelected(id) {
      selectedId = id;
      lastUpdate = -1;
      renderer.domElement.hidden = !enabled && !id;
      for (const entry of entries) {
        entry.button.classList.toggle("is-selected", entry.building.id === id);
        entry.button.classList.remove("is-pinned");
        entry.button.setAttribute(
          "aria-pressed",
          String(entry.building.id === id),
        );
      }
    },
    update(time) {
      if (!enabled && !selectedId) return;
      // Screen-facing labels stay horizontal at every orbit; declutter overlaps.
      if (time - lastUpdate > 120 || lastUpdate < 0) {
        lastUpdate = time;
        const width = viewport.clientWidth,
          height = viewport.clientHeight,
          accepted = [];
        const sorted = entries
          .map((entry) => ({
            ...entry,
            distance: camera.position.distanceToSquared(entry.position),
          }))
          .sort(
            (a, b) =>
              Number(b.building.id === selectedId) -
                Number(a.building.id === selectedId) || a.distance - b.distance,
          );
        visibleCount = 0;
        for (const entry of sorted) {
          projected.copy(entry.position).project(camera);
          let x = (projected.x * 0.5 + 0.5) * width,
            y = (-projected.y * 0.5 + 0.5) * height;
          const w = Math.min(
              260,
              Math.max(96, entry.building.name.length * 6.2),
            ),
            h = 28;
          if (entry.building.id === selectedId) {
            x = THREE.MathUtils.clamp(x, w / 2 + 20, width - w / 2 - 20);
            y = THREE.MathUtils.clamp(y, 180, height - 180);
          }
          const rect = { x: x - w / 2, y: y - h, w, h };
          const inView =
            projected.z > -1 &&
            projected.z < 1 &&
            x > 25 &&
            x < width - 25 &&
            y > 90 &&
            y < height - 80;
          const overlaps = accepted.some(
            (r) =>
              rect.x < r.x + r.w + 10 &&
              rect.x + rect.w + 10 > r.x &&
              rect.y < r.y + r.h + 8 &&
              rect.y + rect.h + 8 > r.y,
          );
          entry.button.hidden =
            (entry.building.id === selectedId
              ? projected.z <= -1 || projected.z >= 1
              : !inView) ||
            (entry.building.id !== selectedId && (!enabled || overlaps));
          if (!entry.button.hidden) {
            accepted.push(rect);
            visibleCount++;
          }
        }
      }
      renderer.render(scene, camera);
      const selected = entries.find(
        (entry) => entry.building.id === selectedId,
      );
      if (selected) {
        const p = selected.position.clone().project(camera);
        const x = (p.x * 0.5 + 0.5) * viewport.clientWidth,
          y = (-p.y * 0.5 + 0.5) * viewport.clientHeight;
        const w = selected.button.offsetWidth || 160;
        const px = THREE.MathUtils.clamp(
          x,
          w / 2 + 20,
          viewport.clientWidth - w / 2 - 20,
        );
        const py = THREE.MathUtils.clamp(y, 180, viewport.clientHeight - 180);
        const pinned = Math.abs(px - x) > 0.5 || Math.abs(py - y) > 0.5;
        selected.button.classList.toggle("is-pinned", pinned);
        if (pinned) {
          selected.button.style.transform = `translate(-50%, -50%) translate(${px}px, ${py}px)`;
          selected.button.style.setProperty(
            "--pin-angle",
            `${Math.atan2(x - px, py - y)}rad`,
          );
        }
        selected.button.style.zIndex = String(entries.length + 1);
      }
    },
    get count() {
      return entries.length;
    },
    get visibleCount() {
      return visibleCount;
    },
    projectedLabel(id) {
      const entry = entries.find((e) => e.building.id === id);
      if (!entry) return null;
      const p = entry.position.clone().project(camera);
      return {
        name: entry.building.name,
        anchor: entry.position.toArray(),
        screen: [
          (p.x * 0.5 + 0.5) * viewport.clientWidth,
          (-p.y * 0.5 + 0.5) * viewport.clientHeight,
        ],
        transform: entry.button.style.transform,
        visible: !entry.button.hidden,
      };
    },
  };
}
