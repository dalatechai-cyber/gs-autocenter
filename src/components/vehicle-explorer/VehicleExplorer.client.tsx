"use client";

import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  useGLTF,
  useProgress,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

// RectAreaLight needs its precomputed BRDF lookup tables uploaded once. The
// JSM helper hot-path early-returns on subsequent calls, so init at module
// scope is safe even in dev with HMR.
if (typeof window !== "undefined") {
  RectAreaLightUniformsLib.init();
}
import { LC300_HOTSPOTS, findHotspotId, type Hotspot } from "./hotspots";
import { PHONE_HREF, PHONE_DISPLAY } from "@/lib/contact";

/* ─── constants ─────────────────────────────────────────────────── */
// LC300 model: Blender export with the hood mirror+bevel+subdiv modifiers
// baked into "Bonnet_Full" (origin at the rear-bottom hinge so we rotate
// the object directly). Pipeline:
//   strip-nlm → weld → per-mesh simplify (scripts/selective-simplify.mjs)
//   → prune → dedup → texture-compress (webp q85 @ 2048) → draco edgebreaker.
// Per-mesh ratios spend the vert budget on what the camera sees: body /
// bonnet / doors at 0.85, wheels at 0.70, lights at 0.35–0.55, engine at
// 0.45, interior at 0.50, suspension/supports/hidden at 0.15. Result:
// 1.6MB / 274k render-verts — body silhouette close to the un-simplified
// 11.4MB source, file size effectively the same as the flat-ratio v3.
const MODEL_URL =
  process.env.NEXT_PUBLIC_LC300_MODEL_URL ??
  "https://vhrdanvvpxwiaotn.public.blob.vercel-storage.com/models/lc300-opt-v4.glb";
// Draco decoder served from gstatic; the CSP connect-src already allows it.
const DRACO_DECODER_URL = "https://www.gstatic.com/draco/v1/decoders/";
// Polyhaven brown_photostudio_02 — the classic car-render HDRI. Dark studio
// walls + four large bright softbox panels at top/sides. The softbox panels
// project as long bright streaks on the body's clearcoat reflections, which
// is exactly the iconic "premium product shot" highlight signature. The
// earlier studio_small_09 had a uniformly soft envmap without strong bars
// so the white paint read as waxy plastic instead of glossy lacquer.
const HDRI_URL = "/hdri/brown_photostudio_02_2k.hdr";
const GROUND_Y = -1.0;

export type CameraView = "exterior" | "hood" | "interior";

/**
 * Camera presets in Three.js world space.
 * Car FRONT is in -Z direction (Blender +Y → GLTF -Z with export_yup=True).
 * Car length axis: Z. Car width axis: X. Up: Y.
 * Wheel bottoms land at y=GROUND_Y after the LC300Scene adjusts groupY.
 *
 * Hood + interior values below are derived from the source .blend, converted
 * through the same transform the React component applies at runtime:
 *   axis swap → subtract bbox center → multiply by fitScale (4.5 / maxDim)
 *   → add groupY (lands wheels on GROUND_Y).
 *
 * Key landmarks (three.js final-world):
 *   Engine_Block center:       ( 0.000,  0.008, -1.580)   (x range ±0.85, z range -2.19 to -0.97)
 *   Bonnet front edge open:    ( 0.000,  1.140, -1.398)   (rotated +60° at hinge -0.972)
 *   Driver headrest top:       (-0.353,  0.479,  0.100)
 *   Steering wheel center:     (-0.390,  0.073, -0.508)
 *   Dashboard top-front:       (-0.070,  0.156, -0.628)
 */
const CAM: Record<CameraView, { pos: [number, number, number]; look: [number, number, number]; fov: number }> = {
  // Front-left 3/4 — classic automotive 3/4 front view (grille + left side visible)
  exterior: { pos: [-3.2, 0.9, -5.6], look: [0, -0.55, 0], fov: 36 },
  // High in front of the bumper (z=-2.25), looking back-down into engine bay at ~48°.
  // Tightened from [0, 2.3, -3.8]: closer & lower so the engine fills ~75% of frame.
  // Still clears the grille (ray ≈ y=0.73 at z=-2.25) and passes well under the open
  // hood (front edge at y=1.14, z=-1.40), so the open bonnet frames the top of the shot.
  hood:     { pos: [0, 1.8, -3.2], look: [0, 0.0, -1.6], fov: 50 },
  // Driver headrest top (-0.35, 0.48, 0.10) used as eye origin. Look-at slightly
  // right of center and 17° below horizontal — frames steering wheel (lower-left)
  // and dashboard (lower-middle) with windshield headroom above.
  interior: { pos: [-0.35, 0.48, 0.10], look: [-0.1, 0.2, -1.0], fov: 65 },
};

/* ─── CinematicLoader ────────────────────────────────────────────── */
/**
 * Fullscreen overlay shown while the 130MB GLB streams in. Sits OUTSIDE the
 * Canvas so it covers the entire explorer viewport with real DOM. Reads
 * progress from drei's global LoadingManager (works outside the Canvas).
 */
