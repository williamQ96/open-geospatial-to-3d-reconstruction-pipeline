// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { createCampusProp } from "./props.js";
import { overlaps, playerBody } from "./collision.js";
import {
  DENSITY_COUNTS,
  DENSITY_NAMES,
  densityIndex,
  createWalkMotion,
} from "./ambience.js";
import { npcProperties, seedNumber, randomSource } from "./npc-templates.js";
import { compileActivityPath, sampleActivityPath } from "./activity-paths.js";
import { pedestrianMask, planPedestrianDetour } from "./pedestrian-detour.js";
const VEHICLES = {
  car: { radius: 1, height: 1.85, halfLength: 1.2 },
  suv: { radius: 1, height: 2.1, halfLength: 1.3 },
  van: { radius: 1, height: 2.3, halfLength: 1.4 },
  pickup: { radius: 1, height: 1.9, halfLength: 1.2 },
};
const ALLOWED = {
  walk: ["pedestrian"],
  bicycle: ["pedestrian"],
  scooter: ["pedestrian"],
  car: ["driving"],
  squirrel: ["vegetation", "tree"],
};
export function createCampusLife({
  scene,
  activity,
  studentFactory,
  squirrelFactory,
  ground = null,
  clearSegment = () => true,
  getPlayer = () => ({ x: 9999, y: 0, z: 9999 }),
}) {
  if (activity.version !== 2)
    throw new Error("Activity needs compiled semantic paths (version 2).");
  const group = new THREE.Group();
  group.name = "On-demand campus activity";
  scene.add(group);
  const paths = activity.paths.map(compileActivityPath),
    entities = new Map();
  let level = 2,
    clock = 0,
    totalCreated = 0,
    totalDisposed = 0,
    instances = 0;
  const seed = activity.seed ?? 613;
  const allowed = pedestrianMask(activity.pedestrian_regions);
  let detoursStarted = 0,
    detoursCompleted = 0,
    detourWorldChecks = 0,
    lastWorldChecks = 0;
  function makeVisual(kind, p) {
    if (kind === "walk") return studentFactory(p);
    if (kind === "squirrel") return squirrelFactory(p);
    const root = createCampusProp(
      kind === "car" || kind === "prop" ? p.vehicle : kind,
      new THREE.Color(p.color).getHex(),
      p.rider,
    );
    root.scale.setScalar(p.scale || 1);
    return {
      root,
      dispose() {
        root.geometry.dispose();
        root.material.dispose();
        root.removeFromParent();
      },
    };
  }
  function shape(kind, p) {
    const s =
      kind === "car" || kind === "prop"
        ? VEHICLES[p.vehicle]
        : kind === "squirrel"
          ? { radius: 0.17, height: 0.58, halfLength: 0.1 }
          : kind === "walk"
            ? {
                radius: 0.32 * (p.heightM / 1.78),
                height: p.heightM,
                halfLength: 0,
              }
            : {
                radius: 0.33,
                height: 2.15,
                halfLength: kind === "bicycle" ? 0.65 : 0.45,
              };
    return Object.fromEntries(
      Object.entries(s).map(([k, v]) => [k, v * (p.scale || 1)]),
    );
  }
  function place(entity, body) {
    Object.assign(entity.body, body);
    entity.root.position.set(body.x, body.y, body.z);
    entity.root.rotation.y = body.yaw;
  }
  function spawn(kind, index) {
    const id = kind + "-" + index,
      entropy = seedNumber(`${seed}:${id}`),
      p = npcProperties(kind, entropy),
      rng = randomSource(entropy ^ 0xa5366b4d);
    let path, slot;
    if (kind === "prop") {
      slot = activity.prop_slots[index];
      if (!slot) return;
    } else {
      const options = paths.filter((path) =>
        ALLOWED[kind].includes(path.surface),
      );
      if (!options.length || (kind === "squirrel" && !squirrelFactory)) return;
      const grass = options.filter((p) => p.surface === "vegetation"),
        trees = options.filter((p) => p.surface === "tree");
      const chosen =
        kind === "squirrel" && grass.length && trees.length
          ? index % 2
            ? trees
            : grass
          : options;
      path =
        chosen[
          Math.floor(kind === "squirrel" ? index / 2 : index) % chosen.length
        ];
    }
    const body = { ...shape(kind, p), id, kind, x: 0, y: 0, z: 0, yaw: 0 },
      player = playerBody(getPlayer());
    let progress = rng() * (path?.length || 0) * 2,
      point;
    for (let attempt = 0; attempt < 60; attempt++) {
      point = slot
        ? { x: slot.east, z: -slot.north, y: slot.height, yaw: slot.yaw || 0 }
        : sampleActivityPath(path, progress);
      Object.assign(body, point);
      if (
        !overlaps(body, player, 0.1) &&
        ![...entities.values()].some((e) => overlaps(body, e.body, 0.1))
      )
        break;
      if (slot) return;
      progress = (progress + path.length * 0.173) % (path.length * 2);
      if (attempt === 59) return;
    }
    const visual = makeVisual(kind, p),
      entity = {
        ...visual,
        id,
        kind,
        properties: p,
        path,
        slot,
        progress,
        body,
        gait: createWalkMotion(),
        moving: false,
        blockedSeconds: 0,
        retryAt: 0,
        detour: null,
        movementMode: "follow",
        phaseOffset: rng() * 7,
      };
    entity.root.userData.npcId = id;
    group.add(entity.root);
    entities.set(id, entity);
    place(entity, body);
    totalCreated++;
    instances++;
  }
  function setDensity(value) {
    level = densityIndex(value);
    const counts = DENSITY_COUNTS[level];
    for (const [id, e] of entities)
      if (
        Number(id.split("-").at(-1)) >=
        (e.kind === "prop" ? counts.props : counts[e.kind])
      ) {
        e.dispose?.();
        e.root.removeFromParent();
        entities.delete(id);
        totalDisposed++;
        instances--;
      }
    for (const kind of [
      "prop",
      "walk",
      "bicycle",
      "scooter",
      "car",
      "squirrel",
    ])
      for (let i = 0; i < (kind === "prop" ? counts.props : counts[kind]); i++)
        if (!entities.has(kind + "-" + i)) spawn(kind, i);
  }
  function update(dt) {
    if (!entities.size) return;
    const list = [...entities.values()];
    let planningBudget = 1;
    lastWorldChecks = 0;
    const count = Math.max(1, Math.ceil(dt / 0.05)),
      step = dt / count;
    for (const e of entities.values()) {
      e.moving = false;
      e.distanceMoved = 0;
    }
    for (let j = 0; j < count; j++) {
      clock += step;
      const player = playerBody(getPlayer());
      for (const e of entities.values()) {
        if (!e.path) continue;
        if (
          e.kind === "squirrel" &&
          (clock + e.phaseOffset) %
            (e.properties.activeSeconds + e.properties.pauseSeconds) >
            e.properties.activeSeconds
        )
          continue;
        let next = e.progress + e.properties.speedMps * step;
        let candidate;
        if (e.detour) {
          const target = e.detour.points[0],
            dx = target.x - e.body.x,
            dz = target.z - e.body.z,
            dist = Math.hypot(dx, dz),
            t = Math.min(
              1,
              (e.properties.speedMps * step) / Math.max(0.001, dist),
            );
          candidate = {
            ...e.body,
            x: e.body.x + dx * t,
            z: e.body.z + dz * t,
            y: e.body.y + (target.y - e.body.y) * t,
            yaw: Math.atan2(dx, dz),
          };
        } else candidate = { ...e.body, ...sampleActivityPath(e.path, next) };
        if (
          overlaps(candidate, player, 0.04) ||
          list.some(
            (other) => other !== e && overlaps(candidate, other.body, 0.06),
          )
        ) {
          e.blockedSeconds += step;
          e.movementMode = e.detour ? "detour-blocked" : "yield";
          if (
            e.kind === "walk" &&
            planningBudget &&
            e.blockedSeconds > 0.5 + (e.properties.seed % 5) * 0.06 &&
            clock >= e.retryAt
          ) {
            planningBudget--;
            e.retryAt = clock + 1.1;
            const detour = planPedestrianDetour({
              body: e.body,
              path: e.path,
              progress: e.progress,
              obstacles: [
                { ...player, clearance: 0.04 },
                ...list
                  .filter((o) => o !== e)
                  .map((o) => ({ ...o.body, clearance: 0.06 })),
              ],
              allowed,
              ground: ground || (() => e.body.y),
              clearSegment: (a, b) => {
                detourWorldChecks++;
                lastWorldChecks++;
                return clearSegment(a, b);
              },
            });
            if (detour) {
              e.detour = detour;
              e.blockedSeconds = 0;
              e.movementMode = "detour";
              detoursStarted++;
            }
          }
          continue;
        }
        e.blockedSeconds = 0;
        e.distanceMoved += Math.hypot(
          candidate.x - e.body.x,
          candidate.z - e.body.z,
          candidate.y - e.body.y,
        );
        if (e.detour) {
          e.movementMode = e.detour.points.length === 1 ? "rejoin" : "detour";
          const target = e.detour.points[0];
          if (
            Math.hypot(candidate.x - target.x, candidate.z - target.z) < 0.035
          ) {
            e.detour.points.shift();
            if (!e.detour.points.length) {
              e.progress = e.detour.progress;
              e.detour = null;
              e.movementMode = "follow";
              detoursCompleted++;
            }
          }
        } else {
          e.progress = next;
          e.movementMode = "follow";
        }
        place(e, candidate);
        e.moving = true;
      }
    }
    for (const e of entities.values()) {
      const gait = e.gait.update(dt, e.distanceMoved, {
        grounded: true,
        enabled: e.moving,
        running: e.properties.gait === "run",
      });
      e.animate?.(clock, e.moving, { ...gait, speed: e.properties.speedMps });
    }
  }
  function inspect(id) {
    const e = entities.get(id);
    return e
      ? {
          id,
          template: e.properties.template,
          seed: e.properties.seed,
          templateVersion: e.properties.templateVersion,
          properties: { ...e.properties },
          path: e.path
            ? {
                id: e.path.id,
                surface: e.path.surface,
                progressM: +e.progress.toFixed(2),
              }
            : null,
          slot: e.slot?.id || null,
          position: { east: e.body.x, north: -e.body.z, height: e.body.y },
          movementMode: e.movementMode,
          state: e.moving ? e.properties.gait || "moving" : "paused",
        }
      : null;
  }
  setDensity(2);
  return {
    update,
    setDensity,
    pickables: () => [...entities.values()].map((e) => e.root),
    inspect,
    colliders: () => [...entities.values()].map((e) => ({ ...e.body })),
    blockedPlayer: (x, z, y) =>
      [...entities.values()].some((e) =>
        overlaps(playerBody({ x, z, y }), e.body),
      ),
    state: () => ({
      density: DENSITY_NAMES[level],
      densityLevel: level,
      npcEnabled: level > 0,
      propsEnabled: level > 0,
      students: [...entities.values()].filter((e) => e.kind === "walk").length,
      bikes: [...entities.values()].filter((e) => e.kind === "bicycle").length,
      scooters: [...entities.values()].filter((e) => e.kind === "scooter")
        .length,
      cars: [...entities.values()].filter((e) => e.kind === "car").length,
      squirrels: [...entities.values()].filter((e) => e.kind === "squirrel")
        .length,
      props: [...entities.values()].filter((e) => e.kind === "prop").length,
      colliders: entities.size,
      allocatedInstances: instances,
      totalCreated,
      totalDisposed,
      preloadedActorPool: 0,
      pathWorldChecksPerFrame: lastWorldChecks,
      detourWorldChecks,
      detoursStarted,
      detoursCompleted,
      paths: paths.length,
      positions: [...entities.values()]
        .filter((e) => e.path)
        .map((e) => e.root.position.toArray()),
      entities: [...entities.keys()].map(inspect),
    }),
  };
}
