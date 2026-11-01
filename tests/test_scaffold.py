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

    def test_optional_presentation_is_copied_and_cannot_escape_scene(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = create_viewer(root/'source')/'public/scene'
            (source/'viewer-settings.json').write_text(json.dumps({'presentation_url':'art.json'}))
            (source/'art.json').write_text(json.dumps({'version':1,'asset_url':'art.glb','landcover_url':'ground.glb','replaces_building_ids':[]}))
            (source/'art.glb').write_bytes(b'authored overlay fixture')
            (source/'ground.glb').write_bytes(b'inferred ground fixture')
            target = create_viewer(root/'target',source)
            self.assertEqual((target/'public/scene/art.glb').read_bytes(), b'authored overlay fixture')
            self.assertEqual((target/'public/scene/ground.glb').read_bytes(), b'inferred ground fixture')
            (source/'art.json').write_text(json.dumps({'version':1,'asset_url':'art.glb','landcover_url':'../escape.glb'}))
            with self.assertRaisesRegex(ValueError, 'inside the scene'):
                create_viewer(root/'unsafe-ground',source)
            self.assertFalse((root/'unsafe-ground').exists())
            (source/'art.json').write_text(json.dumps({'version':1,'asset_url':'../escape.glb'}))
            with self.assertRaisesRegex(ValueError, 'inside the scene'):
                create_viewer(root/'unsafe',source)
            self.assertFalse((root/'unsafe').exists())
            (source/'viewer-settings.json').write_text(json.dumps({'presentation_url':'../escape.json'}))
            with self.assertRaisesRegex(ValueError, 'inside the scene'):
                create_viewer(root/'unsafe',source)

    def test_optional_navigation_assets_are_copied_and_confined(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            source=create_viewer(root/'source')/'public/scene'
            (source/'viewer-settings.json').write_text(json.dumps({'navigation_url':'graph.json','activity_url':'life.json'}))
            for name in ['graph.json','life.json']:(source/name).write_text('{"version":1}')
            target=create_viewer(root/'target',source)
            for name in ['graph.json','life.json']:self.assertEqual((target/'public/scene'/name).read_text(),'{"version":1}')
            (source/'viewer-settings.json').write_text(json.dumps({'navigation_url':'../escape.json'}))
            with self.assertRaisesRegex(ValueError,'inside the scene'):create_viewer(root/'unsafe',source)
            self.assertFalse((root/'unsafe').exists())
