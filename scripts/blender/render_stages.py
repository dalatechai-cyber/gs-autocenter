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
    # 360° around the open bay AT THE ENGINE BAY CENTER (not the car center).
    # Turntable is temporarily moved to (0, 6, 1) so the orbit happens around
    # the bay; camera offset (1.5, 0.3, 3.5) puts it above-right of the bay,
    # angled down. Hood opens to +75° (positive — the sign was inverted in the
    # prior config because the hood pivot was at the wrong edge, see
    # HOOD_OPEN_ROT_X). An extra fill light above the bay brightens the engine
    # cover / intake / battery now visible when the hood is up.
    'engine_bay': {
        'frames': 60,
        'hdr': 'public/hdr/autoshop_01_2k.hdr',
        'samples': 256,
        # Turntable above the engine bay; camera looks STRAIGHT DOWN into the
        # bay opening. This is the only angle that reliably shows the engine
        # cover / intake / battery — the open hood tilts back toward the
        # windshield (Y<5.8) and stays at the top edge of frame. Verified
        # interactively (test render engine_bay_v13). The 360° turntable
        # rotation spins the top-down view so the engine is seen from rotating
        # angles. The look-at point sits directly below the camera (same XY,
        # lower Z) so the view stays straight-down throughout the orbit rather
        # than tilting toward the hood.
        'turntable_location': (0.0, 6.3, 1.0),
        'turntable_rotation': lambda f, n: (0, 0, math.radians(360 * f / n)),
        'camera_local': (0.0, 0.3, 4.0),
        'camera_look_at_local': (0.0, 0.3, -1.0),
        'lens': 35,
        'hood_open_frac': 1,
        'anchors_key': 'engine',
        'engine_bay_fill_light': True,
    },
    # Underbody pan — camera at ground level, looking UP at the chassis.
    # 180° sweep from -90° (left) through 0° (rear) to +90° (right). Camera
    # local Z=-1.04 puts it at world Z=0.10 (just above ground) with the
    # turntable at car center. An underbody area light (added at render
    # time) illuminates the chassis / diffs / exhaust which would otherwise be
    # in deep shadow under the car.
    'underneath': {
        'frames': 60,
        'hdr': 'public/hdr/garage_2k.hdr',
        'samples': 256,
        # 110° sweep from -55° (rear-left) through 0° (straight up the centre
        # line from behind) to +55° (rear-right). Narrower than a full ±90°
        # because the pure side angles (±90°) just show the flat rocker panel;
        # staying within ±55° keeps the driveshaft / diffs / exhaust / frame
        # rails framed up the centre of the underbody throughout.
        'turntable_rotation': lambda f, n: (0, 0, math.radians(110 * f / n - 55)),
        'camera_local': (0, -1.42, -1.04),
        # Look up at the car center (turntable origin). Verified angle: camera
        # at world Z=0.10 (just above ground) tilts up ~36° to frame the frame
        # rails, diffs, exhaust, driveshaft.
        'camera_look_at_local': (0.0, 0.0, 0.0),
        'lens': 28,
        'hood_open_frac': 0,
        'anchors_key': 'underneath',
        'underbody_fill_light': True,
    },
}

HOOD_CLOSED_ROT_X = 0.0
# Hood opens to +75° (positive). Earlier configs used -65° because the pivot
# fix was using max(Y) instead of min(Y), placing the hinge at the hood's
# FRONT edge (latch end). With the corrected pivot at min(Y) = rear hinge
# near the windshield, +75° lifts the FRONT edge UP toward the windshield —
# the way a real car hood opens.
HOOD_OPEN_ROT_X   = math.radians(75)


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
    abs_path = os.path.abspath(hdri_path)
    if not os.path.exists(abs_path):
        raise FileNotFoundError(
            f'HDRI not found: {abs_path}\n'
            f'Run the curl commands in Task 1.4 Step 1 to download it. '
            f'Aborting render to avoid producing frames with a magenta placeholder.'
        )
    img = bpy.data.images.load(abs_path, check_existing=True)
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
    # Optional per-stage turntable location override (e.g. engine_bay orbits
    # around the bay center at (0, 6, 1) instead of the car center at (0, 3.92, 1.14)).
    if 'turntable_location' in stage_cfg:
        tt.location = stage_cfg['turntable_location']
    tt.rotation_euler = stage_cfg['turntable_rotation'](frame, total)
    cam_local = stage_cfg['camera_local']
    if callable(cam_local):
        cam_local = cam_local(frame, total)
    cam.location = cam_local
    # Two ways to orient the camera:
    #  - 'camera_look_at_local': a point in the turntable's LOCAL frame to aim
    #    at (computed via to_track_quat). Because the camera is parented to the
    #    turntable, looking at a fixed local point keeps that target centered as
    #    the turntable orbits — ideal for engine_bay (look into the bay opening)
    #    and underneath (look up at the chassis).
    #  - 'camera_rotation': a fixed Euler tuple (used by exterior/engine_approach).
    if 'camera_look_at_local' in stage_cfg:
        target = Vector(stage_cfg['camera_look_at_local'])
        direction = target - Vector(cam_local)
        cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    else:
        rot = stage_cfg['camera_rotation']
        if callable(rot):
            rot = rot(frame, total)
        cam.rotation_euler = rot
    cam.data.lens = stage_cfg['lens']


