# SPDX-License-Identifier: Apache-2.0
"""Optional independent semantic anchors, kept separate from LiDAR geometry."""
import numpy as np
from pyproj import Transformer
from shapely.geometry import Point, Polygon, box


def annotate(bundle, catalog):
    frame = bundle['coordinate_frame']
    transform = Transformer.from_crs(4326, frame['horizontal_epsg'], always_xy=True)
    ox, oy, _ = frame['origin_projected_m']
    buildings = bundle['buildings']
    polygons = {b['id']: Polygon(b['footprint_enu_m']) for b in buildings}
    assigned = set()
    unmatched = []
    for record in catalog['buildings']:
        east, north = transform.transform(*record['lon_lat'])
        point = Point(east-ox, north-oy)
        if abs(point.x) >= bundle['aoi_size_m']/2 or abs(point.y) >= bundle['aoi_size_m']/2:
            continue
        # A post-survey building cannot be inferred from an older roof cloud.
        placeholder = record.get('placeholder')
        fallback = False
        if not placeholder and record.get('fallback_envelope_m'):
            available = [polygon.distance(point) for id, polygon in polygons.items() if id not in assigned]
            if not available or min(available) > record.get('max_match_distance_m',35):
                placeholder = {'size_m':record['fallback_envelope_m']}
                fallback = True
        if placeholder:
            width, depth, height = placeholder['size_m']
            polygon = box(point.x-width/2, point.y-depth/2, point.x+width/2, point.y+depth/2)
            # Explicit downstream revision replaces overlapping historical roofs.
            removed = [b for b in buildings if b['status']=='estimated-blockout' and (not fallback or not b.get('name')) and polygon.intersection(polygons[b['id']]).area / polygons[b['id']].area > .45]
            for b in removed:
                buildings.remove(b)
                polygons.pop(b['id'])
            terrain = bundle['terrain']
            col = int(np.clip(round((point.x-terrain['min_east_m'])/terrain['spacing_m']),0,terrain['nx']-1))
            row = int(np.clip(round((point.y-terrain['min_north_m'])/terrain['spacing_m']),0,terrain['ny']-1))
            base = terrain['heights_m'][row*terrain['nx']+col] - .2
            chosen = {'id': f"context-{record['id'].lower()}", 'kind':'building', 'status':'approximate-context-placeholder',
                      'footprint_enu_m': [list(p) for p in list(polygon.exterior.coords)[:-1]],
                      'base_z_m':base, 'roof_z_m':base+height, 'height_m':height, 'area_m2':width*depth,
                      'method':'downstream-approximate-envelope',
                      'quality_note':'Approximate downstream envelope for a post-survey or unextracted building; dimensions and location are not surveyed.'}
            buildings.append(chosen)
            polygons[chosen['id']] = polygon
            method = 'approximate-missing-roof-envelope' if fallback else 'approximate-context-envelope'
        else:
            choices = [(polygon.distance(point), polygon.centroid.distance(point), b)
                       for b in buildings if b['id'] not in assigned
                       for polygon in [polygons[b['id']]]]
            choices.sort(key=lambda c: (c[0]+.04*c[1]))
            if not choices or choices[0][0] > record.get('max_match_distance_m',35):
                unmatched.append({'id':record['id'],'name':record['name'],'reason':'No suitable historical roof candidate within matching radius'})
                continue
            distance, _, chosen = choices[0]
            method = 'anchor-within-footprint' if distance < .01 else 'approximate-nearest-roof'
        assigned.add(chosen['id'])
        chosen.update({'campus_id':record['id'],'name':record['name'],'name_source':record['source'],
                       'name_match':method,'name_anchor_lon_lat':record['lon_lat'],
                       'anchor_note':record.get('coordinate_note','Approximate independently curated locator; identity match needs site verification.')})
    assigned = {b['id'] for b in buildings if b.get('name')}
    bundle['annotations'] = {'source':catalog.get('sources',[]),'matched':len(assigned),'unmatched':unmatched,
                             'note':'Semantic matching is approximate and independent of LiDAR geometry. Unmatched structures retain unverified IDs.'}
    bundle['quality']['building_candidates'] = len(buildings)
    bundle['quality']['named_buildings'] = len(assigned)
    bundle['quality']['context_placeholders'] = sum(b['status']=='approximate-context-placeholder' for b in buildings)
