import csv
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("inventory", ROOT / "scripts/check-asset-inventory.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class InventoryTests(unittest.TestCase):
    def check(self, rows):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "inventory.csv"
            with path.open("w", encoding="utf-8-sig", newline="") as stream:
                writer = csv.DictWriter(stream, fieldnames=module.FIELDS)
                writer.writeheader()
                writer.writerows(rows)
            return module.validate(path)

    def row(self, **changes):
        row = dict(zip(module.FIELDS, ("building:a", "area", "exterior", "A", "existing", "1", "source", "refine", "dimensions")))
        row.update(changes)
        return row

    def test_template_and_valid_rows(self):
        self.assertEqual(module.validate(ROOT / "templates/asset-refinement-inventory.csv"), [])
        self.assertEqual(self.check([self.row(), self.row(asset_id="interior:a", status="planned", level="")]), [])

    def test_missing_and_duplicate_id(self):
        self.assertTrue(self.check([self.row(), self.row()]))
        self.assertTrue(self.check([self.row(evidence="")]))

    def test_levels_and_planned_assets(self):
        for level in ("", "0", "1", "2", "3", "4", "5"):
            with self.subTest(level=level):
                self.assertFalse(self.check([self.row(level=level)]))
        for level in ("-1", "6", "2.5", "L4", "04"):
            with self.subTest(invalid=level):
                self.assertTrue(self.check([self.row(level=level)]))
        for level in ("0", "1", "2", "3", "4", "5"):
            with self.subTest(planned=level):
                self.assertTrue(self.check([self.row(status="planned", level=level)]))
        self.assertFalse(self.check([self.row(status="planned", level="")]))

    def test_bad_header(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bad.csv"
            path.write_text("wrong,header\n", encoding="utf-8")
            self.assertTrue(module.validate(path))


if __name__ == "__main__":
    unittest.main()
