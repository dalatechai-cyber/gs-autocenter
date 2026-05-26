"""Verify every image datablock's filepath resolves; re-link missing ones from TEX/."""
import bpy
import os
import sys
from pathlib import Path

# Textures NLM packaged as references to other products' files (e.g. Porsche leather).
# These are not in TEX.zip and we don't have rights to source them. They feed
# non-Base-Color shader inputs so the visual impact is minor — interior surfaces
# render with the BSDF default rather than a magenta "missing" placeholder.
EXPECTED_MISSING = {
    'FabricDFS.jpg',           # original name in PORSCHE/... path
    'FabricDFS.jpg.001',       # Blender-renamed duplicate datablock
}

BLEND = 'public/models/lc300-raw/Toyota Land Cruiser 300.blend'
TEX_DIR = Path('public/models/lc300-raw/TEX').resolve()

bpy.ops.wm.open_mainfile(filepath=BLEND)

missing_expected = []
missing_unexpected = []
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
        key = os.path.basename(img.filepath) or img.name
        if key in EXPECTED_MISSING:
            missing_expected.append((img.name, img.filepath))
        else:
            missing_unexpected.append((img.name, img.filepath))

print(f'OK: {ok}  RELINKED: {len(relinked)}  MISSING (expected): {len(missing_expected)}  MISSING (unexpected): {len(missing_unexpected)}')
for name, path in relinked:
    print(f'  RELINKED {name} -> {path}')
for name, path in missing_expected:
    print(f'  MISSING (expected)  {name}  was {path}')
for name, path in missing_unexpected:
    print(f'  MISSING (unexpected)  {name}  was {path}')

# Save back to a working copy so subsequent tasks don't need to re-link
bpy.ops.wm.save_as_mainfile(filepath='public/models/lc300-raw/lc300-working.blend')
print('saved working copy: public/models/lc300-raw/lc300-working.blend')

if missing_unexpected:
    print(f'FAIL: {len(missing_unexpected)} unexpected missing textures.')
    sys.exit(1)
