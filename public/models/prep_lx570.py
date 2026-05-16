"""
prep_lx570.py - Blender prep script for the LX570 GLB
=====================================================

Opens lx570.glb, prints a full diagnostic of every mesh, auto-separates any
welded body it finds, renames meshes based on their 3D position and on any
semantic keywords already baked into the source names, decimates if the total
triangle count exceeds 150 000, ensures every mesh has a usable PBR material,
and exports to lx570-ready.glb with Draco compression.

How to run
----------
1. Open Blender.
2. Switch to the "Scripting" workspace tab at the top of the window.
3. Click "Open" inside the text editor area and pick this file.
4. Click "Run Script". Watch progress in the System Console
   (Window menu -> Toggle System Console on Windows).
5. The finished file appears next to the source as lx570-ready.glb.

PRE-RUN NOTE - model structure
------------------------------
This GLB was confirmed by the Session 6 inspector to be a *real* 2016 Lexus
LX 570 (J200 platform). The mesh names all embed
"_2016_Lexus_LX570__1_1_Lexus_LX570_2016". The source is heavily over-fragmented
(1,617 mesh objects), so after this script runs you'll still see many
similarly-named entries in Blender's Outliner -- that is by design. The
renamer collapses common roles (Door_FL, Headlight, etc.) onto base names plus
an auto-incrementing suffix; you can manually merge same-labelled meshes later
in Blender if you want a flatter scene tree.

Keyword cheat-sheet for the source name conventions:
  door_lf1 / door_rf1 / door_lr1 / door_rr1   -> doors
  FARA_J1 / FARA_f3_1                         -> headlights (Russian transliteration)
  boot1                                       -> tailgate (UK English)
  chassis1                                    -> underbody / chassis
  bumper1                                     -> front/rear bumper
  dvor / dvorright1                           -> wipers
  gum_001 / gum_002                           -> tires
  NEON                                        -> LED accents
"""

import math
from pathlib import Path

import bpy
from mathutils import Vector


# ---------------------------------------------------------------------------
# Config - edit these two paths if your project lives elsewhere
# ---------------------------------------------------------------------------
SOURCE_GLB = Path(r"C:/gs website/gs-autocenter/public/models/lx570.glb")
OUTPUT_GLB = Path(r"C:/gs website/gs-autocenter/public/models/lx570-ready.glb")

TARGET_TRIANGLES = 150_000
HEAVY_DECIMATE_RATIO = 0.20
LIGHT_DECIMATE_RATIO = 0.55
NORMAL_DECIMATE_RATIO = 0.35

NAME_KEYWORDS = [
    # body / exterior shell
    (["hood", "bonnet"], "Hood"),
    (["roof"], "Roof"),
    (["bumper1", "front_bumper", "frontbumper", "bumper_f"], "Bumper_F"),
    (["bumper2", "rear_bumper", "rearbumper", "bumper_r"], "Bumper_R"),
    (["front_fender", "fender_f"], "Fender_F"),
    (["rear_fender", "fender_r"], "Fender_R"),
    (["boot1", "tailgate", "trunk", "boot_"], "Tailgate"),
    (["chassis"], "Chassis"),
    # glass
    (["windshield", "windscreen", "frontglass"], "Windshield"),
    (["rearwindow", "rearglass"], "RearWindow"),
    (["window-material", "window_"], "Window"),
    (["lamp_glass"], "Lamp_Glass"),
    # doors (LX570 uses door_lf1, door_rf1, door_lr1, door_rr1)
    (["door_lf"], "Door_FL"),
    (["door_rf"], "Door_FR"),
    (["door_lr"], "Door_RL"),
    (["door_rr"], "Door_RR"),
    (["door_"], "Door"),
    # wheels and brakes
    (["rims_2", "rim_", "wheel"], "Wheel"),
    (["gum_001"], "Tire_RR"),
    (["gum_002"], "Tire_RL"),
    (["gum_003"], "Tire_FR"),
    (["gum_000"], "Tire_FL"),
    (["tire", "tyre", "gum_"], "Tire"),
    (["brake_disc", "disc_"], "Brake_Disc"),
    # lights
    (["fara_j", "fara_f", "fara_"], "Headlight"),
    (["light_led", "led_"], "LED"),
    (["neon"], "Neon_Accent"),
    (["taillight", "tail_light", "rearlight"], "Taillight"),
    # interior / controls
    (["steer"], "Steering_Wheel"),
    (["dashboard", "ice_intere"], "Dashboard"),
    (["seat"], "Seat"),
    (["mirror"], "Mirror"),
    (["dvorright", "dvor", "wiper"], "Wiper"),
    # mechanicals
    (["exhaust", "vihlop"], "Exhaust"),
    (["engine"], "Engine"),
    (["radiator"], "Radiator"),
    (["battery"], "Battery"),
    (["fuel_tank"], "Fuel_Tank"),
    (["dno"], "Underbody"),
    (["plate"], "License_Plate"),
    (["logo", "badge"], "Badge"),
    # material-grouping fallbacks (the LX570 has heavy per-material fragmentation)
    (["chrome-material", "chrome_"], "Chrome_Trim"),
    (["body_color"], "Body_Panel"),
    (["black_plastic_matt"], "Plastic_Matte"),
    (["black_plastic_gloss"], "Plastic_Gloss"),
    (["internal-material", "internal_"], "Interior_Trim"),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def banner(text):
    bar = "=" * 78
    print(f"\n{bar}\n{text}\n{bar}")


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def import_glb(path):
    print(f"Importing {path}")
    bpy.ops.import_scene.gltf(filepath=str(path))


def mesh_objects():
    return [o for o in bpy.data.objects if o.type == "MESH"]


def triangle_count(obj):
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
    if scene_size.x >= scene_size.y:
        return 0, 1, 2
    return 1, 0, 2


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
    return None


def auto_rename():
    objs = mesh_objects()
    if not objs:
        return
    mn, mx = scene_bbox(objs)
    f_idx, s_idx, u_idx = detect_axes(mx - mn)
    print(f"  forward axis = {'XYZ'[f_idx]}, side axis = {'XYZ'[s_idx]}")
    used_counts = {}
    renamed = 0
    sample_printed = 0
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
        if sample_printed < 80:
            print(f"  rename: {o.name[:50]:<50}  ->  {new_name}")
            sample_printed += 1
        o.name = new_name
        renamed += 1
    if sample_printed >= 80 and renamed > 80:
        print(f"  ... and {renamed - 80} more renames (LX570 is heavily fragmented)")
    print(f"  renamed {renamed} of {len(objs)} mesh objects")
    print(f"  unique labels in use: {len(used_counts)}")


# ---------------------------------------------------------------------------
# Stage 3 - decimate if total triangles > target
# ---------------------------------------------------------------------------
def decimate_ratio_for(name):
    low = name.lower()
    if any(k in low for k in ["hood", "door", "bumper_f", "headlight",
                                "windshield", "fender_f", "dashboard",
                                "steer", "wheel", "rim", "tire", "gum_"]):
        return LIGHT_DECIMATE_RATIO
    if any(k in low for k in ["underside", "_area", "bottom", "chassis",
                                "exhaust", "fuel", "radiator", "dno"]):
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
        local_ratio = decimate_ratio_for(o.name) * scale * 1.4
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
                return
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
    elif "headlight" in low or "taillight" in low or "led" in low or "neon" in low:
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
    banner("LX570 prep pipeline")
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
