import test from "node:test";
import assert from "node:assert/strict";
import { movementInput } from "../src/touch.js";
import { inferEntrances } from "../src/entrances.js";
import { createClassroom } from "../src/classroom.js";
import { readReturn } from "../src/scene-transition.js";
import { installWorldLifecycle } from "../src/world-lifecycle.js";

test("analog drag scales continuously to run without diagonal or mixed-input boost", () => {
  const mild = movementInput(0, 0, false, { forward: 0.3, right: 0 });
  assert.ok(Math.abs(mild.speed - 1.38) < 1e-10);
  assert.equal(mild.running, false);
  assert.equal(movementInput(0, 0, false, { forward: 1, right: 0 }).speed, 4.6);
  assert.equal(
    movementInput(0, 0, false, { forward: 1, right: 0 }).running,
    true,
  );
  assert.ok(Math.abs(movementInput(1, 1, false).speed - 1.7) < 1e-10);
  assert.ok(
    movementInput(1, 1, true, { forward: 1, right: 1 }).speed <= 4.6 + 1e-10,
  );
  assert.equal(movementInput(0, 0, false).speed, 0);
});
test("entrances face outside either winding and honor explicit frontage overrides", () => {
  for (const ring of [
    [
      [-5, -5],
      [5, -5],
      [5, 5],
      [-5, 5],
    ],
    [
      [-5, 5],
      [5, 5],
      [5, -5],
      [-5, -5],
    ],
  ]) {
    const b = [{ id: "a", name: "Demo", footprint_enu_m: ring }];
    const e = inferEntrances(b, 100)[0];
    assert.equal(e.walkable, true);
    assert.equal(e.estimated, true);
    assert.ok(Math.max(Math.abs(e.approach[0]), Math.abs(e.approach[1])) > 5);
    const override = inferEntrances(b, 100, {
      a: { position_enu_m: [5, 0], outward_degrees: 90 },
    })[0];
    assert.equal(override.estimated, false);
    assert.ok(override.approach[0] > 5);
  }
});
test("shared classroom has a clear entry aisle and blocks desks/walls", () => {
  const room = createClassroom();
  assert.equal(room.blocked(0, 7), false);
  assert.equal(room.blocked(0, -4), true);
  assert.equal(room.blocked(12, 0), true);
  assert.equal(room.root.userData.template, "classroom-v1");
  assert.ok(room.exit);
});
test("return state fails safely for blocked storage and malformed data", () => {
  assert.equal(
    readReturn({
      getItem() {
        throw new Error("disabled");
      },
    }),
    null,
  );
  assert.equal(
    readReturn({ getItem: () => '{"version":1,"player":[null,0,0]}' }),
    null,
  );
  const value = {
    version: 1,
    buildingId: "b",
    player: [1, 2, 3],
    view: "third",
    yaw: 0,
    pitch: 0,
    followDistance: 7.5,
  };
  assert.deepEqual(readReturn({ getItem: () => JSON.stringify(value) }), value);
});

test("world exit stops the loop and disposes shared GPU resources once", () => {
  const previous = globalThis.addEventListener,
    listeners = {},
    calls = [];
  globalThis.addEventListener = (name, callback) =>
    (listeners[name] = callback);
  try {
    const texture = { isTexture: true, dispose: () => calls.push("texture") };
    const material = { map: texture, dispose: () => calls.push("material") };
    const geometry = { dispose: () => calls.push("geometry") };
    const object = { geometry, material };
    installWorldLifecycle(
      {
        setAnimationLoop: (value) =>
          calls.push(value === null ? "stop" : "unexpected"),
        dispose: () => calls.push("renderer"),
        forceContextLoss: () => calls.push("context"),
      },
      {
        traverse: (fn) => {
          fn(object);
          fn(object);
        },
      },
    );
    listeners.pagehide();
    assert.deepEqual(calls, [
      "stop",
      "texture",
      "material",
      "geometry",
      "renderer",
      "context",
    ]);
    assert.equal(typeof listeners.pageshow, "function");
  } finally {
    globalThis.addEventListener = previous;
  }
});
