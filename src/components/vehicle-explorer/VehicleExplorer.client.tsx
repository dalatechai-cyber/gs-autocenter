"use client";

import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  useProgress,
  ContactShadows,
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

type IsolationState = "idle" | "isolating" | "isolated" | "restoring";

/* ─── Loader ─────────────────────────────────────────────────────── */
function Loader() {
  const { progress, active } = useProgress();
  return (
    <Html center>
      <div
        style={{
          width: "min(280px,60vw)",
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
            height: 2,
            background: "rgba(255,255,255,0.08)",
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
              transition: "width 120ms linear",
            }}
          />
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            fontVariantNumeric: "tabular-nums",
            color: "#8A878D",
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>
    </Html>
  );
}

/* ─── material helpers ───────────────────────────────────────────── */
function precloneMaterials(scene: THREE.Group) {
  scene.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (Array.isArray(mesh.material)) {
      mesh.material = (mesh.material as THREE.MeshStandardMaterial[]).map((m: THREE.MeshStandardMaterial) => {
        const c = m.clone();
        return c;
      });
    } else if (mesh.material) {
      mesh.material = (mesh.material as THREE.MeshStandardMaterial).clone();
    }
  });
}

function dimScene(scene: THREE.Group) {
  scene.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const applyTo = (mat: THREE.MeshStandardMaterial) => {
      if (mat.userData.__dimmed) return;
      mat.userData.__origOpacity = mat.opacity;
      mat.userData.__origTransparent = mat.transparent;
      mat.userData.__dimmed = true;
      mat.transparent = true;
      mat.opacity = 0.1;
    };
    if (Array.isArray(mesh.material)) {
      (mesh.material as THREE.MeshStandardMaterial[]).forEach(applyTo);
    } else if (mesh.material) {
      applyTo(mesh.material as THREE.MeshStandardMaterial);
    }
  });
}

function undimScene(scene: THREE.Group) {
  scene.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const restore = (mat: THREE.MeshStandardMaterial) => {
      if (!mat.userData.__dimmed) return;
      mat.opacity = mat.userData.__origOpacity as number;
      mat.transparent = mat.userData.__origTransparent as boolean;
      mat.userData.__dimmed = false;
    };
    if (Array.isArray(mesh.material)) {
      (mesh.material as THREE.MeshStandardMaterial[]).forEach(restore);
    } else if (mesh.material) {
      restore(mesh.material as THREE.MeshStandardMaterial);
    }
  });
}

/* ─── LC300Stage ─────────────────────────────────────────────────── */
type LC300StageProps = {
  isolationState: IsolationState;
  pickedHotspot: Hotspot | null;
  hoveredId: string | null;
  pickedId: string | null;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
  onIsolationSettled: () => void;
  onRestoreSettled: () => void;
};

