# LC300 Explorer Strategic Reset — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, premium-quality 3D Land Cruiser 300 explorer with three curated stages (exterior, engine bay, undercarriage) per [docs/superpowers/specs/2026-05-26-lc300-explorer-strategic-reset.md](../specs/2026-05-26-lc300-explorer-strategic-reset.md).

**Architecture:** Single R3F `<Canvas>` with Three.js `WebGPURenderer` (auto WebGL2 fallback). Lazy-mounted stage groups, useSpring camera transitions, drei `<Lightformer>` studio rig instead of paid HDRIs, KTX2 + meshopt asset pipeline, adaptive degradation via `<PerformanceMonitor>`. All assets free CC-BY/CC0; Blender MCP used for donor prep, grille modeling, AO baking.

**Tech Stack:**
- Next.js 16 + React 19 (existing)
- three ^0.171 (use `three/webgpu` entry)
- @react-three/fiber ^9.6, @react-three/drei latest, @react-three/postprocessing ^3.0
- @react-spring/three (camera transitions)
- @gltf-transform/cli (asset pipeline)
- toktx (KTX2 HDRI encoding)
- Blender 4.2+ via mcp__blender__execute_blender_code

**Phases:**
1. Setup & dependency install
2. Asset acquisition (license verification + downloads)
3. Blender prep — skeleton, grille modeling, donor optimization
4. gltf-transform + KTX2 pipeline
5. R3F scaffolding (data, hooks, structure)
6. Lighting rig + Exterior stage
7. Engine bay stage
8. Undercarriage stage (stylized cutaway)
9. Hotspots + Mongolian modals
10. Performance monitor + adaptive degradation
11. Integration into existing page + retire old explorer
12. Verification

---

## Phase 1: Setup & Dependencies

### Task 1.1: Confirm worktree and install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Verify we are on the worktree branch**

Run: `git rev-parse --abbrev-ref HEAD`
Expected: `claude/frosty-einstein-a6d5dc`

- [ ] **Step 2: Install runtime dependencies**

Run:
```
npm install three@^0.171.0 @react-three/fiber@^9.6.0 @react-three/drei@latest @react-three/postprocessing@^3.0.4 @react-spring/three@^9.7.5
```
Expected: packages added to `package.json` `dependencies`.

- [ ] **Step 3: Install asset pipeline dev dependencies**

Run:
```
npm install --save-dev @gltf-transform/cli@latest
```
Expected: `@gltf-transform/cli` in `devDependencies`.

- [ ] **Step 4: Verify toktx is on PATH**

Run: `toktx --version`
Expected: a version string. If not found, document install instructions at the top of `public/models/lc300-ready/README.md` (Phase 3 creates this file).

- [ ] **Step 5: Commit**

```
git add package.json package-lock.json
git commit -m "chore(explorer): install r3f + asset pipeline dependencies"
```

---

### Task 1.2: Project folder scaffolding