def set_hood(open_frac):
    """Rotate the Bonnet on its X axis to the given open fraction.

    Fails loudly if Bonnet is missing or if the rotation axis appears unusable —
    silent no-op here would render 60 frames of engine_bay with a closed hood.
    """
    hood = find_object('Bonnet')  # NLM names the bonnet 'Bonnet', not 'Hood'
    if hood is None:
        raise RuntimeError(
            'Bonnet object missing — cannot animate hood for engine stages. '
            'Verify lc300-working.blend contains an object named "Bonnet" '
            '(see scripts/blender/INVENTORY.md).'
        )
    # Clear any leftover animation action on the hood before setting rotation.
    # The source .blend has a "Plane.004Action" F-curve driving the Bonnet's
    # rotation. With the scene parked at frame 273, that F-curve evaluates to
    # ~closed and OVERRIDES any direct rotation_euler assignment on every
    # depsgraph evaluation — so set_hood was silently ignored and engine_bay
    # rendered 60 frames of a closed hood. Clearing the animation data lets the
    # direct assignment below actually take effect.
    if hood.animation_data is not None:
        hood.animation_data_clear()
    hood.rotation_euler.x = HOOD_CLOSED_ROT_X + (HOOD_OPEN_ROT_X - HOOD_CLOSED_ROT_X) * open_frac


# Module-level flag: ensures the hood pivot is fixed exactly once per Python process,
# even when --stage all runs render_stage() four times sequentially.
_hood_pivot_fixed = False


def fix_hood_pivot_once():
    """Move Bonnet origin to its rear edge so rotation hinges correctly.

    Headless-safe: manipulates mesh data + matrix directly instead of using
    bpy.ops.object.origin_set, which requires a 3D viewport context that doesn't
    exist in --background mode. Idempotent via module-level _hood_pivot_fixed flag.
    """
    global _hood_pivot_fixed
    if _hood_pivot_fixed:
        return

    hood = find_object('Bonnet')  # NLM names the bonnet 'Bonnet', not 'Hood'
    if hood is None:
        print('[hood] no Bonnet object found -- skipping pivot fix')
        _hood_pivot_fixed = True
        return

    # Clear the leftover "Plane.004Action" F-curve and reset to rest pose BEFORE
    # computing the pivot. If the hood is rotated by the F-curve (scene parked at
    # frame 273), matrix_world would be rotated and the pivot math would be wrong.
    if hood.animation_data is not None:
        hood.animation_data_clear()
    hood.rotation_euler = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()

    # Target: rear edge of local bound box (min-Y vertex = hinge near windshield),
    # at mid-Z. Earlier this used max(Y) which selected the FRONT edge of the
    # hood (latch end) — wrong hinge, hood swung the wrong way. Wheels confirm
    # +Y is forward (FL/FR wheels at Y=5.97, RL/RR at Y=2.20), so the hood's
    # rear/hinge edge has the smaller Y value (Y=5.33 in world space).
    rear_edge_local_y = min(c[1] for c in hood.bound_box)
    rear_edge_local_z = sum(c[2] for c in hood.bound_box) / 8
    rear_edge_local = Vector((0, rear_edge_local_y, rear_edge_local_z))

    # World-space position of the new origin
    rear_edge_world = hood.matrix_world @ rear_edge_local

    # No-op if origin is already at the rear edge (within 1mm)
    if (hood.matrix_world.translation - rear_edge_world).length < 0.001:
        print('[hood] origin already at rear edge -- skipping pivot fix')
        _hood_pivot_fixed = True
        return

    # Manual origin set:
    #   1. Shift every vertex by -rear_edge_local in LOCAL space
    #   2. Move object translation to rear_edge_world in WORLD space
    # Math: original world position of vertex v = T + (R*S) @ v.
    # After: T' + (R*S) @ (v - L) where T' = T + (R*S) @ L = rear_edge_world.
    # Substituting: rear_edge_world + (R*S)@v - (R*S)@L = T + (R*S)@L + (R*S)@v - (R*S)@L
    #             = T + (R*S)@v = original. So mesh stays in same world position.
    mesh = hood.data
    for v in mesh.vertices:
        v.co -= rear_edge_local
    mesh.update()
    hood.location = rear_edge_world  # for unparented objects, location == matrix_world.translation

    print(f'[hood] origin moved to {tuple(round(c, 3) for c in rear_edge_world)}')
    _hood_pivot_fixed = True


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


