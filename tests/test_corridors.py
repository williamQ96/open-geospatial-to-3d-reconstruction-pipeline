import unittest

from pyproj import Transformer
from shapely.geometry import Polygon, box

from geospatial3d.corridors import add_corridors, drape_surface, sample_terrain


class CorridorTests(unittest.TestCase):
    def test_surface_respects_nonplanar_terrain_diagonal_and_holes(self):
        field = {'nx': 2, 'ny': 2, 'spacing_m': 10, 'min_east_m': 0,
                 'min_north_m': 0, 'heights_m': [0, 0, 0, 10]}
        footprint = box(1, 1, 9, 9).difference(box(4, 4, 6, 6))
        vertices, faces = drape_surface(footprint, field)
        area = 0
        for face in faces:
            coords = [vertices[i] for i in face]
            tri = Polygon([v[:2] for v in coords])
            area += tri.area
            self.assertLess(tri.difference(footprint).area, 1e-8)
            # Every face lies entirely on one original terrain triangle.
            centroid = [sum(v[axis] for v in coords)/3 for axis in range(3)]
            self.assertAlmostEqual(centroid[2], sample_terrain(field,*centroid[:2])+.04, places=6)
        self.assertAlmostEqual(area, footprint.area, places=6)

    def make_bundle(self):
        origin = Transformer.from_crs(4326,3740,always_xy=True).transform(-123.07,44.045)
        return {'aoi_size_m': 20, 'coordinate_frame': {'horizontal_epsg': 3740, 'origin_projected_m': [*origin,0]},
                'terrain': {'nx': 3, 'ny': 3, 'spacing_m': 10, 'min_east_m': -10,
                            'min_north_m': -10, 'heights_m': [0]*9},
                'buildings': [{'footprint_enu_m': [[-1,-1],[1,-1],[1,1],[-1,1]]}], 'quality': {}}

    def catalog(self):
        return {'sources': [{'id':'fixture'}], 'features': [
            {'id':'road', 'geometry': {'coordinates': [[-123.071,44.045],[-123.069,44.045]]},
             'properties': {'name':'Example Road','kind':'road','width_m':4,'source_id':'fixture'}},
            {'id':'path', 'geometry': {'coordinates': [[-123.07,44.044],[-123.07,44.046]]},
             'properties': {'name':'Example Path','kind':'path','width_m':2,'source_id':'fixture'}}]}

    def test_clipping_building_exclusion_and_no_overlapping_junction_surfaces(self):
        bundle = self.make_bundle()
        add_corridors(bundle, self.catalog())
        self.assertEqual(len(bundle['corridors']['features']),2)
        shapes = []
        for surface in bundle['corridor_surfaces']:
            polygons = [Polygon([surface['vertices_enu_m'][i][:2] for i in f]) for f in surface['triangles']]
            from shapely.ops import unary_union
            shape = unary_union(polygons)
            self.assertLess(shape.difference(box(-10,-10,10,10)).area,1e-6)
            self.assertLess(shape.intersection(box(-1,-1,1,1)).area,1e-6)
            shapes.append(shape)
        self.assertEqual(len(shapes),2)
        self.assertLess(shapes[0].intersection(shapes[1]).area,1e-6)

    def test_duplicate_ids_and_unknown_sources_fail(self):
        catalog = self.catalog()
        catalog['features'].append(catalog['features'][0])
        with self.assertRaisesRegex(ValueError,'Duplicate corridor id'):
            add_corridors(self.make_bundle(),catalog)
        catalog = self.catalog()
        catalog['features'][0]['properties']['source_id'] = 'missing'
        with self.assertRaisesRegex(ValueError,'Unknown corridor source'):
            add_corridors(self.make_bundle(),catalog)
