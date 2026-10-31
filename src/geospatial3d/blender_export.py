# SPDX-License-Identifier: Apache-2.0
"""Run with Blender --background --factory-startup --python this_file -- INPUT OUTPUT."""

import json
from pathlib import Path
import sys

import bpy
from mathutils import Vector
from mathutils.geometry import tessellate_polygon


def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*color, 1)
    node.inputs["Roughness"].default_value = .92
    return mat


def mesh_object(name, vertices, faces, mat, collection):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def main():
    inp, output_arg = sys.argv[sys.argv.index("--") + 1:]
    output = Path(output_arg)
    bundle = json.loads(Path(inp).read_text(encoding="utf-8"))
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    collection = bpy.data.collections.new("Georeferenced whitebox")
    scene.collection.children.link(collection)
    appearance = bundle['configuration'].get('appearance', {})
    terrain_mat = material("Terrain | mineral grey", appearance.get('terrain_color_linear', (.30, .32, .34)))
    building_mat = material("Buildings | white clay", (.91, .90, .86))
    t = bundle["terrain"]
    nx, ny, step = t["nx"], t["ny"], t["spacing_m"]
    vertices = [(t["min_east_m"] + i * step, t["min_north_m"] + j * step, t["heights_m"][j * nx + i])
                for j in range(ny) for i in range(nx)]
    faces = []
    for j in range(ny - 1):
        for i in range(nx - 1):
            a = j * nx + i
            faces.extend([(a, a + 1, a + nx + 1), (a, a + nx + 1, a + nx)])
    terrain = mesh_object("terrain", vertices, faces, terrain_mat, collection)
    terrain["asset_kind"] = "terrain"
    for face in terrain.data.polygons:
        face.use_smooth = True
    for b in bundle["buildings"]:
        ring = b["footprint_enu_m"]
        n = len(ring)
        verts = [(x, y, b["base_z_m"]) for x, y in ring] + [(x, y, b["roof_z_m"]) for x, y in ring]
        vectors = [Vector((x, y, b["roof_z_m"])) for x, y in ring]
        tris = tessellate_polygon([vectors])
        lookup = {tuple(v): i for i, v in enumerate(vectors)}
        triangles = [tuple(v if isinstance(v, int) else lookup[tuple(v)] for v in tri) for tri in tris]
        faces = [tuple(i + n for i in tri) for tri in triangles]
        faces += [tuple(reversed(tri)) for tri in triangles]
        faces += [(i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)]
        obj = mesh_object(b["id"], verts, faces, building_mat, collection)
        obj["asset_id"] = b["id"]
        obj["asset_kind"] = "building"
        obj["reconstruction_status"] = b["status"]
        if b.get('name'):
            obj['display_name'] = b['name']
            obj['campus_id'] = b['campus_id']
            obj['name_match'] = b['name_match']
            obj.data.name = f"{b['name']} | Mesh"
        # Recalculate outward normals independently of polygon input winding.
        import bmesh
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(obj.data)
        bm.free()
    corridor_collection = bpy.data.collections.new("Terrain-draped roads and paths")
    scene.collection.children.link(corridor_collection)
    corridor_mats = {
        'road': material('Roads | charcoal grey', (.12, .14, .16)),
        'path': material('Paths | light mineral', (.47, .48, .46)),
    }
    for surface in bundle.get('corridor_surfaces', []):
        obj = mesh_object(surface['id'], surface['vertices_enu_m'], surface['triangles'],
                          corridor_mats[surface['kind']], corridor_collection)
        obj['asset_id'] = surface['id']
        obj['asset_kind'] = 'corridor'
        obj['corridor_kind'] = surface['kind']
        obj['reconstruction_status'] = 'estimated-width-terrain-draped'
    scene["corridor_provenance_json"] = json.dumps(bundle.get('corridors', {}))
    scene["coordinate_frame_json"] = json.dumps(bundle["coordinate_frame"])
    scene["source_ids_json"] = json.dumps([s["id"] for s in bundle["sources"]])
    scene["pipeline_version"] = bundle["pipeline"]["version"]
    scene["acquisition_dates"] = ", ".join(s["acquisition_date"] for s in bundle["sources"])
    asset_license = bundle['configuration'].get('asset_license', {})
    scene['asset_license_json'] = json.dumps(asset_license)
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "scene.blend"))
    bpy.ops.export_scene.gltf(filepath=str(output / "campus.glb"), export_format="GLB", export_yup=True,
                              export_extras=True, export_cameras=False, export_lights=False,
                              export_copyright=asset_license.get('attribution', ''))
    (output / "blender-version.json").write_text(json.dumps({"version": bpy.app.version_string,
                                                            "objects": len(collection.objects)}), encoding="utf-8")


if __name__ == "__main__":
    main()
