# SPDX-License-Identifier: Apache-2.0
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('traffic_archive',Path(__file__).parents[1]/'scripts/archive-github-traffic.py')
traffic=importlib.util.module_from_spec(spec);spec.loader.exec_module(traffic)


class TrafficArchiveTests(unittest.TestCase):
    def test_overlapping_windows_replace_counts_and_keep_older_days(self):
        old=[{'date':'2026-10-01','views':7},{'date':'2026-10-20','views':8}]
        views={'views':[{'timestamp':'2026-10-20T00:00:00Z','count':10,'uniques':4}]}
        clones={'clones':[{'timestamp':'2026-10-20T00:00:00Z','count':2,'uniques':1}]}
        rows=traffic.merge_days(old,views,clones)
        self.assertEqual(rows[0],old[0])
        self.assertEqual(rows[1]['views'],10)
        self.assertEqual(rows[1]['views_daily_uniques'],4)
        self.assertEqual(rows[1]['clones'],2)
        self.assertEqual(traffic.merge_days(rows,views,clones),rows)
