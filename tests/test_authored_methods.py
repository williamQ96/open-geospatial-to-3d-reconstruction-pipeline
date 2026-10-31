# SPDX-License-Identifier: Apache-2.0
import math
import unittest
import numpy as np
from geospatial3d.architectural import facade_modules
from geospatial3d.canopy_cues import canopy_probability, sample_north_up


class AuthoredMethodsTests(unittest.TestCase):
    def test_bays_repeat_across_levels_with_outward_offset(self):
        bays=facade_modules((0,10),(20,10),4,[2,6],inset_m=2,normal_offset_m=.2)
        self.assertEqual(len(bays),8)
        self.assertEqual([b.east_m for b in bays[:4]],[4,8,12,16])
        self.assertAlmostEqual(bays[0].north_m,9.8)
        self.assertEqual(bays[-1].height_m,6)
        self.assertEqual(bays[0].bay_width_m,4)
        reversed_bays=facade_modules((20,10),(0,10),4,[2],inset_m=2,normal_offset_m=.2)
        self.assertAlmostEqual(reversed_bays[0].north_m,10.2)
        self.assertAlmostEqual(reversed_bays[0].yaw_rad,math.pi)

    def test_invalid_facade_does_not_invent_geometry(self):
        for count in [0,-1,1.5,True]:
            with self.assertRaises(ValueError):facade_modules((0,0),(10,0),count,[2])
        with self.assertRaises(ValueError):facade_modules((0,0),(2,0),2,[2],inset_m=1)
        with self.assertRaises(ValueError):facade_modules((0,0),(10,0),2,[])
        with self.assertRaises(ValueError):facade_modules((0,0),(10,0),2,[float('nan')])

    def test_canopy_cue_favors_textured_green_over_smooth_lawn_and_roof(self):
        rng=np.random.default_rng(7)
        rgb=np.zeros((3,80,240),dtype=np.float32)
        rgb[:,:,:80]=np.array([130,160,100])[:,None,None]
        rgb[:,:,80:160]=np.array([65,88,45])[:,None,None]+rng.normal(0,12,(1,80,80))
        rgb[:,:,160:]=170
        cue=canopy_probability(rgb)
        self.assertGreater(cue[20:60,100:140].mean(),.8)
        self.assertLess(cue[20:60,20:60].mean(),.01)
        self.assertLess(cue[20:60,180:220].mean(),.01)
        with self.assertRaises(ValueError):canopy_probability(np.zeros((4,2,2)))

    def test_raster_sampling_preserves_north_and_boundaries(self):
        cue=np.array([[.1,.2],[.7,.9]])
        self.assertAlmostEqual(sample_north_up(cue,[-20,-10,20,10],-10,5),.1)
        self.assertAlmostEqual(sample_north_up(cue,[-20,-10,20,10],10,-5),.9)
        self.assertEqual(sample_north_up(cue,[-20,-10,20,10],21,0),0)
        self.assertEqual(sample_north_up(cue,[-20,-10,20,10],-20,10),.1)
