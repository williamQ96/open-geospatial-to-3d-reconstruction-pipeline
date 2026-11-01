import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createWalkMotion } from "../src/ambience.js";
import {
  pedestrianMask,
  planPedestrianDetour,
} from "../src/pedestrian-detour.js";
import { compileActivityPath } from "../src/activity-paths.js";
import { createCampusLife } from "../src/life.js";
import { createZombieSchool } from "../src/zombie-school.js";
import { overlaps, playerBody } from "../src/collision.js";

test("four motion levels change only sway; No and reduced motion keep gait contacts", () => {
  const samples = [0, 1, 2, 3].map((motionLevel) => {
    const motion = createWalkMotion();
    let max = 0,
      last;
    for (let i = 0; i < 500; i++) {
      last = motion.update(0.02, 0.034, {
        grounded: true,
        enabled: true,
        motionLevel,
      });
      max = Math.max(max, Math.abs(last.bobY));
      assert.equal(last.roll, 0);
    }
    return { max, steps: last.steps, phase: last.phase };
  });
  assert.equal(samples[0].max, 0);
  for (let i = 1; i < 4; i++) assert.ok(samples[i].max > samples[i - 1].max);
  assert.ok(samples[3].max <= 0.0105);
  assert.ok(
    samples.every(
      (s) => s.steps === samples[0].steps && s.phase === samples[0].phase,
    ),
  );
  assert.ok(samples[0].steps > 10);
  const reduced = createWalkMotion().update(1, 1.7, {
    grounded: true,
    enabled: true,
    motionLevel: 3,
    reducedMotion: true,
  });
  assert.equal(reduced.bobY, 0);
  assert.equal(reduced.step, true);
});

const region = (halfWidth) => ({
  type: "Polygon",
  coordinates: [
    [
      [-50, -halfWidth],
      [50, -halfWidth],
      [50, halfWidth],
      [-50, halfWidth],
      [-50, -halfWidth],
    ],
  ],
});
const path = compileActivityPath({
  id: "sidewalk",
  surface: "pedestrian",
  points_enu_m: [
    [-50, 0, 0],
    [50, 0, 0],
  ],
});
test("local detour passes a stationary blocker, stays on paving, and yields on narrow paths", () => {
  const args = {
    body: { x: 0, z: 0, y: 0, radius: 0.32, height: 1.8 },
    path,
    progress: 50,
    obstacles: [{ x: 0.8, z: 0, y: 0, radius: 0.36, height: 1.8 }],
    ground: () => 0,
  };
  const wide = planPedestrianDetour({
    ...args,
    allowed: pedestrianMask(region(2)),
  });
  assert.ok(wide);
  assert.equal(wide.progress, 54.5);
  assert.ok(Math.abs(wide.points.at(-1).x - 4.5) < 1e-10);
  assert.ok(Math.abs(wide.points.at(-1).z) < 1e-10);
  assert.ok(wide.points.some((p) => Math.abs(p.z) > 0.8));
  assert.equal(
    planPedestrianDetour({ ...args, allowed: pedestrianMask(region(0.45)) }),
    null,
  );
  assert.equal(
    planPedestrianDetour({
      ...args,
      allowed: pedestrianMask(region(2)),
      clearSegment: () => false,
    }),
    null,
  );
  const withHole = {
    type: "Polygon",
    coordinates: [
      region(2).coordinates[0],
      [
        [1, -1],
        [3, -1],
        [3, 1],
        [1, 1],
        [1, -1],
      ],
    ],
  };
  assert.equal(pedestrianMask(withHole)(2, 0), false);
});

test("walking NPC yields, bypasses a hero and rejoins its fixed route without overlap or teleport", () => {
  let hero = { x: 9999, z: 9999, y: 0 };
  const make = (north) => ({
    id: `walk-${north}`,
    surface: "pedestrian",
    points_enu_m: [
      [-50, north, 0],
      [50, north, 0],
    ],
  });
  const life = createCampusLife({
    scene: new THREE.Scene(),
    activity: {
      version: 2,
      seed: 1,
      paths: [make(0), make(100)],
      prop_slots: [],
      pedestrian_regions: {
        type: "MultiPolygon",
        coordinates: [
          region(2).coordinates,
          region(2).coordinates.map((r) => r.map(([x, n]) => [x, n + 100])),
        ],
      },
    },
    studentFactory: () => ({ root: new THREE.Group() }),
    ground: () => 0,
    getPlayer: () => hero,
  });
  life.setDensity(1);
  const initial = life.colliders().find((e) => e.id === "walk-0");
  hero = {
    x: initial.x + Math.sin(initial.yaw) * 2,
    z: initial.z + Math.cos(initial.yaw) * 2,
    y: 0,
  };
  const before = life.inspect("walk-0").path.progressM;
  let last = initial,
    yielded = false,
    deviated = false;
  for (let i = 0; i < 700; i++) {
    life.update(0.03);
    const body = life.colliders().find((e) => e.id === "walk-0");
    assert.equal(overlaps(body, playerBody(hero)), false);
    assert.ok(Math.hypot(body.x - last.x, body.z - last.z) <= 0.11);
    assert.ok(Math.abs(body.z) < 2);
    yielded ||= life.inspect("walk-0").movementMode === "yield";
    deviated ||= Math.abs(body.z) > 0.8;
    last = body;
  }
  assert.ok(yielded && deviated);
  assert.ok(life.state().detoursCompleted >= 1);
  assert.ok(life.inspect("walk-0").path.progressM > before + 6);
  assert.equal(life.inspect("walk-0").movementMode, "follow");
  assert.ok(Math.abs(last.z) < 0.001);
  assert.ok(life.state().detourWorldChecks > 0);
});

test("zombie contact is height-aware, ends the round once, freezes actors, and stop resets it", () => {
  let hero = { x: 0, y: 0, z: 0 },
    calls = 0;
  const game = createZombieSchool({
    scene: new THREE.Scene(),
    field: {
      nx: 2,
      ny: 2,
      min_east_m: -500,
      min_north_m: -500,
      spacing_m: 1000,
      heights_m: [0, 0, 0, 0],
    },
    buildings: [],
    half: 500,
    getPlayer: () => hero,
    clearSegment: () => true,
    onCaught: () => calls++,
  });
  game.start();
  const actor = game.state().actors[0];
  hero = { x: actor.x, z: actor.z, y: 10 };
  game.update(0.01);
  assert.equal(calls, 0);
  hero.y = actor.y;
  game.update(0.01);
  assert.equal(calls, 1);
  assert.equal(game.state().caught, true);
  const frozen = game.state().actors;
  for (let i = 0; i < 10; i++) game.update(0.1);
  assert.deepEqual(game.state().actors, frozen);
  assert.equal(calls, 1);
  game.stop();
  assert.equal(game.state().caught, false);
});
