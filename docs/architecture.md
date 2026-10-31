**English** | [简体中文](zh-CN/architecture.md)

# Architecture and interchange contracts

## Implemented components

`cli.py` drives validated reconstruction, Blender export, GLB checks and viewer scaffolding. `io.py` handles fixed-hash caching and revision evidence. `reconstruct.py` interpolates ground and detects conservative roofs. `annotations.py` matches independent semantic anchors and approximate envelopes. `corridors.py` creates terrain-conforming road/path surfaces. `blender_export.py` writes metre-based ENU Blender scenes and Y-up GLB. `scaffold.py` creates and safely synchronizes the reusable browser template.

## Data pipeline

| Stage | Responsibility | Output |
| --- | --- | --- |
| Source registration | Product IDs, hashes, dates, terms and verification | Source ledger |
| Spatial normalization | AOI, explicit CRS/datum/units and local origin | Coordinate frame |
| Terrain | Reliable ground grid and internal interpolation checks | Mesh and heightfield |
| Buildings | Conservative roof mask, contours, heights and explicit approximations | Independent candidates |
| Corridors | Estimated widths, union/exclusion, terrain-triangle clipping | Road/path meshes |
| Blender | Separate editable objects, normals, materials, metadata | `.blend` |
| Exchange | GLB, sources, schema-v1 manifest and quality | Engine-neutral bundle |
| Viewer | Configurable interaction template and local project content | Independent static app |

Input point clouds must have the declared matching metric horizontal and vertical CRS. AOI-center projection does not silently reproject or mix vertical datums. Airborne roofs do not reconstruct complete facades; canopy errors, missing walls and estimated heights retain quality status.

## Coordinates and schema v1

Blender uses local X east, Y north, Z up. glTF uses X east, Y up, Z south. Convert once in the exporter. Heightfield rows ascend north; runtime sampling converts `north=-z` and follows the same SW–NE triangle diagonal.

Sources identify products, URLs, acquisition/access dates, hashes, terms and verification. The frame records CRS, vertical datum, units and origin. Asset records identify geometry, estimated status and provenance. The actual machine-checkable contract is in `src/geospatial3d/schemas/`; LOD, tiles, collision assets and fuller registries remain future extensions.

## Browser boundary

`templates/browser-explorer` is a consumer of exports, not part of geospatial reconstruction. Shared runtime and layout are managed separately from `public/viewer-profile.json`, scene data and hosting identity. A synthetic fixture makes the template runnable without any UO assets. Independent source-hash locks make upgrades reviewable and reject local-code overwrite.

Three.js, Godot, Unity and Unreal consume the same asset contract. Engine-specific interaction adapters remain optional. The shared browser template demonstrates one adapter without making the Python reconstruction depend on a particular deployment.

## Reproducibility

Record source/configuration hashes, actual pipeline revision and dirty state, tool versions, logs, asset checks and validation. Reproducibility means controlled regeneration from verified inputs and parameters; it is not a guarantee that all external tools produce byte-identical files.
