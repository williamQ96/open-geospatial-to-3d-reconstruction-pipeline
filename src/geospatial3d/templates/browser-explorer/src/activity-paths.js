// SPDX-License-Identifier: Apache-2.0
// Fixed, offline classified paths. Never fall back across habitat classes.
export function compileActivityPath(record) {
  if (
    !record.id ||
    !["pedestrian", "driving", "vegetation", "tree"].includes(record.surface)
  )
    throw new Error("Unclassified activity path");
  const points = record.points_enu_m;
  if (
    !Array.isArray(points) ||
    points.length < 2 ||
    points.some((p) => p.length !== 3 || p.some((v) => !Number.isFinite(v)))
  )
    throw new Error("Invalid fixed path samples");
  const cumulative = [0];
  for (let i = 1; i < points.length; i++)
    cumulative.push(
      cumulative.at(-1) +
        Math.hypot(...points[i].map((v, k) => v - points[i - 1][k])),
    );
  if (cumulative.at(-1) < 1) throw new Error("Degenerate activity path");
  return { ...record, points, cumulative, length: cumulative.at(-1) };
}
export function sampleActivityPath(path, progress) {
  const travel =
      ((progress % (path.length * 2)) + path.length * 2) % (path.length * 2),
    reverse = travel > path.length,
    d = reverse ? path.length * 2 - travel : travel;
  let lo = 1,
    hi = path.cumulative.length - 1;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (path.cumulative[m] < d) lo = m + 1;
    else hi = m;
  }
  const a = path.points[lo - 1],
    b = path.points[lo],
    length = path.cumulative[lo] - path.cumulative[lo - 1],
    t = length ? (d - path.cumulative[lo - 1]) / length : 0,
    sign = reverse ? -1 : 1;
  return {
    x: a[0] + (b[0] - a[0]) * t,
    z: -a[1] - (b[1] - a[1]) * t,
    y: a[2] + (b[2] - a[2]) * t,
    yaw: Math.atan2((b[0] - a[0]) * sign, -(b[1] - a[1]) * sign),
  };
}
