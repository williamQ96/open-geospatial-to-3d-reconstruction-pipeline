**English** | [简体中文](zh-CN/viewer-template.md)

# Reusable explorer methodology

The [browser explorer template](../src/geospatial3d/templates/browser-explorer/README.md) promotes the reusable design and interactions originally developed in Open Campus: UO. It contains no UO geometry, building names, coordinates, logo, hosting project ID or credentials.

## Layers

1. **Reconstruction:** verified sources, configuration, coordinate frame, Blender/GLB, heightfield and a schema-v1 scene manifest.
2. **Shared runtime:** three camera modes, 45° overview framing, walking and collision, jump, wheel zoom, search, facing labels, minimap, selection, settings and source display.
3. **Project content:** `public/viewer-profile.json`, scene exports, spawn preferences, original models, branding and deployment identity.

Profiles supply presentation text and links; the runtime creates text nodes and validates URL protocols. Export source metadata supplies dates, provider names and quality, rather than hardcoded campus/provider assumptions. Optional `asset_license` records preserve attribution in the manifest, Blender scene metadata and GLB copyright field.

## Create and upgrade

`init-viewer --output <new-directory>` refuses a non-empty destination and includes a synthetic scene. `--scene-dir <export>` validates referenced asset paths before copying; files cannot escape the scene directory.

`sync-viewer --output <project>` manages only `src/`, `index.html` and `vite.config.js`. Its file-hash lock rejects local shared-code edits or missing managed files before replacing anything. It preserves profiles, geographic data, branding, package settings, hosting identity and credentials. `--adopt` is an explicit first adoption for a project without a lock. Merge deliberate local code edits before an upgrade.

Reconstruction and viewer locks are independent so a UI update never pretends to have regenerated older geometry. Open Campus: UO consumes the shared files and records their upstream revision; campus-specific behavior belongs in its data/profile layer whenever possible.

## Validation

The small synthetic fixture is genuinely runnable: terrain mesh and heightfield agree, named buildings support search, and roads/paths exercise the same rendering contract. Tests verify mode changes, 45° framing, movement/jump, selection, settings and narrow layouts. Python tests check scaffold packaging, empty-destination safety, path escape rejection and upgrade preservation.

The runtime uses the supported Three.js `PCFShadowMap` rather than the removed soft-shadow enum. Routine diagnostic screenshots stay local; CI retains behavior assertions and failure artifacts without spending its entire budget on software-GPU readback. Software-renderer timings are not hardware performance claims.

## Extension rules

Add other places through the [downstream registry](downstream-projects.md). Keep factual source terms and third-party notices separate from project licenses. Code/template software is Apache-2.0; original docs/design/model contributions are CC BY 4.0. The synthetic demo does not claim a real geographic origin or survey accuracy.

## Art direction

The [style library](../style/README.md) contains the default recommended Architectural Toon Realism design archive and welcomes alternatives. The default remains a synthetic whitebox, with optional authored GLB / Toon support described in [presentation layers](presentation-layers.md). Keep style experiments separate from geographic evidence and managed runtime files until a reusable implementation has been reviewed.

## Phone controls

Compact phone layouts respect safe areas, reduce the minimap, and keep camera buttons at the bottom. Follow and First-person touch assign lower-half contacts to a floating movement stick (dead zone, bounded analog speed) and upper-half contacts to looking. Roles remain fixed until release; two fingers operate independently. Release/cancel/lost capture, blur, resize, search, view changes and Settings clear movement. Overview retains orbit/pinch gestures. Desktop input is unchanged.


[Analog movement and independent interiors](interiors-mobile.md) — shared analog walk/run gesture, estimated doorways, one active world and exportable classroom template (included in template 0.4.0).
