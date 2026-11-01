# Environment layers, comfort levels and scene recovery

**English** | [简体中文](zh-CN/environment-recovery.md)

Use a recognizable first-pass environment and bounded interaction states while preserving the geographic source. This extends the [presentation layers](presentation-layers.md), [semantic activity](semantic-activity.md) and [beta lifecycle](beta-functions.md).

## Portable ground and sky

Use an approved, archived, dated aerial reference for broad surface cues. Record the original bytes, license decision, export extent/CRS, source tiles and any resampling. Smooth color cues into an original small material palette, then document plausible aprons, lawn and urban paving inference. Keep the distinction between inferred appearance and measured land use/access. Provider-restricted basemaps and screenshots are not exportable source assets.

An optional `landcover_url` beside `asset_url` in presentation version 1 loads a second local GLB. It has the same confined relative-path rules and is copied by `init-viewer`. Tag a complete terrain-covering mesh with `asset_kind: "landscape-surface"`, `surface_layer: "foundation"`, and its small `heightfield_offset_m`. **Only use the foundation tag for full base coverage.** The viewer retains the original terrain for source checks and physics, and hides its duplicate draw. Validate the new mesh against the original heightfield and full extent before adopting it. Detail paving and roads remain above it; a distinct polygon-offset budget avoids z-fighting. Neither terrain coordinates nor source records are rewritten.

Bake palette colors and high roughness into the GLB. Original procedural world-space grain can enhance matte surfaces in the viewer, with derivative-based distance fading; chain existing material hooks so PBR, toon and spatial haze all work. Do not require photographic textures or a browser shader for the exported asset to remain useful. Keep one editable source and account explicitly for vertices, triangles and additional download bytes.

A blue sky gradient and merged rounded block-cloud mesh provide an inexpensive stylized sky without image assets or cloud shadows. Keep it camera-centered, behind world geometry, and independent of scene haze. Reduced motion stops cloud drift. This is a reusable rendering choice; other maps can choose a different sky.

## Four-level comfort

Expose **No / Low / Mid / High** first-person motion, default Low, separately from population density. Current vertical/lateral maxima are 0/0, 3/1, 6/2 and 10.5/3.5 mm with zero roll. Apply this multiplier only to camera offsets, preserving the actual-distance gait phase, footsteps and animation. OS reduced motion overrides the multiplier to zero at every level. Test that No still walks and produces appropriate foot contacts.

## Bounded collision bypass

Optionally store `pedestrian_regions` as local-ENU GeoJSON Polygon/MultiPolygon in activity format 2. Offline, erode actual pedestrian paving for body clearance and subtract buildings/driving surfaces. Preserve holes and disconnected regions. Missing regions mean safe yielding, not an unconstrained fallback.

On blocked walking movement, accumulate a short wait, then try lateral → parallel → original-path waypoints on either side. Sample all candidate segments inside the permitted region and clear current height-aware collision bodies, followed by static building checks. Use the same collision margins during planning and movement so an actor already waiting at contact can actually start a bypass. Cache waypoint heights. Consume waypoints through normal speed-limited collision movement and advance original path progress only on rejoin; never teleport. Retry after a delay, stagger actors, and cap planning requests per frame. A narrow passage may queue actors. Other habitats must never be borrowed as escape routes.

Validate a stationary blocker, a successful rejoin with no overlaps or jumps, narrow-path refusal, polygon holes and static obstruction. Track actual planning checks/counters; normal fixed-path interpolation keeps its cached heights and lengths. A bounded local bypass is not a general indoor AI or full avoidance solver.

## Terminal beta state

Contact experiments can emit a one-shot, height-aware terminal callback independently of the HUD. Freeze world motion and input when caught, draw a 30% black shade **under the UI**, and show a centered accessible modal above it. Prevent Escape from silently resuming a terminal round. Clear held keyboard/touch states. Avoid inheriting side-panel layout or blur-backdrop styles on this modal.

When the intended reset is “as freshly opened,” **reload** is a complete and inspectable recovery policy: authored spawn/facing, camera, activity, sound, comfort, developer/beta state and transient routes return to documented initial values. A future persistent-preference feature must define whether it participates in reset. Check the same spawn and defaults after reload, and keep terminal callbacks once-only until the experiment is stopped/restarted. Normal reversible beta exit can still restore captured state. See the [Zombie School template](beta/zombie-school.md).

Keep place-specific source images, material classification, editable ground assets, reviews and development logs downstream. Record transferable contracts, lifecycle changes and actual verification in the upstream methodology log.
