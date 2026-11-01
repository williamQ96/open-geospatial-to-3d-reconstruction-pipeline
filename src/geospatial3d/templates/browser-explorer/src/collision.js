// SPDX-License-Identifier: Apache-2.0
// Lightweight upright capsules. This is collision/yielding, not rigid-body physics.
function pointSegment(px, pz, a, b) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    l = dx * dx + dz * dz;
  const t = l
    ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l))
    : 0;
  return Math.hypot(px - a[0] - t * dx, pz - a[1] - t * dz);
}
export function capsuleEnds(c) {
  const dx = Math.sin(c.yaw || 0) * (c.halfLength || 0),
    dz = Math.cos(c.yaw || 0) * (c.halfLength || 0);
  return [
    [c.x - dx, c.z - dz],
    [c.x + dx, c.z + dz],
  ];
}
export function capsuleDistance(a, b) {
  const [p, q] = capsuleEnds(a),
    [r, s] = capsuleEnds(b);
  const cross = (a, b, c) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (
    cross(p, q, r) * cross(p, q, s) < 0 &&
    cross(r, s, p) * cross(r, s, q) < 0
  )
    return 0;
  return Math.min(
    pointSegment(...p, r, s),
    pointSegment(...q, r, s),
    pointSegment(...r, p, q),
    pointSegment(...s, p, q),
  );
}
export function overlaps(a, b, margin = 0) {
  if (a.y + a.height <= b.y + 0.01 || b.y + b.height <= a.y + 0.01)
    return false;
  const reach =
    a.radius + b.radius + margin + (a.halfLength || 0) + (b.halfLength || 0);
  if (Math.abs(a.x - b.x) > reach || Math.abs(a.z - b.z) > reach) return false;
  return capsuleDistance(a, b) < a.radius + b.radius + margin;
}
export const playerBody = (p) => ({
  x: p.x,
  z: p.z,
  y: p.y,
  radius: 0.42,
  height: 1.78,
  halfLength: 0,
  yaw: 0,
  id: "player",
});
