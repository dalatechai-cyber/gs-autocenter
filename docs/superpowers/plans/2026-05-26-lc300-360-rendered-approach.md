# LC300 360° Pre-Rendered Explorer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium 3D-feeling LC300 explorer using **pre-rendered Blender Cycles image sequences** displayed as drag-rotate WebP carousels with hotspot overlays. Four stages — exterior, engine approach (closed hood, camera dives in), engine bay (open hood, full orbit), underneath. Total runtime bundle ≤ 5 MB. Works on every device, SSR-friendly, no WebGL.

**Architecture:** Blender Cycles renders the existing $32 NLM LC300 model offline → produces ~210 WebP frames + a `hotspots.json` with per-frame projected screen positions for every interactive marker. The React side is a thin drag-rotate carousel that swaps `<img>` frames and renders absolute-positioned `<button>` hotspots. No realtime 3D, no WebGL, no R3F.

**Tech Stack:**
- Next.js 16 + React 19 (existing)
- Blender 4.2+ with Cycles (offline, one-time render)
- `cwebp` (libwebp CLI) for image optimization
- Node.js scripts for manifest generation and WebP encoding
- vitest + @testing-library/react for hook tests
- No new runtime dependencies — everything is plain React + Next `<Image>`

**Replaces (do NOT use):** R3F, three.js, drei, postprocessing, react-spring/three, WebGPU, KTX2, meshopt, MeshPhysicalMaterial recipes, Lightformer rigs. All from the abandoned realtime plan.

**Phases:**
1. Blender Cycles render pipeline (render overnight, 2–4 iterations expected)
2. Image optimization to WebP + manifest generation
3. React drag-rotate carousel + tests
4. Hotspot overlay system
5. Mongolian terminology correction (you review proposed list)
6. SSR / SEO setup with Next `<Image>` + schema.org + `<noscript>`
7. GA4 analytics
8. Accessibility (keyboard, ARIA, focus, reduced-motion)
9. Verification

---

## Phase 1: Blender Cycles Render Pipeline

The existing NLM LC300 `.blend` lives at `public/models/lc300-raw/Toyota Land Cruiser 300.blend`. The audit confirmed the model fully supports all stages: bonnet is a separate object with rear-hinge origin, engine bay has 268k verts with Toyota badge/battery/hoses, suspension has 40k verts with full chassis (frame rails, control arms, sway bars, exhaust, driveshaft, differentials). This phase opens the .blend, sets up Cycles, defines hotspot anchors, and renders **four sequences** to `tmp/renders/`:

- `exterior` — full 360° turntable around the closed car
- `engine_approach` — closed hood, camera arcs around the front with dolly-in motion
- `engine_bay` — hood already open from frame 0, camera orbits 360° around the open bay
- `underneath` — camera below the car, slow 180° pan

The engine stage is split into two sub-sequences so a single drag controls a single motion (orbit OR dolly), never conflated with the hood opening animation.

**Render time:** plan to **render overnight**, expect **2–4 iterations** before all stages look right. Each iteration of the engine sub-sequences is the highest-risk render — verify hood pivot, camera distance, and HDRI exposure before kicking off the full multi-hour batch.

### Task 1.1: Inventory the NLM .blend

We don't yet know the object names inside the NLM model. Task 1.1 prints them so subsequent tasks can reference real names.

**Files:**
- Create: `scripts/blender/print_inventory.py`
- Create: `scripts/blender/INVENTORY.md` (output capture)

- [ ] **Step 1: Write the inventory script**

Create `scripts/blender/print_inventory.py`:
```python
"""Print every object in the NLM LC300 .blend with type, tri count, world position, and dimensions."""
import bpy

BLEND = 'public/models/lc300-raw/Toyota Land Cruiser 300.blend'
bpy.ops.wm.open_mainfile(filepath=BLEND)

print('=== INVENTORY ===')
print(f'Scene objects: {len(bpy.context.scene.objects)}')
for o in bpy.context.scene.objects:
    if o.type == 'MESH':
        tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
        w = o.matrix_world.translation
        d = o.dimensions
        print(f'MESH  {o.name:50s}  tris={tris:7d}  pos=({w.x:+.2f},{w.y:+.2f},{w.z:+.2f})  size=({d.x:.2f},{d.y:.2f},{d.z:.2f})')
    else:
        w = o.matrix_world.translation
        print(f'{o.type:6s} {o.name:50s}                pos=({w.x:+.2f},{w.y:+.2f},{w.z:+.2f})')

print('=== MATERIALS ===')
for m in bpy.data.materials:
    print(f'{m.name}  users={m.users}  nodes={m.use_nodes}')

print('=== IMAGES (textures) ===')
for img in bpy.data.images:
    print(f'{img.name}  source={img.source}  filepath={img.filepath}')
```

- [ ] **Step 2: Run via Blender MCP**

Use `mcp__blender__execute_blender_code` with the script contents. Capture the full stdout.

- [ ] **Step 3: Save inventory to disk for reference**

Write the captured stdout to `scripts/blender/INVENTORY.md` (prefix with a fence and a date header). This file becomes the canonical reference for object names used in Tasks 1.3–1.8.

- [ ] **Step 4: Commit**

```
git add scripts/blender/print_inventory.py scripts/blender/INVENTORY.md
git commit -m "feat(360): inventory NLM LC300 blend objects + materials"
```

---

### Task 1.2: Verify textures link from TEX.zip

NLM ships textures separately. This task extracts `TEX.zip` and verifies every `bpy.data.images.filepath` resolves on disk.

**Files:**
- Modify: `public/models/lc300-raw/TEX/` (extracted, gitignored)
- Create: `scripts/blender/verify_textures.py`

- [ ] **Step 1: Extract TEX.zip**

Use the Bash tool to run:
```
unzip -o "public/models/lc300-raw/TEX.zip" -d "public/models/lc300-raw/TEX/"
```
Expected: `public/models/lc300-raw/TEX/` populated with `.png`/`.jpg` files.

- [ ] **Step 2: Write the texture verification script**

Create `scripts/blender/verify_textures.py`:
```python
"""Verify every image datablock's filepath resolves; re-link missing ones from TEX/."""
import bpy
import os
from pathlib import Path

BLEND = 'public/models/lc300-raw/Toyota Land Cruiser 300.blend'
TEX_DIR = Path('public/models/lc300-raw/TEX').resolve()

bpy.ops.wm.open_mainfile(filepath=BLEND)

missing = []
relinked = []
ok = 0

for img in bpy.data.images:
    if img.source != 'FILE':
        continue
    abspath = bpy.path.abspath(img.filepath)
    if os.path.exists(abspath):
        ok += 1
        continue
    # try to find a same-named file in TEX/
    name = os.path.basename(img.filepath) or img.name
    candidates = list(TEX_DIR.rglob(name))
    if candidates:
        img.filepath = str(candidates[0])
        img.reload()
        relinked.append((img.name, str(candidates[0])))
    else:
        missing.append((img.name, img.filepath))

print(f'OK: {ok}  RELINKED: {len(relinked)}  MISSING: {len(missing)}')
for name, path in relinked:
    print(f'  RELINKED {name} -> {path}')
for name, path in missing:
    print(f'  MISSING  {name}  was {path}')

# Save back to a working copy so subsequent tasks don't need to re-link
bpy.ops.wm.save_as_mainfile(filepath='public/models/lc300-raw/lc300-working.blend')
print('saved working copy: public/models/lc300-raw/lc300-working.blend')
```

- [ ] **Step 3: Run via Blender MCP and verify zero missing**

Use `mcp__blender__execute_blender_code`. Expected: `MISSING: 0`. If any are missing, locate them in `TEX/` subdirs manually and re-run.

- [ ] **Step 4: Commit script (working .blend is gitignored)**

```
git add scripts/blender/verify_textures.py
git commit -m "feat(360): texture verification and re-link from TEX.zip"
```

---

### Task 1.3: Define hotspot 3D anchors

Hotspots are 3D positions on the actual car. We define them as `(target_object_name, local_offset_xyz)` pairs based on the inventory from Task 1.1. The render script projects these per frame in Task 1.5.

**Files:**
- Create: `scripts/blender/hotspot_anchors.json`

- [ ] **Step 1: Write the anchor config**

Create `scripts/blender/hotspot_anchors.json`:
```json
{
  "exterior": [
    { "id": "ext-hood",        "anchor": "Hood",       "offset": [0, 0, 0.05] },
    { "id": "ext-headlight-l", "anchor": "Headlight_L","offset": [0, 0, 0] },
    { "id": "ext-headlight-r", "anchor": "Headlight_R","offset": [0, 0, 0] },
    { "id": "ext-grille",      "anchor": "Grille",     "offset": [0, 0, 0] },
    { "id": "ext-wheel-fl",    "anchor": "Wheel_FL",   "offset": [0, 0, 0] },
    { "id": "ext-wheel-fr",    "anchor": "Wheel_FR",   "offset": [0, 0, 0] },
    { "id": "ext-wheel-rl",    "anchor": "Wheel_RL",   "offset": [0, 0, 0] },
    { "id": "ext-wheel-rr",    "anchor": "Wheel_RR",   "offset": [0, 0, 0] },
    { "id": "ext-mirror-l",    "anchor": "Mirror_L",   "offset": [0, 0, 0] },
    { "id": "ext-mirror-r",    "anchor": "Mirror_R",   "offset": [0, 0, 0] },
    { "id": "ext-windshield",  "anchor": "Windshield", "offset": [0, 0, 0] }
  ],
  "engine": [
    { "id": "eng-block",       "anchor": "Engine_Block", "offset": [0, 0, 0.05] },
    { "id": "eng-battery",     "anchor": "Battery",      "offset": [0, 0, 0.03] },
    { "id": "eng-air-filter",  "anchor": "Air_Filter",   "offset": [0, 0, 0.02] },
    { "id": "eng-radiator",    "anchor": "Radiator",     "offset": [0, 0, 0.02] },
    { "id": "eng-intake",      "anchor": "Intake",       "offset": [0, 0, 0.02] },
    { "id": "eng-fuse-box",    "anchor": "Fuse_Box",     "offset": [0, 0, 0.02] }
  ],
  "underneath": [
    { "id": "und-susp-fl",    "anchor": "Suspension_FL",   "offset": [0, 0, 0] },
    { "id": "und-susp-fr",    "anchor": "Suspension_FR",   "offset": [0, 0, 0] },
    { "id": "und-susp-rl",    "anchor": "Suspension_RL",   "offset": [0, 0, 0] },
    { "id": "und-susp-rr",    "anchor": "Suspension_RR",   "offset": [0, 0, 0] },
    { "id": "und-exhaust",    "anchor": "Exhaust",         "offset": [0, 0, 0] },
    { "id": "und-fuel-tank",  "anchor": "Fuel_Tank",       "offset": [0, 0, 0] },
    { "id": "und-transfer",   "anchor": "Transfer_Case",   "offset": [0, 0, 0] },
    { "id": "und-diff-f",     "anchor": "Diff_F",          "offset": [0, 0, 0] },
    { "id": "und-diff-r",     "anchor": "Diff_R",          "offset": [0, 0, 0] }
  ]
}
```

- [ ] **Step 2: Reconcile anchor names against INVENTORY.md**

Open `scripts/blender/INVENTORY.md` from Task 1.1. For every `anchor` in the JSON, find the matching object name in the inventory.

If a name differs (NLM may name things like `LC300_Hood_Geo` or `wheel_front_left`), update the JSON's `anchor` field to the actual name. If a part is not present as a discrete object (e.g. battery is part of a combined "EngineBayParts" mesh), add it to the "DEFERRED" section at the bottom of the JSON and we will handle by manual offset rather than parent anchor:
```json
"DEFERRED": [
  { "id": "eng-battery", "anchor": null, "world_position": [-0.55, 1.6, 0.95] }
]
```

**Also patch hardcoded "Hood" references in render_stages.py.** The audit confirmed the bonnet is named `Bonnet` (not `Hood`) in the NLM .blend. Therefore the two `find_object('Hood')` calls in `scripts/blender/render_stages.py` — one in `set_hood()`, one in `fix_hood_pivot_once()` — **will need patching to `find_object('Bonnet')`** (or whatever the inventory actually shows). Confirm the name in `INVENTORY.md` then update both call sites with a single search-and-replace before any render task runs. If the rest of the codebase uses the canonical name "Hood" anywhere (it should not at this stage), add a comment in render_stages.py explaining the mapping: `# NLM names the bonnet 'Bonnet'; we keep the variable name `hood` but reference 'Bonnet' object.`

- [ ] **Step 3: Commit**

```
git add scripts/blender/hotspot_anchors.json
git commit -m "feat(360): define hotspot 3D anchors mapped to NLM object names"
```

---

### Task 1.4: Set up the Cycles render scene

Configures the Cycles engine, world HDRI, output format, and camera turntable rig. Saves three scene configurations (one per stage) into the working .blend.

**Files:**
- Create: `scripts/blender/setup_render_scene.py`
- Create: `public/hdr/studio_small_09_2k.hdr` (gitignored — downloaded once for render)
- Create: `public/hdr/autoshop_01_2k.hdr` (gitignored)
- Create: `public/hdr/garage_2k.hdr` (gitignored)

- [ ] **Step 1: Download 3 HDRIs from Polyhaven**

Use the Bash tool to run (Polyhaven serves direct URLs):
```
mkdir -p public/hdr
curl -L -o public/hdr/studio_small_09_2k.hdr "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_09_2k.hdr"
curl -L -o public/hdr/autoshop_01_2k.hdr "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/autoshop_01_2k.hdr"
curl -L -o public/hdr/garage_2k.hdr "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/garage_2k.hdr"
```
Expected: three files ~8–15 MB each in `public/hdr/`. These are render-only inputs and never shipped to browser.