def configure_fill_lights(cfg):
    """Toggle engine_bay / underbody fill lights for the current stage.

    Idempotent — creates the lights on first call, hides/shows on subsequent
    stages. Both lights stay in the scene so re-running a single stage doesn't
    leave the other's light around.
    """
    # Engine bay fill: bright area light directly above the engine bay,
    # pointing DOWN. Needed because the open hood blocks HDRI from reaching
    # the bay interior — without this, the engine renders as deep shadow.
    ebl = bpy.data.objects.get('LC300_EngineBayFill')
    if ebl is None:
        bpy.ops.object.light_add(type='AREA', location=(0, 6.3, 4.5))
        ebl = bpy.context.active_object
        ebl.name = 'LC300_EngineBayFill'
        ebl.data.size = 2.0
        ebl.data.energy = 1000  # bright — needs to overpower hood shadow
        ebl.data.color = (1.0, 0.98, 0.92)
        ebl.rotation_euler = (0, 0, 0)  # area lights emit -Z
    ebl.hide_render = not cfg.get('engine_bay_fill_light', False)

    # Underbody fill: large area light BELOW the car, pointing UP. HDRI and
    # key/fill lights are all above the car, so the underside is otherwise
    # in deep shadow.
    ufl = bpy.data.objects.get('LC300_UnderbodyFill')
    if ufl is None:
        bpy.ops.object.light_add(type='AREA', location=(0, 3.92, -1.5))
        ufl = bpy.context.active_object
        ufl.name = 'LC300_UnderbodyFill'
        ufl.data.size = 6.0  # cover car footprint
        ufl.data.energy = 400
        ufl.data.color = (1.0, 0.95, 0.88)
        ufl.rotation_euler = (math.radians(180), 0, 0)  # rotate to emit +Z (up)
    ufl.hide_render = not cfg.get('underbody_fill_light', False)


def render_stage(stage_name):
    cfg = STAGES[stage_name]
    total = args.frames if args.frames else cfg['frames']
    out_dir = os.path.join(OUT_DIR, stage_name)
    os.makedirs(out_dir, exist_ok=True)

    scene = bpy.context.scene
    scene.cycles.samples = cfg['samples']
    configure_hdri(cfg['hdr'])
    fix_hood_pivot_once()
    configure_fill_lights(cfg)

    anchors_key = cfg.get('anchors_key', stage_name)
    hotspots = ANCHORS.get(anchors_key, []) + ANCHORS.get('DEFERRED', [])
    per_frame_projections = []

    out_json = os.path.join(out_dir, 'projections.json')
    degenerate = False
    reason = 'render did not complete'
    completed = False

    def write_projections(final=False):
        """Flush per_frame_projections to disk. Safe to call mid-render."""
        with open(out_json, 'w') as fp:
            json.dump({
                'stage': stage_name,
                'frameCount': len(per_frame_projections),
                'expectedFrameCount': total,
                'width': scene.render.resolution_x,
                'height': scene.render.resolution_y,
                'occlusionDegenerate': degenerate,
                'occlusionReason': reason,
                'complete': final,
                'perFrame': per_frame_projections,
            }, fp, indent=2)

    try:
        for f in range(total):
            set_camera_pose(cfg, f, total)
            hood_open = cfg['hood_open_frac']
            if callable(hood_open):
                hood_open = hood_open(f, total)
            set_hood(hood_open)

            bpy.context.view_layer.update()
            # Force a full depsgraph evaluation so ray_cast sees the current pose,
            # not the previous frame's. Cheap insurance against ray_cast staleness in --background.
            depsgraph = bpy.context.evaluated_depsgraph_get()
            depsgraph.update()

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
            result = bpy.ops.render.render(write_still=True)
            if 'CANCELLED' in result:
                raise RuntimeError(f'render cancelled at frame {f}')

            print(f'[{stage_name}] frame {f+1}/{total} done')

            # Checkpoint every 10 frames so a mid-render crash leaves usable state
            if (f + 1) % 10 == 0:
                write_projections(final=False)

        degenerate, reason = detect_degenerate_occlusion(per_frame_projections)
        print(f'[{stage_name}] occlusion check: {reason}')
        if degenerate:
            print(f'[{stage_name}] WARNING: occlusion gating disabled for this stage.')
            print(f'[{stage_name}] Falling back to in-frame check only. Hotspots may show '
                  f'through opaque geometry from rear angles.')
            for frame_data in per_frame_projections:
                for h in frame_data:
                    h['visible'] = bool(h.get('in_frame'))

        write_projections(final=True)
        completed = True
        print(f'[{stage_name}] wrote projections.json')
    finally:
        # On crash, flush whatever partial state we have so the rendered PNGs aren't orphaned.
        # On successful completion, the success path already wrote complete=True; don't overwrite it.
        if not completed:
            write_projections(final=False)
            print(f'[{stage_name}] flushed partial projections.json (render incomplete)')


if args.stage == 'all':
    for s in ('exterior', 'engine_approach', 'engine_bay', 'underneath'):
        render_stage(s)
else:
    render_stage(args.stage)

print('=== RENDER COMPLETE ===')
