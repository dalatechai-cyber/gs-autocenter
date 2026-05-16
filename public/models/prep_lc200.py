"""
prep_lc200.py - Blender prep script for the LC200 GLB
=====================================================

Opens lc200.glb, prints a full diagnostic of every mesh, auto-separates any
welded body it finds, renames meshes based on their 3D position and on any
semantic keywords already baked into the source names, decimates if the total
triangle count exceeds 150 000, ensures every mesh has a usable PBR material,
and exports to lc200-ready.glb with Draco compression.

How to run
----------
1. Open Blender.
2. Switch to the "Scripting" workspace tab at the top of the window.
3. Click "Open" inside the text editor area and pick this file.
4. Click "Run Script". Watch progress in the System Console
   (Window menu -> Toggle System Console on Windows).
5. The finished file appears next to the source as lc200-ready.glb.

PRE-RUN NOTE - model identity
-----------------------------
The inspector in Session 6 found that lc200.glb is actually a *Porsche Macan*
that was mis-labelled as a Land Cruiser 200 on Sketchfab (the original FBX
filename "Porsche_Macan_LOD_A.fbx" is preserved inside the GLB). The script
still runs correctly on it because the part names and structure are SUV-typical,
but the geometry will look like a Macan, not a Land Cruiser. Re-source a real
LC200 GLB before shipping if the visual fidelity matters.
"""

import math
from pathlib import Path

import bpy
from mathutils import Vector


# ---------------------------------------------------------------------------
# Config - edit these two paths if your project lives elsewhere
# ---------------------------------------------------------------------------
SOURCE_GLB = Path(r"C:/gs website/gs-autocenter/public/models/lc200.glb")
OUTPUT_GLB = Path(r"C:/gs website/gs-autocenter/public/models/lc200-ready.glb")

TARGET_TRIANGLES = 150_000  # browser performance cap
HEAVY_DECIMATE_RATIO = 0.20  # for hidden / structural parts
LIGHT_DECIMATE_RATIO = 0.55  # for parts the user will click on
NORMAL_DECIMATE_RATIO = 0.35  # everything in between

# Words that, if found inside a mesh name, lock the rename to that label.
NAME_KEYWORDS = [
    # body / exterior shell
    (["hood", "bonnet"], "Hood"),
    (["roof"], "Roof"),
    (["front_bumper", "frontbumper", "bumper_f", "bumper1"], "Bumper_F"),
    (["rear_bumper", "rearbumper", "bumper_r", "bumper2"], "Bumper_R"),
    (["front_fender", "fender_f"], "Fender_F"),
    (["rear_fender", "fender_r"], "Fender_R"),
    (["boot", "tailgate", "trunk"], "Tailgate"),
    # glass
    (["windshield", "windscreen", "frontglass"], "Windshield"),
    (["rearwindow", "rearglass", "rearwindscreen"], "RearWindow"),
    # doors
    (["door_lf", "door_fl", "door_lefront"], "Door_FL"),
    (["door_rf", "door_fr", "door_rifront"], "Door_FR"),
    (["door_lr", "door_rl_l", "door_lrear", "door_rl"], "Door_RL"),
    (["door_rr", "door_rirear"], "Door_RR"),
    # wheels and brakes
    (["disc_lf", "brake_lf"], "Brake_FL"),
    (["disc_rf", "brake_rf"], "Brake_FR"),
    (["disc_lr", "brake_lr"], "Brake_RL"),
    (["disc_rr", "brake_rr"], "Brake_RR"),
    (["tire", "tyre", "gum_"], "Tire"),
    (["wheel", "rim"], "Wheel"),
    # lights
    (["headlight", "fara_", "front_light", "highbeam", "lowbeam"], "Headlight"),
    (["tail_light", "taillight", "rearlight", "stoplight"], "Taillight"),
    (["led"], "LED"),
    # interior / controls
    (["steer", "wheel_hr"], "Steering_Wheel"),
    (["dashboard", "priborkaaa", "gauges"], "Dashboard"),
    (["seat"], "Seat"),
    (["mirror", "zerk"], "Mirror"),
    (["wiper", "dvor"], "Wiper"),
    # mechanicals
    (["exhaust"], "Exhaust"),
    (["engine"], "Engine"),
    (["radiator"], "Radiator"),
    (["battery"], "Battery"),
    (["intake"], "Intake"),
    (["plate"], "License_Plate"),
    (["logo"], "Badge"),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def banner(text):
    bar = "=" * 78
    print(f"\n{bar}\n{text}\n{bar}")


def reset_scene():
    """Empty the default Blender scene so the import is clean."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def import_glb(path):
    print(f"Importing {path}")
    bpy.ops.import_scene.gltf(filepath=str(path))


def mesh_objects():
    return [o for o in bpy.data.objects if o.type == "MESH"]


def triangle_count(obj):
    """Counts triangles for an evaluated mesh (handles modifiers + n-gons)."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    mesh = eval_obj.to_mesh()
    tris = sum(len(p.vertices) - 2 for p in mesh.polygons)
    eval_obj.to_mesh_clear()
    return tris


def world_bbox_center(obj):
    m = obj.matrix_world
    corners = [m @ Vector(c) for c in obj.bound_box]
    avg = Vector((0, 0, 0))
    for c in corners:
        avg += c
    return avg / 8.0


def world_bbox_size(obj):
    m = obj.matrix_world
    corners = [m @ Vector(c) for c in obj.bound_box]
    xs = [c.x for c in corners]
    ys = [c.y for c in corners]
    zs = [c.z for c in corners]
    return Vector((max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)))


