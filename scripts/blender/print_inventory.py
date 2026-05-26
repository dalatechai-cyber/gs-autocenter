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
