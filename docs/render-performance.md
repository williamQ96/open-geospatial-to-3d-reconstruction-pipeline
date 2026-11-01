# Stable depth and quality-preserving performance assessment

**English** | [简体中文](zh-CN/render-performance.md)

Measure a warmed scene with a repeatable camera/input path before changing quality. Record source hashes, viewport, pixel ratio, antialiasing, population, renderer/backend, sample counts, frame intervals and separate CPU/GPU timings. Compare native operation and synthetic stress separately. A faster subsystem is not the same as a proportional FPS gain, particularly at the refresh cap. Headless Chrome, an embedded webview and a physical phone can have different bottlenecks.

## Diagnose depth fighting separately

Keep geometry, materials, light and camera pose fixed; vary only the near plane to identify distant near-coplanar conflicts. A tiny walking near plane is usually inappropriate for a kilometre-scale Overview. Use a conservative static-map bounds distance, padded for actors, to raise the near plane only in empty space. Quantize downward to avoid unnecessary projection updates. Retain the small near plane for walking and inside the bounds. Do not include camera-centered sky in the map bounds or freeze dynamic actors. Validate the padding when adding taller/flying experiments.

The template's metre-scale defaults use 8 m padding, one tenth of bounds clearance, an upper limit of 64 m, and 0.08 m for close exploration. FOV, perspective and far coverage are retained. Check common views and close-up transitions, not just a single aerial screenshot. Changing depth precision does not require rewriting source building heights or simplifying roofs.

The [PerspectiveCamera contract](https://threejs.org/docs/pages/PerspectiveCamera.html) defines the projection controls. The [renderer options](https://threejs.org/docs/pages/WebGLRenderer.html#Options) document logarithmic depth's early-fragment-test cost and reversed-depth extension requirements; do not enable a different depth backend without device and custom-shader validation.

## Remove redundant work without reducing content

- World-anchored CSS labels can use a separate small scene. Keep anchors, projection, selection, pinning and update frequency; avoid traversing buildings and animated bones again through the CSS renderer.
- Finalize the static map transforms once. Freeze only a declared static root, after updating world matrices; leave animated/skinned roots and separately maintained actors alone. Test raycast, selection, camera obstruction and material switching. [Object3D matrix-update contracts](https://threejs.org/docs/pages/Object3D.html) define the responsibility when auto updates are disabled.
- Cache a minimap's raster output until its exact displayed inputs change. Normalize empty routes, invalidate player/heading/target/route changes and route clearing. Current route arrays are immutable snapshots; replace a route when editing it. Do not reduce its update rate while walking.
- Avoid replacing unchanged HUD text. Retain source geometry, normal/color attributes, resolution, antialiasing, lighting and populations while comparing performance.

Inspect existing optimizations first. For example, static shadows may already have `autoUpdate=false`; counting that as a new improvement gives misleading conclusions. Exclude shader compilation, initial uploads and initial shadow rendering from steady-state comparisons. Use GPU timer results only when supported and non-disjoint; CPU-throttled command-queue timing is not a device GPU benchmark.

## Experimental static haze cache

`viewer-settings.json` can opt into `cache_static_haze: true`; the default is off. After final static placement, `contextFog.bakeMesh` stores the same world-space per-vertex field as one float attribute, retains interpolation and strength/tint controls, and chains existing PBR/toon/grain hooks. Different transforms sharing geometry receive independent fields; skinned, instanced and morph inputs are excluded. Moving the layer requires recalculating its field; never call this as a substitute for dynamic scene handling.

Compare cached and dynamic paths at the same camera, clipping, material and fixed simulation pose. Validate pixel differences as well as vertex/triangle counts. Account for one float per cached vertex on both CPU and GPU and the additional load-time computation. Consumer trials produced negligible image differences but small, inconsistent GPU gains at measurable memory cost; therefore caching was not adopted as a default optimization. Re-evaluate on the actual target device before opting in.

## Evidence and ownership

Retain exact raw summaries and source hashes downstream; keep large local traces outside public asset archives. Test-only source injection can expose inspection references to isolated benchmark pages without adding a public runtime debugging API or changing visitor analytics. Distinguish proposed optimizations, measured subsystem gains and delivered defaults.

Potential later work includes material-compatible batching with stable picking IDs, spatial query indexes and exact-geometry tiling for frustum culling. Each may trade CPU work, draw count and memory. Model simplification, dynamic resolution and population reduction change the quality budget and require a separate decision. Record reusable methods here; project-specific performance reports and development logs stay downstream.