def scene_bbox(objs):
    mn = Vector((math.inf, math.inf, math.inf))
    mx = Vector((-math.inf, -math.inf, -math.inf))
    for o in objs:
        m = o.matrix_world
        for c in o.bound_box:
            wc = m @ Vector(c)
            mn = Vector((min(mn.x, wc.x), min(mn.y, wc.y), min(mn.z, wc.z)))
            mx = Vector((max(mx.x, wc.x), max(mx.y, wc.y), max(mx.z, wc.z)))
    return mn, mx


def detect_axes(scene_size):
    """Returns (forward_idx, side_idx, up_idx). Up is always Z (index 2).
    Forward is whichever of X/Y is longer (cars are longer than wide)."""
    if scene_size.x >= scene_size.y:
        return 0, 1, 2  # X = forward, Y = side
    return 1, 0, 2      # Y = forward, X = side


# ---------------------------------------------------------------------------
# Diagnostics
# ---------------------------------------------------------------------------
def print_diagnostics():
    objs = mesh_objects()
    if not objs:
        print("  (no mesh objects found)")
        return
    total = sum(triangle_count(o) for o in objs)
    print(f"  total mesh objects : {len(objs)}")
    print(f"  total triangles    : {total:,}")
    mn, mx = scene_bbox(objs)
    print(f"  scene min          : ({mn.x:8.2f}, {mn.y:8.2f}, {mn.z:8.2f})")
    print(f"  scene max          : ({mx.x:8.2f}, {mx.y:8.2f}, {mx.z:8.2f})")
    print(f"  scene size         : ({mx.x - mn.x:8.2f}, {mx.y - mn.y:8.2f}, {mx.z - mn.z:8.2f})")
    print()
    print(f"  {'NAME':<48} {'TRIS':>8}   {'CENTER (x, y, z)':<30}   {'SIZE (x, y, z)':<26}")
    print(f"  {'-' * 48} {'-' * 8}   {'-' * 30}   {'-' * 26}")
    for o in sorted(objs, key=lambda x: -triangle_count(x))[:200]:
        c = world_bbox_center(o)
        s = world_bbox_size(o)
        print(
            f"  {o.name[:48]:<48} {triangle_count(o):>8,}   "
            f"({c.x:7.2f},{c.y:7.2f},{c.z:7.2f})   "
            f"({s.x:6.2f},{s.y:6.2f},{s.z:6.2f})"
        )
    if len(objs) > 200:
        print(f"  ... and {len(objs) - 200} more (sorted by triangle count, descending)")


# ---------------------------------------------------------------------------
# Stage 1 - separate any single welded body by loose parts
# ---------------------------------------------------------------------------
def separate_welded_meshes(min_objs_to_skip=20):
    objs = mesh_objects()
    if len(objs) >= min_objs_to_skip:
        print(f"  scene already has {len(objs)} mesh objects -- skipping loose-parts separation")
        return
    print(f"  scene has only {len(objs)} mesh objects -- separating by loose parts")
    for o in list(objs):
        if o.type != "MESH":
            continue
        bpy.ops.object.select_all(action="DESELECT")
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.separate(type="LOOSE")
        bpy.ops.object.mode_set(mode="OBJECT")
    print(f"  separation complete: now {len(mesh_objects())} mesh objects")


