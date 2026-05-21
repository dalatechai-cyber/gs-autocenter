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
} from "@react-three/drei";
import { useSpring } from "@react-spring/three";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
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
const HDRI_URL = "/hdri/studio_small_01_1k.hdr";
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
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
};

function LC300Scene({ view, hoveredId, pickedId, onHover, onPick }: SceneProps) {
  const { scene } = useGLTF(MODEL_URL, DRACO_DECODER_URL) as unknown as { scene: THREE.Group };

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

  /* PBR material pass — the NLM Superhive source ships untextured metal /
     mirror / chrome / rim materials that rely on HDRI reflections for their
     look. Without per-material metalness/roughness tuning the renderer
     treats them all like generic painted plastic. Here we mutate the
     existing materials in place — no MeshPhysicalMaterial upgrades, no
     forced transmission values — to avoid creating extra shader variants
     or per-material screen-sized transmission passes that can exhaust GPU
     memory and cause WebGL context loss. A WeakSet of touched materials
     prevents re-tuning when the cached scene is remounted. */
  useEffect(() => {
    const tuned = new WeakSet<THREE.Material>();

    const tune = (mat: THREE.Material) => {
      if (tuned.has(mat)) return;
      tuned.add(mat);
      if (!(mat instanceof THREE.MeshStandardMaterial)) return;

      const name = (mat.name ?? "").toLowerCase();

      // Glass is already MeshPhysicalMaterial (loader honors KHR_materials_
      // transmission). Trust the GLB's transmission/ior; just polish.
      if (mat instanceof THREE.MeshPhysicalMaterial && name.includes("glass")) {
        mat.roughness = name.includes("dark") ? 0.08 : 0.03;
        mat.envMapIntensity = 1.3;
        return;
      }

      if (name === "carpaint") {
        // White automotive paint is dielectric (NOT metallic) with a smooth
        // clearcoat shine — high metalness reads as silver chrome. Roughness
        // is low so the HDRI still gives the body a polished sheen.
        mat.metalness = 0.0;
        mat.roughness = 0.15;
        mat.envMapIntensity = 1.5;
      } else if (name === "mirror" || name === "white op") {
        mat.metalness = 1.0;
        mat.roughness = 0.08;
        mat.envMapIntensity = 1.7;
      } else if (name === "metal") {
        mat.metalness = 1.0;
        mat.roughness = 0.16;
        mat.envMapIntensity = 1.5;
      } else if (name === "white") {
        mat.metalness = 0.9;
        mat.roughness = 0.18;
        mat.envMapIntensity = 1.4;
      } else if (name.startsWith("dark metal") || name === "metal gray.001") {
        mat.metalness = 1.0;
        mat.roughness = 0.30;
        mat.envMapIntensity = 1.3;
      } else if (name === "rims") {
        mat.metalness = 1.0;
        mat.roughness = 0.24;
        mat.envMapIntensity = 1.4;
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
  }, [scene]);

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
     a real hood opening. Cubic ease-in-out over 1.2s for cinematic feel. */
  const bonnetRef = useRef<THREE.Object3D | null>(null);
  useEffect(() => {
    bonnetRef.current = scene.getObjectByName("Bonnet_Full") ?? null;
  }, [scene]);

  const [{ hoodRot }, hoodApi] = useSpring(() => ({
    hoodRot: 0,
    config: {
      duration: 1200,
      easing: (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    },
  }));

  useEffect(() => {
    hoodApi.start({ hoodRot: view === "hood" ? Math.PI / 3 : 0 });
  }, [view, hoodApi]);

  useFrame(() => {
    if (bonnetRef.current) bonnetRef.current.rotation.x = hoodRot.get();
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
      const id = meshToId.get(e.object as THREE.Mesh);
      if (id && allowedIds.has(id)) onPick(id);
    },
    [meshToId, onPick, allowedIds],
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

/* ─── Lighting — HDRI carries the PBR, lights are accents ─────────── */
/**
 * The NLM Superhive materials are untextured chrome / metal / mirror /
 * rims — they rely on the HDRI environment for their reflections to
 * read correctly. Previously, heavy directional + spot + rim lights
 * (intensity 2.6 / 2.2 / 12+6) washed the body so flat that metalness
 * couldn't show. The fix: let the HDRI do the work (env intensity ~1.4
 * + ACES tone mapping on the renderer), and keep only small accents
 * here — a soft key for shape definition + a dialled-down red rim for
 * brand identity.
 */
function Lighting() {
  return (
    <>
      {/* Soft key light front-left for shape definition + shadow casting.
          Dialled WAY down from 2.6 so HDRI reflections can show. */}
      <directionalLight
        position={[-3.5, 3, -3.5]}
        intensity={0.7}
        color="#fff8ec"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />

      {/* Brand-red rim from rear, accent only. Reduced 12/6 → 3.5/2
          so the wheel arches don't read as glowing. */}
      <pointLight position={[0, 0.5, 4.8]} intensity={3.5} color="#DC0D01" distance={8} decay={2.0} />
      <pointLight position={[0, -0.4, 3.6]} intensity={2} color="#DC0D01" distance={6} decay={2.0} />
    </>
  );
}

/* ─── HotspotLegend ──────────────────────────────────────────────── */
function HotspotLegend({
  view,
  hoveredId,
  activeId,
  onSelect,
}: {
  view: CameraView;
  hoveredId: string | null;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const visible = view !== "interior";
  const visibleHotspots = LC300_HOTSPOTS.filter((h) => {
    if (view === "exterior") return ["hood", "door_fl", "door_fr", "door_rl", "door_rr", "wheel_fl", "wheel_fr"].includes(h.id);
    if (view === "hood") return ["hood", "engine", "battery", "air_filter", "radiator"].includes(h.id);
    return false;
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

/* ─── VehicleExplorer (section root) ─────────────────────────────── */
export default function VehicleExplorer() {
  const [view, setView] = useState<CameraView>("exterior");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [modalHotspot, setModalHotspot] = useState<Hotspot | null>(null);

  const handlePick = useCallback(
    (id: string) => {
      setPickedId(id);
      const hs = LC300_HOTSPOTS.find((h) => h.id === id);
      if (!hs) return;
      if (id === "hood" && view === "exterior") setView("hood");
      setModalHotspot(hs);
    },
    [view],
  );

  const handleCloseModal = useCallback(() => {
    setModalHotspot(null);
    setPickedId(null);
  }, []);

  const handleBack = useCallback(() => {
    setView("exterior");
    setPickedId(null);
    setModalHotspot(null);
  }, []);

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
            {/* Pure CSS contact shadow — soft oval behind the (transparent)
                canvas, giving the car visual weight without a floor. */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2"
              style={{
                bottom: "14%",
                width: "58%",
                height: "110px",
                background:
                  "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 22%, rgba(0,0,0,0.22) 52%, rgba(0,0,0,0) 78%)",
                filter: "blur(8px)",
              }}
            />

            <Canvas
              shadows
              dpr={[1, 1.8]}
              camera={{ position: CAM.exterior.pos, fov: CAM.exterior.fov }}
              gl={{
                alpha: true,
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.05,
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

              <Suspense fallback={null}>
                <LC300Scene
                  view={view}
                  hoveredId={hoveredId}
                  pickedId={pickedId}
                  onHover={setHoveredId}
                  onPick={handlePick}
                />
              </Suspense>
            </Canvas>

            {/* Cinematic loading overlay — sits above the canvas until the
                full GLB streams in, then fades out. */}
            <CinematicLoader />

            {/* The only UI overlays: pills, camera buttons, back button */}
            <BackButton show={view !== "exterior"} onClick={handleBack} />
            <HotspotLegend
              view={view}
              hoveredId={hoveredId}
              activeId={pickedId}
              onSelect={handlePick}
            />
            <CameraViewButtons view={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {/* Centered modal */}
      <PartModal hotspot={modalHotspot} onClose={handleCloseModal} />
    </section>
  );
}

useGLTF.preload(MODEL_URL, DRACO_DECODER_URL);
