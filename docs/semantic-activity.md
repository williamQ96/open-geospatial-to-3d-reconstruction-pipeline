# Fixed habitats and demand-generated NPC templates

**English** | [简体中文](zh-CN/semantic-activity.md)

Compile **where** an entity may exist independently of **what** it looks like. Pedestrians use authored pedestrian paving, vehicles use explicitly selected driving lanes, squirrels use vegetation or an authored tree, and parked props use fixed parking slots. These are downstream scene classifications, not proof of current access or observed activity. Never fall back from a missing squirrel habitat to a road graph, or from a missing sidewalk to a vehicle lane.

The offline `geospatial3d.activity.fixed_paths` helper clips candidate centerlines to their own surface polygons with building clearance, retains original bend vertices and samples terrain height once. Save stable path IDs, semantic surface, dense `[east,north,height]` samples and explicit source/inference notes. Tree routes may contain vertical climb/perch samples tied to an existing tree. Validate ground routes against their actual rendered paving/lawn polygons and parking against reserved fixed footprints. Geographic navigation and ambient activity use separate contracts.

## Activity format 2 and migration

```json
{"version":2,"seed":613,"paths":[{"id":"walk-1","surface":"pedestrian","points_enu_m":[[0,0,2],[20,0,2]]}],"prop_slots":[{"id":"parking-1","surface":"parking","east":30,"north":10,"height":2,"yaw":0}]}
```

Valid movement classes are `pedestrian`, `driving`, `vegetation` and `tree`. Pedestrians/bikes/scooters use the first class; road vehicles use `driving`; squirrels use the last two. The separately maintained navigation graph remains version 1. **Activity version 1 is not silently migrated:** replace its unconstrained route seeds/props with classified compiled paths and slots before upgrading the shared viewer. Regenerate and audit downstream data, preserve old provenance, then sync managed runtime files. Without activity data the viewer and optional beta mode still work.

## One template plus sampled properties

`npc-templates.js` provides versioned deterministic samples from a per-entity seed. Save template/version, seed and sampled values, not just a random generator's current state. A fixed map seed and logical entity ID reproduce traits regardless of creation order. A seed is a replay identifier, not a claim about a real person's identity.

- Students: independent m/f avatar presentation, truncated normal height (mean 1.71 m, standard deviation 0.115 m, bounds 1.4–2 m), continuous skin RGB along a brown-to-light-pink palette with a small undertone variation, six procedural hairstyles, hair/clothing/bag colors, no bag/tote/backpack/single-left/single-right, speed and a 2.15 m/s walk/run threshold. These fictional traits are sampled independently; the palette does not infer race or connect appearance to behavior.
- Vehicles/props: car/SUV/van/pickup, color, size and movement speed; parked instances have zero speed. Riders have an independently seeded student appearance.
- Squirrels: size, fur tone, speed and pause/activity durations. A tree route determines height; it is not a skeletal climbing animation.

Load a base asset once, share immutable geometry/textures, and construct only the requested density. Raising density adds missing logical IDs; lowering it destroys excess instances and releases owned geometries, materials and animation mixers. **No has zero ambient instances and collision bodies**, not a hidden high-density pool. Preserve surviving entities and their sampled traits across density changes. Never dispose resources shared with the hero or other instances. Merge small hair/bag parts by attachment to control draw calls.

The runtime samples cached path lengths/heights instead of scanning buildings and terrain for every actor every frame. Collision/yielding remains dynamic; narrow paths can queue actors. Validate allocations, disposal and classification, then measure actual frame time before claiming an FPS improvement. Model/download growth is a separate budget.

## Reproducible inspection

About → **Developer mode** is off by default. A click on an unobstructed NPC opens a panel with template/version, seed, sampled properties, path/slot and current state/position. Copy produces a reproduction record. Turning the mode off closes the panel; removing the entity clears selection. This entry is reserved for future developer tools. It is client-side inspection, not additional server privilege.

Walking audio and model animation share a distance-driven phase. Current explorer walk/run speeds are 1.7/4.6 m/s, with footfall spacing 0.95/1.5 m. Actual movement, not held keys, advances contacts. First-person visual offsets default to Low (3 mm vertical / 1 mm lateral), with **no roll**. The separate No/Low/Mid/High comfort control preserves foot contacts, and reduced motion forces offsets to zero. Keep the original gait bug fix separate from new modeling and simulation work in the logs.

Optional activity-v2 `pedestrian_regions` supports bounded walking detours around collision bodies, followed by rejoining the original fixed path. It must describe inset actual pedestrian paving, with holes/buildings/vehicle surfaces excluded. Missing or narrow space keeps safe yielding. See the [planning budget, margin and validation contract](environment-recovery.md#bounded-collision-bypass).

For imported rigs, set optional `character.footfall_phase_offset` (cycles) from that asset's foot-contact markers. The controller maps the shared gait phase into clip time with this offset; replacing a rig requires recalibration rather than reusing another asset's timing.
