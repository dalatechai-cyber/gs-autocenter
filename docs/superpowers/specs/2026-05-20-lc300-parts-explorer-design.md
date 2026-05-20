# LC300 Interactive Parts Explorer — Design Spec
**Date:** 2026-05-20  
**Session:** 11  
**Status:** Approved

---

## Overview

Replace the existing LC200 + LX570 tabbed 3D explorer in the `Загварын судалгаа` section with a Toyota Land Cruiser 300-only cinematic parts explorer. Visitors drag-to-rotate the car, click any named part, and watch it physically float out to center stage while a Mongolian explanation modal appears. All text is in Mongolian Cyrillic. No pricing anywhere.

---

## Step 1 — Blender Model Preparation

### Input files
| File | Size | Purpose |
|------|------|---------|
| `public/models/lc300-raw/Toyota Land Cruiser 300.blend` | 287 MB | Source with animations |
| `public/models/lc300-raw/Toyota Land Cruiser 300.glb` | 130 MB | Raw export (fallback) |
| `public/models/lc300-raw/TEX.zip` | 36 MB | Texture pack |
| `public/models/lc300-raw/v6_car_engine_with_engine_morethem.zip` | 60 MB | V6 engine asset |

### Blender MCP workflow (executed via `execute_blender_code`)

1. **Inspect** — open `.blend`, list all object names and types. Identify which nodes correspond to hood, doors, wheels, engine bay.
2. **Apply textures** — extract `TEX.zip`, link texture files to existing materials via Python.
3. **Import engine** — extract and import V6 engine GLB from zip, position inside engine bay (translate on Y/Z to fit bounding box).
4. **Rename objects** — map existing node names to canonical set:
   - `Hood`, `Door_FL`, `Door_FR`, `Door_RL`, `Door_RR`
   - `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR`
   - `Engine_Block`, `Battery`, `Air_Filter`, `Radiator`
   - `Suspension_FL`, `Suspension_FR`
   - If a canonical name has no matching node, skip it (hotspot won't trigger isolation for that part).
5. **Decimate** — calculate current tri count; apply Decimate modifier targeting ≤ 150 000 triangles total (ratio = 150000 / current_count, capped at 1.0).
6. **Export** — `bpy.ops.export_scene.gltf()` with `export_draco=True`, output: `public/models/lc300-ready.glb`.
7. **Size check** — if > 20 MB: upload to Vercel Blob and record the blob URL. Component uses blob URL. Do NOT commit the file to git if > 20 MB.

---

## Step 2 — React Component Architecture

### Files modified

| File | Action |
|------|--------|
| `src/components/vehicle-explorer/hotspots.ts` | Add `LC300_HOTSPOTS`; keep LC200/LX570 exports |
| `src/components/vehicle-explorer/VehicleExplorer.client.tsx` | Full rewrite — LC300 only, isolation engine |
| `src/components/VehicleExplorer.tsx` | Minor: remove tab-related types |

### Component tree

```
VehicleExplorer (section shell, dynamic import, SSR: false)
  └─ VehicleExplorerClient
       ├─ Canvas (R3F, single GL context)
       │    ├─ Lighting
       │    ├─ LC300Model   ← GLB loader + hover/pick/isolation
       │    ├─ ContactShadows
       │    └─ OrbitControls (disabled during isolation)
       ├─ HudCorner         (top-left label, top-right hover name, bottom hint)
       ├─ HotspotLegend     (pill buttons per part)
       ├─ PartModal         ← NEW centered overlay
       └─ BackButton        ← NEW "Буцах" shown during ISOLATED state
```

### Interaction state machine

```
IDLE
  ──hover──►  HIGHLIGHTED  (emissive tint on hovered mesh group)
  ──click──►  ISOLATING
                spring: mesh floats to [0,0,0], scale → 1.4×
                spring: camera moves to [0, 1, 4]
                tween:  all other meshes opacity → 0.12, transparent = true
                after spring settles (onRest):  state → ISOLATED
              ISOLATED
                useFrame: isolated mesh rotates Y at 0.4 rad/s
                PartModal visible (fade-in, 200ms delay after ISOLATED entered)
                OrbitControls disabled
  ──close──►  RESTORING
                reverse all springs
                originalParent.attach(mesh)  ← restores hierarchy + world transform
                restore material opacity / transparent
                state → IDLE
```

### Mesh detach mechanics (Option A — single canvas)

```ts
// On pick:
const mesh = scene.getObjectByName(canonicalName);
const origParent = mesh.parent;
const origPos = mesh.getWorldPosition(new THREE.Vector3());
const origQuat = mesh.getWorldQuaternion(new THREE.Quaternion());
const origScale = mesh.getWorldScale(new THREE.Vector3());
scene.attach(mesh);  // re-parent to scene root, world transform preserved

// Spring to center via useSpring({ pos: [0,0,0], scale: 1.4 })

// On close:
origParent.attach(mesh);  // restores hierarchy, world transform preserved
```

### Lighting (cinematic dark stage)

| Light | Position | Color | Intensity |
|-------|----------|-------|-----------|
| AmbientLight | — | white | 0.25 |
| HemisphereLight | [0,10,0] | sky #fff / ground #111 | 0.30 |
| SpotLight (key, red) | [0, 8, 0] | #ff3a2a | 3.5 |
| DirectionalLight (fill) | [5, 6, 5] | #ffffff | 1.2 |
| DirectionalLight (rim, blue) | [-5, 3, -3] | #7a8aff | 0.6 |

---

## Step 3 — Mongolian Part Knowledge Base

All text Mongolian Cyrillic. No pricing.

| id | Mongolian name | GS service description |
|----|---------------|----------------------|
| `hood` | Хөдөлгүүр & Капот | Хөдөлгүүрийн оношилгоо, тосны солилт, цагийн бүс солилт. Капот нээгдэж дотор харагдана. |
| `engine` | Хөдөлгүүрийн блок | V6 хөдөлгүүрийн бүрэн оношилгоо, их засвар, цилиндр блокийн засвар. |
| `battery` | Аккумулятор | Батарей солилт, цахилгааны системийн оношилгоо, зэврэлт арилгалт. |
| `air_filter` | Агаарын шүүлтүүр | Шүүлтүүр солилт, агаарын системийн шалгалт, хэрэглэгчийн зөвлөгөө. |
| `radiator` | Радиатор | Хөргөлтийн шингэн солилт, радиатор засвар, системийн угаалт. |
| `door_fl` | Жолоочийн хаалга | Биеийн засвар, дотор резин, эзэмшигчийн зааврын орчуулга. |
| `door_fr` | Урд хажуугийн хаалга | Биеийн засвар, дотор резин, бэхэлгээний засвар. |
| `door_rl` | Арын зүүн хаалга | Биеийн засвар, хаалганы механизм, резиний солилт. |
| `door_rr` | Арын баруун хаалга | Биеийн засвар, хаалганы механизм, резиний солилт. |
| `wheel_fl` | Урд зүүн дугуй | JAPAN TOK түдгэлзүүр, балансжуулалт, тэнхлэгийн тохиргоо. |
| `wheel_fr` | Урд баруун дугуй | JAPAN TOK түдгэлзүүр, балансжуулалт, тэнхлэгийн тохиргоо. |
| `wheel_rl` | Арын зүүн дугуй | Дугуй солилт, балансжуулалт, амортизаторын шалгалт. |
| `wheel_rr` | Арын баруун дугуй | Дугуй солилт, балансжуулалт, амортизаторын шалгалт. |

**CTA on every modal:** `Цаг захиалах` → `tel:+97677200570`

---

## Step 4 — Deployment

1. Build: `npm run build` — must pass with no type errors.
2. Model hosting:
   - ≤ 20 MB: commit `public/models/lc300-ready.glb` to git.
   - > 20 MB: upload to Vercel Blob → set `MODEL_URL` env var → component reads `process.env.NEXT_PUBLIC_LC300_MODEL_URL`.
3. Deploy to `https://gs-autocenter.vercel.app` via Vercel MCP or `vercel --prod`.
4. Verify: LC300 loads, hood opens, part click shows Mongolian modal, "Буцах" restores car. Test on mobile touch (pinch zoom, tap to isolate).

---

## Constraints

- No pricing anywhere on the page.
- Raw model files (`lc300-raw/`) are NOT committed to git.
- `lc300-ready.glb` only committed if ≤ 20 MB.
- All user-facing text in Mongolian Cyrillic.
- CTA phone: `tel:+97677200570`.
