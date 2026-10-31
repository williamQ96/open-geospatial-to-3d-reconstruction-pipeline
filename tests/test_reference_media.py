# SPDX-License-Identifier: Apache-2.0
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('reference_checker', Path(__file__).parents[1]/'scripts/check-reference-media.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class ReferenceMediaTests(unittest.TestCase):
    def fixture(self, root):
        folder = root/'data/reference-images'
        folder.mkdir(parents=True)
        payload = b'fixture bytes; image decoding is outside this metadata audit'
        (folder/'example.jpg').write_bytes(payload)
        image = {'id':'photo','file':'example.jpg','author':'Example photographer','attribution':'Example — CC BY 4.0',
                 'license':'CC-BY-4.0','license_url':'https://creativecommons.org/licenses/by/4.0/',
                 'source_page':'https://example.org/photo','review_status':'approved',
                 'license_evidence':'Author explicitly states license on source page',
                 'used_by':['building-1'],'purpose':['facade reference'],'modifications':'none',
                 'captured_at':None,'date_note':'Capture date not provided',
                 'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest()}
        manifest = {'version':1,'images':[image]}
        return folder, manifest

    def test_complete_register_and_corruption_detection(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);folder,m=self.fixture(root)
            (folder/'manifest.json').write_text(json.dumps(m))
            self.assertEqual(checker.audit(root)['images'],1)
            (folder/'example.jpg').write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError,'checksum'):
                checker.audit(root)

    def test_unregistered_image_and_unsupported_rights_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);folder,m=self.fixture(root)
            (folder/'manifest.json').write_text(json.dumps(m))
            (folder/'unrecorded.png').write_bytes(b'not registered')
            with self.assertRaisesRegex(ValueError,'Unregistered'):
                checker.audit(root)
            (folder/'unrecorded.png').unlink()
            m['images'][0]['license']='CC-BY-NC-4.0'
            (folder/'manifest.json').write_text(json.dumps(m))
            with self.assertRaisesRegex(ValueError,'License outside'):
                checker.audit(root)

    def test_path_escape_and_missing_attribution_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);folder,m=self.fixture(root)
            m['images'][0]['file']='../../../outside.jpg'
            (folder/'manifest.json').write_text(json.dumps(m))
            with self.assertRaisesRegex(ValueError,'escapes'):
                checker.audit(root)
            m['images'][0]['file']='example.jpg';m['images'][0]['attribution']=''
            (folder/'manifest.json').write_text(json.dumps(m))
            with self.assertRaisesRegex(ValueError,'attribution'):
                checker.audit(root)

    def test_existing_runtime_copy_must_match_and_stay_in_project(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);folder,m=self.fixture(root)
            original=root/'runtime.jpg'
            original.write_bytes((folder/'example.jpg').read_bytes())
            m['images'][0]['existing_copy']='runtime.jpg'
            (folder/'manifest.json').write_text(json.dumps(m))
            self.assertEqual(checker.audit(root)['images'],1)
            original.write_bytes(b'changed runtime image')
            with self.assertRaisesRegex(ValueError,'Existing-copy bytes differ'):
                checker.audit(root)
            m['images'][0]['existing_copy']='../outside.jpg'
            (folder/'manifest.json').write_text(json.dumps(m))
            with self.assertRaisesRegex(ValueError,'Existing-copy path escapes'):
                checker.audit(root)
