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
