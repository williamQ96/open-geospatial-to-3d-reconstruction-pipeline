import unittest
import tempfile
from pathlib import Path
from shapely.geometry import Point, Polygon
from geospatial3d.context_appearance import appearance_plan, pitched_roof_faces
from geospatial3d.io import sha256, text_sha256


class ContextAppearanceTests(unittest.TestCase):
    def test_text_digest_is_portable_without_replacing_raw_byte_provenance(self):
        with tempfile.TemporaryDirectory() as directory:
            a,b=Path(directory)/'a.json',Path(directory)/'b.json'
            a.write_bytes(b'{"version":1}\n')
            b.write_bytes(b'\xef\xbb\xbf{"version":1}\r\n')
            self.assertNotEqual(sha256(a),sha256(b))
            self.assertEqual(text_sha256(a),text_sha256(b))
    def test_variation_preserves_geography_and_is_order_independent(self):
        buildings=[{'id':str(i),'footprint_enu_m':[[i*40,0],[i*40+12,0],[i*40+12,10],[i*40,10]],
                    'base_z_m':2,'height_m':8,'roof_z_m':10} for i in range(4)]
        focus=[[-10,-10],[25,-10],[25,25],[-10,25]]
        plan=appearance_plan(buildings,focus)
        reverse=appearance_plan(list(reversed(buildings)),focus)
        self.assertEqual({b['id']:b for b in plan},{b['id']:b for b in reverse})
        self.assertEqual(plan[0]['tier'],'campus')
        self.assertEqual(plan[1]['tier'],'background')
        for original,art in zip(buildings,plan):
            for key in ['id','footprint_enu_m','base_z_m','height_m','roof_z_m']:
                self.assertEqual(original[key],art[key])
        self.assertEqual(len(appearance_plan(buildings,focus,protected_ids=['0'])),3)

    def test_roof_stays_inside_original_footprint_and_height(self):
        ring=[[0,0],[10,0],[10,4],[6,4],[6,7],[0,7]]
        faces=pitched_roof_faces(ring,4,7)
        self.assertGreaterEqual(len(faces),2)
        for face in faces:
            for x,y,z in face:
                self.assertTrue(Polygon(ring).buffer(1e-8).covers(Point(x,y)))
                self.assertGreaterEqual(z,4)
                self.assertLessEqual(z,7)
        with self.assertRaises(ValueError):pitched_roof_faces(ring,7,4)
