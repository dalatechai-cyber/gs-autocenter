# LC300 Explorer — Strategic Reset
**Date:** 2026-05-26
**Status:** Draft for review (replaces 2026-05-20 spec)
**Scope:** v1 — Approach B (single scene, three curated stages). v2 — scroll-driven cinematic.

---

## 0. Executive Summary

GS Auto Center is a Toyota/Lexus service center in Mongolia. The website needs an interactive 3D Land Cruiser 300 that shows the exterior, opens to reveal a realistic engine bay, and lifts to expose the undercarriage — at a polish level comparable to Polestar's online configurator, on mid-range Android, with no asset budget.

**Five-line plan:**
1. Use the **Lexus LX600** (CC-BY 4.0) as the donor exterior — it sits on the **same J300/TNGA-F platform** as the LC300. Re-skin the grille and badges to LC300 in Blender. This is the highest-fidelity, license-clean path that exists today.
2. Build the **engine bay** by compositing the Lexus IS250 under-the-hood scan (CC-BY) with a free V6 engine block, lit by a Polyhaven CC0 garage HDRI.
3. Build the **undercarriage** as a **stylized service-brochure cutaway** — not photoreal — using the Chevy Impala undercarriage scan + a double-wishbone + 4-link suspension assembly. This is more on-brand for a service center than photoreal and is the only achievable path with free assets.
4. Render with **Three.js `WebGPURenderer` (r171+) and automatic WebGL2 fallback** in **R3F 9 + drei + postprocessing**. Single code path. ~55–75% of Mongolian mobile users get WebGPU, the rest get WebGL2.
5. **Quality is not a budget question — it is a recipe question.** Every prior failure (chrome reads grey, paint flat, glass no refraction, context loss, plasticky materials) has a named root cause and a known fix, documented in §6 below.

**Competitive context:** Toyota's own LC300 configurator is 2D photos + 360 spin. The premium real-time peers (Polestar, Rivian, McLaren) are real-time WebGL — what we're building. The cloud-streamed peers (Porsche, Audi, BMW EVE, Lucid) cost $3–5/hr per concurrent session — economically impossible. We are aiming at Polestar tier, not Audi-cloud tier, and the gap to Toyota's own public site is in our favour.

---

## 1. Why prior attempts failed — named root causes

| Symptom | Root cause | Fix |
|---|---|---|
| Compressing 130MB → smaller destroyed quality | KTX2 ETC1S applied to normal/ORM maps; ETC1S block-artifacts directional data | **UASTC for normals + ORM; ETC1S only for albedo + emissive.** Per-slot mode, not blanket. |
| Chrome reads as grey | HDRI has no bright softbox shapes — chrome reflects what's around it, and there was nothing to reflect | **Use studio HDRIs with visible softboxes OR build a studio with drei `<Lightformer>` rectangles inside `<Environment>`.** Chrome quality = HDRI contrast. |
| Paint has no depth | `envMapIntensity: 1.0` (default, too low), no `clearcoat`, `metalness: 0` on paint | **`envMapIntensity: 1.5–2.5` on body specifically; `clearcoat: 1.0`, `clearcoatRoughness: 0.03`; `metalness: 0.9` even on non-metallic paint** (the metallic-flake approximation). |
| Glass has no refraction | `transmission: 0.5` without env map; or `MeshTransmissionMaterial` everywhere → fps collapse | **One `MeshTransmissionMaterial` on the hero windshield (samples=10, resolution=512); `MeshPhysicalMaterial transmission=1` everywhere else.** Each MTM = +8–14ms/frame on SD7G1. |
| WebGL context loss when pushing quality | Chrome Android kills tabs at 1.5–2 GB texture VRAM | **Hard budget: ≤ 250 MB texture residency, all KTX2.** One uncompressed 4K texture = 64–85 MB → 5 of them = OOM. |
| Engine bay attempts looked unrealistic | Disjointed assets glued together; no HDRI to ground them | **Use a real photogrammetry bay scan (Lexus IS250 / BMW E36 — both CC-BY) as the "stage" + drop a V6 block in. Let a garage HDRI do the lighting.** |
| Performance lags even with optimized files | Too many materials (one per part), draw calls > 200, no instancing | **Merge by material, instance wheels/bolts, target <100 draw calls.** |
| Undercarriage view does not exist | No free LC300 undercarriage exists; trying to photoreal it from scratch is months of work | **Stylized blueprint/X-ray cutaway. It's MORE on-brand for a service center and is achievable with free assets.** |

---

## 2. The Strategic Stack

```
Browser
  ├─ Next.js 16 (existing) + React 19
  ├─ R3F 9.6.x  → <Canvas>
  ├─ Three.js r171  (three/webgpu entry)
  │    ├─ WebGPURenderer  (auto-detect)
  │    └─ WebGL2 fallback  (built-in)
  ├─ drei latest  (Environment, Lightformer, ContactShadows, BakeShadows,
  │                MeshTransmissionMaterial, PerformanceMonitor, useGLTF)
  ├─ @react-three/postprocessing 3.x  (Bloom, N8AO/SMAA, ToneMapping, Vignette)
  └─ Optional: leva for in-dev material tuning

Asset pipeline (build-time only)
  Blender 4.2+  →  gltf-transform optimize  →  ktx2 (toktx UASTC + ETC1S per slot)
                                              →  meshopt geometry compression
                                              →  ~10MB GLB output

Hosting
  ≤ 20 MB GLB → public/models/  (git)
  > 20 MB     → Vercel Blob with NEXT_PUBLIC_LC300_MODEL_URL
```

