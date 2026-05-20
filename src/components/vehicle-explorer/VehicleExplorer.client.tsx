"use client";

import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  useGLTF,
  Html,
  useProgress,
  ContactShadows,
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
const MODEL_URL =
  process.env.NEXT_PUBLIC_LC300_MODEL_URL ?? "/models/lc300-ready.glb";
const HDRI_URL = "/hdri/studio_small_01_1k.hdr";

export type CameraView = "exterior" | "hood" | "interior";

/**
 * Camera presets in Three.js world space.
 * Car is auto-centered; geometric center sits near (0, -0.7, 0).
 * Car front is +Z, left is -X.
 * Approximate scene extents: X ±1.1, Y -1.35..−0.05, Z ±2.25
 */
const CAM: Record<CameraView, { pos: [number, number, number]; look: [number, number, number]; fov: number }> = {
  exterior: { pos: [-2.8, 1.6, 6.2], look: [0, -0.4, 0], fov: 38 },
  hood:     { pos: [-0.3, 2.6, 2.6], look: [0, -0.1, 1.8], fov: 44 },
  interior: { pos: [-0.6, -0.42, -0.3], look: [0, -0.2, 1.4], fov: 62 },
};

/* ─── Loader ─────────────────────────────────────────────────────── */
function Loader() {
  const { progress, active } = useProgress();
  return (
    <Html center>
      <div
        style={{
          width: "min(260px,58vw)",
          color: "#E7E7E7",
          fontFamily: "var(--font-sans),system-ui,sans-serif",
          textAlign: "center",
          userSelect: "none",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#DC0D01",
            marginBottom: 12,
          }}
        >
          {active ? "Загварчилж байна" : "Бэлэн"}
        </div>
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.10)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${progress}%`,
              background: "#DC0D01",
              transition: "width 100ms linear",
            }}
          />
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            fontVariantNumeric: "tabular-nums",
            color: "#5A5860",
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>
    </Html>
  );
}

/* ─── CameraRig — smooth cinematic transitions ───────────────────── */
function CameraRig({ view }: { view: CameraView }) {
  const { camera } = useThree();
  const lookAtRef = useRef(new THREE.Vector3(...CAM.exterior.look));

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = CAM[view].fov;
    cam.updateProjectionMatrix();
  }, [view, camera]);

  useFrame((state, delta) => {
    const preset = CAM[view];
    // Frame-rate independent lerp: ~2s cinematic transition
    const α = 1 - Math.pow(0.004, delta);
    state.camera.position.lerp(
      new THREE.Vector3(...preset.pos),
      α,
    );
    lookAtRef.current.lerp(new THREE.Vector3(...preset.look), α);
    state.camera.lookAt(lookAtRef.current);
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
  const { scene } = useGLTF(MODEL_URL) as unknown as { scene: THREE.Group };
  const groupRef = useRef<THREE.Group>(null);

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

  /* store original emissive so we can restore on unhover */
  const origEmissive = useMemo(() => {
    const map = new Map<THREE.Mesh, { color: THREE.Color; intensity: number }>();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        const std = mat as THREE.MeshStandardMaterial;
        if (!std?.emissive) return;
        map.set(mesh, { color: std.emissive.clone(), intensity: std.emissiveIntensity ?? 0 });
      });
    });
    return map;
  }, [scene]);

  /* emissive glow on hover/pick — only when in correct camera view */
  const allowedIds = useMemo<Set<string>>(() => {
    if (view === "hood") return new Set(["hood", "engine", "battery", "air_filter", "radiator"]);
    if (view === "exterior") return new Set(["door_fl", "door_fr", "door_rl", "door_rr", "wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr", "hood"]);
    return new Set();
  }, [view]);

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
          const strength = id === pickedId ? 0.45 : 0.22;
          std.emissive.setRGB(strength, 0.04 * strength, 0.04 * strength);
          std.emissiveIntensity = 1;
        } else {
          std.emissive.copy(orig.color);
          std.emissiveIntensity = orig.intensity;
        }
      });
    });
  }, [hoveredId, pickedId, view, scene, meshToId, origEmissive, allowedIds]);

  /* hood spring animation — opens when view === "hood" */
  const hoodPivotRef = useRef<THREE.Group | null>(null);
  const hoodAxisRef = useRef<"x" | "z">("z");
  const hoodSignRef = useRef<number>(1);

  useEffect(() => {
    const hood = scene.getObjectByName("Hood");
    if (!hood || hood.userData.__repivoted) return;
    const sceneBox = new THREE.Box3().setFromObject(scene);
    const sceneCenter = sceneBox.getCenter(new THREE.Vector3());
    const sceneSize = sceneBox.getSize(new THREE.Vector3());
    const hoodBox = new THREE.Box3().setFromObject(hood);
    const hoodCenter = hoodBox.getCenter(new THREE.Vector3());
    const fwdAxis: "x" | "z" = sceneSize.x > sceneSize.z ? "x" : "z";
    const fwdSign = Math.sign(hoodCenter[fwdAxis] - sceneCenter[fwdAxis]) || 1;
    const pivotWorld = new THREE.Vector3(
      fwdAxis === "x" ? (fwdSign > 0 ? hoodBox.max.x : hoodBox.min.x) : hoodCenter.x,
      hoodCenter.y,
      fwdAxis === "z" ? (fwdSign > 0 ? hoodBox.max.z : hoodBox.min.z) : hoodCenter.z,
    );
    const pivot = new THREE.Group();
    pivot.name = "__hoodPivot";
    pivot.position.copy(pivotWorld);
    hood.parent?.add(pivot);
    pivot.attach(hood);
    hoodPivotRef.current = pivot;
    hoodAxisRef.current = fwdAxis === "x" ? "z" : "x";
    hoodSignRef.current = -fwdSign;
    hood.userData.__repivoted = true;
  }, [scene]);

  const [{ hoodRot }, hoodApi] = useSpring(() => ({
    hoodRot: 0,
    config: { mass: 1.2, tension: 100, friction: 22 },
  }));

  useEffect(() => {
    hoodApi.start({ hoodRot: view === "hood" ? (Math.PI / 180) * 58 : 0 });
  }, [view, hoodApi]);

  useFrame(() => {
    const pivot = hoodPivotRef.current;
    if (!pivot) return;
    const v = hoodRot.get() * hoodSignRef.current;
    pivot.rotation.set(0, 0, 0);
    pivot.rotation[hoodAxisRef.current] = v;
  });

  /* centering + fit */
  const { centerOffset, fitScale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { centerOffset: center.clone().negate(), fitScale: 4.5 / maxDim };
  }, [scene]);

  /* pointer events */
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
    <group ref={groupRef} scale={fitScale} position={[0, -0.7, 0]}>
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

/* ─── Lighting ───────────────────────────────────────────────────── */
function Lighting() {
  return (
    <>
      {/* Soft ambient fill */}
      <ambientLight intensity={0.18} color="#e8eaf0" />
      {/* Key light — soft white from front-left above */}
      <directionalLight
        position={[-3, 4, 5]}
        intensity={1.8}
        color="#f5f6ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      {/* Fill — soft blue-grey from right */}
      <directionalLight position={[4, 2, 2]} intensity={0.55} color="#d0d8f0" />
      {/* Rim — GS brand red from behind/below */}
      <pointLight position={[0, -0.5, -4.5]} intensity={14} color="#DC0D01" distance={10} decay={2} />
      {/* Top fill strip — simulates studio softbox */}
      <directionalLight position={[0, 8, 0]} intensity={0.6} color="#ffffff" />
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
                  : "border-charcoal/50 bg-ink/55 text-paper/75 hover:border-gs-red/50 hover:text-paper"
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
            : "border-charcoal/60 bg-ink/60 text-paper/80 hover:border-gs-red/60 hover:text-paper"
        }`}
      >
        <span aria-hidden className="block size-1 bg-current opacity-70" />
        {view === "hood" ? "Хаах" : "Капот нээх"}
      </button>
      <button
        type="button"
        onClick={() => onViewChange("interior")}
        className="flex items-center gap-2 border border-charcoal/60 bg-ink/60 px-3 py-2 text-[9.5px] font-medium uppercase tracking-[0.18em] text-paper/80 backdrop-blur-md transition-all duration-200 hover:border-gs-red/60 hover:text-paper"
      >
        <span aria-hidden className="block size-1 bg-gs-red" />
        Салон
      </button>
    </div>
  );
}

