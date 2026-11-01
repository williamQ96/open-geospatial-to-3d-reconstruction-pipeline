# SPDX-License-Identifier: Apache-2.0
"""Seed appearance, never geography: inexpensive, deterministic background art."""
import hashlib
import math
import random
from copy import deepcopy

from shapely.geometry import Polygon, LineString
from shapely.ops import split


def appearance_plan(buildings, focus_polygon, seed=613, protected_ids=()):
    """Return editable art choices with the original footprint/height/ID intact.

    The focus polygon is an art-priority region, not a surveyed property boundary.
    Archetypes and colors are illustrative, not inferred real building uses.
    """
    focus = Polygon(focus_polygon)
    if not focus.is_valid or focus.area <= 0:
        raise ValueError('Invalid art-priority polygon')
    protected = set(protected_ids)
    result = []
    for building in buildings:
        if building['id'] in protected:
            continue
        shape = Polygon(building['footprint_enu_m'])
        if not shape.is_valid or shape.area <= 0:
            raise ValueError('Invalid building footprint: ' + building['id'])
        entropy = int(hashlib.sha256(f"{seed}:{building['id']}".encode()).hexdigest()[:16], 16)
        rng = random.Random(entropy)
        tier = 'campus' if focus.covers(shape.representative_point()) else 'background'
        h = building['height_m']
        archetype = ('institutional' if tier == 'campus' else
                     'house' if shape.area < 650 and h < 15 else
                     'warehouse' if shape.area > 1600 and h < 15 else 'walkup')
        rect = shape.minimum_rotated_rectangle
        roof = 'gable' if archetype == 'house' and shape.area / rect.area > .67 else 'flat'
        item = {key: deepcopy(building[key]) for key in
                ['id', 'footprint_enu_m', 'base_z_m', 'height_m', 'roof_z_m']}
        item.update(name=building.get('name'), tier=tier, archetype=archetype,
                    roof=roof, variant=rng.randrange(4), seed=entropy,
                    window_budget=84 if tier == 'campus' and building.get('name') else 16,
                    status='Illustrative appearance; source position/footprint preserved')
        result.append(item)
    return result


def pitched_roof_faces(ring, eave_z, ridge_z):
    """Clip two roof planes to the exact footprint, preserving roads/setbacks."""
    if not math.isfinite(eave_z + ridge_z) or ridge_z < eave_z:
        raise ValueError('Invalid roof heights')
    shape = Polygon(ring)
    if not shape.is_valid or shape.area <= 0:
        raise ValueError('Invalid roof footprint')
    rectangle = list(shape.minimum_rotated_rectangle.exterior.coords)[:4]
    edges = [(math.dist(a, b), a, b) for a, b in zip(rectangle, rectangle[1:] + rectangle[:1])]
    length, a, b = max(edges)
    ux, uy = (b[0] - a[0]) / length, (b[1] - a[1]) / length
    vx, vy = -uy, ux
    center = shape.minimum_rotated_rectangle.centroid
    half_depth = max(abs((x - center.x) * vx + (y - center.y) * vy) for x, y in ring)
    extent = length * 2 + half_depth * 2 + 1
    ridge = LineString([(center.x - ux * extent, center.y - uy * extent),
                        (center.x + ux * extent, center.y + uy * extent)])
    planes = split(shape, ridge)
    return [[(x, y, ridge_z - (ridge_z - eave_z) *
              min(1, abs((x - center.x) * vx + (y - center.y) * vy) / max(.001, half_depth)))
             for x, y in list(p.exterior.coords)[:-1]] for p in planes.geoms if p.area > .001]
