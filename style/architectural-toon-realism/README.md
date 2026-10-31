**English** | [简体中文](README.zh-CN.md) · [Style library](../README.md)

# Architectural Toon Realism

Visual style guide v1.0 · **Default recommended art direction** · Archived 2026-10-31

Real geographic structure, recognizable architecture, restrained comic rendering, and a polished architectural-diorama reading at a distance. The guiding goals are **geographic fidelity, visual coherence and readability across scales**.

This is the reusable art-direction archive derived from the [shared design conversation](https://chatgpt.com/share/6ae5adf2-4a74-83e8-b001-f9de17509c56), accepted there after the concept image was generated. It refines an earlier Stylized PBR/diorama proposal into Architectural Toon Realism. Hi-Fi RUSH was a discussion reference for clean, sharp graphic rendering; this archive neither copies its assets nor requires its rendering technology.

## Original concept mockup

![AI-generated architectural-toon campus concept, oblique aerial view](mockups/uo-campus-concept.png)

**Art-direction concept, not a geographically accurate UO reconstruction or a screenshot of the running viewer.** This is the unchanged 1672 × 941 image from the conversation. Its invented buildings, river, fields, road details and vegetation must not become GIS evidence. It is a UO-origin case study in a reusable style library, not a universal campus layout. [Provenance and SHA-256](provenance.json).

## Visual rules

| Dimension | Target for this style |
| --- | --- |
| Geometry | Preserve verified footprints, position, orientation, height and identifying roof/entrance features. Simplify minor trim, not identity. Unknowns stay marked as estimates. |
| Shading | Aim for soft 2–3 tone cel shading with readable depth; avoid black shadow blocks and harsh band boundaries. |
| Outlines | Thin, selective architectural silhouettes and important entrances; fade or disable in aerial views. Avoid tracing every window or leaf. |
| Materials | Simplified brick, stone, glass, metal and paving families; low-frequency surface detail and restrained reflections. |
| Vegetation | Readable clustered crowns, varied size/value/hue, reusable trees; local species and placement must be sourced separately. |
| Lighting | Warm natural daylight, cooler ambient shadows and gentle contact shading. Overcast is a useful later variant. |
| Environment | Clearly distinguish roads, pedestrian paths, lawns and plazas; subtle variation without photographic noise. |
| Color and mood | Moderately saturated, relatively light natural colors; warm architecture and layered greens. Avoid neon and uniform yellow buildings. |

For the UO example, Pacific Northwest conifers and deciduous trees inform the atmosphere. Other maps should reflect their own region. The constraints above define this style only; other library styles are welcome.

## Source palette

These exact values come from the conversation's interactive final guide. They are suggested sRGB material colors, not official UO brand colors, measured facade colors or a tested UI contrast system. Vary materials within these families; do not give every building or tree the same color.

| Material | sRGB HEX |
| --- | --- |
| Brick Red | `#B96F55` |
| Warm Stone | `#E4D6BB` |
| Roof Gray | `#A8ADB0` |
| Glass Blue | `#8FAEAE` |
| Grass Green | `#91B66F` |
| Foliage Green | `#658B54` |
| Deep Evergreen | `#385A45` |
| Path Sand | `#CDBB9F` |

Download [palette.json](palette.json). Apply proper color-space conversion in the target renderer; the values describe appearance intent rather than measured physical material properties.

## One world, three views

| Concern | Overview | Follow | First person |
| --- | --- | --- | --- |
| Buildings | Footprints, roofs and broad material zones | Entrances and medium-distance identity | Verified windows, entrances and material divisions |
| Vegetation | Legible crown masses | Keep avatar and route visible | Nearby trunk/crown detail without leaf noise |
| Lines and shadows | Minimal lines; soft, readable shading | Selective lines and contact cues | Selective important contours and contact depth |
| Labels and navigation | Landmark hierarchy, search and minimap | Preserve avatar, selected label and route cues | Compact HUD and prioritized selected label |

The source explicitly contrasted Overview and First Person; the Follow column is an engineering extension for the existing three-mode explorer. Share stable building IDs and editable assets across all views, with distance-based detail and rendering choices. Do not create separate campus worlds per camera. Search highlighting must stay readable independently of decorative outlines.

## What this archive delivers

- The original concept PNG, an English reusable guide and Chinese option.
- Exact palette tokens, the reusable [style prompt](style-prompt.txt) and the normalized [public final source guide](source-guide.zh-CN.md).
- A staged [implementation/evaluation plan](implementation.md) and machine-readable [provenance](provenance.json).

**Implementation status:** a first [UO pilot](https://github.com/williamQ96/open-campus-uo/blob/main/docs/visual-pilot.md) now implements an authored art layer, foliage and Toon/PBR switching. The template defaults to a synthetic whitebox and supports the optional layer. LOD, full-screen decorative outlines, hardware performance validation and cross-engine shader parity remain future work.

## Reuse and attribution

Adapt the prompt and palette to your region, without inventing geometry. Keep source geography, semantic metadata, editable Blender assets, standard PBR interchange materials and renderer-specific styling separate. See [implementation](implementation.md) for the reason and validation plan.

Credit **OpenCampus Architectural Toon Realism — Zhongyi “William” Qiu and contributors**, [Open Campus: UO](https://github.com/williamQ96/open-campus-uo) and this [upstream style archive](https://github.com/williamQ96/open-geospatial-to-3d-reconstruction-pipeline/tree/main/style/architectural-toon-realism); link [CC BY 4.0](../../LICENSES/CC-BY-4.0.txt) and identify changes. Original rights-held documentation/design contributions use CC BY 4.0; AI-generated concept art is offered under that license to the extent the project holds copyrightable rights. No exclusive right in an artistic style is claimed. Third-party images from the chat's search carousels are not bundled or relicensed. No trademark license or institutional/game endorsement is implied. See [repository licensing](../../LICENSING.md).
