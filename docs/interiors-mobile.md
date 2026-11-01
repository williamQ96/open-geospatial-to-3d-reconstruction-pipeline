Published source: 0.12.0 / template 0.4.0. See METHODOLOGY_LOG.md for actual publication verification.

**English** | [简体中文](zh-CN/interiors-mobile.md)

# Analog movement and independent interiors

Included in 0.12.0 / template 0.4.0. These are recommended reusable explorer patterns. Keep site-specific building IDs, doorway corrections and indoor art in downstream content.

## One analog movement gesture

Follow and First person choose the pointer's role when contact starts: lower half moves, upper half looks. Each finger retains its role until released. A 6 px dead zone filters taps; displacement up to the 48 px stick radius maps continuously to 0–4.6 m/s. Mild drag walks (about 1.7 m/s at 37% strength), full drag runs. The gait changes above 2.15 m/s based on actual collision-constrained displacement. Audio contacts and animation continue to share distance phase. No separate Run button. Desktop WASD/arrows, Shift run and jump remain available. Release, cancel, lost capture, blur, resize, search and modal/view changes stop touch movement. A short stationary tap still operates doors, without becoming a look or walk gesture.

## Frontage is an estimate

Every usable footprint gets one lightweight instanced doorway. Infer an exterior edge with a clear approach against geographic building collision; project onto the matching art facade when possible. This is not a surveyed entrance, accessible route or measured elevation. Future corrections take priority over inference through `viewer-settings.json`:

```json
{"entrances":{"building-id":{"position_enu_m":[12,34],"outward_degrees":90}}}
```

Coordinates are east/north metres; outward degrees are clockwise from north. The overrides and stable building identities remain downstream. Inference may have no clear approach in arbitrary overlapping/invalid datasets; audit entries and reachability before calling a map complete. Mouse click/touch on a visible door enters from any camera mode. Near a door in Follow/First person, use E or the labeled Enter button. Portals do not bypass foreground-wall ray occlusion.

## One active world

The entry module dynamically imports either campus or classroom code. `?interior=<building-id>` selects an independent document/world, not an overlay with the campus hidden underneath. Use ordinary same-origin full navigation so future large indoor models have an explicit resource boundary. `pagehide` stops the renderer, disposes geometry/material/texture resources and loses its WebGL context; a BFCache return reconstructs rather than reviving disposed GPU objects. No campus GLB, ground, routes, activity graph or NPC population is requested by the indoor branch. Shared fonts, code, audio and hero may use the browser cache; this is useful and distinct from resident world assets.

A versioned same-tab session record stores outdoor position, heading, pitch, Follow distance, camera mode, density, motion and display/audio settings. Exiting by door/E or Return to campus restores them after loading outdoor resources again. Missing/blocked storage and invalid saved records fall back to the normal map spawn. Active navigation, NPC trajectories, selection, developer mode and beta rounds restart on re-entry; these are not persistent world simulations. Reloads and transitions are allowed to take time as assets grow.

## Shared first room, then specific rooms

`classroom.js` builds an original 24 × 18 m stylized room with board, 15 desk/chair sets, teaching desk, windows, ceiling and door. Batch static surfaces by material, keep the exit interactive, block furniture/walls, and hide only the ceiling for Overview. Indoor First person/Follow/Overview, analog/keyboard locomotion, jumping, audio and motion comfort stay familiar. The room is a **generic inferred template**, not a real floor plan or a claim about building usage. All building IDs currently resolve to it. Later a per-ID resolver can replace the template with separately loaded content without making all interiors resident.

`node scripts/export-classroom.mjs <output.glb> <local-viewer-url>` exports the kit for Blender or other tools (local Vite server required). Software is Apache-2.0; original model outputs use the project's content license (default CC BY 4.0) with attribution. No proprietary map-derived textures or assets are needed.

## Verify the boundary

Test both windings and doorway overrides; analog scaling, diagonal cap and malformed return records; mouse/E/touch entry, return pose/mode/density, room collisions and portrait/landscape layout. Browser integration must inspect indoor network requests as well as visible appearance to catch accidental outdoor preloading. Test the upstream synthetic fixture and each real downstream independently. Keep actual publication and test results in the methodology log; downstreams keep their own development log.


## Overview cards and inspection visits (included in template 0.4.0)

Overview selection opens one world-anchored building card for label clicks, model clicks and search results. The card shows the name, `to be fill` information placeholder, and Enter, plus a close control. Suppress only that building's regular label while its card is active; restore it when the card closes or character mode resumes. Keep the card inside the viewport on portrait and landscape screens; moving the map updates its anchor. Selection never moves the hero.

Enter from Overview passes an explicit `interior_mode=overview` through the same resource boundary. This is an observer visit: start with the ceiling open in Overview, do not construct a hero or request its model, retain the saved outdoor hero position, and provide Return to campus. Character-view controls are omitted in this inspection document. Returning restores outdoor hero pose and map framing. Ordinary Follow/First-person doorway entry still creates an indoor hero with its existing three views. The explicit URL mode also works if session storage is denied; restoration then uses the documented default-spawn fallback.

Mouse hover provides a softer building tint than selection and never changes selection or opens a card. Selection wins when they overlap; leaving restores materials. Named/individual art uses emissive tint. Material-batched context uses a per-building footprint edge cue so neighboring buildings do not all light up and batches remain intact. Resolve batched hits against stable footprint IDs, including boundary tolerance. Do at most one pending pick per 80 ms while a mouse is moving, skip drag/modal periods, clear on leave, and avoid any touch-hover state. Test tint precedence and exact-ID picking, not only the cursor appearance. No renderer-quality settings or source geometry are reduced.
