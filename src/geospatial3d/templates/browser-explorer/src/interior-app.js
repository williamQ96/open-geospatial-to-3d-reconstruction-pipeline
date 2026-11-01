// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { installWorldLifecycle } from "./world-lifecycle.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createClassroom } from "./classroom.js";
import { createCharacter } from "./character.js";
import { loadStudentFactory } from "./student.js";
import { sceneAssetUrl } from "./presentation.js";
import { createTouchControls, movementInput } from "./touch.js";
import { readReturn, leaveInterior } from "./scene-transition.js";
import { createWalkMotion } from "./ambience.js";
import { createSound } from "./sound.js";
import { startJump, stepVertical } from "./world.js";

const inspection =
  new URL(location.href).searchParams.get("interior_mode") === "overview";
const snapshot = readReturn(),
  buildingId = new URL(location.href).searchParams.get("interior");
const name =
  snapshot?.buildingId === buildingId
    ? snapshot.buildingName
    : "Campus building";
// Replace outdoor chrome before any renderer/resources are constructed.
document.body.innerHTML = `<main id="app" data-view="first" data-space="interior"><div id="viewport" tabindex="0" aria-label="Classroom explorer"></div><header class="interior-header"><div><strong id="room-name"></strong><small>Shared classroom · Inferred interior</small></div><button id="sound-toggle" hidden class="icon-button" aria-label="Mute sound" aria-pressed="true">♪</button><button id="room-return">← Return to campus</button></header><nav class="view-switch" aria-label="Camera view"><button data-view="third">1 Follow</button><button data-view="first">2 First person</button><button data-view="aerial">3 Overview</button></nav><p class="interior-hint">WASD move · Shift run · Space jump · Drag to look</p><p class="touch-hint">Lower half: drag to walk / run · Upper half: look</p><button class="entrance-action" id="room-exit" hidden>Exit classroom · E</button><p id="room-loading" class="interior-loading" role="status">Preparing classroom…</p></main>`;
document.querySelector("#room-name").textContent = name;
document.title = `${name} · Classroom`;
const viewport = document.querySelector("#viewport"),
  app = document.querySelector("#app"),
  keys = new Set();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbdd8e5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x938878, 2.4));
const sun = new THREE.DirectionalLight(0xfff0d5, 2);
sun.position.set(8, 15, 4);
scene.add(sun);
const room = createClassroom();
scene.add(room.root);
const camera = new THREE.PerspectiveCamera(55, 1, 0.08, 120);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
viewport.append(renderer.domElement);
installWorldLifecycle(renderer, scene);
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.minDistance = 4;
orbit.maxDistance = 45;
orbit.maxPolarAngle = Math.PI * 0.47;
const player = new THREE.Vector3(0, 0, 7),
  vertical = { velocity: 0, grounded: true };
let character = inspection ? null : createCharacter();
if (character) scene.add(character.root);
if (inspection) {
  app.dataset.inspection = "true";
  document.querySelector(".interior-header small").textContent =
    "Overview visit · Hero stays on campus";
  document.querySelector(".interior-hint").textContent =
    "Drag to orbit · Scroll to zoom";
  document.querySelectorAll("button[data-view]").forEach((button) => {
    if (button.dataset.view !== "aerial") button.hidden = true;
  });
}
let view = "first",
  yaw = 0,
  pitch = 0,
  drag = null,
  last = 0,
  time = 0,
  nearExit = false,
  followDistance = 4.5;
let sound = { step() {}, state: () => ({ enabled: false }) };
const walk = createWalkMotion(),
  reduced = matchMedia("(prefers-reduced-motion: reduce)");
const touch = createTouchControls(renderer.domElement, {
  enabled: () => view !== "aerial",
  onLook: (dx, dy) => {
    yaw -= dx * 0.004;
    pitch = THREE.MathUtils.clamp(pitch + dy * 0.003, -0.7, 0.9);
  },
  onMove() {},
  onTap: pickExit,
});
function pause() {
  keys.clear();
  touch.reset();
  drag = null;
  walk.reset();
}
function setView(next) {
  if (
    !["first", "third", "aerial"].includes(next) ||
    (inspection && next !== "aerial")
  )
    return;
  pause();
  view = next;
  viewport.focus({ preventScroll: true });
  app.dataset.view = view;
  orbit.enabled = view === "aerial";
  room.ceiling.visible = view !== "aerial";
  if (character) character.root.visible = view !== "first";
  document
    .querySelectorAll("[data-view]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.view === view)),
    );
  if (orbit.enabled) {
    orbit.target.set(0, 0, 0);
    camera.position.set(18, 24, 20);
    orbit.update();
  }
}
document
  .querySelectorAll("button[data-view]")
  .forEach((b) => (b.onclick = () => setView(b.dataset.view)));
document.querySelector("#room-return").onclick = leaveInterior;
document
  .querySelector("#sound-toggle")
  .addEventListener("click", () => viewport.focus({ preventScroll: true }));
