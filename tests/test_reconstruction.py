"""Synthetic geometric checks; real-data integration is captured downstream."""

import json
from pathlib import Path
import tempfile
import unittest

import numpy as np
import jsonschema

from geospatial3d.io import fetch_source
from geospatial3d.reconstruct import fill_grid, ground_surface, roof_candidates


class ReconstructionTests(unittest.TestCase):
    def test_ground_slope_units_and_north_orientation(self):
        xx, yy = np.meshgrid(np.arange(-19, 20, 2), np.arange(-19, 20, 2))
        x, y = xx.ravel(), yy.ravel()
        z = 100 + .1 * x + .2 * y
        grid, report = ground_surface(x, y, z, 20, 2)
        self.assertAlmostEqual(grid[10, 10], 100, places=5)
        self.assertAlmostEqual(grid[15, 10], 102, places=5)
        self.assertAlmostEqual(grid[10, 15], 101, places=5)
        self.assertLess(report["holdout_rmse_m"], 1e-6)

    def test_empty_grid_fails_instead_of_inventing_terrain(self):
        with self.assertRaises(ValueError):
            fill_grid(np.full((3, 3), np.nan))

    def test_flat_roof_is_detected_but_multi_return_canopy_is_rejected(self):
        xx, yy = np.meshgrid(np.arange(-29.5, 30, 1), np.arange(-29.5, 30, 1))
        x, y = xx.ravel(), yy.ravel()
        roof = (x > -20) & (x < -3) & (np.abs(y) < 12)
        canopy = (x > 3) & (x < 20) & (np.abs(y) < 12)
        z = np.where(roof | canopy, 10, 0)
        single = (~canopy).astype(float)
        objects, _ = roof_candidates(x, y, z, np.ones(len(x)), single, np.zeros((31,31)), 30, 2,
                                      {"raster_spacing_m": 1, "min_building_area_m2": 80})
        self.assertEqual(len(objects), 1)
        self.assertTrue(all(v[0] < 0 for v in objects[0]["footprint_enu_m"]))
        self.assertAlmostEqual(objects[0]["roof_z_m"], 10)

    def test_corrupted_cache_is_not_accepted(self):
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, "input.laz").write_bytes(b"corrupt")
            with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                fetch_source({"id": "test", "filename": "input.laz", "sha256": "0"*64}, tmp)

    def test_source_path_traversal_rejected_by_schema(self):
        schema=json.loads((Path(__file__).parents[1]/"src/geospatial3d/schemas/project.schema.json").read_text())
        source_schema=schema["properties"]["sources"]["items"]
        source={"id":"x","filename":"../../escape.laz","url":"https://example.com/data.laz",
                "sha256":"0"*64,"acquisition_date":"2008-08-31","license_url":"https://example.com/terms"}
        with self.assertRaises(jsonschema.ValidationError):
            jsonschema.validate(source,source_schema)


if __name__ == "__main__":
    unittest.main()