function CinematicLoader() {
  const { progress, active } = useProgress();
  // Keep the overlay mounted briefly after `active` flips false so the first
  // rendered frame of the scene has time to settle — avoids a black flash.
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (active) {
      setVisible(true);
      return;
    }
    const t = window.setTimeout(() => setVisible(false), 450);
    return () => window.clearTimeout(t);
  }, [active]);

  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      aria-hidden={!active}
      className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #0e0d12 0%, #050507 55%, #000 100%)",
      }}
    >
      {/* faint scanlines for cinematic texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)",
        }}
      />

      {/* corner ticks */}
      <span aria-hidden className="absolute left-6 top-6 size-5 border-l border-t border-gs-red/50" />
      <span aria-hidden className="absolute right-6 top-6 size-5 border-r border-t border-gs-red/50" />
      <span aria-hidden className="absolute bottom-6 left-6 size-5 border-b border-l border-gs-red/50" />
      <span aria-hidden className="absolute bottom-6 right-6 size-5 border-b border-r border-gs-red/50" />

      {/* logo block */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        <div className="mb-4 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.32em] text-gs-red">
          <span aria-hidden className="block h-px w-8 bg-gs-red" />
          Land Cruiser 300
          <span aria-hidden className="block h-px w-8 bg-gs-red" />
        </div>

        <div className="font-wordmark text-[clamp(2.4rem,7vw,4.2rem)] uppercase leading-[0.95] tracking-tight text-paper">
          GS AUTO
          <span className="text-gs-red">.</span>
          <br />
          CENTER
        </div>

        <div className="mt-3 text-[10px] uppercase tracking-[0.3em] text-paper/40">
          Global Solutions
        </div>

        <div className="mt-10 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-paper/70">
          <span
            aria-hidden
            className="inline-block size-1.5 animate-pulse bg-gs-red"
          />
          Загварчилж байна
          <span className="font-mono text-paper/55" style={{ fontVariantNumeric: "tabular-nums" }}>
            {pct.toString().padStart(3, "0")}%
          </span>
        </div>
      </div>

      {/* progress rail — pinned to the bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div
          className="relative h-[3px] w-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div
            className="absolute inset-y-0 left-0 bg-gs-red"
            style={{
              width: `${pct}%`,
              transition: "width 220ms cubic-bezier(0.22, 0.61, 0.36, 1)",
              boxShadow: "0 0 24px 0 rgba(220,13,1,0.55)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── CameraRig — smooth cinematic transitions ───────────────────── */
/**
 * Exterior ↔ Interior takes a 3-waypoint path through the driver window
 * (≈ [-1.2, 0.6, -0.5], level with the glass on the left side of the cabin)
 * over 2.5s. Position uses split easing — quadratic ease-in into the window,
 * quadratic ease-out out the other side — so the camera passes exactly
 * through the waypoint at t=0.5 with continuous velocity. The driver-door
 * glass material ("Glass.001") fades 1 → 0 → 1 along a sin curve so the
 * camera never visibly clips it.
 *
 * All other view changes (exterior ↔ hood, hood ↔ exterior, etc.) use a
 * direct 2-waypoint ease-in-out over 2.0s — no glass fade, no window detour.
 *
 * FOV interpolates linearly across the same duration regardless of path.
 */
type Anim = {
  elapsed: number;
  duration: number;
  type: "waypoint" | "lerp";
  startPos: THREE.Vector3;
  midPos: THREE.Vector3 | null;
  endPos: THREE.Vector3;
  startLook: THREE.Vector3;
  endLook: THREE.Vector3;
  startFov: number;
  endFov: number;
};

type GlassEntry = {
  material: THREE.MeshStandardMaterial;
  origOpacity: number;
  origTransparent: boolean;
};

// Window waypoint — level with driver-door glass, just outside the cabin.
// Picked by the user; coordinates are in three.js final-world space (post
// scene-centering + fitScale + groupY).
const WINDOW_WAYPOINT = new THREE.Vector3(-1.2, 0.6, -0.5);

// Quadratic ease-in-out, equivalent to the split halves used for the
// 3-waypoint path but expressed as a single function. Used for FOV and
// for look-at on every transition.
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function CameraRig({ view }: { view: CameraView }) {
  const { camera, scene } = useThree();
  const prevViewRef = useRef<CameraView>(view);
  const lookAtRef = useRef(new THREE.Vector3(...CAM[view].look));
  const animRef = useRef<Anim | null>(null);
  const glassRef = useRef<GlassEntry[]>([]);

  useEffect(() => {
    const prev = prevViewRef.current;
    if (prev === view) return;

    const cam = camera as THREE.PerspectiveCamera;
    const isCinematic = (prev === "interior") !== (view === "interior");

    const startPos = camera.position.clone();
    const startLook = lookAtRef.current.clone();
    const endPos = new THREE.Vector3(...CAM[view].pos);
    const endLook = new THREE.Vector3(...CAM[view].look);

    if (isCinematic) {
      animRef.current = {
        elapsed: 0,
        duration: 2.5,
        type: "waypoint",
        startPos,
        midPos: WINDOW_WAYPOINT.clone(),
        endPos,
        startLook,
        endLook,
        startFov: cam.fov,
        endFov: CAM[view].fov,
      };
      // Snapshot the driver-door glass materials so we can fade them
      // during the window passage and fully restore them afterward.
      // Glass.001 = front-door glass (FL=driver, FR=passenger). The
      // passenger glass shares the material; fading both is harmless
      // since it's never in frame during this transition.
      const collected: GlassEntry[] = [];
      const seen = new Set<THREE.Material>();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (!m || seen.has(m)) return;
          if (m.name === "Glass.001") {
            seen.add(m);
            const std = m as THREE.MeshStandardMaterial;
            collected.push({
              material: std,
              origOpacity: std.opacity,
              origTransparent: std.transparent,
            });
          }
        });
      });
      glassRef.current = collected;
    } else {
      animRef.current = {
        elapsed: 0,
        duration: 2.0,
        type: "lerp",
        startPos,
        midPos: null,
        endPos,
        startLook,
        endLook,
        startFov: cam.fov,
        endFov: CAM[view].fov,
      };
    }

    prevViewRef.current = view;
  }, [view, camera, scene]);

  useFrame((_, delta) => {
    const a = animRef.current;
    if (!a) return;

    a.elapsed = Math.min(a.duration, a.elapsed + delta);
    const t = a.elapsed / a.duration;
    const cam = camera as THREE.PerspectiveCamera;

    const posTarget = new THREE.Vector3();

    if (a.type === "waypoint" && a.midPos) {
      // Split-easing through the window waypoint: quadratic in to the
      // midpoint, quadratic out to the end. Velocities match at t=0.5
      // (both equal 2 in normalized units), so motion is continuous.
      if (t < 0.5) {
        const lt = t * 2;
        posTarget.lerpVectors(a.startPos, a.midPos, lt * lt);
      } else {
        const lt = (t - 0.5) * 2;
        posTarget.lerpVectors(a.midPos, a.endPos, 1 - (1 - lt) * (1 - lt));
      }

      // Sin curve: 0 at t=0, 1 at t=0.5, 0 at t=1 — perfect for a one-shot
      // fade-out-and-restore as the camera crosses the glass.
      const hide = Math.sin(t * Math.PI);
      glassRef.current.forEach((g) => {
        g.material.transparent = true;
        g.material.opacity = g.origOpacity * (1 - hide);
        g.material.needsUpdate = true;
      });
    } else {
      posTarget.lerpVectors(a.startPos, a.endPos, easeInOut(t));
    }

    // Look-at always uses smooth ease-in-out — orientation never needs
    // the window detour, only position does.
    const lookTarget = new THREE.Vector3().lerpVectors(
      a.startLook,
      a.endLook,
      easeInOut(t),
    );

    cam.fov = a.startFov + (a.endFov - a.startFov) * t;
    cam.updateProjectionMatrix();

    camera.position.copy(posTarget);
    lookAtRef.current.copy(lookTarget);
    camera.lookAt(lookAtRef.current);

    if (t >= 1) {
      // Restore glass to its original opacity/transparent settings so
      // later renders don't leave the driver window subtly translucent.
      if (a.type === "waypoint") {
        glassRef.current.forEach((g) => {
          g.material.opacity = g.origOpacity;
          g.material.transparent = g.origTransparent;
          g.material.needsUpdate = true;
        });
        glassRef.current = [];
      }
      animRef.current = null;
    }
  });

  return null;
}

/* ─── LC300Scene ─────────────────────────────────────────────────── */
type SceneProps = {
  view: CameraView;
  hoveredId: string | null;
  pickedId: string | null;
  isolatedHotspot: Hotspot | null;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
  onMeshesReady: (names: Set<string>) => void;
};