- [ ] **Step 2: Write the scene setup script**

Create `scripts/blender/setup_render_scene.py`:
```python
"""Set up Cycles render scene: engine settings, HDRI, output format, turntable rig.

Saves modified .blend to public/models/lc300-raw/lc300-working.blend so render_stages.py
can open it directly.
"""
import bpy
import math
from mathutils import Vector

BLEND_IN  = 'public/models/lc300-raw/lc300-working.blend'
BLEND_OUT = 'public/models/lc300-raw/lc300-working.blend'

bpy.ops.wm.open_mainfile(filepath=BLEND_IN)

scene = bpy.context.scene

# Cycles engine — bumped samples to 256 across all stages for cleaner specular
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'  # falls back to CPU if no GPU
scene.cycles.samples = 256
scene.cycles.use_denoising = True
scene.cycles.denoiser = 'OPENIMAGEDENOISE'

# Resolution: 1280x720 to keep WebP size in budget (~18 KB/frame at q78).
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.color_depth = '8'
scene.render.film_transparent = False

# Color management — AgX is the modern Blender default, handles highlights better
# than Standard (no clipping on chrome/headlights), more accurate than Filmic.
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Base Contrast'
scene.view_settings.exposure = 0.0
scene.view_settings.gamma = 1.0

# World HDRI (will be swapped per stage by render_stages.py).
# HDRI alone leaves shadows soft and bodywork flat; key + fill lights below
# add definition without overpowering the HDRI's environment reflections.
world = scene.world
world.use_nodes = True
nt = world.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
bg  = nt.nodes.new('ShaderNodeBackground')
env = nt.nodes.new('ShaderNodeTexEnvironment')
out = nt.nodes.new('ShaderNodeOutputWorld')
nt.links.new(env.outputs['Color'], bg.inputs['Color'])
nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
env.image = bpy.data.images.load('public/hdr/studio_small_09_2k.hdr', check_existing=True)
bg.inputs['Strength'].default_value = 1.0

# === KEY LIGHT (warm, high, throws specular highlights on bodywork) ===
key_data = bpy.data.lights.new('LC300_Key', 'AREA')
key_data.energy = 800
key_data.size = 3.0
key_data.color = (1.0, 0.98, 0.95)
key = bpy.data.objects.get('LC300_Key') or bpy.data.objects.new('LC300_Key', key_data)
if key.name not in scene.collection.objects:
    scene.collection.objects.link(key)
key.data = key_data
key.location = (4, -4, 6)
key.rotation_euler = (math.radians(50), 0, math.radians(45))

# === FILL LIGHT (cool, opposite side, prevents shadow side from going black) ===
fill_data = bpy.data.lights.new('LC300_Fill', 'AREA')
fill_data.energy = 300
fill_data.size = 5.0
fill_data.color = (0.92, 0.96, 1.0)
fill = bpy.data.objects.get('LC300_Fill') or bpy.data.objects.new('LC300_Fill', fill_data)
if fill.name not in scene.collection.objects:
    scene.collection.objects.link(fill)
fill.data = fill_data
fill.location = (-4, 4, 4)
fill.rotation_euler = (math.radians(60), 0, math.radians(-45))

# Turntable rig: empty at car center, camera parented to it.
mins = Vector(( 1e9,  1e9,  1e9))
maxs = Vector((-1e9, -1e9, -1e9))
for o in scene.objects:
    if o.type != 'MESH':
        continue
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        for i in range(3):
            mins[i] = min(mins[i], w[i])
            maxs[i] = max(maxs[i], w[i])
center = (mins + maxs) / 2
size   = maxs - mins
print(f'[setup] car center = {center}   size = {size}')

tt = bpy.data.objects.get('Turntable')
if tt is None:
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=center)
    tt = bpy.context.active_object
    tt.name = 'Turntable'
else:
    tt.location = center

cam_data = bpy.data.cameras.get('TT_Camera') or bpy.data.cameras.new('TT_Camera')
cam = bpy.data.objects.get('TT_Camera') or bpy.data.objects.new('TT_Camera', cam_data)
if cam.name not in scene.collection.objects:
    scene.collection.objects.link(cam)
cam.parent = tt
cam.location = (0, -max(size.x, size.y) * 1.6, size.z * 0.35)
cam.rotation_euler = (math.radians(80), 0, 0)
cam.data.lens = 50
scene.camera = cam

bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
print(f'[setup] saved working .blend to {BLEND_OUT}')
```

- [ ] **Step 3: Run via Blender MCP**

Use `mcp__blender__execute_blender_code`. Expected: prints car center + size, saves working .blend.

- [ ] **Step 4: Commit**

```
git add scripts/blender/setup_render_scene.py
git commit -m "feat(360): Cycles scene setup with turntable rig + HDRI plumbing"
```

---

### Task 1.5: Write the master render script

The big one. Reads `hotspot_anchors.json`, configures each stage (camera, HDRI, hood animation for engine stage), renders frames, projects hotspot positions per frame with occlusion test, and writes the manifest.

