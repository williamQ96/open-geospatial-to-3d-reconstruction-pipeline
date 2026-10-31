**English** | [简体中文](README.zh-CN.md)

# Style library

**Architectural Toon Realism is the default recommended art direction for new downstream maps.** It balances recognizable architecture and clear map reading with reusable materials, manageable asset production and a scalable browser rendering approach. This is a design recommendation, not an enabled renderer preset or a requirement for downstream projects.

| Style | Status | Design archive and mockup |
| --- | --- | --- |
| **Architectural Toon Realism v1.0** | **Default recommendation** | [Guide, palette, original mockup and source record](architectural-toon-realism/README.md) |

The first case study is [Open Campus: UO](https://github.com/williamQ96/open-campus-uo/tree/main/design/architectural-toon-realism). The archived AI-generated concept illustrates art direction; its buildings, river and sports grounds are not verified geography. The UO explorer now includes a [limited visual pilot](https://github.com/williamQ96/open-campus-uo/blob/main/docs/visual-pilot.md); the scaffold defaults to a whitebox and supports optional authored layers. This folder does not change GIS inputs, exported models or the shared viewer lock.

## Why recommend it?

| Concern | Design choice and expected benefit | Cost or limit to validate |
| --- | --- | --- |
| Visual design | Recognizable silhouettes, natural colors and restrained graphic shading support close exploration and aerial reading. | Outlines and dense foliage can obscure labels; evaluate all three views. |
| Production cost | Reusable material families, procedural components and landmark-first refinement reduce repeated unique texture work. | Real architectural identity still needs verified references and manual work. |
| Maintenance | Keep geography, editable source assets, semantic metadata and renderer styling separate. | Theme adapters and asset/version compatibility still need maintenance. |
| Runtime and delivery | Plan LOD, reusable vegetation and optional effects with a standard PBR fallback. | Toon rendering is not inherently faster; measure draw calls, frame time, memory and downloads. |

These are engineering judgments and intended benefits, not measured savings or a performance benchmark. See the [implementation and evaluation plan](architectural-toon-realism/implementation.md).

## Other styles are welcome

Follow the [recognizable-first modeling policy](../docs/progressive-modeling.md): allow documented, plausible first-pass inference and improve realism through sustained correction. The recommended style is compatible with modular geometry and shared materials; it does not require a photoreal scan before release.

Authors are encouraged to explore Stylized PBR, photorealism, full comic, voxel/pixel, minimal architectural models and new visual languages. The default is a starting point, not an artistic gate. Alternative styles can be first-class entries here; no obligation to imitate the UO palette or Pacific Northwest vegetation.

Propose a `style/<slug>/` directory with an English README, optional translations, representative mockups, palette/material rules, asset provenance and license scope, a clear status (proposal, experimental or recommended), and a cost/maintenance/runtime evaluation. Preserve the same verified geography and object IDs for comparisons. Keep mockups separate from survey evidence and do not bake an engine-specific shader into the only source asset.

Original design documentation and rights-held illustration contributions follow [CC BY 4.0](../LICENSING.md); code examples follow Apache-2.0. Third-party references retain their own rights.

For each concrete map, keep the adopted photographs, mockups and image inputs in its own `data/reference-images/` archive with per-file provenance and export-compatible terms. Follow the [reference-media policy](../docs/reference-media.md); a style choice does not remove source restrictions.