/* ─── HudCorner ──────────────────────────────────────────────────── */
function HudCorner({ view, hoveredHotspot }: { view: CameraView; hoveredHotspot: Hotspot | null }) {
  const viewLabel: Record<CameraView, string> = {
    exterior: "Гадна тал",
    hood: "Хөдөлгүүр",
    interior: "Салон",
  };
  return (
    <>
      <div className="pointer-events-none absolute left-5 top-5 z-10 select-none sm:left-7 sm:top-7">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
          03 · TOYOTA
        </div>
        <div className="mt-1 font-wordmark text-xl uppercase tracking-tight text-paper sm:text-2xl">
          Land Cruiser 300
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-graphite">
          {viewLabel[view]}
        </div>
      </div>

      <div className="pointer-events-none absolute right-5 top-5 z-10 max-w-[55%] select-none text-right sm:right-7 sm:top-7">
        <div className="text-[9px] uppercase tracking-[0.22em] text-graphite">Хэсгийн нэр</div>
        <div
          className={`mt-1 font-wordmark text-sm uppercase tracking-tight transition-colors duration-150 ${
            hoveredHotspot ? "text-gs-red" : "text-paper/30"
          }`}
        >
          {hoveredHotspot?.name ?? "·"}
        </div>
      </div>

      {/* Corner brackets */}
      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <CornerBracket position="bl" />
      <CornerBracket position="br" />
    </>
  );
}

