import unittest
from shapely.geometry import box, Polygon, LineString
from geospatial3d.activity import fixed_paths

class ActivityTests(unittest.TestCase):
    def test_semantic_clipping_does_not_fallback_across_gaps(self):
        zone=box(0,0,10,5).union(box(15,0,30,5))
        paths=fixed_paths([[[-5,2],[35,2]]],zone,Polygon(),'pedestrian',lambda x,y:3,
                          minimum_length=2)
        self.assertEqual(len(paths),2)
        for route in paths:
            self.assertEqual(route['surface'],'pedestrian')
            self.assertTrue(zone.covers(LineString([p[:2] for p in route['points_enu_m']])))
            self.assertTrue(all(p[2]==3 for p in route['points_enu_m']))
        with self.assertRaises(ValueError):
            fixed_paths([],zone,Polygon(),'road-or-grass',lambda x,y:0)

    def test_original_bends_are_preserved_and_obstacles_excluded(self):
        raw=[[0,0],[5,0],[5,5]]
        paths=fixed_paths([raw],box(-2,-2,8,8),box(4,3,6,4),'vegetation',lambda x,y:x*.1,
                          minimum_length=1,spacing=2.7)
        self.assertIn([5.,0.,.5],paths[0]['points_enu_m'])
        for route in paths:
            self.assertFalse(LineString([p[:2] for p in route['points_enu_m']]).intersects(box(4,3,6,4)))