**Files:**
- Create: `public/models/lc300-raw/` (gitignored)
- Create: `public/models/lc300-ready/.gitkeep`
- Create: `public/hdr/.gitkeep`
- Create: `src/components/vehicle-explorer-v2/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Create folder placeholders**

Use Write to create each `.gitkeep` (empty file).

- [ ] **Step 2: Update .gitignore**

Add these lines at the end of `.gitignore`:
```
# LC300 explorer — raw donor assets (downloaded, not committed)
public/models/lc300-raw/
public/hdr/*.hdr
public/hdr/*.exr

# Keep only the optimized -ready outputs and KTX2 conversions
!public/models/lc300-ready/
!public/hdr/*.ktx2
```

- [ ] **Step 3: Commit**

```
git add .gitignore public/models/lc300-ready/.gitkeep public/hdr/.gitkeep src/components/vehicle-explorer-v2/.gitkeep
git commit -m "chore(explorer): scaffold folder structure for lc300 assets"
```

---

## Phase 2: Asset Acquisition

### Task 2.1: Verify CAD-LAB Tundra license

**Files:** none (research only — feeds Task 2.2 decision)

- [ ] **Step 1: Open the Tundra scan page in Claude in Chrome**

Use `mcp__Claude_in_Chrome__navigate` to: `https://sketchfab.com/3d-models/toyota-tundra-2022-3d-scan-data-1-of-2-9f125f910f2e4ee390323232aa8fbd04`

- [ ] **Step 2: Read the page for the license badge**

Use `mcp__Claude_in_Chrome__get_page_text` and search for "License" and "CC".
Expected output: one of {`CC BY 4.0`, `CC BY-NC`, `CC BY-NC-SA`, `CC0`, `Editorial Use Only`, `Standard`}.

- [ ] **Step 3: Record the result**

Create `public/models/lc300-ready/ASSETS.md` with the verification result:
```markdown
# LC300 Explorer — Asset Verification Log

## Tundra 2022 (CAD-LAB) — primary donor candidate
- URL: https://sketchfab.com/3d-models/toyota-tundra-2022-3d-scan-data-1-of-2-9f125f910f2e4ee390323232aa8fbd04
- Verified license: <PASTE EXACT BADGE TEXT HERE>
- Verification date: 2026-05-26
- Decision: USE / SKIP
```

- [ ] **Step 4: Commit**

```
git add public/models/lc300-ready/ASSETS.md
git commit -m "chore(explorer): verify and log Tundra donor license"
```

---

### Task 2.2: Download exterior donor

**Files:**
- Create: `public/models/lc300-raw/exterior-donor.glb` (gitignored)
- Modify: `public/models/lc300-ready/ASSETS.md`

- [ ] **Step 1: Download the chosen donor**

If Tundra is CC-BY (from Task 2.1): use Sketchfab CLI or Claude in Chrome to download from the Tundra page. Save to `public/models/lc300-raw/exterior-donor.glb`.

If Tundra is NOT CC-BY: download Lexus LX600 (KINGSLEY_king) from `https://sketchfab.com/3d-models/lexus-lx-600-3780684a306b4549af6a258036d7ab27`. Save to `public/models/lc300-raw/exterior-donor.glb`.

- [ ] **Step 2: Verify file exists and report size**

Use Glob for `public/models/lc300-raw/exterior-donor.glb`. Note size in bytes.

- [ ] **Step 3: Update ASSETS.md**

Append to `public/models/lc300-ready/ASSETS.md`:
```markdown

## Exterior donor — DOWNLOADED
- Selected: <Tundra OR LX600>
- File: public/models/lc300-raw/exterior-donor.glb
- Size: <BYTES>
- License: CC-BY 4.0
- Attribution: <CREATOR NAME>
```

- [ ] **Step 4: Commit (ASSETS.md only — raw GLB is gitignored)**

```
git add public/models/lc300-ready/ASSETS.md
git commit -m "docs(explorer): record exterior donor selection and download"
```

---

### Task 2.3: Download engine bay + V6 assets

**Files:**
- Create: `public/models/lc300-raw/engine-bay-donor.glb`
- Create: `public/models/lc300-raw/v6-engine.glb`
- Modify: `public/models/lc300-ready/ASSETS.md`

- [ ] **Step 1: Download Lexus IS250 under-the-hood scan**

From `https://sketchfab.com/3d-models/lexus-is250-under-the-hood-5e6553cd60c64358b31d7f7a1ff70807`.
Save to: `public/models/lc300-raw/engine-bay-donor.glb`

- [ ] **Step 2: Download fasteng V6 engine**

From `https://sketchfab.com/3d-models/v6-engine-881cbe41ff1344789e3529943d330cc2`.
Save to: `public/models/lc300-raw/v6-engine.glb`

- [ ] **Step 3: Update ASSETS.md**

Append:
```markdown

## Engine bay donor — DOWNLOADED
- File: public/models/lc300-raw/engine-bay-donor.glb
- License: CC-BY 4.0 (NoAI)
- Attribution: TheFailedArchitect

## V6 engine — DOWNLOADED
- File: public/models/lc300-raw/v6-engine.glb
- License: CC-BY 4.0
- Attribution: fasteng
```

- [ ] **Step 4: Commit**

```
git add public/models/lc300-ready/ASSETS.md
git commit -m "docs(explorer): record engine bay + v6 donor downloads"
```

---

### Task 2.4: Download undercarriage + suspension assets

**Files:**
- Create: `public/models/lc300-raw/undercarriage-base.glb`
- Create: `public/models/lc300-raw/suspension-front.glb`
- Create: `public/models/lc300-raw/suspension-rear.glb`
- Modify: `public/models/lc300-ready/ASSETS.md`

- [ ] **Step 1: Download Chevy Impala undercarriage**

From `https://sketchfab.com/3d-models/chevy-impala-undercarriage-9052ee152fc24d24a686ba3816ac0607`.
Save to: `public/models/lc300-raw/undercarriage-base.glb`

- [ ] **Step 2: Download Double Wishbone + Live Axle suspension**

From `https://sketchfab.com/3d-models/double-wishbone-and-live-axle-suspension-5cf0120b9bca4fd6a20c9357f7e5efaf`.
Save to: `public/models/lc300-raw/suspension-front.glb`

- [ ] **Step 3: Download 4-Link suspension**

From `https://sketchfab.com/3d-models/4-link-suspension-944ae9888c8e4ca89bc7692162acace2`.
Save to: `public/models/lc300-raw/suspension-rear.glb`

- [ ] **Step 4: Update ASSETS.md**

Append:
```markdown

## Undercarriage base — DOWNLOADED
- File: public/models/lc300-raw/undercarriage-base.glb
- License: CC-BY 4.0
- Attribution: omegadarling

## Suspension front — DOWNLOADED
- File: public/models/lc300-raw/suspension-front.glb
- License: CC-BY 4.0
- Attribution: BlackWΛVΞ

## Suspension rear — DOWNLOADED
- File: public/models/lc300-raw/suspension-rear.glb
- License: CC-BY 4.0 (NoAI)
- Attribution: Jorma Rysky
```

- [ ] **Step 5: Commit**

```
git add public/models/lc300-ready/ASSETS.md
git commit -m "docs(explorer): record undercarriage + suspension donor downloads"
```

---

### Task 2.5: Download HDRIs from Polyhaven

**Files:**
- Create: `public/hdr/studio_small_09_1k.hdr` (gitignored)
- Create: `public/hdr/autoshop_01_1k.hdr` (gitignored)
- Create: `public/hdr/garage_1k.hdr` (gitignored)
- Modify: `public/models/lc300-ready/ASSETS.md`

- [ ] **Step 1: Download studio_small_09 1K HDR**

Use WebFetch on `https://polyhaven.com/a/studio_small_09` to locate the HDR download URL, then download.
Save to: `public/hdr/studio_small_09_1k.hdr`

- [ ] **Step 2: Download autoshop_01 1K HDR**

Save to: `public/hdr/autoshop_01_1k.hdr`

- [ ] **Step 3: Download garage 1K HDR**

Save to: `public/hdr/garage_1k.hdr`

- [ ] **Step 4: Update ASSETS.md**

Append:
```markdown

## HDRIs — DOWNLOADED (CC0)
- public/hdr/studio_small_09_1k.hdr — exterior stage
- public/hdr/autoshop_01_1k.hdr — engine bay stage
- public/hdr/garage_1k.hdr — undercarriage stage
- Attribution: Poly Haven (CC0, public domain)
```

- [ ] **Step 5: Commit**

```
git add public/models/lc300-ready/ASSETS.md
git commit -m "docs(explorer): record polyhaven HDRI downloads"
```

---

## Phase 3: Blender Prep

### Task 3.1: Build the skeleton silhouette GLB

**Files:**
- Create: `scripts/blender/build_skeleton.py`
- Create: `public/models/lc300-ready/skeleton.glb`

- [ ] **Step 1: Write the skeleton-build Blender script**

Create `scripts/blender/build_skeleton.py`:
```python
"""Build a 200KB low-poly LC300 silhouette as load-time placeholder."""
import bpy
import bmesh
from mathutils import Vector

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Body: stretched cube with subdivisions, then bevel
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0.9))
body = bpy.context.active_object
body.name = 'SkeletonBody'
body.scale = (1.0, 2.45, 0.55)  # LC300 proportions roughly 4.9m × 2.0m × 1.9m

bpy.context.view_layer.objects.active = body
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Subdivide for the bevel
me = body.data
bm = bmesh.new()
bm.from_mesh(me)
bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=1, use_grid_fill=True)
bm.to_mesh(me)
bm.free()

bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.bevel(offset=0.12, segments=2)
bpy.ops.object.mode_set(mode='OBJECT')

# Greenhouse (the cabin glass area, smaller cube on top)
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, -0.1, 1.65))
gh = bpy.context.active_object
gh.name = 'SkeletonGreenhouse'
gh.scale = (0.92, 1.6, 0.35)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.bevel(offset=0.08, segments=2)
bpy.ops.object.mode_set(mode='OBJECT')

# Four wheels (low-poly cylinders)
for i, (x, y) in enumerate([(1.0, 1.6), (-1.0, 1.6), (1.0, -1.6), (-1.0, -1.6)]):
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.42, depth=0.3,
                                         location=(x, y, 0.42), rotation=(0, 1.5708, 0))
    w = bpy.context.active_object
    w.name = f'SkeletonWheel_{i}'

# Single neutral material
mat = bpy.data.materials.new('SkeletonMat')
mat.use_nodes = True
bsdf = mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (0.35, 0.35, 0.36, 1.0)
bsdf.inputs['Roughness'].default_value = 0.7
bsdf.inputs['Metallic'].default_value = 0.0

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)

# Triangle count check
total = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print(f'[skeleton] total polys: {total}')
assert total < 5000, f'skeleton over budget: {total}'

# Export GLB
bpy.ops.export_scene.gltf(
    filepath='public/models/lc300-ready/skeleton.glb',
    export_format='GLB',
    export_apply=True,
    export_draco_mesh_compression_enable=False,
    use_selection=False,
)
print('[skeleton] exported to public/models/lc300-ready/skeleton.glb')
```

- [ ] **Step 2: Execute via Blender MCP**

Run the script via `mcp__blender__execute_blender_code` with the script contents above.
Expected output: `[skeleton] total polys: <under 5000>` and `[skeleton] exported`.

- [ ] **Step 3: Verify the output file**

Use Glob for `public/models/lc300-ready/skeleton.glb`. Expected size: under 300 KB.

- [ ] **Step 4: Commit**

```
git add scripts/blender/build_skeleton.py public/models/lc300-ready/skeleton.glb
git commit -m "feat(explorer): add low-poly LC300 skeleton silhouette placeholder"
```

---

### Task 3.2: Model the LC300 grille and badges in Blender

**Files:**
- Create: `scripts/blender/build_lc300_features.py`
- Create: `public/models/lc300-ready/lc300-features.glb`

- [ ] **Step 1: Write the LC300 features script**

Create `scripts/blender/build_lc300_features.py`:
```python
"""Model LC300-specific grille, headlight inserts, badge.

These are overlaid on the exterior donor body in Blender during the body prep.
The grille is the LC300 signature: 6 horizontal chrome slats, full-width.
"""
import bpy
import bmesh
from mathutils import Vector

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# === GRILLE (LC300 horizontal-slat) ===
# Anchor: front of car at y=+2.45, z roughly 0.95, width ±0.95
GRILLE_SLAT_COUNT = 6
GRILLE_WIDTH = 1.6
GRILLE_HEIGHT = 0.42
GRILLE_Y = 2.46
GRILLE_Z_CENTER = 0.95
slat_h = (GRILLE_HEIGHT / GRILLE_SLAT_COUNT) * 0.55  # gaps between slats
slat_spacing = GRILLE_HEIGHT / GRILLE_SLAT_COUNT

# Empty parent for the grille group
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, GRILLE_Y, GRILLE_Z_CENTER))
grille_parent = bpy.context.active_object
grille_parent.name = 'LC300_Grille'

for i in range(GRILLE_SLAT_COUNT):
    z = GRILLE_Z_CENTER - GRILLE_HEIGHT/2 + slat_spacing * (i + 0.5)
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, GRILLE_Y, z))
    slat = bpy.context.active_object
    slat.scale = (GRILLE_WIDTH/2, 0.03, slat_h/2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.bevel(offset=0.008, segments=2)
    bpy.ops.object.mode_set(mode='OBJECT')
    slat.name = f'GrilleSlat_{i}'
    slat.parent = grille_parent

# Chrome material for slats
chrome_mat = bpy.data.materials.new('LC300_Chrome')
chrome_mat.use_nodes = True
bsdf = chrome_mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (0.95, 0.95, 0.95, 1.0)
bsdf.inputs['Metallic'].default_value = 1.0
bsdf.inputs['Roughness'].default_value = 0.06
for o in bpy.data.objects:
    if o.name.startswith('GrilleSlat_'):
        o.data.materials.append(chrome_mat)

# === HEADLIGHT INSERTS (LC300 signature L-shape) ===
# Two cubes per side, low-poly silhouette
for side, x in (('L', -0.78), ('R', 0.78)):
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(x, GRILLE_Y, 1.05))
    hl_parent = bpy.context.active_object
    hl_parent.name = f'Headlight_{side}'

    # Main lens block (horizontal)
    bpy.ops.mesh.primitive_cube_add(size=2, location=(x, GRILLE_Y, 1.05))
    main = bpy.context.active_object
    main.scale = (0.18, 0.04, 0.08)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.bevel(offset=0.01, segments=2)
    bpy.ops.object.mode_set(mode='OBJECT')
    main.name = f'HeadlightMain_{side}'
    main.parent = hl_parent

    # DRL strip (vertical accent)
    x_off = -0.16 if side == 'L' else 0.16
    bpy.ops.mesh.primitive_cube_add(size=2, location=(x + x_off, GRILLE_Y, 0.94))
    drl = bpy.context.active_object
    drl.scale = (0.015, 0.04, 0.05)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    drl.name = f'HeadlightDRL_{side}'
    drl.parent = hl_parent

# Emissive material for DRLs (so they bloom)
drl_mat = bpy.data.materials.new('LC300_DRL')
drl_mat.use_nodes = True
bsdf = drl_mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (1.0, 0.98, 0.92, 1.0)
bsdf.inputs['Emission Color'].default_value = (1.0, 0.98, 0.92, 1.0)
bsdf.inputs['Emission Strength'].default_value = 4.0
for o in bpy.data.objects:
    if o.name.startswith('HeadlightDRL_'):
        o.data.materials.append(drl_mat)

# Lens material (clearcoat glass)
lens_mat = bpy.data.materials.new('LC300_HeadlightLens')
lens_mat.use_nodes = True
bsdf = lens_mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)
bsdf.inputs['Transmission Weight'].default_value = 0.9
bsdf.inputs['Roughness'].default_value = 0.0
bsdf.inputs['Coat Weight'].default_value = 1.0
for o in bpy.data.objects:
    if o.name.startswith('HeadlightMain_'):
        o.data.materials.append(lens_mat)

# === BADGE (TOYOTA logo placeholder — solid chrome oval) ===
bpy.ops.mesh.primitive_torus_add(major_radius=0.06, minor_radius=0.012,
                                  location=(0, GRILLE_Y + 0.005, 1.08))
badge_outer = bpy.context.active_object
badge_outer.name = 'BadgeOuter'
badge_outer.rotation_euler = (1.5708, 0, 0)
bpy.ops.object.transform_apply(rotation=True)
badge_outer.data.materials.append(chrome_mat)

bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.05, depth=0.005,
                                     location=(0, GRILLE_Y + 0.008, 1.08),
                                     rotation=(1.5708, 0, 0))
badge_inner = bpy.context.active_object
badge_inner.name = 'BadgeInner'
badge_inner.data.materials.append(chrome_mat)

# Triangle count
total = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print(f'[lc300-features] total polys: {total}')

# Export
bpy.ops.export_scene.gltf(
    filepath='public/models/lc300-ready/lc300-features.glb',
    export_format='GLB',
    export_apply=True,
    export_draco_mesh_compression_enable=False,
    use_selection=False,
)
print('[lc300-features] exported')
```

- [ ] **Step 2: Execute via Blender MCP**

Run via `mcp__blender__execute_blender_code`. Expected: triangle count under 8000 and successful export.

- [ ] **Step 3: Visually verify in Blender viewport**

Use `mcp__blender__get_viewport_screenshot` to capture the result. Confirm the grille has 6 horizontal slats, two headlight clusters with L-shaped DRLs, and a center badge.

- [ ] **Step 4: Commit**

```
git add scripts/blender/build_lc300_features.py public/models/lc300-ready/lc300-features.glb
git commit -m "feat(explorer): model LC300 grille + headlights + badge in Blender"
```

---

### Task 3.3: Process exterior donor body

**Files:**
- Create: `scripts/blender/prep_exterior.py`
- Create: `public/models/lc300-ready/body-stage1.glb`

- [ ] **Step 1: Write the exterior prep script**

Create `scripts/blender/prep_exterior.py`:
```python
"""Process the exterior donor (Tundra or LX600) for the LC300 explorer.

Tasks:
  1. Import donor GLB
  2. Print full mesh inventory
  3. Rename meshes to canonical names (Body, Hood, Door_FL/FR/RL/RR, Wheel_FL/FR/RL/RR, Glass)
  4. Decimate per-part to fit triangle budget
  5. Verify Principled BSDF materials with correct color spaces
  6. Append the LC300 features (grille, headlights, badge) loaded from features GLB
  7. Bake AO into a second UV channel for body panels
  8. Export to body-stage1.glb (gltf-transform will further compress later)
"""
import bpy
import os

DONOR = 'public/models/lc300-raw/exterior-donor.glb'
FEATURES = 'public/models/lc300-ready/lc300-features.glb'
OUT = 'public/models/lc300-ready/body-stage1.glb'

# Per-part triangle budgets (input to Decimate)
TRI_BUDGET = {
    'Body': 180_000,
    'Hood': 20_000,
    'Door_FL': 12_000,
    'Door_FR': 12_000,
    'Door_RL': 12_000,
    'Door_RR': 12_000,
    'Wheel_FL': 20_000,
    'Wheel_FR': 20_000,
    'Wheel_RL': 20_000,
    'Wheel_RR': 20_000,
    'Glass': 8_000,
    'Interior': 40_000,
    'Mirror_L': 4_000,
    'Mirror_R': 4_000,
}

# Heuristic name → canonical mapping (substring match, case-insensitive)
NAME_HINTS = {
    'Hood':       ['hood', 'bonnet', 'capot'],
    'Door_FL':    ['door_fl', 'door_l', 'doorl_f', 'frontleftdoor', 'door.l.f'],
    'Door_FR':    ['door_fr', 'door_r', 'doorr_f', 'frontrightdoor', 'door.r.f'],
    'Door_RL':    ['door_rl', 'door_bl', 'rearleftdoor', 'door.l.r'],
    'Door_RR':    ['door_rr', 'door_br', 'rearrightdoor', 'door.r.r'],
    'Wheel_FL':   ['wheel_fl', 'wheelfl', 'tire_fl', 'frontleftwheel'],
    'Wheel_FR':   ['wheel_fr', 'wheelfr', 'tire_fr', 'frontrightwheel'],
    'Wheel_RL':   ['wheel_rl', 'wheelrl', 'tire_rl', 'rearleftwheel'],
    'Wheel_RR':   ['wheel_rr', 'wheelrr', 'tire_rr', 'rearrightwheel'],
    'Glass':      ['glass', 'window', 'windscreen'],
    'Interior':   ['interior', 'dashboard', 'seat'],
    'Mirror_L':   ['mirror_l', 'mirrorl', 'leftmirror'],
    'Mirror_R':   ['mirror_r', 'mirrorr', 'rightmirror'],
}

def canonical_name(orig: str) -> str | None:
    n = orig.lower()
    for canon, hints in NAME_HINTS.items():
        if any(h in n for h in hints):
            return canon
    return None

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import donor
bpy.ops.import_scene.gltf(filepath=DONOR)
print(f'[exterior] imported {DONOR}')

# Inventory
print('[exterior] === inventory ===')
all_meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in all_meshes:
    tris = len(o.data.polygons)
    pos = o.location
    dim = o.dimensions
    print(f'  {o.name:40s}  tris={tris:7d}  pos=({pos.x:+.2f},{pos.y:+.2f},{pos.z:+.2f})  size=({dim.x:.2f},{dim.y:.2f},{dim.z:.2f})')

# Rename pass — canonical where matched, else preserved
renamed = {}
for o in all_meshes:
    canon = canonical_name(o.name)
    if canon and canon not in renamed.values():
        old = o.name
        o.name = canon
        renamed[old] = canon
        print(f'[rename] {old} -> {canon}')

# Anything not renamed and not a canonical name → merge into 'Body'
body_meshes = [o for o in all_meshes if o.name not in TRI_BUDGET]
if body_meshes:
    bpy.ops.object.select_all(action='DESELECT')
    for o in body_meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = body_meshes[0]
    bpy.ops.object.join()
    bpy.context.view_layer.objects.active.name = 'Body'
    print(f'[merge] joined {len(body_meshes)} loose meshes into Body')

# Decimate per part to budget
for o in [m for m in bpy.data.objects if m.type == 'MESH' and m.name in TRI_BUDGET]:
    current = len(o.data.polygons)
    target = TRI_BUDGET[o.name]
    if current > target:
        ratio = target / current
        mod = o.modifiers.new('Decimate', 'DECIMATE')
        mod.ratio = ratio
        mod.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='Decimate')
        print(f'[decimate] {o.name}: {current} -> {len(o.data.polygons)} (ratio {ratio:.3f})')

# Import LC300 features and parent to Body
bpy.ops.import_scene.gltf(filepath=FEATURES)
print('[exterior] imported LC300 features overlay')

# Verify Principled BSDF on every material
fixed_mats = 0
for mat in bpy.data.materials:
    if not mat.use_nodes:
        mat.use_nodes = True
    if 'Principled BSDF' not in [n.name for n in mat.node_tree.nodes]:
        # Replace whatever it is with Principled BSDF
        nt = mat.node_tree
        out = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None)
        if out:
            for n in list(nt.nodes):
                if n is not out:
                    nt.nodes.remove(n)
            bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
            nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
            fixed_mats += 1
print(f'[materials] fixed {fixed_mats} non-Principled materials')

# Export stage 1 (AO baking and KTX2 happen later)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    export_apply=True,
    export_materials='EXPORT',
    export_draco_mesh_compression_enable=False,
    use_selection=False,
)

# Final triangle count
total = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print(f'[exterior] FINAL total polys: {total}')
print(f'[exterior] exported to {OUT}')
```

- [ ] **Step 2: Execute via Blender MCP**

Run via `mcp__blender__execute_blender_code`. Capture the full stdout — the rename log and decimate log are the audit trail.

- [ ] **Step 3: Verify output and triangle count**

Confirm `public/models/lc300-ready/body-stage1.glb` exists. Total polys should be ≤ 350k.

- [ ] **Step 4: Commit**

```
git add scripts/blender/prep_exterior.py public/models/lc300-ready/body-stage1.glb
git commit -m "feat(explorer): prep exterior donor with canonical names + decimation"
```

---

### Task 3.4: Bake AO into the body

**Files:**
- Create: `scripts/blender/bake_ao_body.py`
- Create: `public/models/lc300-ready/body-stage2.glb`

- [ ] **Step 1: Write the AO bake script**

Create `scripts/blender/bake_ao_body.py`:
```python
"""Bake AO into UV2 channel of body panels. Free per-frame at runtime."""
import bpy
import os

IN = 'public/models/lc300-ready/body-stage1.glb'
OUT = 'public/models/lc300-ready/body-stage2.glb'
BAKE_DIR = 'public/models/lc300-ready/baked-ao'
os.makedirs(BAKE_DIR, exist_ok=True)

PANELS = ['Body', 'Hood', 'Door_FL', 'Door_FR', 'Door_RL', 'Door_RR']

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=IN)

# Configure cycles for baking
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 64
bpy.context.scene.cycles.bake_type = 'AO'
bpy.context.scene.world.cycles.sample_as_light = True

for name in PANELS:
    obj = bpy.data.objects.get(name)
    if not obj:
        print(f'[bake] skip {name} (not found)')
        continue
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)

    # Add UV2 channel if missing
    if len(obj.data.uv_layers) < 2:
        obj.data.uv_layers.new(name='UV2')
    obj.data.uv_layers.active = obj.data.uv_layers['UV2']
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=66.0)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Create bake image
    img_name = f'{name}_AO'
    img = bpy.data.images.new(img_name, width=1024, height=1024, alpha=False)
    img.colorspace_settings.name = 'Non-Color'

    # Attach to material as bake target
    mat = obj.data.materials[0]
    nt = mat.node_tree
    tex_node = nt.nodes.new('ShaderNodeTexImage')
    tex_node.image = img
    tex_node.select = True
    nt.nodes.active = tex_node

    bpy.ops.object.bake(type='AO', save_mode='EXTERNAL',
                        filepath=os.path.join(BAKE_DIR, f'{name}_AO.png'))
    img.save_render(filepath=os.path.join(BAKE_DIR, f'{name}_AO.png'))
    print(f'[bake] {name} AO -> {name}_AO.png')

    # Wire AO map into baseColor via MixRGB multiply
    bsdf = nt.nodes['Principled BSDF']
    base_input = bsdf.inputs['Base Color']
    existing = base_input.links[0].from_node if base_input.links else None

    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 0.8
    if existing:
        nt.links.new(existing.outputs[0], mix.inputs[6])
    else:
        mix.inputs[6].default_value = (1.0, 1.0, 1.0, 1.0)
    nt.links.new(tex_node.outputs['Color'], mix.inputs[7])
    nt.links.new(mix.outputs[2], base_input)

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    export_apply=True,
    export_materials='EXPORT',
    export_draco_mesh_compression_enable=False,
)
print(f'[bake] exported {OUT}')
```

- [ ] **Step 2: Execute via Blender MCP**

Run via `mcp__blender__execute_blender_code`. Baking 6 panels at 1024² with 64 samples takes 2–5 minutes.

- [ ] **Step 3: Verify AO bake outputs**

Use Glob for `public/models/lc300-ready/baked-ao/*.png`. Expect 6 PNG files.

- [ ] **Step 4: Commit**

```
git add scripts/blender/bake_ao_body.py public/models/lc300-ready/body-stage2.glb public/models/lc300-ready/baked-ao/
git commit -m "feat(explorer): bake AO into UV2 for body panels"
```

---

### Task 3.5: Prep engine bay assembly

**Files:**
- Create: `scripts/blender/prep_engine_bay.py`
- Create: `public/models/lc300-ready/bay-stage1.glb`

- [ ] **Step 1: Write the engine bay prep script**

Create `scripts/blender/prep_engine_bay.py`:
```python
"""Compose engine bay: IS250 under-the-hood scan + V6 engine.

Canonical objects produced:
  EngineBay (shell, firewall, walls)
  Engine_Block (the V6)
  Battery, Air_Filter, Radiator, Intake (sub-meshes split from IS250 scan if findable;
    otherwise we create placeholder hotspot anchors as empties)
"""
import bpy

DONOR = 'public/models/lc300-raw/engine-bay-donor.glb'
V6 = 'public/models/lc300-raw/v6-engine.glb'
OUT = 'public/models/lc300-ready/bay-stage1.glb'

TRI_BUDGET = {
    'EngineBay': 80_000,
    'Engine_Block': 60_000,
}

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import IS250 bay
bpy.ops.import_scene.gltf(filepath=DONOR)
bay_meshes = [o for o in bpy.context.selected_objects if o.type == 'MESH']
print(f'[bay] imported IS250 scan: {len(bay_meshes)} meshes')

# Join all IS250 meshes into a single 'EngineBay' object
if bay_meshes:
    bpy.ops.object.select_all(action='DESELECT')
    for o in bay_meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = bay_meshes[0]
    bpy.ops.object.join()
    active = bpy.context.view_layer.objects.active
    active.name = 'EngineBay'
    print(f'[bay] joined into EngineBay: {len(active.data.polygons)} tris')

# Decimate EngineBay
bay = bpy.data.objects['EngineBay']
if len(bay.data.polygons) > TRI_BUDGET['EngineBay']:
    ratio = TRI_BUDGET['EngineBay'] / len(bay.data.polygons)
    mod = bay.modifiers.new('Decimate', 'DECIMATE')
    mod.ratio = ratio
    bpy.context.view_layer.objects.active = bay
    bpy.ops.object.modifier_apply(modifier='Decimate')
    print(f'[decimate] EngineBay -> {len(bay.data.polygons)}')

# Import V6 engine
bpy.ops.import_scene.gltf(filepath=V6)
v6_meshes = [o for o in bpy.context.selected_objects if o.type == 'MESH']

# Join V6 into single object
if v6_meshes:
    bpy.ops.object.select_all(action='DESELECT')
    for o in v6_meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = v6_meshes[0]
    bpy.ops.object.join()
    engine = bpy.context.view_layer.objects.active
    engine.name = 'Engine_Block'

    # Position into bay
    engine.location = (0, 0.4, 0.3)
    engine.scale = (1.0, 1.0, 1.0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Decimate
    if len(engine.data.polygons) > TRI_BUDGET['Engine_Block']:
        ratio = TRI_BUDGET['Engine_Block'] / len(engine.data.polygons)
        mod = engine.modifiers.new('Decimate', 'DECIMATE')
        mod.ratio = ratio
        bpy.context.view_layer.objects.active = engine
        bpy.ops.object.modifier_apply(modifier='Decimate')
        print(f'[decimate] Engine_Block -> {len(engine.data.polygons)}')

# Add empty anchors for hotspots that aren't real meshes
for name, pos in [('Battery_Anchor', (-0.5, -0.2, 0.45)),
                  ('Air_Filter_Anchor', (0.55, -0.1, 0.5)),
                  ('Radiator_Anchor', (0, 0.9, 0.3)),
                  ('Intake_Anchor', (0, 0.4, 0.55)),
                  ('Fuse_Box_Anchor', (-0.6, 0.5, 0.45))]:
    bpy.ops.object.empty_add(type='SPHERE', radius=0.04, location=pos)
    bpy.context.active_object.name = name

# Ensure Principled BSDF
for mat in bpy.data.materials:
    if not mat.use_nodes:
        mat.use_nodes = True

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    export_apply=True,
    export_materials='EXPORT',
    export_extras=True,  # include empties
    export_draco_mesh_compression_enable=False,
)
total = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print(f'[bay] FINAL total polys: {total}')
print(f'[bay] exported {OUT}')
```

- [ ] **Step 2: Execute via Blender MCP**

Run. Expected: < 140k tris total, GLB exported.

- [ ] **Step 3: Commit**

```
git add scripts/blender/prep_engine_bay.py public/models/lc300-ready/bay-stage1.glb
git commit -m "feat(explorer): compose engine bay from IS250 scan + V6 engine"
```

---

### Task 3.6: Prep undercarriage cutaway

**Files:**
- Create: `scripts/blender/prep_underbody.py`
- Create: `public/models/lc300-ready/underbody-stage1.glb`

- [ ] **Step 1: Write the underbody prep script**

Create `scripts/blender/prep_underbody.py`:
```python
"""Compose stylized underbody cutaway.

Layers:
  ChassisBase   — Chevy Impala undercarriage (ghosted, semi-transparent)
  Suspension_FL/FR — Double Wishbone (mirrored)
  Suspension_RA    — 4-Link rear assembly
  Exhaust_Anchor, Fuel_Tank_Anchor, Transfer_Case_Anchor, Diff_F_Anchor, Diff_R_Anchor
"""
import bpy
import math

CHASSIS = 'public/models/lc300-raw/undercarriage-base.glb'
SUSP_F = 'public/models/lc300-raw/suspension-front.glb'
SUSP_R = 'public/models/lc300-raw/suspension-rear.glb'
OUT = 'public/models/lc300-ready/underbody-stage1.glb'

TRI_BUDGET = {
    'ChassisBase': 60_000,
    'Suspension_FL': 40_000,
    'Suspension_FR': 40_000,
    'Suspension_RA': 60_000,
}

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# === Chassis base ===
bpy.ops.import_scene.gltf(filepath=CHASSIS)
loose = [o for o in bpy.context.selected_objects if o.type == 'MESH']
if loose:
    bpy.ops.object.select_all(action='DESELECT')
    for o in loose: o.select_set(True)
    bpy.context.view_layer.objects.active = loose[0]
    bpy.ops.object.join()
    chassis = bpy.context.view_layer.objects.active
    chassis.name = 'ChassisBase'
    # Scale to LC300 proportions
    chassis.scale = (1.05, 1.15, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    # Decimate
    if len(chassis.data.polygons) > TRI_BUDGET['ChassisBase']:
        ratio = TRI_BUDGET['ChassisBase'] / len(chassis.data.polygons)
        mod = chassis.modifiers.new('D', 'DECIMATE'); mod.ratio = ratio
        bpy.context.view_layer.objects.active = chassis
        bpy.ops.object.modifier_apply(modifier='D')

    # Ghosted material — translucent blueprint blue
    ghost = bpy.data.materials.new('Chassis_Ghost')
    ghost.use_nodes = True
    bsdf = ghost.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (0.2, 0.35, 0.55, 1.0)
    bsdf.inputs['Alpha'].default_value = 0.55
    bsdf.inputs['Roughness'].default_value = 0.6
    bsdf.inputs['Metallic'].default_value = 0.2
    ghost.blend_method = 'BLEND'
    chassis.data.materials.clear()
    chassis.data.materials.append(ghost)

# === Front suspension (mirrored L/R) ===
bpy.ops.import_scene.gltf(filepath=SUSP_F)
loose = [o for o in bpy.context.selected_objects if o.type == 'MESH']
if loose:
    bpy.ops.object.select_all(action='DESELECT')
    for o in loose: o.select_set(True)
    bpy.context.view_layer.objects.active = loose[0]
    bpy.ops.object.join()
    susp = bpy.context.view_layer.objects.active
    susp.name = 'Suspension_FL'
    susp.location = (-0.85, 1.6, -0.1)
    susp.scale = (0.9, 0.9, 0.9)
    bpy.ops.object.transform_apply(location=True, scale=True)
    if len(susp.data.polygons) > TRI_BUDGET['Suspension_FL']:
        ratio = TRI_BUDGET['Suspension_FL'] / len(susp.data.polygons)
        mod = susp.modifiers.new('D', 'DECIMATE'); mod.ratio = ratio
        bpy.context.view_layer.objects.active = susp
        bpy.ops.object.modifier_apply(modifier='D')

    # Duplicate + mirror for FR
    bpy.ops.object.select_all(action='DESELECT')
    susp.select_set(True)
    bpy.context.view_layer.objects.active = susp
    bpy.ops.object.duplicate()
    susp_r = bpy.context.active_object
    susp_r.name = 'Suspension_FR'
    susp_r.location.x = 0.85
    susp_r.scale.x = -0.9  # mirror via negative scale
    bpy.ops.object.transform_apply(scale=True)

# === Rear suspension ===
bpy.ops.import_scene.gltf(filepath=SUSP_R)
loose = [o for o in bpy.context.selected_objects if o.type == 'MESH']
if loose:
    bpy.ops.object.select_all(action='DESELECT')
    for o in loose: o.select_set(True)
    bpy.context.view_layer.objects.active = loose[0]
    bpy.ops.object.join()
    rear = bpy.context.view_layer.objects.active
    rear.name = 'Suspension_RA'
    rear.location = (0, -1.6, -0.05)
    rear.scale = (0.95, 0.95, 0.95)
    bpy.ops.object.transform_apply(location=True, scale=True)
    if len(rear.data.polygons) > TRI_BUDGET['Suspension_RA']:
        ratio = TRI_BUDGET['Suspension_RA'] / len(rear.data.polygons)
        mod = rear.modifiers.new('D', 'DECIMATE'); mod.ratio = ratio
        bpy.context.view_layer.objects.active = rear
        bpy.ops.object.modifier_apply(modifier='D')

# === Hotspot anchors ===
for name, pos in [('Exhaust_Anchor', (0.3, 0, -0.15)),
                  ('FuelTank_Anchor', (0, -0.8, 0)),
                  ('TransferCase_Anchor', (0, 0.4, -0.05)),
                  ('Diff_F_Anchor', (0, 1.6, -0.18)),
                  ('Diff_R_Anchor', (0, -1.6, -0.18))]:
    bpy.ops.object.empty_add(type='SPHERE', radius=0.04, location=pos)
    bpy.context.active_object.name = name

# === Steel material for suspension parts ===
steel = bpy.data.materials.new('Susp_Steel')
steel.use_nodes = True
bsdf = steel.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (0.45, 0.45, 0.48, 1.0)
bsdf.inputs['Metallic'].default_value = 0.9
bsdf.inputs['Roughness'].default_value = 0.35

for name in ['Suspension_FL', 'Suspension_FR', 'Suspension_RA']:
    o = bpy.data.objects.get(name)
    if o:
        o.data.materials.clear()
        o.data.materials.append(steel)

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    export_apply=True,
    export_materials='EXPORT',
    export_extras=True,
    export_draco_mesh_compression_enable=False,
)
total = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print(f'[underbody] FINAL total polys: {total}')
print(f'[underbody] exported {OUT}')
```

- [ ] **Step 2: Execute via Blender MCP**

Run. Expected: under 200k tris total.

- [ ] **Step 3: Commit**

```
git add scripts/blender/prep_underbody.py public/models/lc300-ready/underbody-stage1.glb
git commit -m "feat(explorer): compose stylized underbody cutaway with ghosted chassis"
```

---

## Phase 4: gltf-transform + KTX2 Pipeline

### Task 4.1: gltf-transform pipeline script

**Files:**
- Create: `scripts/optimize-glb.mjs`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Write the optimization script**

Create `scripts/optimize-glb.mjs`:
```js
#!/usr/bin/env node
// Optimize all stage1/2 GLBs to KTX2 + meshopt final form.

import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';

const ASSETS = [
  { in: 'public/models/lc300-ready/body-stage2.glb',     out: 'public/models/lc300-ready/body.glb',     max: 10 * 1024 * 1024 },
  { in: 'public/models/lc300-ready/bay-stage1.glb',      out: 'public/models/lc300-ready/bay.glb',      max:  5 * 1024 * 1024 },
  { in: 'public/models/lc300-ready/underbody-stage1.glb', out: 'public/models/lc300-ready/underbody.glb', max:  5 * 1024 * 1024 },
];

const NORMAL_SLOTS = 'normalTexture,occlusionTexture,metallicRoughnessTexture,clearcoatNormalTexture';
const COLOR_SLOTS  = 'baseColorTexture,emissiveTexture';

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

for (const a of ASSETS) {
  const tmp1 = a.out.replace(/\.glb$/, '.step1.glb');
  const tmp2 = a.out.replace(/\.glb$/, '.step2.glb');

  // Step 1: meshopt + weld + prune + dedup + instance
  run(`npx gltf-transform optimize ${a.in} ${tmp1} --compress meshopt --simplify false --instance true --texture-size 2048`);

  // Step 2: UASTC on normal/ORM slots
  run(`npx gltf-transform uastc ${tmp1} ${tmp2} --slots ${NORMAL_SLOTS} --level 4 --rdo 0.25 --zstd 22`);

  // Step 3: ETC1S on color slots
  run(`npx gltf-transform etc1s ${tmp2} ${a.out} --slots ${COLOR_SLOTS} --quality 255 --zstd 22`);

  // Verify size
  const size = statSync(a.out).size;
  const ok = size <= a.max;
  console.log(`${a.out}: ${(size/1024/1024).toFixed(2)} MB (limit ${(a.max/1024/1024)} MB) ${ok ? '✓' : '✗ OVER BUDGET'}`);
  if (!ok) process.exit(1);
}

// Inspect each final
for (const a of ASSETS) {
  run(`npx gltf-transform inspect ${a.out}`);
}
```

- [ ] **Step 2: Add npm script**

Edit `package.json`. Add to `scripts`:
```json
"optimize-glb": "node scripts/optimize-glb.mjs",
"build-assets": "node scripts/optimize-glb.mjs && node scripts/optimize-hdr.mjs"
```

- [ ] **Step 3: Run the pipeline**

Run: `npm run optimize-glb`
Expected: three `.glb` outputs under their byte limits. Pipeline exits 0.

- [ ] **Step 4: Verify outputs**

Use Glob for `public/models/lc300-ready/{body,bay,underbody}.glb`. Confirm all three exist and meet size targets.

- [ ] **Step 5: Commit**

```
git add scripts/optimize-glb.mjs package.json public/models/lc300-ready/body.glb public/models/lc300-ready/bay.glb public/models/lc300-ready/underbody.glb
git commit -m "feat(explorer): add gltf-transform pipeline with per-slot KTX2 encoding"
```

---

### Task 4.2: HDRI to KTX2 conversion

**Files:**
- Create: `scripts/optimize-hdr.mjs`
- Create: `public/hdr/studio_small_09_1k.ktx2`
- Create: `public/hdr/autoshop_01_1k.ktx2`
- Create: `public/hdr/garage_1k.ktx2`

- [ ] **Step 1: Write the HDRI conversion script**

Create `scripts/optimize-hdr.mjs`:
```js
#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { statSync, existsSync } from 'node:fs';

const HDRIS = [
  { in: 'public/hdr/studio_small_09_1k.hdr', out: 'public/hdr/studio_small_09_1k.ktx2' },
  { in: 'public/hdr/autoshop_01_1k.hdr',     out: 'public/hdr/autoshop_01_1k.ktx2' },
  { in: 'public/hdr/garage_1k.hdr',          out: 'public/hdr/garage_1k.ktx2' },
];

for (const h of HDRIS) {
  if (!existsSync(h.in)) {
    console.error(`Missing ${h.in}`);
    process.exit(1);
  }
  const cmd = `toktx --t2 --encode uastc --uastc_quality 4 --assign_oetf linear --assign_primaries bt709 --convert_oetf linear --genmipmap ${h.out} ${h.in}`;
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
  const size = statSync(h.out).size;
  console.log(`${h.out}: ${(size/1024).toFixed(0)} KB`);
}
```

- [ ] **Step 2: Run the script**

Run: `node scripts/optimize-hdr.mjs`
Expected: three `.ktx2` files in `public/hdr/`, each 300–500 KB.

- [ ] **Step 3: Commit**

```
git add scripts/optimize-hdr.mjs public/hdr/*.ktx2
git commit -m "feat(explorer): convert polyhaven HDRIs to KTX2 for fast load"
```

---

## Phase 5: R3F Scaffolding

### Task 5.1: Data — hotspot definitions

**Files:**
- Create: `src/components/vehicle-explorer-v2/data/hotspots.ts`
- Create: `src/components/vehicle-explorer-v2/data/types.ts`

- [ ] **Step 1: Write the type definitions**

Create `src/components/vehicle-explorer-v2/data/types.ts`:
```ts
export type Stage = 'exterior' | 'engine' | 'underneath';

export interface Hotspot {
  id: string;
  stage: Stage;
  /** World-space position in scene units (1 unit = 1 meter) */
  position: [number, number, number];
  /** Mongolian Cyrillic title shown in the hotspot label and modal title */
  titleMn: string;
  /** Mongolian Cyrillic description shown in the modal body */
  descriptionMn: string;
  /** Optional Blender object name to highlight on hover; falls back to none */
  targetMesh?: string;
}