function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const cls: Record<typeof position, string> = {
    tl: "left-3 top-3 border-l border-t",
    tr: "right-3 top-3 border-r border-t",
    bl: "left-3 bottom-3 border-l border-b",
    br: "right-3 bottom-3 border-r border-b",
  };
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute size-5 border-gs-red/60 ${cls[position]}`}
    />
  );
}

/* ─── BackButton ─────────────────────────────────────────────────── */
function BackButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Буцах"
      className={`absolute left-5 top-5 z-50 flex items-center gap-2 border border-charcoal/70 bg-ink/85 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-paper backdrop-blur-sm transition-all duration-300 hover:border-gs-red hover:text-gs-red sm:left-7 sm:top-7 ${
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
        className={`fixed inset-0 z-30 bg-ink/65 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal={open}
        aria-label={hotspot?.name ?? ""}
        className={`fixed left-1/2 top-1/2 z-40 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 border border-charcoat/70 bg-ink-raised/96 p-7 backdrop-blur-xl transition-all duration-300 ease-out sm:max-w-md sm:p-8 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: open ? "0 0 80px -15px rgba(220,13,1,0.30)" : "none",
        }}
      >
        {hotspot && (
          <>
            {/* Corner brackets */}
            <span aria-hidden className="absolute left-2 top-2 size-4 border-l border-t border-gs-red/40" />
            <span aria-hidden className="absolute right-2 top-2 size-4 border-r border-t border-gs-red/40" />
            <span aria-hidden className="absolute bottom-2 left-2 size-4 border-b border-l border-gs-red/40" />
            <span aria-hidden className="absolute bottom-2 right-2 size-4 border-b border-r border-gs-red/40" />

            {/* Close */}
            <button
              type="button"
              aria-label="Хаах"
              onClick={onClose}
              className="absolute right-4 top-4 flex size-8 items-center justify-center border border-charcoal/60 text-graphite transition-colors hover:border-gs-red hover:text-gs-red"
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
                <li
                  key={label}
                  className="flex items-start gap-2 text-[10px] uppercase tracking-[0.14em] text-paper/70"
                >
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
              <span
                aria-hidden
                className="block size-2.5 origin-center rotate-45 border-r border-t border-snow/80 transition-transform group-hover/cta:translate-x-1"
              />
            </a>
          </>
        )}
      </div>
    </>
  );
}

