**English** | [中文](zh-CN/asset-refinement-inventory.md)

# Asset inventory and divide-and-conquer refinement

Maintain a downstream inventory to make progressive improvement visible and reviewable. Split work by area and asset type, then choose a bounded batch or one reference-rich building. Keep the editable source, current runtime, evidence, unknowns and next correction connected; review the result before updating its record. Iterate without regenerating over manually refined assets. This is a planning and evidence method, not a survey, an automatic completion certificate or a release requirement.

## Levels and applicability

The user-defined levels describe reconstruction maturity, independently of visual style:

- **L0:** Whitebox only.
- **L1:** Simple rendering.
- **L2:** The first downstream's Knight Library exterior was explicitly designated L2 as an example. This does not define a general L2 rubric or automatically assign L2 to similar assets.
- **L3:** Reconstruction from floor plans or simple images, using some reasoning to infer missing details.
- **L4:** Reconstruction against real photographs, allowing a degree of logical inference. L4 is the intended goal for most reconstruction projects.
- **L5:** Modeling against real photographs or real modeling data, aiming for approximately 100% reproduction regardless of style.

The L5 percentage expresses intended closeness, not an established measurement protocol or an automatic acceptance threshold. Photorealistic rendering is not required, and realistic materials or the mere existence of reference data do not establish a grade. Record source coverage, observed versus inferred features, and remaining uncertainty; grading requires human review. Assess an explicitly defined asset scope: an exterior's grade does not automatically cover its interior or the whole building. Do not present unobserved or unmeasured features as fact. These definitions do not automatically assign or raise any grade, and L4 is not a first-release requirement. An empty level means unassigned or not applicable; a planned asset is not 0 or 1 merely because a placeholder or a shared template exists.

The first downstream's user assigned level 1 as the baseline for its other existing parts. Treat that as a project-specific instruction, not a universal assessment of new projects. Existing assets can remain unassigned until their owner sets a baseline. A level describes production maturity, not verified identity, measurements, provenance, accessibility or present-day accuracy.

## Start and maintain an inventory

Copy [the header-only CSV template](../templates/asset-refinement-inventory.csv) into the downstream project and maintain it there. It contains no real project data. UTF-8 or UTF-8 with BOM is supported. Use one stable `asset_id` per row; group rows where finer detail is not yet justified, and split groups without losing their history. Recommended categories include regional trees and planting, terrain and landscape, furniture and vehicles, building exteriors, a shared interior kit, and separate planned interior rows for individual buildings. A shared room used by many buildings is **one existing shared asset**, not evidence of individual modeled interiors.

| Column | Meaning |
| --- | --- |
| `asset_id` | Unique stable row key; use related but distinct keys for an exterior and its interior. Preserve a mapping when source building IDs split, merge or change. |
| `area` | Named region or explicitly provisional production zone; do not imply an official boundary. |
| `asset_type`, `name` | Asset category and readable name; mark unidentified candidates clearly. |
| `status` | `existing` or `planned`; a reusable template and each uncreated individual interior have separate rows. |
| `level` | Blank or `0` through `5`; assign after review against the applicable user-defined meaning. Planned rows stay blank. |
| `evidence` | Asset source path, reference register, or other traceable evidence; distinguish observation from inference and check reuse rights. |
| `next_refinement` | A concrete next action or explicitly state none identified. It does not promise the next level. |
| `unknowns` | Record missing identity, dimensions, dates, hidden sides, rights, survey status or other uncertainty; use an explicit statement when none is known. |

Run `python scripts/check-asset-inventory.py path/to/inventory.csv` from the upstream checkout to check the header, required fields, unique keys, allowed status/level values and that planned assets are ungraded. Header-only templates pass. Earlier downstream inventories with localized or descriptive status values need an explicit mapping to `existing` / `planned` before validation; preserve the originals and their meaning during migration. The checker does **not** establish that files exist, source licenses are valid, asset IDs match a particular scene, claims are accurate, or a level is deserved. Projects should independently cross-check their own manifest identities, evidence links and counts; retain an audit snapshot and record corrections. The validator accepts levels 0–5 structurally; it neither assigns a level nor judges whether evidence supports one.

## Divide-and-conquer loop

1. Inventory what's present and planned. Reconcile source manifest IDs and count named and unidentified candidates separately; a candidate is not necessarily a distinct real building. Record shared kits separately from per-building work.
2. Partition by region, building and category. Choose a bounded batch using reference availability, significance, dependency order and uncertainty; avoid treating priorities as fidelity claims.
3. Gather rights-cleared, dated evidence; record observed features, estimates and occluded details. Preserve geographic coordinates, asset identity, style, collision and existing source history unless a separately documented correction is justified.
4. Refine editable source and regenerate only the affected delivery layers using the project's pipeline. Preserve unrelated changes and ensure automatic blockouts cannot replace authored assets.
5. Verify IDs and associations, sources and permissions, geometry and interchange, and visual placement/materials in context. Record what was actually checked and remaining limitations; do not infer real-world measurements or performance from a screenshot.
6. Update only the affected rows, status, evidence and next actions. Apply level changes only under user-established criteria or explicit designation. Retain previous evidence and record publication status separately; do not count planned interiors as completed.

See [progressive modeling](progressive-modeling.md), [scene hierarchy](scene-hierarchy.md) and [reference-media intake](reference-media.md). Campus-specific inventories, source photos, measured coordinates and progress logs stay downstream.
