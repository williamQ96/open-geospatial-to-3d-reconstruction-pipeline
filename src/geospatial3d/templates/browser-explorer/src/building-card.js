// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";

export function createBuildingCard(viewport, camera, { onEnter, onClose }) {
  const card = document.createElement("section");
  card.className = "building-card";
  card.hidden = true;
  card.setAttribute("aria-labelledby", "building-card-name");
  const heading = document.createElement("h2");
  heading.id = "building-card-name";
  const close = document.createElement("button");
  close.className = "building-card-close";
  close.textContent = "×";
  close.setAttribute("aria-label", "Close building card");
  const info = document.createElement("p");
  info.textContent = "to be fill";
  const enter = document.createElement("button");
  enter.className = "building-card-enter";
  enter.textContent = "Enter";
  card.append(heading, close, info, enter);
  viewport.append(card);
  for (const type of ["pointerdown", "pointerup", "wheel"])
    card.addEventListener(type, (event) => event.stopPropagation());
  close.onclick = onClose;
  enter.onclick = () => record && onEnter(record);
  let record = null,
    anchor = new THREE.Vector3(),
    lastPosition = "";
  return {
    show(building, position) {
      record = building;
      card.dataset.buildingId = building.id;
      heading.textContent = building.name || "Unidentified structure";
      anchor.copy(position);
      card.hidden = false;
      lastPosition = "";
    },
    hide() {
      record = null;
      card.hidden = true;
    },
    update() {
      if (!record) return;
      const point = anchor.clone().project(camera);
      card.hidden = point.z <= -1 || point.z >= 1;
      if (card.hidden) return;
      const width = viewport.clientWidth,
        height = viewport.clientHeight,
        w = card.offsetWidth,
        h = card.offsetHeight;
      const top = height < 500 ? 88 : width <= 600 ? 154 : 174,
        bottom = width <= 600 || height < 500 ? 110 : 24;
      const x = THREE.MathUtils.clamp(
        ((point.x + 1) * width) / 2 + 18,
        12,
        Math.max(12, width - w - 12),
      );
      const maxY = Math.max(12, height - bottom - h);
      const y = THREE.MathUtils.clamp(
        ((1 - point.y) * height) / 2 - h / 2,
        Math.min(top, maxY),
        maxY,
      );
      const position = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      if (position !== lastPosition) {
        card.style.transform = position;
        lastPosition = position;
      }
    },
  };
}
