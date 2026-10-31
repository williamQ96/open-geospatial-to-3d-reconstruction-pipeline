**English** | [简体中文](zh-CN/source-discussion.md)

# Source discussion and effective decisions

The initial [five-round campus modeling discussion](https://chatgpt.com/share/6ae54fb0-e6cc-83e8-8958-51a084c6b7cb?ogimg=plain) was read on 2026-10-30.

The user moved from a single-engine Unreal idea to a Blender-first, cross-engine asset library, requested a repeatable small-area loop before larger refinement, and excluded reliance on restricted UO internal GIS. The first downstream therefore verified public source products independently rather than adopting third-party campus footprints.

The generic pipeline and UO content were split into separate long-lived repositories. They were initially private. The user subsequently made the UO repository public and requested public no-login hosting, English-first documentation with Chinese alternatives, and upstream publication of reusable viewer methodology and design. The user then explicitly authorized making the upstream repository public as well; both repositories are now public.

For the first UO geometry, internal GIS, OSM, Microsoft/Oregon footprint compilations, Eugene GIS and Google 3D are excluded. This is a downstream source-selection decision, not a provider hardcoded into the generic tools. Actual source evidence and the rejected NoData DEM are maintained downstream.

USGS 3DEP, DOGAMI OLC, USDA NAIP and self-captured photos were investigation candidates. Tools, prices, performance targets and licensing options in the old discussion are not automatically current verified facts. No request emails were sent. In the subsequent explicit licensing decision, software/template code was assigned Apache-2.0 and original documentation/model/design contributions CC BY 4.0, with third-party terms preserved.
