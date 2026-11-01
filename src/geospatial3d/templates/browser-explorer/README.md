**English** | [简体中文](README.zh-CN.md)

# Geospatial browser explorer template

A runnable Three.js/Vite template with the OpenCampus interaction/layout design and independent, synthetic demo data.

```sh
npm ci
npm run dev
```

Open the printed local URL. Node dependencies are locked. The default scene is fictional; it requires neither Blender, raw data nor external geographic services.

## Included behavior

- Follow, First person and Overview (`1`, `2`, `3`; cycle with `V`).
- Terrain-aligned walking/collision with WASD/arrows, Shift to run, Space to jump.
- Mouse drag; wheel zoom in Follow and Overview, with camera obstacle handling.
- Name/initial search (`/`, arrows, Enter, Escape), 45° overview framing, in-place turning in walking views.
- Camera-facing priority labels, edge direction hints, selection and minimap markers.
- Settings / About, names, wireframe, shadows, provenance, credits and license links.
- Responsive inspection layout, self-hosted fonts, reduced-motion transitions and typing isolation.

## Customize

`public/viewer-profile.json` contains brand text/images, descriptions, source links, repository links and attribution. Relative asset paths and HTTP(S) URLs are supported. Keep geographic exports in `public/scene/`, with schema-v1 `manifest.json`, model GLB, heightfield and sources. `viewer-settings.json` optionally supplies `spawn_look_at_enu_m`.

From the installed Python pipeline, `init-viewer --output ../new-map --scene-dir /path/to/export` creates an independent copy with your export. `sync-viewer` uses `viewer-template.lock.json` to update shared files safely while preserving content. Edit profiles and data to specialize a place; merge shared-code edits deliberately before upgrades.

```sh
npm test
npm run build
npm run test:browser
```

Browser tests use port 5174 so they can run alongside a normal local preview. Local tests use Chrome; CI installs Playwright Chromium. `npm run demo` deterministically regenerates the small procedural scene. The example has no real-world survey or geographic location.

## Licensing

Software is [Apache-2.0](LICENSE). Original prose/design/synthetic-model contributions are [CC BY 4.0](public/licenses/CC-BY-4.0.txt). Preserve [NOTICE](NOTICE), attribution and third-party font/dependency notices. No hosting identity, credentials, UO logo or campus assets are included.

## Optional authored art / 可选美术层

Version 0.5 supports a separate presentation GLB, stable replacement IDs and Toon/PBR settings without rewriting geospatial evidence. `init-viewer --scene-dir` copies the optional art JSON and GLB; safe upgrades preserve downstream content. See [the contract and validation plan](https://github.com/williamQ96/open-geospatial-to-3d-reconstruction-pipeline/blob/main/docs/presentation-layers.md) ([中文](https://github.com/williamQ96/open-geospatial-to-3d-reconstruction-pipeline/blob/main/docs/zh-CN/presentation-layers.md)). The default synthetic scene does not opt in.


[Analog movement and independent interiors](../../../../docs/interiors-mobile.md) — shared analog walk/run gesture, estimated doorways, one active world and exportable classroom template (local pending development).
