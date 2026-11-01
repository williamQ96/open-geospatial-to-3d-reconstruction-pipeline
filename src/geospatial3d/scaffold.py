# SPDX-License-Identifier: Apache-2.0
"""Create an independent browser project from the packaged, data-neutral template."""
import json
from pathlib import Path
import shutil

from . import __version__
from .io import revision, sha256, write_json


def template_root():
    return Path(__file__).parent / 'templates/browser-explorer'


def managed_files():
    source = template_root()
    candidates = list((source/'src').rglob('*')) + [source/'index.html',source/'vite.config.js']
    return {p.relative_to(source).as_posix(): p for p in candidates if p.is_file()}


def write_lock(destination):
    write_json(destination / 'viewer-template.lock.json', {
        'repository': 'https://github.com/williamQ96/open-geospatial-to-3d-reconstruction-pipeline',
        'template': 'src/geospatial3d/templates/browser-explorer',
        'pipeline_version': __version__, **revision(),
        'files': {name: sha256(path) for name, path in sorted(managed_files().items())},
    })


def sync_viewer(output, adopt=False):
    """Upgrade only shared runtime files; preserve profiles, scenes and hosting."""
    destination = Path(output).resolve()
    lock_path = destination / 'viewer-template.lock.json'
    previous = json.loads(lock_path.read_text()) if lock_path.is_file() else None
    if not previous and not adopt:
        raise ValueError('No viewer-template.lock.json. Use --adopt for a deliberate first adoption.')
    old_files = previous.get('files', {}) if previous else {}
    for name, digest in old_files.items():
        path = (destination / name).resolve()
        if not path.is_relative_to(destination) or not (name.startswith('src/') or name in ['index.html','vite.config.js']):
            raise ValueError('Invalid managed template path')
        if not path.is_file() or sha256(path) != digest:
            raise ValueError(f'Local template change: {name}. Preserve or merge it before upgrading.')
    current = managed_files()
    for name in set(old_files)-set(current):
        (destination / name).unlink()
    for name, source in current.items():
        target = (destination / name).resolve()
        if not target.is_relative_to(destination):
            raise ValueError('Template destination escapes project directory')
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(source,target)
    write_lock(destination)
    return destination


def create_viewer(output, scene_dir=None):
    destination = Path(output).resolve()
    if destination.exists() and (not destination.is_dir() or any(destination.iterdir())):
        raise ValueError('Viewer destination must be absent or empty; existing work will not be overwritten.')
    source = template_root()
    assets = []
    if scene_dir:
        scene = Path(scene_dir).resolve()
        manifest = json.loads((scene / 'manifest.json').read_text(encoding='utf-8-sig'))
        if manifest.get('schema_version') != 1:
            raise ValueError('Unsupported scene schema version')
        names = ['manifest.json', manifest['model']['url'], manifest['heightfield_url']]
        if manifest.get('sources_url'):
            names.append(manifest['sources_url'])
        if (scene / 'viewer-settings.json').is_file():
            names.append('viewer-settings.json')
            settings = json.loads((scene/'viewer-settings.json').read_text(encoding='utf-8-sig'))
            for key in ['navigation_url','activity_url']:
                if settings.get(key):names.append(settings[key])
            presentation_name = settings.get('presentation_url')
            if presentation_name:
                presentation_path = (scene/presentation_name).resolve()
                if not presentation_path.is_relative_to(scene) or ':' in presentation_name or Path(presentation_name).is_absolute():
                    raise ValueError('Presentation paths must stay inside the scene directory.')
                presentation = json.loads(presentation_path.read_text(encoding='utf-8-sig'))
                if presentation.get('version') != 1:
                    raise ValueError('Unsupported presentation contract')
                names.extend([presentation_name, presentation['asset_url']])
                if presentation.get('landcover_url'):
                    names.append(presentation['landcover_url'])
        for name in names:
            path = (scene / name).resolve()
            if Path(name).is_absolute() or ':' in name or not path.is_relative_to(scene):
                raise ValueError('Scene asset paths must stay inside the scene directory.')
            if not path.is_file():
                raise FileNotFoundError(path)
            assets.append((path, name))
    shutil.copytree(source, destination, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns('node_modules', 'dist', 'test-results', 'playwright-report', '__pycache__'))
    for path, name in assets:
        target = destination / 'public/scene' / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
    write_lock(destination)
    return destination