**Why this stack:**
- **WebGPURenderer with WebGL2 fallback** = single code path covering Mongolia's full phone mix.
- **drei `<Environment>` + `<Lightformer>`** = build a Polestar-grade studio without buying HDRIs.
- **meshopt over Draco** = ~10× faster decode on mid-range Android (Draco's WASM blocks the main thread).
- **R3F over vanilla** = keep the rest of the GS site (React 19) as it is; component model is right for hotspot UX.

---

## 3. Asset Plan — what to download, what to build, what to skip

### 3.1 Confirmed free (CC-BY or CC0) — download these

| Asset | URL | License | Use |
|---|---|---|---|
| Lexus LX600 (KINGSLEY_king) | https://sketchfab.com/3d-models/lexus-lx-600-3780684a306b4549af6a258036d7ab27 | CC-BY 4.0 | **Exterior donor** — same J300/TNGA-F platform as LC300. |
| Lexus IS250 under the hood | https://sketchfab.com/3d-models/lexus-is250-under-the-hood-5e6553cd60c64358b31d7f7a1ff70807 | CC-BY 4.0 | **Engine bay shell** — real Toyota V6 (2GR-FSE) firewall + intake. |
| V6 engine (fasteng) | https://sketchfab.com/3d-models/v6-engine-881cbe41ff1344789e3529943d330cc2 | CC-BY 4.0 | V6 block, drop into bay, retexture with Toyota intake covers. |
| Chevy Impala Undercarriage | https://sketchfab.com/3d-models/chevy-impala-undercarriage-9052ee152fc24d24a686ba3816ac0607 | CC-BY 4.0 | **Undercarriage base** — already retopologized to quads, 199k tris. |
| Double Wishbone + Live Axle | https://sketchfab.com/3d-models/double-wishbone-and-live-axle-suspension-5cf0120b9bca4fd6a20c9357f7e5efaf | CC-BY 4.0 | Front suspension corners, mirror L↔R. |
| 4-Link Suspension (Jorma Rysky) | https://sketchfab.com/3d-models/4-link-suspension-944ae9888c8e4ca89bc7692162acace2 | CC-BY 4.0 | Rear live-axle assembly. |
| Polyhaven `autoshop_01` HDRI | https://polyhaven.com/a/autoshop_01 | CC0 | Engine bay lighting. |
| Polyhaven `studio_small_09` HDRI | https://polyhaven.com/hdris/studio | CC0 | Exterior hero lighting. |
| Polyhaven `garage` HDRI | https://polyhaven.com/a/garage | CC0 | Alternative warm bay lighting. |

### 3.2 Unverified (must browser-check license badge before downloading)

These are potentially higher-fidelity than the picks above. **Open each in a browser and screenshot the license badge before downloading.** If any of them is CC-BY, redo the asset plan around them — particularly the CAD-LAB Tundra, which would give us the same V35A-FTS twin-turbo V6 that's in the LC300.

| Asset | URL | Why it matters |
|---|---|---|
| CAD-LAB Toyota Tundra 2022 scan (parts 1 & 2) | https://sketchfab.com/3d-models/toyota-tundra-2022-3d-scan-data-1-of-2-9f125f910f2e4ee390323232aa8fbd04 | Same TNGA-F frame family + same engine as LC300. If CC-BY, redo plan around it. |
| 2023 Lexus GX 550 Overtrail (Outlaw_Games) | https://sketchfab.com/3d-models/2023-lexus-gx-550-h-overtrail-02f8ce411fc844299c2873c71f51411f | GX 550 = same TNGA-F frame as LC300. Even closer than LX600. |
| TOYOTA Hilux frame scan (pomiarylaserowe) | https://sketchfab.com/3d-models/toyota-hilux-frame-scan-fdb7a026cdce4246aaff2eb47cc92fb3 | Real Toyota body-on-frame ladder. If CC-BY, use as actual undercarriage frame. |
| StellarSeeker LC J200 2016 | https://sketchfab.com/3d-models/free-link-2016-toyota-land-cruiser-j200-37e14b2889e241b2b744c7786b2d5f1d | LC200 donor, 1.5M tris. |

### 3.3 Hard-disqualified — DO NOT use

| Asset | Reason |
|---|---|
| 2022 LC300 VX.R (Ddiaz Design) | CC BY-NC-SA — non-commercial. Also based on Racing Master game extract — second IP layer. |
| Any Sketchfab model tagged "Forza", "Asphalt", "Racing Master", "Car Simulator Vietnam" | Extracted game assets — game-publisher IP overrides Sketchfab license. |
| 2026 Hilux scraped from Toyota's configurator | Toyota's IP claim survives the CC-BY label. |
| Mk6 GTI engine bay, J35 Honda Pilot bay, LC100 enginebay (TomTLC) | All CC BY-NC. |

### 3.4 Build, don't download

- **LC300 grille + headlight + tail-light + badge geometry** — model these in Blender to overlay onto the LX600 body. The LC300 grille is the only thing that visually distinguishes it from the LX600. ~2 hours of Blender work for someone competent.
- **Brake disc heat-tint texture** — bake a radial gradient in Substance Painter or directly in Blender's image editor.
- **Carbon fiber weave, leather grain, tire micro-normal** — already in Polyhaven Textures (CC0).

### 3.5 Skip

- Photoreal undercarriage geometry — not achievable with free assets; use stylized cutaway.
- Animated engine internals (pistons moving, fuel injection) — out of scope for v1.
- Interior cabin detail — only what's visible through the windshield from the exterior camera.

---

## 4. The Three Stages — architectural design

```
Single <Canvas> (one WebGL/WebGPU context, never released)
  │
  ├─ Stage state: "exterior" | "engine" | "underneath"
  │   driven by three buttons in the HUD:
  │     [Гадна тал]   [Хөдөлгүүр]   [Доод тал]
  │
  ├─ <Suspense fallback={<Loader/>}>
  │     <LC300Scene>
  │       ├─ <group name="Body">    visible in exterior + engine
  │       ├─ <group name="Hood">    animates open in engine stage
  │       ├─ <group name="EngineBay"> visible only in engine stage (mounted on-demand)
  │       ├─ <group name="Underbody"> visible only in underneath stage (mounted on-demand)
  │       ├─ <Wheels instances={4} />
  │       └─ <Hotspots stage={stage} />
  │
  ├─ <Environment files=".../studio_small_09_1k_ktx2"
  │      resolution={256}
  │      blur={stage==="underneath" ? 0.5 : 0}>
  │      <Lightformer ...studio rig (see §6.7) />
  │   </Environment>
  │
  ├─ <ContactShadows frames={1} />  // baked once after settle
  ├─ <BakeShadows />                 // freezes shadowMap.autoUpdate
  │
  ├─ <EffectComposer>
  │     <N8AO intensity={1.8} />
  │     <Bloom luminanceThreshold={1.0} mipmapBlur intensity={0.5} />
  │     <Vignette darkness={0.35} />
  │     <ToneMapping mode={NeutralToneMapping} />
  │   </EffectComposer>
  │
  └─ <PerformanceMonitor onDecline={degrade} onIncline={restore}>
        // tracks fps and steps DPR, post chain, env resolution down/up

Camera choreography (per stage, useSpring transitions, ~2s)
  exterior:   pos [4.2, 1.6, 6.4]  target [0, 0.7, 0]  orbit enabled (azimuth ±30°)
  engine:     pos [0,   3.2, 3.0]  target [0, 1.2, -0.5] orbit disabled, slight Y rotate
  underneath: pos [0,   0.4, 5.0]  target [0, 0.0, 0]    look-up at chassis
                                                          (camera "lifts" the car)
```

**Transition example: exterior → engine**
1. User clicks `[Хөдөлгүүр]`
2. State → `"transitioning_to_engine"`
3. Mount `<EngineBay/>` Suspense-lazy (drei `useGLTF` async)
4. `useSpring` camera position from `[4.2, 1.6, 6.4]` to `[0, 3.2, 3.0]` over 1800ms, easeInOutCubic
5. In parallel: `<Hood>` rotates from 0° to -65° around its hinge (Blender hinge object), animated by useSpring
6. At spring rest: hide `<Underbody/>` if it had been mounted, freeze shadows again
7. State → `"engine"`, hotspots for engine stage fade in (200ms delay)

**Why this is safe on mid-range Android:**
- `EngineBay` and `Underbody` are **lazy-mounted** — they only exist in the scene when their stage is active. Memory peak is ~exterior + bay, never all three at once.
- The hood opening is a single rotation animation on one node, not an additional render pass.
- All shadows baked; no real-time shadow maps.

---

## 5. Mobile Performance Budget — hard numbers (Snapdragon 7 Gen 1 / 30 fps)

| Resource | Budget | Why |
|---|---|---|
| Total scene triangles (visible) | ≤ 400k | Practitioner consensus on this hardware class. |
| Draw calls | < 100 | Above 200, mobile GPU drivers stall. |
| Texture VRAM | ≤ 250 MB | Chrome Android kills tab at ~1.5–2 GB; budget for headroom. |
| First-paint payload (GLB + HDRI) | < 15 MB | 4G in Ulaanbaatar serves this in ~6–10s. |
| Per-stage lazy GLB | < 5 MB | Engine bay and underbody each. |
| Realtime shadow lights | 0 | All shadows baked via Lightformers + ContactShadows. |
| Optional realtime spot | 1 | Showroom highlight only; 512² shadow map if used. |
| MeshTransmissionMaterial instances | ≤ 1 | Hero windshield only; `samples=10, resolution=512`. |
| DPR cap | 1.5 | High-DPI phones don't need 2× for car-paint specular. |
| Post chain | 4 effects max | N8AO + Bloom + Vignette + ToneMapping. |
| Fragment shader precision | `mediump` | ~2× faster than highp on Adreno/Mali, no visible difference. |

**Adaptive degradation ladder (triggered by `<PerformanceMonitor>`):**
```
fps >= 28:  full quality
fps 22–28:  drop DPR to 1.0
fps 18–22:  + disable Bloom
fps 14–18:  + drop env resolution to 128, freeze shadows
fps < 14:   + drop to MeshStandardMaterial on body (no clearcoat)
```

---

## 6. Material & Lighting Recipes — the answers to "plasticky"

### 6.1 Car paint (the LC300's white pearl)

```ts
const paint = new THREE.MeshPhysicalMaterial({
  color: '#f5f5f5',
  metalness: 0.85,                  // metallic flakes approximation
  roughness: 0.50,                  // base coat is rough under lacquer
  clearcoat: 1.0,                   // full clear lacquer
  clearcoatRoughness: 0.04,
  clearcoatNormalMap: flakesTexture,
  clearcoatNormalScale: new THREE.Vector2(0.25, 0.25),
  iridescence: 0.25,                // pearl shift
  iridescenceIOR: 1.3,
  iridescenceThicknessRange: [200, 600],
  envMapIntensity: 1.8,             // THIS is the difference between "render" and "plastic"
});
```

For each official LC300 paint code (super white, attitude black mica, sand mica, dark blue mica, silver metallic, red mica) ship a swatch with these values changing only `color`, `iridescence` (0.0 for solid, 0.3 for mica), and `metalness` (0.6 for solid, 0.85 for metallic, 0.95 for chromatic).

### 6.2 Chrome (grille slats, badge, trim)

```ts
const chrome = new THREE.MeshPhysicalMaterial({
  color: '#ffffff',                 // chrome has no color
  metalness: 1.0,
  roughness: 0.02,                  // NOT 0 — 0 specular-aliases
  envMapIntensity: 1.8,
});
```

The reason chrome reads as grey in prior attempts was the env map. Fix in §6.7.

### 6.3 Glass (windshield)

```tsx
<MeshTransmissionMaterial
  transmission={1}
  thickness={0.4}
  ior={1.52}                        // automotive laminated glass
  chromaticAberration={0.02}
  anisotropicBlur={0.0}
  roughness={0.0}
  samples={10}
  resolution={512}                  // half-res buffer, mobile-safe
  backside                          // double cost but kills "flat windshield"
  backsideThickness={0.2}
  attenuationColor="#a8c8e8"        // faint blue tint
  attenuationDistance={3.0}
/>
```

**For side windows (more than one transmissive surface), use cheaper fallback:**
```ts
new THREE.MeshPhysicalMaterial({
  transmission: 1, opacity: 1, transparent: true,
  ior: 1.5, roughness: 0.05, thickness: 0.3,
  attenuationColor: '#1a1a1a', attenuationDistance: 0.5,  // tinted
})
```

### 6.4 Tire rubber (matte, anisotropic)

```ts
const tire = new THREE.MeshPhysicalMaterial({
  color: '#0a0a0a',
  metalness: 0.0,
  roughness: 0.85,
  anisotropy: 0.3,
  normalMap: rubberMicroNormal,    // Polyhaven free
  normalScale: new THREE.Vector2(0.4, 0.4),
  envMapIntensity: 0.4,             // tires barely reflect
});
```

### 6.5 Black plastic trim (NOT same as tire)

```ts
const plastic = new THREE.MeshPhysicalMaterial({
  color: '#1a1a1a',
  metalness: 0.0,
  roughness: 0.5,
  clearcoat: 0,                     // no clearcoat = not paint = not plastic-y
  envMapIntensity: 0.7,
});
```

### 6.6 Headlight LEDs with selective bloom

```ts
const led = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  emissive: new THREE.Color('#fffaee'),
  emissiveIntensity: 4.0,            // > 1.0 to pass bloom threshold
  toneMapped: false,                 // critical — without this, ACES crushes back below threshold
});
```

Paired with bloom:
```tsx
<Bloom luminanceThreshold={1.0} mipmapBlur intensity={0.5} />
```

### 6.7 Lighting rig — the "build a studio in code" trick

This is the single most important visual investment in the project. Replaces buying a $200 HDRI.

```tsx
<Environment resolution={512} frames={1} environmentIntensity={1.0}>
  {/* Key softbox — long, overhead, runs length of car */}
  <Lightformer form="rect" intensity={5} position={[0, 5, -3]}
    rotation-x={Math.PI / 2} scale={[12, 2.5, 1]} color="white" />
  {/* Fill softbox — front-quarter, warm */}
  <Lightformer form="rect" intensity={3} position={[4, 2, 4]}
    rotation-y={-Math.PI / 4} scale={[3, 3, 1]} color="#ffeeee" />
  {/* Rim — opposite side, cool blue */}
  <Lightformer form="rect" intensity={4} position={[-4, 1.8, -2]}
    rotation-y={Math.PI / 2} scale={[3, 4, 1]} color="#aaccff" />
  {/* Ground reflection — wide, low intensity */}
  <Lightformer form="rect" intensity={0.6} position={[0, -1, 0]}
    rotation-x={-Math.PI / 2} scale={[20, 20, 1]} color="#404040" />
  {/* Top accent — small bright bar over hood (creates the highlight ribbon) */}
  <Lightformer form="rect" intensity={6} position={[0, 4, 1.5]}
    rotation-x={Math.PI / 2} scale={[8, 0.4, 1]} color="white" />
</Environment>
```

`frames={1}` means it bakes the env map **once** at scene start and never re-renders the cube camera. Cost is ~30–80ms at load, **zero per-frame**.

For the engine bay stage, swap to a Polyhaven `autoshop_01` HDRI loaded as KTX2:
```tsx
<Environment files="/hdr/autoshop_01_1k.ktx2" resolution={256} blur={0.05} />
```

For the underneath stage, dim the env and rely on a single low directional light to read "service lift workshop":
```tsx
<Environment files="/hdr/garage_1k.ktx2" resolution={256} environmentIntensity={0.4} />
<directionalLight position={[0, 8, 0]} intensity={0.6} color="#ffeed0" />
```

### 6.8 Tone mapping

**Use `THREE.NeutralToneMapping` (Khronos PBR Neutral), not ACES.** ACES crushes oranges and reds — bad if the LC300 is shipped in red mica. Neutral is the configurator-accurate choice.

```ts
gl.toneMapping = THREE.NeutralToneMapping;
gl.toneMappingExposure = 1.0;        // tune to 0.85–1.15 per stage
gl.outputColorSpace = THREE.SRGBColorSpace;
```

### 6.9 Texture color spaces (failure mode #6 from research)

| Texture | Color space |
|---|---|
| `map` (baseColor / albedo) | `SRGBColorSpace` |
| `emissiveMap` | `SRGBColorSpace` |
| `normalMap` | `NoColorSpace` (linear) |
| `roughnessMap`, `metalnessMap`, `aoMap` | `NoColorSpace` |
| `clearcoatRoughnessMap` | `NoColorSpace` |
| `iridescenceMap` | `NoColorSpace` |

Misassigning is the #1 cause of "burnt-in roughness." Verify after every `useGLTF`.

---

## 7. Asset Pipeline — Blender + gltf-transform terminal commands

### 7.1 Per-asset Blender prep (one Python file per donor model)

For each donor (LX600, IS250 bay, V6 engine, undercarriage, suspensions), the Blender script must:

1. Clear the default scene.
2. Import the donor model.
3. Print inventory (object names, tris, world positions).
4. Rename to canonical names (so R3F can `scene.getObjectByName('Hood')`).
5. Apply Decimate modifier to hit per-part triangle budget (see table below).
6. Ensure every mesh has a Principled BSDF material with the right color space.
7. Bake AO into a second UV channel (Blender's "Bake to Active" with Ambient Occlusion). This is free per-frame at runtime and the single biggest perceived-quality win for free.
8. Export with `bpy.ops.export_scene.gltf(...)` to GLB.

**Per-part triangle budget** (input to Decimate modifier):

| Part | Budget |
|---|---|
| Exterior body shell | 180,000 |
| Wheels (one, instanced ×4) | 20,000 |
| Engine bay shell | 80,000 |
| V6 block + accessories | 60,000 |
| Hood (closed + opened position) | 20,000 |
| Side mirrors, door handles, trim (combined) | 30,000 |
| Underbody base (Impala donor) | 60,000 |
| Suspensions (2× front + 1× rear) | 80,000 |
| Interior visible through glass | 40,000 |

Total: ~568k input → decimate further to fit 400k visible total.

### 7.2 gltf-transform pipeline (after Blender export)

```bash
# Step 1 — full optimize with meshopt geometry and Webp textures
npx @gltf-transform/cli optimize lc300-raw.glb lc300-step1.glb \
  --compress meshopt \
  --simplify false \
  --instance true \
  --weld --prune --dedup \
  --texture-size 2048

# Step 2 — convert normal + ORM to KTX2 UASTC (preserves detail)
npx @gltf-transform/cli uastc lc300-step1.glb lc300-step2.glb \
  --slots "normalTexture,occlusionTexture,metallicRoughnessTexture,clearcoatNormalTexture" \
  --level 4 --rdo 0.25 --zstd 22

# Step 3 — convert baseColor + emissive to KTX2 ETC1S (smaller, color-only)
npx @gltf-transform/cli etc1s lc300-step2.glb lc300-final.glb \
  --slots "baseColorTexture,emissiveTexture" \
  --quality 255 --zstd 22

# Step 4 — verify
npx @gltf-transform/cli inspect lc300-final.glb
```

Target final size: **6–10 MB** for the exterior GLB, **3–5 MB** each for bay and underbody GLBs.

### 7.3 HDRI to KTX2 (FastHDR-style)

```bash
# Convert Polyhaven HDR → KTX2 (UASTC HDR)
toktx --t2 --encode uastc --uastc_quality 4 \
      --assign_oetf linear --assign_primaries bt709 \
      --convert_oetf linear --genmipmap \
      studio_small_09_1k.ktx2 studio_small_09_1k.hdr
```

Output: ~300–500 KB for a 1K HDR. Load in R3F:
```tsx
<Environment files="/hdr/studio_small_09_1k.ktx2" resolution={256} />
```

---

## 8. R3F Implementation Plan

### 8.1 File structure

```
src/components/vehicle-explorer/
  index.ts                          // public export
  LC300Explorer.tsx                 // top-level (Suspense, Canvas, HUD)
  scene/
    Stage.tsx                       // <Canvas> + lighting rig per stage
    LC300Body.tsx                   // body + wheels + glass
    HoodPivot.tsx                   // hood with rotation animation
    EngineBay.tsx                   // lazy-loaded, mounted in engine stage
    Underbody.tsx                   // lazy-loaded, mounted in underneath stage
    Lighting.tsx                    // <Environment> + <Lightformer> rig per stage
    Hotspots.tsx                    // 3D-positioned interactive markers
    Camera.tsx                      // useSpring-driven camera transitions
    Performance.tsx                 // PerformanceMonitor + adaptive ladder
  ui/
    StageButtons.tsx                // [Гадна тал][Хөдөлгүүр][Доод тал]
    HotspotModal.tsx                // Mongolian copy modal (existing pattern)
    BackButton.tsx                  // returns to exterior view from any stage
    Loader.tsx                      // Suspense fallback w/ progress
  data/
    hotspots.ts                     // hotspot data per stage + Mongolian copy
    materials.ts                    // shared material constants (paint colors etc.)
    paths.ts                        // GLB and KTX2 URLs (env-aware)
  hooks/
    useStage.ts                     // useState wrapper + transition helper
    useGLTFKtx2.ts                  // useGLTF with KTX2Loader pre-registered
    usePerfBudget.ts                // current perf tier (full|reduced|minimal)
```

### 8.2 State machine

```
                  ┌─ click → enter "Хөдөлгүүр" ─┐
exterior ─────────┤                              ├──── engine
                  └─ click → enter "Доод тал" ──┘
                                                 └──── underneath

Each transition: ~1.8s spring (camera) + parallel hood/lift animation.
Hotspots fade in 200ms after camera spring settles.
"Буцах" button always returns to exterior.
```

### 8.3 Hotspot model (Mongolian-Cyrillic copy)

Existing spec already has hotspot data. Extend with per-stage entries:

**Stage: exterior** — hood, headlights, side mirrors, wheels, badges
**Stage: engine** — engine block, battery, air filter, radiator, intake, fuse box
**Stage: underneath** — front suspension, rear suspension, exhaust, fuel tank, transfer case, differentials

Each hotspot: `{ id, stage, position: [x,y,z], titleMn, descriptionMn, ctaPhone: '+97677200570' }`

### 8.4 Adaptive degradation hook

```tsx
function usePerfBudget() {
  const [tier, setTier] = useState<'full' | 'reduced' | 'minimal'>('full');
  return { tier, setTier };
}

// In Stage.tsx:
<PerformanceMonitor
  onDecline={() => setTier((t) => t === 'full' ? 'reduced' : 'minimal')}
  onIncline={() => setTier((t) => t === 'minimal' ? 'reduced' : 'full')}
  flipflops={3}
/>

// Per-tier:
//   full:    DPR 1.5, env 512, all effects, MeshPhysicalMaterial
//   reduced: DPR 1.0, env 256, no bloom, MeshPhysicalMaterial
//   minimal: DPR 1.0, env 128, no post, MeshStandardMaterial fallback on body
```

### 8.5 Context-loss handler

```tsx
<Canvas
  onCreated={({ gl }) => {
    gl.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('[LC300] WebGL context lost — preparing recovery');
    });
    gl.domElement.addEventListener('webglcontextrestored', () => {
      console.info('[LC300] WebGL context restored');
      // Three.js auto re-uploads geometries; we re-trigger env baking
      forceRemount();
    });
  }}
/>
```

---

## 9. v1 Scope vs v2

### v1 (this spec) — Approach B
- Three buttons trigger three curated camera moves + stage swaps.
- Free orbit within each stage (constrained azimuth on exterior, locked on engine/underneath).
- All hotspot interactions and modals.
- Mongolian copy, no pricing.
- Mobile-first, adaptive degradation.
- Single canvas, never destroyed.

### v2 — Approach C scroll-driven addition
- GSAP ScrollTrigger + Lenis smooth scroll.
- Replace stage buttons with scroll-position-driven camera.
- Add "narrative chapters" with overlaid text.
- Mobile detection: keep button-based UX on phones, scroll-driven on desktop tablets+.
- Estimated effort: 2 weeks on top of v1.

---

## 10. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Lexus LX600 license badge actually says NC | Low | High (redo asset plan) | **Manually verify in browser before download.** Fallback: LC200 (anassbee, CC-BY confirmed). |
| Engine bay re-texture looks fake on close zoom | Medium | Medium | Limit zoom-in distance in engine stage; keep hero hotspot popups from forcing extreme close inspection. |
| Mid-range Android still drops below 24 fps | Medium | High | Adaptive degradation ladder; "minimal" tier with MeshStandardMaterial is the floor. |
| WebGL context loss on long sessions | Medium | Medium | Hard texture budget 250 MB; context loss handler; force-remount on restore. |
| Audience finds the undercarriage cutaway "fake" | Low | Low | Lean into it — label it as "Үйлчилгээний диаграм" (service diagram), make it explicitly schematic. |
| The "30s blank screen on first load" problem | Medium | High | Skeleton GLB (a placeholder 200KB body silhouette) shown immediately while full GLB streams. |
| First-frame stutter from PMREM bake | High | Low | Run PMREM during the loader (before Canvas reveal), not on first frame. |

---

## 11. Ready-to-execute prompts

### Prompt A — Blender prep (one for each asset)

**Run inside Claude with Blender MCP. Replace `{{ASSET}}` per donor.**

```
You are preparing a 3D donor asset for the GS Auto Center LC300 Explorer. The
asset is {{ASSET_NAME}} from {{ASSET_URL}}, license {{ASSET_LICENSE}}.

The output GLB will be loaded by React Three Fiber on mid-range Android. It
must meet these constraints:
- Triangle budget for THIS asset: {{TRI_BUDGET}}
- Single GLB output: public/models/lc300-ready/{{OUTPUT_NAME}}.glb
- Renamed objects matching the canonical set in src/components/vehicle-explorer/data/hotspots.ts
- Principled BSDF materials only; baseColor sRGB, normal/ORM linear
- Baked AO in a second UV channel
- Draco/meshopt NOT applied at Blender export — that happens in the gltf-transform step

Tasks, in order:
1. Open Blender (via mcp__blender__execute_blender_code). Clear default scene.
2. Import the donor file from public/models/lc300-raw/{{DONOR_FILE}}.
3. Print full inventory: every mesh's name, triangle count, world position,
   bounding box size.
4. Identify the meshes that map to canonical names: {{CANONICAL_LIST}}.
   For each, rename in Blender. For unmatched canonical names, log "skipped".
5. Apply Decimate modifier per canonical part with ratio = {{TRI_BUDGET}} /
   current_count, capped at 1.0. Skip if already under budget.
6. Bake AO to second UV channel:
     - For each mesh: select; UV smart project to UV2; bake type=AO, samples=64;
       save bake as PNG in textures/baked_ao/.
     - In each material, add AO texture node multiplying baseColor.
7. Ensure every material is Principled BSDF. If not, convert.
8. Export to public/models/lc300-ready/{{OUTPUT_NAME}}.glb with options:
     export_format='GLB', export_image_format='AUTO',
     export_materials='EXPORT', export_apply=True,
     export_extras=False, use_selection=False,
     export_draco_mesh_compression_enable=False  // gltf-transform handles this
9. Report final triangle count and file size.

Do not commit raw donor files to git. Only the -ready GLB.
```

### Prompt B — gltf-transform optimization

**Run as a Bash skill from the worktree root.**

```
You are running the gltf-transform optimization pipeline on the LC300 asset
set. For each of these inputs:
  - public/models/lc300-ready/body.glb
  - public/models/lc300-ready/bay.glb
  - public/models/lc300-ready/underbody.glb

Run the three-step pipeline:
1. optimize (meshopt compression, weld, prune, dedup, instance)
2. uastc on normal/ORM/clearcoat slots
3. etc1s on baseColor + emissive slots

Verify the output with `gltf-transform inspect`. Report final file size and
triangle count for each.

If any output exceeds:
  body.glb     → 10 MB
  bay.glb      →  5 MB
  underbody.glb →  5 MB
... reduce texture-size to 1024 and re-run that asset's pipeline.

After success, also convert these HDRIs to KTX2 with toktx:
  - public/hdr/studio_small_09_1k.hdr → studio_small_09_1k.ktx2
  - public/hdr/autoshop_01_1k.hdr → autoshop_01_1k.ktx2
  - public/hdr/garage_1k.hdr → garage_1k.ktx2

Final HDRIs should be 300–500 KB each.

Report total payload (body GLB + first HDRI) — must be under 15 MB.
```

### Prompt C — R3F implementation

**Run in a fresh implementation session after this spec is approved.**

```
You are implementing the LC300 Explorer per docs/superpowers/specs/
2026-05-26-lc300-explorer-strategic-reset.md. Approach B (single scene,
three stages).

Stack:
  - three ^0.171 (use three/webgpu entry for WebGPURenderer with WebGL2 fallback)
  - @react-three/fiber ^9.6
  - @react-three/drei latest
  - @react-three/postprocessing ^3.0
  - react ^19

Implement the file structure in §8.1 of the spec.

Critical guardrails:
  1. ONE <Canvas>. Never destroyed.
  2. EngineBay and Underbody are lazy mounted (React.lazy + Suspense).
  3. Camera transitions via useSpring from @react-spring/three; no GSAP in v1.
  4. Materials use the exact recipes in §6 — do not invent new ones.
  5. Tone mapping: THREE.NeutralToneMapping. Not ACES.
  6. envMapIntensity on body paint: 1.8 (NOT default 1.0).
  7. Lighting: build the rig in §6.7 inside <Environment>; do NOT load a
     pre-baked HDRI for the exterior stage (Lightformers are the studio).
  8. The engine and underneath stages load Polyhaven HDRIs as KTX2.
  9. PerformanceMonitor + adaptive degradation per §8.4.
  10. Hotspot data lives in src/components/vehicle-explorer/data/hotspots.ts.
      All copy in Mongolian Cyrillic. No pricing.
  11. CTA: tel:+97677200570 on every modal.
  12. WebGL context loss handler per §8.5.

For each component, write tests using react-three-test-renderer where the
behavior is verifiable. Snapshot tests for the lighting rig are acceptable.

Before declaring done:
  - npm run build passes
  - npm run lint passes
  - Loaded on a real phone (or Chrome DevTools mobile emulation at 4x slowdown,
    Snapdragon 7 Gen 1 throttling profile) the first paint completes in <12s
    and orbit holds 28+ fps.

Commit pattern: one commit per file or per logical unit, conventional commit
prefix `feat(explorer): ...`.
```

### Prompt D — Verification

```
You are verifying the LC300 Explorer build per the strategic reset spec.

Run, in order:
  1. npm run build — must pass with no type errors.
  2. npm run lint — must pass.
  3. Start preview_start on the worktree.
  4. preview_navigate to the LC300 explorer section.
  5. preview_screenshot the exterior stage. Compare to attached reference
     (Polestar configurator screenshot) for paint/chrome/glass quality bar.
  6. preview_click stage button [Хөдөлгүүр]. Wait for transition.
     preview_screenshot the engine bay.
  7. preview_click stage button [Доод тал]. preview_screenshot.
  8. preview_console_logs — must be empty of WebGL warnings or context-loss.
  9. preview_eval `performance.memory.usedJSHeapSize` — must be < 800 MB.
  10. preview_resize to 360×800 (small Android). Re-screenshot all three stages.
      Adaptive degradation should kick in if needed; fps should hold 25+.

If any step fails, diagnose root cause from logs + screenshots, fix in source,
re-verify. Never claim done without screenshots from all three stages.
```

---

## 12. What success looks like

When this ships:
- A visitor on a $300 Mongolian Android opens gs-autocenter.mn, scrolls to the explorer.
- A skeleton LC300 silhouette appears within 2s; the full GLB streams in within 8s.
- They tap [Гадна тал] — the LC300 sits in a clean studio, paint depth visible, chrome reflecting bright softboxes, glass with a faint tint.
- They tap [Хөдөлгүүр] — camera dives over the hood as it opens; engine bay revealed with the V6, hoses, intake; tap a part → Mongolian modal with service info + "Цаг захиалах" → call button.
- They tap [Доод тал] — the car lifts; a stylized cutaway shows suspension, exhaust, frame, like a service-brochure diagram.
- The whole experience holds 28+ fps, no context loss, no jank.

**Visual reference target:** Polestar 2 configurator (https://www.polestar.com). Not Audi (cloud), not Tesla (2D), not Toyota's own (2D + 360 spin). Polestar.

---

## Appendix A — License attribution block (for site footer)

When this ships, include these in the page footer:

> 3D models used under CC-BY 4.0:
> Lexus LX600 — KINGSLEY_king · Lexus IS250 Under the Hood — TheFailedArchitect · V6 Engine — fasteng · Chevy Impala Undercarriage — omegadarling · Double Wishbone & Live Axle Suspension — BlackWΛVΞ · 4-Link Suspension — Jorma Rysky.
> HDRI environments by Poly Haven (CC0).
> LC300 grille and badge geometry by GS Auto Center.

---

## Appendix B — What we explicitly are NOT doing in v1

- Cloud pixel streaming (ZeroLight / Unity Forma / Unreal Pixel Streaming).
- Real-time GI or raytracing.
- SSR (screen-space reflections).
- Animated engine internals.
- Interior cabin walk-through.
- AR / WebXR mode.
- Multi-language (Mongolian only).
- Custom paint color picker.
- VIN-specific configuration.

These are all v2+ candidates if v1 ships and resonates.

---

## Appendix C — Resolved decisions (2026-05-26)

1. **CAD-LAB Tundra license** — **DECIDED:** browser-verify before committing to donor. If CC-BY, the Tundra becomes the exterior donor (same V35A-FTS twin-turbo V6 as LC300). LX600 stays as fallback. License verification is the first task in Phase 1.
2. **Desktop premium quality tier** — **DECIDED:** ship in v1.5 after v1. Adds SSR + 1024 HDRI + accumulative shadows for `(min-width: 1280px)` + `(hover: hover)` detection. Mid-range Android still gets the mobile tier.
3. **Skeleton silhouette GLB** — **DECIDED:** Claude builds it in Blender via MCP as the first asset in Phase 2. Target: 200 KB, ~3k tris, body silhouette only, neutral grey material.
4. **LC300 grille and badges** — **DECIDED:** Claude models them in Blender from reference photos via MCP. Includes the LC300 horizontal-slat grille, headlight cluster shape, "LAND CRUISER" badge, and tail-light signature. This is a hard requirement, not optional — the deliverable is "real LC300", not "LX in disguise."
5. **CTA phone** — **DECIDED:** `+976 77-200-570` (formatted) → `tel:+97677200570` (link). Confirmed current.

---

## GA4 Event Catalog (added 2026-05-27)

The LC300 360° explorer fires 4 GA4 events via `window.gtag('event', name, params)`.
All events are anonymized (`anonymize_ip: true` in the GA4 init at `src/app/layout.tsx`).

### `lc300_first_paint_ms`
**Fires:** Once per session, when the manifest finishes loading.
**Params:**
- `value: number` — milliseconds from component mount to manifest available
**Use:** Measure perceived first-paint performance. Slow values indicate manifest fetch latency or render-blocking work.
**Wired at:** `src/components/lc300-360/LC300Carousel.tsx` (firstPaintAt useEffect)

### `lc300_stage_changed`
**Fires:** When the user clicks a stage tab (Гадна тал / Капот руу / Хөдөлгүүр / Доод тал).
**Params:**
- `from: 'exterior' | 'engine_approach' | 'engine_bay' | 'underneath'` — previous stage
- `to: 'exterior' | 'engine_approach' | 'engine_bay' | 'underneath'` — new stage
**Use:** Funnel analysis (which stages do users actually visit?) + drop-off detection (e.g., users never reach engine_bay).
**Wired at:** `src/components/lc300-360/LC300Carousel.tsx` (StageButtons onChange)

### `lc300_hotspot_opened`
**Fires:** When the user clicks a hotspot button (any of the 28 hotspots).
**Params:**
- `hotspot_id: string` — e.g., `'ext-headlight-l'`, `'eng-block'`, `'und-transfer'`
- `stage: 'exterior' | 'engine_approach' | 'engine_bay' | 'underneath'` — stage the hotspot was visible in
**Use:** Engagement analysis — which services drive curiosity? Pair with `lc300_cta_clicked` for conversion ratio per hotspot.
**Wired at:** `src/components/lc300-360/LC300Carousel.tsx` (HotspotOverlay onSelect)

### `lc300_cta_clicked`
**Fires:** When the user taps the "Цаг захиалах · +976 77-200-570" CTA in the hotspot modal (tel: link).
**Params:**
- `hotspot_id: string` — the hotspot whose modal was open
- `stage: 'exterior' | 'engine_approach' | 'engine_bay' | 'underneath'` — stage at click time
**Use:** **Primary conversion metric.** Tracks intent to call. Pair with hotspot_opened for per-hotspot conversion rate.
**Wired at:** `src/components/lc300-360/LC300Carousel.tsx` (HotspotModal onCtaClick)

### Suggested GA4 reports / explorations

1. **First-paint distribution:** histogram of `lc300_first_paint_ms.value` by device class. Target P75 < 2000ms on 4G.
2. **Stage funnel:** `lc300_stage_changed` counted by `to` stage → drop-off rate stage-to-stage.
3. **Hotspot heatmap:** `lc300_hotspot_opened` count by `hotspot_id` → ranks which parts users care about most.
4. **CTA conversion:** `lc300_cta_clicked` / `lc300_hotspot_opened` ratio per `hotspot_id` → which services have highest call intent.

### Smoke test (after deploy)

1. Visit the production URL with GA Debugger Chrome extension enabled.
2. Open the LC300 explorer section. Within 5s, verify `lc300_first_paint_ms` appears in GA Realtime → Events.
3. Click each of the 4 stage tabs in order. Verify 3 `lc300_stage_changed` events (no event fires for first load — only on transitions).
4. Click any hotspot. Verify `lc300_hotspot_opened`.
5. Click the Цаг захиалах CTA. Verify `lc300_cta_clicked`. (The phone dialer will also open on mobile.)

## Keyboard Map (LC300 Explorer) (added 2026-05-27)

This section describes every keyboard interaction a customer can use in the LC300 360° explorer, so support staff can answer keyboard accessibility questions without consulting a developer.

**Scope:** keyboard-only (desktop). On touch devices the explorer is driven by tap, swipe, and pinch — there is no keyboard surface to document there. Hotspot modals open on tap; the carousel rotates on horizontal swipe.

> **Actual tab order:** Carousel → Visible hotspots → Stage tabs. Sections below appear in this order. (The Phase 8.1 plan expected tabs first; DOM order in `LC300Carousel.tsx` keeps the visually-first carousel as the first tab stop — intentional, no fix needed.)

### Carousel (the 360° image)
- **Tab** — focus moves to the carousel container (`tabIndex={0}`, `StageCarousel.tsx` line 70), which is the **first** focusable element in the explorer
- **← / →** — rotate one frame (decrease / increase frame index)
- **Shift + ← / →** — rotate ten frames at a time
- **Home** — jump to frame 0 (first frame of the current stage)
- **End** — jump to the last frame of the current stage
- Note: the key handler is attached to `window` (`StageCarousel.tsx` lines 36–48), so arrow keys work regardless of which element currently has focus — not only when the carousel div is focused. Customers do not need to click the carousel first to use arrow keys.

### Hotspots
- **Tab** — visible hotspots receive focus in DOM order after the carousel container
- **Enter / Space** — open the hotspot modal for the focused hotspot
- Hidden (occluded) hotspots are excluded from tab order: they receive `tabIndex={-1}` and `pointerEvents: none` (`HotspotOverlay.tsx` line 29 and line 37). They also have `aria-hidden={true}` which removes them from the accessibility tree entirely when occluded.
- The set of visible hotspots changes as the carousel rotates (each frame has its own projection list), so the number of tabbable hotspots varies by frame.
- **Visible focus indicator** — focused hotspots show the browser's default focus ring around the 28 px button. No custom focus style is set in `HotspotOverlay.tsx`. Customers can tell where their keyboard is by looking for the ring on the red circle.

### Stage tabs (bottom of explorer)
- **Tab** — focus reaches the 4 stage tabs after the carousel and any visible hotspots
- **Enter / Space** — activate the focused tab and switch to that stage
- Note: there is **no arrow-key navigation between tabs** — the tab buttons have no `onKeyDown` handler. This is intentional per Phase 4 simplification. Only Enter/Space and mouse click work.
- Tab order within the tablist: Exterior → Engine Approach → Engine Bay → Underneath (matches `STAGE_ORDER` array in `src/components/lc300-360/data/types.ts`)

### Modal (when a hotspot is open)
- **On open** — focus moves immediately to the **close button** ("Хаах") via `closeBtnRef.current?.focus()` (`HotspotModal.tsx` line 20)
- **Tab order inside modal** — there are two interactive elements: CTA link ("Цаг захиалах · …") first, close button ("Хаах") last. Focus opens on the close button. Pressing **Shift+Tab** steps back to the CTA link. Pressing **Tab** from the close button exits the modal — there is no Tab trap; Esc is the intended way to close.
- **Esc** — closes the modal and returns focus to the hotspot button that triggered it (`returnFocusTo` / `lastTriggerRef.current`, `HotspotModal.tsx` lines 28–29)
- The modal is **not a strict focus trap** — Tab can move focus outside the modal panel. The a11y contract is: Escape to close + automatic focus return to the trigger. `aria-modal="true"` is set on the dialog (`HotspotModal.tsx` line 35) which signals screen readers to treat it as modal, but browser-level Tab trapping is not implemented.
- Clicking the backdrop (outside the modal panel) also closes the modal.

### Reduced motion
- If the user has `prefers-reduced-motion: reduce`, frame transitions snap instead of animate (LQIP fade and loading-bar transition both check this flag, `StageCarousel.tsx` lines 61–62, 97, 121). Arrow keys and all navigation still work normally; only the visual transition changes.