function LC300Stage({
  isolationState,
  pickedHotspot,
  hoveredId,
  pickedId,
  onHover,
  onPick,
  onIsolationSettled,
  onRestoreSettled,
}: LC300StageProps) {
  const { scene } = useGLTF(MODEL_URL) as unknown as { scene: THREE.Group };
  const { scene: threeScene } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  /* pre-clone materials once */
  const materialsCloned = useRef(false);
  useEffect(() => {
    if (!materialsCloned.current) {
      precloneMaterials(scene);
      materialsCloned.current = true;
    }
  }, [scene]);

  /* mesh → hotspot id map */
  const meshToId = useMemo(() => {
    const m = new Map<THREE.Mesh, string>();
    scene.traverse((obj: THREE.Object3D) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        const id = findHotspotId(cur.name, LC300_HOTSPOTS);
        if (id) {
          m.set(obj as THREE.Mesh, id);
          return;
        }
        cur = cur.parent;
      }
    });
    return m;
  }, [scene]);

  /* store original emissive per mesh */
  const origEmissive = useMemo(() => {
    const map = new Map<THREE.Mesh, { color: THREE.Color; intensity: number }>();
    scene.traverse((obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) return;
      if (!mat.emissive) mat.emissive = new THREE.Color(0x000000);
      map.set(mesh, {
        color: mat.emissive.clone(),
        intensity: mat.emissiveIntensity ?? 1,
      });
    });
    return map;
  }, [scene]);

  /* emissive highlights on hover/pick */
  useEffect(() => {
    if (isolationState !== "idle") return;
    scene.traverse((obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.emissive) return;
      const id = meshToId.get(mesh);
      const orig = origEmissive.get(mesh);
      if (!orig) return;
      if (id && (id === hoveredId || id === pickedId)) {
        const strength = id === pickedId ? 0.55 : 0.32;
        mat.emissive.setRGB(strength, 0.04 * strength, 0.04 * strength);
        mat.emissiveIntensity = 1;
      } else {
        mat.emissive.copy(orig.color);
        mat.emissiveIntensity = orig.intensity;
      }
    });
  }, [hoveredId, pickedId, scene, meshToId, origEmissive, isolationState]);

  /* ── isolation state refs ── */
  const isolatedObjRef = useRef<THREE.Object3D | null>(null);
  const origParentRef = useRef<THREE.Object3D | null>(null);
  const startPosRef = useRef(new THREE.Vector3());
  const startScaleRef = useRef(new THREE.Vector3());

  /* ── spring ── */
  const settledCbRef = useRef<() => void>(() => undefined);
  const [{ t }, springApi] = useSpring(() => ({
    t: 0,
    config: { mass: 1, tension: 90, friction: 18 },
  }));

  /* ── begin isolation ── */
  const prevIsolationState = useRef<IsolationState>("idle");
  useEffect(() => {
    const prev = prevIsolationState.current;
    prevIsolationState.current = isolationState;

    if (isolationState === "isolating" && prev === "idle" && pickedHotspot?.isolate) {
      const objName = pickedHotspot.isolate;
      const obj = scene.getObjectByName(objName) ?? groupRef.current?.getObjectByName(objName) ?? null;
      if (!obj) {
        onIsolationSettled();
        return;
      }

      /* record world transform */
      obj.getWorldPosition(startPosRef.current);
      obj.getWorldScale(startScaleRef.current);

      /* detach to scene root */
      origParentRef.current = obj.parent;
      threeScene.attach(obj);
      isolatedObjRef.current = obj;

      /* dim rest of scene */
      dimScene(scene); // dim everything (isolated obj is now at scene root, not in scene group)

      /* spring: 0 → 1 */
      settledCbRef.current = onIsolationSettled;
      springApi.set({ t: 0 });
      springApi.start({ t: 1, onRest: () => settledCbRef.current() });
    }

    if (isolationState === "restoring" && (prev === "isolated" || prev === "isolating")) {
      const obj = isolatedObjRef.current;
      if (!obj) {
        undimScene(scene);
        onRestoreSettled();
        return;
      }

      /* spring: 1 → 0 */
      settledCbRef.current = () => {
        const parent = origParentRef.current;
        if (parent && obj) {
          parent.attach(obj);
        }
        undimScene(scene);
        isolatedObjRef.current = null;
        origParentRef.current = null;
        onRestoreSettled();
      };
      springApi.start({ t: 0, onRest: () => settledCbRef.current() });
    }
  }, [
    isolationState,
    pickedHotspot,
    scene,
    threeScene,
    springApi,
    onIsolationSettled,
    onRestoreSettled,
  ]);

  /* ── per-frame animation ── */
  useFrame((_state: unknown, delta: number) => {
    const obj = isolatedObjRef.current;

    /* idle car rotation */
    if (
      groupRef.current &&
      isolationState === "idle" &&
      !hoveredId &&
      !pickedId
    ) {
      groupRef.current.rotation.y += delta * 0.12;
    }

    /* isolating: lerp obj to center + scale up */
    if ((isolationState === "isolating" || isolationState === "restoring") && obj) {
      const tv = t.get();
      obj.position.lerpVectors(startPosRef.current, new THREE.Vector3(0, 0, 0), tv);
      const baseScale = startScaleRef.current.clone();
      const factor = 1 + 0.5 * tv;
      obj.scale.set(
        baseScale.x * factor,
        baseScale.y * factor,
        baseScale.z * factor,
      );
    }

    /* isolated: slow spin */
    if (isolationState === "isolated" && obj) {
      obj.rotation.y += delta * 0.5;
    }
  });

  /* ── centering / fitting ── */
  const { centerOffset, fitScale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { centerOffset: center.clone().negate(), fitScale: 4.5 / maxDim };
  }, [scene]);

  /* ── pointer events ── */
  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (isolationState !== "idle") return;
      const id = meshToId.get(e.object as THREE.Mesh);
      if (id) {
        onHover(id);
        document.body.style.cursor = "pointer";
      }
    },
    [meshToId, onHover, isolationState],
  );

  const handlePointerOut = useCallback(() => {
    onHover(null);
    document.body.style.cursor = "";
  }, [onHover]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (isolationState !== "idle") return;
      const id = meshToId.get(e.object as THREE.Mesh);
      if (id) onPick(id);
    },
    [meshToId, onPick, isolationState],
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

