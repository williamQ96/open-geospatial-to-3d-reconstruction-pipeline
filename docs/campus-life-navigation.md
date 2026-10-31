# Rigged actors, scripted life and outdoor routing

**English** | [简体中文](campus-life-navigation.zh-CN.md)

The browser template supports optional rigged characters, default-on campus activity/prop switches and outdoor navigation. UO is the first downstream implementation; local buildings, colors, activity routes, parking choices and downloaded assets stay downstream.

## Optional contracts

- `viewer-profile.json`: `character.asset_url`, a safe relative path from the viewer public root to a GLB with **Idle** and **Walk/Run** clips. Credits and third-party licenses belong in the profile About links and downstream source archive. The loader clones skeletons safely, normalizes height to 1.78 m, blends idle/walk and hides the hero in First person. Unconfigured maps retain the simple default avatar.
- `scene/viewer-settings.json`: `navigation_url` points to a version-1 graph inside the scene directory. `nodes_enu_m` contains `[east,north]`; `edges` contains `[a,b,length_m,kind]`, with `path`, `road`, or inferred `connector`. The browser uses graph costs with a small road/connector penalty, clear straight endpoint attachments, and exterior approach nodes for building searches. Relative URL validation prevents path traversal.
- Optional `activity_url`: `{version:1,students:{count:12,routes_enu_m:[...]},traffic:{count:4,routes_enu_m:[...]},props:[{kind,east,north,yaw}]}`. Student seed endpoints map onto the graph. Traffic only uses clear contiguous source road portions. Available original prop types are `car`, `van`, `pickup`, `bicycle` and `scooter`. Current mix is eight rigged walkers, two bicycle riders, two scooter riders, up to four road cars; fewer actors may be created when routes are invalid. Downstreams must verify actual counts.

Directions stays hidden when no graph is configured, and Campus life stays hidden without activity data. People/traffic and parked-prop switches default on and operate independently. Disabling activity pauses its animation; disabling both returns the clean map. The hero remains available.

## Interaction contract

Overview asks for **A and B**, reusing the main accessible building search or allowing a free ground pin outside building envelopes. The pinning panel collapses so phone users can reach the canvas. First person/Follow use the **live player as A**, ask for B, and refresh after movement (>3 m, at most once/second). B persists across modes; manual Overview A is restored or requested. The player is never teleported.

Blue terrain-draped ribbons and instanced animated white chevrons point A→B, with a minimap route. Fit frames an Overview route; Clear removes it, while closing the panel retains it. A near-end message reports arrival at the approximate approach. Buildings occlude the route; depth bias keeps it visible over landscape paving. No connected route yields a visible failure message.

## Reusable methods

```python
from geospatial3d.navigation import build_navigation_graph
# Feature: {'centerline_enu_m': [[east,north],...], 'kind':'path'|'road'}
# Building: {'footprint_enu_m': [[east,north],...]}
graph = build_navigation_graph(features, buildings, step_m=7)
```

The generator nodes line intersections, subtracts building footprints buffered by 0.65 m, samples line segments and joins disconnected components only across unobstructed gaps <=14 m. Connectors are **inferred**, not verified walks. Retain source hashes, coordinate origin and estimated-access limitations with downstream exports. Tests exercise intersections, obstacles, invalid steps and empty inputs; JS tests exercise detours, disconnection and arrow direction. Downstream UI tests must additionally exercise actual scene pins, live origins, activity movement and clean-mode switches.

For imported rigged assets, **verify rest poses** before copying animation actions. A mesh bind rig may use a T pose while animation files use an arms-down rest pose. Bake source world-space bone matrices into target-local poses, then export named clips and verify visually. Keep original source files, license evidence, checksums, used texture bytes and an editable packed Blender source. Prefer CC0/compatible assets; retain their original terms. School color combinations may guide neutral clothing; omit logos and mascots unless explicitly authorized and redistributable. UO's [working asset pipeline](https://github.com/williamQ96/open-campus-uo/blob/main/scripts/build-campus-character.py) is an example, not a mandatory school-specific dependency.

`props.js` is an original geometry generator. Each vehicle/rider uses merged vertex-colored geometry to reduce draw calls; model outputs can be GLB-exported and imported into Blender. Code is Apache-2.0, original generated model contributions CC BY 4.0. The [UO export script and Blender library](https://github.com/williamQ96/open-campus-uo/blob/main/docs/campus-life-navigation.md) demonstrate portable delivery. Do not bundle external proprietary map/Street View geometry or imagery into these assets.

The activity is scripted visual ambience. Actors reverse on fixed routes, have no traffic avoidance/player collisions, and bicycle/scooter riders use original static poses without wheel/pedal simulation. Dynamic actors do not cast shadows into the static shadow cache. Future refinement can add intersections, richer animation, LOD and proper navmesh/accessibility data. Validate performance with immersion enabled and separately assert that disabling it restores the clean-map budget.

This method deliberately starts with plausible, coherent low-cost geometry and explicit uncertainty. First passes should not stall on photorealism; improve recognizability, accuracy and realism through documented long-term correction. Maintain the recommended Architectural Toon Realism style while allowing other visual directions.