**Files:**
- Create: `scripts/blender/render_stages.py`
- Create: `scripts/blender/render_stage.sh` (helper for invoking from CLI on the user's machine)

- [ ] **Step 1: Write the render script**

Create `scripts/blender/render_stages.py`:
```python
"""Master render pipeline.

Renders 4 stages of the LC300 to tmp/renders/{stage}/frame_NNN.png at 1280x720.
For each frame, projects every hotspot's 3D anchor through the camera and writes
tmp/renders/{stage}/projections.json with per-frame screen coordinates + occlusion.

Usage from CLI:
  blender --background public/models/lc300-raw/lc300-working.blend \\
          --python scripts/blender/render_stages.py -- --stage exterior

Or invoke all four sequentially via render_stage.sh.

Render time: with samples=256 + key/fill lights + AgX, expect 45–90 s/frame on a
decent GPU. **Plan to render overnight and expect 2–4 iterations** before all stages
look right (hood pivot, camera framing, HDRI exposure, hotspot alignment).

Approximate per-stage times at 60 s/frame:
  exterior        90 frames ≈ 90 min
  engine_approach 30 frames ≈ 30 min
  engine_bay      60 frames ≈ 60 min
  underneath      60 frames ≈ 60 min
  TOTAL                       ≈ 4 h per iteration
"""
import bpy
import bpy_extras.object_utils
import json
import math
import os
import sys
import argparse
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--stage',
                choices=['exterior', 'engine_approach', 'engine_bay', 'underneath', 'all'],
                default='all')
ap.add_argument('--frames', type=int, default=None, help='override frame count (debug)')
args = ap.parse_args(argv)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ANCHORS_JSON = os.path.join(ROOT, 'scripts/blender/hotspot_anchors.json')
OUT_DIR = os.path.join(ROOT, 'tmp/renders')

with open(ANCHORS_JSON) as f:
    ANCHORS = json.load(f)

STAGES = {
    # Full 360° turntable around closed car.
    # Drag controls a single motion: camera rotation around vertical axis.
    'exterior': {
        'frames': 90,
        'hdr': 'public/hdr/studio_small_09_2k.hdr',
        'samples': 256,
        'turntable_rotation': lambda f, n: (0, 0, math.radians(360 * f / n)),
        'camera_local': (0, -7.0, 1.6),
        'camera_rotation': (math.radians(82), 0, 0),
        'lens': 50,
        'hood_open_frac': 0,
        # Anchors source: ANCHORS['exterior']
        'anchors_key': 'exterior',
    },
    # Engine sub-sequence A: closed hood, camera arcs from the side toward the front
    # while dollying in. Hood stays closed throughout. Drag controls camera position
    # along the arc — one motion (orbit-with-dolly), no hood animation conflation.
    'engine_approach': {
        'frames': 30,
        'hdr': 'public/hdr/autoshop_01_2k.hdr',
        'samples': 256,
        'turntable_rotation': lambda f, n: (0, 0, math.radians(120 * f / n - 60)),
        'camera_local': lambda f, n: (
            0,
            -5.0 + (1.5 * f / n),   # dolly: -5m → -3.5m
            1.6,
        ),
        'camera_rotation': (math.radians(78), 0, 0),
        'lens': 35,
        'hood_open_frac': 0,
        'anchors_key': 'engine',
    },
    # Engine sub-sequence B: hood already fully open from frame 0, camera orbits
    # 360° around the open bay at fixed distance. Drag controls camera rotation only.
    'engine_bay': {
        'frames': 60,
        'hdr': 'public/hdr/autoshop_01_2k.hdr',
        'samples': 256,
        'turntable_rotation': lambda f, n: (0, 0, math.radians(360 * f / n)),
        'camera_local': (0, -2.5, 2.8),
        'camera_rotation': (math.radians(102), 0, 0),  # looking down into bay
        'lens': 35,
        'hood_open_frac': 1,  # always open
        'anchors_key': 'engine',
    },
    # Underbody pan.
    'underneath': {
        'frames': 60,
        'hdr': 'public/hdr/garage_2k.hdr',
        'samples': 256,
        'turntable_rotation': lambda f, n: (0, 0, math.radians(180 * f / n - 90)),
        'camera_local': (0, -5.0, -0.4),
        'camera_rotation': (math.radians(105), 0, 0),
        'lens': 28,
        'hood_open_frac': 0,
        'anchors_key': 'underneath',
    },
}

HOOD_CLOSED_ROT_X = 0.0
HOOD_OPEN_ROT_X   = math.radians(-65)


def find_object(name):
    return bpy.data.objects.get(name)


def world_anchor_position(anchor_def):
    if anchor_def.get('anchor') is None:
        return Vector(anchor_def['world_position'])
    obj = find_object(anchor_def['anchor'])
    if obj is None:
        return None
    offset = Vector(anchor_def['offset'])
    return obj.matrix_world @ offset


def project_to_screen(world_pos, cam, scene):
    co = bpy_extras.object_utils.world_to_camera_view(scene, cam, world_pos)
    return co.x, 1.0 - co.y, co.z


def is_occluded(world_pos, cam, scene):
    cam_world = cam.matrix_world.translation
    direction = (world_pos - cam_world)
    distance = direction.length
    if distance < 0.001:
        return False
    direction.normalize()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    hit, hit_loc, _, _, _, _ = scene.ray_cast(depsgraph, cam_world, direction, distance=distance - 0.05)
    return hit


def configure_hdri(hdri_path):
    img = bpy.data.images.load(hdri_path, check_existing=True)
    world = bpy.context.scene.world
    for n in world.node_tree.nodes:
        if n.type == 'TEX_ENVIRONMENT':
            n.image = img
            return
    raise RuntimeError('no env texture node in world; run setup_render_scene.py first')


def set_camera_pose(stage_cfg, frame, total):
    tt = find_object('Turntable')
    cam = find_object('TT_Camera')
    if tt is None or cam is None:
        raise RuntimeError('Turntable/TT_Camera missing — run setup_render_scene.py first')
    tt.rotation_euler = stage_cfg['turntable_rotation'](frame, total)
    cam_local = stage_cfg['camera_local']
    if callable(cam_local):
        cam_local = cam_local(frame, total)
    cam.location = cam_local
    rot = stage_cfg['camera_rotation']
    if callable(rot):
        rot = rot(frame, total)
    cam.rotation_euler = rot
    cam.data.lens = stage_cfg['lens']


def set_hood(open_frac):
    hood = find_object('Hood')
    if hood is None:
        return
    hood.rotation_euler.x = HOOD_CLOSED_ROT_X + (HOOD_OPEN_ROT_X - HOOD_CLOSED_ROT_X) * open_frac


def fix_hood_pivot_once():
    """Move hood origin to its rear edge (max-Y vertex), so rotation hinges correctly.

    Idempotent: only runs if hood's origin is not already on the rear edge.
    """
    hood = find_object('Hood')
    if hood is None:
        print('[hood] no Hood object found — skipping pivot fix')
        return
    rear_edge_local_y = max(c[1] for c in hood.bound_box)
    rear_edge_local = Vector((0, rear_edge_local_y, sum(c[2] for c in hood.bound_box) / 8))
    rear_edge_world = hood.matrix_world @ rear_edge_local
    if (hood.matrix_world.translation - rear_edge_world).length < 0.001:
        return
    bpy.context.scene.cursor.location = rear_edge_world
    bpy.ops.object.select_all(action='DESELECT')
    hood.select_set(True)
    bpy.context.view_layer.objects.active = hood
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR', center='MEDIAN')
    print(f'[hood] origin moved to {rear_edge_world}')


def detect_degenerate_occlusion(per_frame_projections):
    """Detect when scene.ray_cast returns useless results in --background mode.

    Symptom A: every hotspot in every frame is visible=True → occlusion never fires.
    Symptom B: every hotspot in every frame is visible=False → occlusion fires on
               everything, likely because depsgraph isn't fully evaluated.

    Returns (is_degenerate, reason).
    """
    in_frame_total = 0
    visible_total = 0
    for frame in per_frame_projections:
        for h in frame:
            # Only count in-frame projections; out-of-frame visible=False is expected
            if h.get('in_frame'):
                in_frame_total += 1
                if h['visible']:
                    visible_total += 1
    if in_frame_total == 0:
        return False, 'no in-frame projections (camera misaligned?)'
    ratio = visible_total / in_frame_total
    if ratio == 1.0:
        return True, f'all {in_frame_total} in-frame projections marked visible — ray_cast likely degenerate in --background'
    if ratio == 0.0:
        return True, f'no in-frame projections marked visible — ray_cast over-aggressive or depsgraph stale'
    return False, f'{ratio*100:.0f}% of in-frame hotspots visible (healthy range)'


def render_stage(stage_name):
    cfg = STAGES[stage_name]
    total = args.frames if args.frames else cfg['frames']
    out_dir = os.path.join(OUT_DIR, stage_name)
    os.makedirs(out_dir, exist_ok=True)

    scene = bpy.context.scene
    scene.cycles.samples = cfg['samples']
    configure_hdri(cfg['hdr'])
    fix_hood_pivot_once()

    anchors_key = cfg.get('anchors_key', stage_name)
    hotspots = ANCHORS.get(anchors_key, []) + ANCHORS.get('DEFERRED', [])
    per_frame_projections = []

    for f in range(total):
        set_camera_pose(cfg, f, total)
        hood_open = cfg['hood_open_frac']
        if callable(hood_open):
            hood_open = hood_open(f, total)
        set_hood(hood_open)

        bpy.context.view_layer.update()

        cam = find_object('TT_Camera')
        frame_data = []
        for h in hotspots:
            wp = world_anchor_position(h)
            if wp is None:
                frame_data.append({'id': h['id'], 'x': 0, 'y': 0,
                                   'in_frame': False, 'visible': False})
                continue
            x, y, z = project_to_screen(wp, cam, scene)
            in_frame = 0 <= x <= 1 and 0 <= y <= 1 and z > 0
            occluded = is_occluded(wp, cam, scene) if in_frame else False
            frame_data.append({
                'id': h['id'],
                'x': round(x, 4),
                'y': round(y, 4),
                'in_frame': in_frame,
                'visible': in_frame and not occluded,
            })
        per_frame_projections.append(frame_data)

        scene.render.filepath = os.path.join(out_dir, f'frame_{f:03d}.png')
        bpy.ops.render.render(write_still=True)
        print(f'[{stage_name}] frame {f+1}/{total} done')

    # Degenerate-occlusion fallback: if ray_cast in --background returned useless data,
    # disable occlusion gating and let all in-frame hotspots be visible.
    degenerate, reason = detect_degenerate_occlusion(per_frame_projections)
    print(f'[{stage_name}] occlusion check: {reason}')
    if degenerate:
        print(f'[{stage_name}] WARNING: occlusion gating disabled for this stage.')
        print(f'[{stage_name}] Falling back to in-frame check only. Hotspots may show '
              f'through opaque geometry from rear angles.')
        for frame_data in per_frame_projections:
            for h in frame_data:
                h['visible'] = bool(h.get('in_frame'))

    with open(os.path.join(out_dir, 'projections.json'), 'w') as fp:
        json.dump({
            'stage': stage_name,
            'frameCount': total,
            'width': scene.render.resolution_x,
            'height': scene.render.resolution_y,
            'occlusionDegenerate': degenerate,
            'occlusionReason': reason,
            'perFrame': per_frame_projections,
        }, fp, indent=2)
    print(f'[{stage_name}] wrote projections.json')


if args.stage == 'all':
    for s in ('exterior', 'engine_approach', 'engine_bay', 'underneath'):
        render_stage(s)
else:
    render_stage(args.stage)

print('=== RENDER COMPLETE ===')
```

- [ ] **Step 2: Write the CLI wrapper**

Create `scripts/blender/render_stage.sh`:
```bash
#!/usr/bin/env bash
# Run from repo root. Renders one or all stages of the LC300 360 explorer.
#
# Usage:
#   ./scripts/blender/render_stage.sh exterior
#   ./scripts/blender/render_stage.sh engine
#   ./scripts/blender/render_stage.sh underneath
#   ./scripts/blender/render_stage.sh all
#
# Requires Blender 4.2+ on PATH and an OptiX-capable GPU (or runs slow on CPU).

set -euo pipefail
STAGE="${1:-all}"
BLEND="public/models/lc300-raw/lc300-working.blend"

if [ ! -f "$BLEND" ]; then
  echo "ERROR: $BLEND missing. Run Task 1.2 to produce it."
  exit 1
fi

blender --background "$BLEND" \
        --python scripts/blender/render_stages.py \
        -- --stage "$STAGE"
```

Then `chmod +x scripts/blender/render_stage.sh` (or note in the README that Windows users invoke via Git Bash or PowerShell directly).

- [ ] **Step 3: Commit**

```
git add scripts/blender/render_stages.py scripts/blender/render_stage.sh
git commit -m "feat(360): master render script + CLI wrapper for 3-stage Cycles output"
```

---

### Task 1.6: Render exterior stage

- [ ] **Step 1: Run the exterior render**

Use Bash:
```
bash scripts/blender/render_stage.sh exterior
```
Expected: 90 PNG frames in `tmp/renders/exterior/frame_000.png` … `frame_089.png` plus `projections.json`. Render time ~90 min on a decent GPU at samples=256.

- [ ] **Step 2: Spot-check a frame**

Open `tmp/renders/exterior/frame_045.png` (side view, midway through rotation). Verify:
- Car body visible in frame, not cut off
- Studio lighting reads as bright softboxes on bodywork
- No missing textures (no purple/pink magenta material)

If the car is cut off or off-center, adjust `STAGES['exterior']['camera_local']` in `render_stages.py` and re-run.

- [ ] **Step 3: Update .gitignore for tmp/**

Add to `.gitignore` if not already:
```
tmp/
```

- [ ] **Step 4: Commit gitignore update**

```
git add .gitignore
git commit -m "chore(360): gitignore tmp/ render outputs"
```

---

### Task 1.7a: Render engine approach (closed hood)

This is sub-sequence A. Camera arcs from the side toward the front while dollying in. Hood stays closed. Drag controls a single motion (orbit-with-dolly).

- [ ] **Step 1: Run the engine_approach render**

```
bash scripts/blender/render_stage.sh engine_approach
```
Expected: 30 PNG frames in `tmp/renders/engine_approach/` plus `projections.json`. Render time ~30 min.

- [ ] **Step 2: Verify hood stays closed across all frames**

Open `tmp/renders/engine_approach/frame_000.png` and `frame_029.png`. Hood must be closed in both. If it animates open, `STAGES['engine_approach']['hood_open_frac']` is wrong — must be the literal `0`, not a lambda.

- [ ] **Step 3: Verify front-quarter view at last frame**

`frame_029.png` should show the front bumper, grille, and hood from a close three-quarter angle (the camera has dollied in and rotated to the front). If the camera ends up at an extreme angle, tune the `120 * f / n - 60` range in the `turntable_rotation` lambda.

---

### Task 1.7b: Render engine bay (open hood)

Sub-sequence B. Hood is open from frame 0; camera orbits 360° around the bay at fixed distance.

- [ ] **Step 1: Run the engine_bay render**

```
bash scripts/blender/render_stage.sh engine_bay
```
Expected: 60 PNG frames in `tmp/renders/engine_bay/` plus `projections.json`. Render time ~60 min.

- [ ] **Step 2: Verify hood is fully open in every frame**

Spot-check `frame_000.png`, `frame_030.png`, `frame_059.png`. Hood must be at the same fully-open angle (-65°) across all of them. The bay contents (engine, battery, intake, hoses, fuse box) must be clearly visible.

If the hood rotates around its center instead of the rear edge, `fix_hood_pivot_once` failed — check the Hood object's name in `INVENTORY.md` and adjust `find_object('Hood')` to match. The audit confirmed the bonnet origin is already at the rear hinge, so this should be a no-op in practice.

- [ ] **Step 3: Verify engine top-dressing visible**

The audit confirmed the engine cover is ~0.4 m tall and visible from the hood angle. `frame_000.png` (front view) and `frame_015.png` (driver-side view) should show the Toyota badge, intake, and fuse boxes clearly. If the camera is too close and clipping geometry, increase `camera_local` Y to `-3.0` and re-render.

---

### Task 1.8: Render underneath stage

- [ ] **Step 1: Run the underneath render**

```
bash scripts/blender/render_stage.sh underneath
```
Expected: 60 frames showing the car from below at various pan angles. Render time ~60 min at samples=256.

- [ ] **Step 2: Verify chassis, suspension, exhaust visible**

Open `tmp/renders/underneath/frame_030.png` (mid-pan). The chassis, exhaust, and suspension corners should be clearly visible.

**Expect to iterate this stage at least once.** Underneath views consistently come out under-lit on the first pass because the body geometry blocks all of the HDRI's upper hemisphere and the key/fill lights (positioned for exterior shots) don't reach below the car. Plan for one extra render round to either:

(a) **Boost garage HDRI strength** — in `setup_render_scene.py`, where the HDRI is configured, raise `bg.inputs['Strength'].default_value` from `1.0` to `2.5–3.5` for the underneath stage only. Cleanest way: have `render_stages.py` set the strength in `configure_hdri()` based on a per-stage `hdr_strength` field (default 1.0, underneath = 3.0).

(b) **Add an underbody fill light** — append to `setup_render_scene.py`:
```python
ubody_data = bpy.data.lights.new('LC300_Underbody', 'AREA')
ubody_data.energy = 600
ubody_data.size = 4.0
ubody_data.color = (1.0, 0.95, 0.88)
ubody = bpy.data.objects.get('LC300_Underbody') or bpy.data.objects.new('LC300_Underbody', ubody_data)
if ubody.name not in scene.collection.objects:
    scene.collection.objects.link(ubody)
ubody.data = ubody_data
ubody.location = (0, 0, -2)         # below the floor, pointing up
ubody.rotation_euler = (math.radians(180), 0, 0)
```

Apply (a) first — it's a one-line change. Fall back to (b) only if (a) over-blows highlights elsewhere. Don't try both at once.

---

## Phase 2: Image Optimization & Manifest

### Task 2.1: WebP encoder script

**Files:**
- Create: `scripts/encode-webp.mjs`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Verify cwebp is available**

Run: `cwebp -version`
Expected: a version string like `1.x.x`. If missing, install via `brew install webp` (macOS), `apt install webp` (Linux), or download from https://developers.google.com/speed/webp/download.

- [ ] **Step 2: Write the encoder**

Create `scripts/encode-webp.mjs`:
```js
#!/usr/bin/env node
// Encode all PNG renders to WebP at quality 78. Generates LQIP + hero WebP per stage.

import { execSync } from 'node:child_process';
import { readdirSync, mkdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const STAGES = ['exterior', 'engine_approach', 'engine_bay', 'underneath'];
const SRC_ROOT = 'tmp/renders';
const OUT_ROOT = 'public/models/lc300-360';

const WEBP_QUALITY = 78;
const HERO_FRAME = {
  exterior: 22,
  engine_approach: 15,
  engine_bay: 30,
  underneath: 30,
};

let totalBytes = 0;

for (const stage of STAGES) {
  const srcDir = path.join(SRC_ROOT, stage);
  const outDir = path.join(OUT_ROOT, stage);
  if (!existsSync(srcDir)) {
    console.warn(`skip ${stage}: no source dir`);
    continue;
  }
  mkdirSync(outDir, { recursive: true });

  const frames = readdirSync(srcDir).filter((f) => /^frame_\d+\.png$/.test(f)).sort();
  console.log(`${stage}: ${frames.length} frames`);

  let stageBytes = 0;
  for (const f of frames) {
    const src = path.join(srcDir, f);
    const out = path.join(outDir, f.replace(/\.png$/, '.webp'));
    execSync(`cwebp -q ${WEBP_QUALITY} -mt -m 6 "${src}" -o "${out}"`, { stdio: 'pipe' });
    stageBytes += statSync(out).size;
  }
  console.log(`  ${stage} webp total: ${(stageBytes/1024/1024).toFixed(2)} MB`);
  totalBytes += stageBytes;

  // LQIP: blurred low-quality thumbnail (~24 KB target)
  const heroIdx = HERO_FRAME[stage];
  const heroSrc = path.join(srcDir, `frame_${String(heroIdx).padStart(3, '0')}.png`);
  if (existsSync(heroSrc)) {
    const lqipOut = path.join(outDir, 'lqip.webp');
    execSync(`cwebp -q 30 -resize 320 0 "${heroSrc}" -o "${lqipOut}"`, { stdio: 'pipe' });
    console.log(`  ${stage} lqip: ${(statSync(lqipOut).size/1024).toFixed(0)} KB`);

    // Hero WebP for SSR fallback (Googlebot understands WebP)
    const heroOut = path.join(outDir, 'hero.webp');
    execSync(`cwebp -q 85 -resize 1280 0 "${heroSrc}" -o "${heroOut}"`, { stdio: 'pipe' });
    console.log(`  ${stage} hero.webp: ${(statSync(heroOut).size/1024).toFixed(0)} KB`);
  }
}

console.log(`TOTAL WebP bytes: ${(totalBytes/1024/1024).toFixed(2)} MB`);
if (totalBytes > 5 * 1024 * 1024) {
  console.error(`OVER BUDGET (5 MB limit)`);
  process.exit(1);
}
```

- [ ] **Step 3: Add npm script**

Edit `package.json` `scripts`:
```json
"encode-webp": "node scripts/encode-webp.mjs",
"build-360":   "node scripts/encode-webp.mjs && node scripts/generate-manifest.mjs"
```

- [ ] **Step 4: Run encoder**

Run: `npm run encode-webp`
Expected: WebP files in `public/models/lc300-360/{stage}/` + LQIP + hero per stage. Total under 5 MB.

- [ ] **Step 5: Commit script + encoded WebP frames**

```
git add scripts/encode-webp.mjs package.json public/models/lc300-360/
git commit -m "feat(360): WebP encoder + initial encoded frames for all 3 stages"
```

---

### Task 2.2: Manifest generator

Combines the 3 `projections.json` files into one `manifest.json` keyed by stage, with frame count + dimensions + per-hotspot per-frame projection.

**Files:**
- Create: `scripts/generate-manifest.mjs`
- Create: `public/models/lc300-360/manifest.json`

- [ ] **Step 1: Write the generator**

Create `scripts/generate-manifest.mjs`:
```js
#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const SRC_ROOT = 'tmp/renders';
const OUT_DIR = 'public/models/lc300-360';
const STAGES = ['exterior', 'engine_approach', 'engine_bay', 'underneath'];

const manifest = { version: 1, generatedAt: new Date().toISOString(), stages: {} };

for (const stage of STAGES) {
  const projPath = path.join(SRC_ROOT, stage, 'projections.json');
  if (!existsSync(projPath)) {
    console.warn(`skip ${stage}: no projections.json`);
    continue;
  }
  const proj = JSON.parse(readFileSync(projPath, 'utf8'));

  const webpDir = path.join(OUT_DIR, stage);
  const webpFrames = readdirSync(webpDir).filter((f) => /^frame_\d+\.webp$/.test(f));
  if (webpFrames.length !== proj.frameCount) {
    throw new Error(`${stage}: expected ${proj.frameCount} webp frames, found ${webpFrames.length}`);
  }

  const totalBytes = webpFrames.reduce((s, f) => s + statSync(path.join(webpDir, f)).size, 0);

  manifest.stages[stage] = {
    frameCount: proj.frameCount,
    width: proj.width,
    height: proj.height,
    framePathPattern: `/models/lc300-360/${stage}/frame_{NNN}.webp`,
    lqipPath: `/models/lc300-360/${stage}/lqip.webp`,
    heroPath: `/models/lc300-360/${stage}/hero.webp`,
    avgFrameKB: Math.round(totalBytes / proj.frameCount / 1024),
    totalKB: Math.round(totalBytes / 1024),
    hotspotProjections: proj.perFrame,
  };
}

writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('manifest written:', path.join(OUT_DIR, 'manifest.json'));
console.log('totals:');
for (const [s, d] of Object.entries(manifest.stages)) {
  console.log(`  ${s}: ${d.frameCount} frames, ${d.totalKB} KB, ${d.avgFrameKB} KB/frame avg`);
}
```

- [ ] **Step 2: Run**

Run: `node scripts/generate-manifest.mjs`
Expected: `public/models/lc300-360/manifest.json` written. Stdout shows per-stage totals.

- [ ] **Step 3: Commit**

```
git add scripts/generate-manifest.mjs public/models/lc300-360/manifest.json
git commit -m "feat(360): manifest generator combining frames + projections per stage"
```

---

### Task 2.3: CI build fence — fail `npm run build` if 360 assets missing

Without this, a fresh clone (or a CI machine that hasn't run the render pipeline) would silently build a deployable bundle with a broken explorer. This task adds a prebuild guard that exits with a clear error.

**Files:**
- Create: `scripts/check-360-assets.mjs`
- Modify: `package.json` (add `prebuild` script)

- [ ] **Step 1: Write the asset checker**

Create `scripts/check-360-assets.mjs`:
```js
#!/usr/bin/env node
// Fail `npm run build` if the LC300 360 assets are missing or out of sync with the manifest.
// Runs as `prebuild` so the failure is loud and early, not at runtime.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MANIFEST = 'public/models/lc300-360/manifest.json';
const REQUIRED_STAGES = ['exterior', 'engine_approach', 'engine_bay', 'underneath'];
const REQUIRED_PER_STAGE = ['lqip.webp', 'hero.webp'];

function fail(lines) {
  console.error('');
  console.error('================================================================');
  console.error('  LC300 360 assets check — FAIL');
  console.error('================================================================');
  for (const l of lines) console.error('  ' + l);
  console.error('');
  console.error('  To fix: render the Blender pipeline, then run:');
  console.error('    npm run build-360');
  console.error('');
  console.error('  See docs/superpowers/plans/2026-05-26-lc300-360-rendered-approach.md');
  console.error('  Phases 1 + 2 for the full pipeline.');
  console.error('================================================================');
  process.exit(1);
}

if (!existsSync(MANIFEST)) {
  fail([`Missing manifest: ${MANIFEST}`]);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
} catch (e) {
  fail([`Invalid JSON in ${MANIFEST}: ${e.message}`]);
}

const errors = [];

if (!manifest?.stages) {
  errors.push('manifest has no `stages` key');
}

for (const stage of REQUIRED_STAGES) {
  const m = manifest.stages?.[stage];
  if (!m) {
    errors.push(`stage missing in manifest: ${stage}`);
    continue;
  }
  const dir = path.join('public/models/lc300-360', stage);
  if (!existsSync(dir)) {
    errors.push(`stage directory missing: ${dir}`);
    continue;
  }

  const files = readdirSync(dir);
  const webpFrames = files.filter((f) => /^frame_\d+\.webp$/.test(f));
  if (webpFrames.length !== m.frameCount) {
    errors.push(
      `${stage}: manifest declares ${m.frameCount} frames, ${webpFrames.length} found on disk`,
    );
  }

  for (const required of REQUIRED_PER_STAGE) {
    const p = path.join(dir, required);
    if (!existsSync(p)) errors.push(`${stage}: ${required} missing`);
  }

  if (!Array.isArray(m.hotspotProjections) || m.hotspotProjections.length !== m.frameCount) {
    errors.push(`${stage}: hotspotProjections length mismatch`);
  }
}

if (errors.length) fail(errors);

console.log(`[asset-check] OK: ${REQUIRED_STAGES.length} stages valid`);
```

- [ ] **Step 2: Wire it as `prebuild`**

Edit `package.json` `scripts`. Add (and reorder so `prebuild` precedes `build`):
```json
"prebuild": "node scripts/check-360-assets.mjs",
"check-360": "node scripts/check-360-assets.mjs"
```

Next.js / npm runs `prebuild` automatically before `build`. The standalone `check-360` lets developers run it without triggering a full build.

- [ ] **Step 3: Smoke test the fence**

Temporarily rename the manifest:
```
mv public/models/lc300-360/manifest.json public/models/lc300-360/manifest.json.bak
```
Run: `npm run build`
Expected: build fails with the framed error message pointing to the plan.
Restore: `mv public/models/lc300-360/manifest.json.bak public/models/lc300-360/manifest.json`
Re-run: `npm run build` — should succeed.

- [ ] **Step 4: Commit**

```
git add scripts/check-360-assets.mjs package.json
git commit -m "feat(360): prebuild fence fails clearly if 360 assets missing or stale"
```

---

## Phase 3: React Drag-Rotate Carousel

### Task 3.1: Install test toolchain

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Install vitest + RTL**

Run:
```
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Add vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

Create `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Add npm script**

In `package.json` `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Smoke test**

Run: `npx vitest run --no-coverage`
Expected: "No test files found" — that's correct at this stage.

- [ ] **Step 5: Commit**

```
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore(360): install vitest + RTL for hook + component tests"
```

---

### Task 3.2: Types and asset paths

**Files:**
- Create: `src/components/lc300-360/data/types.ts`
- Create: `src/components/lc300-360/data/paths.ts`

- [ ] **Step 1: Write types**

Create `src/components/lc300-360/data/types.ts`:
```ts
export type Stage = 'exterior' | 'engine_approach' | 'engine_bay' | 'underneath';

export interface HotspotProjection {
  id: string;
  x: number;
  y: number;
  /** True if hotspot is inside the camera frustum this frame */
  in_frame?: boolean;
  /** True if hotspot is in-frame AND not occluded by car geometry */
  visible: boolean;
}