/* ─── CornerBracket ──────────────────────────────────────────────── */
function CornerBracket({
  position,
  color = "border-gs-red/70",
}: {
  position: "tl" | "tr" | "bl" | "br";
  color?: string;
}) {
  const map: Record<typeof position, string> = {
    tl: "left-3 top-3 border-l border-t",
    tr: "right-3 top-3 border-r border-t",
    bl: "left-3 bottom-3 border-l border-b",
    br: "right-3 bottom-3 border-r border-b",
  };
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute size-5 ${color} ${map[position]}`}
    />
  );
}

/* ─── HudCorner ──────────────────────────────────────────────────── */
function HudCorner({
  hoveredHotspot,
  hidden,
}: {
  hoveredHotspot: Hotspot | null;
  hidden: boolean;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-300 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* top-left label */}
      <div className="absolute left-5 top-5 select-none sm:left-7 sm:top-7">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
          03 · TOYOTA
        </div>
        <div className="mt-1 font-wordmark text-xl uppercase tracking-tight text-paper sm:text-2xl">
          Land Cruiser 300
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-graphite">
          Toyota · GR Sport
        </div>
      </div>

      {/* top-right hovered name */}
      <div className="absolute right-5 top-5 max-w-[55%] select-none text-right sm:right-7 sm:top-7">
        <div className="text-[9px] uppercase tracking-[0.22em] text-graphite">
          Хэсгийн нэр
        </div>
        <div
          className={`mt-1 font-wordmark text-base uppercase tracking-tight transition-colors duration-150 ${
            hoveredHotspot ? "text-gs-red" : "text-paper/40"
          }`}
        >
          {hoveredHotspot?.name ?? "·"}
        </div>
      </div>

      {/* bottom-left hint */}
      <div className="absolute bottom-5 left-5 flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-graphite sm:bottom-7 sm:left-7">
        <span className="block size-1 animate-pulse bg-gs-red" />
        Чирж эргүүл · хуруугаар томруул · хэсэг сонго
      </div>

      {/* corner brackets */}
      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <CornerBracket position="bl" />
      <CornerBracket position="br" />
    </div>
  );
}

/* ─── HotspotLegend ──────────────────────────────────────────────── */
function HotspotLegend({
  activeId,
  hoveredId,
  onSelect,
  disabled,
}: {
  activeId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`absolute inset-x-3 bottom-3 z-10 flex flex-wrap justify-center gap-1.5 transition-opacity duration-300 sm:gap-2 ${
        disabled ? "pointer-events-none opacity-30" : "opacity-100"
      }`}
    >
      {LC300_HOTSPOTS.map((h) => {
        const isActive = h.id === activeId;
        const isHover = h.id === hoveredId;
        return (
          <button
            key={h.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(h.id)}
            className={`flex items-center gap-2 border px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.16em] backdrop-blur-md transition-colors duration-150 ease-out sm:text-[10px] ${
              isActive
                ? "border-gs-red bg-gs-red text-snow"
                : isHover
                  ? "border-gs-red/70 bg-ink/60 text-paper"
                  : "border-charcoal/60 bg-ink/55 text-paper/80 hover:border-gs-red/60 hover:text-paper"
            }`}
          >
            <span
              aria-hidden
              className={`block size-1 ${isActive ? "bg-snow" : "bg-gs-red"}`}
            />
            {h.name}
          </button>
        );
      })}
    </div>
  );
}

/* ─── BackButton ─────────────────────────────────────────────────── */
function BackButton({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Буцах"
      className={`absolute left-5 top-5 z-50 flex items-center gap-2 border border-charcoal/70 bg-ink/80 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-paper backdrop-blur-sm transition-all duration-300 hover:border-gs-red hover:text-gs-red sm:left-7 sm:top-7 ${
        visible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none -translate-x-4 opacity-0"
      }`}
    >
      ← Буцах
    </button>
  );
}

/* ─── PartModal ──────────────────────────────────────────────────── */
function PartModal({
  hotspot,
  onClose,
}: {
  hotspot: Hotspot | null;
  onClose: () => void;
}) {
  const open = !!hotspot;
  return (
    <>
      {/* backdrop */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-ink/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* modal card */}
      <div
        role="dialog"
        aria-modal={open}
        aria-label={hotspot?.name ?? "Хэсгийн мэдээлэл"}
        className={`fixed left-1/2 top-1/2 z-40 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 border border-charcoal/70 bg-ink-raised/95 p-7 backdrop-blur-xl transition-all duration-300 ease-out sm:max-w-md sm:p-8 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {hotspot && (
          <>
            {/* corner brackets */}
            <span
              aria-hidden
              className="absolute left-2 top-2 size-4 border-l border-t border-gs-red/50"
            />
            <span
              aria-hidden
              className="absolute right-2 top-2 size-4 border-r border-t border-gs-red/50"
            />
            <span
              aria-hidden
              className="absolute bottom-2 left-2 size-4 border-b border-l border-gs-red/50"
            />
            <span
              aria-hidden
              className="absolute bottom-2 right-2 size-4 border-b border-r border-gs-red/50"
            />

            {/* close button */}
            <button
              type="button"
              aria-label="Хаах"
              onClick={onClose}
              className="absolute right-4 top-4 flex size-8 items-center justify-center border border-charcoal/70 text-paper transition-colors hover:border-gs-red hover:text-gs-red"
            >
              <span aria-hidden className="absolute block h-px w-4 rotate-45 bg-current" />
              <span aria-hidden className="absolute block h-px w-4 -rotate-45 bg-current" />
            </button>

            {/* eyebrow */}
            <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
              LC 300 · хэсэг
            </div>

            {/* part name */}
            <h3 className="font-wordmark text-3xl uppercase tracking-tight text-paper">
              {hotspot.name}
            </h3>

            {/* description */}
            <p className="mt-3 text-sm leading-relaxed text-paper/80">
              {hotspot.desc}
            </p>

            {/* feature bullets */}
            <ul className="mt-5 grid grid-cols-2 gap-2.5 border-t border-charcoal/60 pt-5">
              {[
                "Анхдагч эд анги",
                "Мэргэшсэн мастер",
                "Чанарын баталгаа",
                "Шуурхай үйлчилгээ",
              ].map((label) => (
                <li
                  key={label}
                  className="flex items-start gap-2 text-[10.5px] uppercase tracking-[0.14em] text-paper/80"
                >
                  <span aria-hidden className="mt-0.5 block size-1 shrink-0 bg-gs-red" />
                  {label}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={PHONE_HREF}
              className="group/cta mt-6 flex items-center justify-between gap-3 border border-gs-red bg-gs-red px-5 py-4 text-snow transition-colors duration-150 hover:border-gs-red/80 hover:bg-gs-red/90"
            >
              <span className="flex flex-col items-start">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-75">
                  Цаг захиалах
                </span>
                <span className="font-wordmark text-lg uppercase tracking-tight">
                  {PHONE_DISPLAY}
                </span>
              </span>
              <span
                aria-hidden
                className="block size-2.5 origin-center rotate-45 border-r border-t border-snow transition-transform duration-150 group-hover/cta:translate-x-1"
              />
            </a>
          </>
        )}
      </div>
    </>
  );
}

/* ─── VehicleExplorer (section root) ────────────────────────────── */
export default function VehicleExplorer() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [isolationState, setIsolationState] = useState<IsolationState>("idle");

  const pickedHotspot = useMemo(
    () => LC300_HOTSPOTS.find((h) => h.id === pickedId) ?? null,
    [pickedId],
  );

  /* picking a hotspot triggers isolation if it has an isolate target */
  const handlePick = useCallback(
    (id: string) => {
      if (isolationState !== "idle") return;
      setPickedId(id);
      const hs = LC300_HOTSPOTS.find((h) => h.id === id);
      if (hs?.isolate) {
        setIsolationState("isolating");
      }
    },
    [isolationState],
  );

  const handleIsolationSettled = useCallback(() => {
    setIsolationState("isolated");
  }, []);

  const handleRestore = useCallback(() => {
    if (isolationState === "isolated" || isolationState === "isolating") {
      setIsolationState("restoring");
    }
  }, [isolationState]);

  const handleRestoreSettled = useCallback(() => {
    setPickedId(null);
    setIsolationState("idle");
  }, []);

  const isIsolating = isolationState !== "idle";

  return (
    <section
      id="explorer"
      aria-label="Загварын судалгаа · 3D"
      className="relative overflow-hidden bg-ink py-20 sm:py-24 lg:py-28"
    >
      {/* background texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 30%,rgba(220,13,1,0.18),transparent 60%),linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize: "100% 100%,96px 96px,96px 96px",
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
        {/* section header */}
        <header className="max-w-3xl">
          <div className="mb-6 flex items-center gap-4">
            <span aria-hidden className="block h-px w-12 bg-gs-red" />
            <span className="eyebrow">05 · Интерактив</span>
          </div>
          <h2
            className="font-sans font-black uppercase tracking-tight text-paper"
            style={{
              fontSize: "clamp(2rem,5.5vw,4.5rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.025em",
            }}
          >
            Загварын
            <br />
            <span className="text-gs-red">судалгаа</span>
          </h2>
          <p className="mt-5 max-w-prose text-sm text-graphite sm:text-base">
            Land Cruiser 300-ын аль ч хэсгийг сонгож үзээрэй. GS Auto Center
            дэх засвар, үйлчилгээний дэлгэрэнгүй нээгдэнэ.
          </p>
        </header>

        {/* canvas wrapper */}
        <div className="relative mt-10 border border-charcoal/60 bg-gradient-to-b from-ink-raised to-ink">
          <div className="relative h-[560px] w-full sm:h-[640px] lg:h-[720px]">
            <Canvas
              shadows
              dpr={[1, 1.6]}
              camera={{ position: [3.6, 1.8, 8], fov: 36 }}
              gl={{ antialias: true, powerPreference: "high-performance" }}
              style={{ background: "transparent", touchAction: "none" }}
            >
              {/* lighting */}
              <ambientLight intensity={0.35} />
              <hemisphereLight
                args={[0xffffff, 0x111111, 0.35]}
                position={[0, 10, 0]}
              />
              <spotLight
                position={[0, 8, 0]}
                angle={0.6}
                penumbra={0.7}
                intensity={3.2}
                color="#ff3a2a"
                castShadow
              />
              <directionalLight
                position={[5, 6, 5]}
                intensity={1.1}
                color="#ffffff"
              />
              <directionalLight
                position={[-5, 3, -3]}
                intensity={0.55}
                color="#7a8aff"
              />

              <Suspense fallback={<Loader />}>
                <LC300Stage
                  isolationState={isolationState}
                  pickedHotspot={pickedHotspot}
                  hoveredId={hoveredId}
                  pickedId={pickedId}
                  onHover={setHoveredId}
                  onPick={handlePick}
                  onIsolationSettled={handleIsolationSettled}
                  onRestoreSettled={handleRestoreSettled}
                />
                <ContactShadows
                  position={[0, -1.05, 0]}
                  opacity={0.55}
                  scale={12}
                  blur={2.4}
                  far={3}
                  color="#000000"
                />
              </Suspense>

              <OrbitControls
                enabled={isolationState === "idle"}
                enablePan={false}
                minDistance={4}
                maxDistance={14}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2.05}
                enableDamping
                dampingFactor={0.08}
              />
            </Canvas>

            {/* HUD (hidden during isolation) */}
            <HudCorner
              hoveredHotspot={
                LC300_HOTSPOTS.find((h) => h.id === hoveredId) ?? null
              }
              hidden={isIsolating}
            />

            {/* back button (visible during isolation) */}
            <BackButton visible={isIsolating} onClick={handleRestore} />

            {/* legend pills */}
            <HotspotLegend
              activeId={pickedId}
              hoveredId={hoveredId}
              onSelect={handlePick}
              disabled={isIsolating}
            />
          </div>
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-graphite">
          LC300 model · GS Auto Center · Interactive parts explorer
        </p>
      </div>

      {/* centered modal + backdrop */}
      <PartModal
        hotspot={isolationState === "isolated" ? pickedHotspot : null}
        onClose={handleRestore}
      />
    </section>
  );
}

useGLTF.preload(MODEL_URL);
