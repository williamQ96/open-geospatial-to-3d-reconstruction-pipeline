# Low-cost stylized asset method

This is a practical, optional handoff for people and downstream projects, not a machine-validated schema. It does not replace the geographic schema v1, source ledger, reference-media audit, template lock or downstream records. Nothing here automatically creates, verifies, converts or hosts an asset.

## Workflow

1. Define the intended use, visual style, platform, budget and acceptable uncertainty. Choose only the detail that helps the experience; keep an editable source where practical.
2. Gather suitable evidence and materials: GIS and point clouds for spatial questions; photographs, drawings, open datasets, existing open assets, original research or conceptual descriptions as appropriate. Skills, procedural tools, manual editing and AI may assist creation. Check rights before use, including redistribution, derivatives, attribution and any service terms; “online” and “AI-generated” do not themselves establish permission. Record unavailable or uncertain rights and do not publish until resolved.
3. Separate measured facts, interpretation and invention. Record source dates, authors, URLs or stable identifiers, license evidence and access dates; preserve permitted source copies and hashes. For generated material record the tool/version, inputs, settings or prompts where practical, edits and limitations. Do not imply that generation proves accuracy or ownership.
4. Choose a consistent style and performance budget for the target: palette, proportions, materials, texture sizes, triangle/draw-call budget and accessibility as relevant. Prefer simple editable forms and progressive refinement; profile on the actual target. A concept illustration need not claim physical accuracy.
5. Keep editable sources and produce a target-compatible artifact, such as GLB/glTF for a 3D consumer, or source code for procedural scenes. Record units, axes, scale, origin and animation/material requirements when applicable; document external textures, fonts and other dependencies. Validate in the actual consumer: format support varies and GLB alone does not guarantee equivalent rendering or behavior across engines.
6. Deliver the artifact, attribution, license terms and a small handoff record together. Host using the downstream's existing static site or other chosen storage/CDN; verify public URLs, relative paths, MIME/CORS where relevant, cache/versioning, size and attribution. Keep editable originals and source evidence in an appropriate repository or archive subject to their rights. Hosting, availability and costs are the operator's responsibility; this project does not provide a hosting service.
7. Test load, rendering, interaction and disposal on target devices; document known gaps. Version artifacts and preserve their provenance. Corrections should not silently overwrite manually refined originals.

## Suggested handoff record

This example is illustrative YAML, not an implemented format or required migration. Omit inapplicable geographic fields; do not copy the example license as proof of rights. Keep sensitive or non-redistributable inputs in an appropriate access-controlled location.

```yaml
asset: example-concept
purpose: Interactive interpretive model
status: illustrative # measured, estimated or interpretive claims explained below
sources:
  - description: Original concept sketch
    author: Example author
    date: 2026-01-01
    location: archive/sketch.png
    sha256: "<actual hash>"
    rights: "<license and evidence location>"
method:
  tools: ["<tool and version>"]
  inputs_and_settings: "<reference to reproducible settings and edits>"
  assumptions: "<observed facts, inference and limitations>"
style: "<palette, proportions and target budget>"
outputs:
  - path: "<versioned artifact or source>"
    format: "<GLB, source code, etc.>"
    coordinates: "<units, axes and origin if applicable>"
    dependencies: "<textures, fonts, runtime requirements>"
    license_and_attribution: "<terms for this output and included components>"
validation: "<consumer, device, checks, date and known gaps>"
hosting: "<operator, URL or intended location, version and cache policy>"
```

## Integration and migration

Open Campus: UO already maintains source records, geographic exports, a pipeline lock and a viewer-template lock. Continue using those contracts and the [reference-media policy](reference-media.md); add a handoff only where useful, without replacing or relabeling existing records. The [geographic architecture](architecture.md) remains authoritative for coordinates and schema v1.

Open Philosophy uses original procedural Three.js builders with its own update/dispose interface. It currently consumes neither geographic exports nor the browser template. Its source citations and interpretive scope belong downstream. A future shared asset or adapter should be tested against both projects before standardization; no integration or automatic conversion is promised here.

The reusable work to explore includes a validated general-purpose asset record, adapters and cross-consumer examples, automated license/provenance checks, size budgets and portable hosting recipes. These are future work, not current functionality. The existing static viewer scaffolding and geographic Blender/GLB export are implemented; see the README for commands and limitations.