// World-space target where an isolated part floats to (in front of the
// hood camera, slightly above the look-at point so it spins in clear view).
const ISOLATION_TARGET = new THREE.Vector3(0, 0.6, -2.3);
const ISOLATION_DURATION = 1.5;
const ISOLATION_SCALE_MULT = 1.4;
const ISOLATION_ROTATION_SPEED = 0.4; // rad/s, applied during the "isolated" hold

function LC300Scene({
  view,
  hoveredId,
  pickedId,
  isolatedHotspot,
  onHover,
  onPick,
  onMeshesReady,
}: SceneProps) {
  const { scene } = useGLTF(MODEL_URL, DRACO_DECODER_URL) as unknown as { scene: THREE.Group };
  const { scene: rootScene } = useThree();

  /* Defensive hide: the optimized GLB has the NLM-branded "Car plates"
     node stripped, but guard against future model revisions reintroducing
     anything that uses the NLM material/texture. */
  useEffect(() => {
    const plates = scene.getObjectByName("Car plates");
    if (plates) plates.visible = false;
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const name = (m as THREE.Material | undefined)?.name ?? "";
        if (name === "NLM GROUP" || name === "NLM") mesh.visible = false;
      }
    });
  }, [scene]);

  /* PBR material pass — automotive-paint formula.
     The NLM Superhive source ships untextured carpaint / metal / mirror /
     rim materials that depend on HDRI reflections for their look. The
     previous pass kept everything as MeshStandardMaterial, which can't
     express the two-layer clearcoat structure of real automotive lacquer
     — the result was a chalky-plastic look on the white body.

     For Carpaint we now PROMOTE the material to MeshPhysicalMaterial and
     enable a full clearcoat layer (clearcoat=1, clearcoatRoughness=0.03).
     The base layer keeps a higher roughness (0.45) so the smooth top
     coat is what produces the sharp highlight rails. envMapIntensity 1.0
     lets the HDRI drive the reflections without blowing out.

     We swap the material reference on every mesh that uses the original
     to avoid Three.js shader-program duplication. A WeakSet of touched
     materials prevents re-tuning when the cached scene remounts. */
  useEffect(() => {
    const tuned = new WeakSet<THREE.Material>();
    const replacements = new Map<THREE.Material, THREE.Material>();

    const upgradeToPaint = (src: THREE.MeshStandardMaterial): THREE.MeshPhysicalMaterial => {
      const phys = new THREE.MeshPhysicalMaterial({
        name: src.name,
        // Deep automotive black with a very subtle cool undertone — what
        // real luxury black pearl paint reads as in shadow. Matches the
        // Superhive NLM Cycles reference colour. Pure #000 reads flat;
        // #0a0a0c keeps a fraction of base luminance so the body has
        // sub-shadow detail when the clearcoat highlight rolls off.
        color: new THREE.Color("#0a0a0c"),
        // Black automotive paint is still dielectric — metalness 0; the
        // clearcoat layer drives the gloss.
        metalness: 0.0,
        // Higher roughness on the *base* coat makes the *clearcoat*
        // highlights the dominant specular signal — exactly how real
        // 2-coat automotive paint reads under studio softboxes.
        roughness: 0.42,
        clearcoat: 1.0,
        // 0.07 is the realistic clearcoat micro-roughness for showroom
        // paint — sharp enough to project the overhead area-light streak
        // but rough enough that reflections don't punch through to
        // 100% white clipping on the body crown.
        clearcoatRoughness: 0.07,
        // Default dielectric reflectance — going above this on paint
        // makes the body read as plastic; the dominant gloss comes
        // from the clearcoat, not the base layer.
        reflectivity: 0.5,
        envMapIntensity: 1.0,
        // Push the painted body fractionally back in depth. Chrome trim,
        // badge backing and door handles sit at the same geometric
        // position as the body in the source mesh, so without polygon
        // offset they z-fight the paint and produce flickering bright
        // slivers along seams — exactly the "something overlapping the
        // wheel arch" artefact reported on the front-left fender.
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      return phys;
    };

    const tune = (mat: THREE.Material) => {
      if (tuned.has(mat)) return;
      tuned.add(mat);

      const name = (mat.name ?? "").toLowerCase();

      // Glass: GLB ships MeshPhysicalMaterial via KHR_materials_transmission.
      if (mat instanceof THREE.MeshPhysicalMaterial && name.includes("glass")) {
        mat.roughness = name.includes("dark") ? 0.06 : 0.02;
        mat.envMapIntensity = 1.5;
        return;
      }

      if (!(mat instanceof THREE.MeshStandardMaterial)) return;

      if (name === "carpaint") {
        // Defer the swap — we record old→new and walk the scene again.
        const upgraded = upgradeToPaint(mat);
        replacements.set(mat, upgraded);
        tuned.add(upgraded);
      } else if (name === "mirror" || name === "white op") {
        // Bright polished chrome (mirrors, trim) — boosted envMap so the
        // grille slats and window trim stand out as crisp metallic lines
        // against the black body. Previous 1.9 was tuned against the
        // white paint where contrast came free.
        mat.metalness = 1.0;
        mat.roughness = 0.04;
        mat.envMapIntensity = 2.4;
      } else if (name === "metal") {
        mat.metalness = 1.0;
        mat.roughness = 0.12;
        mat.envMapIntensity = 2.0;
      } else if (name === "white") {
        mat.metalness = 0.92;
        mat.roughness = 0.12;
        mat.envMapIntensity = 1.8;
      } else if (name.startsWith("dark metal") || name === "metal gray.001") {
        mat.metalness = 1.0;
        mat.roughness = 0.24;
        mat.envMapIntensity = 1.7;
      } else if (name === "rims") {
        // Polished aluminium wheel — kept slightly brighter against the
        // dark body so the wheel design reads from across the section.
        mat.metalness = 1.0;
        mat.roughness = 0.14;
        mat.envMapIntensity = 1.8;
      } else if (name === "tire") {
        mat.metalness = 0;
        mat.roughness = 0.92;
      } else if (name === "black" || name === "plastic" || name.startsWith("black rough")) {
        mat.metalness = 0;
        mat.roughness = 0.74;
      } else if (name.startsWith("leather")) {
        mat.metalness = 0;
        mat.roughness = 0.82;
      } else if (name === "suspension") {
        mat.metalness = 0.7;
        mat.roughness = 0.55;
      }
    };

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(tune);
    });

    // Swap any Carpaint material refs after the traversal so meshes share
    // the new MeshPhysicalMaterial instance.
    if (replacements.size > 0) {
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) return;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => replacements.get(m) ?? m);
        } else {
          const swap = replacements.get(mesh.material);
          if (swap) mesh.material = swap;
        }
      });
    }

    // Smooth vertex normals on body, chrome trim, and engine panels.
    // The selective-simplify pipeline (ratios 0.85 → 0.15) preserved the
    // GLB vertex normals from before decimation; the post-decimate normals
    // ended up with hard angle-breaks across what should be continuous
    // panels, which read as faceted / sharp under the clearcoat highlight.
    // Recomputing averages normals across shared positions and gives the
    // body a smooth gradient again. Only applied to materials that should
    // be smooth — leaves seats, leather, tires alone where hard edges
    // are correct by design.
    const SMOOTH_MATS = new Set([
      "carpaint",
      "mirror",
      "white op",
      "metal",
      "white",
      "metal gray.001",
      "rims",
    ]);
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry || !mesh.material) return;
      const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
        | THREE.Material
        | undefined;
      const matName = (mat?.name ?? "").toLowerCase();
      if (SMOOTH_MATS.has(matName) || matName.startsWith("dark metal")) {
        mesh.geometry.computeVertexNormals();
      }
    });
  }, [scene]);

  /* Publish the set of object names in the loaded GLB so the legend can
     hide pills whose isolate target doesn't exist yet (e.g. Battery /
     Air_Filter / Radiator pending the V6 import). */
  useEffect(() => {
    const names = new Set<string>();
    scene.traverse((obj) => {
      if (obj.name) names.add(obj.name);
    });
    onMeshesReady(names);
  }, [scene, onMeshesReady]);

  /* mesh → hotspot id */
  const meshToId = useMemo(() => {
    const m = new Map<THREE.Mesh, string>();
    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        const id = findHotspotId(cur.name, LC300_HOTSPOTS);
        if (id) { m.set(obj as THREE.Mesh, id); return; }
        cur = cur.parent;
      }
    });
    return m;
  }, [scene]);

  /* preserve original emissives for restore */
  const origEmissive = useMemo(() => {
    const map = new Map<THREE.Mesh, { color: THREE.Color; intensity: number }>();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial | undefined;
      if (!mat?.emissive) return;
      map.set(mesh, { color: mat.emissive.clone(), intensity: mat.emissiveIntensity ?? 0 });
    });
    return map;
  }, [scene]);

  /* which hotspots are clickable in this view */
  const allowedIds = useMemo<Set<string>>(() => {
    if (view === "hood") return new Set(["hood", "engine", "battery", "air_filter", "radiator"]);
    if (view === "exterior") return new Set(["door_fl", "door_fr", "door_rl", "door_rr", "wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr", "hood"]);
    return new Set();
  }, [view]);

  /* hover/pick emissive glow */
  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const id = meshToId.get(mesh);
      mats.forEach((mat) => {
        const std = mat as THREE.MeshStandardMaterial;
        if (!std?.emissive) return;
        const orig = origEmissive.get(mesh);
        if (!orig) return;
        const active = id && allowedIds.has(id) && (id === hoveredId || id === pickedId);
        if (active) {
          const strength = id === pickedId ? 0.40 : 0.18;
          std.emissive.setRGB(strength, 0.03 * strength, 0.03 * strength);
          std.emissiveIntensity = 1;
        } else {
          std.emissive.copy(orig.color);
          std.emissiveIntensity = orig.intensity;
        }
      });
    });
  }, [hoveredId, pickedId, view, scene, meshToId, origEmissive, allowedIds]);

  /* Hood animation — Bonnet_Full has its origin baked at the rear-bottom
     hinge in Blender, so we rotate the object directly (no pivot Group,
     no axis/sign math). +60° around local X swings the front edge up like
     a real hood opening. Cubic ease-in-out over 1.2s for cinematic feel.

     The animation is driven by a useFrame loop reading refs, NOT react-
     spring — the SpringValue.get() approach was leaving rotation.x stuck
     at 0 on the deployed build, so we keep state in plain refs and lerp
     in the render loop. */
  const bonnetRef = useRef<THREE.Object3D | null>(null);
  const hoodTargetRef = useRef(0);
  const hoodCurrentRef = useRef(0);
  const hoodAnimStartRef = useRef<number | null>(null);
  const hoodAnimFromRef = useRef(0);

  useEffect(() => {
    bonnetRef.current = scene.getObjectByName("Bonnet_Full") ?? null;
  }, [scene]);

  useEffect(() => {
    const target = view === "hood" ? Math.PI / 3 : 0;
    if (target === hoodTargetRef.current) return;
    hoodTargetRef.current = target;
    hoodAnimFromRef.current = hoodCurrentRef.current;
    hoodAnimStartRef.current = performance.now();
  }, [view]);

  /* Part-isolation animation. When `isolatedHotspot` is set the named mesh is
     reparented from inside the GLB tree onto the canvas root scene (so its
     transforms are independent of the wrapping fit/group transforms), then
     animated to ISOLATION_TARGET over 1.5s with a 1.4x scale-up. While
     isolated it rotates 0.4 rad/s on Y. When `isolatedHotspot` becomes null
     the animation reverses; on completion the mesh is reattached to its
     original parent with its captured local transform — restoring it pixel-
     accurate to where it started. */
  type IsoCapture = {
    mesh: THREE.Object3D;
    parent: THREE.Object3D;
    localPos: THREE.Vector3;
    localRot: THREE.Euler;
    localScale: THREE.Vector3;
    // World-space offset from the mesh's node origin to the geometry's bbox
    // centre. The optimized GLB keeps each mesh's node origin at (0,0,0) in
    // local-parent space while the geometry lives several units away — e.g.
    // Engine_Block geometry sits around z=-6 in node-local space. Animating
    // mesh.position alone would put the *origin* at ISOLATION_TARGET while
    // the visible mesh stays metres behind the camera, so we subtract this
    // offset from the target position to land the geometry centre on it.
    centreOffsetWorld: THREE.Vector3;
  };
  type IsoAnim = {
    phase: "out" | "isolated" | "in";
    elapsed: number;
    duration: number;
    startPos: THREE.Vector3;
    startScale: THREE.Vector3;
    startRotY: number;
    targetPos: THREE.Vector3;
    targetScale: THREE.Vector3;
  };
  const isoRef = useRef<IsoCapture | null>(null);
  const isoAnimRef = useRef<IsoAnim | null>(null);

  useEffect(() => {
    if (isolatedHotspot && !isoRef.current) {
      const name = isolatedHotspot.isolate;
      if (!name) return;
      const mesh = scene.getObjectByName(name);
      if (!mesh || !mesh.parent) return;

      // Ensure world matrices are current before reading positions.
      mesh.parent.updateMatrixWorld(true);

      const startWorldPos = mesh.getWorldPosition(new THREE.Vector3());
      const startWorldScale = mesh.getWorldScale(new THREE.Vector3());

      // World bbox centre — gives us the actual visible centre of the mesh,
      // which we want to land on ISOLATION_TARGET.
      const bbox = new THREE.Box3().setFromObject(mesh);
      const centreWorld = bbox.getCenter(new THREE.Vector3());
      const centreOffsetWorld = centreWorld.clone().sub(startWorldPos);

      isoRef.current = {
        mesh,
        parent: mesh.parent,
        localPos: mesh.position.clone(),
        localRot: mesh.rotation.clone(),
        localScale: mesh.scale.clone(),
        centreOffsetWorld,
      };

      // Reparent to canvas root preserving world transform.
      rootScene.attach(mesh);

      isoAnimRef.current = {
        phase: "out",
        elapsed: 0,
        duration: ISOLATION_DURATION,
        startPos: startWorldPos,
        startScale: startWorldScale.clone(),
        startRotY: mesh.rotation.y,
        // Target the geometry centre at ISOLATION_TARGET — subtract the
        // offset (scaled by the scale-up multiplier, since the offset
        // grows with mesh.scale).
        targetPos: ISOLATION_TARGET.clone().sub(
          centreOffsetWorld.clone().multiplyScalar(ISOLATION_SCALE_MULT),
        ),
        targetScale: startWorldScale.clone().multiplyScalar(ISOLATION_SCALE_MULT),
      };
      return;
    }

    if (!isolatedHotspot && isoRef.current && isoAnimRef.current?.phase !== "in") {
      // Begin return animation from current world transform back to where the
      // mesh would sit if reattached to its original parent with the captured
      // local transform.
      const iso = isoRef.current;
      const mesh = iso.mesh;
      const curWorldPos = mesh.getWorldPosition(new THREE.Vector3());
      const curWorldScale = mesh.getWorldScale(new THREE.Vector3());

      // Compute the target world transform by placing a proxy in the original
      // parent with the captured local transform and reading its world.
      const proxy = new THREE.Object3D();
      proxy.position.copy(iso.localPos);
      proxy.rotation.copy(iso.localRot);
      proxy.scale.copy(iso.localScale);
      iso.parent.add(proxy);
      iso.parent.updateMatrixWorld(true);
      const targetWorldPos = proxy.getWorldPosition(new THREE.Vector3());
      const targetWorldScale = proxy.getWorldScale(new THREE.Vector3());
      iso.parent.remove(proxy);

      isoAnimRef.current = {
        phase: "in",
        elapsed: 0,
        duration: ISOLATION_DURATION,
        startPos: curWorldPos,
        startScale: curWorldScale,
        startRotY: mesh.rotation.y,
        targetPos: targetWorldPos,
        targetScale: targetWorldScale,
      };
    }
  }, [isolatedHotspot, scene, rootScene]);

  /* Fade the rest of the car to 8% opacity while a part is isolated. Walks
     the GLB tree, fades every mesh that isn't part of the isolated subtree,
     and restores original opacity/transparent on close. */
  useEffect(() => {
    const isolateName = isolatedHotspot?.isolate;
    const inSubtree = new Set<THREE.Object3D>();
    if (isolateName) {
      const root = scene.getObjectByName(isolateName);
      if (root) root.traverse((o) => inSubtree.add(o));
    }
    type MatMemo = THREE.Material & { __isoOrig?: { o: number; t: boolean } };
    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (!m.isMesh || !m.material) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      const fade = isolateName && !inSubtree.has(m);
      mats.forEach((mat) => {
        if (!mat) return;
        const memo = mat as MatMemo;
        if (fade) {
          if (!memo.__isoOrig) {
            memo.__isoOrig = { o: mat.opacity, t: mat.transparent };
          }
          mat.transparent = true;
          mat.opacity = 0.08;
        } else if (memo.__isoOrig) {
          mat.opacity = memo.__isoOrig.o;
          mat.transparent = memo.__isoOrig.t;
          delete memo.__isoOrig;
        }
      });
    });
  }, [isolatedHotspot, scene]);

  /* Restore on unmount in case the explorer is removed mid-isolation. */
  useEffect(() => {
    return () => {
      const iso = isoRef.current;
      if (!iso) return;
      iso.parent.attach(iso.mesh);
      iso.mesh.position.copy(iso.localPos);
      iso.mesh.rotation.copy(iso.localRot);
      iso.mesh.scale.copy(iso.localScale);
      isoRef.current = null;
      isoAnimRef.current = null;
    };
  }, []);

  useFrame((_, delta) => {
    // Hood lerp — driven by performance.now() so it is independent of the
    // useFrame delta clamp and of React render scheduling.
    const startMs = hoodAnimStartRef.current;
    if (startMs !== null) {
      const t = Math.min(1, (performance.now() - startMs) / 1200);
      const eased =
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      hoodCurrentRef.current =
        hoodAnimFromRef.current +
        (hoodTargetRef.current - hoodAnimFromRef.current) * eased;
      if (t >= 1) hoodAnimStartRef.current = null;
    }
    if (bonnetRef.current) {
      bonnetRef.current.rotation.x = hoodCurrentRef.current;
    }

    const anim = isoAnimRef.current;
    const iso = isoRef.current;
    if (!anim || !iso) return;

    if (anim.phase === "isolated") {
      iso.mesh.rotation.y += ISOLATION_ROTATION_SPEED * delta;
      return;
    }

    anim.elapsed = Math.min(anim.duration, anim.elapsed + delta);
    const t = anim.elapsed / anim.duration;
    const eased = 1 - Math.pow(1 - t, 4); // ease-out quart

    iso.mesh.position.lerpVectors(anim.startPos, anim.targetPos, eased);
    iso.mesh.scale.lerpVectors(anim.startScale, anim.targetScale, eased);

    if (anim.phase === "in") {
      iso.mesh.rotation.y = anim.startRotY * (1 - eased);
    }

    if (t >= 1) {
      if (anim.phase === "out") {
        isoAnimRef.current = { ...anim, phase: "isolated", elapsed: 0, duration: Infinity };
      } else if (anim.phase === "in") {
        iso.parent.attach(iso.mesh);
        iso.mesh.position.copy(iso.localPos);
        iso.mesh.rotation.copy(iso.localRot);
        iso.mesh.scale.copy(iso.localScale);
        isoRef.current = null;
        isoAnimRef.current = null;
      }
    }
  });

  /* centering + ground placement (wheels touch ground) */
  const { centerOffset, fitScale, groupY } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fs = 4.5 / maxDim;
    // Put model's lowest point at world y=GROUND_Y
    // wheel_world_y = (box.min.y - center.y) * fs + groupY  →  GROUND_Y
    // groupY = GROUND_Y - (box.min.y - center.y) * fs
    const gY = GROUND_Y - (box.min.y - center.y) * fs;
    return { centerOffset: center.clone().negate(), fitScale: fs, groupY: gY };
  }, [scene]);

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const id = meshToId.get(e.object as THREE.Mesh);
      if (id && allowedIds.has(id)) {
        onHover(id);
        document.body.style.cursor = "pointer";
      }
    },
    [meshToId, onHover, allowedIds],
  );
  const handlePointerOut = useCallback(() => {
    onHover(null);
    document.body.style.cursor = "";
  }, [onHover]);
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (isolatedHotspot) return; // ignore mesh clicks while isolated
      const id = meshToId.get(e.object as THREE.Mesh);
      if (id && allowedIds.has(id)) onPick(id);
    },
    [meshToId, onPick, allowedIds, isolatedHotspot],
  );

  return (
    <group scale={fitScale} position={[0, groupY, 0]}>
      <primitive
        object={scene}
        position={centerOffset.toArray()}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
    </group>
  );
}

