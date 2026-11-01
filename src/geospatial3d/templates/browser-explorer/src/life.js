// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { createCampusProp } from "./props.js";
import { routeSample, distance } from "./routing.js";
import { overlaps, playerBody, capsuleEnds } from "./collision.js";
import { DENSITY_COUNTS, DENSITY_NAMES, densityIndex } from "./ambience.js";

const SHAPES = {
  walk: { radius: 0.32, height: 1.78, halfLength: 0 },
  bicycle: { radius: 0.33, height: 1.98, halfLength: 0.65 },
  scooter: { radius: 0.32, height: 1.98, halfLength: 0.45 },
  car: { radius: 0.93, height: 1.85, halfLength: 1.2 },
  van: { radius: 1, height: 2.3, halfLength: 1.4 },
  pickup: { radius: 0.93, height: 1.8, halfLength: 1.2 },
  squirrel: { radius: 0.17, height: 0.58, halfLength: 0.1 },
};
export function createCampusLife({
  scene,
  router,
  activity,
  studentFactory,
  squirrelFactory,
  ground,
  clearSegment,
  getPlayer = () => ({ x: 9999, y: 0, z: 9999 }),
}) {
  const people = new THREE.Group(),
    props = new THREE.Group();
  people.name = "Scripted campus life";
  props.name = "Parked vehicles";
  scene.add(people, props);
  const actors = [],
    parked = [];
  let level = 2,
    clock = 0,
    active = [];
  const nearest = (p) =>
    router.nodes.reduce(
      (a, b) => (distance(b, p) < distance(a, p) ? b : a),
      router.nodes[0],
    );
  const routeLength = (points) =>
    points.slice(1).reduce((s, p, i) => s + distance(p, points[i]), 0);
  const walkRoutes = [];
  for (const raw of activity.students.routes_enu_m) {
    if (raw.length < 2 || !router.nodes.length) continue;
    const route = router.route(nearest(raw[0]), nearest(raw.at(-1)));
    if (route?.distance > 20) walkRoutes.push(route);
  }
  walkRoutes.sort((a, b) => a.distance - b.distance);
  const roadRoutes = [];
  for (const raw of activity.traffic.routes_enu_m) {
    let best = [],
      segment = [];
    for (let i = 1; i < raw.length; i++) {
      const a = raw[i - 1],
        b = raw[i];
      if (clearSegment(a, b)) {
        if (!segment.length) segment.push(a);
        segment.push(b);
      } else {
        if (segment.length > best.length) best = segment;
        segment = [];
      }
    }
    if (segment.length > best.length) best = segment;
    const length = routeLength(best);
    if (length > 30) roadRoutes.push({ points: best, distance: length });
  }
  const squirrelRoutes = [];
  for (const raw of activity.squirrels?.routes_enu_m || []) {
    if (raw.length < 2) continue;
    const clear = raw.slice(1).every((p, i) => clearSegment(raw[i], p));
    const route = clear
      ? { points: raw, distance: routeLength(raw) }
      : router.nodes.length
        ? router.route(nearest(raw[0]), nearest(raw.at(-1)))
        : null;
    if (route?.distance > 8) squirrelRoutes.push(route);
  }
  function fit(body) {
    const ends = capsuleEnds(body),
      extra = Math.max(0, body.radius - 0.5);
    for (const p of body.halfLength
      ? [...ends, [body.x, body.z]]
      : [[body.x, body.z]])
      for (const [ox, oz] of extra > 0
        ? [
            [0, 0],
            [extra, 0],
            [-extra, 0],
            [0, extra],
            [0, -extra],
          ]
        : [[0, 0]])
        if (!clearSegment([p[0] + ox, -p[1] - oz], [p[0] + ox, -p[1] - oz]))
          return false;
    return true;
  }
  function pose(actor, progress, lane = true) {
    const length = actor.route.distance,
      travel = ((progress % (2 * length)) + 2 * length) % (2 * length),
      reverse = travel > length,
      along = reverse ? 2 * length - travel : travel;
    const { point: p, direction: d } = routeSample(actor.route.points, along),
      norm = Math.hypot(...d) || 1,
      sign = reverse ? -1 : 1;
    const fx = (d[0] / norm) * sign,
      fz = (-d[1] / norm) * sign,
      ease = Math.min(1, along / 3, (length - along) / 3),
      offset = lane
        ? (actor.kind === "car"
            ? 1.55
            : actor.kind === "squirrel"
              ? 0.2
              : 0.5) * Math.max(0, ease)
        : 0;
    const x = p[0] + fz * offset,
      z = -p[1] - fx * offset;
    return { ...actor.body, x, z, y: ground(x, z), yaw: Math.atan2(fx, fz) };
  }
  function apply(actor, body) {
    Object.assign(actor.body, body);
    actor.root.position.set(body.x, body.y, body.z);
    actor.root.rotation.y = body.yaw;
  }
  function addActor(kind, route, i) {
    const visual =
      kind === "walk"
        ? studentFactory(i + 1)
        : kind === "squirrel"
          ? squirrelFactory(i)
          : {
              root: createCampusProp(
                kind,
                [0x64857b, 0xa5a69a, 0x9d765d, 0x455e6b][i % 4],
              ),
            };
    const actor = {
      ...visual,
      kind,
      route,
      progress: ((i * 0.173 + 0.071) % 1) * route.distance * 2,
      speed:
        kind === "car"
          ? 5.5
          : kind === "bicycle"
            ? 3
            : kind === "scooter"
              ? 2.5
              : kind === "squirrel"
                ? 1.8
                : 1.25,
      enabled: false,
      moving: false,
      body: {
        ...SHAPES[kind],
        id: kind + "-" + i,
        kind,
        x: 0,
        y: 0,
        z: 0,
        yaw: 0,
      },
    };
    actor.root.visible = false;
    people.add(actor.root);
    actors.push(actor);
    apply(actor, pose(actor, actor.progress));
  }
  for (const kind of ["walk", "bicycle", "scooter", "car", "squirrel"]) {
    const routes =
      kind === "car"
        ? roadRoutes
        : kind === "squirrel"
          ? squirrelRoutes
          : walkRoutes;
    if (!routes.length || (kind === "squirrel" && !squirrelFactory)) continue;
    for (let i = 0; i < DENSITY_COUNTS[3][kind]; i++)
      addActor(kind, routes[i % Math.min(routes.length, 8)], i);
  }
  for (const [i, item] of activity.props.entries()) {
    const mesh = createCampusProp(item.kind),
      body = {
        ...SHAPES[item.kind],
        id: "prop-" + i,
        kind: "prop",
        x: item.east,
        z: -item.north,
        y: ground(item.east, -item.north),
        yaw: item.yaw || 0,
      };
    if (!fit(body) || parked.some((p) => overlaps(p.body, body))) continue;
    mesh.position.set(body.x, body.y, body.z);
    mesh.rotation.y = body.yaw;
    mesh.visible = false;
    props.add(mesh);
    parked.push({ root: mesh, body, enabled: false });
  }
  function setDensity(value) {
    level = densityIndex(value);
    const target = DENSITY_COUNTS[level],
      previous = new Set(actors.filter((a) => a.enabled));
    active = [];
    for (const item of [...actors, ...parked]) {
      item.enabled = false;
      item.root.visible = false;
    }
    const player = playerBody(getPlayer());
    for (const prop of parked.slice(0, target.props)) {
      if (overlaps(prop.body, player)) continue;
      prop.enabled = true;
      prop.root.visible = true;
      active.push(prop.body);
    }
    const used = {};
    for (const actor of actors) {
      const count = used[actor.kind] || 0;
      if (count >= target[actor.kind]) continue;
      let candidate = actor.body,
        found = false;
      for (let attempt = 0; attempt < 96; attempt++) {
        if (attempt || !previous.has(actor)) {
          if (attempt) actor.progress += actor.route.distance * 0.137;
          candidate = pose(actor, actor.progress);
          if (!fit(candidate)) candidate = pose(actor, actor.progress, false);
        }
        if (
          fit(candidate) &&
          !overlaps(candidate, player, 0.04) &&
          !active.some((b) => overlaps(candidate, b, 0.06))
        ) {
          found = true;
          break;
        }
      }
      if (!found) continue;
      actor.enabled = true;
      actor.root.visible = true;
      apply(actor, candidate);
      active.push(actor.body);
      used[actor.kind] = count + 1;
    }
    people.visible = props.visible = level > 0;
  }
  function update(dt) {
    if (level === 0) return;
    const steps = Math.max(1, Math.ceil(dt / 0.05)),
      step = dt / steps;
    for (let j = 0; j < steps; j++) {
      clock += step;
      const player = playerBody(getPlayer());
      for (const actor of actors) {
        if (!actor.enabled) continue;
        actor.moving = false;
        if (
          actor.kind === "squirrel" &&
          (clock + Number(actor.body.id.split("-")[1]) * 0.53) % 5.5 > 3.7
        )
          continue;
        const next = actor.progress + actor.speed * step;
        let candidate = pose(actor, next);
        if (!fit(candidate)) candidate = pose(actor, next, false);
        if (
          !fit(candidate) ||
          overlaps(candidate, player, 0.03) ||
          active.some((b) => b !== actor.body && overlaps(candidate, b, 0.04))
        )
          continue;
        actor.progress = next;
        apply(actor, candidate);
        actor.moving = true;
      }
    }
    for (const actor of actors) {
      if (!actor.enabled) continue;
      actor.animate?.(clock, actor.moving);
      if (actor.kind === "squirrel")
        actor.root.position.y =
          actor.body.y +
          (actor.moving ? Math.abs(Math.sin(clock * 14)) * 0.035 : 0);
    }
  }
  setDensity(2);
  return {
    update,
    setDensity,
    blockedPlayer: (x, z, y) =>
      active.some((b) => overlaps(playerBody({ x, z, y }), b)),
    colliders: () => active.map((b) => ({ ...b })),
    state: () => ({
      density: DENSITY_NAMES[level],
      densityLevel: level,
      npcEnabled: level > 0,
      propsEnabled: level > 0,
      students: actors.filter((a) => a.enabled && a.kind === "walk").length,
      bikes: actors.filter((a) => a.enabled && a.kind === "bicycle").length,
      scooters: actors.filter((a) => a.enabled && a.kind === "scooter").length,
      cars: actors.filter((a) => a.enabled && a.kind === "car").length,
      squirrels: actors.filter((a) => a.enabled && a.kind === "squirrel")
        .length,
      props: parked.filter((p) => p.enabled).length,
      colliders: active.length,
      positions: actors
        .filter((a) => a.enabled)
        .map((a) => a.root.position.toArray()),
    }),
  };
}
