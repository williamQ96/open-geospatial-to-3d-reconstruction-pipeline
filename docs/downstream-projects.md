**English** | [简体中文](zh-CN/downstream-projects.md)

# Downstream projects

The current downstream scope consists of these two projects. They use different integration paths; registration does not imply a shared runtime.

| Project | Area / map | Repository | Live explorer | Focus |
| --- | --- | --- | --- | --- |
| **Open Campus: UO** | University of Oregon, main Eugene campus | [Source](https://github.com/williamQ96/open-campus-uo) | [Open map](https://williamq96.github.io/open-campus-uo/) | Geographic exports and locked viewer template; campus-specific refinement |
| **Open Philosophy** | Interpretive concept scenes | [Source](https://github.com/williamQ96/open-philosophy) | [Open app](https://williamq96.github.io/open-philosophy/) | Independent Three.js runtime; methodological lineage, no geographic schema or template dependency |

## If a future project is explicitly added

Add a row after the existing entries with a project name, location or synthetic scope, source repository, optional live URL, maintainer and refinement goal. Document source rights, coordinate frame, reconstruction pin and viewer-template pin in that downstream project. A new map may use the same runtime and design while supplying its own scene and profile.

Maintain a `data/reference-images/` folder in each map repository for adopted photographs, mockups and other image inputs, with original files, usage, authors, license evidence, dates and hashes. Prefer openly redistributable sources and avoid assets that prevent open export. Follow the [reference-media policy](reference-media.md); the [UO media archive](https://github.com/williamQ96/open-campus-uo/tree/main/data/reference-images) is the first example.

Use `init-viewer` to start independently. General methods and reusable interaction fixes should return upstream; regional data, hand-refined geometry and branding remain downstream. Preserve the applicable Apache/NOTICE and CC BY attribution when redistributing shared software or original content. Registration does not imply measured survey accuracy or institutional endorsement.