/* ─── InteriorOverlay ────────────────────────────────────────────── */
function InteriorOverlay({ show }: { show: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="text-center">
        <div className="text-[9px] uppercase tracking-[0.28em] text-gs-red">Салоны тойм</div>
        <div className="mt-2 font-wordmark text-2xl uppercase tracking-tight text-paper/60">
          Premium Interior
        </div>
        <p className="mt-3 max-w-xs text-[11px] leading-relaxed text-graphite">
          Арьсан суудал, ойлоор бүрсэн тааз, тоон дэлгэц бүхий тансаг дотоод засал.
        </p>
      </div>
    </div>
  );
}

/* ─── VehicleExplorer ────────────────────────────────────────────── */
export default function VehicleExplorer() {
  const [view, setView] = useState<CameraView>("exterior");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [modalHotspot, setModalHotspot] = useState<Hotspot | null>(null);

  const pickedHotspot = useMemo(
    () => LC300_HOTSPOTS.find((h) => h.id === pickedId) ?? null,
    [pickedId],
  );

  const handlePick = useCallback(
    (id: string) => {
      setPickedId(id);
      const hs = LC300_HOTSPOTS.find((h) => h.id === id);
      if (!hs) return;
      // Hood click in exterior → go to hood camera
      if (id === "hood" && view === "exterior") {
        setView("hood");
      }
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
      className="relative overflow-hidden bg-ink py-20 sm:py-24 lg:py-28"
    >
      {/* Background radial */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.20]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 35%,rgba(220,13,1,0.15),transparent 58%),linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.025) 1px,transparent 1px)",
          backgroundSize: "100% 100%,96px 96px,96px 96px",
        }}
      />

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

        <div className="relative mt-10 border border-charcoal/50 bg-[#050507]">
          <div className="relative h-[560px] w-full sm:h-[640px] lg:h-[720px]">
            <Canvas
              shadows
              dpr={[1, 1.8]}
              camera={{ position: CAM.exterior.pos, fov: CAM.exterior.fov }}
              gl={{
                antialias: true,
                powerPreference: "high-performance",
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.2,
              }}
              style={{ background: "transparent" }}
            >
              {/* HDRI for environment reflections (background hidden) */}
              <Environment files={HDRI_URL} background={false} />

              {/* Cinematic camera transitions */}
              <CameraRig view={view} />

              {/* Lighting rig */}
              <Lighting />

              <Suspense fallback={<Loader />}>
                <LC300Scene
                  view={view}
                  hoveredId={hoveredId}
                  pickedId={pickedId}
                  onHover={setHoveredId}
                  onPick={handlePick}
                />
                <ContactShadows
                  position={[0, -1.38, 0]}
                  opacity={0.7}
                  scale={10}
                  blur={2.8}
                  far={2}
                  color="#000000"
                />
                {/* Subtle ground reflection plane */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.38, 0]} receiveShadow>
                  <planeGeometry args={[20, 20]} />
                  <meshStandardMaterial
                    color="#050507"
                    metalness={0.9}
                    roughness={0.4}
                    envMapIntensity={0.3}
                  />
                </mesh>
              </Suspense>
            </Canvas>

            {/* HUD overlays */}
            <HudCorner
              view={view}
              hoveredHotspot={LC300_HOTSPOTS.find((h) => h.id === hoveredId) ?? null}
            />
            <BackButton show={view !== "exterior"} onClick={handleBack} />
            <HotspotLegend
              view={view}
              hoveredId={hoveredId}
              activeId={pickedId}
              onSelect={handlePick}
            />
            <CameraViewButtons view={view} onViewChange={setView} />
            <InteriorOverlay show={view === "interior"} />
          </div>
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-graphite/50">
          LC300 model · interactive 3D explorer · GS Auto Center
        </p>
      </div>

      {/* Part information modal */}
      <PartModal hotspot={modalHotspot} onClose={handleCloseModal} />
    </section>
  );
}

useGLTF.preload(MODEL_URL);
