**English** | [简体中文](README.zh-CN.md)

# Data management

The upstream carries small synthetic fixtures, schemas, tools and the browser template. UO raw data and real-model outputs remain downstream; the generic fixture has no real geographic origin or campus assets.

`raw/`, `processed/`, root `exports/` and `artifacts/` are ignored local working directories. Large LAZ, GeoTIFF, photos and real generated models are not ordinary upstream source files.

Adopted inputs need product IDs, provider/URL, acquisition and access dates where known, CRS/units, hashes, terms and verification status. Track tool licensing separately from input-data and generated-asset terms. Font notices are included with the viewer template.

Downstream maps should commit their adopted image/photo references separately in `data/reference-images/`, with per-file attribution, license evidence, dates, use and checksums. Do not use ignored research downloads as the only source record for released assets. The [reference-media policy](../docs/reference-media.md) includes the layout, open/exportable intake rules and automated audit. This does not require upstream to duplicate each region's photo library.