document.querySelector("#room-exit").onclick = leaveInterior;
function resize() {
  pause();
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  camera.aspect = viewport.clientWidth / viewport.clientHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
resize();
addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (["INPUT", "TEXTAREA", "BUTTON"].includes(document.activeElement?.tagName))
    return;
  if (
    [
      "Space",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyE",
    ].includes(e.code)
  )
    e.preventDefault();
  keys.add(e.code);
  if (!e.repeat) {
    if (e.code === "Space" && !inspection) startJump(vertical);
    if (e.code === "KeyE" && nearExit) leaveInterior();
    if (/^Digit[123]$/.test(e.code))
      setView(["third", "first", "aerial"][Number(e.code.slice(-1)) - 1]);
  }
});
addEventListener("keyup", (e) => keys.delete(e.code));
renderer.domElement.addEventListener("pointerdown", (e) => {
  viewport.focus();
  drag = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY };
  if (view !== "aerial") renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener("pointermove", (e) => {
  if (!drag || view === "aerial") return;
  yaw -= (e.clientX - drag.x) * 0.004;
  pitch = THREE.MathUtils.clamp(
    pitch + (e.clientY - drag.y) * 0.003,
    -0.7,
    0.9,
  );
  drag.x = e.clientX;
  drag.y = e.clientY;
});
renderer.domElement.addEventListener("pointerup", (e) => {
  if (drag && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 5)
    pickExit(e);
  drag = null;
});
renderer.domElement.addEventListener("pointercancel", pause);
viewport.addEventListener(
  "wheel",
  (e) => {
    if (view === "third") {
      e.preventDefault();
      followDistance = THREE.MathUtils.clamp(
        followDistance * Math.exp(e.deltaY * 0.001),
        2.5,
        8,
      );
    }
  },
  { passive: false },
);
function pickExit(e) {
  const r = renderer.domElement.getBoundingClientRect(),
    ray = new THREE.Raycaster();
  ray.setFromCamera(
    new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    ),
    camera,
  );
  const hit = ray.intersectObject(room.root, true)[0];
  if (hit?.object === room.exit) leaveInterior();
}
try {
  const response = await fetch(
    import.meta.env.BASE_URL + "viewer-profile.json",
  );
  if (!response.ok) throw new Error("Profile unavailable");
  const profile = await response.json();
  if (!inspection && profile.character?.asset_url) {
    const factory = await loadStudentFactory(
      sceneAssetUrl(import.meta.env.BASE_URL, profile.character.asset_url),
      profile.character,
    );
    scene.remove(character.root);
    character = factory();
    scene.add(character.root);
  }
  sound = createSound(
    profile.audio,
    import.meta.env.BASE_URL,
    document.querySelector("#sound-toggle"),
  );
  if (snapshot?.soundEnabled === false && sound.state().enabled)
    document.querySelector("#sound-toggle").click();
} catch (error) {
  console.warn("Classroom uses the fallback character", error);
}
if (character) character.root.rotation.y = yaw + Math.PI;
document.querySelector("#room-loading").hidden = true;
setView(inspection ? "aerial" : snapshot?.view === "third" ? "third" : "first");
viewport.focus();
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000 || 0, 0.08);
  last = now;
  time += dt;
  const before = player.clone();
  const input = movementInput(
    (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0),
    (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
    keys.has("ShiftLeft") || keys.has("ShiftRight"),
    view !== "aerial" ? touch.axes : undefined,
  );
  if (view !== "aerial") {
    const dx =
        (-Math.sin(yaw) * input.forward + Math.cos(yaw) * input.right) * dt,
      dz = (-Math.cos(yaw) * input.forward - Math.sin(yaw) * input.right) * dt,
      steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.15));
    for (let i = 0; i < steps; i++) {
      if (!room.blocked(player.x + dx / steps, player.z))
        player.x += dx / steps;
      if (!room.blocked(player.x, player.z + dz / steps))
        player.z += dz / steps;
    }
  }
  stepVertical(player, vertical, dt, 0);
  const travelled = Math.hypot(player.x - before.x, player.z - before.z),
    motion = walk.update(dt, travelled, {
      grounded: vertical.grounded,
      enabled: view !== "aerial",
      running: travelled / Math.max(dt, 0.001) > 2.15,
      reducedMotion: reduced.matches,
      motionLevel: snapshot?.motionLevel ?? 1,
    });
  if (motion.step) sound.step();
  if (character) character.root.position.copy(player);
  if (character && travelled > 0.0001)
    character.root.rotation.y = Math.atan2(
      player.x - before.x,
      player.z - before.z,
    );
  character?.animate(time, travelled > 0.0001 && vertical.grounded, motion);
  const eye = player
    .clone()
    .add(
      new THREE.Vector3(
        view === "first" ? motion.bobX : 0,
        1.58 + (view === "first" ? motion.bobY : 0),
        0,
      ),
    );
  if (view === "aerial") orbit.update();
  else if (view === "first") {
    camera.position.copy(eye);
    camera.rotation.set(-pitch, yaw, 0, "YXZ");
  } else {
    const desired = eye
      .clone()
      .add(
        new THREE.Vector3(
          Math.sin(yaw) * followDistance,
          1 + pitch * 3,
          Math.cos(yaw) * followDistance,
        ),
      );
    desired.x = THREE.MathUtils.clamp(desired.x, -11.7, 11.7);
    desired.z = THREE.MathUtils.clamp(desired.z, -8.7, 8.7);
    desired.y = THREE.MathUtils.clamp(desired.y, 0.6, 3.9);
    camera.position.lerp(desired, 1 - Math.exp(-dt * 12));
    camera.lookAt(eye);
  }
  nearExit =
    !inspection && Math.hypot(player.x, player.z - 8.8) < 3 && player.y < 1;
  document.querySelector("#room-exit").hidden = !nearExit;
  renderer.render(scene, camera);
});
window.__interior = {
  getState: () => ({
    ready: true,
    buildingId,
    template: "classroom-v1",
    view,
    player: inspection ? null : player.toArray(),
    inspectionMode: inspection,
    heroPresent: !!character,
    outsidePlayer: inspection ? snapshot?.player || null : null,
    nearExit,
    campusLoaded: false,
    roomMeshes: room.root.children.length,
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
  }),
  setView,
};