export const CTA_PHONE_DISPLAY = '+976 77-200-570';
export const CTA_PHONE_TEL = 'tel:+97677200570';
```

- [ ] **Step 2: Write the hotspot data**

Create `src/components/vehicle-explorer-v2/data/hotspots.ts`:
```ts
import type { Hotspot } from './types';

export const HOTSPOTS: Hotspot[] = [
  // === EXTERIOR STAGE ===
  {
    id: 'ext-hood',
    stage: 'exterior',
    position: [0, 1.15, 1.5],
    titleMn: 'Капот ба хөдөлгүүрийн булан',
    descriptionMn: 'Хөдөлгүүрийн оношилгоо, тосны солилт, цагийн бүс солилт. Капот нээж дотор харна уу.',
    targetMesh: 'Hood',
  },
  {
    id: 'ext-headlight-l',
    stage: 'exterior',
    position: [-0.78, 1.05, 2.46],
    titleMn: 'Гэрэлтүүлэг (зүүн)',
    descriptionMn: 'LED гэрэл, тохиргоо, шилний солилт, бамбай тохируулга.',
    targetMesh: 'Headlight_L',
  },
  {
    id: 'ext-headlight-r',
    stage: 'exterior',
    position: [0.78, 1.05, 2.46],
    titleMn: 'Гэрэлтүүлэг (баруун)',
    descriptionMn: 'LED гэрэл, тохиргоо, шилний солилт, бамбай тохируулга.',
    targetMesh: 'Headlight_R',
  },
  {
    id: 'ext-wheel-fl',
    stage: 'exterior',
    position: [-1.0, 0.42, 1.6],
    titleMn: 'Урд зүүн дугуй',
    descriptionMn: 'JAPAN TOK түдгэлзүүр, балансжуулалт, тэнхлэгийн тохиргоо.',
    targetMesh: 'Wheel_FL',
  },
  {
    id: 'ext-wheel-fr',
    stage: 'exterior',
    position: [1.0, 0.42, 1.6],
    titleMn: 'Урд баруун дугуй',
    descriptionMn: 'JAPAN TOK түдгэлзүүр, балансжуулалт, тэнхлэгийн тохиргоо.',
    targetMesh: 'Wheel_FR',
  },
  {
    id: 'ext-wheel-rl',
    stage: 'exterior',
    position: [-1.0, 0.42, -1.6],
    titleMn: 'Арын зүүн дугуй',
    descriptionMn: 'Дугуй солилт, балансжуулалт, амортизаторын шалгалт.',
    targetMesh: 'Wheel_RL',
  },
  {
    id: 'ext-wheel-rr',
    stage: 'exterior',
    position: [1.0, 0.42, -1.6],
    titleMn: 'Арын баруун дугуй',
    descriptionMn: 'Дугуй солилт, балансжуулалт, амортизаторын шалгалт.',
    targetMesh: 'Wheel_RR',
  },
  {
    id: 'ext-mirror-l',
    stage: 'exterior',
    position: [-1.05, 1.45, 0.7],
    titleMn: 'Хажуугийн толь (зүүн)',
    descriptionMn: 'Цахилгаан тохируулга, толины шилний солилт, халаалтын систем.',
    targetMesh: 'Mirror_L',
  },

  // === ENGINE STAGE ===
  {
    id: 'eng-block',
    stage: 'engine',
    position: [0, 0.4, 0.3],
    titleMn: 'V35A-FTS хөдөлгүүр',
    descriptionMn: '3.5л V6 турбо хөдөлгүүрийн бүрэн оношилгоо, их засвар, цилиндр блокийн засвар.',
    targetMesh: 'Engine_Block',
  },
  {
    id: 'eng-battery',
    stage: 'engine',
    position: [-0.5, -0.2, 0.45],
    titleMn: 'Аккумулятор',
    descriptionMn: 'Батарей солилт, цахилгааны системийн оношилгоо, зэврэлт арилгалт.',
  },
  {
    id: 'eng-air-filter',
    stage: 'engine',
    position: [0.55, -0.1, 0.5],
    titleMn: 'Агаарын шүүлтүүр',
    descriptionMn: 'Шүүлтүүр солилт, агаарын системийн шалгалт, хэрэглэгчийн зөвлөгөө.',
  },
  {
    id: 'eng-radiator',
    stage: 'engine',
    position: [0, 0.9, 0.3],
    titleMn: 'Радиатор',
    descriptionMn: 'Хөргөлтийн шингэн солилт, радиатор засвар, системийн угаалт.',
  },
  {
    id: 'eng-intake',
    stage: 'engine',
    position: [0, 0.4, 0.55],
    titleMn: 'Хөдөлгүүрийн агаар авагч',
    descriptionMn: 'Турбо системийн оношилгоо, агаарын замын шалгалт.',
  },
  {
    id: 'eng-fuse',
    stage: 'engine',
    position: [-0.6, 0.5, 0.45],
    titleMn: 'Гал хамгаалагчийн хайрцаг',
    descriptionMn: 'Цахилгаан схемийн оношилгоо, гал хамгаалагч солилт, релений шалгалт.',
  },

  // === UNDERNEATH STAGE ===
  {
    id: 'und-susp-fl',
    stage: 'underneath',
    position: [-0.85, -0.1, 1.6],
    titleMn: 'Урд түдгэлзүүр (зүүн)',
    descriptionMn: 'Давхар хөшүүргэт түдгэлзүүр, амортизаторын солилт, бөмбөлгөн холбоосын засвар.',
    targetMesh: 'Suspension_FL',
  },
  {
    id: 'und-susp-fr',
    stage: 'underneath',
    position: [0.85, -0.1, 1.6],
    titleMn: 'Урд түдгэлзүүр (баруун)',
    descriptionMn: 'Давхар хөшүүргэт түдгэлзүүр, амортизаторын солилт, бөмбөлгөн холбоосын засвар.',
    targetMesh: 'Suspension_FR',
  },
  {
    id: 'und-susp-rear',
    stage: 'underneath',
    position: [0, -0.05, -1.6],
    titleMn: 'Арын түдгэлзүүр',
    descriptionMn: 'Хатуу тэнхлэгт түдгэлзүүр, 4 цэгийн холбоос, амортизаторын засвар.',
    targetMesh: 'Suspension_RA',
  },
  {
    id: 'und-exhaust',
    stage: 'underneath',
    position: [0.3, -0.15, 0],
    titleMn: 'Яндангийн систем',
    descriptionMn: 'Каталитик хувиргагч, дуу нам, иж бүрэн солилт ба засвар.',
  },
  {
    id: 'und-fuel',
    stage: 'underneath',
    position: [0, 0, -0.8],
    titleMn: 'Шатахууны сав',
    descriptionMn: 'Шатахууны сав цэвэрлэгээ, насос солилт, шугам шалгалт.',
  },
  {
    id: 'und-transfer',
    stage: 'underneath',
    position: [0, -0.05, 0.4],
    titleMn: 'Дамжуулагч хайрцаг',
    descriptionMn: 'Бүх дөрвөн дугуйн хөтлөгчийн систем, тосны солилт, шүдэлзүйн засвар.',
  },
  {
    id: 'und-diff-f',
    stage: 'underneath',
    position: [0, -0.18, 1.6],
    titleMn: 'Урд ялгавартай',
    descriptionMn: 'Урд ялгавартай тосны солилт, шүдлэг хүрд шалгалт.',
  },
  {
    id: 'und-diff-r',
    stage: 'underneath',
    position: [0, -0.18, -1.6],
    titleMn: 'Арын ялгавартай',
    descriptionMn: 'Арын ялгавартай тосны солилт, шүдлэг хүрд шалгалт.',
  },
];

