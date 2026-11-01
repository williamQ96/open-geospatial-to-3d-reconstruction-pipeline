# Methodology update log

**English** | [简体中文](METHODOLOGY_LOG.zh-CN.md)

Record reusable changes to methods, algorithms, contracts, automation and validation here. Include motivation, transferable principles, actual verification and revision/publication status. Keep entries newest first; preserve historical evidence and record corrections separately. Maintain English by default with a consistent Chinese companion.

Project-specific development logs, campus modeling progress, scene inventories and deployment diaries belong only to downstream repositories. Do not mirror downstream development logs here.

## 2026-10-31 — Publication batch: reusable scene hierarchy and community iteration (v0.10.0)

- **Scope:** combine the previously local scene-hierarchy/context-appearance methods, fixed route-origin behavior, ambient density/collision, optional audio/walking feedback and downstream GitHub draft hooks. Package version is 0.10.0; the standalone browser template is 0.2.0.
- **Record ownership:** this repository contains methodology records only. Project development logs, downloaded scene assets, local maps and feedback remain in downstream repositories.
- **Validation:** the preceding batch passed 32 Python unittest cases, 19 JS tests, 4 template browser tests, formatting and production builds, plus downstream integration and provenance checks. Publication checks are recorded separately when they complete; historical local-only entries below retain the state in which the work was verified.
- **Publication:** prepared for the user-authorized GitHub main publication as one implementation batch. Consumers can promote their viewer locks to this clean committed revision after commit, preserving historical reconstruction/art-generation provenance and checking managed-file hashes. Site deployment belongs to the downstream project. This publication entry supersedes the prior local-only constraint; it does not assert an unverified deployment.

## 2026-10-31 — Pending local batch: ambient density and an early-playable feedback loop

- **Recommendation:** establish an interactive whitebox early; use real geographic/photo/depth references plus documented, editable inference for a coherent moderate-fidelity first pass. Iterate from community feedback or proactive developer corrections. A welcoming open project need not wait for exhaustive academic or photoreal reconstruction. Keep source rights, uncertainty and stable geography intact. See [the recommended loop](docs/iterative-community-modeling.md).
- **Reusable interactions:** one native No / Low / Mid / High density slider, default Mid, controls real populations and removes actors, props, simulation and collision bodies at No. Use class-sized horizontal capsules with height intervals, substep player checks, clear spawning and NPC yielding. Optional local wildlife GLB/audio contracts keep content downstream. Approximate yielding can pause in congestion; it is not rigid-body or complete traffic simulation.
- **Walking feedback:** local default-enabled BGM with browser-autoplay/gesture handling and master mute; grounded displacement drives footsteps in both walking modes. Small first-person-only camera sway respects a checkbox and reduced-motion preferences, without changing physical coordinates or route origins. Background tabs pause audio.
- **Community feedback contract:** downstream-configured GitHub native drafts, required content, optional title/location, timestamp/iteration fallback title, retained drafts and popup/long-body fallbacks. The reporter confirms creation on GitHub; never imply success from the map or embed write credentials. Keep feedback content/coordinates out of analytics and explain public issue visibility.
- **Asset delivery lesson:** archive unchanged open inputs and license evidence, simplify only an adaptation, remove unused imported materials/images and reopen the editable source to check dependencies as well as the portable export. Keep source licensing separate from original adaptation contributions.
- **Validation:** 32 Python unittest cases, 19 JS tests, 4 synthetic template browser tests, formatting and production build passed. The consuming project's integration passed 16 JS and 16 browser cases, including four-level body removal/counts, real walking audio, reduced motion, native issue drafts and narrow-phone layout, while retaining existing navigation/mobile interactions. Source/export and media audits also passed downstream. No real issues were created; automated browser results do not constitute physical-device performance measurements.
- **Scope / status:** generic code, English/Chinese guidance and this methodology record are local/uncommitted on base `0361592966089072333ce3bf6eea22772c5d3079`. No push/deployment; consumer locks must retain dirty-state disclosure. Downloaded assets, local route/placement choices, feedback and project development logs remain downstream. See [ambient interaction contracts](docs/ambient-interaction.md).

## 2026-10-31 — Pending local batch: a recommended scene hierarchy

