**English** | [简体中文](implementation.zh-CN.md) · [Style guide](README.md)

# Implementation and evaluation plan

Status: proposed method, not an implemented style renderer. This plan turns the conversation's art direction into independently reviewable stages. No numeric cost saving, FPS claim, material benchmark or engine parity result is implied.

## Separate four layers

1. **Geographic evidence:** coordinates, footprints, terrain, source dates, confidence and stable IDs. Styling cannot upgrade an estimate into a measurement.
2. **Editable assets:** Blender geometry, material slots, architectural components and future detail variants. Preserve manual refinements and their sources.
3. **Interchange:** standard glTF/GLB geometry and PBR material descriptions plus semantic metadata. Retain a valid standard-material fallback; archive the editable source separately.
4. **Renderer theme:** lighting ramps, optional selective outlines, exposure, shadows and view-dependent detail. Version separately from geography and make expensive effects optional.

glTF's core material model is metallic-roughness PBR; an arbitrary custom toon shader is not a portable core material. Three.js offers MeshToonMaterial with a gradient map and OutlinePass for selected-object outlines. Treat each as an adapter to evaluate, not a promise that simply swapping materials reproduces the concept. References: [glTF specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials), [MeshToonMaterial](https://threejs.org/docs/pages/MeshToonMaterial.html), [OutlinePass](https://threejs.org/docs/pages/OutlinePass.html).

## Staged delivery

| Stage | Deliverable | Review gate |
| --- | --- | --- |
| 1. Baseline | Fixed geographic scene, camera poses, current whitebox and standard PBR reference | Record scene/source revision, browser/device, viewport, quality settings and baseline metrics. |
| 2. Environment | Evidence-based ground categories, paths and a small reusable vegetation set | No unverified roads, tree locations or water features inferred from the concept. |
| 3. Material families | Brick, stone, roof, glass and paving variants driven by palette intent | Preserve editable PBR definitions; check identity in all three views. |
| 4. Landmark pilot | A small coherent area with verified entrances, roofs and facade character | Confirm source accuracy and close/medium/aerial readability before campus-wide work. |
| 5. Toon adapter | Soft tone ramp, warm/cool lighting and optional selective outlines | Compare the same scene to PBR; labels, selected target and search stay legible. |
| 6. Scale and release | Distance detail, reusable/instanced assets and optional compression after profiling | Publish measurements and fallback behavior; verify attribution and unchanged object IDs. |

The UO pilot and named landmarks are maintained downstream, not hardcoded into the template. A proposed change to shared runtime belongs upstream only after a data-neutral implementation and validation. Documentation in `style/` is not currently copied by `init-viewer` or `sync-viewer`.

## Production and maintenance cost

Use a limited material library and reusable facade/tree components. Refine landmarks before spending equal effort on every building. Keep high-detail source assets even when the browser uses a lighter export. This is expected to reduce repeated unique work compared with fully bespoke photoreal assets, but surveying, modeling and asset QA remain real costs.

Track author hours per landmark and reusable asset, source-acquisition effort, generated-export size, renderer-specific code and upgrade effort. Keep licenses and hashes with each source. Version palette/material changes separately, retaining the ability to rebuild a previous look without changing geospatial evidence. Other regions can replace vegetation and palette families while reusing the method.

## Browser runtime evaluation

Do not assume toon shading saves GPU time. Dense foliage, transparency, shadows, outline passes and full-screen effects can be expensive. Start with restrained material/lighting changes; add effects one at a time and compare against the same scene and camera poses.

For Follow, First person and Overview, record median and p95 frame time, draw calls, triangles, texture/render-target memory estimates, transferred bytes, cold/warm load time, browser/device/GPU, viewport and quality level. Repeat with search selection and a dense visible area. Define a target device and performance budget before adopting a release preset; no universal budget is claimed here.

Proposed quality levels: **Low** uses simple lighting and no decorative outline/AO passes; **Balanced** adds bounded shadows and selective outlines; **High** can add richer contact shading and vegetation. These levels are proposals, not existing settings. Reduce effects and foliage/detail cost without removing search labels or changing geography. A standard PBR fallback remains useful for comparison and cross-engine delivery.

## Acceptance checklist for a future implementation

- Same geographic revision and stable IDs across themes; unknowns remain explicit.
- All three camera modes, jump, movement, search, selected labels and minimap still work.
- Near entrances and far silhouettes are recognizable; overlays remain readable.
- Benchmark records show device-specific cost and fallback behavior, not just a beauty screenshot.
- Blender sources remain editable and GLB has a standard-material path.
- New artwork, components and datasets have provenance and appropriate attribution.

Alternative styles should be assessed against the same functional and geographic contract. The default recommendation does not exclude more costly or experimental styles when their authors document the tradeoffs.