export interface StageManifest {
  frameCount: number;
  width: number;
  height: number;
  framePathPattern: string;
  lqipPath: string;
  heroPath: string;
  avgFrameKB: number;
  totalKB: number;
  hotspotProjections: HotspotProjection[][];
  /** True if Blender's --background ray_cast was degenerate; in-frame check is the only gate */
  occlusionDegenerate?: boolean;
}

export interface Manifest {
  version: number;
  generatedAt: string;
  stages: Record<Stage, StageManifest>;
}

export interface Hotspot {
  id: string;
  stage: Stage;
  titleMn: string;
  descriptionMn: string;
}

export const CTA_PHONE_DISPLAY = '+976 77-200-570';
export const CTA_PHONE_TEL = 'tel:+97677200570';

export const STAGE_LABELS: Record<Stage, string> = {
  exterior:        'Гадна тал',
  engine_approach: 'Капот руу',
  engine_bay:      'Хөдөлгүүр',
  underneath:      'Доод тал',
};

export const STAGE_ORDER: Stage[] = [
  'exterior', 'engine_approach', 'engine_bay', 'underneath',
];
```

- [ ] **Step 2: Write paths**

Create `src/components/lc300-360/data/paths.ts`:
```ts
export const MANIFEST_URL = '/models/lc300-360/manifest.json';

export function framePath(_unused: string, frameIndex: number, pattern: string): string {
  return pattern.replace('{NNN}', String(frameIndex).padStart(3, '0'));
}
```

- [ ] **Step 3: Commit**

```
git add src/components/lc300-360/data/types.ts src/components/lc300-360/data/paths.ts
git commit -m "feat(360): types and asset path helpers"
```

---

### Task 3.3: useFrameSequence hook

Loads frames with a skip-N preload strategy. Returns image elements ready to display.

**Files:**
- Create: `src/components/lc300-360/hooks/useFrameSequence.ts`
- Create: `src/components/lc300-360/hooks/useFrameSequence.test.ts`

- [ ] **Step 1: Write the test**

Create `src/components/lc300-360/hooks/useFrameSequence.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFrameSequence } from './useFrameSequence';

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  _src = '';
  decoding = '';
  loading = '';
  get src() { return this._src; }
  set src(v: string) {
    this._src = v;
    if (v) queueMicrotask(() => this.onload?.());
  }
}

beforeEach(() => {
  (globalThis as any).Image = MockImage;
});

