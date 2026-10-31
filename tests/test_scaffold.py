# SPDX-License-Identifier: Apache-2.0
import json
from pathlib import Path
import tempfile
import unittest

from geospatial3d.scaffold import create_viewer, sync_viewer


class ScaffoldTests(unittest.TestCase):
    def test_independent_project_has_demo_and_hashes_without_hosting_identity(self):
        with tempfile.TemporaryDirectory() as directory:
            target = create_viewer(Path(directory) / 'viewer')
            self.assertTrue((target/'public/scene/campus.glb').is_file())
            self.assertTrue((target/'public/viewer-profile.json').is_file())
            self.assertFalse((target/'.openai/hosting.json').exists())
            lock = json.loads((target/'viewer-template.lock.json').read_text())
            self.assertIn('src/main.js',lock['files'])
            self.assertIn('src/profile.js',lock['files'])
            from geospatial3d.cli import validate_glb
            model = validate_glb(target/'public/scene/campus.glb',['demo-library'])
            self.assertIn('CC BY 4.0',model['asset_copyright'])
            self.assertTrue((target/'NOTICE').is_file())

    def test_existing_work_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)/'viewer'
            target.mkdir()
            sentinel = target/'keep.txt'
            sentinel.write_text('user work')
            with self.assertRaisesRegex(ValueError,'will not be overwritten'):
                create_viewer(target)
            self.assertEqual(sentinel.read_text(),'user work')

    def test_scene_path_escape_is_rejected_before_creating_destination(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            scene = root/'scene'
            scene.mkdir()
            (root/'outside.glb').write_bytes(b'outside')
            (scene/'manifest.json').write_text(json.dumps({'schema_version':1,'model':{'url':'../outside.glb'},'heightfield_url':'heightfield.json'}))
            target = root/'viewer'
            with self.assertRaisesRegex(ValueError,'inside the scene directory'):
                create_viewer(target,scene)
            self.assertFalse(target.exists())

    def test_sync_protects_local_code_changes(self):
        with tempfile.TemporaryDirectory() as directory:
            target = create_viewer(Path(directory)/'viewer')
            main = target/'src/main.js'
            main.write_text(main.read_text()+'\n// local work\n')
            with self.assertRaisesRegex(ValueError,'Local template change'):
                sync_viewer(target)
            self.assertTrue(main.read_text().endswith('// local work\n'))

    def test_sync_preserves_project_profile_and_scene(self):
        with tempfile.TemporaryDirectory() as directory:
            target = create_viewer(Path(directory)/'viewer')
            profile = target/'public/viewer-profile.json'
            profile.write_text('{"brand_name":"Local project"}')
            manifest = target/'public/scene/manifest.json'
            manifest.write_text('{"project_id":"local"}')
            sync_viewer(target)
            self.assertEqual(json.loads(profile.read_text())['brand_name'],'Local project')
            self.assertEqual(json.loads(manifest.read_text())['project_id'],'local')
