"""Set up Cycles render scene: engine settings, HDRI, output format, turntable rig.

Saves modified .blend to public/models/lc300-raw/lc300-working.blend so render_stages.py
can open it directly.
"""
import bpy
import math
import os
from mathutils import Vector

BLEND_IN  = os.path.abspath('public/models/lc300-raw/lc300-working.blend')
BLEND_OUT = os.path.abspath('public/models/lc300-raw/lc300-working.blend')
HDRI_PATH = os.path.abspath('public/hdr/studio_small_09_2k.hdr')

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
env.image = bpy.data.images.load(HDRI_PATH, check_existing=True)
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
    # API-level empty creation works without an active 3D viewport (headless / MCP safe)
    tt = bpy.data.objects.new('Turntable', None)
    tt.empty_display_type = 'PLAIN_AXES'
    scene.collection.objects.link(tt)
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