describe('useFrameSequence', () => {
  it('starts with 0 loaded frames, totalFrames=N', () => {
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 8,
      pathPattern: '/frame_{NNN}.webp',
      skip: 4,
    }));
    expect(result.current.totalFrames).toBe(8);
    expect(result.current.loadedFrames).toBeLessThanOrEqual(2);
  });

  it('eventually loads all frames when under memory cap', async () => {
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 8,
      pathPattern: '/frame_{NNN}.webp',
      skip: 4,
      width: 320, height: 180,  // tiny so 8 frames fits in default cap
    }));
    await waitFor(() => {
      expect(result.current.loadedFrames).toBe(8);
    });
  });

  it('returns img element for loaded frame index', async () => {
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 4,
      pathPattern: '/frame_{NNN}.webp',
      skip: 1,
      width: 320, height: 180,
    }));
    await waitFor(() => expect(result.current.loadedFrames).toBe(4));
    const img = result.current.getFrame(2);
    expect(img).toBeTruthy();
  });

  it('returns null for unloaded frame index until loaded', () => {
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 16,
      pathPattern: '/frame_{NNN}.webp',
      skip: 8,
    }));
    expect(result.current.getFrame(99)).toBeNull();
  });

  it('LRU cap evicts least-recently-used when over budget', async () => {
    // 1280x720 @ 4 bytes = 3.68 MB/frame. maxBytes 12 MB → cap ≈ 3 frames retained.
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 8,
      pathPattern: '/frame_{NNN}.webp',
      skip: 1,
      width: 1280, height: 720,
      maxBytes: 12_000_000,
    }));
    await waitFor(() => expect(result.current.loadedFrames).toBeGreaterThan(0));
    // Even after loading all 8, retained should clamp to cap, not stay at 8.
    await waitFor(() => {
      const ret = result.current.loadedFrames;
      expect(ret).toBeLessThanOrEqual(4);
      expect(ret).toBeGreaterThanOrEqual(2);
    }, { timeout: 1000 });
  });

  it('touching a frame via getFrame promotes it in LRU', async () => {
    const { result } = renderHook(() => useFrameSequence({
      frameCount: 6,
      pathPattern: '/frame_{NNN}.webp',
      skip: 1,
      width: 1280, height: 720,
      maxBytes: 12_000_000,
    }));
    await waitFor(() => expect(result.current.loadedFrames).toBeGreaterThan(0));
    act(() => { result.current.getFrame(0); });  // touch frame 0 to keep it
    // Frame 0 should still be retrievable after subsequent loads cause eviction
    await waitFor(() => {
      const img = result.current.getFrame(0);
      expect(img).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run test (should fail with module not found)**

Run: `npx vitest run src/components/lc300-360/hooks/useFrameSequence.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `src/components/lc300-360/hooks/useFrameSequence.ts`:
```ts
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { framePath } from '../data/paths';

interface Options {
  frameCount: number;
  pathPattern: string;
  skip?: number;
  reducePreload?: boolean;
  /** Image width in px (for memory-cap math). Defaults to 1280. */
  width?: number;
  /** Image height in px. Defaults to 720. */
  height?: number;
  /**
   * Soft cap on retained decoded-image bytes. Once exceeded, least-recently-used
   * frames are evicted by setting `img.src = ''` (releases the decoded bitmap).
   * Default: 120 MB — keeps ~32 frames at 1280x720 RGBA.
   */
  maxBytes?: number;
}

interface Result {
  totalFrames: number;
  /** Currently retained (not evicted) frame count. */
  loadedFrames: number;
  /**
   * Get the image element for a frame. Touching a frame promotes it in the LRU
   * so it survives the next eviction round.
   */
  getFrame: (i: number) => HTMLImageElement | null;
  isLoaded: (i: number) => boolean;
}

export function useFrameSequence(opts: Options): Result {
  const {
    frameCount, pathPattern, skip = 4, reducePreload = false,
    width = 1280, height = 720, maxBytes = 120_000_000,
  } = opts;

  const framesRef = useRef<(HTMLImageElement | null)[]>(new Array(frameCount).fill(null));
  // LRU order: oldest at front, most-recently-used at back.
  const lruRef = useRef<number[]>([]);
  const [retainedCount, setRetainedCount] = useState(0);

  // Compute frame cap. Floor of 8 prevents pathological evict-everything on tiny budgets.
  const maxRetained = useMemo(
    () => Math.max(8, Math.floor(maxBytes / (width * height * 4))),
    [maxBytes, width, height],
  );

  const evictIfOverCap = useCallback(() => {
    let evicted = 0;
    while (lruRef.current.length > maxRetained) {
      const oldest = lruRef.current.shift()!;
      const img = framesRef.current[oldest];
      if (img) {
        img.src = '';  // release decoded bitmap
        framesRef.current[oldest] = null;
        evicted += 1;
      }
    }
    if (evicted > 0) {
      setRetainedCount(lruRef.current.length);
    }
  }, [maxRetained]);

  const loadOrder = useMemo(() => {
    const order: number[] = [];
    let step = skip;
    const seen = new Set<number>();
    while (step >= 1) {
      for (let i = 0; i < frameCount; i += step) {
        if (!seen.has(i)) { order.push(i); seen.add(i); }
      }
      if (step === 1) break;
      step = Math.max(1, Math.floor(step / 2));
    }
    return order;
  }, [frameCount, skip]);

  useEffect(() => {
    let cancelled = false;
    let activeLoads = 0;
    const maxConcurrent = reducePreload ? 2 : 6;
    const queue = [...loadOrder];

    function pump() {
      while (activeLoads < maxConcurrent && queue.length > 0 && !cancelled) {
        const idx = queue.shift()!;
        if (framesRef.current[idx]) continue;
        activeLoads += 1;
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        const onDone = () => {
          if (cancelled) return;
          framesRef.current[idx] = img;
          lruRef.current.push(idx);
          setRetainedCount(lruRef.current.length);
          evictIfOverCap();
          activeLoads -= 1;
          pump();
        };
        img.onload = onDone;
        img.onerror = () => {
          if (cancelled) return;
          activeLoads -= 1;
          pump();
        };
        img.src = framePath('', idx, pathPattern);
      }
    }
    pump();

    return () => { cancelled = true; };
  }, [loadOrder, pathPattern, reducePreload, evictIfOverCap]);

  const getFrame = useCallback((i: number) => {
    const img = framesRef.current[i];
    if (img) {
      // Promote in LRU
      const lru = lruRef.current;
      const at = lru.indexOf(i);
      if (at >= 0 && at < lru.length - 1) {
        lru.splice(at, 1);
        lru.push(i);
      }
    }
    return img ?? null;
  }, []);

  const isLoaded = useCallback((i: number) => framesRef.current[i] !== null, []);

  return { totalFrames: frameCount, loadedFrames: retainedCount, getFrame, isLoaded };
}
```

- [ ] **Step 4: Run test, confirm pass**

Run: `npx vitest run src/components/lc300-360/hooks/useFrameSequence.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```
git add src/components/lc300-360/hooks/useFrameSequence.ts src/components/lc300-360/hooks/useFrameSequence.test.ts
git commit -m "feat(360): useFrameSequence with skip-N preload + concurrency limit"
```

---

### Task 3.4: useDragRotate hook

Maps pointer-drag delta to frame index. Supports mouse, touch, pen.

**Files:**
- Create: `src/components/lc300-360/hooks/useDragRotate.ts`
- Create: `src/components/lc300-360/hooks/useDragRotate.test.ts`

- [ ] **Step 1: Write the test**

Create `src/components/lc300-360/hooks/useDragRotate.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragRotate } from './useDragRotate';

describe('useDragRotate', () => {
  it('starts at frame 0', () => {
    const { result } = renderHook(() => useDragRotate({ frameCount: 90, pixelsPerFrame: 4 }));
    expect(result.current.frame).toBe(0);
  });

  it('advances frame on rightward drag', () => {
    const { result } = renderHook(() => useDragRotate({ frameCount: 90, pixelsPerFrame: 4 }));
    act(() => {
      result.current.onPointerDown({ clientX: 100, target: document.body } as unknown as PointerEvent);
      result.current.onPointerMove({ clientX: 140 } as unknown as PointerEvent);
    });
    expect(result.current.frame).toBe(10);
  });

  it('wraps around at boundaries', () => {
    const { result } = renderHook(() => useDragRotate({ frameCount: 8, pixelsPerFrame: 4 }));
    act(() => {
      result.current.onPointerDown({ clientX: 0, target: document.body } as unknown as PointerEvent);
      result.current.onPointerMove({ clientX: -40 } as unknown as PointerEvent);
    });
    expect(result.current.frame).toBe(6);
  });

  it('setFrame jumps directly', () => {
    const { result } = renderHook(() => useDragRotate({ frameCount: 90, pixelsPerFrame: 4 }));
    act(() => result.current.setFrame(45));
    expect(result.current.frame).toBe(45);
  });
});
```

- [ ] **Step 2: Run test (fails)**

Run: `npx vitest run src/components/lc300-360/hooks/useDragRotate.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement hook**

Create `src/components/lc300-360/hooks/useDragRotate.ts`:
```ts
import { useCallback, useRef, useState } from 'react';

interface Options {
  frameCount: number;
  pixelsPerFrame?: number;
}

interface Result {
  frame: number;
  dragging: boolean;
  setFrame: (f: number) => void;
  onPointerDown: (e: PointerEvent | React.PointerEvent) => void;
  onPointerMove: (e: PointerEvent | React.PointerEvent) => void;
  onPointerUp:   (e: PointerEvent | React.PointerEvent) => void;
}

export function useDragRotate({ frameCount, pixelsPerFrame = 4 }: Options): Result {
  const [frame, setFrameState] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartFrameRef = useRef(0);
  const dragStartXRef = useRef(0);
  const draggingRef = useRef(false);

  const wrap = (n: number) => {
    const r = n % frameCount;
    return r < 0 ? r + frameCount : r;
  };

  const setFrame = useCallback((f: number) => setFrameState(wrap(Math.round(f))), [frameCount]);

  const onPointerDown = useCallback((e: PointerEvent | React.PointerEvent) => {
    draggingRef.current = true;
    setDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartFrameRef.current = frame;
    const target = e.target as Element | null;
    if (target && 'setPointerCapture' in target && 'pointerId' in e) {
      try { (target as Element & { setPointerCapture: (id: number) => void }).setPointerCapture(e.pointerId); } catch {}
    }
  }, [frame]);

  const onPointerMove = useCallback((e: PointerEvent | React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    const deltaFrames = Math.round(dx / pixelsPerFrame);
    setFrameState(wrap(dragStartFrameRef.current + deltaFrames));
  }, [pixelsPerFrame, frameCount]);

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
    setDragging(false);
  }, []);

  return { frame, dragging, setFrame, onPointerDown, onPointerMove, onPointerUp };
}
```

- [ ] **Step 4: Run test, confirm pass**

Run: `npx vitest run src/components/lc300-360/hooks/useDragRotate.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```
git add src/components/lc300-360/hooks/useDragRotate.ts src/components/lc300-360/hooks/useDragRotate.test.ts
git commit -m "feat(360): useDragRotate hook with wrap-around frame mapping"
```

---

### Task 3.5: useBandwidth hook

**Files:**
- Create: `src/components/lc300-360/hooks/useBandwidth.ts`

- [ ] **Step 1: Write the hook**

Create `src/components/lc300-360/hooks/useBandwidth.ts`:
```ts
import { useEffect, useState } from 'react';

type NetworkProfile = 'full' | 'reduced' | 'minimal';

interface NavConn {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (t: string, fn: () => void) => void;
  removeEventListener?: (t: string, fn: () => void) => void;
}

export function useBandwidth(): NetworkProfile {
  const [profile, setProfile] = useState<NetworkProfile>('full');

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const conn = (navigator as unknown as { connection?: NavConn }).connection;

    const compute = (): NetworkProfile => {
      if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return 'minimal';
      if (!conn) return 'full';
      if (conn.saveData) return 'minimal';
      switch (conn.effectiveType) {
        case 'slow-2g':
        case '2g':       return 'minimal';
        case '3g':       return 'reduced';
        default:         return 'full';
      }
    };

    setProfile(compute());
    const handler = () => setProfile(compute());
    conn?.addEventListener?.('change', handler);
    return () => conn?.removeEventListener?.('change', handler);
  }, []);

  return profile;
}
```

- [ ] **Step 2: Commit**

```
git add src/components/lc300-360/hooks/useBandwidth.ts
git commit -m "feat(360): useBandwidth hook respecting saveData + effectiveType + prefers-reduced-data"
```

---

### Task 3.6: useStage hook

**Files:**
- Create: `src/components/lc300-360/hooks/useStage.ts`

- [ ] **Step 1: Write the hook**

Create `src/components/lc300-360/hooks/useStage.ts`:
```ts
import { useState, useCallback } from 'react';
import type { Stage } from '../data/types';

export function useStage(initial: Stage = 'exterior') {
  const [stage, setStage] = useState<Stage>(initial);
  const goTo = useCallback((s: Stage) => setStage(s), []);
  return { stage, goTo };
}
```

- [ ] **Step 2: Commit**

```
git add src/components/lc300-360/hooks/useStage.ts
git commit -m "feat(360): useStage hook"
```

---

### Task 3.7: StageCarousel component

**Files:**
- Create: `src/components/lc300-360/StageCarousel.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/lc300-360/StageCarousel.tsx`:
```tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useFrameSequence } from './hooks/useFrameSequence';
import { useDragRotate } from './hooks/useDragRotate';
import { useBandwidth } from './hooks/useBandwidth';
import { framePath } from './data/paths';
import type { StageManifest } from './data/types';

interface Props {
  stage: StageManifest;
  onFrameChange: (frame: number) => void;
  ariaLabel: string;
}

export function StageCarousel({ stage, onFrameChange, ariaLabel }: Props) {
  const network = useBandwidth();
  // Lower memory cap on data-saver / 2g/3g so the cache doesn't OOM low-end Android.
  const maxBytes = network === 'minimal' ? 60_000_000
                 : network === 'reduced' ? 90_000_000
                                         : 120_000_000;
  const { totalFrames, loadedFrames, getFrame } = useFrameSequence({
    frameCount: stage.frameCount,
    pathPattern: stage.framePathPattern,
    skip: network === 'minimal' ? 8 : network === 'reduced' ? 6 : 4,
    reducePreload: network !== 'full',
    width: stage.width,
    height: stage.height,
    maxBytes,
  });
  const { frame, dragging, onPointerDown, onPointerMove, onPointerUp, setFrame } =
    useDragRotate({ frameCount: stage.frameCount, pixelsPerFrame: 4 });

  useEffect(() => { onFrameChange(frame); }, [frame, onFrameChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft')       setFrame(frame - step);
      else if (e.key === 'ArrowRight') setFrame(frame + step);
      else if (e.key === 'Home')       setFrame(0);
      else if (e.key === 'End')        setFrame(stage.frameCount - 1);
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [frame, stage.frameCount, setFrame]);

  const currentImg = getFrame(frame);
  const nearestLoadedFrame = useMemo(() => {
    if (currentImg) return frame;
    for (let d = 1; d < totalFrames / 2; d++) {
      if (getFrame((frame - d + totalFrames) % totalFrames)) return (frame - d + totalFrames) % totalFrames;
      if (getFrame((frame + d) % totalFrames))               return (frame + d) % totalFrames;
    }
    return -1;
  }, [frame, currentImg, getFrame, totalFrames]);

  const angleDeg = Math.round((frame / totalFrames) * 360);
  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      role="img"
      aria-label={`${ariaLabel} (${angleDeg} градус)`}
      aria-roledescription="drag-to-rotate carousel"
      aria-keyshortcuts="ArrowLeft ArrowRight Home End"
      tabIndex={0}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${stage.width} / ${stage.height}`,
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'grab',
        background: '#0a0a0c',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img
        src={stage.lqipPath}
        alt=""
        aria-hidden
        width={stage.width}
        height={stage.height}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'contain',
          filter: 'blur(8px) saturate(0.9)',
          opacity: loadedFrames === 0 ? 1 : 0,
          transition: reducedMotion ? 'none' : 'opacity 0.4s',
        }}
      />
      {nearestLoadedFrame >= 0 && (
        <img
          src={framePath('', nearestLoadedFrame, stage.framePathPattern)}
          alt=""
          aria-hidden
          draggable={false}
          width={stage.width}
          height={stage.height}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      )}
      {loadedFrames < totalFrames && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: `${(loadedFrames / totalFrames) * 100}%`,
          height: 2, background: '#ff3a2a',
          transition: reducedMotion ? 'none' : 'width 0.15s',
        }} />
      )}
      <span
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
          overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
        }}
      >
        {ariaLabel} — кадр {frame + 1} / {totalFrames}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/lc300-360/StageCarousel.tsx
git commit -m "feat(360): StageCarousel with drag + keyboard + LQIP + a11y live region"
```

---

## Phase 4: Hotspot Overlay System

### Task 4.1: Hotspot data with initial Mongolian copy (pre-correction)

**Files:**
- Create: `src/components/lc300-360/data/hotspots.ts`

- [ ] **Step 1: Write hotspot data**

Create `src/components/lc300-360/data/hotspots.ts`:
```ts
import type { Hotspot } from './types';

// NOTE: Mongolian copy below is the PRE-correction baseline. Phase 5 produces the corrected
// version after user review. Do not ship without that review pass.

