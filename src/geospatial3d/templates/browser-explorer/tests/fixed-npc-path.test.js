import { test } from "node:test";
import assert from "node:assert/strict";
import { createFixedNpcPath } from "../src/fixed-npc-path.js";
test("named actor walks both directions and pauses at endpoints", () => {
  const p = createFixedNpcPath({
    points: [
      [0, 0],
      [4, 0],
    ],
    speed: 1,
    pauseSeconds: 2,
  });
  assert.deepEqual(p.update(4).position, [4, 0]);
  assert.equal(p.state().moving, false);
  assert.deepEqual(p.update(1).position, [4, 0]);
  assert.deepEqual(p.update(2).position, [3, 0]);
  assert.deepEqual(p.update(3).position, [0, 0]);
  assert.equal(p.state().moving, false);
});
test("fixed mode and invalid paths", () => {
  const p = createFixedNpcPath({ points: [[2, 3]] });
  assert.deepEqual(p.update(50).position, [2, 3]);
  assert.equal(p.state().moving, false);
  assert.throws(() =>
    createFixedNpcPath({
      points: [
        [1, 1],
        [1, 1],
      ],
      speed: 1,
    }),
  );
  assert.throws(() => p.update(-1));
});
