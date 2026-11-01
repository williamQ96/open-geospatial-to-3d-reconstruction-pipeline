import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createWalkMotion, densityIndex } from "../src/ambience.js";
import { overlaps, playerBody, capsuleDistance } from "../src/collision.js";
import { movePlayer } from "../src/world.js";
import { feedbackDraft } from "../src/feedback.js";
import { createCampusLife } from "../src/life.js";

test("capsules intersect across rotated cars, respect height, and stop fast player substeps", () => {
  const car = {
    x: 0,
    z: 0,
    y: 0,
    radius: 0.9,
    height: 1.8,
    halfLength: 1.2,
    yaw: Math.PI / 2,
  };
  const crossing = { ...car, yaw: 0 };
  assert.equal(capsuleDistance(car, crossing), 0);
  assert.equal(overlaps(car, crossing), true);
  assert.equal(overlaps(playerBody({ x: 0, z: 0, y: 2 }), car), false);
  assert.equal(overlaps(playerBody({ x: 0, z: 1, y: 0 }), car), true);
  const p = { x: -5, y: 0, z: 0 };
  movePlayer(p, { x: 10, z: 0 }, [], 20, null, false, (x, z, y) =>
    overlaps(playerBody({ x, z, y }), car),
  );
  assert.ok(
    p.x < -2.4 && p.x > -2.8,
    "player stops before the parked car rather than tunnelling",
  );
  assert.equal(overlaps(playerBody(p), car), false);
});

test("walking feedback follows ground displacement; reduced motion preserves footsteps", () => {
  const motion = createWalkMotion();
  for (let i = 0; i < 20; i++)
    assert.equal(
      motion.update(0.02, 0, { grounded: true, enabled: true }).step,
      false,
    );
  const moving = motion.update(0.05, 0.8, { grounded: true, enabled: true });
  assert.equal(moving.step, true);
  assert.ok(Math.abs(moving.bobY) > 0 && Math.abs(moving.bobY) < 0.019);
  assert.equal(
    motion.update(0.05, 0.8, { grounded: false, enabled: true }).step,
    false,
  );
  assert.equal(
    motion.update(0.05, 0.8, { grounded: true, enabled: false }).step,
    false,
  );
  const reduced = motion.update(0.05, 0.8, {
    grounded: true,
    enabled: true,
    reducedMotion: true,
  });
  assert.equal(reduced.step, true);
  assert.deepEqual([reduced.bobX, reduced.bobY, reduced.roll], [0, 0, 0]);
  motion.reset();
  assert.equal(
    motion.update(0.05, 0, { grounded: true, enabled: true }).bobY,
    0,
  );
});

test("feedback is an encoded downstream draft, with optional location and lossless long-body fallback", () => {
  const input = {
    repository: "someone/place",
    content: "门前台阶 & path?",
    iteration: 11,
    view: "first",
    now: new Date("2026-10-31T12:00:00Z"),
  };
  const draft = feedbackDraft(input),
    url = new URL(draft.url);
  assert.equal(url.origin, "https://github.com");
  assert.equal(url.pathname, "/someone/place/issues/new");
  assert.match(
    url.searchParams.get("title"),
    /^Feedback #20261031120000000 · iteration 11$/,
  );
  assert.ok(url.searchParams.get("body").includes(input.content));
  assert.ok(!draft.body.includes("Coordinates"));
  assert.ok(
    feedbackDraft({ ...input, coordinates: "E 2 / N 3" }).body.includes(
      "E 2 / N 3",
    ),
  );
  assert.equal(
    feedbackDraft({ ...input, title: "My correction" }).title,
    "My correction",
  );
  assert.throws(() => feedbackDraft({ ...input, content: "   " }));
  assert.throws(() =>
    feedbackDraft({ ...input, repository: "https://evil.example" }),
  );
  const long = feedbackDraft({ ...input, content: "校".repeat(2000) });
  assert.equal(long.needsPaste, true);
  assert.ok(!new URL(long.url).searchParams.has("body"));
  assert.ok(long.body.includes("校".repeat(2000)));
});

test("density changes real populations and collision volumes; actors yield to player and each other", () => {
  const player = { x: 0, y: 0, z: -0.5 };
  const route = {
    points: [
      [-100, 0],
      [100, 0],
    ],
    distance: 200,
  };
  const life = createCampusLife({
    scene: new THREE.Scene(),
    router: {
      nodes: [
        [-100, 0],
        [100, 0],
      ],
      route: () => route,
    },
    activity: {
      students: { routes_enu_m: [route.points] },
      traffic: { routes_enu_m: [] },
      squirrels: { routes_enu_m: [route.points] },
      props: [],
    },
    studentFactory: () => ({ root: new THREE.Group() }),
    squirrelFactory: () => ({ root: new THREE.Group() }),
    ground: () => 0,
    clearSegment: () => true,
    getPlayer: () => player,
  });
  assert.equal(life.state().density, "Mid");
  assert.equal(life.state().squirrels, 8);
  life.setDensity(1);
  const low = life.colliders().length;
  life.setDensity(3);
  assert.ok(life.colliders().length > low);
  for (let step = 0; step < 500; step++) {
    life.update(0.08);
    const bodies = life.colliders();
    for (let i = 0; i < bodies.length; i++) {
      assert.equal(overlaps(bodies[i], playerBody(player)), false);
      for (let j = 0; j < i; j++)
        assert.equal(overlaps(bodies[i], bodies[j]), false);
    }
  }
  life.setDensity(0);
  life.update(1);
  assert.equal(life.colliders().length, 0);
  assert.deepEqual(life.state().positions, []);
  assert.equal(life.blockedPlayer(0, 0, 0), false);
  assert.equal(densityIndex("2"), 2);
  assert.equal(densityIndex(-1), 2);
});
