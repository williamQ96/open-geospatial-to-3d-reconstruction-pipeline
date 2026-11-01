// SPDX-License-Identifier: Apache-2.0
import { insidePolygon } from "./world.js";
import { overlaps } from "./collision.js";
import { sampleActivityPath } from "./activity-paths.js";

export function pedestrianMask(geometry) {
  const polygons =
    geometry?.type === "Polygon"
      ? [geometry.coordinates]
      : geometry?.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  const entries = polygons.map((rings) => ({
    rings,
    minX: Math.min(...rings[0].map((p) => p[0])),
    maxX: Math.max(...rings[0].map((p) => p[0])),
    minN: Math.min(...rings[0].map((p) => p[1])),
    maxN: Math.max(...rings[0].map((p) => p[1])),
  }));
  return (x, z) =>
    entries.some(
      ({ rings, minX, maxX, minN, maxN }) =>
        x >= minX &&
        x <= maxX &&
        -z >= minN &&
        -z <= maxN &&
        insidePolygon(x, -z, rings[0]) &&
        !rings.slice(1).some((hole) => insidePolygon(x, -z, hole)),
    );
}
export function planPedestrianDetour({
  body,
  path,
  progress,
  obstacles,
  allowed,
  ground,
  clearSegment = () => true,
}) {
  obstacles = obstacles.filter(
    (o) => Math.hypot(o.x - body.x, o.z - body.z) < 14,
  );
  for (const advance of [4.5, 3, 6]) {
    const end = sampleActivityPath(path, progress + advance),
      dx = end.x - body.x,
      dz = end.z - body.z,
      length = Math.hypot(dx, dz);
    if (length < 1) continue;
    const rx = dz / length,
      rz = -dx / length;
    for (const side of [1, -1])
      for (const offset of [1.05, 1.4, 0.85]) {
        const points = [
          { x: body.x, z: body.z, y: body.y },
          { x: body.x + rx * side * offset, z: body.z + rz * side * offset },
          { x: end.x + rx * side * offset, z: end.z + rz * side * offset },
          end,
        ];
        let safe = true;
        for (let i = 1; i < points.length && safe; i++) {
          const a = points[i - 1],
            b = points[i];
          b.y = ground(b.x, b.z);
          const steps = Math.max(
            1,
            Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.2),
          );
          for (let j = 0; j <= steps; j++) {
            const t = j / steps,
              x = a.x + (b.x - a.x) * t,
              z = a.z + (b.z - a.z) * t,
              y = a.y + (b.y - a.y) * t;
            if (
              !allowed(x, z) ||
              obstacles.some((o) =>
                overlaps({ ...body, x, z, y }, o, o.clearance ?? 0.04),
              )
            ) {
              safe = false;
              break;
            }
          }
        }
        if (safe)
          for (let i = 1; i < points.length; i++) {
            const a = points[i - 1],
              b = points[i];
            if (!clearSegment([a.x, -a.z], [b.x, -b.z])) {
              safe = false;
              break;
            }
          }
        if (safe)
          return { points: points.slice(1), progress: progress + advance };
      }
  }
  return null;
}