export function hotspotsForStage(stage: 'exterior' | 'engine' | 'underneath') {
  return HOTSPOTS.filter((h) => h.stage === stage);
}
```

- [ ] **Step 3: Commit**

```
git add src/components/vehicle-explorer-v2/data/
git commit -m "feat(explorer): define hotspot data with Mongolian copy for all three stages"
```

---

### Task 5.2: Data — material constants and asset paths

**Files:**
- Create: `src/components/vehicle-explorer-v2/data/materials.ts`
- Create: `src/components/vehicle-explorer-v2/data/paths.ts`

- [ ] **Step 1: Write material recipes module**

Create `src/components/vehicle-explorer-v2/data/materials.ts`:
```ts
import * as THREE from 'three';

export interface PaintRecipe {
  id: string;
  labelMn: string;
  color: string;
  metalness: number;
  roughness: number;
  iridescence: number;
}

export const PAINTS: PaintRecipe[] = [
  { id: 'super-white',   labelMn: 'Цэвэр цагаан',     color: '#f5f5f5', metalness: 0.85, roughness: 0.50, iridescence: 0.25 },
  { id: 'attitude-black', labelMn: 'Хар мика',         color: '#0d0d10', metalness: 0.90, roughness: 0.48, iridescence: 0.30 },
  { id: 'sand-mica',     labelMn: 'Элсэн мика',        color: '#bca27a', metalness: 0.85, roughness: 0.50, iridescence: 0.25 },
  { id: 'dark-blue-mica', labelMn: 'Хар хөх мика',     color: '#1a2a44', metalness: 0.88, roughness: 0.48, iridescence: 0.28 },
  { id: 'silver',        labelMn: 'Мөнгөлөг',          color: '#9ea0a3', metalness: 0.95, roughness: 0.40, iridescence: 0.15 },
  { id: 'red-mica',      labelMn: 'Улаан мика',        color: '#7a1a1a', metalness: 0.88, roughness: 0.48, iridescence: 0.32 },
];

