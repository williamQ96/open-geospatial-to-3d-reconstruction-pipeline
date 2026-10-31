// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { createCampusProp } from "./props.js";
import { routeSample, distance } from "./routing.js";
export function createCampusLife({
  scene,
  router,
  activity,
  studentFactory,
  ground,
  clearSegment,
}) {
  const people = new THREE.Group(),
    props = new THREE.Group();
  people.name = "Scripted campus life";
  props.name = "Parked vehicles";
  scene.add(people, props);
  const actors = [];
  let clock = 0;
  const nearest = (p) =>
    router.nodes.reduce(
      (best, n) => (distance(n, p) < distance(best, p) ? n : best),
      router.nodes[0],
    );
  const routes = [];
  for (const raw of activity.students.routes_enu_m) {
    if (raw.length < 2) continue;
    const route = router.route(nearest(raw[0]), nearest(raw.at(-1)));
    if (route?.distance > 20) routes.push(route);
  }
  // Prefer short pilot paths, avoid students taking long road detours.
  routes.sort((a, b) => a.distance - b.distance);
  function addActor(kind, route, index) {
    let actor;
    if (kind === "walk") actor = studentFactory(index + 1);
    else
      actor = {
        root: createCampusProp(
          kind,
          [0x64857b, 0xa5a69a, 0x9d765d, 0x455e6b][index % 4],
        ),
      };
    people.add(actor.root);
    actors.push({
      ...actor,
      kind,
      route,
      speed:
        kind === "car"
          ? 5.5
          : kind === "bicycle"
            ? 3
            : kind === "scooter"
              ? 2.5
              : 1.25,
      phase: (index * 0.173) % 1,
    });
  }
  if (routes.length)
    for (let i = 0; i < activity.students.count; i++)
      addActor(
        i < 8 ? "walk" : i < 10 ? "bicycle" : "scooter",
        routes[i % Math.min(routes.length, 8)],
        i,
      );
  // Traffic follows only contiguous clear portions of supplied road centerlines.
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
    const length = best
      .slice(1)
      .reduce((sum, p, i) => sum + distance(p, best[i]), 0);
    if (length > 30)
      addActor("car", { points: best, distance: length }, actors.length);
    if (actors.filter((a) => a.kind === "car").length >= activity.traffic.count)
      break;
  }
  for (const item of activity.props) {
    const p = [item.east, item.north];
    if (!clearSegment(p, p)) continue;
    const mesh = createCampusProp(item.kind);
    mesh.position.set(p[0], ground(p[0], -p[1]), -p[1]);
    mesh.rotation.y = item.yaw || 0;
    props.add(mesh);
  }
  function update(dt) {
    if (!people.visible) return;
    clock += dt;
    for (const actor of actors) {
      const length = actor.route.distance,
        travel =
          (clock * actor.speed + actor.phase * length * 2) % (length * 2),
        reverse = travel > length;
      const { point: p, direction: d } = routeSample(
        actor.route.points,
        reverse ? length * 2 - travel : travel,
      );
      actor.root.position.set(p[0], ground(p[0], -p[1]), -p[1]);
      actor.root.rotation.y = Math.atan2(d[0], -d[1]) + (reverse ? Math.PI : 0);
      actor.animate?.(clock, true);
    }
  }
  update(0);
  return {
    update,
    setPeople: (on) => (people.visible = on),
    setProps: (on) => (props.visible = on),
    state: () => ({
      npcEnabled: people.visible,
      propsEnabled: props.visible,
      students: actors.filter((a) => a.kind === "walk").length,
      bikes: actors.filter((a) => a.kind === "bicycle").length,
      scooters: actors.filter((a) => a.kind === "scooter").length,
      cars: actors.filter((a) => a.kind === "car").length,
      props: props.children.length,
      positions: actors.map((a) => a.root.position.toArray()),
    }),
  };
}
