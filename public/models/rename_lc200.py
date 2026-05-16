"""
rename_lc200.py - position-based mesh rename for LC200
======================================================

The David_Holiday LC200 GLB has generic mesh names (Material2.NNN /
Material3.NNN). The prep_lc200.py script's keyword-based renamer couldn't
hook onto them. This follow-up uses concrete coordinate landmarks from
the Session 11 inspection report to rename the major clickable parts:

  Wheel_FL / FR / RL / RR  - 4 cluster anchors at known XY positions
  Hood                     - largest mesh in front + top region
  Body_Panel               - any mesh with material name 'body'
  Window                   - any mesh with material name 'tinted_window' / 'windows'
  Headlight_L / R          - front-area high-Z meshes, side by X
  Taillight_L / R          - rear-area meshes, side by X

Open lc200-ready.glb, rename, write back to the same file with Draco.

Run:
  blender --background --python rename_lc200.py
"""

import math
from pathlib import Path

import bpy
from mathutils import Vector


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PATH = Path(r"C:/gs website/gs-autocenter/public/models/lc200-ready.glb")

# Landmarks in LC200's coordinate space (from Session 11 inspection)
WHEEL_ANCHORS = {
    "Wheel_FL": (-371.0, 180.0),  # negative X = left, low Y = front
    "Wheel_FR": ( -63.0, 180.0),
    "Wheel_RL": (-371.0, 725.0),
    "Wheel_RR": ( -63.0, 725.0),
}
WHEEL_XY_RADIUS = 80.0   # cluster radius in XY plane
WHEEL_Z_MAX     = 160.0  # wheels live below this z

BODY_CENTER_X   = -217.0  # body shell midline
FRONT_Y_MAX     = 260.0   # y < this == front of vehicle
REAR_Y_MIN      = 880.0   # y > this == rear of vehicle

HEADLIGHT_Z_MIN = 220.0   # high-z front meshes = headlight assemblies
TAILLIGHT_Z_MIN = 180.0   # taillights span this range...
TAILLIGHT_Z_MAX = 320.0   # ...vertically

HOOD_FRONT_Y_MAX = 350.0  # hood extends back from front bumper
HOOD_TOP_Z_MIN   = 220.0  # hood is on top of engine bay


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def banner(t):
    bar = "=" * 78
    print(f"\n{bar}\n{t}\n{bar}")


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def world_center(obj):
    m = obj.matrix_world
    cs = [m @ Vector(c) for c in obj.bound_box]
    return Vector((
        sum(c.x for c in cs) / 8.0,
        sum(c.y for c in cs) / 8.0,
        sum(c.z for c in cs) / 8.0,
    ))


def tri_count(obj):
    dg = bpy.context.evaluated_depsgraph_get()
    em = obj.evaluated_get(dg).to_mesh()
    t = sum(len(p.vertices) - 2 for p in em.polygons)
    obj.evaluated_get(dg).to_mesh_clear()
    return t


def material_name(obj):
    if obj.data.materials and obj.data.materials[0]:
        return obj.data.materials[0].name
    return None


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------
banner("Loading LC200 GLB")
print(f"path: {PATH}")
if not PATH.exists():
    print("ERROR: file missing")
    raise SystemExit(1)
reset_scene()
bpy.ops.import_scene.gltf(filepath=str(PATH))
meshes = [o for o in bpy.data.objects if o.type == "MESH"]
print(f"loaded {len(meshes)} mesh objects")


banner("Indexing mesh centers + tri counts")
mesh_info = []
for o in meshes:
    c = world_center(o)
    t = tri_count(o)
    m = material_name(o) or ""
    mesh_info.append((o, c, t, m))


banner("Classifying by position + material")
planned = {}
assigned = set()


def assign(obj, label):
    planned.setdefault(label, []).append(obj)
    assigned.add(obj)


# Priority 1 - wheel clusters (z < WHEEL_Z_MAX, near one of 4 anchors)
wheel_hits = 0
for o, c, t, m in mesh_info:
    if c.z > WHEEL_Z_MAX:
        continue
    best, best_dist = None, math.inf
    for label, (ax, ay) in WHEEL_ANCHORS.items():
        d = math.hypot(c.x - ax, c.y - ay)
        if d < best_dist:
            best, best_dist = label, d
    if best is not None and best_dist <= WHEEL_XY_RADIUS:
        assign(o, best)
        wheel_hits += 1