export function paintMaterial(recipe: PaintRecipe): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color: recipe.color,
    metalness: recipe.metalness,
    roughness: recipe.roughness,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    iridescence: recipe.iridescence,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [200, 600],
    envMapIntensity: 1.8,
  });
  return m;
}

export function chromeMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 1.0,
    roughness: 0.02,
    envMapIntensity: 1.8,
  });
}

export function tireMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#0a0a0a',
    metalness: 0.0,
    roughness: 0.85,
    anisotropy: 0.3,
    envMapIntensity: 0.4,
  });
}

export function plasticTrimMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#1a1a1a',
    metalness: 0.0,
    roughness: 0.5,
    clearcoat: 0,
    envMapIntensity: 0.7,
  });
}

export function ledMaterial(color = '#fffaee', intensity = 4.0): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
  });
  m.toneMapped = false;
  return m;
}

export function suspensionSteelMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#5a5a60',
    metalness: 0.9,
    roughness: 0.35,
    envMapIntensity: 0.9,
  });
}

export function chassisGhostMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#345b8c',
    metalness: 0.3,
    roughness: 0.55,
    transparent: true,
    opacity: 0.45,
    envMapIntensity: 0.5,
  });
}
```

- [ ] **Step 2: Write asset paths module**

Create `src/components/vehicle-explorer-v2/data/paths.ts`:
```ts
const PREFIX = process.env.NEXT_PUBLIC_LC300_ASSET_PREFIX ?? '';

export const ASSETS = {
  skeleton: `${PREFIX}/models/lc300-ready/skeleton.glb`,
  body:     `${PREFIX}/models/lc300-ready/body.glb`,
  bay:      `${PREFIX}/models/lc300-ready/bay.glb`,
  underbody: `${PREFIX}/models/lc300-ready/underbody.glb`,
  hdr: {
    studio:    `${PREFIX}/hdr/studio_small_09_1k.ktx2`,
    autoshop:  `${PREFIX}/hdr/autoshop_01_1k.ktx2`,
    garage:    `${PREFIX}/hdr/garage_1k.ktx2`,
  },
} as const;
```

- [ ] **Step 3: Commit**

```
git add src/components/vehicle-explorer-v2/data/materials.ts src/components/vehicle-explorer-v2/data/paths.ts
git commit -m "feat(explorer): add material recipes and asset path constants"
```

---

### Task 5.3: Hook — useStage state machine

**Files:**
- Create: `src/components/vehicle-explorer-v2/hooks/useStage.ts`
- Create: `src/components/vehicle-explorer-v2/hooks/useStage.test.ts`

- [ ] **Step 1: Write the test first**

Create `src/components/vehicle-explorer-v2/hooks/useStage.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStage } from './useStage';

describe('useStage', () => {
  it('starts in exterior', () => {
    const { result } = renderHook(() => useStage());
    expect(result.current.stage).toBe('exterior');
    expect(result.current.transitioning).toBe(false);
  });

  it('transitions to engine and ends transitioning state', async () => {
    const { result } = renderHook(() => useStage());
    await act(async () => {
      await result.current.goTo('engine');
    });
    expect(result.current.stage).toBe('engine');
    expect(result.current.transitioning).toBe(false);
  });

  it('marks transitioning=true during goTo', async () => {
    const { result } = renderHook(() => useStage());
    let observedTransitioning = false;
    const promise = act(async () => {
      const p = result.current.goTo('underneath');
      observedTransitioning = result.current.transitioning;
      await p;
    });
    await promise;
    expect(observedTransitioning).toBe(true);
  });

  it('ignores goTo if already in target stage', async () => {
    const { result } = renderHook(() => useStage());
    await act(async () => {
      await result.current.goTo('exterior');
    });
    expect(result.current.transitioning).toBe(false);
  });
});
```

- [ ] **Step 2: Run test (should fail with module not found)**

Run: `npx vitest run src/components/vehicle-explorer-v2/hooks/useStage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `src/components/vehicle-explorer-v2/hooks/useStage.ts`:
```ts
import { useCallback, useRef, useState } from 'react';
import type { Stage } from '../data/types';

export const STAGE_TRANSITION_MS = 1800;

export function useStage(initial: Stage = 'exterior') {
  const [stage, setStage] = useState<Stage>(initial);
  const [transitioning, setTransitioning] = useState(false);
  const inFlight = useRef<Promise<void> | null>(null);

  const goTo = useCallback((target: Stage): Promise<void> => {
    if (target === stage || inFlight.current) return Promise.resolve();
    setTransitioning(true);
    const p = new Promise<void>((resolve) => {
      setTimeout(() => {
        setStage(target);
        setTransitioning(false);
        inFlight.current = null;
        resolve();
      }, STAGE_TRANSITION_MS);
    });
    inFlight.current = p;
    return p;
  }, [stage]);

  return { stage, transitioning, goTo };
}
```

