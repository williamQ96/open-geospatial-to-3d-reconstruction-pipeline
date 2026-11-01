# ZOMBIE SCHOOL!!! — beta template

**English** | [简体中文](zombie-school.zh-CN.md)

`src/zombie-school.js` is a reusable, non-combat chase experiment. The procedural chibi stitched monster has a green block head, flat dark hair, small bolts and simple clothes; it is original unbranded geometry. All zombies share one merged geometry/material. Software is Apache-2.0; original generated model contributions are CC BY 4.0. The exported `zombieGeometry()` can be used with a standard GLTFExporter; no external service or restricted asset is required.

| Parameter | Default |
| --- | ---: |
| Target population | 28 within 160 m of the hero |
| Minimum spawn separation | 14 m |
| Wander radius / speed | 12 m / 0.45 m/s |
| Attract / release radius | 30 m / 60 m |
| Chase speed | 2.2 m/s |
| Explorer walk / run | 1.7 m/s / 4.6 m/s |

On activation, remember ordinary activity density and switch to **No**, removing students, traffic, wildlife and parked props. Seed random spawn positions on clear terrain, outside buildings and away from the hero; sample terrain height rather than roofs. Spawn fewer monsters if clear space is insufficient. The playable hero remains.

Each zombie starts with a circular wander center and chooses slow, clear targets inside that radius. Distance **≤30 m** changes it to pursuit. Keep pursuing through the 30–60 m band; distance **>60 m** releases it and sets a new wander center at its current position. These separate thresholds prevent flickering between states. Chase speed lets a walking hero be approached and a running hero escape. Height-aware contact emits the one-shot `onCaught` callback and freezes monsters. The viewer shows a centered **You are dead** modal with a 30% black scene shade below the UI. **Restart** reloads the authored spawn and default explorer state, as freshly opened. No combat, damage or score system is required. See [terminal state and recovery](../environment-recovery.md#terminal-beta-state).

Buildings and actor/player collision remain active. Use the existing outdoor graph only when direct pursuit is obstructed, with throttled line-of-sight checks and replanning; unattainable targets may temporarily stall. This is a first-pass sandbox, not a full indoor/navmesh AI. Pause during dialogs. On exit, dispose all monsters and restore the previous ordinary density. Developer inspection can show a zombie's seed, state, center and rule parameters.

Validate boundary distances, hysteresis, center reset, terrain-only spawns, uniform shared geometry, collision, finite wandering, restore/disposal and all camera modes. Keep those tests independent from campus coordinates so other maps can reuse the experiment.
