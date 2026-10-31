# SPDX-License-Identifier: Apache-2.0
"""Audit a downstream reference-image register, without fetching external data.

This verifies recorded decisions and bytes, not the truth of a copyright claim.
Run: python scripts/check-reference-media.py --root /path/to/downstream
"""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit

IMAGE_SUFFIXES = {'.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.svg', '.avif', '.gif', '.bmp', '.ico'}
DEFAULT_LICENSES = {'CC-BY-4.0', 'CC0-1.0', 'LicenseRef-PD-self'}


def audit(root, directory='data/reference-images'):
    root = Path(root).resolve()
    media = (root / directory).resolve()
    if not media.is_relative_to(root):
        raise ValueError('Reference directory escapes project')
    register = json.loads((media / 'manifest.json').read_text(encoding='utf-8'))
    if register.get('version') != 1:
        raise ValueError('Unsupported reference register version')
    seen_ids, paths = set(), set()
    total = 0
    for item in register['images']:
        if item['id'] in seen_ids:
            raise ValueError('Duplicate image ID: ' + item['id'])
        seen_ids.add(item['id'])
        raw = item['file']
        path = (media / raw).resolve()
        if Path(raw).is_absolute() or '\\' in raw or not path.is_relative_to(media):
            raise ValueError('Image path escapes reference directory')
        if path in paths:
            raise ValueError('Duplicate image path: ' + raw)
        paths.add(path)
        if path.suffix.lower() not in IMAGE_SUFFIXES or not path.is_file():
            raise ValueError('Missing or unsupported image: ' + raw)
        if item.get('review_status') != 'approved':
            raise ValueError('Image lacks source review: ' + item['id'])
        if item.get('license') not in DEFAULT_LICENSES:
            raise ValueError('License outside the default project policy: ' + item['id'])
        for key in ['author', 'attribution', 'modifications', 'license_evidence']:
            if not isinstance(item.get(key), str) or not item[key].strip():
                raise ValueError('Missing ' + key + ': ' + item['id'])
        for key in ['source_page', 'license_url']:
            url = urlsplit(item[key])
            if url.scheme != 'https' or not url.netloc:
                raise ValueError('Invalid source/license URL: ' + item['id'])
        if not item.get('used_by') or not item.get('purpose'):
            raise ValueError('Image has no documented use: ' + item['id'])
        if item.get('captured_at') is None and not item.get('date_note'):
            raise ValueError('Unknown capture date needs a note: ' + item['id'])
        data = path.read_bytes()
        if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
            raise ValueError('Image checksum/size mismatch: ' + item['id'])
        if item.get('existing_copy'):
            original = (root / item['existing_copy']).resolve()
            if not original.is_relative_to(root):
                raise ValueError('Existing-copy path escapes project: ' + item['id'])
            if not original.is_file() or original.read_bytes() != data:
                raise ValueError('Existing-copy bytes differ: ' + item['id'])
        total += len(data)
    present = {p.resolve() for p in media.rglob('*') if p.suffix.lower() in IMAGE_SUFFIXES}
    if present != paths:
        raise ValueError('Unregistered image files: ' + ', '.join(str(p) for p in present-paths))
    return {'images': len(paths), 'bytes': total, 'licenses': sorted({i['license'] for i in register['images']})}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default='.')
    parser.add_argument('--directory', default='data/reference-images')
    args = parser.parse_args()
    print(json.dumps(audit(args.root, args.directory), indent=2))
