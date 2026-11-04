// SPDX-License-Identifier: Apache-2.0
// Deterministic ping-pong routes for named characters; coordinates are scene x/z metres.
export function createFixedNpcPath({ points, speed = 0, pauseSeconds = 0 }) {
  if (
    !Array.isArray(points) ||
    !points.length ||
    points.some(
      (p) =>
        !Array.isArray(p) ||
        p.length !== 2 ||
        p.some((v) => !Number.isFinite(v)),
    ) ||
    !Number.isFinite(speed) ||
    speed < 0 ||
    !Number.isFinite(pauseSeconds) ||
    pauseSeconds < 0
  )
    throw new Error("Invalid fixed NPC path");
  const route = points.map((p) => [...p]);
  if (
    route.length > 1 &&
    (speed === 0 ||
      route.some(
        (p, i) =>
          i &&
          Math.hypot(p[0] - route[i - 1][0], p[1] - route[i - 1][1]) < 1e-6,
      ))
  )
    throw new Error(
      "Path requires positive speed and distinct consecutive points",
    );
  let index = 0,
    direction = 1,
    distance = 0,
    pause = 0,
    heading = 0;
  return {
    update(dt) {
      if (!Number.isFinite(dt) || dt < 0)
        throw new Error("Invalid elapsed time");
      let remaining = dt;
      while (remaining > 0 && route.length > 1) {
        if (pause > 0) {
          const used = Math.min(remaining, pause);
          pause -= used;
          remaining -= used;
          if (!remaining) break;
        }
        const next = index + direction,
          a = route[index],
          b = route[next],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          length = Math.hypot(dx, dz);
        heading = Math.atan2(dx, dz);
        const used = Math.min(remaining, (length - distance) / speed);
        distance += speed * used;
        remaining -= used;
        if (distance >= length - 1e-9) {
          index = next;
          distance = 0;
          if (index === 0 || index === route.length - 1) {
            direction *= -1;
            pause = pauseSeconds;
          }
        }
      }
      return this.state();
    },
    state() {
      const a = route[index],
        b = route[index + direction] || a,
        length = Math.hypot(b[0] - a[0], b[1] - a[1]),
        f = length ? distance / length : 0;
      return {
        position: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f],
        heading,
        moving: route.length > 1 && pause <= 0,
        pauseRemaining: pause,
      };
    },
  };
}