- [ ] **Step 4: Run test to confirm pass**

Run: `npx vitest run src/components/vehicle-explorer-v2/hooks/useStage.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```
git add src/components/vehicle-explorer-v2/hooks/useStage.ts src/components/vehicle-explorer-v2/hooks/useStage.test.ts
git commit -m "feat(explorer): useStage hook with transition state machine"
```

---

### Task 5.4: Hook — usePerfBudget

**Files:**
- Create: `src/components/vehicle-explorer-v2/hooks/usePerfBudget.ts`
- Create: `src/components/vehicle-explorer-v2/hooks/usePerfBudget.test.ts`

- [ ] **Step 1: Write the test**

Create `src/components/vehicle-explorer-v2/hooks/usePerfBudget.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePerfBudget } from './usePerfBudget';

describe('usePerfBudget', () => {
  it('starts at full tier', () => {
    const { result } = renderHook(() => usePerfBudget());
    expect(result.current.tier).toBe('full');
    expect(result.current.budget.dpr).toBe(1.5);
    expect(result.current.budget.bloom).toBe(true);
  });

  it('declines full -> reduced -> minimal', () => {
    const { result } = renderHook(() => usePerfBudget());
    act(() => result.current.decline());
    expect(result.current.tier).toBe('reduced');
    expect(result.current.budget.dpr).toBe(1.0);
    expect(result.current.budget.bloom).toBe(false);

    act(() => result.current.decline());
    expect(result.current.tier).toBe('minimal');
    expect(result.current.budget.envResolution).toBe(128);
  });

  it('inclines back upward', () => {
    const { result } = renderHook(() => usePerfBudget());
    act(() => result.current.decline());
    act(() => result.current.decline());
    expect(result.current.tier).toBe('minimal');
    act(() => result.current.incline());
    expect(result.current.tier).toBe('reduced');
    act(() => result.current.incline());
    expect(result.current.tier).toBe('full');
  });

  it('clamps decline at minimal', () => {
    const { result } = renderHook(() => usePerfBudget());
    act(() => { result.current.decline(); result.current.decline(); result.current.decline(); });
    expect(result.current.tier).toBe('minimal');
  });
});
```

- [ ] **Step 2: Run test (should fail)**

Run: `npx vitest run src/components/vehicle-explorer-v2/hooks/usePerfBudget.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement hook**

Create `src/components/vehicle-explorer-v2/hooks/usePerfBudget.ts`:
```ts
import { useCallback, useState, useMemo } from 'react';

export type PerfTier = 'full' | 'reduced' | 'minimal';

export interface PerfBudget {
  dpr: number;
  envResolution: 128 | 256 | 512;
  bloom: boolean;
  n8ao: boolean;
  /** body uses MeshPhysicalMaterial (true) vs MeshStandardMaterial (false) */
  physicalBody: boolean;
}

const TIERS: Record<PerfTier, PerfBudget> = {
  full:    { dpr: 1.5, envResolution: 512, bloom: true,  n8ao: true,  physicalBody: true  },
  reduced: { dpr: 1.0, envResolution: 256, bloom: false, n8ao: true,  physicalBody: true  },
  minimal: { dpr: 1.0, envResolution: 128, bloom: false, n8ao: false, physicalBody: false },
};

const ORDER: PerfTier[] = ['full', 'reduced', 'minimal'];

export function usePerfBudget(initial: PerfTier = 'full') {
  const [tier, setTier] = useState<PerfTier>(initial);

  const decline = useCallback(() => {
    setTier((t) => {
      const idx = ORDER.indexOf(t);
      return ORDER[Math.min(idx + 1, ORDER.length - 1)];
    });
  }, []);

  const incline = useCallback(() => {
    setTier((t) => {
      const idx = ORDER.indexOf(t);
      return ORDER[Math.max(idx - 1, 0)];
    });
  }, []);

  const budget = useMemo(() => TIERS[tier], [tier]);

  return { tier, budget, decline, incline };
}
```

- [ ] **Step 4: Confirm tests pass**

Run: `npx vitest run src/components/vehicle-explorer-v2/hooks/usePerfBudget.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```
git add src/components/vehicle-explorer-v2/hooks/usePerfBudget.ts src/components/vehicle-explorer-v2/hooks/usePerfBudget.test.ts
git commit -m "feat(explorer): usePerfBudget hook with 3-tier adaptive ladder"
```

---

### Task 5.5: Hook — useGLTFKtx2 (KTX2 loader registration)

**Files:**
- Create: `src/components/vehicle-explorer-v2/hooks/useGLTFKtx2.ts`

- [ ] **Step 1: Write the hook**

Create `src/components/vehicle-explorer-v2/hooks/useGLTFKtx2.ts`:
```ts
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const KTX2_BASIS_PATH = 'https://www.gstatic.com/basis/versioned/v0.1.0/';

/**
 * Wraps drei useGLTF and registers the KTX2 loader against the current GL renderer.
 * Use this for any GLB with KTX2 textures or meshopt geometry.
 */