# ---------------------------------------------------------------------------
# Stage 2 - rename meshes by keyword + position
# ---------------------------------------------------------------------------
def keyword_match(name):
    low = name.lower()
    for keywords, label in NAME_KEYWORDS:
        for k in keywords:
            if k in low:
                return label
    return None


def position_label(c, mn, mx, forward_idx, side_idx, up_idx):
    """Best-effort positional label when no keyword matches."""
    size = mx - mn
    f_norm = (c[forward_idx] - mn[forward_idx]) / max(size[forward_idx], 1e-6)
    s_norm = (c[side_idx] - mn[side_idx]) / max(size[side_idx], 1e-6)
    z_norm = (c[up_idx] - mn[up_idx]) / max(size[up_idx], 1e-6)
    front = f_norm > 0.66
    rear = f_norm < 0.33
    left = s_norm > 0.66
    right = s_norm < 0.33
    low = z_norm < 0.20
    if low and front and left:
        return "Wheel_FL_Area"
    if low and front and right:
        return "Wheel_FR_Area"
    if low and rear and left:
        return "Wheel_RL_Area"
    if low and rear and right:
        return "Wheel_RR_Area"
    if low and (front or rear):
        return "Underside"
    return None  # leave name unchanged


def auto_rename():
    objs = mesh_objects()
    if not objs:
        return
    mn, mx = scene_bbox(objs)
    f_idx, s_idx, u_idx = detect_axes(mx - mn)
    print(f"  forward axis = {'XYZ'[f_idx]}, side axis = {'XYZ'[s_idx]}")
    used_counts = {}
    renamed = 0
    for o in objs:
        new_label = keyword_match(o.name)
        if not new_label:
            c = world_bbox_center(o)
            new_label = position_label(c, mn, mx, f_idx, s_idx, u_idx)
        if not new_label:
            continue
        used_counts[new_label] = used_counts.get(new_label, 0) + 1
        count = used_counts[new_label]
        new_name = new_label if count == 1 else f"{new_label}_{count:02d}"
        print(f"  rename: {o.name[:50]:<50}  ->  {new_name}")
        o.name = new_name
        renamed += 1
    print(f"  renamed {renamed} of {len(objs)} mesh objects")


# ---------------------------------------------------------------------------
# Stage 3 - decimate if total triangles > target
# ---------------------------------------------------------------------------
def decimate_ratio_for(name):
    low = name.lower()
    # parts the visitor will click on stay near full fidelity
    if any(k in low for k in ["hood", "door", "bumper_f", "headlight",
                                "windshield", "fender_f", "dashboard",
                                "steer", "wheel", "rim", "tire", "gum_"]):
        return LIGHT_DECIMATE_RATIO
    # mostly invisible
    if any(k in low for k in ["underside", "_area", "bottom", "chassis",
                                "exhaust", "fuel", "radiator"]):
        return HEAVY_DECIMATE_RATIO
    return NORMAL_DECIMATE_RATIO


def decimate_to_budget():
    objs = mesh_objects()
    total_before = sum(triangle_count(o) for o in objs)
    if total_before <= TARGET_TRIANGLES:
        print(f"  total tris {total_before:,} <= budget {TARGET_TRIANGLES:,} -- skipping decimation")
        return
    print(f"  total tris {total_before:,} > budget {TARGET_TRIANGLES:,} -- decimating")
    overshoot = total_before / TARGET_TRIANGLES
    scale = 1.0 / overshoot
    for o in objs:
        local_ratio = decimate_ratio_for(o.name) * scale * 1.4  # +40% headroom
        local_ratio = max(0.03, min(local_ratio, 0.95))
        mod = o.modifiers.new(name="dec", type="DECIMATE")
        mod.ratio = local_ratio
        mod.decimate_type = "COLLAPSE"
        bpy.context.view_layer.objects.active = o
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except RuntimeError as e:
            print(f"  apply failed on {o.name}: {e}")
    total_after = sum(triangle_count(o) for o in mesh_objects())
    print(f"  triangles: {total_before:,}  ->  {total_after:,} ({total_after / total_before * 100:.1f}%)")


