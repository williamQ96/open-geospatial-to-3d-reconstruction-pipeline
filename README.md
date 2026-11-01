**English** | [简体中文](README.zh-CN.md)

# Open Geospatial-to-3D Reconstruction Pipeline

Reusable tools for verified geographic data → editable Blender assets → GLB/glTF and interactive browser explorers.

**v0.7 adds compact phone layouts and dual-touch Follow/First person movement/look controls.** [Phone behavior](docs/viewer-template.md#phone-controls). v0.6 added reusable modular facade poses and aerial vegetation cues, with a [recognizable-first, progressively corrected modeling policy](docs/progressive-modeling.md). The v0.5 authored presentation layers and v0.4 explorer interactions remain available. See [presentation methodology](docs/presentation-layers.md). The reconstruction exchange remains schema v1. This upstream repository and the [Open Campus: UO](https://github.com/williamQ96/open-campus-uo) downstream and its [live explorer](https://williamq96.github.io/open-campus-uo/) are public.

[Methodology update log](METHODOLOGY_LOG.md) records reusable changes; project-specific development logs stay downstream.

Recommended [scene hierarchy](docs/scene-hierarchy.md): photo-derived grammar for main landmarks, reusable main-scene components, and inexpensive open low-poly or seeded procedural background appearance with spatial haze. Preserve building coordinates, footprints, IDs, streets and blocks; randomize appearance only. Editable building objects and runtime batches are independent.

## Start with the browser template

```powershell
python -m geospatial3d init-viewer --output ../my-explorer
cd ../my-explorer
npm ci
npm run dev
```

The generated project includes a small synthetic scene, with no UO coordinates, buildings, logo or hosting identity. It provides Follow, First person, Overview, terrain walking/collision, jump, wheel zoom, building search, 45° framing, camera-facing labels, minimap, selection and Settings / About.

To consume a verified export instead:

```powershell
python -m geospatial3d init-viewer --output ../my-explorer --scene-dir /path/to/export
```

Customize `public/viewer-profile.json`, `public/scene/viewer-settings.json` and scene assets. A separate template lock records shared source hashes and upstream revision. `sync-viewer --output ../my-explorer` upgrades shared files only and refuses to overwrite modified managed code. See the [template](src/geospatial3d/templates/browser-explorer/README.md) and [methodology](docs/viewer-template.md).

## Reconstruction capabilities

- Verify LAZ hashes and declared matching horizontal/vertical CRS; crop a configurable AOI.
- Generate class-2 ground terrain with internal holdout checks and conservative roof candidates.
- Combine multiple source tiles with compact local float32 point storage.
- Attach independent names/anchors and explicit approximate envelopes, retaining source status.
- Drape optional road/path centerlines onto exact terrain triangles, with estimated widths, junction unions and building exclusion.
- Save editable independent Blender objects, correct normals, materials, stable IDs and metadata; export Y-up GLB plus heightfield, source records, quality and schema-v1 manifest.
- Provide an independently usable browser consumer with synthetic-fixture integration tests.

Roads do not imply surveyed pavement, bridge decks, routing or legal access. Candidate roofs are placeholders, not authoritative facades or footprints. Cross-CRS point-cloud reprojection, photogrammetry, full facade reconstruction, LOD and streaming remain future work.

## Install and test

```powershell
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.lock.txt
./.venv/Scripts/python.exe -m pip install --no-deps -e .
./.venv/Scripts/python.exe -m unittest discover -s tests -v
```

Node.js and npm are needed only for the browser template. Blender is needed only for scene reconstruction/export. The template is included in Python package data; scaffolded projects have their own Node dependency lock.

## Reconstruct an area

Prepare Blender 4.5 LTS and a verified project configuration:

```powershell
python -m geospatial3d build --config /path/to/project.json --workspace /path/to/project --output /path/to/export --blender /path/to/blender --web-public /path/to/viewer/public/scene
```

First runs fetch fixed-checksum sources; later runs verify the cache. Output includes `scene.blend`, `campus.glb`, `manifest.json`, `heightfield.json`, `sources.json`, `quality.json` and logs. The first UO tile is about 61 MB; the larger campus uses multiple tiles. Asset-generation revisions remain recorded in outputs; UI-only upgrades do not relabel old geometry as newly reconstructed.

The verified Windows portable Blender 4.5.15 LTS package had SHA-256 `52dd02fd74877fa08e74b67d7854cf32468a232c02aaa19b6844c91285574f8d`. Python versions are pinned in `requirements.lock.txt`.

## Recommended visual style

First passes should be coherent and recognizable; reasonable, documented inference is welcome. Improve fidelity through long-term correction while preserving editable parameters and geographic evidence. The [implemented hybrid methods](docs/progressive-modeling.md) combine geographic envelopes, archived photos, architectural modules and open aerial context without requiring specialist capture equipment or photorealism before release.

The [style library](style/README.md) recommends **Architectural Toon Realism** by default, balancing architectural readability, asset production cost, maintenance and scalable rendering. It includes the original UO-origin concept mockup, exact palette, bilingual design guide and an evaluation plan. Other styles are actively encouraged. The template starts whitebox and now supports opt-in authored GLB / Toon presentation layers. See the [first UO pilot](https://github.com/williamQ96/open-campus-uo/blob/main/docs/visual-pilot.md) and [reusable method](docs/presentation-layers.md).

## Downstream projects

| Project | Map | Source | Live explorer |
| --- | --- | --- | --- |
| **Open Campus: UO** | University of Oregon, main Eugene campus | [Repository](https://github.com/williamQ96/open-campus-uo) | [Open map](https://williamq96.github.io/open-campus-uo/) |

This is the first entry in an expandable [downstream registry](docs/downstream-projects.md). Additional campuses, neighborhoods and other maps can reuse the template while maintaining their own data and refinement goals.

## Maintenance boundary

This long-lived upstream owns transferable methods, automation, schemas, validation and reusable viewer behavior. Downstream projects own specific areas, input choices, identities, models, materials and content. Upgrades must preserve manually refined assets and clearly distinguish measurements from estimates.

Each downstream map should keep a versioned **`data/reference-images/`** archive with the actual adopted photographs/images, source links, authors, licenses, dates, usage and checksums. Prefer sources that permit open redistribution and asset export; avoid restricted or unverified inputs. See the [reference-media policy and automated audit](docs/reference-media.md), with the [UO archive](https://github.com/williamQ96/open-campus-uo/tree/main/data/reference-images) as the first example.

See [maintenance](MAINTENANCE.md), [architecture](docs/architecture.md), [roadmap](docs/roadmap.md), [source decisions](docs/source-discussion.md), [data management](data/README.md), and [viewer methodology](docs/viewer-template.md).

Code and template software use **Apache-2.0**; original documentation and model/design contributions use **CC BY 4.0**. See [licensing and attribution](LICENSING.md) and [NOTICE](NOTICE). Third-party material retains its own terms.

[Traffic and analytics](docs/analytics.md): private repository-history archiving and optional, explicitly configured GoatCounter page/interaction statistics.

## Campus life and outdoor routing

The optional browser extension adds rigged heroes, scripted walkers/bicycles/scooters/road cars, a four-level density slider (default Mid), actor collisions, optional sound/walking feedback and downstream GitHub issue drafts and mode-aware A/B navigation with animated chevrons. [Contracts, reusable graph generation, asset licensing and limitations](docs/campus-life-navigation.md). Local routes, clothing colors and open asset archives stay downstream.

[Recommended: early playable, community refinement loop](docs/iterative-community-modeling.md).
