# Recommended scene hierarchy: focus, campus and background

**English** | [简体中文](zh-CN/scene-hierarchy.md)

**Recommended production standard:** spend reference, modeling and maintenance effort where a scene communicates identity. Keep secondary surroundings present and geographically anchored, but use a smaller open low-poly vocabulary, seeded appearance variation and restrained haze to make their supporting role clear. This complements the recommended Architectural Toon Realism style; authors can choose other styles and tier boundaries.

| Tier | Modeling effort | Geographic requirement |
| --- | --- | --- |
| Main landmarks | Extract recognizable silhouette, repeated facade bays, entrance/cornice/roof patterns from archived original photos; author a compact editable grammar | Retain verified placement and distinguish observed features from inferred dimensions/hidden sides |
| Main-scene context | Reuse compatible roofs, openings, material families and landscape modules; prioritize legibility over unique textures | Preserve IDs, footprints, height evidence, street/block layout and source dates |
| Background | Use original procedural components or verified open low-poly assets, fewer openings, a narrower palette, spatial haze/desaturation and runtime batching | **Randomize appearance, never the geographic plan**; anchor/rotate/fit components to existing envelopes without moving buildings or roads |

A background is a supporting scene, not disposable geography. A plausible house/office/warehouse type does not identify the real building. Preserve the source envelope and stable identity even when its appearance is inexpensive. Seed variation from stable IDs rather than list order; regenerating one tile must not reshuffle the rest. A priority polygon defines art effort, not legal property or access.

## Open asset and photo workflow

Archive each adopted image and external asset, including author, exact license/version, source URL, original files, acquisition/capture dates when known, edits and checksums. Prefer CC0 or compatible attribution-licensed assets that allow redistribution, modification and export; keep third-party terms and notices separate. Original procedural geometry is a useful fast alternative when external models are unavailable or a bespoke palette is cheaper.

Read photos for **architectural grammar**: bay spacing, sash proportions, pediments, cornices, arches, awnings, dormers, material divisions and roof rhythm. Turn these into a few parameterized components and flat/vertex colors. The model need not be a photographic replica or texture projection. Record guessed orientations, counts and occluded elevations; refine them over time. Use only approved archived inputs for adopted visual evidence.

When using generic building assets, treat the source geographic envelope as authoritative: position the asset at that envelope, align its principal axis, and fit or clip the generic body to the footprint. Reusable facade/roof components are often safer than relocating a complete prefab. Do not let a random asset cover a known road, alter a block, or silently replace a hand-refined canonical landmark.

## Implemented reusable pieces

- [`context_appearance.appearance_plan`](../src/geospatial3d/context_appearance.py): deterministic per-ID type/palette/roof choices with protected IDs, separate campus/background budgets and **unchanged footprint, base, roof-height and identity records**. Types are illustrative rather than inferred uses.
- `pitched_roof_faces`: split two sloped roof planes along the footprint's principal direction and clip them to the exact polygon; do not replace irregular footprints with a free-floating bounding box.
- Browser `context-building-batch` nodes: each runtime mesh carries `asset_ids`. The presentation loader validates those IDs and permits batched anonymous geometry alongside independently selected named assets. **Authoring granularity and runtime granularity should be independent:** keep individual building objects in Blender and merge copies only for delivery.
- Browser `context-fog.js`: fixed-world priority polygon, exterior transition distance, tint, desaturation and strength. Evaluate the mask at vertices and interpolate the haze, avoiding a blur render pass. Interior vertices receive zero context haze. It stays attached to the region across camera movement, supports PBR/toon materials and a display switch, and is not baked into the only exported asset.
- Optional `heightfield_offset_m` metadata on exactly terrain-draped landscape surfaces: reuse the terrain field with a small conservative clearance for route/NPC display heights instead of raycasting every large lawn triangle. Raised/unverified surfaces keep ordinary ray sampling. This is an optimization for decorative placement, not new navigation/access evidence.
- `io.text_sha256`: keep a raw build-byte hash and add an explicit UTF-8/BOM-free/LF companion digest for text inputs that may pass through Git line-ending conversion. Binary images/models always use exact byte hashes; never relabel historical source hashes.

```python
from geospatial3d.context_appearance import appearance_plan
plan = appearance_plan(buildings, focus_polygon_enu_m,
                       seed=613, protected_ids=hand_authored_ids)
# Feed the unchanged per-ID envelopes and appearance parameters to your Blender consumer.
```

The first downstream implementation is [Open Campus: UO](https://github.com/williamQ96/open-campus-uo/blob/main/docs/campus-expansion.md). Its actual photos, campus boundary choices, geometry and development history remain downstream. This is one implemented case, not a benchmark across cities or a validated automatic architectural classifier.

## Acceptance and correction

Verify unchanged geographic coordinates/IDs/envelopes and the road/terrain baseline, deterministic seeds, roof containment, per-file rights, no unapproved embedded imagery, and editable source plus GLB. Exercise all three camera modes, search/labels, minimap, mobile control, navigation, activity/clean switches, and both standard and styled materials. Compare haze enabled/disabled and inspect the priority transition at walking and Overview distances.

Measure download size, draw calls, memory and device-specific frame time; a toon ramp or haze is not automatically faster. Use lower component/window budgets for supporting scenes, batch delivery geometry, share materials, and add LOD/tiling when evidence calls for it. Cheap secondary assets still require source records and correction paths. Do not hide missing geographic planning behind fog.

Keep the main/background distinction editable. If a background block becomes a main destination, promote that block, gather permitted photos and replace inferred appearance while retaining its identity and geography. Other styles and alternative tier implementations are encouraged.
