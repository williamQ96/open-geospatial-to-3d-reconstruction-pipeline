import unittest
from shapely.geometry import LineString,Polygon
from geospatial3d.navigation import build_navigation_graph

class NavigationTests(unittest.TestCase):
 def test_intersections_obstacles_and_clear_gap_connectors(self):
  features=[{'kind':'path','centerline_enu_m':[[0,0],[40,0]]},{'kind':'road','centerline_enu_m':[[20,-20],[20,20]]},{'kind':'path','centerline_enu_m':[[45,0],[60,0]]}]
  g=build_navigation_graph(features,[],step_m=5)
  self.assertIn([20,0],g['nodes_enu_m'])
  self.assertTrue(any(e[3]=='connector' for e in g['edges']))
  wall={'footprint_enu_m':[[18,-8],[22,-8],[22,8],[18,8]]}
  g=build_navigation_graph(features,[wall],step_m=5);obstacle=Polygon(wall['footprint_enu_m']).buffer(.64)
  for a,b,*_ in g['edges']:self.assertFalse(LineString([g['nodes_enu_m'][a],g['nodes_enu_m'][b]]).intersects(obstacle))
 def test_empty_and_invalid_step(self):
  self.assertEqual(build_navigation_graph([],[])['nodes_enu_m'],[])
  with self.assertRaises(ValueError):build_navigation_graph([],[],step_m=0)
