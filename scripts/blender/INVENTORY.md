# NLM LC300 Inventory
**Date captured:** 2026-05-26
**Source:** public/models/lc300-raw/Toyota Land Cruiser 300.blend
**Captured by:** scripts/blender/print_inventory.py

## Key Findings

- **Total scene objects:** 28 (1 CAMERA + 27 MESH)
- **Total materials:** 34
- **Total textures (images):** 13 (12 FILE + 1 VIEWER `Render Result`)
- **Confirmed bonnet object name:** `Bonnet` (matches external audit). Position `(+0.00, +5.33, +1.59)`, tris=2,139, size=(2.46 x 1.78 x 0.31).

### Mesh names matching the canonical hotspot list

The plan's canonical names (e.g. `Hood`, `Wheel_FL`, `Door_FL`, `Engine`, `Suspension`, `Battery`, etc.) often **do not match** the actual NLM names. Here is what is actually present:

| Canonical (plan) | Actual in NLM .blend | Notes |
|---|---|---|
| `Hood` / `Bonnet` | `Bonnet` | Confirmed — use `Bonnet`, NOT `Hood` |
| `Door_FL` | `FL_Door` | Prefix order swapped; also `IntFL_Door` (interior panel) |
| `Door_FR` | `FR_Door` | Plus `IntFR_Door` |
| `Door_RL` | `RL_Door` | Plus `IntRL_Door` |
| `Door_RR` | `RR_Door` | Plus `IntRR_Door` |
| `Wheel_FL` | `FL_Wheel` | Prefix order swapped |
| `Wheel_FR` | `FR_Wheel` | |
| `Wheel_RL` | `RL_Wheel` | |
| `Wheel_RR` | `RR_Wheel` | |
| `Engine` | `Engine` | Single mesh, 532,158 tris (heaviest object in scene) |
| `Suspension` | `Suspension` | 80,380 tris, size (2.23 x 4.88 x 0.84) |
| `Headlight*` | `Front lights 1`, `Front lights 2` | Space-separated, NOT `Headlight_L/R`. Tail lights similarly: `Tail lights 1`, `Tail lights 2` |
| `Mirror*` | (not a distinct mesh) | No standalone mirror mesh — likely merged into `Other parts` or `Main body`. Material `Mirror` exists (3 users). |
| `Windshield` | (not a distinct mesh) | Likely merged into `Main body` or `Other parts`. Materials `Glass`, `Glass Dark`, `Glass Light`, `Glass.001` exist. |
| `Grille` | (not a distinct mesh) | Likely merged into `Main body` or `Other parts`. |
| `Battery` | **MISSING** | No mesh found. Engine bay components are merged into the single `Engine` mesh. |
| `Radiator` | **MISSING** | Same — merged into `Engine`. |
| `Air_Filter` | **MISSING** | Same — merged into `Engine`. |
| `Intake` | **MISSING** | Same — merged into `Engine`. |
| `Fuse_Box` | **MISSING** | Same — merged into `Engine`. |
| `Exhaust` | **MISSING** | No mesh found; not visible in the listed names. May be merged into `Other parts` or absent. |
| `Fuel_Tank` | **MISSING** | Same. |
| `Transfer_Case` | **MISSING** | Same. |
| `Diff*` | **MISSING** | No differential meshes; likely merged into `Suspension`. |

### Implications for Tasks 1.3 – 1.8

1. **Use `Bonnet`, not `Hood`** — the external audit was correct.
2. **Wheel/Door hotspot anchors** must reference the `FL_*` / `FR_*` / `RL_*` / `RR_*` prefix convention.
3. **Engine bay sub-components** (Battery, Radiator, Air_Filter, Intake, Fuse_Box) **do not exist as separate meshes**. To anchor those hotspots, Task 1.3 will need to either:
   - Define hotspots by **3D world coordinates** inside the engine bay region (no mesh dependency), OR
   - Split the `Engine` mesh into named sub-objects in Blender before rendering (substantial extra work), OR
   - Repoint those hotspots to lower-resolution "engine bay area" labels and rely on the rendered image to convey detail.
