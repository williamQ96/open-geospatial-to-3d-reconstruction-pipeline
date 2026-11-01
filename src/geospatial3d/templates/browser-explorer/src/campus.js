// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { installWorldLifecycle } from "./world-lifecycle.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createCharacter } from "./character.js";
import {
  sampleGround,
  isBlocked,
  movePlayer,
  startJump,
  stepVertical,
} from "./world.js";
import { createBuildingLabels } from "./labels.js";
import { createBuildingCard } from "./building-card.js";
import {
  createBuildingHighlight,
  resolveBuildingHit,
} from "./building-highlight.js";
import { createMinimap } from "./minimap.js";
import { createBuildingSearch } from "./search.js";
import {
  loadPresentation,
  setEmissive,
  sceneAssetUrl,
} from "./presentation.js";
import { createTouchControls, movementInput } from "./touch.js";
import { createEntrances } from "./entrances.js";
import { readReturn, enterInterior, RETURN_KEY } from "./scene-transition.js";
import { createAnalytics } from "./analytics.js";
import { loadStudentFactory } from "./student.js";
import { createRouter, distance } from "./routing.js";
import { createNavigation } from "./navigation.js";
import { createSky } from "./sky.js";
import {
  createOverviewDepth,
  freezeStaticTransforms,
} from "./render-stability.js";
import { createDeathFlow } from "./death.js";
import { applySurfaceGrain } from "./surface-grain.js";
import { createBetaRegistry } from "./beta.js";
import { createZombieSchool } from "./zombie-school.js";
import { createDeveloperTools } from "./developer.js";
import { createCampusLife } from "./life.js";
import { loadWildlifeFactory } from "./wildlife.js";
import { createWalkMotion, DENSITY_NAMES } from "./ambience.js";
import { createSound } from "./sound.js";
import { createFeedback } from "./feedback.js";
import { applyProfile } from "./profile.js";
import "@fontsource-variable/dm-sans";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./style.css";

let navigation,
  life,
  studentFactory,
  squirrelFactory,
  zombies,
  outdoorRouter,
  betaRegistry,
  entrances;
let sound = { step() {}, state: () => ({ enabled: false }) };
const walkMotion = createWalkMotion();
let motion = { bobX: 0, bobY: 0, roll: 0, walking: false, steps: 0 };
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let analytics = { event() {} };
const $ = (selector) => document.querySelector(selector);
const viewport = $("#viewport"),
  dialog = $("#settings-dialog");
const death = createDeathFlow({
  pause: () => {
    keys.clear();
    drag = null;
    touchControls.reset();
    walkMotion.reset();
  },
});
const modalOpen = () => dialog.open || $("#feedback-dialog").open || death.dead;
const developer = createDeveloperTools({
  getLife: () => ({
    inspect: (id) => life?.inspect(id) || zombies?.inspect(id),
  }),
});
const views = ["third", "first", "aerial"],
  keys = new Set();
let view = "aerial",
  yaw = Math.PI * 0.14,
  pitch = 0.08,
  followDistance = 7.5,
  drag = null,
  manifest,
  profile,
  viewerSettings,
  field,
  half,
  model,
  terrainMesh,
  drawMap,
  presentation;
let buildings = [],
  elapsed = 0,
  lastTime = 0,
  frames = 0,
  lastFps = 0,
  fps = 0,
  moving = false,
  selected = null,
  selectedId = null,
  searchFocusId = null,
  focusCameraTarget = null,
  cameraTransition = null,
  selectedMapTarget = null;
const player = new THREE.Vector3(),
  vertical = { velocity: 0, grounded: true };
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe3e5e4);
scene.fog = new THREE.Fog(0xe3e5e4, 3500, 7500);
const camera = new THREE.PerspectiveCamera(45, 1, 0.08, 9000);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
viewport.append(renderer.domElement);
installWorldLifecycle(renderer, scene);
const touchControls = createTouchControls(renderer.domElement, {
  enabled: () => view !== "aerial" && !modalOpen() && !!field,
  onLook: (dx, dy) => {
    focusCameraTarget = null;
    yaw -= dx * 0.004;
    pitch = THREE.MathUtils.clamp(pitch + dy * 0.003, -0.7, 0.9);
  },
  onTap: selectAt,
  onMove: () => {
    analytics.event("touch-walk");
    focusCameraTarget = null;
    cancelCameraTransition();
  },
});
const touchHint = document.createElement("p");
touchHint.className = "touch-hint";
touchHint.textContent =
  "Lower half: drag to walk / run · Upper half: drag to look";
$("#app").append(touchHint);
const sky = createSky(scene);
scene.add(new THREE.HemisphereLight(0xffffff, 0x929b94, 1.9));
const sun = new THREE.DirectionalLight(0xfff9ef, 2.4);
sun.position.set(-1400, 2400, 1300);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {
  left: -1450,
  right: 1450,
  top: 1450,
  bottom: -1450,
  near: 1,
  far: 6500,
});
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.3;
scene.add(sun);
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.07;
orbit.minDistance = 12;
orbit.maxDistance = 6000;
orbit.maxPolarAngle = Math.PI * 0.48;
let character = createCharacter();
character.root.traverse((object) => {
  if (object.isMesh) object.castShadow = false;
});
scene.add(character.root);
const contactShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.4, 24),
  new THREE.MeshBasicMaterial({
    color: 0x344039,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  }),
);
contactShadow.rotation.x = -Math.PI / 2;
scene.add(contactShadow);
const meshesById = new Map(),
  collisionMeshes = [];
const buildingRecords = new Map();
const buildingHighlight = createBuildingHighlight(
  scene,
  meshesById,
  buildingRecords,
);
let hoverPointer = null,
  hoverPending = false,
  lastHover = 0;
const buildingCard = createBuildingCard(viewport, camera, {
  onEnter: enterBuilding,
  onClose: clearSelection,
});
const raycaster = new THREE.Raycaster(),
  cameraRay = new THREE.Raycaster();
