# SPDX-License-Identifier: Apache-2.0
import argparse
import json
from pathlib import Path
import shutil
import struct
import subprocess

import jsonschema

from .io import fetch_source, sha256, write_json
from .reconstruct import reconstruct


def validate_glb(path, expected_buildings):
    with Path(path).open("rb") as f:
        magic, version, size = struct.unpack("<4sII", f.read(12))
        if magic != b"glTF" or version != 2 or size != Path(path).stat().st_size:
            raise ValueError("Invalid GLB header")
        length, kind = struct.unpack("<II", f.read(8))
        if kind != 0x4E4F534A:
            raise ValueError("Missing GLB JSON chunk")
        gltf = json.loads(f.read(length))
    names = {node.get("name") for node in gltf["nodes"]}
    if "terrain" not in names or not set(expected_buildings).issubset(names):
        raise ValueError("GLB is missing expected terrain/building nodes")
    return {"glb_bytes": size, "meshes": len(gltf.get("meshes", [])), "nodes": len(gltf["nodes"]),
            "asset_copyright": gltf.get('asset', {}).get('copyright')}


def build(args):
    config_path = Path(args.config).resolve()
    config = json.loads(config_path.read_text(encoding="utf-8-sig"))
    schema = json.loads((Path(__file__).parent / "schemas/project.schema.json").read_text())
    jsonschema.validate(config, schema)
    root = Path(args.workspace).resolve()
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    cache = root / "data/raw"
    print("Verifying input source checksums", flush=True)
    paths = [fetch_source(s, cache) for s in config["sources"]]
    print("Reconstructing georeferenced terrain and roof candidates", flush=True)
    bundle = reconstruct(config, paths, output)
    if config.get('annotations_file'):
        from .annotations import annotate
        catalog_path = (config_path.parent / config['annotations_file']).resolve()
        catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
        annotation_schema = json.loads((Path(__file__).parent / 'schemas/annotations.schema.json').read_text())
        jsonschema.validate(catalog, annotation_schema)
        annotate(bundle, catalog)
        bundle['annotations']['catalog_sha256'] = sha256(catalog_path)
    if config.get('corridors_file'):
        from .corridors import add_corridors
        catalog_path = (config_path.parent / config['corridors_file']).resolve()
        catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
        corridor_schema = json.loads((Path(__file__).parent / 'schemas/corridors.schema.json').read_text())
        jsonschema.validate(catalog, corridor_schema)
        print('Draping road/path corridors onto terrain', flush=True)
        add_corridors(bundle, catalog)
        bundle['corridors']['catalog_sha256'] = sha256(catalog_path)
    write_json(output / 'reconstruction.json', bundle)
    write_json(output / 'quality.json', bundle['quality'])
    write_json(output / 'sources.json', {'sources': bundle['sources'],
                                       'corridor_sources': bundle.get('corridors', {}).get('sources', []),
                                       'coordinate_frame': bundle['coordinate_frame']})
    print(json.dumps(bundle["quality"], indent=2), flush=True)
    script = Path(__file__).parent / "blender_export.py"
    blender = Path(args.blender).resolve()
    if not blender.is_file():
        raise FileNotFoundError(f"Blender executable not found: {blender}")
    with (output / "blender.log").open("w", encoding="utf-8") as log:
        result = subprocess.run([str(blender), "--background", "--factory-startup", "--python-exit-code", "1",
                                 "--python", str(script), "--", str(output / "reconstruction.json"), str(output)],
                                stdout=log, stderr=subprocess.STDOUT, text=True)
    if result.returncode:
        raise RuntimeError(f"Blender failed; inspect {output / 'blender.log'}")
    validation = validate_glb(output / "campus.glb", [b["id"] for b in bundle["buildings"]] +
                              bundle.get('corridors', {}).get('surface_nodes', []))
    manifest = {
        "schema_version": 1, "project_id": config["project_id"], "title": config["title"],
        "status": "historical-whitebox", "aoi_size_m": bundle["aoi_size_m"],
        "coordinate_frame": bundle["coordinate_frame"], "pipeline": bundle["pipeline"],
        "configuration_sha256": bundle["configuration_sha256"],
        "source_dates": [s["acquisition_date"] for s in config["sources"]],
        "source_ids": [s["id"] for s in config["sources"]],
        "spawn_enu_m": config.get("spawn_enu_m", [0, 0]),
        "model": {"url": "campus.glb", "sha256": sha256(output / "campus.glb"), **validation},
        "heightfield_url": "heightfield.json", "sources_url": "sources.json", "quality": bundle["quality"],
        "buildings": bundle["buildings"], "annotations": bundle.get('annotations'),
        "corridors": bundle.get('corridors'), "limitations": [
            "Historical airborne LiDAR, not a current campus survey.",
            "Buildings are heuristic placeholders; no authoritative footprint or facade claims.",
            "No independent control-point accuracy validation yet."
        ]
    }
    if config.get('asset_license'):
        manifest['asset_license'] = config['asset_license']
    manifest_schema = json.loads((Path(__file__).parent / "schemas/scene.schema.json").read_text())
    jsonschema.validate(manifest, manifest_schema)
    write_json(output / "manifest.json", manifest)
    if args.web_public:
        destination = Path(args.web_public).resolve()
        destination.mkdir(parents=True, exist_ok=True)
        for name in ["campus.glb", "manifest.json", "heightfield.json", "sources.json"]:
            shutil.copy2(output / name, destination / name)
    print(f"Completed: {output / 'scene.blend'} and {output / 'campus.glb'}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Engine-independent geospatial reconstruction")
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser("build", help="Verified LAZ → terrain/roof candidates → Blender → GLB")
    run.add_argument("--config", required=True)
    run.add_argument("--workspace", default=".")
    run.add_argument("--output", required=True)
    run.add_argument("--blender", required=True)
    run.add_argument("--web-public", help="Optional downstream scene directory for browser deliverables")
    viewer = sub.add_parser('init-viewer', help='Create a standalone Three.js explorer with a synthetic demo or an exported scene')
    viewer.add_argument('--output', required=True)
    viewer.add_argument('--scene-dir', help='Optional directory containing a schema-v1 manifest, GLB and heightfield')
    sync = sub.add_parser('sync-viewer', help='Upgrade shared viewer files while preserving project content and checking local changes')
    sync.add_argument('--output', required=True)
    sync.add_argument('--adopt', action='store_true', help='Deliberately adopt the template in a project without a prior viewer lock')
    args = parser.parse_args()
    if args.command == 'init-viewer':
        from .scaffold import create_viewer
        path = create_viewer(args.output, args.scene_dir)
        print(f'Created viewer: {path}\nRun npm ci and npm run dev in that directory.')
    elif args.command == 'sync-viewer':
        from .scaffold import sync_viewer
        print(f'Updated viewer runtime: {sync_viewer(args.output, args.adopt)}')
    else:
        build(args)
