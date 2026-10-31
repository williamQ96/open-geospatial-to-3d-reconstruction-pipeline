// SPDX-License-Identifier: Apache-2.0
// Runtime consumes the upstream ENU contract; glTF is X=east, Y=up, Z=south.
export function sampleGround(field, x, z) {
  const u = Math.max(
    0,
    Math.min(field.nx - 1.000001, (x - field.min_east_m) / field.spacing_m),
  );
  const v = Math.max(
    0,
    Math.min(field.ny - 1.000001, (-z - field.min_north_m) / field.spacing_m),
  );
  const i = Math.floor(u),
    j = Math.floor(v),
    a = u - i,
    b = v - j;
  const value = (dx, dy) => field.heights_m[(j + dy) * field.nx + i + dx];
  // Match the Blender terrain's SW→NE triangle diagonal exactly. Bilinear
  // interpolation would float above or cut into a non-coplanar terrain cell.
  const h00 = value(0, 0),
    h10 = value(1, 0),
    h01 = value(0, 1),
    h11 = value(1, 1);
  return a >= b
    ? h00 + (h10 - h00) * a + (h11 - h10) * b
    : h00 + (h11 - h01) * a + (h01 - h00) * b;
}

export function insidePolygon(x, north, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i],
      [bx, by] = ring[j];
    if (
      ay > north !== by > north &&
      x < ((bx - ax) * (north - ay)) / (by - ay) + ax
    )
      inside = !inside;
  }
  return inside;
}

const boundsCache = new WeakMap();
export function isBlocked(x, z, buildings, half, radius = 0.42) {
  if (Math.abs(x) > half - radius || Math.abs(z) > half - radius) return true;
  for (const b of buildings) {
    const ring = b.footprint_enu_m;
    let bounds = boundsCache.get(b);
    if (!bounds) {
      bounds = [
        Math.min(...ring.map((p) => p[0])),
        Math.min(...ring.map((p) => p[1])),
        Math.max(...ring.map((p) => p[0])),
        Math.max(...ring.map((p) => p[1])),
      ];
      boundsCache.set(b, bounds);
    }
    if (
      x < bounds[0] - radius ||
      x > bounds[2] + radius ||
      -z < bounds[1] - radius ||
      -z > bounds[3] + radius
    )
      continue;
    if (insidePolygon(x, -z, ring)) return true;
    for (let i = 0; i < ring.length; i++) {
      const [ax, ay] = ring[i],
        [bx, by] = ring[(i + 1) % ring.length];
      const dx = bx - ax,
        dy = by - ay,
        l = dx * dx + dy * dy;
      const t = l
        ? Math.max(0, Math.min(1, ((x - ax) * dx + (-z - ay) * dy) / l))
        : 0;
      if (Math.hypot(x - ax - t * dx, -z - ay - t * dy) < radius) return true;
    }
  }
  return false;
}

export function movePlayer(
  position,
  delta,
  buildings,
  half,
  field,
  snapToGround = true,
) {
  // Substeps prevent tunnelling at high frame times; axis separation slides along walls.
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.z) / 0.2));
  for (let i = 0; i < steps; i++) {
    const x = position.x + delta.x / steps;
    if (!isBlocked(x, position.z, buildings, half)) position.x = x;
    const z = position.z + delta.z / steps;
    if (!isBlocked(position.x, z, buildings, half)) position.z = z;
  }
  if (snapToGround) position.y = sampleGround(field, position.x, position.z);
  return position;
}

export function startJump(state) {
  if (!state.grounded) return false;
  state.velocity = 6.8;
  state.grounded = false;
  return true;
}

export function stepVertical(position, state, dt, ground) {
  if (state.grounded) {
    position.y = ground;
    state.velocity = 0;
    return;
  }
  const gravity = 18;
  position.y += state.velocity * dt - 0.5 * gravity * dt * dt;
  state.velocity -= gravity * dt;
  if (position.y <= ground && state.velocity <= 0) {
    position.y = ground;
    state.velocity = 0;
    state.grounded = true;
  }
}