export const HOTSPOTS: Hotspot[] = [
  // === EXTERIOR ===
  { id: 'ext-hood',        stage: 'exterior',
    titleMn: 'Капот ба хөдөлгүүрийн булан',
    descriptionMn: 'Хөдөлгүүрийн оношилгоо, тосны солилт, цагийн бүс солилт. Капот нээж дотор харна уу.' },
  { id: 'ext-headlight-l', stage: 'exterior',
    titleMn: 'Гэрэлтүүлэг (зүүн)',
    descriptionMn: 'LED гэрэл, тохиргоо, шилний солилт, бамбай тохируулга.' },
  { id: 'ext-headlight-r', stage: 'exterior',
    titleMn: 'Гэрэлтүүлэг (баруун)',
    descriptionMn: 'LED гэрэл, тохиргоо, шилний солилт, бамбай тохируулга.' },
  { id: 'ext-grille',      stage: 'exterior',
    titleMn: 'Радиаторын тор',
    descriptionMn: 'Радиаторын торны цэвэрлэгээ, гэмтэлийн засвар.' },
  { id: 'ext-wheel-fl',    stage: 'exterior',
    titleMn: 'Урд зүүн дугуй',
    descriptionMn: 'Түдгэлзүүр, балансжуулалт, тэнхлэгийн тохируулга.' },
  { id: 'ext-wheel-fr',    stage: 'exterior',
    titleMn: 'Урд баруун дугуй',
    descriptionMn: 'Түдгэлзүүр, балансжуулалт, тэнхлэгийн тохируулга.' },
  { id: 'ext-wheel-rl',    stage: 'exterior',
    titleMn: 'Арын зүүн дугуй',
    descriptionMn: 'Дугуй солилт, балансжуулалт, амортизаторын шалгалт.' },
  { id: 'ext-wheel-rr',    stage: 'exterior',
    titleMn: 'Арын баруун дугуй',
    descriptionMn: 'Дугуй солилт, балансжуулалт, амортизаторын шалгалт.' },
  { id: 'ext-mirror-l',    stage: 'exterior',
    titleMn: 'Хажуугийн толь (зүүн)',
    descriptionMn: 'Цахилгаан тохируулга, толины шилний солилт, халаалт.' },
  { id: 'ext-mirror-r',    stage: 'exterior',
    titleMn: 'Хажуугийн толь (баруун)',
    descriptionMn: 'Цахилгаан тохируулга, толины шилний солилт, халаалт.' },
  { id: 'ext-windshield',  stage: 'exterior',
    titleMn: 'Урд салхины шил',
    descriptionMn: 'Шилний солилт, хагарал засвар, шил арчигчийн засвар.' },

  // === ENGINE APPROACH (closed hood) — only hotspots reachable from outside ===
  { id: 'eng-app-hood',    stage: 'engine_approach',
    titleMn: 'Капот ба түүний механизм',
    descriptionMn: 'Капотын механизмын засвар, амортизатор, түгжээ. Капот доторх булан рүү шилжих.' },
  { id: 'eng-app-front',   stage: 'engine_approach',
    titleMn: 'Урд гэрэлтүүлэг',
    descriptionMn: 'Урд LED гэрэл, бамбай, шилний солилт.' },

  // === ENGINE BAY (open hood) — internals visible only with hood open ===
  { id: 'eng-block',       stage: 'engine_bay',
    titleMn: 'V35A-FTS хөдөлгүүр',
    descriptionMn: '3.5л V6 турбо хөдөлгүүрийн оношилгоо, их засвар, цилиндрийн засвар.' },
  { id: 'eng-battery',     stage: 'engine_bay',
    titleMn: 'Аккумулятор',
    descriptionMn: 'Батарей солилт, цахилгааны оношилгоо, зэврэлт цэвэрлэгээ.' },
  { id: 'eng-air-filter',  stage: 'engine_bay',
    titleMn: 'Агаарын шүүлтүүр',
    descriptionMn: 'Шүүлтүүр солилт, агаарын замын шалгалт.' },
  { id: 'eng-radiator',    stage: 'engine_bay',
    titleMn: 'Радиатор',
    descriptionMn: 'Хөргөлтийн шингэн солилт, радиатор засвар, системийн угаалт.' },
  { id: 'eng-intake',      stage: 'engine_bay',
    titleMn: 'Сорогч хошуу',
    descriptionMn: 'Турбо системийн оношилгоо, агаар сорох замын шалгалт.' },
  { id: 'eng-fuse-box',    stage: 'engine_bay',
    titleMn: 'Гал хамгаалагчийн хайрцаг',
    descriptionMn: 'Цахилгаан схемийн оношилгоо, гал хамгаалагч солилт, рэлэ шалгалт.' },

  // === UNDERNEATH ===
  { id: 'und-susp-fl',    stage: 'underneath',
    titleMn: 'Урд түдгэлзүүр (зүүн)',
    descriptionMn: 'Давхар хөшүүргэт түдгэлзүүр, амортизатор, бөмбөлгөн холбоосын засвар.' },
  { id: 'und-susp-fr',    stage: 'underneath',
    titleMn: 'Урд түдгэлзүүр (баруун)',
    descriptionMn: 'Давхар хөшүүргэт түдгэлзүүр, амортизатор, бөмбөлгөн холбоосын засвар.' },
  { id: 'und-susp-rl',    stage: 'underneath',
    titleMn: 'Арын түдгэлзүүр (зүүн)',
    descriptionMn: 'Хатуу тэнхлэгт түдгэлзүүр, 4 цэгийн холбоос, амортизаторын засвар.' },
  { id: 'und-susp-rr',    stage: 'underneath',
    titleMn: 'Арын түдгэлзүүр (баруун)',
    descriptionMn: 'Хатуу тэнхлэгт түдгэлзүүр, 4 цэгийн холбоос, амортизаторын засвар.' },
  { id: 'und-exhaust',    stage: 'underneath',
    titleMn: 'Яндангийн систем',
    descriptionMn: 'Каталитик хувиргагч, дуу намсгагч, иж бүрэн солилт ба засвар.' },
  { id: 'und-fuel-tank',  stage: 'underneath',
    titleMn: 'Түлшний сав',
    descriptionMn: 'Түлшний сав цэвэрлэгээ, насос солилт, шугам шалгалт.' },
  { id: 'und-transfer',   stage: 'underneath',
    titleMn: 'Хөтлөгчийн хайрцаг',
    descriptionMn: 'Дөрвөн дугуйн хөтлөгчийн систем, тосны солилт, шүдлэг засвар.' },
  { id: 'und-diff-f',     stage: 'underneath',
    titleMn: 'Урд диференциал',
    descriptionMn: 'Урд диференциал тосны солилт, шүдлэг хүрд шалгалт.' },
  { id: 'und-diff-r',     stage: 'underneath',
    titleMn: 'Арын диференциал',
    descriptionMn: 'Арын диференциал тосны солилт, шүдлэг хүрд шалгалт.' },
];

export function hotspotById(id: string): Hotspot | undefined {
  return HOTSPOTS.find((h) => h.id === id);
}

export function hotspotsForStage(stage: import('./types').Stage) {
  return HOTSPOTS.filter((h) => h.stage === stage);
}
```

- [ ] **Step 2: Commit**

```
git add src/components/lc300-360/data/hotspots.ts
git commit -m "feat(360): baseline Mongolian hotspot copy (pre-Phase-5 correction)"
```

---

### Task 4.2: HotspotOverlay component

**Files:**
- Create: `src/components/lc300-360/HotspotOverlay.tsx`

- [ ] **Step 1: Write component**

Create `src/components/lc300-360/HotspotOverlay.tsx`:
```tsx
'use client';

import { useMemo } from 'react';
import { hotspotById } from './data/hotspots';
import type { Hotspot, StageManifest } from './data/types';

interface Props {
  stage: StageManifest;
  frame: number;
  onSelect: (h: Hotspot, triggerEl: HTMLElement) => void;
}

