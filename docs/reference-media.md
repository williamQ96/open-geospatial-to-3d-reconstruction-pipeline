**English** | [简体中文](zh-CN/reference-media.md)

# Reference images and exportable assets

Every downstream map should maintain a committed **`data/reference-images/`** directory for the images and photographs it adopts, including modeling references, textures, mockups and identity artwork. Keep the files, not just remote search links. The first implementation is the [Open Campus: UO archive](https://github.com/williamQ96/open-campus-uo/tree/main/data/reference-images).

Regional photographs belong in the corresponding downstream repository. Upstream maintains this reusable policy and checker; its style library retains its own documented mockups. English should be the default documentation, with translations welcome.

## Recommended layout

```text
data/reference-images/
  README.md                  # scope, usage and accuracy notes
  README.zh-CN.md             # optional translation
  manifest.json              # one record for every image file below this directory
  evidence.json              # dated source/license declarations and review notes
  ATTRIBUTION.md             # human-readable credits and license links
  photos/<building-or-area>/ # original licensed photo bytes
  textures/                  # when used; include originals and edited versions
  project/mockups/           # disclose AI-generated artwork
  project/brand/
```

Preserve earlier design archives and source reports. If an existing file must stay at its runtime or design path, an unchanged archive copy can record that relationship and matching checksum. Rendered review screenshots may remain in `docs/images/`; index them as outputs, separately from reference inputs. Large collections may use durable versioned object storage or Git LFS, provided maintainers verify anonymous retrieval and retain a complete manifest and accessible originals. Do not let a hosted app download the research archive unnecessarily.

## Source and licensing policy

Prefer original photographs whose owner grants the necessary rights, **CC BY 4.0**, **CC0**, or a verified public-domain dedication. Confirm permission to redistribute source images, modify them, and share/export resulting assets, including commercial reuse. Record the actual author and terms on the source page; a search-engine result or an accessible download is not permission. Preserve third-party attribution and license terms. Project CC BY declarations apply only to project-owned contributions.

Avoid adopting unknown-rights, all-rights-reserved, noncommercial (NC), no-derivatives (ND), or provider-restricted imagery/models into an openly reusable asset workflow. Do not extract or trace restricted map imagery, street imagery, tiles or hosted 3D models and then relicense the result. If permission cannot be established, leave the image bytes out of public distributions, preserve any historical citation and exclusion reason, and find an approved replacement before further refinement. Do not erase past reference use or claim that adding a new archive regenerated existing models.

ShareAlike licenses can be open, but require a separate compatibility and distribution decision. They are outside this project's default CC BY-oriented intake policy; this is not a claim that all ShareAlike material is non-open. Expand the documented policy and validation deliberately if a downstream chooses them. Public-domain images stay public domain; do not label a PD-self dedication as CC0. Copyright permissions do not themselves settle trademarks, privacy or other applicable rights.

## Register each image and its use

Record a stable ID, local file, title, author, source page and download URL, capture date (or an explicit unknown), access/review date, license identifier/link, evidence for the license decision, attribution text, modifications and SHA-256/byte size. Link it to building/object IDs or the design, texture or model file that uses it. Record crops, retouching and texture bakes as modifications; retain the original and derived-file relationship. For AI mockups, record generation context and make clear that they are not geographic evidence.

Minimal example (replace placeholders and compute the real hash):

```json
{
  "version": 1,
  "images": [{
    "id": "building-a-front-2026",
    "file": "photos/building-a/front-2026.jpg",
    "title": "Building A, front entrance",
    "author": "Photographer name",
    "source_page": "https://example.org/photo-record",
    "download_url": "https://example.org/front-2026.jpg",
    "captured_at": "2026-10-01",
    "accessed_on": "2026-10-31",
    "reviewed_on": "2026-10-31",
    "license": "CC-BY-4.0",
    "license_url": "https://creativecommons.org/licenses/by/4.0/",
    "license_evidence": "Owner's explicit declaration on the source page, recorded in evidence.json",
    "review_status": "approved",
    "attribution": "Building A — Photographer name — CC BY 4.0 — source URL",
    "modifications": "None; original bytes, renamed locally",
    "used_by": ["building-a"],
    "purpose": ["Front-facade modeling reference"],
    "bytes": 12345,
    "sha256": "REPLACE_WITH_ACTUAL_SHA256"
  }]
}
```

When `captured_at` is null, supply `date_note`; do not substitute upload time for capture time. Label older facades, pre-renovation entrances and uncertain orientations. Distinguish a photo used to build an asset from a newly archived photo for future review. Rights-cleared reference images still do not establish measured dimensions or present-day conditions.

## Photo-to-asset workflow

1. Review the source and permission, download the approved original, inspect the actual view and date, and register its use.
2. Build original, editable geometry/materials in Blender. Keep reference-based approximation separate from measured geographic evidence and retain stable object IDs.
3. Export standard GLB/glTF with portable materials. Include applicable credits/terms with any redistributed image, texture or other source-derived content; a generic project credit does not replace third-party attribution.
4. Review geometry and shading in Follow, First person and Overview. Keep source photos out of the web bundle unless the application actually needs them.
5. Commit the reference register alongside asset revisions. Review new inputs and changed licensing before release; preserve hand-refined sources.

## Automated audit

From a checkout of this upstream repository:

```powershell
python scripts/check-reference-media.py --root /path/to/downstream
```

The stdlib-only checker verifies registered files, SHA-256/size, nonempty author/credit/license-evidence/use fields, source and license URLs, review status, missing-date notes and unregistered images. An optional `existing_copy` field is a project-relative path to a byte-identical design/runtime copy; the audit detects divergence. The default accepted identifiers are `CC-BY-4.0`, `CC0-1.0` and `LicenseRef-PD-self`. It refuses paths outside the archive/project. It checks recorded decisions and file integrity, **not the legal truth of those decisions**, photo decoding or model accuracy. Use a reviewed upstream commit in CI; do not run a changing remote script directly from `main`.

The UO archive and its pinned CI check provide a concrete example. Its historical unverified references are explicitly excluded rather than silently relicensed. Reconstruction and viewer-runtime pins remain independent of this media-policy tool.
