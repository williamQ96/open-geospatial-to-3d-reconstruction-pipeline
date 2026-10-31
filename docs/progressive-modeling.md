**English** | [简体中文](zh-CN/progressive-modeling.md)

# Recognizable first, progressively corrected

The first modeling pass should deliver a coherent, recognizable, editable place. **Do not require photorealism or complete survey evidence before publishing a useful first pass.** Reasonable inference is welcome for missing geometry, repeated facade details, roofs, vegetation and materials, provided the assumptions remain explicit and easy to replace. Fidelity and realism improve through long-term correction and maintenance.

This is a production policy, not permission to present generated details as measurements. Keep geographic evidence and appearance separate. Preserve known coordinates, historical dates, object IDs and reconstruction records. Record which features were observed, which were inferred and what evidence would resolve the uncertainty. A style mockup is art direction, not a geographic source.

## Hybrid inputs, without specialist equipment

Use existing verified terrain/LiDAR or explicit geographic envelopes for position and scale; archived photographs for recognizable facade vocabulary; open georeferenced aerial imagery for broad landscape distribution; and simple reusable materials for the chosen style. Actual measurements can replace estimated dimensions later. If no new measurements were taken, say so. A known envelope does not establish the accuracy of every authored detail.

Instead of forcing a sparse or mixed-date photo collection into a dense reconstruction, reconstruct the building's **architectural grammar**: repeated window bays, floor bands, columns, cornices, steps, awnings and entrances. Keep those dimensions/counts in editable parameters. Export clean mesh geometry with standard PBR materials, then apply optional renderer styling. Photography need not become a giant texture atlas for this method to be useful.

Phone photos/video with overlapping, translated views, depth-assisted capture, measured control lengths, photogrammetry or splats are possible later inputs. They have not been implemented or evaluated by this release. Choose them only for a specific uncertainty, check software/model-weight/input rights separately, and record their actual validation. Do not claim a photogrammetric solve, AI geometry inference or field measurement when the work was procedural modeling from references.

## Implemented reusable methods in v0.6

### Modular facade poses

[`geospatial3d.architectural.facade_modules`](../src/geospatial3d/architectural.py) generates data-neutral component positions across facade bays and height levels. It accepts a segment in local ENU metres, bay count, end insets and outward offset, and returns the component center, orientation and bay width. A Blender consumer can instantiate its own window, door or column module at those poses.

```python
from geospatial3d.architectural import facade_modules

# Design parameters, not a claim that any real building was measured.
for bay in facade_modules((20, 0), (0, 0), 5, [3, 7], inset_m=1):
    place_window(bay.east_m, bay.north_m, bay.height_m, bay.yaw_rad)
```

`place_window` is a downstream integration function, not an API supplied here. Local X follows the segment; local -Y is its exterior/right side. Reverse the segment to face the other way. Invalid or degenerate parameters fail rather than invent geometry. The UO consumer uses these poses for tall library windows, a six-column portico and repeated EMU glazing; its actual geometry, feature counts and materials remain downstream.

### Aerial-guided vegetation cues

[`geospatial3d.canopy_cues`](../src/geospatial3d/canopy_cues.py) computes a smoothed dark/textured-green RGB cue, then samples a north-up raster in an explicitly matching coordinate frame. The UO example reads a dated, fixed-raster USDA NAIP subset and applies building/path setbacks, clear lawn areas, a protected spawn sightline and seeded spacing before placing stylized trees.

This is an inspectable placement aid, **not a validated tree detector**. It can confuse grass/shrub shadows and canopy. Tree stems, heights, crown sizes and species remain artistic inference. It does not perform CRS conversion, derive heights from RGB or establish current conditions. Archive the exact input image, bounding box, CRS, resolution, source raster/date, export request and hash. If PNG bytes carry no geotransform, require the accompanying export record; do not infer one from image dimensions.

## First-pass acceptance and correction record

Ship when the area reads coherently at walking and overview distances, important landmarks are recognizable, editable source and GLB are available, source rights are clear, and the existing three views/search/labels/minimap/movement still work. Uncertain details should be plausible and disclosed; they need not block the first release. Record device-specific delivery/rendering cost, without declaring hardware performance from software-renderer timing.

For each asset or feature group, keep source IDs, observed features, inferred dimensions/occluded areas, status/date, editable parameters, and the next useful correction. Prioritize corrections that materially change identity, silhouette, entrance position, scale or navigation before small surface realism. Preserve manual edits before regenerating procedural sources. Do not overwrite geographic evidence or change collision/access claims merely because a visual detail looks convincing.

The first application is [UO v0.7](https://github.com/williamQ96/open-campus-uo/blob/main/docs/visual-refinement-v0.7.md). Synthetic tests cover facade spacing/reversal/validation, cue behavior and north/south sampling; the downstream verifies its real assets and interactions. These checks demonstrate a working first case, not independent surveying accuracy, universal RGB thresholds or broad geographic validation.

See [reference-media intake](reference-media.md), [presentation layers](presentation-layers.md) and [the recommended style](../style/README.md). New maps can reuse the methods while choosing their own architectural modules, vegetation and art direction.