/* ─── EnvironmentIntensityController ─────────────────────────────── */
/**
 * Drei's <Environment> sets scene.environment for reflections, but in newer
 * Three.js the IBL contribution can be scaled via scene.environmentIntensity.
 * This component sets that value once the scene is ready.
 */
function EnvIntensity({ value }: { value: number }) {
  const { scene } = useThree();
  useEffect(() => {
    (scene as THREE.Scene & { environmentIntensity?: number }).environmentIntensity = value;
  }, [scene, value]);
  return null;
}

/* ─── Lighting — Studio softbox three-point rig ──────────────────── */
/**
 * Photo-studio geometry, sized for a car shoot. The HDRI alone wasn't
 * giving the white panels the sharp highlight rails you'd see from real
 * softboxes overhead — those long bright strips along the roof rail,
 * hood crown and fender peak that make a car look "premium" in product
 * photography. So we add explicit directional sources:
 *
 *  - Top key (large soft white from above-left, intensity 1.4) →
 *    draws the dominant highlight along the upper body curves.
 *  - Front-right fill (warm white, intensity 0.45) → opens up the
 *    shadow side so the car doesn't read as half-lit.
 *  - Rear rim (brand red, intensity 1.8) → separates the silhouette
 *    from the dark page background; subtle, no wheel-arch glow.
 *  - Bottom bounce (cool white, intensity 0.2) → simulates a soft
 *    floor bounce so the underside of bumpers and side skirts is
 *    not jet-black.
 */