const labels = createBuildingLabels(
  scene,
  viewport,
  camera,
  selectBuilding,
  (id) => buildingHighlight.hover(id),
);
const buildingSearch = createBuildingSearch($("#building-search"), {
  onSelect: focusBuilding,
  onClear: clearSelection,
  onFocus: () => {
    keys.clear();
    drag = null;
    touchControls.reset();
  },
});
orbit.addEventListener("start", cancelCameraTransition);
function resize() {
  touchControls.reset();
  const w = viewport.clientWidth,
    h = viewport.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  labels.resize(w, h);
}
addEventListener("resize", resize);
resize();

function setView(next) {
  walkMotion.reset();
  motion = { ...motion, bobX: 0, bobY: 0, roll: 0, walking: false };
  if (!views.includes(next)) return;
  if (next !== view) analytics.event("view-" + next);
  cancelCameraTransition();
  focusCameraTarget = null;
  touchControls.reset();
  drag = null;
  view = next;
  $("#app").dataset.view = view;
  orbit.enabled = view === "aerial";
  character.root.visible = view !== "first";
  keys.clear();
  document
    .querySelectorAll("[data-view]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.view === view)),
    );
  if (view === "aerial") {
    const overview = presentation?.config.overview;
    orbit.target.fromArray(
      overview?.target || [0, field ? sampleGround(field, 0, 0) + 5 : 0, 0],
    );
    const scale = half || 1000;
    camera.position
      .copy(orbit.target)
      .add(
        new THREE.Vector3(
          ...(overview?.offset || [scale * 1.5, scale * 2, scale * 1.65]),
        ),
      );
    orbit.update();
  } else if (view === "first") {
    pitch = 0;
    camera.position.copy(player).add(new THREE.Vector3(0, 1.58, 0));
  } else {
    pitch = 0.08;
    camera.position
      .copy(player)
      .add(
        new THREE.Vector3(
          Math.sin(yaw) * followDistance,
          1.58 + (1 + pitch * 3) * (followDistance / 7.5),
          Math.cos(yaw) * followDistance,
        ),
      );
    camera.lookAt(player.clone().add(new THREE.Vector3(0, 1.58, 0)));
  }
  if (searchFocusId) focusBuilding(searchFocusId, { animate: false });
  navigation?.modeChanged();
  syncBuildingCard();
}
document
  .querySelectorAll("[data-view]")
  .forEach((button) =>
    button.addEventListener("click", () => setView(button.dataset.view)),
  );
function resetPlayer() {
  if (!manifest) return;
  clearSelection();
  player.set(manifest.spawn_enu_m[0], 0, -manifest.spawn_enu_m[1]);
  if (isBlocked(player.x, player.z, buildings, half)) {
    const origin = player.clone();
    let found = false;
    for (let r = 2; r < 100 && !found; r += 2)
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
        const x = origin.x + Math.cos(a) * r,
          z = origin.z + Math.sin(a) * r;
        if (!isBlocked(x, z, buildings, half)) {
          player.set(x, 0, z);
          found = true;
          break;
        }
      }
    if (!found) throw new Error("No walkable starting point was found.");
  }
  player.y = sampleGround(field, player.x, player.z);
  vertical.velocity = 0;
  vertical.grounded = true;
  character.root.position.copy(player);
  const target = viewerSettings?.spawn_look_at_enu_m;
  yaw = target
    ? Math.atan2(player.x - target[0], player.z + target[1])
    : Math.PI * 0.14;
  // The character's chest faces local +Z; the camera looks along -Z.
  character.root.rotation.y = yaw + Math.PI;
  followDistance = 7.5;
}
$("#reset").addEventListener("click", () => {
  analytics.event("return-to-start");
  resetPlayer();
  setView(view);
});
function setSettingsTab(tab) {
  for (const name of ["settings", "beta", "about"]) {
    $("#" + name + "-panel").hidden = name !== tab;
    $("#" + name + "-tab").setAttribute("aria-selected", String(name === tab));
  }
}
$("#settings-open").addEventListener("click", () => {
  analytics.event("settings-open");
  keys.clear();
  drag = null;
  touchControls.reset();
  walkMotion.reset();
  motion = { ...motion, bobX: 0, bobY: 0, roll: 0, walking: false };
  dialog.showModal();
});
$("#settings-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => viewport.focus({ preventScroll: true }));
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      dialog.close();
  }
});
$("#settings-tab").addEventListener("click", () => setSettingsTab("settings"));
$("#beta-tab").addEventListener("click", () => setSettingsTab("beta"));
$("#motion-setting").addEventListener("input", (e) => {
  const name = DENSITY_NAMES[Number(e.target.value)];
  $("#motion-value").textContent = name;
  e.target.setAttribute("aria-valuetext", name);
});
$("#about-tab").addEventListener("click", () => setSettingsTab("about"));
$("#show-labels").addEventListener("change", (event) =>
  labels.setEnabled(event.target.checked),
);
$("#wireframe-setting").addEventListener("change", (event) =>
  model?.traverse((object) => {
    if (object.isMesh)
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        material.wireframe = event.target.checked;
  }),
);
$("#shadows-setting").addEventListener("change", (event) => {
  renderer.shadowMap.enabled = event.target.checked;
  renderer.shadowMap.needsUpdate = true;
  model?.traverse((object) => {
    if (object.isMesh) object.material.needsUpdate = true;
  });
});