print(f"  wheel clusters: {wheel_hits} mesh(es) tagged")


# Priority 2 - tinted_window / windows material -> Window
window_hits = 0
for o, c, t, m in mesh_info:
    if o in assigned:
        continue
    if m in ("tinted_window", "windows"):
        assign(o, "Window")
        window_hits += 1
print(f"  Window: {window_hits} mesh(es) tagged")


# Priority 3 - body material -> Body_Panel
body_hits = 0
for o, c, t, m in mesh_info:
    if o in assigned:
        continue
    if m == "body":
        assign(o, "Body_Panel")
        body_hits += 1
print(f"  Body_Panel: {body_hits} mesh(es) tagged")


# Priority 4 - headlights (front area, high Z)
headlight_hits = 0
for o, c, t, m in mesh_info:
    if o in assigned:
        continue
    if c.y <= FRONT_Y_MAX and c.z >= HEADLIGHT_Z_MIN:
        label = "Headlight_L" if c.x < BODY_CENTER_X else "Headlight_R"
        assign(o, label)
        headlight_hits += 1
print(f"  Headlight_*: {headlight_hits} mesh(es) tagged")


# Priority 5 - taillights (rear area, mid-upper Z)
taillight_hits = 0
for o, c, t, m in mesh_info:
    if o in assigned:
        continue
    if c.y >= REAR_Y_MIN and TAILLIGHT_Z_MIN <= c.z <= TAILLIGHT_Z_MAX:
        label = "Taillight_L" if c.x < BODY_CENTER_X else "Taillight_R"
        assign(o, label)
        taillight_hits += 1
print(f"  Taillight_*: {taillight_hits} mesh(es) tagged")


# Priority 6 - HOOD - largest unclassified mesh in front + top region
hood_candidates = [
    (o, c, t, m) for (o, c, t, m) in mesh_info
    if o not in assigned and c.y <= HOOD_FRONT_Y_MAX and c.z >= HOOD_TOP_Z_MIN
]
if hood_candidates:
    biggest = max(hood_candidates, key=lambda x: x[2])
    print(f"  Hood candidates in front+top zone: {len(hood_candidates)}, "
          f"largest is {biggest[0].name!r} with {biggest[2]:,} tris")
    assign(biggest[0], "Hood")
else:
    print(f"  Hood: no candidate found in front+top zone")


banner("Applying renames")
total_renamed = 0
for label in sorted(planned.keys()):
    objs = planned[label]
    objs.sort(key=lambda o: -tri_count(o))
    for i, o in enumerate(objs):
        new_name = label if i == 0 else f"{label}_{i + 1:02d}"
        if i < 6 or i == len(objs) - 1:
            print(f"  rename: {o.name[:36]:<36}  ->  {new_name}")
        o.name = new_name
        total_renamed += 1
    if len(objs) > 7:
        print(f"            ... ({len(objs)} meshes total under {label})")
print(f"\nrenamed {total_renamed} of {len(meshes)} meshes")


banner("Expected-labels audit")
expected = [
    "Wheel_FL", "Wheel_FR", "Wheel_RL", "Wheel_RR",
    "Hood", "Body_Panel", "Window",
    "Headlight_L", "Headlight_R",
    "Taillight_L", "Taillight_R",
]
all_ok = True
for label in expected:
    n = len(planned.get(label, []))
    flag = "OK     " if n > 0 else "MISSING"
    print(f"  {flag}  {label:14s}  count={n}")
    if n == 0:
        all_ok = False
print()
print("ALL EXPECTED LABELS PRESENT" if all_ok else "SOME LABELS MISSING - see audit")


banner("Final mesh-name distribution (top 20 prefixes)")
counts = {}
for o in (x for x in bpy.data.objects if x.type == "MESH"):
    base = o.name
    while base and (base[-1].isdigit() or base[-1] in "._"):
        base = base[:-1]
    counts[base] = counts.get(base, 0) + 1
for k in sorted(counts, key=lambda x: -counts[x])[:20]:
    print(f"  {counts[k]:5d}  {k}")


banner("Exporting back to GLB with Draco")
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=str(PATH),
    export_format="GLB",
    use_selection=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_apply=True,
    export_yup=True,
)
print(f"saved -> {PATH}")
if PATH.exists():
    print(f"size: {PATH.stat().st_size:,} bytes")


banner("DONE")