function Lighting() {
  // Orient the area light to face downward at the car.
  const overheadRef = useRef<THREE.RectAreaLight>(null);
  useEffect(() => {
    overheadRef.current?.lookAt(0, 0, 0);
  }, []);

  return (
    <>
      {/* Overhead RectAreaLight — this is the single biggest factor in
          making the body read as "automotive paint" instead of waxy
          plastic. It's a 5m×1.5m horizontal panel directly above the
          car that creates the long *streak* highlight running across
          the hood, roof and rear deck — the canonical specular tell
          of a real studio softbox. The HDRI alone projects the
          softbox shape into the clearcoat reflections but its
          intensity gets attenuated; an explicit area light adds the
          extra punch needed to push the streak into white-clipping. */}
      <rectAreaLight
        ref={overheadRef}
        position={[0, 4.2, -1.8]}
        width={5}
        height={1.5}
        intensity={9}
        color="#ffffff"
      />

      {/* Top key — still useful for the shadow it casts on the floor.
          Low intensity so it doesn't compete with the area light. */}
      <directionalLight
        position={[-2.5, 6.5, -2.0]}
        intensity={0.45}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Brand-red rim from behind — separates the silhouette from the
          dark page bg. */}
      <pointLight position={[0, 1.0, 4.8]} intensity={1.4} color="#DC0D01" distance={9} decay={2.2} />
    </>
  );
}