4. **`Windshield`, `Grille`, `Mirror*`, `Exhaust`, `Fuel_Tank`, `Transfer_Case`, `Diff*` are similarly absent as discrete meshes.** Same options as above apply.
5. **Heaviest objects** (for render budget awareness): `Engine` 532k tris, `Dashboard` 466k, `Main body` 361k, `Steeringwheel` 278k, `Seats` 174k, each `*_Wheel` 158k. Total scene tris ≈ 3.55M.
6. **Texture re-linking (Task 1.2):** Many `filepath` entries point to relative paths outside the LC300 folder (e.g. `//..\..\PORSCHE\...`) or to `//TEX\...` (which expects a `TEX/` subfolder next to the .blend, present as `TEX.zip` and needing extraction). Task 1.2 will need to unzip `TEX.zip` and verify those `//TEX\...` references resolve.

## Raw stdout

```
=== INVENTORY ===
Scene objects: 28
CAMERA Camera                                                            pos=(+7.09,+22.42,+1.19)
MESH  Main body                                           tris= 360698  pos=(+0.00,+0.00,+0.00)  size=(2.65,6.56,2.18)
MESH  Other parts                                         tris= 117860  pos=(+0.00,+0.00,+0.00)  size=(2.63,6.49,1.83)
MESH  Car plates                                          tris=   1380  pos=(+0.00,+0.00,+0.00)  size=(0.63,6.42,0.90)
MESH  Dashboard                                           tris= 466010  pos=(+0.00,+0.00,+0.00)  size=(1.95,2.21,1.66)
MESH  Steeringwheel                                       tris= 278432  pos=(-0.57,+4.80,+1.62)  size=(0.54,0.57,0.57)
MESH  Seats                                               tris= 174160  pos=(+0.00,+0.00,+0.00)  size=(1.82,2.32,1.54)
MESH  Bonnet                                              tris=   2139  pos=(+0.00,+5.33,+1.59)  size=(2.46,1.78,0.31)
MESH  Engine                                              tris= 532158  pos=(+0.00,+0.00,+0.00)  size=(2.47,1.78,0.40)
MESH  Support 1                                           tris=   6048  pos=(+0.00,+5.66,+1.37)  size=(2.22,0.32,0.02)
MESH  Support 2                                           tris=   1440  pos=(+0.00,+5.66,+1.37)  size=(2.20,0.32,0.01)
MESH  Suspension                                          tris=  80380  pos=(+0.00,+0.00,+0.00)  size=(2.23,4.88,0.84)
MESH  FL_Wheel                                            tris= 158018  pos=(-1.17,+5.97,+0.39)  size=(0.42,1.06,1.06)
MESH  FR_Wheel                                            tris= 158018  pos=(+1.17,+5.97,+0.39)  size=(0.42,1.06,1.06)
MESH  RL_Wheel                                            tris= 158018  pos=(-1.32,+2.20,+0.39)  size=(0.44,1.06,1.06)
MESH  RR_Wheel                                            tris= 158018  pos=(+1.32,+2.20,+0.39)  size=(0.44,1.06,1.06)
MESH  FL_Door                                             tris=  33421  pos=(-1.27,+5.16,+1.19)  size=(0.67,1.61,1.74)
MESH  IntFL_Door                                          tris= 145674  pos=(+0.00,+0.00,+0.00)  size=(0.31,1.39,1.67)
MESH  IntFR_Door                                          tris= 145674  pos=(+0.00,+0.00,+0.00)  size=(0.31,1.39,1.67)
MESH  FR_Door                                             tris=  33421  pos=(+1.27,+5.16,+1.19)  size=(0.67,1.61,1.74)
MESH  IntRL_Door                                          tris=  90540  pos=(+0.00,+0.00,+0.00)  size=(0.32,1.32,1.66)
MESH  RL_Door                                             tris=  19565  pos=(-1.27,+3.74,+1.12)  size=(0.42,1.41,1.75)
MESH  IntRR_Door                                          tris=  90540  pos=(+0.00,+0.00,+0.00)  size=(0.32,1.32,1.66)
MESH  RR_Door                                             tris=  19565  pos=(+1.27,+3.74,+1.12)  size=(0.42,1.41,1.75)
MESH  Front lights 2                                      tris=   3378  pos=(+0.00,+0.00,+0.00)  size=(2.55,0.59,0.24)
MESH  Front lights 1                                      tris=  23964  pos=(+0.00,+0.00,+0.00)  size=(2.48,0.41,0.19)
MESH  Tail lights 1                                       tris=  81192  pos=(+0.00,+0.00,+0.00)  size=(2.41,0.49,0.27)
MESH  Tail lights 2                                       tris=   9092  pos=(+0.00,+0.00,+0.00)  size=(2.26,0.26,0.07)
=== MATERIALS ===
1  users=2  nodes=True
Black  users=19  nodes=True
Black rough.002  users=1  nodes=True
Carpaint  users=7  nodes=True
Dark metal  users=1  nodes=True
Dark metal.002  users=1  nodes=True
DInterior  users=2  nodes=True
DInterior screen  users=1  nodes=True
Dots Stroke  users=2  nodes=True
Glass Dark  users=3  nodes=True
Glass Light  users=1  nodes=True
Glass  users=6  nodes=True
Glass.001  users=1  nodes=True
Interior  users=2  nodes=True
Leather  users=8  nodes=True
Leather airbag  users=1  nodes=True
Metal  users=17  nodes=True
Metal Gray.001  users=1  nodes=True
Metal.001  users=1  nodes=True
Mirror  users=3  nodes=True
NLM GROUP  users=1  nodes=True
Plastic  users=1  nodes=True
Red Glass  users=1  nodes=True
Rims  users=4  nodes=True
Steering wheel logo.001  users=1  nodes=True
Suspension  users=5  nodes=True
Tail Light  users=1  nodes=True
Tail Light 2  users=1  nodes=True
TailRed  users=2  nodes=True
Tire  users=4  nodes=True
White  users=2  nodes=True
White OP  users=1  nodes=True
WhiteFrontLight  users=1  nodes=True
Wood b/w  users=5  nodes=True
=== IMAGES (textures) ===
1.jpg  source=FILE  filepath=//..\..\PORSCHE\Porsche 911 Targa 4S\TEX\1.jpg
FabricDFS.jpg.001  source=FILE  filepath=//..\..\PORSCHE\Porsche 911 Carrera 4S\MODEL\textures\FabricDFS.jpg
Interior.jpg  source=FILE  filepath=//TEX\Interior.jpg
NLM.png  source=FILE  filepath=//..\..\Base\NLM.png
plastic.jpg  source=FILE  filepath=//TEX\plastic.jpg
refractor.tif  source=FILE  filepath=//TEX\refractor.tif
Render Result  source=VIEWER  filepath=
Steering wheel.jpg.002  source=FILE  filepath=//..\..\PORSCHE\Porsche 911 Targa 4S\TEX\Steering wheel.jpg
SteeringWheelBMP.jpg  source=FILE  filepath=//TEX\SteeringWheelBMP.jpg
SUSPENSION_SUSPENTION_BaseColor.png  source=FILE  filepath=//TEX\SUSPENSION_SUSPENTION_BaseColor.png
Tail Lights.png  source=FILE  filepath=//TEX\Tail Lights.png
TIRE.jpeg.jpg.001.jpg  source=FILE  filepath=//..\..\PORSCHE\Porsche 911 Carrera 4S\MODEL\TIRE.jpeg.jpg.001.jpg
wood.jpg  source=FILE  filepath=//TEX\wood.jpg
```
