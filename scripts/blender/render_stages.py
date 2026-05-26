"""Master render pipeline.

Renders 4 stages of the LC300 to tmp/renders/{stage}/frame_NNN.png at 1280x720.
For each frame, projects every hotspot's 3D anchor through the camera and writes
tmp/renders/{stage}/projections.json with per-frame screen coordinates + occlusion.

Usage from CLI:
  blender --background public/models/lc300-raw/lc300-working.blend \\
          --python scripts/blender/render_stages.py -- --stage exterior

Or invoke all four sequentially via render_stage.sh.

Render time: with samples=256 + key/fill lights + AgX, expect 45-90 s/frame on a
decent GPU. **Plan to render overnight and expect 2-4 iterations** before all stages
look right (hood pivot, camera framing, HDRI exposure, hotspot alignment).

Approximate per-stage times at 60 s/frame:
  exterior        90 frames ~= 90 min
  engine_approach 30 frames ~= 30 min
  engine_bay      60 frames ~= 60 min
  underneath      60 frames ~= 60 min
  TOTAL                       ~= 4 h per iteration
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
        'anchors_key': 'exterior',
    },
    # Engine sub-sequence A: closed hood, camera arcs from the side toward the front
    # while dollying in. Hood stays closed throughout. Drag controls camera position
    # along the arc -- one motion (orbit-with-dolly), no hood animation conflation.
    'engine_approach': {
        'frames': 30,
        'hdr': 'public/hdr/autoshop_01_2k.hdr',
        'samples': 256,
        'turntable_rotation': lambda f, n: (0, 0, math.radians(120 * f / n - 60)),
        'camera_local': lambda f, n: (
            0,
            -5.0 + (1.5 * f / n),
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
        'camera_rotation': (math.radians(102), 0, 0),
        'lens': 35,
        'hood_open_frac': 1,
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
        raise RuntimeError('Turntable/TT_Camera missing -- run setup_render_scene.py first')
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
    hood = find_object('Bonnet')  # NLM names the bonnet 'Bonnet', not 'Hood'
    if hood is None:
        return
    hood.rotation_euler.x = HOOD_CLOSED_ROT_X + (HOOD_OPEN_ROT_X - HOOD_CLOSED_ROT_X) * open_frac


def fix_hood_pivot_once():
    """Move hood origin to its rear edge (max-Y vertex), so rotation hinges correctly.

    Idempotent: only runs if hood's origin is not already on the rear edge.
    """
    hood = find_object('Bonnet')  # NLM names the bonnet 'Bonnet', not 'Hood'
    if hood is None:
        print('[hood] no Bonnet object found -- skipping pivot fix')
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

    Symptom A: every hotspot in every frame is visible=True -> occlusion never fires.
    Symptom B: every hotspot in every frame is visible=False -> occlusion fires on
               everything, likely because depsgraph isn't fully evaluated.

    Returns (is_degenerate, reason).
    """
    in_frame_total = 0
    visible_total = 0
    for frame in per_frame_projections:
        for h in frame:
            if h.get('in_frame'):
                in_frame_total += 1
                if h['visible']:
                    visible_total += 1
    if in_frame_total == 0:
        return False, 'no in-frame projections (camera misaligned?)'
    ratio = visible_total / in_frame_total
    if ratio == 1.0:
        return True, f'all {in_frame_total} in-frame projections marked visible -- ray_cast likely degenerate in --background'
    if ratio == 0.0:
        return True, f'no in-frame projections marked visible -- ray_cast over-aggressive or depsgraph stale'
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