/* ─── HotspotLegend ──────────────────────────────────────────────── */
function HotspotLegend({
  view,
  hoveredId,
  activeId,
  availableMeshes,
  isolating,
  onSelect,
}: {
  view: CameraView;
  hoveredId: string | null;
  activeId: string | null;
  availableMeshes: Set<string>;
  isolating: boolean;
  onSelect: (id: string) => void;
}) {
  // Pills hide entirely in interior view; during isolation they stay
  // rendered but fade out and become non-interactive so the only way to
  // exit is the back button.
  const visible = view !== "interior" && !isolating;
  const visibleHotspots = LC300_HOTSPOTS.filter((h) => {
    const inView = view === "exterior"
      ? ["hood", "door_fl", "door_fr", "door_rl", "door_rr", "wheel_fl", "wheel_fr"].includes(h.id)
      : view === "hood"
        ? ["hood", "engine", "battery", "air_filter", "radiator"].includes(h.id)
        : false;
    if (!inView) return false;
    // Engine-part hotspots are gated on the isolate target existing in the
    // current GLB. The Battery / Air_Filter / Radiator meshes ship with the
    // V6 import; until then their pills stay hidden.
    if (h.isolate && availableMeshes.size > 0 && !availableMeshes.has(h.isolate)) {
      return false;
    }
    return true;
  });

  return (
    <div
      className={`absolute inset-x-3 bottom-3 z-10 flex flex-wrap justify-center gap-1.5 transition-opacity duration-500 sm:gap-2 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {visibleHotspots.map((h) => {
        const isActive = h.id === activeId;
        const isHover = h.id === hoveredId;
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => onSelect(h.id)}
            className={`flex items-center gap-2 border px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.16em] backdrop-blur-md transition-all duration-200 sm:text-[10px] ${
              isActive
                ? "border-gs-red bg-gs-red text-snow"
                : isHover
                  ? "border-gs-red/60 bg-ink/70 text-paper"
                  : "border-white/10 bg-black/40 text-paper/70 hover:border-gs-red/50 hover:text-paper"
            }`}
          >
            <span aria-hidden className={`block size-1 ${isActive ? "bg-snow" : "bg-gs-red"}`} />
            {h.name}
          </button>
        );
      })}
    </div>
  );
}

/* ─── CameraViewButtons ──────────────────────────────────────────── */
function CameraViewButtons({
  view,
  onViewChange,
}: {
  view: CameraView;
  onViewChange: (v: CameraView) => void;
}) {
  return (
    <div
      className={`absolute right-5 bottom-14 z-10 flex flex-col gap-1.5 transition-opacity duration-500 sm:right-7 sm:bottom-16 ${
        view !== "interior" ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={() => onViewChange(view === "hood" ? "exterior" : "hood")}
        className={`flex items-center gap-2 border px-3 py-2 text-[9.5px] font-medium uppercase tracking-[0.18em] backdrop-blur-md transition-all duration-200 ${
          view === "hood"
            ? "border-gs-red bg-gs-red text-snow"
            : "border-white/10 bg-black/45 text-paper/80 hover:border-gs-red/60 hover:text-paper"
        }`}
      >
        <span aria-hidden className="block size-1 bg-current opacity-70" />
        {view === "hood" ? "Хаах" : "Капот нээх"}
      </button>
      <button
        type="button"
        onClick={() => onViewChange("interior")}
        className="flex items-center gap-2 border border-white/10 bg-black/45 px-3 py-2 text-[9.5px] font-medium uppercase tracking-[0.18em] text-paper/80 backdrop-blur-md transition-all duration-200 hover:border-gs-red/60 hover:text-paper"
      >
        <span aria-hidden className="block size-1 bg-gs-red" />
        Салон
      </button>
    </div>
  );
}

/* ─── BackButton ─────────────────────────────────────────────────── */
function BackButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Буцах"
      className={`absolute left-5 top-5 z-50 flex items-center gap-2 border border-white/10 bg-black/55 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-paper backdrop-blur-sm transition-all duration-300 hover:border-gs-red hover:text-gs-red sm:left-7 sm:top-7 ${
        show
          ? "translate-x-0 opacity-100"
          : "pointer-events-none -translate-x-3 opacity-0"
      }`}
    >
      <span aria-hidden className="block size-1.5 rotate-[225deg] border-r border-t border-current" />
      Буцах
    </button>
  );
}