# ---------------------------------------------------------------------------
# Stage 4 - verify / set up Principled BSDF materials
# ---------------------------------------------------------------------------
def ensure_pbr_material(obj):
    if obj.data.materials and obj.data.materials[0]:
        mat = obj.data.materials[0]
        if mat.use_nodes:
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf is not None:
                return  # already a Principled material -- leave as-is
    low = obj.name.lower()
    mat_name = f"M_{obj.name}"
    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return
    if "windshield" in low or "rearwindow" in low or "window" in low or "glass" in low:
        bsdf.inputs["Base Color"].default_value = (0.02, 0.04, 0.06, 1.0)
        bsdf.inputs["Transmission Weight"].default_value = 1.0
        bsdf.inputs["IOR"].default_value = 1.45
        bsdf.inputs["Roughness"].default_value = 0.05
        mat.blend_method = "BLEND"
    elif "chrome" in low or "rim" in low or "wheel" in low:
        bsdf.inputs["Base Color"].default_value = (0.85, 0.85, 0.88, 1.0)
        bsdf.inputs["Metallic"].default_value = 1.0
        bsdf.inputs["Roughness"].default_value = 0.05
    elif "tire" in low or "gum_" in low or "rubber" in low:
        bsdf.inputs["Base Color"].default_value = (0.04, 0.04, 0.04, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.7
    elif "headlight" in low or "taillight" in low or "led" in low:
        bsdf.inputs["Base Color"].default_value = (0.9, 0.9, 0.9, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.15
        try:
            bsdf.inputs["Emission Color"].default_value = (0.95, 0.95, 0.9, 1.0)
            bsdf.inputs["Emission Strength"].default_value = 0.6
        except KeyError:
            pass
    elif "plastic" in low:
        bsdf.inputs["Base Color"].default_value = (0.06, 0.06, 0.06, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.85
    else:
        # default = body paint
        bsdf.inputs["Base Color"].default_value = (0.78, 0.78, 0.80, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.9
        bsdf.inputs["Roughness"].default_value = 0.25
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def verify_materials():
    objs = mesh_objects()
    fixed = 0
    for o in objs:
        before = o.data.materials[0].name if o.data.materials and o.data.materials[0] else "(none)"
        ensure_pbr_material(o)
        after = o.data.materials[0].name if o.data.materials and o.data.materials[0] else "(none)"
        if before != after:
            fixed += 1
    print(f"  Principled BSDF assigned to {fixed} meshes (others already had usable materials)")


# ---------------------------------------------------------------------------
# Stage 5 - export to GLB with Draco compression
# ---------------------------------------------------------------------------
def export_glb(path):
    print(f"  exporting -> {path}")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=True,
        export_yup=True,
    )
    if path.exists():
        size_mb = path.stat().st_size / (1024 * 1024)
        print(f"  done. final size = {size_mb:.2f} MB")


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------
def main():
    banner("LC200 prep pipeline")
    print(f"source: {SOURCE_GLB}")
    print(f"output: {OUTPUT_GLB}")
    if not SOURCE_GLB.exists():
        print(f"  ERROR: source file missing -- check the SOURCE_GLB path at the top of this script")
        return

    banner("Stage 0 -- reset scene")
    reset_scene()

    banner("Stage 0 -- import GLB")
    import_glb(SOURCE_GLB)

    banner("Stage 1 -- diagnostic dump (BEFORE prep)")
    print_diagnostics()

    banner("Stage 2 -- separate welded bodies (if needed)")
    separate_welded_meshes()

    banner("Stage 3 -- auto-rename by keyword + position")
    auto_rename()

    banner("Stage 4 -- decimate if over budget")
    decimate_to_budget()

    banner("Stage 5 -- verify / build PBR materials")
    verify_materials()

    banner("Stage 6 -- diagnostic dump (AFTER prep)")
    print_diagnostics()

    banner("Stage 7 -- export to GLB with Draco")
    export_glb(OUTPUT_GLB)

    banner("PIPELINE COMPLETE")


if __name__ == "__main__":
    main()
