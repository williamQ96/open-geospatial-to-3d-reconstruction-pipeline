**English** | [简体中文](zh-CN/presentation-layers.md)

# Authored presentation layers

Version 0.5 separates measured/historical reconstruction from optional, independently editable art. The first consumer is the [UO visual pilot](https://github.com/williamQ96/open-campus-uo/blob/main/docs/visual-pilot.md). The template still starts with a whitebox synthetic scene; no UO models, photographs or coordinates are bundled.

## Contract

`public/scene/viewer-settings.json` can declare `presentation_url`, relative to the scene directory. The version-1 JSON contains:

- `asset_url`: standard-material GLB in the same scene directory.
- `replaces_building_ids`: explicit IDs from the base manifest; every ID must have authored geometry.
- Optional `landmark_building_ids`: photo-informed landmarks, distinguished in selection text from generically styled envelopes.
- Optional `overview`: `target` and `offset` in glTF coordinates (east, up, south).
- Optional `lighting`: background, sky/ground and sun colors, ambient/sun intensity and target.
- Optional `stats`, source hashes, credit and status for auditing/documentation.

Authored GLB nodes have `asset_kind: building` and `asset_id` extras. Landscape uses `landscape-surface` or `landscape-detail`. Building metadata on a multi-primitive parent is inherited by child meshes. The loader validates all replacement IDs, rejects missing geometry and keeps local asset references inside the scene directory. A selected multi-part building highlights all of its materials independently from other buildings.

Only the explicitly replaced base render nodes are removed. The base manifest, terrain, stable IDs, labels, search, walking footprints and provenance remain intact. Camera rays use the displayed building meshes. An authored visual layer does not add navigation for stairs/furniture or silently change measurement status. Keep real source facts and illustrative placement clearly distinguished.

## Materials and rendering

The GLB carries ordinary PBR materials. The browser adapter offers MeshToonMaterial with a three-sample gradient and an English Settings toggle back to the original materials. Both modes preserve wireframe and selection. This is an appearance adapter, not cross-engine shader parity. The pilot uses semantic/material batching and architectural trim rather than full-screen decorative outlines. Ground layers use polygon offset to prevent distant depth conflict with the original terrain.

Walking views show nearby general labels; a selected target remains prioritized regardless of distance. All three camera modes and existing movement/search/minimap behavior remain shared. No optional layer means the existing default behavior remains available.

`init-viewer --scene-dir` copies a referenced presentation JSON and GLB after validating local paths. `sync-viewer` upgrades the managed runtime and preserves the downstream art/data. Asset generation and runtime locks stay separate; a viewer upgrade never relabels older geometry as newly reconstructed. Preserve manually refined assets before running a procedural downstream art generator.

## Validation and cost

Unit tests cover path confinement, inherited multi-primitive IDs, independent highlighting, PBR/toon switching and missing replacement geometry. Python tests cover optional scaffold copying and path escape rejection. The unchanged synthetic scene continues through browser integration tests; the UO consumer tests its actual authored GLB, three landmark searches, modes, material toggle and disclosure.

Source hashes, screenshot evidence and device-specific timings belong with the downstream release. The first UO pilot adds approximately 7.9 MB with no photo textures, and its initial software-renderer review observed 43–124 draw calls. These are a case study, not universal budgets or a hardware FPS claim. Full terrain chunking/LOD, instanced foliage, compression and expanded device testing remain future optimization work. The original reconstruction terrain is still one large draw; avoid claiming that a toon material alone solves rendering cost.

The [style library](../style/README.md) continues to recommend Architectural Toon Realism and welcomes alternative styles. This contract supports independently authored geometry/materials without requiring any map to adopt the UO art direction.