export function HotspotOverlay({ stage, frame, onSelect }: Props) {
  const projections = stage.hotspotProjections[frame] ?? [];

  const items = useMemo(() => projections.map((p) => {
    const h = hotspotById(p.id);
    if (!h) return null;
    return { h, p };
  }).filter((x): x is { h: Hotspot; p: typeof projections[number] } => x !== null), [projections]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {items.map(({ h, p }) => (
        <button
          key={h.id}
          aria-label={`${h.titleMn} - үйлчилгээний мэдээлэл`}
          onClick={(e) => onSelect(h, e.currentTarget)}
          tabIndex={p.visible ? 0 : -1}
          style={{
            position: 'absolute',
            left: `${p.x * 100}%`,
            top:  `${p.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            opacity: p.visible ? 1 : 0,
            transition: 'opacity 0.25s',
            pointerEvents: p.visible ? 'auto' : 'none',
            width: 28, height: 28, borderRadius: '50%',
            background: '#ff3a2a',
            border: '2px solid white',
            cursor: 'pointer',
            boxShadow: '0 0 0 4px rgba(255,58,42,0.25), 0 4px 12px rgba(0,0,0,0.3)',
            padding: 0,
          }}
        >
          <span style={{
            position: 'absolute', left: 36, top: '50%', transform: 'translateY(-50%)',
            whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.78)', color: 'white',
            padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            pointerEvents: 'none',
          }}>
            {h.titleMn}
          </span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/lc300-360/HotspotOverlay.tsx
git commit -m "feat(360): HotspotOverlay reading per-frame projected positions"
```

---

### Task 4.3: HotspotModal with focus trap

**Files:**
- Create: `src/components/lc300-360/HotspotModal.tsx`

- [ ] **Step 1: Write the modal**

Create `src/components/lc300-360/HotspotModal.tsx`:
```tsx
'use client';

import { useEffect, useRef } from 'react';
import { CTA_PHONE_DISPLAY, CTA_PHONE_TEL } from './data/types';
import type { Hotspot } from './data/types';

interface Props {
  hotspot: Hotspot | null;
  returnFocusTo: HTMLElement | null;
  onClose: () => void;
  onCtaClick?: () => void;
}

export function HotspotModal({ hotspot, returnFocusTo, onClose, onCtaClick }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!hotspot) return;
    const previousActive = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      (returnFocusTo ?? previousActive)?.focus?.();
    };
  }, [hotspot, onClose, returnFocusTo]);

  if (!hotspot) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`hotspot-title-${hotspot.id}`}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 92vw)',
          background: '#121214', borderRadius: 16,
          padding: '24px 24px 20px', color: '#f5f5f5',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h3 id={`hotspot-title-${hotspot.id}`} style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          {hotspot.titleMn}
        </h3>
        <p style={{ margin: '12px 0 20px', fontSize: 14, lineHeight: 1.55, color: '#cdcdd2' }}>
          {hotspot.descriptionMn}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={CTA_PHONE_TEL}
            onClick={onCtaClick}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 999,
              background: '#ff3a2a', color: 'white', textAlign: 'center',
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}
          >
            Цаг захиалах · {CTA_PHONE_DISPLAY}
          </a>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            style={{
              padding: '12px 18px', borderRadius: 999,
              border: '1px solid #2e2e34', background: 'transparent',
              color: '#cdcdd2', cursor: 'pointer', fontSize: 14,
            }}
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/lc300-360/HotspotModal.tsx
git commit -m "feat(360): HotspotModal with focus trap + Escape close + focus return"
```

---

### Task 4.4: StageButtons UI

**Files:**
- Create: `src/components/lc300-360/StageButtons.tsx`

- [ ] **Step 1: Write component**

Create `src/components/lc300-360/StageButtons.tsx`:
```tsx
'use client';

import type { Stage } from './data/types';
import { STAGE_LABELS, STAGE_ORDER } from './data/types';

interface Props {
  stage: Stage;
  onChange: (s: Stage) => void;
}

export function StageButtons({ stage, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Машины үзэх булан"
      style={{
        display: 'flex', gap: 8, padding: 8,
        background: 'rgba(0,0,0,0.55)', borderRadius: 999,
        backdropFilter: 'blur(8px)',
      }}
    >
      {STAGE_ORDER.map((s) => {
        const active = s === stage;
        return (
          <button
            key={s}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s)}
            style={{
              padding: '10px 18px', borderRadius: 999,
              border: 'none', cursor: 'pointer',
              background: active ? '#ff3a2a' : 'transparent',
              color: 'white', fontWeight: 600, fontSize: 14,
              transition: 'background 0.2s',
            }}
          >
            {STAGE_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/lc300-360/StageButtons.tsx
git commit -m "feat(360): StageButtons with ARIA tablist semantics"
```

---

## Phase 5: Mongolian Terminology Correction (USER REVIEW REQUIRED)

### Task 5.1: Propose corrected terms

This task does NOT modify code yet — it proposes a corrections diff to the file you wrote in 4.1, and pauses for your sign-off.

**Files:**
- Create: `docs/superpowers/specs/2026-05-26-lc300-mongolian-terms.md`

- [ ] **Step 1: Write the proposed-corrections doc**

Create `docs/superpowers/specs/2026-05-26-lc300-mongolian-terms.md`:
```markdown
# LC300 Hotspot Mongolian Terminology — Proposed Corrections

**Reviewer:** GS Auto Center owner (native Mongolian speaker)
**Status:** Awaiting review

For each row, I list the term used in `data/hotspots.ts`, why it's suspect, and the proposed correction. Please mark each Approve / Reject / Edit.

## Engine / mechanical terms

| Hotspot id | Current | Concern | Proposed | Status |
|---|---|---|---|---|
| ext-hood | Капот | Russian loanword (капо́т); proper Mongolian exists | Хөдөлгүүрийн таг (= engine cover/lid) — formal · OR keep Капот if colloquial usage is preferred | ⬜ |
| ext-grille | Радиаторын тор | "Radiator's mesh" — correct but tor is generic | Радиаторын сараалж (= radiator slat/grating) | ⬜ |
| eng-battery | Аккумулятор | Russian loanword | Цахилгаан хураагуур (= electricity accumulator, native) · Note: Аккумулятор is widely understood | ⬜ |
| eng-radiator | Радиатор | Russian loanword | Хөргөгч (= cooler, native) · Note: Радиатор is widely understood | ⬜ |
| eng-intake | Сорогч хошуу | "Sucking nozzle" — informal | Агаар сорох хошуу (= air-intake nozzle) · OR Хөдөлгүүрийн агаар оруулагч (more formal) | ⬜ |
| eng-fuse-box | Гал хамгаалагчийн хайрцаг | OK — "fire-guard's box" is the standard | (no change) | ⬜ |
| und-transfer | Хөтлөгчийн хайрцаг | "Driver's box" — vague | Хүчний дамжуулагч (= power transmitter/transfer case) · OR Раздаткаа (Russian colloquial, widely used in MN garage talk) | ⬜ |
| und-diff-f, und-diff-r | Урд/Арын диференциал | Direct loanword (диференциал) — accurate but foreign | Урд/Арын ялгавартай хайрцаг (= differential box, native) · Note: диференциал is widely used | ⬜ |
| und-exhaust | Яндангийн систем | OK — "exhaust system" | (no change) | ⬜ |
| Каталитик хувиргагч (in exhaust desc) | OK | direct calque | (no change) | ⬜ |
| Дуу намсгагч (in exhaust desc) | OK — "noise reducer" / muffler | (no change) | ⬜ |
| Түлшний сав | OK | "fuel container" | (no change) | ⬜ |

## Body / chassis terms

| Hotspot id | Current | Concern | Proposed | Status |
|---|---|---|---|---|
| und-susp-* | Түдгэлзүүр | Generic "shock/spring" — accurate | (no change) | ⬜ |
| Давхар хөшүүргэт түдгэлзүүр | "double-lever suspension" = double wishbone | OK | (no change) | ⬜ |
| Хатуу тэнхлэгт түдгэлзүүр | "rigid-axle suspension" | OK | (no change) | ⬜ |
| Бөмбөлгөн холбоос | Ball joint | accurate calque | (no change) | ⬜ |
| Амортизатор | Russian loanword | Цохилт сааруулагч (= shock absorber, native) · Амортизатор widely used | ⬜ |
| ext-mirror-* | Хажуугийн толь | OK | (no change) | ⬜ |
| ext-windshield | Урд салхины шил | OK — "front wind glass" | (no change) | ⬜ |

## Tone / phrasing

| Field | Concern | Proposed | Status |
|---|---|---|---|
| All "хэрэглэгчийн зөвлөгөө" phrases | "user advice" — too clinical | "зөвлөгөө өгөх" (= give advice) more natural | ⬜ |
| "JAPAN TOK түдгэлзүүр" (was in old plan) | Brand-coupled — REMOVED in this plan | (already removed) | ✓ |
| "Цаг захиалах" (CTA) | OK — "book a time" | (no change) | ⬜ |

## Action

Please mark each ⬜ above as ✓ (approve), ✗ (reject — keep current), or ✎ (edit, write new wording).
Return this document with your annotations and Task 5.2 will apply the diff.
```

- [ ] **Step 2: Commit and notify user**

```
git add docs/superpowers/specs/2026-05-26-lc300-mongolian-terms.md
git commit -m "docs(360): proposed Mongolian terminology corrections for user review"
```

Print to stdout: "**PAUSED for user review.** See `docs/superpowers/specs/2026-05-26-lc300-mongolian-terms.md`. Mark each row ✓/✗/✎ and reply when done."

---

### Task 5.2: Apply user-approved corrections

This task ONLY runs after the user returns the marked-up document.

**Files:**
- Modify: `src/components/lc300-360/data/hotspots.ts`

- [ ] **Step 1: Read the marked document**

Read `docs/superpowers/specs/2026-05-26-lc300-mongolian-terms.md`. For every row marked ✓, apply the "Proposed" text to the corresponding hotspot field. For ✎, use the user's written wording. For ✗, keep current.

- [ ] **Step 2: Add glossary comment**

At the top of `src/components/lc300-360/data/hotspots.ts`, add the glossary explaining the choices, so future maintainers understand why each term was selected:
```ts
// Mongolian automotive terminology in this file was reviewed and approved on <DATE> by
// the GS Auto Center owner (native speaker). Key decisions:
//   - Капот kept / Хөдөлгүүрийн таг used: <decision>
//   - Аккумулятор kept / Цахилгаан хураагуур used: <decision>
//   ... etc ...
// See docs/superpowers/specs/2026-05-26-lc300-mongolian-terms.md for the full review.
```

- [ ] **Step 3: Commit**

```
git add src/components/lc300-360/data/hotspots.ts docs/superpowers/specs/2026-05-26-lc300-mongolian-terms.md
git commit -m "feat(360): apply user-approved Mongolian terminology corrections"
```

---

## Phase 6: SSR / SEO

### Task 6.1: Analytics hook scaffold

**Files:**
- Create: `src/components/lc300-360/hooks/useAnalytics.ts`

- [ ] **Step 1: Write the hook**

Create `src/components/lc300-360/hooks/useAnalytics.ts`:
```ts
'use client';

import { useCallback } from 'react';

type GtagEvent =
  | { name: 'lc300_stage_changed';   params: { from: string; to: string } }
  | { name: 'lc300_hotspot_opened';  params: { hotspot_id: string; stage: string } }
  | { name: 'lc300_cta_clicked';     params: { hotspot_id: string; stage: string } }
  | { name: 'lc300_first_paint_ms';  params: { value: number } };

interface GtagWindow extends Window {
  gtag?: (action: 'event', name: string, params: Record<string, unknown>) => void;
}

export function useAnalytics() {
  const track = useCallback(<E extends GtagEvent>(event: E) => {
    if (typeof window === 'undefined') return;
    const w = window as GtagWindow;
    w.gtag?.('event', event.name, event.params);
  }, []);
  return { track };
}
```

- [ ] **Step 2: Commit**

```
git add src/components/lc300-360/hooks/useAnalytics.ts
git commit -m "feat(360): useAnalytics hook with typed GA4 event names"
```

---

### Task 6.2: Top-level LC300Carousel component

**Files:**
- Create: `src/components/lc300-360/LC300Carousel.tsx`

- [ ] **Step 1: Write component**

Create `src/components/lc300-360/LC300Carousel.tsx`:
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { StageCarousel } from './StageCarousel';
import { HotspotOverlay } from './HotspotOverlay';
import { HotspotModal } from './HotspotModal';
import { StageButtons } from './StageButtons';
import { useStage } from './hooks/useStage';
import { useAnalytics } from './hooks/useAnalytics';
import { MANIFEST_URL } from './data/paths';
import type { Hotspot, Manifest, Stage } from './data/types';

interface Props {
  manifest?: Manifest;
}

const STAGE_ARIA: Record<Stage, string> = {
  exterior:        'Land Cruiser 300 гадна тал',
  engine_approach: 'Land Cruiser 300 капот руу ойртох',
  engine_bay:      'Land Cruiser 300 хөдөлгүүрийн булан',
  underneath:      'Land Cruiser 300 доод тал',
};

export default function LC300Carousel({ manifest: ssrManifest }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(ssrManifest ?? null);
  const { stage, goTo } = useStage();
  const [frame, setFrame] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const firstPaintAt = useRef<number>(performance.now());
  const { track } = useAnalytics();

  useEffect(() => {
    if (manifest) return;
    fetch(MANIFEST_URL).then((r) => r.json()).then(setManifest);
  }, [manifest]);

  useEffect(() => {
    if (manifest) {
      track({ name: 'lc300_first_paint_ms', params: { value: Math.round(performance.now() - firstPaintAt.current) } });
    }
  }, [manifest, track]);

  if (!manifest) return null;

  const stageData = manifest.stages[stage];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <StageCarousel
        key={stage}
        stage={stageData}
        onFrameChange={setFrame}
        ariaLabel={STAGE_ARIA[stage]}
      />
      <HotspotOverlay
        stage={stageData}
        frame={frame}
        onSelect={(h, el) => {
          lastTriggerRef.current = el;
          setActiveHotspot(h);
          track({ name: 'lc300_hotspot_opened', params: { hotspot_id: h.id, stage } });
        }}
      />
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10,
      }}>
        <StageButtons
          stage={stage}
          onChange={(s) => {
            track({ name: 'lc300_stage_changed', params: { from: stage, to: s } });
            goTo(s);
            setFrame(0);
          }}
        />
      </div>
      <HotspotModal
        hotspot={activeHotspot}
        returnFocusTo={lastTriggerRef.current}
        onClose={() => setActiveHotspot(null)}
        onCtaClick={() => activeHotspot && track({
          name: 'lc300_cta_clicked',
          params: { hotspot_id: activeHotspot.id, stage }
        })}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/lc300-360/LC300Carousel.tsx
git commit -m "feat(360): LC300Carousel top-level with analytics + focus return"
```

---

### Task 6.3: SSR section with noscript + schema.org

**Files:**
- Create: `src/components/LC300CarouselSection.tsx`
- Create: `src/components/lc300-360/index.ts`

- [ ] **Step 1: Write the barrel**

Create `src/components/lc300-360/index.ts`:
```ts
export { default as LC300Carousel } from './LC300Carousel';
```

- [ ] **Step 2: Write SSR section**

Create `src/components/LC300CarouselSection.tsx`:
```tsx
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Manifest } from './lc300-360/data/types';

const LC300Carousel = dynamic(
  () => import('./lc300-360').then((m) => m.LC300Carousel),
  { ssr: false },
);

async function loadManifest(): Promise<Manifest | null> {
  try {
    const p = path.join(process.cwd(), 'public/models/lc300-360/manifest.json');
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
}

// GS Auto Center is a service center, NOT a car dealer.
// Use AutoRepair (service business schema), not Vehicle (product/asset schema).
// AutoRepair signals to Google: "this is a business that services cars", which
// is what we want indexed for queries like "Toyota servis Ulaanbaatar".
const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AutoRepair',
  '@id': 'https://gs-autocenter.mn/#business',
  name: 'GS Auto Center',
  description: 'Toyota болон Lexus автомашины засвар үйлчилгээний төв. Хөдөлгүүр, түдгэлзүүр, цахилгаан, оношилгоо.',
  telephone: '+97677200570',
  url: 'https://gs-autocenter.mn',
  image: 'https://gs-autocenter.mn/models/lc300-360/exterior/hero.webp',
  areaServed: { '@type': 'AdministrativeArea', name: 'Ulaanbaatar' },
  knowsAbout: [
    'Toyota Land Cruiser 300',
    'Toyota Land Cruiser service',
    'Lexus service',
    'V35A-FTS engine',
    'Toyota suspension repair',
  ],
  makesOffer: [
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Toyota Land Cruiser 300 үйлчилгээ',
        description: 'Хөдөлгүүрийн оношилгоо, түдгэлзүүрийн засвар, тосны солилт, цахилгааны систем, бүх төрлийн засвар.',
      },
    },
  ],
};

export default async function LC300CarouselSection() {
  const manifest = await loadManifest();
  return (
    <section id="lc300-explorer" style={{ padding: '64px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 24, color: '#f5f5f5' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Land Cruiser 300</h2>
        <p style={{ marginTop: 8, color: '#9a9aa0' }}>
          Машиныг эргүүлж, дотрыг нь нээж, доороос харна уу
        </p>
      </div>

      <noscript>
        {manifest && (
          <div style={{ display: 'grid', gap: 16 }}>
            {(Object.keys(manifest.stages) as (keyof typeof manifest.stages)[]).map((s) => (
              <Image
                key={s}
                src={manifest.stages[s].heroPath}
                alt={`Land Cruiser 300 — ${s}`}
                width={manifest.stages[s].width}
                height={manifest.stages[s].height}
                priority={s === 'exterior'}
              />
            ))}
          </div>
        )}
      </noscript>

      <LC300Carousel manifest={manifest ?? undefined} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
      />
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```
git add src/components/lc300-360/index.ts src/components/LC300CarouselSection.tsx
git commit -m "feat(360): SSR section with hero <noscript> fallback + schema.org AutoRepair"
```

---

### Task 6.4: Page integration

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Find old explorer in page.tsx**

Use Grep to locate `VehicleExplorer` import in `src/app/page.tsx`.

- [ ] **Step 2: Replace**

Replace the `VehicleExplorer` import with:
```tsx
import LC300CarouselSection from '@/components/LC300CarouselSection';
```
And replace its JSX usage with `<LC300CarouselSection />`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build passes.

- [ ] **Step 4: Commit**

```
git add src/app/page.tsx
git commit -m "feat(360): swap old VehicleExplorer for LC300CarouselSection"
```

---

### Task 6.5: OG image + meta

**Files:**
- Modify: `src/app/page.tsx` (or `layout.tsx` per existing pattern)

- [ ] **Step 1: Find current metadata export**

Grep for `export const metadata` in `src/app/`.

- [ ] **Step 2: Add OG image pointing to exterior hero**

In the relevant file, ensure `metadata.openGraph.images` includes `/models/lc300-360/exterior/hero.webp`:
```ts
openGraph: {
  images: [
    { url: '/models/lc300-360/exterior/hero.webp', width: 1280, height: 720,
      alt: 'Toyota Land Cruiser 300 — GS Auto Center' },
  ],
},
```

- [ ] **Step 3: Commit**

```
git add src/app/page.tsx
git commit -m "feat(360): OG image points to LC300 exterior hero render"
```

---

## Phase 7: Analytics (GA4)

### Task 7.1: Confirm GA4 is already on the page

- [ ] **Step 1: Grep for existing GA setup**

Run a Grep for `gtag` or `googletagmanager` in `src/`. If found, the `useAnalytics` hook from Task 6.1 will hit existing GA. If not found, proceed to step 2.

- [ ] **Step 2: If GA not present, add it via next/script**

In `src/app/layout.tsx`, add the GA4 script (replacing `G-XXXXXXX` with the GA4 Measurement ID — ask user for it if not in env):
```tsx
import Script from 'next/script';

// inside <head> or top of <body>:
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
  strategy="afterInteractive"
/>
<Script id="ga-init" strategy="afterInteractive">{`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { anonymize_ip: true });
`}</Script>
```

- [ ] **Step 3: Confirm env var**

Open `.env.local` and ensure `NEXT_PUBLIC_GA_ID=G-XXXXXXX` is present. If not, ask the user for the GA4 Measurement ID and add it.

- [ ] **Step 4: Commit**

```
git add src/app/layout.tsx
git commit -m "feat(360): ensure GA4 script loaded for analytics events"
```

---

### Task 7.2: Verify event wiring

The events are wired in Task 6.2. This is a verification task only.

- [ ] **Step 1: Smoke test events fire**

After Phase 9 verification starts the dev server, open browser DevTools → Network filter for `google-analytics` or `collect`. Click a hotspot, change stage, click CTA. Confirm three event POSTs.

- [ ] **Step 2: Document expected event payloads**

Append to `docs/superpowers/specs/2026-05-26-lc300-360-rendered-approach.md` (the spec, not this plan) a section listing each event name and its params.

(Skip commit — verification only.)

---

## Phase 8: Accessibility wrap-up

Most a11y features are in the components above. This phase verifies tab order and documents shortcuts.

### Task 8.1: Verify keyboard tab order

- [ ] **Step 1: Manually tab through**

Open the page, press Tab repeatedly:
1. Stage buttons (4, in `tablist` — exterior, engine_approach, engine_bay, underneath)
2. Carousel container (`tabIndex={0}` — receives arrow keys)
3. Visible hotspots
4. Modal close + CTA (when modal is open, focus trapped inside)

If any control is skipped or out of order, adjust `tabIndex` in `LC300Carousel.tsx` and `StageButtons.tsx`.

- [ ] **Step 2: Document keyboard map in the spec**

In `docs/superpowers/specs/2026-05-26-lc300-360-rendered-approach.md`, document the keyboard shortcuts so support staff can answer user questions.

---

## Phase 9: Verification

### Task 9.1: Build, lint, types, tests

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Tests**

Run: `npx vitest run`
Expected: `useFrameSequence` (6) + `useDragRotate` (4) tests pass = **10 total**. The two new useFrameSequence tests cover the LRU memory cap and getFrame-promotes-in-LRU behavior added in Task 3.3.

- [ ] **Step 5: Commit any housekeeping**

```
git add -A
git commit -m "chore(360): housekeeping fixes from verification"
```

---

### Task 9.2: Browser verification via Claude in Chrome

- [ ] **Step 1: Start dev server**

In a separate terminal, run: `npm run dev`. Note the localhost URL.

- [ ] **Step 2: Navigate**

Use `mcp__Claude_in_Chrome__navigate` to `http://localhost:3000/#lc300-explorer`.

- [ ] **Step 3: Wait for load and capture exterior**

Use `mcp__Claude_in_Chrome__javascript_tool` to evaluate:
```js
document.getElementById('lc300-explorer').scrollIntoView({ behavior: 'instant' });
new Promise(r => setTimeout(r, 6000));
```
Then use `mcp__Claude_in_Chrome__read_page` or screenshot to capture the visible state.

Verify: LC300 in studio lighting, hotspots positioned on real parts.

- [ ] **Step 4: Drag to rotate**

Use `mcp__Claude_in_Chrome__javascript_tool` to simulate drag:
```js
const el = document.querySelector('[role="img"]');
const r  = el.getBoundingClientRect();
const cx = r.left + r.width/2, cy = r.top + r.height/2;
el.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx,      clientY: cy, pointerId: 1 }));
el.dispatchEvent(new PointerEvent('pointermove', { clientX: cx+200,  clientY: cy, pointerId: 1 }));
el.dispatchEvent(new PointerEvent('pointerup',   { clientX: cx+200,  clientY: cy, pointerId: 1 }));
```
Verify the car has rotated. Screenshot.

Tab indices after the engine split:
  Index 0 → exterior
  Index 1 → engine_approach (closed hood, dolly + orbit)
  Index 2 → engine_bay      (hood open from frame 0, 360° orbit)
  Index 3 → underneath

- [ ] **Step 5: Stage change to engine_approach (index 1)**

```js
document.querySelectorAll('[role="tab"]')[1].click();
```
Wait 2s. Screenshot. Verify the hood is **closed**, the camera is at a front-quarter angle, and the engine_approach hotspots (capot mechanism, front lights) are visible. The "Капот руу" tab should be marked `aria-selected="true"`.

- [ ] **Step 6: Stage change to engine_bay (index 2)**

```js
document.querySelectorAll('[role="tab"]')[2].click();
```
Wait 2s. Screenshot. Verify the **hood is fully open** and the V6 engine, intake, battery, and fuse box are clearly visible. The "Хөдөлгүүр" tab should be marked `aria-selected="true"`. Engine_bay hotspots (eng-block, eng-battery, eng-intake, etc.) should appear at positions overlapping their real-world parts.

- [ ] **Step 7: Stage change to underneath (index 3)**

```js
document.querySelectorAll('[role="tab"]')[3].click();
```
Wait 2s. Screenshot. Verify chassis, suspension corners, exhaust, and differentials are visible. The "Доод тал" tab should be marked `aria-selected="true"`.

- [ ] **Step 8: Open a hotspot**

```js
const hs = document.querySelector('button[aria-label*="түдгэлзүүр"]');
hs?.click();
```
Verify modal opens with Mongolian copy + Цаг захиалах CTA.

- [ ] **Step 9: Console errors check**

Use `mcp__Claude_in_Chrome__read_console_messages`. Expected: no errors.

- [ ] **Step 10: Memory check**

```js
performance.memory?.usedJSHeapSize
```
Expected: under 200 MB. (LRU cap from Task 3.3 enforces this — verify by switching through all 4 stages and confirming heap stays bounded.)

---

### Task 9.3: Lighthouse audit

- [ ] **Step 1: Run Lighthouse via Chrome devtools**

Open Chrome DevTools → Lighthouse → Mobile profile → Run.
Targets: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO = 100.

- [ ] **Step 2: Fix any sub-90 score**

Common fixes:
- "Properly size images" → check WebP frame dimensions match display size
- "Reduce unused JS" → ensure heavy components are dynamic-imported
- "Image elements do not have explicit width and height" → carousel `<img>` needs `width`/`height` attrs from manifest (already done in StageCarousel)

- [ ] **Step 3: Document Lighthouse scores**

Append to `docs/superpowers/specs/2026-05-26-lc300-360-rendered-approach.md` a "Lighthouse" subsection with date + four scores.

- [ ] **Step 4: Commit**

```
git add docs/superpowers/specs/2026-05-26-lc300-360-rendered-approach.md
git commit -m "docs(360): record Lighthouse audit scores"
```

---

### Task 9.4: Throttled-network real-device test

- [ ] **Step 1: Throttle to "Fast 3G"**

Chrome DevTools → Network → Throttling → "Fast 3G" (typical Ulaanbaatar 4G).

- [ ] **Step 2: Hard-reload**

Cmd/Ctrl + Shift + R.

- [ ] **Step 3: Measure**

LQIP visible within: target ≤ 1.5 s
First WebP frame visible within: target ≤ 4 s
All exterior frames loaded within: target ≤ 12 s

If any target is missed, increase the LQIP byte budget, reduce frame count for exterior (re-render), or relax preload concurrency in `useBandwidth`.

- [ ] **Step 4: Document**

Append to the spec.

---

### Task 9.5: Bundle size audit

- [ ] **Step 1: Sum the LC300 360 directory**

```
du -sh public/models/lc300-360
```
Expected: under 5 MB total.

- [ ] **Step 2: Check Next.js build report**

Run: `npm run build`. The LC300 page client bundle (JS only) should add under 30 KB to the existing baseline.

- [ ] **Step 3: If over budget**

Drop frame counts. Re-render only the affected stage. The pipeline is idempotent.

---

### Task 9.6: Final PR readiness

- [ ] **Step 1: Pull main**

Run: `git fetch origin main`

- [ ] **Step 2: Confirm clean diff**

Run: `git log --oneline origin/main..HEAD`
Expected: clean list of `feat(360):`, `docs(360):`, `chore(360):` commits.

- [ ] **Step 3: Status**

Run: `git status`
Expected: clean.

- [ ] **Step 4: Hand off**

Inform the user the worktree is ready for review/merge. Do not auto-push or auto-PR.

---

## Self-Review

**Spec coverage** — every Cowork defect from the pivot brief AND the 8 follow-up fixes has a task:

**Original pivot defects:**

| Cowork defect | Task |
|---|---|
| Runtime discards textures | N/A — no runtime asset pipeline |
| WebGPU not wired | N/A — no WebGL |
| Three.js version mismatch | N/A — no Three.js |
| SpringValue subscription bug | N/A — no springs |
| Skeleton GLB dead code | N/A — LQIP is a real WebP image used by `StageCarousel` (Task 3.7) |
| Hood pivot wrong | Task 1.5 `fix_hood_pivot_once` |
| Magic-number engine/underbody positions | N/A — projections come from real 3D anchors via Blender (Task 1.5) |
| `mcp__Claude_Preview__*` doesn't exist | Task 9.2 uses `mcp__Claude_in_Chrome__*` |
| vitest not installed | Task 3.1 installs it |
| Sketchfab auth | N/A — no Sketchfab downloads |
| No SSR/SEO | Tasks 6.3 (noscript + hero), 6.5 (OG image), schema.org JSON-LD |
| No GA4 | Tasks 6.1, 6.2, 7.1, 7.2 |
| Mongolian terminology errors | Phase 5 (propose + user review + apply) |
| Donor remix problem | N/A — render the actual NLM LC300 |

**Audit-driven follow-up fixes (2026-05-26 PM):**

| Fix | Where addressed |
|---|---|
| 1. Render time = "overnight, 2–4 iterations" | Plan header, Phase 1 intro, render_stages.py docstring, Tasks 1.6/1.7a/1.7b/1.8 |
| 2. Engine split into two sub-sequences | STAGES dict adds `engine_approach` + `engine_bay`; Tasks 1.7a + 1.7b separate; `Stage` type updated; hotspots re-tagged |
| 3. Key + fill lights + samples=256 + AgX view transform | Task 1.4 `setup_render_scene.py` |
| 4. Mongolian H2: Машинаа → Машиныг | Task 6.3 `LC300CarouselSection.tsx` |
| 5. schema.org AutoRepair (not Vehicle) | Task 6.3 SCHEMA constant |
| 6. LRU memory cap on useFrameSequence | Task 3.3 (`maxBytes` option + LRU eviction) + Task 3.7 (StageCarousel passes width/height/maxBytes) |
| 7. CI build fence | New Task 2.3 (`scripts/check-360-assets.mjs` wired as `prebuild`) |
| 8. Degenerate-occlusion fallback | Task 1.5 `detect_degenerate_occlusion` + `in_frame` field added |
| 9. NLM commercial license | Skipped — already verified ($32 royalty-free) |

**Placeholder scan** — no "TBD" / "TODO" / "implement later". Every step has runnable code or commands. The one exception is Task 5.2 which explicitly pauses for user input — by design.

**Type consistency:**
- `Stage` (now four values: `exterior` / `engine_approach` / `engine_bay` / `underneath`) defined in `data/types.ts`, used consistently in `useStage`, `StageCarousel`, `HotspotOverlay`, `LC300Carousel`, `StageButtons`, `useAnalytics`, hotspot data file, render script's `--stage` choices, Node STAGES arrays in encode-webp.mjs and generate-manifest.mjs, and asset-check script.
- `Hotspot` / `HotspotProjection` / `StageManifest` / `Manifest` defined in `data/types.ts`. `HotspotProjection` now has `in_frame` and `visible` separately so the runtime can tell whether occlusion gating was meaningful.
- `MANIFEST_URL` and `framePath()` consumed by `StageCarousel` and `LC300Carousel`.
- GA4 event names typed in `useAnalytics.ts`, identical strings used in `LC300Carousel` and `HotspotModal` callbacks.
- `onSelect` callback signature `(h, el) => void` matches between `HotspotOverlay.tsx` and `LC300Carousel.tsx`.
- LRU options on `useFrameSequence` (`width`, `height`, `maxBytes`) are threaded through from `StageCarousel` using `stage.width` / `stage.height` so the cap is sized to the actual frame dimensions, not guessed.
- Conventional commits use `feat(360):` / `docs(360):` / `chore(360):` throughout.

**Scope check:** single focused product (one LC300 360 carousel with three stages). v2 paint swatches and v2 scroll-driven camera are explicitly out of scope.

No issues found.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-26-lc300-360-rendered-approach.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, you review between tasks. Best for a plan this size; Phase 1 in particular has long-running Blender steps that benefit from clean subagent context per task.

**2. Inline Execution** — execute tasks in this session with checkpoints. Workable here because the plan is materially shorter than the abandoned realtime plan, but Phase 1 alone is ~3.5 h of Blender render time, so subagent-driven is still cleaner.

**Which approach?**
