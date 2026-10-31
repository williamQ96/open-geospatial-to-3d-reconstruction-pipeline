**English** | [简体中文](MAINTENANCE.zh-CN.md)

# Long-lived upstream maintenance

The pipeline is maintained as a reusable upstream. Open Campus: UO is the first independently maintained downstream; completion of the first prototype does not end either project.

Upstream priorities include reconstruction quality, point/roof/terrain methods, validation, source discovery/checksums, batch and incremental automation, interchange contracts, reproducibility, and reusable viewer interactions. Test methods against independent places and synthetic fixtures rather than embedding UO assumptions.

Downstream projects maintain area catalogs, names, specific models, materials, content and site branding. Reusable bug fixes flow upstream; a correction specific to one real building stays downstream. Automatic rebuilds must not replace manually refined authoritative assets.

Downstream maintainers should archive adopted image/photo inputs with dated license evidence, attribution, local files and checksums under `data/reference-images/`. Review source rights before modeling or distributing textures, preserve historical exclusions and use sources compatible with open asset export. The [media policy and checker](docs/reference-media.md) define the shared baseline; regional media stay downstream.

Python tools and the browser template have semantic versions; interchange/configuration formats use `schema_version`. A downstream reconstruction lock and viewer-template lock may intentionally point to different revisions. Advance reconstruction only after a small-area comparison. Upgrade shared viewer files only after validating their previous hashes; preserve project data, profiles and hosting identity.

Breaking coordinate or field changes require schema migration notes. Location-quantized roof IDs are seed identities that may split or merge; stable institutional registries remain a downstream refinement task.

The historical UO loop and synthetic geometry/interaction checks are implemented. Independent survey accuracy, a second real geographic region, arbitrary CRS conversion, incremental regeneration and cross-engine validation remain open work.