/* ─── PartModal ──────────────────────────────────────────────────── */
function PartModal({ hotspot, onClose }: { hotspot: Hotspot | null; onClose: () => void }) {
  const open = !!hotspot;
  return (
    <>
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal={open}
        aria-label={hotspot?.name ?? ""}
        className={`fixed left-1/2 top-1/2 z-40 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 border bg-[#0a0a0c]/96 p-7 backdrop-blur-xl transition-all duration-300 ease-out sm:max-w-md sm:p-8 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          boxShadow: open ? "0 0 80px -15px rgba(220,13,1,0.30)" : "none",
        }}
      >
        {hotspot && (
          <>
            <span aria-hidden className="absolute left-2 top-2 size-4 border-l border-t border-gs-red/40" />
            <span aria-hidden className="absolute right-2 top-2 size-4 border-r border-t border-gs-red/40" />
            <span aria-hidden className="absolute bottom-2 left-2 size-4 border-b border-l border-gs-red/40" />
            <span aria-hidden className="absolute bottom-2 right-2 size-4 border-b border-r border-gs-red/40" />

            <button
              type="button"
              aria-label="Хаах"
              onClick={onClose}
              className="absolute right-4 top-4 flex size-8 items-center justify-center border border-white/10 text-paper/60 transition-colors hover:border-gs-red hover:text-gs-red"
            >
              <span aria-hidden className="absolute block h-px w-3.5 rotate-45 bg-current" />
              <span aria-hidden className="absolute block h-px w-3.5 -rotate-45 bg-current" />
            </button>

            <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
              LC 300 · хэсэг
            </div>
            <h3 className="font-wordmark text-3xl uppercase tracking-tight text-paper">
              {hotspot.name}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-paper/75">
              {hotspot.desc}
            </p>

            <ul className="mt-5 grid grid-cols-2 gap-2.5 border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {["Анхдагч эд анги", "Мэргэшсэн мастер", "Чанарын баталгаа", "Шуурхай үйлчилгээ"].map((label) => (
                <li key={label} className="flex items-start gap-2 text-[10px] uppercase tracking-[0.14em] text-paper/70">
                  <span aria-hidden className="mt-0.5 block size-1 shrink-0 bg-gs-red" />
                  {label}
                </li>
              ))}
            </ul>

            <a
              href={PHONE_HREF}
              className="group/cta mt-6 flex items-center justify-between gap-3 bg-gs-red px-5 py-4 text-snow transition-colors hover:bg-gs-red/90"
            >
              <span className="flex flex-col items-start">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-70">
                  Цаг захиалах
                </span>
                <span className="font-wordmark text-lg uppercase tracking-tight">
                  {PHONE_DISPLAY}
                </span>
              </span>
              <span aria-hidden className="block size-2.5 origin-center rotate-45 border-r border-t border-snow/80 transition-transform group-hover/cta:translate-x-1" />
            </a>
          </>
        )}
      </div>
    </>
  );
}

/* ─── SidePanel — right-aligned part-info panel for isolation flow ─ */
function SidePanel({ hotspot, onClose }: { hotspot: Hotspot | null; onClose: () => void }) {
  const open = !!hotspot;
  return (
    <>
      {/* Edge-only blur vignette behind the floating part — concentrates the
          eye on the centre while still hinting at the dimmed car around it.
          A radial mask cuts the blur out of the centre 55% so the part stays
          sharp. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          maskImage:
            "radial-gradient(ellipse at center, transparent 0%, transparent 55%, black 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, transparent 0%, transparent 55%, black 85%)",
        }}
      />

      <aside
        role="dialog"
        aria-modal="false"
        aria-label={hotspot?.name ?? ""}
        className={`absolute inset-y-0 right-0 z-30 flex w-full flex-col bg-ink/90 p-7 backdrop-blur-xl transition-transform duration-300 ease-out sm:w-[320px] sm:p-8 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          boxShadow: open ? "-24px 0 60px -20px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {hotspot && (
          <>
            <button
              type="button"
              aria-label="Хаах"
              onClick={onClose}
              className="absolute right-4 top-4 flex size-8 items-center justify-center border border-white/10 text-paper/60 transition-colors hover:border-gs-red hover:text-gs-red"
            >
              <span aria-hidden className="absolute block h-px w-3.5 rotate-45 bg-current" />
              <span aria-hidden className="absolute block h-px w-3.5 -rotate-45 bg-current" />
            </button>

            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
              LC 300 · ЭД АНГИ
            </div>

            <h3 className="mt-3 font-wordmark text-3xl uppercase leading-tight tracking-tight text-paper">
              {hotspot.name}
            </h3>

            <p className="mt-5 text-sm leading-relaxed text-paper/75">
              {hotspot.desc}
            </p>

            <div
              aria-hidden
              className="my-6 h-px w-full"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            />

            <ul className="grid grid-cols-1 gap-2.5">
              {["Анхдагч эд анги", "Мэргэшсэн мастер", "Чанарын баталгаа", "Шуурхай үйлчилгээ"].map((label) => (
                <li key={label} className="flex items-start gap-2 text-[10px] uppercase tracking-[0.14em] text-paper/70">
                  <span aria-hidden className="mt-0.5 block size-1 shrink-0 bg-gs-red" />
                  {label}
                </li>
              ))}
            </ul>

            <a
              href={PHONE_HREF}
              className="group/cta mt-auto flex items-center justify-between gap-3 bg-gs-red px-5 py-4 text-snow transition-colors hover:bg-gs-red/90"
            >
              <span className="flex flex-col items-start">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-70">
                  Цаг захиалах
                </span>
                <span className="font-wordmark text-lg uppercase tracking-tight">
                  {PHONE_DISPLAY}
                </span>
              </span>
              <span aria-hidden className="block size-2.5 origin-center rotate-45 border-r border-t border-snow/80 transition-transform group-hover/cta:translate-x-1" />
            </a>
          </>
        )}
      </aside>
    </>
  );
}

