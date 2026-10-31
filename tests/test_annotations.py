# SPDX-License-Identifier: Apache-2.0
import unittest
from pyproj import Transformer
from geospatial3d.annotations import annotate


class AnnotationTests(unittest.TestCase):
    def make_bundle(self):
        x,y=Transformer.from_crs(4326,3740,always_xy=True).transform(-123.07,44.045)
        return {'aoi_size_m':200,'coordinate_frame':{'horizontal_epsg':3740,'origin_projected_m':[x,y,0]},
                'terrain':{'nx':21,'ny':21,'spacing_m':10,'min_east_m':-100,'min_north_m':-100,'heights_m':[0]*441},
                'buildings':[{'id':'roof-a','footprint_enu_m':[[-5,-5],[5,-5],[5,5],[-5,5]],'area_m2':100,'status':'estimated-blockout'}],
                'quality':{}}

    def test_name_is_attached_to_existing_geometry_without_replacing_it(self):
        bundle=self.make_bundle()
        annotate(bundle,{'buildings':[{'id':'stable-a','name':'Example Hall','lon_lat':[-123.07,44.045],'source':'fixture'}]})
        self.assertEqual(bundle['buildings'][0]['id'],'roof-a')
        self.assertEqual(bundle['buildings'][0]['name'],'Example Hall')
        self.assertEqual(bundle['buildings'][0]['campus_id'],'stable-a')
        self.assertEqual(bundle['buildings'][0]['name_match'],'anchor-within-footprint')

    def test_explicit_modern_envelope_replaces_overlapping_historical_candidate(self):
        bundle=self.make_bundle()
        annotate(bundle,{'buildings':[{'id':'modern','name':'New Hall','lon_lat':[-123.07,44.045],'source':'fixture','placeholder':{'size_m':[20,20,12]}}]})
        self.assertEqual(len(bundle['buildings']),1)
        self.assertEqual(bundle['buildings'][0]['status'],'approximate-context-placeholder')
        self.assertEqual(bundle['quality']['context_placeholders'],1)

    def test_missing_anchor_does_not_silently_label_an_unrelated_roof(self):
        bundle=self.make_bundle()
        annotate(bundle,{'buildings':[{'id':'unmatched','name':'Far Hall','lon_lat':[-123.0695,44.045],'source':'fixture','max_match_distance_m':5}]})
        self.assertNotIn('name',bundle['buildings'][0])
        self.assertEqual(len(bundle['annotations']['unmatched']),1)
