# SPDX-License-Identifier: Apache-2.0
"""Optional road/path centerlines, draped exactly onto the terrain triangles.

Widths are downstream display estimates. This does not infer surveyed pavement,
bridge decks, road access, routing, or independently measured elevations.
"""
import numpy as np
from pyproj import Transformer
import shapely
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union


def sample_terrain(field, east, north):
    """Use the same SW-NE triangle diagonal as Blender and downstream walking."""
    u = np.clip((east - field['min_east_m']) / field['spacing_m'], 0, field['nx'] - 1.00000001)
    v = np.clip((north - field['min_north_m']) / field['spacing_m'], 0, field['ny'] - 1.00000001)
    i, j = int(u), int(v)
    a, b = u-i, v-j
    h = field['heights_m']
    nx = field['nx']
    h00, h10, h01, h11 = h[j*nx+i], h[j*nx+i+1], h[(j+1)*nx+i], h[(j+1)*nx+i+1]
    return float(h00 + (h10-h00)*a + (h11-h10)*b if a >= b
                 else h00 + (h11-h01)*a + (h01-h00)*b)


def drape_surface(footprint, field, offset=.04):
    """Intersect with each terrain triangle before tessellation to avoid cutting slopes."""
    nx, ny, s = field['nx'], field['ny'], field['spacing_m']
    x = field['min_east_m'] + np.arange(nx-1)*s
    y = field['min_north_m'] + np.arange(ny-1)*s
    gx, gy = np.meshgrid(x, y)
    sw = np.column_stack((gx.ravel(), gy.ravel()))
    se, ne, nw = sw + [s, 0], sw + [s, s], sw + [0, s]
    triangles = shapely.polygons(np.concatenate((np.stack((sw,se,ne),axis=1),
                                                 np.stack((sw,ne,nw),axis=1))))
    hit = triangles[shapely.intersects(triangles, footprint)]
    clipped = shapely.intersection(hit, footprint)
    # Constrained tessellation respects concave boundaries and holes (e.g. buildings).
    pieces = shapely.get_parts(shapely.constrained_delaunay_triangles(clipped))
    vertices, faces, lookup = [], [], {}
    for tri in pieces:
        if tri.area < 1e-8:
            continue
        coords = list(tri.exterior.coords)[:3]
        face = []
        for east, north in coords:
            key = (round(east, 7), round(north, 7))
            if key not in lookup:
                lookup[key] = len(vertices)
                vertices.append([east, north, sample_terrain(field, east, north)+offset])
            face.append(lookup[key])
        a, b, c = coords
        if (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]) < 0:
            face.reverse()
        faces.append(face)
    return vertices, faces


def add_corridors(bundle, catalog):
    frame = bundle['coordinate_frame']
    projector = Transformer.from_crs(4326, frame['horizontal_epsg'], always_xy=True)
    ox, oy, _ = frame['origin_projected_m']
    def local_coordinates(x, y):
        east, north = projector.transform(x, y)
        return np.asarray(east)-ox, np.asarray(north)-oy
    half = bundle['aoi_size_m']/2
    extent = box(-half, -half, half, half)
    groups = {'road': [], 'path': []}
    records = []
    seen = set()
    source_ids = {source['id'] for source in catalog['sources']}
    for feature in catalog['features']:
        if feature['id'] in seen:
            raise ValueError(f"Duplicate corridor id: {feature['id']}")
        seen.add(feature['id'])
        props = feature['properties']
        if props['source_id'] not in source_ids:
            raise ValueError(f"Unknown corridor source: {props['source_id']}")
        line = shapely.transform(LineString(feature['geometry']['coordinates']), local_coordinates, interleaved=False)
        clipped = line.intersection(extent)
        parts = [clipped] if clipped.geom_type == 'LineString' else list(getattr(clipped, 'geoms', []))
        for index, part in enumerate(parts):
            if part.geom_type != 'LineString' or part.length < .1:
                continue
            record = {'id': f"{feature['id']}-{index}", **props,
                      'centerline_enu_m': [[round(x,6),round(y,6)] for x,y in part.coords],
                      'length_m': round(part.length,3)}
            records.append(record)
            groups[props['kind']].append(part.buffer(props['width_m']/2, cap_style='round', join_style='round'))
    buildings = unary_union([Polygon(b['footprint_enu_m']) for b in bundle['buildings']])
    occupied = Polygon()
    surfaces = []
    for kind, polygons in groups.items():
        if not polygons:
            continue
        footprint = unary_union(polygons).intersection(extent).difference(buildings).difference(occupied)
        occupied = occupied.union(footprint)
        vertices, faces = drape_surface(footprint, bundle['terrain'])
        if faces:
            surfaces.append({'id': f"corridors-{kind}", 'kind': kind,
                             'vertices_enu_m': vertices, 'triangles': faces,
                             'area_m2': round(footprint.area,3), 'vertical_offset_m': .04})
    bundle['corridor_surfaces'] = surfaces
    bundle['corridors'] = {'features': records, 'sources': catalog['sources'],
                           'surface_nodes': [s['id'] for s in surfaces],
                           'width_note': 'Estimated display widths; terrain-draped surfaces, not surveyed pavement or bridge elevations.'}
    bundle['quality']['corridor_segments'] = len(records)
    bundle['quality']['corridor_surface_area_m2'] = round(sum(s['area_m2'] for s in surfaces),3)