addEventListener("keydown", (event) => {
  if (
    modalOpen() ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  if (event.code === "Slash") {
    event.preventDefault();
    $("#building-search-input").focus();
    return;
  }
  if (event.code === "Escape" && selectedId) {
    clearSelection();
    return;
  }
  if (
    [
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Space",
    ].includes(event.code)
  )
    event.preventDefault();
  keys.add(event.code);
  if (!event.repeat) {
    if (event.code === "KeyE") {
      event.preventDefault();
      entrances?.activate();
    }
    if (event.code === "Space") startJump(vertical);
    if (event.code === "KeyV") setView(views[(views.indexOf(view) + 1) % 3]);
    if (["Digit1", "Digit2", "Digit3"].includes(event.code))
      setView(views[Number(event.code.slice(-1)) - 1]);
  }
});
addEventListener("keyup", (event) => keys.delete(event.code));
addEventListener("blur", () => {
  keys.clear();
  drag = null;
  touchControls.reset();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    keys.clear();
    drag = null;
    touchControls.reset();
  }
});
renderer.domElement.addEventListener("pointerdown", (event) => {
  buildingHighlight.hover(null);
  focusCameraTarget = null;
  cancelCameraTransition();
  viewport.focus({ preventScroll: true });
  drag = {
    x: event.clientX,
    y: event.clientY,
    startX: event.clientX,
    startY: event.clientY,
  };
  if (view !== "aerial") renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener("pointermove", (event) => {
  if (event.pointerType === "mouse" && !drag) {
    hoverPointer = { clientX: event.clientX, clientY: event.clientY };
    hoverPending = true;
  }
  if (!drag || view === "aerial") return;
  yaw -= (event.clientX - drag.x) * 0.004;
  pitch = THREE.MathUtils.clamp(
    pitch + (event.clientY - drag.y) * 0.003,
    -0.7,
    0.9,
  );
  drag.x = event.clientX;
  drag.y = event.clientY;
});
renderer.domElement.addEventListener("pointerup", (event) => {
  if (
    drag &&
    Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5
  )
    selectAt(event);
  drag = null;
  touchControls.reset();
});
renderer.domElement.addEventListener("pointercancel", () => {
  drag = null;
  touchControls.reset();
});
viewport.addEventListener(
  "wheel",
  (event) => {
    if (view !== "third" || modalOpen() || event.ctrlKey || event.metaKey)
      return;
    event.preventDefault();
    const delta =
      event.deltaY *
      (event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? viewport.clientHeight
          : 1);
    followDistance = THREE.MathUtils.clamp(
      followDistance * Math.exp(THREE.MathUtils.clamp(delta * 0.0015, -1, 1)),
      2.5,
      30,
    );
  },
  { passive: false },
);
renderer.domElement.addEventListener("pointerleave", () => {
  hoverPointer = null;
  hoverPending = false;
  buildingHighlight.hover(null);
  renderer.domElement.style.cursor = "";
});
orbit.addEventListener("start", () => {
  buildingHighlight.hover(null);
  hoverPending = false;
});
orbit.addEventListener("end", () => {
  hoverPending = !!hoverPointer;
});
function buildingAnchor(record) {
  const ring = record.footprint_enu_m;
  return new THREE.Vector3(
    ring.reduce((sum, p) => sum + p[0], 0) / ring.length,
    record.roof_z_m + 3,
    -ring.reduce((sum, p) => sum + p[1], 0) / ring.length,
  );
}
function cancelCameraTransition() {
  cameraTransition = null;
  orbit.enableDamping = true;
}
function clearSelection() {
  buildingHighlight.select(null);
  selected = null;
  selectedId = searchFocusId = null;
  focusCameraTarget = selectedMapTarget = null;
  cancelCameraTransition();
  labels.setSelected(null);
  buildingSearch.setSelection(null);
  $("#selection").hidden = true;
  buildingCard.hide();
  labels.setSuppressed(null);
}
function selectBuilding(id, { fromSearch = false } = {}) {
  const record = buildings.find((building) => building.id === id);
  if (!record) {
    clearSelection();
    return;
  }
  cancelCameraTransition();
  focusCameraTarget = null;
  selected = meshesById.get(id) || null;
  selectedId = id;
  searchFocusId = fromSearch ? id : null;
  selectedMapTarget = buildingAnchor(record);
  labels.setSelected(record.name ? id : null);
  buildingSearch.setSelection(record);
  $("#selection").hidden = false;
  buildingHighlight.select(id);
  const title = document.createElement("strong");
  title.textContent = record.name || "Unidentified structure";
  const detail = document.createElement("span");
  detail.textContent =
    (presentation?.config.replaces_building_ids.includes(id)
      ? presentation.config.landmark_building_ids?.includes(id)
        ? "Photo-informed art model · Approximate dimensions"
        : "Stylized historical envelope"
      : record.status === "approximate-context-placeholder"
        ? "Approximate building envelope"
        : "Historical roof estimate") +
    " · " +
    record.height_m.toFixed(1) +
    " m";
  $("#selection").replaceChildren(title, detail);
  syncBuildingCard();
}
function syncBuildingCard() {
  const record = buildingRecords.get(selectedId);
  const shown = view === "aerial" && !!record;
  if (shown) buildingCard.show(record, buildingAnchor(record));
  else buildingCard.hide();
  labels.setSuppressed(shown ? selectedId : null);
  $("#selection").hidden = !record || shown;
}
function focusBuilding(id, { animate = true } = {}) {
  const record = buildings.find((building) => building.id === id);
  if (!record?.name) return;
  analytics.event("building-search-selected");
  keys.clear();
  drag = null;
  touchControls.reset();
  selectBuilding(id, { fromSearch: true });
  navigation?.acceptBuilding(record);
  const anchor = buildingAnchor(record);
  if (view === "aerial") {
    const target = anchor.clone();
    target.y = (record.base_z_m + record.roof_z_m) / 2;
    const ring = record.footprint_enu_m;
    const width =
      Math.max(...ring.map((p) => p[0])) - Math.min(...ring.map((p) => p[0]));
    const depth =
      Math.max(...ring.map((p) => p[1])) - Math.min(...ring.map((p) => p[1]));
    const radius = Math.hypot(width, depth, record.height_m) / 2;
    const halfAngle = Math.min(
      THREE.MathUtils.degToRad(camera.fov) / 2,
      Math.atan(
        Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect,
      ),
    );
    let horizontal =
      Math.max(70, (radius / Math.sin(halfAngle)) * 1.2) / Math.SQRT2;
    const direction = camera.position.clone().sub(orbit.target).setY(0);
    if (direction.lengthSq() < 0.001) direction.set(1, 0, 1);
    direction.normalize();
    const position = target.clone();
    for (let i = 0; i < 8; i++) {
      position.copy(target).addScaledVector(direction, horizontal);
      position.y += horizontal;
      if (position.y > sampleGround(field, position.x, position.z) + 5) break;
      horizontal *= 1.25;
    }
    orbit.enableDamping = false;
    orbit.update();
    if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cameraTransition = {
        fromPosition: camera.position.clone(),
        fromTarget: orbit.target.clone(),
        position,
        target,
        start: performance.now(),
      };
    } else {
      camera.position.copy(position);
      orbit.target.copy(target);
      orbit.update();
      orbit.enableDamping = true;
    }
  } else {
    focusCameraTarget = anchor.clone();
    focusCameraTarget.y = (record.base_z_m + record.roof_z_m) / 2;
    yaw = Math.atan2(player.x - anchor.x, player.z - anchor.z);
    const distance = Math.hypot(anchor.x - player.x, anchor.z - player.z);
    pitch = THREE.MathUtils.clamp(
      -Math.atan2(focusCameraTarget.y - player.y - 1.58, distance),
      -0.7,
      0.9,
    );
    character.root.rotation.y = yaw + Math.PI;
    updateCamera(0, true);
  }
  viewport.focus({ preventScroll: true });
}
function selectAt(event) {
  if (navigation?.picking) {
    const rect = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObject(terrainMesh, true)[0];
    if (hit) navigation.pin([hit.point.x, -hit.point.z]);
    return;
  }

  const box = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(
    new THREE.Vector2(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      (-(event.clientY - box.top) / box.height) * 2 + 1,
    ),
    camera,
  );
  const hit = raycaster.intersectObjects(collisionMeshes, false)[0];
  if (entrances?.pick(raycaster, hit?.distance)) return;
  if (developer.enabled && (life || zombies)) {
    const npc = raycaster.intersectObjects(
      [...(life?.pickables() || []), ...(zombies?.pickables() || [])],
      true,
    )[0];
    if (npc && (!hit || npc.distance < hit.distance)) {
      let root = npc.object;
      while (root && !root.userData.npcId) root = root.parent;
      if (root && developer.inspect(root.userData.npcId)) return;
    }
  }
  if (hit) selectBuilding(resolveBuildingHit(hit, buildingRecords));
  else clearSelection();
}
function updatePlayer(dt) {
  const previous = player.clone();
  const forward =
    (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
    (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  const right =
    (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
    (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  const input = movementInput(
    forward,
    right,
    keys.has("ShiftLeft") || keys.has("ShiftRight"),
    view !== "aerial" ? touchControls.axes : undefined,
  );
  moving = input.speed > 0;
  if (moving) {
    focusCameraTarget = null;
    const heading =
      view === "aerial"
        ? Math.atan2(
            camera.position.x - orbit.target.x,
            camera.position.z - orbit.target.z,
          )
        : yaw;
    const delta = {
      x:
        (-Math.sin(heading) * input.forward + Math.cos(heading) * input.right) *
        dt,
      z:
        (-Math.cos(heading) * input.forward - Math.sin(heading) * input.right) *
        dt,
    };
    const before = player.clone();
    movePlayer(
      player,
      delta,
      buildings,
      half,
      field,
      false,
      (x, z, y) =>
        life?.blockedPlayer(x, z, y) ||
        zombies?.blockedPlayer(x, z, y) ||
        false,
    );
    character.root.rotation.y = Math.atan2(
      player.x - before.x,
      player.z - before.z,
    );
  }
  const ground = sampleGround(field, player.x, player.z);
  stepVertical(player, vertical, dt, ground);
  const travelled = Math.hypot(player.x - previous.x, player.z - previous.z);
  moving = travelled > 0.0001;
  motion = walkMotion.update(dt, travelled, {
    grounded: vertical.grounded,
    enabled: view !== "aerial",
    reducedMotion: reducedMotion.matches,
    motionLevel: Number($("#motion-setting").value),
    running: travelled / Math.max(dt, 0.001) > 2.15,
  });
  if (motion.step) sound.step();
  character.root.position.copy(player);
  character.animate(elapsed, moving && vertical.grounded, motion);
  contactShadow.position.set(player.x, ground + 0.035, player.z);
  const altitude = player.y - ground;
  contactShadow.material.opacity = 0.16 / (1 + altitude);
  contactShadow.scale.setScalar(1 + altitude * 0.2);
}
function updateCamera(dt, snap = false) {
  if (view === "aerial") {
    if (cameraTransition) {
      const t = Math.min(1, (performance.now() - cameraTransition.start) / 650);
      const ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(
        cameraTransition.fromPosition,
        cameraTransition.position,
        ease,
      );
      orbit.target.lerpVectors(
        cameraTransition.fromTarget,
        cameraTransition.target,
        ease,
      );
      if (t === 1) {
        cameraTransition = null;
        orbit.enableDamping = true;
      }
    }
    orbit.update();
    return;
  }
  const eye = player.clone().add(new THREE.Vector3(0, 1.58, 0));
  if (view === "first") {
    eye.x += Math.cos(yaw) * motion.bobX;
    eye.z -= Math.sin(yaw) * motion.bobX;
    eye.y += motion.bobY;
    camera.position.copy(eye);
    if (focusCameraTarget) {
      camera.lookAt(focusCameraTarget);
      return;
    }
    camera.lookAt(
      eye
        .clone()
        .add(
          new THREE.Vector3(
            -Math.sin(yaw) * Math.cos(pitch),
            -Math.sin(pitch),
            -Math.cos(yaw) * Math.cos(pitch),
          ),
        ),
    );

    return;
  }
  const desired = eye
    .clone()
    .add(
      new THREE.Vector3(
        Math.sin(yaw) * followDistance,
        (1 + pitch * 3) * (followDistance / 7.5),
        Math.cos(yaw) * followDistance,
      ),
    );
  const direction = desired.clone().sub(eye),
    distance = direction.length();
  cameraRay.set(eye, direction.normalize());
  cameraRay.far = distance;
  const obstacle = cameraRay.intersectObjects(collisionMeshes, false)[0];
  if (obstacle)
    desired
      .copy(eye)
      .addScaledVector(direction, Math.max(0.5, obstacle.distance - 0.3));
  desired.y = Math.max(
    desired.y,
    sampleGround(field, desired.x, desired.z) + 0.4,
  );
  camera.position.lerp(desired, snap ? 1 : 1 - Math.exp(-dt * 12));
  camera.lookAt(focusCameraTarget || eye);
}
function enterBuilding(entry) {
  if (modalOpen()) return;
  const record = buildings.find((b) => b.id === entry.id);
  keys.clear();
  touchControls.reset();
  enterInterior(record, {
    interiorMode: view === "aerial" ? "overview" : "visit",
    player: player.toArray(),
    heroYaw: character.root.rotation.y,
    cameraPosition: camera.position.toArray(),
    orbitTarget: orbit.target.toArray(),
    yaw,
    pitch,
    followDistance,
    view,
    density: life?.state().densityLevel ?? 2,
    motionLevel: Number($("#motion-setting").value),
    soundEnabled: sound.state().enabled,
    settings: Object.fromEntries(
      [
        "show-labels",
        "shadows-setting",
        "toon-setting",
        "context-fog-setting",
        "wireframe-setting",
      ].map((id) => [id, $("#" + id).checked]),
    ),
  });
}
async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(url + ": HTTP " + response.status);
  return response.json();
}

try {
  const base = import.meta.env.BASE_URL + "scene/";
  profile = await loadJson(import.meta.env.BASE_URL + "viewer-profile.json");
  manifest = await loadJson(base + "manifest.json");
  viewerSettings = await loadJson(base + "viewer-settings.json");
  if (manifest.schema_version !== 1)
    throw new Error("Unsupported scene manifest version.");
  field = await loadJson(base + manifest.heightfield_url);
  applyProfile(profile, manifest, field);
  sound = createSound(
    profile.audio,
    import.meta.env.BASE_URL,
    $("#sound-toggle"),
  );
  createFeedback(profile.feedback, {
    iteration: profile.iteration || "development",
    getView: () => view,
    getPosition: () =>
      `E ${player.x.toFixed(1)} / N ${(-player.z).toFixed(1)} / H ${player.y.toFixed(1)} m (local ENU)`,
    pause: () => {
      keys.clear();
      drag = null;
      touchControls.reset();
      walkMotion.reset();
      motion = { ...motion, bobX: 0, bobY: 0, roll: 0, walking: false };
    },
    resume: () => viewport.focus({ preventScroll: true }),
  });
  if (profile.wildlife?.asset_url)
    squirrelFactory = await loadWildlifeFactory(
      sceneAssetUrl(import.meta.env.BASE_URL, profile.wildlife.asset_url),
      profile.wildlife.yaw_correction,
    );
  analytics = createAnalytics(profile.analytics);
  if (analytics.enabled) {
    const notice = document.createElement("p");
    notice.textContent =
      "Aggregate page visits and basic interaction events are counted with GoatCounter. Search text and character coordinates are not sent. Do Not Track and Global Privacy Control are respected.";
    $("#about-panel").append(notice);
  }
  half = manifest.aoi_size_m / 2;
  buildings = manifest.buildings;
  for (const record of buildings) buildingRecords.set(record.id, record);
  if (field.heights_m.length !== field.nx * field.ny)
    throw new Error("The terrain heightfield is incomplete.");
  if (viewerSettings.presentation_url)
    presentation = await loadPresentation(
      base,
      viewerSettings.presentation_url,
      new Set(buildings.map((b) => b.id)),
    );
  const gltf = await new GLTFLoader().loadAsync(base + manifest.model.url);
  model = gltf.scene;
  model.updateMatrixWorld(true);
  const contextGeometries = [],
    remove = [];
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.material = object.material.clone();
    object.receiveShadow = true;
    if (object.userData.asset_kind === "terrain") {
      terrainMesh = object;
      object.material.color.setHex(0x92989c);
    }
    if (object.userData.asset_kind === "building") {
      const id = object.userData.asset_id || object.name;
      if (presentation?.config.replaces_building_ids.includes(id)) {
        remove.push(object);
        return;
      }
      meshesById.set(id, object);
      collisionMeshes.push(object);
      object.castShadow = true;
      const record = buildings.find((building) => building.id === id);
      if (!record?.name) {
        let geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
        if (geometry.index) geometry = geometry.toNonIndexed();
        for (const attribute of Object.keys(geometry.attributes))
          if (!["position", "normal"].includes(attribute))
            geometry.deleteAttribute(attribute);
        contextGeometries.push(geometry);
        remove.push(object);
      }
    }
    if (object.userData.asset_kind === "corridor") {
      object.material.color.set(0x5e6765);
      object.material.roughness = 0.98;
      applySurfaceGrain(object.material, 0.08);
      object.material.polygonOffset = true;
      object.material.polygonOffsetFactor = -1;
      object.material.polygonOffsetUnits = -1;
      object.receiveShadow = true;
    }
  });
  // Keep editable assets in Blender; batch unnamed runtime context to reduce draw calls.
  for (const object of remove) object.removeFromParent();
  if (contextGeometries.length) {
    const geometry = mergeGeometries(contextGeometries, false);
    if (!geometry) throw new Error("Context geometry could not be batched.");
    const material = new THREE.MeshStandardMaterial({
      color: 0xe9e8e0,
      roughness: 0.94,
    });
    const batch = new THREE.Mesh(geometry, material);
    batch.name = "Batched unnamed context";
    batch.castShadow = true;
    batch.receiveShadow = true;
    model.add(batch);
    for (const part of contextGeometries) part.dispose();
  }
  if (!terrainMesh) throw new Error("The GLB does not contain terrain.");
  if (presentation) {
    model.add(presentation.root);
    // Keep the source mesh for geographic checks, but draw only one full ground base.
    if (presentation.hasFoundation) terrainMesh.visible = false;
    for (const [id, group] of presentation.groups) meshesById.set(id, group);
    collisionMeshes.push(...presentation.collisionMeshes);
    const light = presentation.config.lighting;
    if (light) {
      scene.background.set(light.background);
      scene.fog.color.set(light.background);
      const hemisphere = scene.children.find(
        (child) => child.isHemisphereLight,
      );
      hemisphere.color.set(light.sky);
      hemisphere.groundColor.set(light.ground);
      hemisphere.intensity = light.ambient_intensity;
      sun.color.set(light.sun);
      sun.intensity = light.sun_intensity;
      sun.target.position.fromArray(light.target);
      scene.add(sun.target);
      sun.position
        .copy(sun.target.position)
        .add(new THREE.Vector3(-220, 420, -180));
      Object.assign(sun.shadow.camera, {
        left: -470,
        right: 470,
        top: 470,
        bottom: -470,
        near: 1,
        far: 1500,
      });
      sun.shadow.camera.updateProjectionMatrix();
      sun.shadow.normalBias = 0.25;
      sun.shadow.bias = -0.0004;
    }
    $("#toon-row").hidden = false;
    $("#toon-setting").addEventListener("change", (event) => {
      setEmissive(selected, 0);
      buildingHighlight.hover(null);
      presentation.setToon(event.target.checked);
      buildingHighlight.refresh();
      renderer.shadowMap.needsUpdate = true;
    });
  }
  scene.background.set(0x9ac7e6);
  scene.fog.color.set(0xc7dfec);
  applySurfaceGrain(terrainMesh.material, 0.08);
  scene.add(model);
  if (presentation?.contextFog) {
    // Opt in only after profiling the target device: cached fields add memory.
    if (viewerSettings.cache_static_haze === true)
      presentation.bakeStaticHaze();
    model.traverse((object) => {
      if (object.isMesh)
        for (const material of [object.material].flat())
          presentation.contextFog.apply(material);
      if (
        viewerSettings.cache_static_haze === true &&
        object.isMesh &&
        object.visible
      )
        presentation.contextFog.bakeMesh(object);
    });
    $("#context-fog-row").hidden = false;
    $("#context-fog-setting").addEventListener("change", (e) =>
      presentation.contextFog.setEnabled(e.target.checked),
    );
  }
  if (profile.character?.asset_url) {
    studentFactory = await loadStudentFactory(
      sceneAssetUrl(import.meta.env.BASE_URL, profile.character.asset_url),
      profile.character,
    );
    scene.remove(character.root);
    character = studentFactory();
    scene.add(character.root);
  }
  if (viewerSettings.navigation_url) {
    const graph = await loadJson(
      sceneAssetUrl(base, viewerSettings.navigation_url),
    );
    const clearSegment = (a, b) => {
      const steps = Math.max(1, Math.ceil(distance(a, b) / 2));
      for (let i = 0; i <= steps; i++) {
        const x = a[0] + ((b[0] - a[0]) * i) / steps,
          n = a[1] + ((b[1] - a[1]) * i) / steps;
        if (isBlocked(x, -n, buildings, half, 0.5)) return false;
      }
      return true;
    };
    const surfaces = [];
    let drapedOffset = 0;
    model.traverse((o) => {
      if (o.isMesh && o.userData.asset_kind === "landscape-surface") {
        const offset = o.userData.heightfield_offset_m;
        if (Number.isFinite(offset) && offset >= 0 && offset <= 0.3)
          drapedOffset = Math.max(drapedOffset, offset);
        else surfaces.push(o);
      }
    });
    model.updateMatrixWorld(true);
    const surfaceRay = new THREE.Raycaster(),
      heightCache = new Map();
    const ground = (x, z) => {
      const key = Math.round(x * 2) + "," + Math.round(z * 2);
      if (heightCache.has(key)) return heightCache.get(key);
      const y = sampleGround(field, x, z) + drapedOffset;
      surfaceRay.set(
        new THREE.Vector3(x, y + 20, z),
        new THREE.Vector3(0, -1, 0),
      );
      const hit = surfaceRay.intersectObjects(surfaces, false)[0];
      const height = Math.max(y, hit?.point.y ?? y);
      heightCache.set(key, height);
      return height;
    };
    const router = createRouter(graph, clearSegment);
    outdoorRouter = router;
    navigation = createNavigation({
      scene,
      router,
      ground,
      getView: () => view,
      getPlayer: () => player,
      focusSearch: () => {
        $("#building-search-input").focus();
        $("#building-search-input").select();
      },
      canPin: (p) => clearSegment(p, p),
      fitRoute: (points) => {
        if (view !== "aerial") return;
        cancelCameraTransition();
        const bounds = new THREE.Box3().setFromPoints(
            points.map(
              (p) => new THREE.Vector3(p[0], ground(p[0], -p[1]), -p[1]),
            ),
          ),
          target = bounds.getCenter(new THREE.Vector3()),
          size = bounds.getSize(new THREE.Vector3());
        const span = Math.max(65, size.x, size.z) / Math.min(1, camera.aspect);
        orbit.target.copy(target);
        camera.position
          .copy(target)
          .add(new THREE.Vector3(span * 0.6, span * 1.2, span));
        orbit.update();
      },
    });
    $("#directions-open").hidden = false;
    if (viewerSettings.activity_url) {
      const activity = await loadJson(
        sceneAssetUrl(base, viewerSettings.activity_url),
      );
      life = createCampusLife({
        scene,
        router,
        activity,
        studentFactory: studentFactory || createCharacter,
        squirrelFactory,
        getPlayer: () => player,
        ground,
        clearSegment,
      });
      $("#immersion-settings").hidden = false;
      $("#activity-density").addEventListener("input", (e) => {
        life.setDensity(e.target.value);
        const name = DENSITY_NAMES[life.state().densityLevel];
        $("#activity-density-value").textContent = name;
        e.target.setAttribute("aria-valuetext", name);
      });
    }
  }
  zombies = createZombieSchool({
    scene,
    field,
    buildings,
    half,
    onCaught: () => death.show(),
    getPlayer: () => player,
    router: outdoorRouter,
    clearSegment: (a, b) => {
      const count = Math.max(
        1,
        Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 2),
      );
      for (let i = 0; i <= count; i++)
        if (
          isBlocked(
            a[0] + ((b[0] - a[0]) * i) / count,
            -a[1] - ((b[1] - a[1]) * i) / count,
            buildings,
            half,
            0.6,
          )
        )
          return false;
      return true;
    },
  });
  betaRegistry = createBetaRegistry($("#beta-functions"));
  let savedDensity = 2;
  function syncDensityUI() {
    if (!life) return;
    const state = life.state();
    $("#activity-density").value = String(state.densityLevel);
    $("#activity-density").setAttribute("aria-valuetext", state.density);
    $("#activity-density-value").textContent = state.density;
  }
  betaRegistry.register({
    id: "zombie-school",
    title: "ZOMBIE SCHOOL!!!",
    description:
      "Clean map + slow wandering chibi monsters. They chase within 30 m and lose interest beyond 60 m. Contact ends the round.",
    start() {
      savedDensity = life?.state().densityLevel ?? 2;
      life?.setDensity(0);
      syncDensityUI();
      $("#activity-density").disabled = true;
      zombies.start();
      $("#beta-badge").hidden = false;
    },
    stop() {
      zombies.stop();
      life?.setDensity(savedDensity);
      syncDensityUI();
      $("#activity-density").disabled = false;
      $("#beta-badge").hidden = true;
    },
  });
  entrances = createEntrances({
    scene,
    buildings,
    half,
    field,
    meshesById,
    overrides: viewerSettings.entrances,
    onEnter: enterBuilding,
  });
  labels.populate(buildings);
  buildingSearch.populate(buildings);
  resetPlayer();
  setView("aerial");
  if (new URL(location.href).searchParams.get("return") === "1") {
    const saved = readReturn();
    if (saved && buildings.some((b) => b.id === saved.buildingId)) {
      const [x, , z] = saved.player;
      if (!isBlocked(x, z, buildings, half)) {
        player.set(x, sampleGround(field, x, z), z);
        character.root.position.copy(player);
      }
      yaw = saved.yaw;
      character.root.rotation.y = Number.isFinite(saved.heroYaw)
        ? saved.heroYaw
        : yaw + Math.PI;
      followDistance = THREE.MathUtils.clamp(saved.followDistance, 2.5, 30);
      setView(saved.view);
      pitch = THREE.MathUtils.clamp(saved.pitch, -0.7, 0.9);
      if (saved.view !== "aerial") updateCamera(0, true);
      else if (
        [saved.cameraPosition, saved.orbitTarget].every(
          (a) => Array.isArray(a) && a.length === 3 && a.every(Number.isFinite),
        )
      ) {
        camera.position.fromArray(saved.cameraPosition);
        orbit.target.fromArray(saved.orbitTarget);
        orbit.update();
      }
      life?.setDensity(saved.density ?? 2);
      syncDensityUI();
      $("#motion-setting").value = String(
        THREE.MathUtils.clamp(saved.motionLevel ?? 1, 0, 3),
      );
      $("#motion-setting").dispatchEvent(new Event("input"));
      for (const [id, checked] of Object.entries(saved.settings || {}))
        if (
          [
            "show-labels",
            "shadows-setting",
            "toon-setting",
            "context-fog-setting",
            "wireframe-setting",
          ].includes(id)
        ) {
          $("#" + id).checked = !!checked;
          $("#" + id).dispatchEvent(new Event("change"));
        }
      if (saved.soundEnabled === false && sound.state().enabled)
        $("#sound-toggle").click();
    }
    try {
      sessionStorage.removeItem(RETURN_KEY);
    } catch {}
    const url = new URL(location.href);
    url.searchParams.delete("return");
    history.replaceState(null, "", url.href);
  }
  drawMap = createMinimap(
    $("#minimap"),
    buildings,
    half,
    manifest.corridors?.features || [],
  );
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(half * 2, 6, half * 2),
    new THREE.MeshStandardMaterial({ color: 0x9da3a5, roughness: 1 }),
  );
  skirt.position.y = manifest.quality.terrain_range_local_m[0] - 3.2;
  skirt.receiveShadow = true;
  scene.add(skirt);
  renderer.shadowMap.needsUpdate = true;
  $("#loading").hidden = true;
  const depth = createOverviewDepth(camera, model);
  const frozenStaticNodes = freezeStaticTransforms(model);
  let betaLastUpdate = 0;
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - lastTime) / 1000 || 0, 0.08);
    lastTime = now;
    elapsed += dt;
    if (!modalOpen()) updatePlayer(dt);
    if (!death.dead) updateCamera(dt);
    entrances.update(player, view, modalOpen());
    depth.update(view);
    sky.update(
      camera,
      death.dead ? elapsed - dt : elapsed,
      reducedMotion.matches || death.dead,
    );
    navigation?.update(elapsed);
    if (!modalOpen()) {
      life?.update(dt);
      zombies?.update(dt);
    }
    if (zombies?.active && now - betaLastUpdate > 250) {
      betaLastUpdate = now;
      $("#beta-badge").textContent =
        `ZOMBIE SCHOOL!!! · ${zombies.state().chasing} chasing`;
    }
    renderer.render(scene, camera);
    labels.update(now, view);
    buildingCard.update();
    if (
      hoverPending &&
      hoverPointer &&
      !drag &&
      !modalOpen() &&
      now - lastHover > 80
    ) {
      lastHover = now;
      hoverPending = false;
      const box = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((hoverPointer.clientX - box.left) / box.width) * 2 - 1,
          (-(hoverPointer.clientY - box.top) / box.height) * 2 + 1,
        ),
        camera,
      );
      const hit = raycaster.intersectObjects(collisionMeshes, false)[0];
      const id = resolveBuildingHit(hit, buildingRecords);
      buildingHighlight.hover(id);
      renderer.domElement.style.cursor = id ? "pointer" : "";
    }
    developer.update(now);
    frames++;
    if (now - lastFps > 1000) {
      fps = Math.round((frames * 1000) / (now - lastFps));
      frames = 0;
      lastFps = now;
    }
    drawMap(player, yaw, selectedMapTarget, navigation?.points);
    const heading = new THREE.Vector3();
    camera.getWorldDirection(heading);
    $(".compass i").style.transform =
      "rotate(" + Math.atan2(heading.x, -heading.z) + "rad)";
    const positionText =
      "E " +
      player.x.toFixed(1) +
      " / N " +
      (-player.z).toFixed(1) +
      " / H " +
      player.y.toFixed(1) +
      " m";
    if ($("#position").textContent !== positionText)
      $("#position").textContent = positionText;
  });
  window.__campus = {
    getState: () => ({
      ready: true,
      entranceCount: entrances.entries.length,
      nearbyEntrance: entrances.nearby,
      hoveredBuilding: buildingHighlight.hovered,
      touchSpeed:
        Math.hypot(touchControls.axes.forward, touchControls.axes.right) * 4.6,
      riggedHero: !!character.rigged,
      developerMode: developer.enabled,
      dead: death.dead,
      sky: sky.state(),
      motionLevel: Number($("#motion-setting").value),
      inspectedNpc: developer.selected,
      life: life?.state() || null,
      beta: betaRegistry?.state(),
      zombies: zombies?.state(),
      audio: sound.state(),
      walkMotion: { ...motion },
      heroGait: character.gaitState?.() || null,
      navigation: navigation?.state() || null,
      view,
      followDistance,
      player: player.toArray(),
      camera: camera.position.toArray(),
      cameraNear: camera.near,
      frozenStaticNodes,
      cameraDirection: camera.getWorldDirection(new THREE.Vector3()).toArray(),
      characterDirection: character.root
        .getWorldDirection(new THREE.Vector3())
        .toArray(),
      selectedBuilding: selectedId,
      orbitTarget: orbit.target.toArray(),
      cameraTransition: !!cameraTransition,
      fps,
      buildings: buildings.length,
      namedBuildings: labels.count,
      roadSegments: manifest.corridors?.features.length || 0,
      roadSurfaces: model.children.filter(
        (object) => object.userData.asset_kind === "corridor",
      ).length,
      visibleLabels: labels.visibleCount,
      aoiSize: manifest.aoi_size_m,
      grounded: vertical.grounded,
      verticalVelocity: vertical.velocity,
      blocked: isBlocked(player.x, player.z, buildings, half),
      ground: sampleGround(field, player.x, player.z),
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      presentation: presentation
        ? {
            id: presentation.config.id,
            buildings: presentation.groups.size,
            toon: $("#toon-setting").checked,
            backgroundHaze: presentation.contextFog?.enabled || false,
            hazeCache: presentation.contextFog?.state(),
            landcover: Boolean(presentation.config.landcover_url),
            batchedBuildings: presentation.batchedIds.size,
            ...presentation.config.stats,
          }
        : null,
    }),
    entranceInfo: () => entrances.entries.map((e) => ({ ...e })),
    lifeColliders: () => life?.colliders() || [],
    npcInfo: (id) => life?.inspect(id) || zombies?.inspect(id),
    npcScreenPosition: (id) => {
      const root = [
        ...(life?.pickables() || []),
        ...(zombies?.pickables() || []),
      ].find((root) => root.userData.npcId === id);
      if (!root) return null;
      const point = new THREE.Box3()
        .setFromObject(root)
        .getCenter(new THREE.Vector3())
        .project(camera);
      return {
        x: ((point.x + 1) * viewport.clientWidth) / 2,
        y: ((1 - point.y) * viewport.clientHeight) / 2,
        visible:
          point.z > -1 &&
          point.z < 1 &&
          Math.abs(point.x) < 1 &&
          Math.abs(point.y) < 1,
      };
    },
    setView,
    reset: resetPlayer,
    labelInfo: (id) => labels.projectedLabel(id),
    namedBuildings: () =>
      buildings
        .filter((building) => building.name)
        .map(({ id, name, name_match }) => ({ id, name, name_match })),
    terrainCheck: (x, z) => {
      const ray = new THREE.Raycaster(
        new THREE.Vector3(x, 300, z),
        new THREE.Vector3(0, -1, 0),
      );
      const hit = ray.intersectObject(terrainMesh, true)[0];
      return { mesh: hit?.point.y, sampled: sampleGround(field, x, z) };
    },
  };
} catch (error) {
  console.error(error);
  $("#loading").hidden = true;
  $("#error").hidden = false;
  $("#error p").textContent =
    error.message + " Rebuild the scene assets before trying again.";
}