/* ─── VehicleExplorer (section root) ─────────────────────────────── */
export default function VehicleExplorer() {
  const [view, setView] = useState<CameraView>("exterior");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [modalHotspot, setModalHotspot] = useState<Hotspot | null>(null);
  // Engine-part isolation state: the hotspot whose mesh is currently detached
  // and floating in the centre of the canvas with the side panel open.
  const [isolatedHotspot, setIsolatedHotspot] = useState<Hotspot | null>(null);
  // Set of object names present in the loaded GLB. Used to gate which engine
  // pills appear in the legend — pills whose `isolate` target doesn't exist
  // in the current model stay hidden until the asset upgrade lands.
  const [availableMeshes, setAvailableMeshes] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const handlePick = useCallback(
    (id: string) => {
      const hs = LC300_HOTSPOTS.find((h) => h.id === id);
      if (!hs) return;
      // While a part is isolated the legend is also disabled visually, but
      // bonnet-mesh clicks could still fire — silently ignore so a stray
      // raycast hit during isolation doesn't queue a doomed second isolate.
      if (isolatedHotspot) return;
      // Hood toggles the camera view; it never isolates. In exterior view a
      // hood click opens the bay. In hood view it shows the hood-services
      // modal (legacy behavior). A bonnet-mesh click in hood view goes
      // through the same path, so it also shows the modal instead of doing
      // something destructive like detaching the hood.
      if (id === "hood") {
        if (view === "exterior") {
          setView("hood");
          setPickedId(null);
          return;
        }
        setPickedId(id);
        setModalHotspot(hs);
        return;
      }
      // In hood view, engine parts with an isolate target trigger the
      // detach + float + side-panel interaction instead of the modal.
      if (view === "hood" && hs.isolate && availableMeshes.has(hs.isolate)) {
        setPickedId(id);
        setIsolatedHotspot(hs);
        setModalHotspot(null);
        return;
      }
      // Fallback: existing centred modal flow.
      setPickedId(id);
      setModalHotspot(hs);
    },
    [view, availableMeshes, isolatedHotspot],
  );

  const handleCloseModal = useCallback(() => {
    setModalHotspot(null);
    setPickedId(null);
  }, []);

  const handleCloseIsolation = useCallback(() => {
    setIsolatedHotspot(null);
    setPickedId(null);
  }, []);

  const handleBack = useCallback(() => {
    // If a part is isolated, just close the isolation; the camera stays
    // in hood view so the user can pick another part.
    if (isolatedHotspot) {
      setIsolatedHotspot(null);
      setPickedId(null);
      return;
    }
    setView("exterior");
    setPickedId(null);
    setModalHotspot(null);
  }, [isolatedHotspot]);

  return (
    <section
      id="explorer"
      aria-label="Загварын судалгаа · 3D"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
      style={{ backgroundColor: "#0d0d0d" }}
    >
      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
        <header className="max-w-3xl">
          <div className="mb-6 flex items-center gap-4">
            <span aria-hidden className="block h-px w-12 bg-gs-red" />
            <span className="eyebrow">05 · Интерактив</span>
          </div>
          <h2
            className="font-sans font-black uppercase tracking-tight text-paper"
            style={{ fontSize: "clamp(2rem,5.5vw,4.5rem)", lineHeight: 0.98, letterSpacing: "-0.025em" }}
          >
            Загварын
            <br />
            <span className="text-gs-red">судалгаа</span>
          </h2>
          <p className="mt-5 max-w-prose text-sm text-graphite sm:text-base">
            Land Cruiser 300-ын аль ч хэсгийг сонгож үзээрэй. GS Auto Center дэх засвар,
            үйлчилгээний дэлгэрэнгүй нээгдэнэ.
          </p>
        </header>

        {/* Canvas wrapper — no box, no border, no inner background.
            The Canvas renders with alpha so the car sits directly on
            the section's dark page color. */}
        <div className="relative mt-10">
          <div className="relative h-[560px] w-full sm:h-[640px] lg:h-[720px]">
            {/* Faint ambient-occlusion CSS halo only — the real shadow
                now comes from the <ContactShadows /> inside the Canvas
                so it tracks the wheels in 3D space. Keep this halo as
                a subtle "lift" against the dark page background. */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2"
              style={{
                bottom: "17%",
                width: "70%",
                height: "120px",
                background:
                  "radial-gradient(ellipse at center, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.16) 40%, rgba(0,0,0,0) 88%)",
                filter: "blur(22px)",
              }}
            />

            <Canvas
              shadows
              dpr={[1, 2]}
              camera={{ position: CAM.exterior.pos, fov: CAM.exterior.fov }}
              gl={{
                alpha: true,
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                // With the overhead RectAreaLight + brown_photostudio
                // HDRI doing the highlight work, we can safely push
                // exposure a touch above neutral so the chrome / rims /
                // grille bars reach the bright specular range without
                // washing out the body crown.
                toneMappingExposure: 1.1,
                outputColorSpace: THREE.SRGBColorSpace,
              }}
              style={{ background: "transparent" }}
            >
              {/* HDRI is the primary light source — drives reflections on
                  the untextured chrome, mirror, rim, and paint materials.
                  Without this, PBR metals read as flat plastic. */}
              <Environment files={HDRI_URL} background={false} />
              <EnvIntensity value={0.9} />

              <CameraRig view={view} />
              <Lighting />

              {/* Real-time contact shadow — tight dark cast under the
                  wheels that anchors the chassis without rendering a
                  visible floor plane. We had a reflective concrete
                  floor here briefly, but it broke the original
                  transparent-canvas aesthetic where the section bg
                  shows directly through; ContactShadows alone keeps
                  the car planted without that "stage" feel. */}
              <ContactShadows
                position={[0, GROUND_Y + 0.01, 0]}
                opacity={0.85}
                scale={10}
                blur={2.2}
                far={2.0}
                resolution={1024}
                color="#000000"
                frames={1}
              />

              <Suspense fallback={null}>
                <LC300Scene
                  view={view}
                  hoveredId={hoveredId}
                  pickedId={pickedId}
                  isolatedHotspot={isolatedHotspot}
                  onHover={setHoveredId}
                  onPick={handlePick}
                  onMeshesReady={setAvailableMeshes}
                />
              </Suspense>
            </Canvas>

            {/* Cinematic loading overlay — sits above the canvas until the
                full GLB streams in, then fades out. */}
            <CinematicLoader />

            {/* Right-aligned side panel for engine-part isolation. Sits above
                the canvas pills but below the BackButton. */}
            <SidePanel hotspot={isolatedHotspot} onClose={handleCloseIsolation} />

            {/* The only UI overlays: pills, camera buttons, back button. */}
            <BackButton
              show={view !== "exterior" || !!isolatedHotspot}
              onClick={handleBack}
            />
            <HotspotLegend
              view={view}
              hoveredId={hoveredId}
              activeId={pickedId}
              availableMeshes={availableMeshes}
              isolating={!!isolatedHotspot}
              onSelect={handlePick}
            />
            <CameraViewButtons view={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {/* Centered modal (used for non-engine hotspots only) */}
      <PartModal hotspot={modalHotspot} onClose={handleCloseModal} />
    </section>
  );
}

useGLTF.preload(MODEL_URL, DRACO_DECODER_URL);
