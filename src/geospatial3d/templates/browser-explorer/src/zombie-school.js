// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { randomSource, seedNumber } from "./npc-templates.js";
import { overlaps, playerBody } from "./collision.js";
import { movePlayer } from "./world.js";

export const ZOMBIE_RULES = Object.freeze({
  wanderRadius: 12,
  wanderSpeed: 0.45,
  attractRadius: 30,
  releaseRadius: 60,
  activeSpeed: 2.2,
  targetCount: 28,
  spawnRadius: 160,
});
export function zombieTransition(z, hero, rules = ZOMBIE_RULES) {
  const distance = Math.hypot(z.x - hero.x, z.z - hero.z);
  if (z.mode === "wander" && distance <= rules.attractRadius) {
    z.mode = "chase";
    z.target = null;
    return "attracted";
  }
  if (z.mode === "chase" && distance > rules.releaseRadius) {
    z.mode = "wander";
    z.center = { x: z.x, z: z.z };
    z.target = null;
    return "released";
  }
  return null;
}
export function zombieGeometry() {
  const parts = [];
  function add(g, x, y, z, color, rotation = 0) {
    g.rotateZ(rotation);
    g.translate(x, y, z);
    if (g.index) g = g.toNonIndexed();
    g.deleteAttribute("uv");
    const c = new THREE.Color(color),
      rgb = [];
    for (let i = 0; i < g.attributes.position.count; i++)
      rgb.push(c.r, c.g, c.b);
    g.setAttribute("color", new THREE.Float32BufferAttribute(rgb, 3));
    parts.push(g);
  }
  const box = (w, h, d, x, y, z, c, rotation = 0) =>
    add(new THREE.BoxGeometry(w, h, d), x, y, z, c, rotation);
  box(0.46, 0.5, 0.3, 0, 0.73, 0, "#666e54");
  box(0.55, 0.49, 0.43, 0, 1.24, 0, "#8baa73");
  box(0.57, 0.12, 0.45, 0, 1.52, -0.01, "#30372f");
  for (const x of [-0.12, 0.12]) {
    box(0.15, 0.39, 0.16, x, 0.25, 0, "#3e4944");
    box(0.18, 0.12, 0.28, x, 0.06, 0.07, "#303a36");
    box(0.1, 0.075, 0.025, x, 1.28, 0.225, "#eee4b7");
    box(0.035, 0.06, 0.03, x, 1.28, 0.242, "#2c3733");
  }
  for (const x of [-0.31, 0.31]) {
    box(0.14, 0.43, 0.16, x, 0.84, 0.1, "#7e9867", x > 0 ? -0.22 : 0.22);
    box(0.13, 0.13, 0.16, x, 0.61, 0.15, "#8baa73");
    box(0.13, 0.07, 0.1, x, 1.17, 0, "#8d9991");
  }
  box(0.15, 0.025, 0.025, 0, 1.11, 0.225, "#3d4d39");
  box(0.19, 0.02, 0.025, -0.05, 1.4, 0.225, "#506343", 0.15);
  for (const x of [-0.1, -0.04, 0.02])
    box(0.018, 0.055, 0.028, x, 1.4, 0.24, "#d2c6a1");
  const geometry = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return geometry;
}
export function createZombieSchool({
  scene,
  field,
  buildings,
  half,
  getPlayer,
  router,
  clearSegment,
  onCaught = () => {},
  seed = 1138,
}) {
  const group = new THREE.Group();
  group.name = "ZOMBIE SCHOOL beta";
  scene.add(group);
  let actors = [],
    active = false,
    clock = 0,
    caught = false,
    geometry,
    material;
  const rules = ZOMBIE_RULES;
  function ground(x, z) {
    const p = { x, y: 0, z };
    movePlayer(p, { x: 0, z: 0 }, [], half, field, true);
    return p.y + 0.02;
  }
  function start() {
    stop();
    active = true;
    geometry = zombieGeometry();
    material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
    });
    const rng = randomSource(seed),
      hero = getPlayer();
    for (let i = 0; i < 5000 && actors.length < rules.targetCount; i++) {
      const angle = rng() * Math.PI * 2,
        radius = 12 + Math.sqrt(rng()) * (rules.spawnRadius - 12),
        x = hero.x + Math.cos(angle) * radius,
        z = hero.z + Math.sin(angle) * radius;
      if (
        Math.abs(x) > half - 3 ||
        Math.abs(z) > half - 3 ||
        !clearSegment([x, -z], [x, -z])
      )
        continue;
      const probe = { x, y: ground(x, z), z };
      let blocked = false;
      movePlayer(probe, { x: 0.9, z: 0.9 }, buildings, half, field, false);
      if (Math.hypot(probe.x - x - 0.9, probe.z - z - 0.9) > 0.01)
        blocked = true;
      if (blocked || actors.some((a) => Math.hypot(a.x - x, a.z - z) < 14))
        continue;
      const index = actors.length,
        root = new THREE.Mesh(geometry, material);
      root.receiveShadow = true;
      root.name = "Chibi campus monster";
      root.userData.npcId = "zombie-" + index;
      group.add(root);
      const actor = {
        id: "zombie-" + index,
        seed: seedNumber(`${seed}:zombie-${index}`),
        x,
        z,
        y: ground(x, z),
        center: { x, z },
        mode: "wander",
        radius: 0.35,
        height: 1.6,
        nextSight: 0,
        direct: false,
        target: null,
        path: [],
        nextPlan: 0,
        rng: randomSource(seedNumber(`${seed}:${index}`)),
        root,
      };
      root.position.set(x, actor.y, z);
      actors.push(actor);
    }
  }
  function stop() {
    for (const a of actors) a.root.removeFromParent();
    actors = [];
    geometry?.dispose();
    material?.dispose();
    geometry = material = null;
    active = false;
    caught = false;
  }
  function update(dt) {
    if (!active || caught) return;
    clock += dt;
    let planningBudget = 1;
    const hero = getPlayer();
    for (const a of actors) {
      const transition = zombieTransition(a, hero);
      if (transition) {
        a.path = [];
        a.nextPlan = 0;
      }
      if (
        a.mode === "chase" &&
        overlaps({ ...a, radius: 0.43 }, playerBody(hero))
      ) {
        caught = true;
        onCaught(a.id);
        return;
      }
      let target;
      if (a.mode === "wander") {
        if (!a.target || Math.hypot(a.target.x - a.x, a.target.z - a.z) < 0.5) {
          a.target = null;
          for (let i = 0; i < 12; i++) {
            const angle = a.rng() * Math.PI * 2,
              radius = Math.sqrt(a.rng()) * rules.wanderRadius,
              p = {
                x: a.center.x + Math.cos(angle) * radius,
                z: a.center.z + Math.sin(angle) * radius,
              };
            if (clearSegment([a.x, -a.z], [p.x, -p.z])) {
              a.target = p;
              break;
            }
          }
        }
        target = a.target;
      } else {
        target = hero;
        // Reuse the outdoor graph only when direct pursuit is blocked. Throttle replans.
        if (clock >= a.nextSight) {
          a.direct = clearSegment([a.x, -a.z], [hero.x, -hero.z]);
          a.nextSight = clock + 0.45;
        }
        if (!a.direct) {
          if (router && clock >= a.nextPlan && planningBudget) {
            planningBudget--;
            a.nextPlan = clock + 3;
            const route = router.route([a.x, -a.z], [hero.x, -hero.z]);
            a.path =
              route?.points.slice(1).map((p) => ({ x: p[0], z: -p[1] })) || [];
          }
          while (
            a.path.length &&
            Math.hypot(a.path[0].x - a.x, a.path[0].z - a.z) < 0.6
          )
            a.path.shift();
          target = a.path[0] || hero;
        }
      }
      if (!target) continue;
      const dx = target.x - a.x,
        dz = target.z - a.z,
        distance = Math.hypot(dx, dz),
        step = Math.min(
          distance,
          (a.mode === "chase" ? rules.activeSpeed : rules.wanderSpeed) * dt,
        );
      if (distance < 0.03) continue;
      const before = { x: a.x, z: a.z };
      movePlayer(
        a,
        { x: (dx / distance) * step, z: (dz / distance) * step },
        buildings,
        half,
        field,
        false,
        (x, z, y) => {
          if (
            a.mode === "wander" &&
            Math.hypot(x - a.center.x, z - a.center.z) >
              rules.wanderRadius + 0.01
          )
            return true;
          const body = { x, z, y, radius: 0.35, height: 1.6 };
          return (
            overlaps(body, playerBody(hero), 0.02) ||
            actors.some((b) => b !== a && overlaps(body, b, 0.04))
          );
        },
      );
      a.y = ground(a.x, a.z);
      a.root.position.set(a.x, a.y, a.z);
      if (Math.hypot(a.x - before.x, a.z - before.z) > 0.0001)
        a.root.rotation.y = Math.atan2(a.x - before.x, a.z - before.z);
    }
  }
  function inspect(id) {
    const a = actors.find((a) => a.id === id);
    return a
      ? {
          id,
          template: "zombie-school-chibi",
          templateVersion: 1,
          seed: a.seed,
          properties: {
            ...rules,
            appearance: "Uniform original chibi stitched monster",
          },
          position: { east: a.x, north: -a.z, height: a.y },
          state: a.mode,
          path: {
            surface: "ground",
            center: { ...a.center },
            target: a.target,
          },
        }
      : null;
  }
  return {
    get active() {
      return active;
    },
    start,
    stop,
    update,
    inspect,
    pickables: () => actors.map((a) => a.root),
    blockedPlayer: (x, z, y) =>
      actors.some((a) => overlaps(playerBody({ x, z, y }), a)),
    state: () => ({
      active,
      caught,
      count: actors.length,
      chasing: actors.filter((a) => a.mode === "chase").length,
      rules,
      actors: actors.map((a) => ({
        id: a.id,
        x: a.x,
        y: a.y,
        z: a.z,
        mode: a.mode,
        center: { ...a.center },
      })),
    }),
  };
}
