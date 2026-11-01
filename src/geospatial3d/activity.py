# SPDX-License-Identifier: Apache-2.0
"""Offline semantic-path compilation: classify first, sample once, never cross-fallback."""
import math

from shapely.geometry import LineString, Point


def line_parts(geometry):
    if geometry.is_empty:
        return []
    if geometry.geom_type == 'LineString':
        return [geometry]
    return [line for part in getattr(geometry, 'geoms', ()) for line in line_parts(part)]


def fixed_paths(lines, allowed, obstacles, surface, height_at, *, inset=.5,
                clearance=.6, spacing=1.5, minimum_length=8, prefix='route'):
    """Clip paths to their own semantic zone, with conservative static clearance.

    Classification is authored/inferred by the downstream, not an access survey.
    Store world heights so the runtime never repeats terrain/world classification.
    """
    if surface not in {'pedestrian', 'driving', 'vegetation'}:
        raise ValueError('Unsupported ground habitat')
    if spacing <= 0 or inset < 0 or clearance < 0:
        raise ValueError('Invalid path tolerances')
    zone = allowed.buffer(-inset).difference(obstacles.buffer(clearance))
    result = []
    for source_index, raw in enumerate(lines):
        line = raw if isinstance(raw, LineString) else LineString(raw)
        for segment in line_parts(line.intersection(zone)):
            if segment.length < minimum_length:
                continue
            # A small endpoint margin avoids rotation into adjacent boundaries.
            trim = min(1.2, segment.length * .08)
            steps = max(2, math.ceil((segment.length - trim * 2) / spacing))
            points = []
            distances = {trim + (segment.length - trim * 2) * i / steps for i in range(steps + 1)}
            distances.update(segment.project(Point(p)) for p in segment.coords
                             if trim < segment.project(Point(p)) < segment.length - trim)
            for distance in sorted(distances):
                p = segment.interpolate(distance)
                points.append([round(p.x, 4), round(p.y, 4), round(height_at(p.x, p.y), 4)])
            result.append({'id': f'{prefix}-{source_index}-{len(result)}', 'surface': surface,
                           'points_enu_m': points, 'classification': 'Authored semantic surface; inferred access'})
    return result