- **Recommendation:** use photo-derived architectural grammar for main landmarks, reusable main-scene components, and inexpensive open low-poly or original procedural appearance for supporting context. **Randomize type/palette/roof choices, not positions, footprints, street/block plans or stable identities.** Keep inferred types distinct from evidence. See [the recommended standard](docs/scene-hierarchy.md), also linked from the style library.
- **Reusable implementation:** stable per-ID appearance seeds and protected canonical IDs; pitched roofs clipped to the original polygon; renderer batches retaining source identity lists; world-region vertex-interpolated haze/desaturation with PBR/toon support; terrain-draped offset metadata to avoid recurring large-surface raycasts. Keep individual editable source buildings and batch only export copies.
- **Provenance lesson:** raw text-byte hashes can differ across Git/OS line endings. Retain the actual build-byte hash and add an explicitly normalized UTF-8/LF digest for portable comparisons; binary originals remain exact and historical hashes are not rewritten.
- **Validation:** 32 Python tests, 15 JS tests and 4 template browser tests passed. Downstream integration passed 12 JS and 13 browser tests, source identity/geometry invariants, approved-media audit, PBR/toon/haze behavior and existing mobile/navigation interactions. Final editable-source/export checks are recorded below when complete. This is a first implemented map case, not a broad architectural classifier or hardware benchmark.
- **Final source/delivery validation:** reopening the Blender source verified an independent object for every geographic building identity; export-only batches retained the complete identity set. Final model-byte and source-invariant audits passed; the downstream's 13 browser tests passed again after the final export. Local shared-runtime/lock hashes match, without claiming a new clean upstream revision.
- **Scope / status:** photos, local geometry, region choices and project development history stay downstream. Only generic code, standards and validation records are kept here. Work remains uncommitted and local on base `0361592966089072333ce3bf6eea22772c5d3079`; no push or deployment. Consumers must preserve the dirty-method disclosure until a clean next-batch revision is committed and synced.

## 2026-10-31 — Pending local batch: separate route origins from live player state

- **Problem:** coupling a rendered route origin to a continuously moving player makes the origin marker and geometry drift, creating visual discomfort.
- **Method:** snapshot the player origin when a walking route starts. Keep route geometry and origin markers stable; update player markers, directional chevrons and arrival detection independently. Re-capture on explicit Start route; reset on Clear/new endpoints. Keep manual Overview origins independent and preserve walking snapshots across view transitions.
- **Validation principle:** UI wording must describe the snapshot. Move beyond the former automatic-reroute threshold, assert unchanged complete route coordinates in both walking views, then verify restart, reset and mode transitions.
- **Verification:** downstream integration's focused activity/navigation browser tests **3 passed**, including >6 m movement in both walking modes without changing route coordinates, plus explicit restart/reset. Additional checks will be recorded when complete.
- **Shared-template checks:** **12 JS tests and 4 browser tests passed**; formatting and production build passed. No Python algorithms changed in this batch.
- **Completed integration checks:** downstream **10 JS tests and all 13 browser tests passed**; formatting/build and local shared-runtime hash consistency passed. Changes remain local and uncommitted; upstream HEAD and tracking revision are unchanged.
- **Status:** local uncommitted changes based on `0361592966089072333ce3bf6eea22772c5d3079`; not pushed or deployed. A consuming viewer lock must disclose `dirty: true` until the next authorized batch commits and syncs a clean revision. Historical asset-generation pins remain independent.
- **Recording policy:** this methodology log records reusable changes only; downstream projects maintain their own development logs.

## 2026-10-31 — Existing baseline: reusable actor and navigation pipeline

Implemented in [`0361592`](https://github.com/williamQ96/open-geospatial-to-3d-reconstruction-pipeline/commit/0361592966089072333ce3bf6eea22772c5d3079); existing evidence remains in [the methodology report](docs/campus-life-navigation.md).

- Node centerline intersections, exclude buffered building interiors and add only unobstructed short inferred connectors. Retain approximate-access and exterior-approach limitations.
- Verify animation bind/rest poses before transferring clips; bake source world-space poses into target-local animation when rigs differ. Preserve licenses, originals, checksums and editable assets.
- Separate optional activity from static props and the clean-map rendering budget. Batch simple geometry and instance directional arrows.

This entry links existing evidence rather than reconstructing earlier development history. The pending entry above supersedes the baseline's live-rerouting behavior.