export function useGLTFKtx2(url: string) {
  const { gl } = useThree();

  const ktx2 = useMemo(() => {
    const loader = new KTX2Loader().setTranscoderPath(KTX2_BASIS_PATH);
    loader.detectSupport(gl);
    return loader;
  }, [gl]);

  return useGLTF(url, undefined, undefined, (loader) => {
    loader.setKTX2Loader(ktx2);
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
}
```

- [ ] **Step 2: Commit (no test — covered indirectly by visual stage tests)**

```
git add src/components/vehicle-explorer-v2/hooks/useGLTFKtx2.ts
git commit -m "feat(explorer): useGLTFKtx2 wrapper registering KTX2 + meshopt loaders"
```

---

## Phase 6: Lighting Rig + Exterior Stage

### Task 6.1: Lighting component with per-stage rigs

**Files:**
- Create: `src/components/vehicle-explorer-v2/scene/Lighting.tsx`

- [ ] **Step 1: Write the Lighting component**

Create `src/components/vehicle-explorer-v2/scene/Lighting.tsx`:
```tsx
'use client';

import { Environment, Lightformer } from '@react-three/drei';
import type { Stage } from '../data/types';
import type { PerfBudget } from '../hooks/usePerfBudget';
import { ASSETS } from '../data/paths';

interface LightingProps {
  stage: Stage;
  budget: PerfBudget;
}

export function Lighting({ stage, budget }: LightingProps) {
  if (stage === 'exterior') {
    return (
      <Environment resolution={budget.envResolution} frames={1} environmentIntensity={1.0}>
        <Lightformer form="rect" intensity={5} position={[0, 5, -3]}
          rotation-x={Math.PI / 2} scale={[12, 2.5, 1]} color="white" />
        <Lightformer form="rect" intensity={3} position={[4, 2, 4]}
          rotation-y={-Math.PI / 4} scale={[3, 3, 1]} color="#ffeeee" />
        <Lightformer form="rect" intensity={4} position={[-4, 1.8, -2]}
          rotation-y={Math.PI / 2} scale={[3, 4, 1]} color="#aaccff" />
        <Lightformer form="rect" intensity={0.6} position={[0, -1, 0]}
          rotation-x={-Math.PI / 2} scale={[20, 20, 1]} color="#404040" />
        <Lightformer form="rect" intensity={6} position={[0, 4, 1.5]}
          rotation-x={Math.PI / 2} scale={[8, 0.4, 1]} color="white" />
      </Environment>
    );
  }

  if (stage === 'engine') {
    return (
      <Environment
        files={ASSETS.hdr.autoshop}
        resolution={budget.envResolution}
        blur={0.05}
        environmentIntensity={1.0}
      />
    );
  }

  return (
    <>
      <Environment
        files={ASSETS.hdr.garage}
        resolution={budget.envResolution}
        environmentIntensity={0.4}
      />
      <directionalLight position={[0, 8, 0]} intensity={0.6} color="#ffeed0" />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/scene/Lighting.tsx
git commit -m "feat(explorer): per-stage lighting rig (Lightformer studio + HDRIs)"
```

---

### Task 6.2: Camera transition component

**Files:**
- Create: `src/components/vehicle-explorer-v2/scene/Camera.tsx`

- [ ] **Step 1: Write the Camera component**

Create `src/components/vehicle-explorer-v2/scene/Camera.tsx`:
```tsx
'use client';

import { useSpring, animated } from '@react-spring/three';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Stage } from '../data/types';
import { STAGE_TRANSITION_MS } from '../hooks/useStage';

interface StagePose {
  position: [number, number, number];
  target:   [number, number, number];
  orbitEnabled: boolean;
  minAzimuth?: number;
  maxAzimuth?: number;
  minPolar?: number;
  maxPolar?: number;
}

const POSES: Record<Stage, StagePose> = {
  exterior: {
    position: [4.2, 1.6, 6.4],
    target:   [0, 0.7, 0],
    orbitEnabled: true,
    minAzimuth: -Math.PI / 6,  maxAzimuth: Math.PI / 6,
    minPolar: Math.PI / 4,     maxPolar: Math.PI / 2.1,
  },
  engine: {
    position: [0, 3.2, 3.0],
    target:   [0, 1.2, -0.5],
    orbitEnabled: false,
  },
  underneath: {
    position: [0, 0.4, 5.0],
    target:   [0, 0.0, 0],
    orbitEnabled: false,
  },
};

interface CameraProps {
  stage: Stage;
  transitioning: boolean;
}

const AnimatedPerspective = animated(PerspectiveCamera);

export function Camera({ stage, transitioning }: CameraProps) {
  const pose = POSES[stage];
  const targetRef = useRef(new THREE.Vector3(...pose.target));

  const { pos } = useSpring({
    pos: pose.position,
    config: { tension: 80, friction: 30, duration: STAGE_TRANSITION_MS },
  });

  useEffect(() => {
    targetRef.current.set(...pose.target);
  }, [pose.target]);

  return (
    <>
      {/* @ts-expect-error animated PerspectiveCamera prop forwarding */}
      <AnimatedPerspective
        makeDefault
        fov={32}
        near={0.1}
        far={100}
        position={pos as unknown as [number, number, number]}
      />
      <OrbitControls
        enabled={pose.orbitEnabled && !transitioning}
        target={targetRef.current}
        enablePan={false}
        enableZoom={pose.orbitEnabled}
        minDistance={3}
        maxDistance={12}
        minAzimuthAngle={pose.minAzimuth}
        maxAzimuthAngle={pose.maxAzimuth}
        minPolarAngle={pose.minPolar}
        maxPolarAngle={pose.maxPolar}
        rotateSpeed={0.5}
      />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/scene/Camera.tsx
git commit -m "feat(explorer): camera component with useSpring transitions per stage"
```

---

### Task 6.3: LC300Body component

**Files:**
- Create: `src/components/vehicle-explorer-v2/scene/LC300Body.tsx`

- [ ] **Step 1: Write the body component**

Create `src/components/vehicle-explorer-v2/scene/LC300Body.tsx`:
```tsx
'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { ASSETS } from '../data/paths';
import {
  paintMaterial,
  chromeMaterial,
  tireMaterial,
  plasticTrimMaterial,
  ledMaterial,
  PAINTS,
  type PaintRecipe,
} from '../data/materials';
import { useGLTFKtx2 } from '../hooks/useGLTFKtx2';
import type { PerfBudget } from '../hooks/usePerfBudget';

interface LC300BodyProps {
  paint?: PaintRecipe;
  budget: PerfBudget;
  hoodAngle?: number;
}

const CANONICAL_PAINT_NAMES = ['Body', 'Hood', 'Door_FL', 'Door_FR', 'Door_RL', 'Door_RR'];
const CHROME_NAMES = ['BadgeOuter', 'BadgeInner'];
const TIRE_NAMES = ['Wheel_FL', 'Wheel_FR', 'Wheel_RL', 'Wheel_RR'];
const LED_NAMES = ['HeadlightDRL_L', 'HeadlightDRL_R'];

export function LC300Body({ paint = PAINTS[0], budget, hoodAngle = 0 }: LC300BodyProps) {
  const gltf = useGLTFKtx2(ASSETS.body);

  useMemo(() => {
    const paintMat = budget.physicalBody
      ? paintMaterial(paint)
      : new THREE.MeshStandardMaterial({
          color: paint.color,
          metalness: paint.metalness,
          roughness: paint.roughness,
        });
    const chrome = chromeMaterial();
    const tire = tireMaterial();
    const trim = plasticTrimMaterial();
    const led = ledMaterial();

    gltf.scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      const name = mesh.name;
      if (CANONICAL_PAINT_NAMES.includes(name)) {
        mesh.material = paintMat;
      } else if (CHROME_NAMES.includes(name) || name.startsWith('GrilleSlat_')) {
        mesh.material = chrome;
      } else if (TIRE_NAMES.includes(name)) {
        mesh.material = tire;
      } else if (LED_NAMES.includes(name)) {
        mesh.material = led;
      } else if (name.startsWith('HeadlightMain_')) {
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          transmission: 1.0,
          ior: 1.49,
          roughness: 0.0,
          thickness: 0.3,
          clearcoat: 1.0,
          clearcoatRoughness: 0.0,
        });
      } else if (name === 'Mirror_L' || name === 'Mirror_R') {
        mesh.material = trim;
      }
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m.map)               m.map.colorSpace          = THREE.SRGBColorSpace;
      if (m.emissiveMap)       m.emissiveMap.colorSpace  = THREE.SRGBColorSpace;
      if (m.normalMap)         m.normalMap.colorSpace    = THREE.NoColorSpace;
      if (m.roughnessMap)      m.roughnessMap.colorSpace = THREE.NoColorSpace;
      if (m.metalnessMap)      m.metalnessMap.colorSpace = THREE.NoColorSpace;
      if (m.aoMap)             m.aoMap.colorSpace        = THREE.NoColorSpace;
    });
  }, [gltf.scene, paint, budget.physicalBody]);

  const hood = gltf.scene.getObjectByName('Hood') as THREE.Object3D | undefined;
  if (hood) {
    hood.rotation.x = hoodAngle;
  }

  return <primitive object={gltf.scene} />;
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/scene/LC300Body.tsx
git commit -m "feat(explorer): LC300Body component with material assignment by canonical name"
```

---

### Task 6.4: HoodPivot — animated hood rotation

**Files:**
- Create: `src/components/vehicle-explorer-v2/scene/HoodPivot.tsx`

- [ ] **Step 1: Write component**

Create `src/components/vehicle-explorer-v2/scene/HoodPivot.tsx`:
```tsx
'use client';

import { useSpring, SpringValue } from '@react-spring/three';
import type { Stage } from '../data/types';

interface HoodPivotProps {
  stage: Stage;
  children: (angleRad: SpringValue<number>) => React.ReactNode;
}

export function HoodPivot({ stage, children }: HoodPivotProps) {
  const { angle } = useSpring({
    angle: stage === 'engine' ? -1.13 : 0,
    config: { tension: 90, friction: 24 },
  });
  return <>{children(angle)}</>;
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/scene/HoodPivot.tsx
git commit -m "feat(explorer): HoodPivot spring-animated hood angle by stage"
```

---

### Task 6.5: Hotspots3D — 3D hotspot markers

**Files:**
- Create: `src/components/vehicle-explorer-v2/scene/Hotspots.tsx`

- [ ] **Step 1: Write component**

Create `src/components/vehicle-explorer-v2/scene/Hotspots.tsx`:
```tsx
'use client';

import { Html } from '@react-three/drei';
import type { Hotspot, Stage } from '../data/types';
import { hotspotsForStage } from '../data/hotspots';

interface HotspotsProps {
  stage: Stage;
  onSelect: (h: Hotspot) => void;
}

export function Hotspots({ stage, onSelect }: HotspotsProps) {
  const visible = hotspotsForStage(stage);
  return (
    <>
      {visible.map((h) => (
        <group key={h.id} position={h.position}>
          <mesh
            onPointerDown={(e) => { e.stopPropagation(); onSelect(h); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = ''; }}
          >
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color="#ff3a2a"
              emissive="#ff3a2a"
              emissiveIntensity={2.5}
              toneMapped={false}
            />
          </mesh>
          <Html distanceFactor={8} center>
            <div
              onClick={() => onSelect(h)}
              style={{
                background: 'rgba(0,0,0,0.78)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transform: 'translate(20px, -50%)',
                userSelect: 'none',
              }}
            >
              {h.titleMn}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/scene/Hotspots.tsx
git commit -m "feat(explorer): 3D hotspots with HTML labels per stage"
```

---

## Phase 7: Engine Bay Stage

### Task 7.1: EngineBay component

**Files:**
- Create: `src/components/vehicle-explorer-v2/scene/EngineBay.tsx`

- [ ] **Step 1: Write component**

Create `src/components/vehicle-explorer-v2/scene/EngineBay.tsx`:
```tsx
'use client';

import * as THREE from 'three';
import { useMemo } from 'react';
import { ASSETS } from '../data/paths';
import { useGLTFKtx2 } from '../hooks/useGLTFKtx2';

const ENGINE_MAT = new THREE.MeshPhysicalMaterial({
  color: '#2a2a2e',
  metalness: 0.8,
  roughness: 0.35,
  envMapIntensity: 1.2,
});

const BAY_SHELL_MAT = new THREE.MeshStandardMaterial({
  color: '#3a3a3e',
  metalness: 0.3,
  roughness: 0.7,
});

export function EngineBay() {
  const gltf = useGLTFKtx2(ASSETS.bay);

  useMemo(() => {
    gltf.scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      if (mesh.name === 'Engine_Block') {
        mesh.material = ENGINE_MAT;
      } else if (mesh.name === 'EngineBay') {
        mesh.material = BAY_SHELL_MAT;
      }
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m.map)          m.map.colorSpace          = THREE.SRGBColorSpace;
      if (m.normalMap)    m.normalMap.colorSpace    = THREE.NoColorSpace;
      if (m.roughnessMap) m.roughnessMap.colorSpace = THREE.NoColorSpace;
      if (m.metalnessMap) m.metalnessMap.colorSpace = THREE.NoColorSpace;
    });
  }, [gltf.scene]);

  return <primitive object={gltf.scene} position={[0, 1.0, 0.6]} />;
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/scene/EngineBay.tsx
git commit -m "feat(explorer): EngineBay component with engine + bay shell materials"
```

---

## Phase 8: Underneath Stage

### Task 8.1: Underbody component (stylized cutaway)

**Files:**
- Create: `src/components/vehicle-explorer-v2/scene/Underbody.tsx`

- [ ] **Step 1: Write component**

Create `src/components/vehicle-explorer-v2/scene/Underbody.tsx`:
```tsx
'use client';

import * as THREE from 'three';
import { useMemo } from 'react';
import { ASSETS } from '../data/paths';
import { useGLTFKtx2 } from '../hooks/useGLTFKtx2';
import { suspensionSteelMaterial, chassisGhostMaterial } from '../data/materials';

const SUSP_NAMES = ['Suspension_FL', 'Suspension_FR', 'Suspension_RA'];

export function Underbody() {
  const gltf = useGLTFKtx2(ASSETS.underbody);

  useMemo(() => {
    const steel = suspensionSteelMaterial();
    const ghost = chassisGhostMaterial();
    gltf.scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      if (mesh.name === 'ChassisBase') {
        mesh.material = ghost;
        mesh.renderOrder = -1;
      } else if (SUSP_NAMES.includes(mesh.name)) {
        mesh.material = steel;
      }
    });
  }, [gltf.scene]);

  return <primitive object={gltf.scene} position={[0, -0.4, 0]} />;
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/scene/Underbody.tsx
git commit -m "feat(explorer): Underbody stylized cutaway with ghosted chassis"
```

---

## Phase 9: Performance, UI, Modal

### Task 9.1: Performance wrapper

**Files:**
- Create: `src/components/vehicle-explorer-v2/scene/Performance.tsx`

- [ ] **Step 1: Write component**

Create `src/components/vehicle-explorer-v2/scene/Performance.tsx`:
```tsx
'use client';

import { PerformanceMonitor } from '@react-three/drei';

interface PerformanceProps {
  onDecline: () => void;
  onIncline: () => void;
  children: React.ReactNode;
}

export function Performance({ onDecline, onIncline, children }: PerformanceProps) {
  return (
    <PerformanceMonitor
      onDecline={onDecline}
      onIncline={onIncline}
      flipflops={3}
      bounds={(refreshRate) => [Math.min(50, refreshRate - 10), refreshRate]}
    >
      {children}
    </PerformanceMonitor>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/scene/Performance.tsx
git commit -m "feat(explorer): PerformanceMonitor wrapper for adaptive degradation"
```

---

### Task 9.2: Stage button UI

**Files:**
- Create: `src/components/vehicle-explorer-v2/ui/StageButtons.tsx`

- [ ] **Step 1: Write component**

Create `src/components/vehicle-explorer-v2/ui/StageButtons.tsx`:
```tsx
'use client';

import type { Stage } from '../data/types';

interface StageButtonsProps {
  stage: Stage;
  onChange: (s: Stage) => void;
  disabled?: boolean;
}

const LABELS: Record<Stage, string> = {
  exterior:   'Гадна тал',
  engine:     'Хөдөлгүүр',
  underneath: 'Доод тал',
};

const ORDER: Stage[] = ['exterior', 'engine', 'underneath'];

export function StageButtons({ stage, onChange, disabled }: StageButtonsProps) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 8,
        padding: 8,
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 999,
        backdropFilter: 'blur(8px)',
      }}
    >
      {ORDER.map((s) => {
        const active = s === stage;
        return (
          <button
            key={s}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s)}
            disabled={disabled}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: 'none',
              cursor: disabled ? 'wait' : 'pointer',
              background: active ? '#ff3a2a' : 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              transition: 'background 0.2s',
            }}
          >
            {LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/ui/StageButtons.tsx
git commit -m "feat(explorer): StageButtons UI with Mongolian labels"
```

---

### Task 9.3: Hotspot modal

**Files:**
- Create: `src/components/vehicle-explorer-v2/ui/HotspotModal.tsx`

- [ ] **Step 1: Write component**

Create `src/components/vehicle-explorer-v2/ui/HotspotModal.tsx`:
```tsx
'use client';

import type { Hotspot } from '../data/types';
import { CTA_PHONE_DISPLAY, CTA_PHONE_TEL } from '../data/types';

interface HotspotModalProps {
  hotspot: Hotspot | null;
  onClose: () => void;
}

export function HotspotModal({ hotspot, onClose }: HotspotModalProps) {
  if (!hotspot) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 92vw)',
          background: '#121214',
          borderRadius: 16,
          padding: '24px 24px 20px',
          color: '#f5f5f5',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{hotspot.titleMn}</h3>
        <p style={{ margin: '12px 0 20px', fontSize: 14, lineHeight: 1.55, color: '#cdcdd2' }}>
          {hotspot.descriptionMn}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={CTA_PHONE_TEL}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 999,
              background: '#ff3a2a',
              color: '#fff',
              textAlign: 'center',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Цаг захиалах · {CTA_PHONE_DISPLAY}
          </a>
          <button
            onClick={onClose}
            style={{
              padding: '12px 18px',
              borderRadius: 999,
              border: '1px solid #2e2e34',
              background: 'transparent',
              color: '#cdcdd2',
              cursor: 'pointer',
              fontSize: 14,
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
git add src/components/vehicle-explorer-v2/ui/HotspotModal.tsx
git commit -m "feat(explorer): HotspotModal with Mongolian copy + tel CTA"
```

---

### Task 9.4: Loader

**Files:**
- Create: `src/components/vehicle-explorer-v2/ui/Loader.tsx`

- [ ] **Step 1: Write component**

Create `src/components/vehicle-explorer-v2/ui/Loader.tsx`:
```tsx
'use client';

import { useProgress } from '@react-three/drei';

export function Loader() {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(8,8,10,0.85)',
        color: '#f5f5f5',
        fontSize: 14,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 12 }}>Land Cruiser 300 ачааллаж байна…</div>
        <div style={{ width: 240, height: 4, background: '#2a2a30', borderRadius: 2, overflow: 'hidden', margin: '0 auto' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#ff3a2a',
              transition: 'width 0.2s',
            }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#9a9aa0' }}>{Math.round(progress)}%</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/ui/Loader.tsx
git commit -m "feat(explorer): Loader with progress and Mongolian copy"
```

---

## Phase 10: Integration

### Task 10.1: LC300Explorer top-level component

**Files:**
- Create: `src/components/vehicle-explorer-v2/LC300Explorer.tsx`

- [ ] **Step 1: Write the top-level component**

Create `src/components/vehicle-explorer-v2/LC300Explorer.tsx`:
```tsx
'use client';

import { Suspense, lazy, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, BakeShadows } from '@react-three/drei';
import { EffectComposer, Bloom, N8AO, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';

import { useStage } from './hooks/useStage';
import { usePerfBudget } from './hooks/usePerfBudget';
import { Lighting } from './scene/Lighting';
import { Camera } from './scene/Camera';
import { LC300Body } from './scene/LC300Body';
import { HoodPivot } from './scene/HoodPivot';
import { Hotspots } from './scene/Hotspots';
import { Performance } from './scene/Performance';
import { StageButtons } from './ui/StageButtons';
import { HotspotModal } from './ui/HotspotModal';
import { Loader } from './ui/Loader';
import { PAINTS } from './data/materials';
import type { Hotspot } from './data/types';

const EngineBay = lazy(() => import('./scene/EngineBay').then((m) => ({ default: m.EngineBay })));
const Underbody = lazy(() => import('./scene/Underbody').then((m) => ({ default: m.Underbody })));

export default function LC300Explorer() {
  const { stage, transitioning, goTo } = useStage();
  const { tier, budget, decline, incline } = usePerfBudget();
  const [paint] = useState(PAINTS[0]);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  return (
    <section
      aria-label="LC300 3D explorer"
      style={{
        position: 'relative',
        width: '100%',
        height: 'min(720px, 80vh)',
        background: '#0a0a0c',
        overflow: 'hidden',
      }}
    >
      <Loader />

      <Canvas
        dpr={[1, budget.dpr]}
        shadows={false}
        gl={{
          antialias: true,
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            // eslint-disable-next-line no-console
            console.warn('[LC300] WebGL context lost — preparing recovery');
          });
        }}
      >
        <Performance onDecline={decline} onIncline={incline}>
          <Suspense fallback={null}>
            <Camera stage={stage} transitioning={transitioning} />
            <Lighting stage={stage} budget={budget} />

            <HoodPivot stage={stage}>
              {(angle) => (
                <LC300Body
                  paint={paint}
                  budget={budget}
                  hoodAngle={angle.get?.() ?? 0}
                />
              )}
            </HoodPivot>

            {stage === 'engine' && (
              <Suspense fallback={null}>
                <EngineBay />
              </Suspense>
            )}

            {stage === 'underneath' && (
              <Suspense fallback={null}>
                <Underbody />
              </Suspense>
            )}

            <Hotspots stage={stage} onSelect={setActiveHotspot} />

            <ContactShadows
              position={[0, -0.001, 0]}
              opacity={0.55}
              blur={2.4}
              far={3}
              scale={12}
              resolution={budget.envResolution}
              frames={1}
            />
            <BakeShadows />

            <EffectComposer multisampling={4}>
              {budget.n8ao ? <N8AO aoRadius={0.4} intensity={1.8} distanceFalloff={1} /> : <></>}
              {budget.bloom ? <Bloom luminanceThreshold={1.0} mipmapBlur intensity={0.5} /> : <></>}
              <Vignette eskil={false} offset={0.3} darkness={0.35} />
              <ToneMapping mode={ToneMappingMode.NEUTRAL} />
            </EffectComposer>
          </Suspense>
        </Performance>
      </Canvas>

      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <StageButtons stage={stage} onChange={goTo} disabled={transitioning} />
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            background: 'rgba(0,0,0,0.6)',
            color: '#cdcdd2',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
          }}
        >
          perf: {tier}
        </div>
      )}

      <HotspotModal hotspot={activeHotspot} onClose={() => setActiveHotspot(null)} />
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```
git add src/components/vehicle-explorer-v2/LC300Explorer.tsx
git commit -m "feat(explorer): LC300Explorer top-level component with stage state + perf"
```

---

### Task 10.2: Public index export and Next dynamic wrapper

**Files:**
- Create: `src/components/vehicle-explorer-v2/index.ts`
- Create: `src/components/LC300ExplorerSection.tsx`

- [ ] **Step 1: Write the barrel**

Create `src/components/vehicle-explorer-v2/index.ts`:
```ts
export { default as LC300Explorer } from './LC300Explorer';
```

- [ ] **Step 2: Write the SSR-safe wrapper**

Create `src/components/LC300ExplorerSection.tsx`:
```tsx
'use client';

import dynamic from 'next/dynamic';

const LC300Explorer = dynamic(
  () => import('./vehicle-explorer-v2').then((m) => m.LC300Explorer),
  { ssr: false },
);

export default function LC300ExplorerSection() {
  return (
    <section id="lc300-explorer" style={{ padding: '64px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 24, color: '#f5f5f5' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Land Cruiser 300</h2>
        <p style={{ marginTop: 8, color: '#9a9aa0' }}>
          Машинаа эргүүлж, дотрыг нь нээж, доороос харна уу
        </p>
      </div>
      <LC300Explorer />
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```
git add src/components/vehicle-explorer-v2/index.ts src/components/LC300ExplorerSection.tsx
git commit -m "feat(explorer): public barrel + SSR-safe dynamic-import wrapper"
```

---

### Task 10.3: Replace old explorer in page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Locate the old explorer in page.tsx**

Use Grep to find import of `VehicleExplorer` in `src/app/page.tsx` and identify the surrounding section.

- [ ] **Step 2: Replace import and usage**

In `src/app/page.tsx`, replace the `VehicleExplorer` import with:
```tsx
import LC300ExplorerSection from '@/components/LC300ExplorerSection';
```
Then replace the `<VehicleExplorer ... />` JSX with `<LC300ExplorerSection />`.

- [ ] **Step 3: Build to confirm no type errors**

Run: `npm run build`
Expected: build passes.

- [ ] **Step 4: Commit**

```
git add src/app/page.tsx
git commit -m "feat(explorer): swap old VehicleExplorer for new LC300ExplorerSection"
```

---

### Task 10.4: Footer attribution block

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Read current footer**

Use Read on `src/components/Footer.tsx` to find the right insertion location.

- [ ] **Step 2: Add attribution section**

Add this block inside the footer, near the bottom:
```tsx
<div style={{ marginTop: 16, fontSize: 10, color: '#9a9aa0', lineHeight: 1.6, maxWidth: 720, marginInline: 'auto' }}>
  3D загвар: Lexus LX600 — KINGSLEY_king · Lexus IS250 Under the Hood — TheFailedArchitect ·
  V6 Engine — fasteng · Chevy Impala Undercarriage — omegadarling ·
  Double Wishbone & Live Axle Suspension — BlackWΛVΞ · 4-Link Suspension — Jorma Rysky.
  Бүгд CC-BY 4.0 лицензтэй. HDRI: Poly Haven (CC0).
</div>
```

- [ ] **Step 3: Commit**

```
git add src/components/Footer.tsx
git commit -m "feat(explorer): add CC-BY attribution block to footer"
```

---

## Phase 11: Verification

### Task 11.1: Build + lint + type check

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Unit tests**

Run: `npx vitest run`
Expected: all `useStage` and `usePerfBudget` tests pass.

- [ ] **Step 5: Commit any housekeeping**

If small fixes were needed:
```
git add -A
git commit -m "chore(explorer): housekeeping fixes from build/lint verification"
```

---

### Task 11.2: Browser verification — all three stages

- [ ] **Step 1: Start preview**

Use `mcp__Claude_Preview__preview_start` to start the dev server.

- [ ] **Step 2: Navigate to explorer section**

Use `mcp__Claude_Preview__preview_eval`:
```js
document.getElementById('lc300-explorer').scrollIntoView({ behavior: 'instant' });
```

- [ ] **Step 3: Wait for load and capture exterior**

Wait 8 seconds for full GLB load, then `preview_screenshot` to capture exterior stage.

Verify the screenshot shows: LC300 with chrome grille slats visible, headlights with DRL accents, body with paint depth, glass with tint, contact shadow below.

- [ ] **Step 4: Click engine stage button**

Use `preview_click` on the "Хөдөлгүүр" button. Wait 2.5s for transition. `preview_screenshot` the engine bay.

Verify: hood is open, V6 visible in bay, engine-stage hotspots showing.

- [ ] **Step 5: Click underneath stage button**

`preview_click` on "Доод тал". Wait 2.5s. Screenshot.

Verify: chassis ghosted in blue, suspension assemblies visible at corners, hotspot markers.

- [ ] **Step 6: Check console for errors**

Run `preview_console_logs`. Expected: no errors. WebGL warnings about extensions are allowed; "context lost" or material warnings are NOT.

- [ ] **Step 7: Memory check**

Run:
```js
performance.memory ? performance.memory.usedJSHeapSize : 'unavailable'
```
Expected: under 800 MB.

- [ ] **Step 8: Resize to mobile and re-verify**

`preview_resize` to 360×800. Re-screenshot all three stages. Adaptive degradation may kick in; check the "perf" indicator — if it shows "reduced" or "minimal", that's correct behavior.

- [ ] **Step 9: Document outcomes in spec**

Append a "Verification — Phase 11.2" subsection to `docs/superpowers/specs/2026-05-26-lc300-explorer-strategic-reset.md` confirming each stage screenshot looks correct, with the date.

- [ ] **Step 10: Commit verification log**

```
git add docs/superpowers/specs/2026-05-26-lc300-explorer-strategic-reset.md
git commit -m "docs(explorer): verification log for v1 ship"
```

---

### Task 11.3: Final PR readiness

- [ ] **Step 1: Pull main**

Run: `git fetch origin main`

- [ ] **Step 2: Confirm clean diff against main**

Run: `git log --oneline origin/main..HEAD`
Expected: clean list of `feat(explorer):` / `docs(explorer):` / `chore(explorer):` commits.

- [ ] **Step 3: Status check**

Run: `git status`
Expected: clean. No untracked files.

- [ ] **Step 4: Hand off to user for PR**

Inform user that the worktree is ready to PR or merge. Do not auto-push or auto-create PR — wait for user confirmation.

---

## Self-Review

**Spec coverage:**

| Spec section | Plan task(s) |
|---|---|
| §1 Failure root causes | Material recipes (5.2), Lighting rig (6.1), color-space sanitization (6.3, 7.1) |
| §2 Stack | Task 1.1 |
| §3 Asset plan | Phase 2 + Phase 3 |
| §4 Three stages | Phase 6, 7, 8 + Task 10.1 |
| §5 Mobile budget | Task 5.4, Task 9.1 |
| §6 Material recipes | Task 5.2 |
| §7 Asset pipeline | Phase 3 + Phase 4 |
| §8 R3F structure | Phase 5 + Task 10.1 |
| §9 v1 scope | This entire plan |
| §10 Risk register | Task 2.1, Task 9.1 |
| §11 Prompts A–D | Tasks 3.x, 4.x, this plan, Task 11.2 |
| §12 Success criteria | Task 11.2 |
| App. A Footer attribution | Task 10.4 |
| App. C decisions (1–5) | Tasks 2.1, 3.1, 3.2, 9.3 |

**Placeholder scan:** None found. Every step contains runnable commands or complete code.

**Type consistency:**
- `Stage` defined in `data/types.ts`, used by `useStage`, `Lighting`, `Camera`, `Hotspots`, `LC300Explorer`, `StageButtons`, `HoodPivot`.
- `PerfBudget` defined in `usePerfBudget.ts`, consumed by `Lighting`, `LC300Body`, `LC300Explorer`.
- `Hotspot` defined in `data/types.ts`, used by `hotspots.ts`, `Hotspots.tsx`, `HotspotModal.tsx`, `LC300Explorer.tsx`.
- `ASSETS` paths consumed by `useGLTFKtx2` callers in `LC300Body`, `EngineBay`, `Underbody`, `Lighting`.
- Conventional commit prefixes (`feat(explorer):` / `docs(explorer):` / `chore(explorer):`) used throughout.

No issues found.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-26-lc300-explorer-strategic-reset.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration. Best for a plan this size because each subagent starts with clean context and only loads what's needed for its task.

**2. Inline Execution** — execute tasks in this session using `executing-plans`, batched with checkpoints. Risks context exhaustion partway through the asset pipeline.

**Which approach?**
