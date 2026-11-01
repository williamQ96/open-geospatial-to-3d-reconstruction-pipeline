import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  npcProperties,
  HAIR_STYLES,
  BAG_STYLES,
} from "../src/npc-templates.js";
import { createWalkMotion, clipTimeFromPhase } from "../src/ambience.js";
import {
  compileActivityPath,
  sampleActivityPath,
} from "../src/activity-paths.js";
import { createCampusLife } from "../src/life.js";
import {
  ZOMBIE_RULES,
  zombieTransition,
  createZombieSchool,
} from "../src/zombie-school.js";

test("template seeds replay independent bounded traits and normal human heights", () => {
  const rows = Array.from({ length: 10000 }, (_, i) =>
    npcProperties("walk", i),
  );
  const mean = rows.reduce((s, p) => s + p.heightM, 0) / rows.length;
  assert.ok(mean > 1.7 && mean < 1.72);
  assert.ok(rows.every((p) => p.heightM >= 1.4 && p.heightM <= 2));
  assert.ok(
    rows.filter((p) => Math.abs(p.heightM - 1.71) < 0.115).length > 6500,
  );
  const males = rows.filter((p) => p.sex === "m").length;
  assert.ok(males > 4700 && males < 5300);
  assert.deepEqual(new Set(rows.map((p) => p.hair)), new Set(HAIR_STYLES));
  assert.deepEqual(new Set(rows.map((p) => p.bag)), new Set(BAG_STYLES));
  assert.ok(
    rows.every((p) =>
      p.skinRGB.every((v) => Number.isInteger(v) && v >= 0 && v <= 255),
    ),
  );
  assert.deepEqual(npcProperties("walk", 532), npcProperties("walk", 532));
  assert.ok(
    rows.some((p) => p.gait === "run") && rows.some((p) => p.gait === "walk"),
  );
  assert.equal(
    new Set(
      Array.from({ length: 100 }, (_, i) => npcProperties("car", i).vehicle),
    ).size,
    4,
  );
  assert.ok(
    npcProperties("squirrel", 20).scale !== npcProperties("squirrel", 21).scale,
  );
});

test("walk audio contacts and animation use the same distance phase, with millimetre sway and zero roll", () => {
  const motion = createWalkMotion();
  let contacts = 0,
    max = 0,
    last;
  for (let i = 0; i < 500; i++) {
    last = motion.update(0.02, 1.7 * 0.02, { grounded: true, enabled: true });
    contacts += Number(last.step);
    max = Math.max(max, Math.abs(last.bobY));
    assert.equal(last.roll, 0);
  }
  assert.ok(contacts >= 17 && contacts <= 18);
  assert.equal(contacts, Math.floor(last.phase / Math.PI));
  assert.ok(max <= 0.003);
  const idle = motion.update(0.1, 0, { grounded: true, enabled: true });
  assert.equal(idle.step, false);
});

test("fixed path interpolation preserves vertical tree segments and rejects missing classification", () => {
  const path = compileActivityPath({
    id: "tree",
    surface: "tree",
    points_enu_m: [
      [0, 0, 0],
      [0, 0, 5],
      [1, 0, 5],
    ],
  });
  assert.equal(sampleActivityPath(path, 3).y, 3);
  assert.equal(sampleActivityPath(path, 9).y, 3);
  assert.throws(() =>
    compileActivityPath({
      id: "bad",
      surface: "unclassified",
      points_enu_m: [
        [0, 0, 0],
        [1, 0, 0],
      ],
    }),
  );
});

test("density constructs only requested instances, disposes No, and keeps seeds and habitats stable", () => {
  let created = 0,
    disposed = 0;
  const factory = () => {
    created++;
    return {
      root: new THREE.Group(),
      dispose() {
        disposed++;
      },
    };
  };
  const life = createCampusLife({
    scene: new THREE.Scene(),
    activity: {
      version: 2,
      seed: 3,
      prop_slots: [],
      paths: [
        {
          id: "sidewalk",
          surface: "pedestrian",
          points_enu_m: [
            [-200, 0, 0],
            [200, 0, 0],
          ],
        },
        {
          id: "grass",
          surface: "vegetation",
          points_enu_m: [
            [-200, 10, 0],
            [200, 10, 0],
          ],
        },
        {
          id: "tree",
          surface: "tree",
          points_enu_m: [
            [0, 20, 0],
            [0, 20, 10],
          ],
        },
      ],
    },
    studentFactory: factory,
    squirrelFactory: factory,
  });
  assert.equal(life.state().preloadedActorPool, 0);
  assert.equal(created, 16);
  const initial = life.inspect("walk-0");
  assert.equal(initial.path.surface, "pedestrian");
  assert.ok(
    life
      .state()
      .entities.filter((e) => e.template === "squirrel")
      .every((e) => ["vegetation", "tree"].includes(e.path.surface)),
  );
  life.setDensity(0);
  assert.equal(life.state().allocatedInstances, 0);
  assert.equal(disposed, created);
  life.setDensity(2);
  assert.deepEqual(life.inspect("walk-0").properties, initial.properties);
  for (let i = 0; i < 10; i++) life.update(0.03);
  assert.equal(life.state().pathWorldChecksPerFrame, 0);
});

test("zombie chase has 30/60 metre hysteresis and resets wander center on release", () => {
  const z = {
    x: 0,
    z: 0,
    mode: "wander",
    center: { x: 0, z: 0 },
    target: { x: 2, z: 2 },
  };
  assert.equal(zombieTransition(z, { x: 31, z: 0 }), null);
  assert.equal(zombieTransition(z, { x: 30, z: 0 }), "attracted");
  z.x = 12;
  assert.equal(zombieTransition(z, { x: 65, z: 0 }), null);
  assert.equal(z.mode, "chase");
  assert.equal(zombieTransition(z, { x: 73, z: 0 }), "released");
  assert.deepEqual(z.center, { x: 12, z: 0 });
  assert.equal(z.target, null);
  assert.ok(
    ZOMBIE_RULES.wanderSpeed < 1.7 &&
      ZOMBIE_RULES.activeSpeed > 1.7 &&
      ZOMBIE_RULES.activeSpeed < 4.6,
  );
});

test("zombies spawn on terrain, share one template and fully dispose when experiment stops", () => {
  const scene = new THREE.Scene(),
    hero = { x: 0, y: 0, z: 0 },
    field = {
      nx: 2,
      ny: 2,
      min_east_m: -500,
      min_north_m: -500,
      spacing_m: 1000,
      heights_m: [0, 0, 0, 0],
    };
  const game = createZombieSchool({
    scene,
    field,
    buildings: [],
    half: 500,
    getPlayer: () => hero,
    clearSegment: () => true,
  });
  game.start();
  assert.equal(game.state().count, 28);
  assert.ok(game.state().actors.every((a) => a.y === 0.02));
  const roots = game.pickables();
  assert.equal(new Set(roots.map((r) => r.geometry)).size, 1);
  for (let i = 0; i < 300; i++) game.update(0.03);
  assert.ok(
    game
      .state()
      .actors.filter((a) => a.mode === "wander")
      .every((a) => Math.hypot(a.x - a.center.x, a.z - a.center.z) <= 12.02),
  );
  game.stop();
  assert.equal(game.state().count, 0);
  assert.equal(game.pickables().length, 0);
});

test("asset contact phase offset wraps independently of gait cadence", () => {
  assert.equal(clipTimeFromPhase(Math.PI, 2, 0.15625), 1.3125);
  assert.equal(clipTimeFromPhase(2 * Math.PI, 2, 0.15625), 0.3125);
});
