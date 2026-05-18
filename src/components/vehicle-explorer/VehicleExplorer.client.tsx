"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  useProgress,
  ContactShadows,
} from "@react-three/drei";
import { useSpring } from "@react-spring/three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  LC200_HOTSPOTS,
  LX570_HOTSPOTS,
  findHotspotId,
  type Hotspot,
} from "./hotspots";
import { PHONE_HREF, PHONE_DISPLAY } from "@/lib/contact";

type VehicleKey = "lc200" | "lx570";

const MODELS: Record<
  VehicleKey,
  { url: string; label: string; sub: string; hotspots: Hotspot[]; cameraDistance: number }
> = {
  lc200: {
    url: "/models/lc200-ready.glb",
    label: "Land Cruiser 200",
    sub: "Toyota · Jeep",
    hotspots: LC200_HOTSPOTS,
    cameraDistance: 7,
  },
  lx570: {
    url: "/models/lx570-ready.glb",
    label: "Lexus LX 570",
    sub: "Lexus · Premium SUV",
    hotspots: LX570_HOTSPOTS,
    cameraDistance: 9,
  },
};

/* ---------------- Loader overlay ---------------- */
function Loader() {
  const { progress, active } = useProgress();
  return (
    <Html center>
      <div
        style={{
          width: "min(280px, 60vw)",
          color: "#E7E7E7",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
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

/* ---------------- Model ---------------- */
type CarModelProps = {
  url: string;
  hotspots: Hotspot[];
  hoveredId: string | null;
  pickedId: string | null;
  hoodOpen: boolean;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
  showHoodHandle: boolean;
};

function CarModel({
  url,
  hotspots,
  hoveredId,
  pickedId,
  hoodOpen,
  onHover,
  onPick,
  showHoodHandle,
}: CarModelProps) {
  const { scene } = useGLTF(url) as unknown as { scene: THREE.Group };
  const groupRef = useRef<THREE.Group>(null);

  const meshToId = useMemo(() => {
    const m = new Map<THREE.Mesh, string>();
    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        const id = findHotspotId(cur.name, hotspots);
        if (id) {
          m.set(obj as THREE.Mesh, id);
          return;
        }
        cur = cur.parent;
      }
    });
    return m;
  }, [scene, hotspots]);

  const originalEmissive = useMemo(() => {
    const map = new Map<
      THREE.Mesh,
      { color: THREE.Color; intensity: number }
    >();
    scene.traverse((obj) => {
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

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat || !mat.emissive) return;
      const id = meshToId.get(mesh);
      const orig = originalEmissive.get(mesh);
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
  }, [hoveredId, pickedId, scene, meshToId, originalEmissive]);

  /* ---- Hood pivot reparenting (only fires if the model has a node named "Hood") ---- */
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
      fwdAxis === "x"
        ? fwdSign > 0
          ? hoodBox.max.x
          : hoodBox.min.x
        : hoodCenter.x,
      hoodCenter.y,
      fwdAxis === "z"
        ? fwdSign > 0
          ? hoodBox.max.z
          : hoodBox.min.z
        : hoodCenter.z,
    );

    const pivot = new THREE.Group();
    pivot.name = "__hoodPivot";
    pivot.position.copy(pivotWorld);
    const parent = hood.parent;
    if (!parent) return;
    parent.add(pivot);
    pivot.attach(hood);

    hoodPivotRef.current = pivot;
    hoodAxisRef.current = fwdAxis === "x" ? "z" : "x";
    hoodSignRef.current = -fwdSign;
    hood.userData.__repivoted = true;
  }, [scene]);

  const hoodSpring = useSpring({
    rot: hoodOpen ? (Math.PI / 180) * 60 : 0,
    config: { mass: 1.2, tension: 110, friction: 22 },
  });

  useFrame(() => {
    const pivot = hoodPivotRef.current;
    if (!pivot) return;
    const v = hoodSpring.rot.get() * hoodSignRef.current;
    pivot.rotation.set(0, 0, 0);
    pivot.rotation[hoodAxisRef.current] = v;
  });

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (hoveredId || pickedId) return;
    groupRef.current.rotation.y += delta * 0.12;
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = meshToId.get(e.object as THREE.Mesh);
    if (id) {
      onHover(id);
      document.body.style.cursor = "pointer";
    }
  };
  const handlePointerOut = () => {
    onHover(null);
    document.body.style.cursor = "";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = meshToId.get(e.object as THREE.Mesh);
    if (id) onPick(id);
  };

  const { centerOffset, fitScale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return {
      centerOffset: center.clone().negate(),
      fitScale: 4.5 / maxDim,
    };
  }, [scene]);

  return (
    <group ref={groupRef} scale={fitScale} position={[0, -0.7, 0]}>
      <primitive
        object={scene}
        position={centerOffset.toArray()}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
      {showHoodHandle && hoodPivotRef.current && (
        <HoodHandle pivot={hoodPivotRef.current} open={hoodOpen} />
      )}
    </group>
  );
}

function HoodHandle({ pivot, open }: { pivot: THREE.Group; open: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const p = new THREE.Vector3();
    pivot.getWorldPosition(p);
    ref.current.position.copy(p);
  });
  return (
    <group ref={ref}>
      <Html center distanceFactor={8} zIndexRange={[10, 0]}>
        <div
          style={{
            transform: "translate(0, -60px)",
            padding: "4px 8px",
            background: "rgba(220, 13, 1, 0.92)",
            color: "#fff",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {open ? "Капот · нээлттэй" : "Капот · хаалттай"}
        </div>
      </Html>
    </group>
  );
}

/* ---------------- Stage ---------------- */
function Stage({ vehicleKey }: { vehicleKey: VehicleKey }) {
  const cfg = MODELS[vehicleKey];
  const [hoveredId, setHovered] = useState<string | null>(null);
  const [pickedId, setPicked] = useState<string | null>(null);
  const [hoodOpen, setHoodOpen] = useState(false);

  useEffect(() => {
    setHovered(null);
    setPicked(null);
    setHoodOpen(false);
  }, [vehicleKey]);

  const handlePick = (id: string) => {
    setPicked(id);
    if (vehicleKey === "lc200" && id === "hood") {
      setHoodOpen((v) => !v);
    }
  };

  const activeHotspot = useMemo(
    () => cfg.hotspots.find((h) => h.id === pickedId) ?? null,
    [pickedId, cfg.hotspots],
  );

  return (
    <>
      <div className="relative h-[560px] w-full sm:h-[640px] lg:h-[720px]">
        <Canvas
          shadows
          dpr={[1, 1.6]}
          camera={{ position: [3.6, 1.8, cfg.cameraDistance], fov: 36 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ background: "transparent", touchAction: "none" }}
        >
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
            color={"#ff3a2a"}
            castShadow
          />
          <directionalLight
            position={[5, 6, 5]}
            intensity={1.1}
            color={"#ffffff"}
          />
          <directionalLight
            position={[-5, 3, -3]}
            intensity={0.55}
            color={"#7a8aff"}
          />

          <Suspense fallback={<Loader />}>
            <CarModel
              key={vehicleKey}
              url={cfg.url}
              hotspots={cfg.hotspots}
              hoveredId={hoveredId}
              pickedId={pickedId}
              hoodOpen={hoodOpen}
              onHover={setHovered}
              onPick={handlePick}
              showHoodHandle={vehicleKey === "lc200" && pickedId === "hood"}
            />
            <ContactShadows
              position={[0, -1.05, 0]}
              opacity={0.55}
              scale={12}
              blur={2.4}
              far={3}
              color={"#000000"}
            />
          </Suspense>

          <OrbitControls
            enablePan={false}
            minDistance={4}
            maxDistance={14}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            enableDamping
            dampingFactor={0.08}
          />
        </Canvas>

        <HudCorner
          vehicleKey={vehicleKey}
          hoveredHotspot={
            cfg.hotspots.find((h) => h.id === hoveredId) ?? null
          }
        />
        <HotspotLegend
          hotspots={cfg.hotspots}
          activeId={pickedId}
          hoveredId={hoveredId}
          onSelect={handlePick}
        />
      </div>

      <InfoPanel
        hotspot={activeHotspot}
        vehicleLabel={cfg.label}
        hoodOpen={
          vehicleKey === "lc200" && activeHotspot?.id === "hood" && hoodOpen
        }
        onClose={() => setPicked(null)}
      />
    </>
  );
}

/* ---------------- HUD pieces ---------------- */
function HudCorner({
  vehicleKey,
  hoveredHotspot,
}: {
  vehicleKey: VehicleKey;
  hoveredHotspot: Hotspot | null;
}) {
  const cfg = MODELS[vehicleKey];
  return (
    <>
      <div className="pointer-events-none absolute left-5 top-5 z-10 select-none sm:left-7 sm:top-7">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
          {vehicleKey === "lc200" ? "01 · TOYOTA" : "02 · LEXUS"}
        </div>
        <div className="mt-1 font-wordmark text-xl uppercase tracking-tight text-paper sm:text-2xl">
          {cfg.label}
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-graphite">
          {cfg.sub}
        </div>
      </div>

      <div className="pointer-events-none absolute right-5 top-5 z-10 max-w-[60%] text-right sm:right-7 sm:top-7">
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

      <div className="pointer-events-none absolute bottom-5 left-5 z-10 flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-graphite sm:left-7 sm:bottom-7">
        <span className="block size-1 animate-pulse bg-gs-red" />
        Чирж эргүүл · хуруугаар томруул
      </div>

      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <CornerBracket position="bl" />
      <CornerBracket position="br" />
    </>
  );
}

function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const map: Record<typeof position, string> = {
    tl: "left-3 top-3 border-l border-t",
    tr: "right-3 top-3 border-r border-t",
    bl: "left-3 bottom-3 border-l border-b",
    br: "right-3 bottom-3 border-r border-b",
  };
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute size-5 border-gs-red/70 ${map[position]}`}
    />
  );
}

function HotspotLegend({
  hotspots,
  activeId,
  hoveredId,
  onSelect,
}: {
  hotspots: Hotspot[];
  activeId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap justify-center gap-1.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:gap-2">
      {hotspots.map((h) => {
        const isActive = h.id === activeId;
        const isHover = h.id === hoveredId;
        return (
          <button
            key={h.id}
            type="button"
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
              className={`block size-1 ${
                isActive ? "bg-snow" : "bg-gs-red"
              }`}
            />
            {h.name}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Info panel ---------------- */
function InfoPanel({
  hotspot,
  vehicleLabel,
  hoodOpen,
  onClose,
}: {
  hotspot: Hotspot | null;
  vehicleLabel: string;
  hoodOpen: boolean;
  onClose: () => void;
}) {
  const open = !!hotspot;
  return (
    <>
      <aside
        aria-hidden={!open}
        className={`pointer-events-none fixed inset-y-0 right-0 z-40 w-full max-w-[420px] transform border-l border-charcoal/70 bg-ink-raised/95 backdrop-blur-xl transition-transform duration-300 ease-[var(--ease-blade)] ${
          open ? "translate-x-0 pointer-events-auto" : "translate-x-full"
        }`}
        style={{
          boxShadow: open
            ? "-30px 0 60px -20px rgba(220,13,1,0.25)"
            : "none",
        }}
      >
        {hotspot && (
          <div className="flex h-full flex-col">
            <header className="relative flex items-start justify-between gap-4 border-b border-charcoal/60 px-6 py-6 sm:px-8 sm:py-7">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
                  {vehicleLabel} · хэсэг
                </div>
                <h3 className="mt-2 font-wordmark text-2xl uppercase tracking-tight text-paper sm:text-3xl">
                  {hotspot.name}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Хаах"
                onClick={onClose}
                className="relative size-9 border border-charcoal/70 text-paper transition-colors hover:border-gs-red hover:text-gs-red"
              >
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 block h-px w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current"
                />
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 block h-px w-4 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current"
                />
              </button>
            </header>

            <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-charcoal/60 bg-ink">
              <div
                aria-hidden
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(to right,rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.04) 1px,transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-wordmark text-5xl uppercase tracking-tight text-paper/15">
                    {hotspot.name.split(" ")[0]}
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-graphite">
                    Гэрэл зураг удахгүй
                  </div>
                </div>
              </div>
              {hoodOpen && (
                <div className="absolute left-4 top-4 flex items-center gap-2 border border-gs-red/70 bg-ink/70 px-2.5 py-1 text-[9px] uppercase tracking-[0.22em] text-gs-red">
                  <span className="block size-1 animate-pulse bg-gs-red" />
                  Капот нээлттэй
                </div>
              )}
              <span aria-hidden className="absolute left-3 top-3 size-4 border-l border-t border-gs-red/70" />
              <span aria-hidden className="absolute right-3 top-3 size-4 border-r border-t border-gs-red/70" />
              <span aria-hidden className="absolute bottom-3 left-3 size-4 border-l border-b border-gs-red/70" />
              <span aria-hidden className="absolute bottom-3 right-3 size-4 border-r border-b border-gs-red/70" />
            </div>

            <div className="flex flex-1 flex-col gap-7 px-6 py-7 sm:px-8 sm:py-8">
              <div>
                <div className="eyebrow mb-3">GS Auto Center дээр</div>
                <p className="text-base leading-relaxed text-paper/85">
                  {hotspot.desc}
                </p>
              </div>

              <ul className="grid grid-cols-2 gap-3 border-t border-charcoal/60 pt-6">
                <FeatureBullet label="Анхдагч эд анги" />
                <FeatureBullet label="Мэргэшсэн мастер" />
                <FeatureBullet label="Чанарын баталгаа" />
                <FeatureBullet label="Шуурхай үйлчилгээ" />
              </ul>

              <a
                href={PHONE_HREF}
                className="group/cta relative mt-auto flex items-center justify-between gap-3 border border-gs-red bg-gs-red px-5 py-4 text-snow transition-colors duration-150 hover:bg-gs-red-600 hover:border-gs-red-600"
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
            </div>
          </div>
        )}
      </aside>

      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-ink/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
    </>
  );
}

function FeatureBullet({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2 text-[11px] uppercase tracking-[0.16em] text-paper/80">
      <span aria-hidden className="mt-1 block size-1 bg-gs-red" />
      {label}
    </li>
  );
}

/* ---------------- Section root ---------------- */
export default function VehicleExplorer() {
  const [vehicleKey, setVehicleKey] = useState<VehicleKey>("lc200");

  useEffect(() => {
    const other: VehicleKey = vehicleKey === "lc200" ? "lx570" : "lc200";
    const id = window.setTimeout(
      () => useGLTF.preload(MODELS[other].url),
      1200,
    );
    return () => window.clearTimeout(id);
  }, [vehicleKey]);

  return (
    <section
      id="explorer"
      aria-label="Загварын судалгаа · 3D"
      className="relative overflow-hidden bg-ink py-20 sm:py-24 lg:py-28"
    >
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
        <header className="max-w-3xl">
          <div className="mb-6 flex items-center gap-4">
            <span aria-hidden className="block h-px w-12 bg-gs-red" />
            <span className="eyebrow">05 · Интерактив</span>
          </div>
          <h2
            className="font-sans font-black uppercase tracking-tight text-paper"
            style={{
              fontSize: "clamp(2rem, 5.5vw, 4.5rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.025em",
            }}
          >
            Загварын
            <br />
            <span className="text-gs-red">судалгаа</span>
          </h2>
          <p className="mt-5 max-w-prose text-sm text-graphite sm:text-base">
            Машины аль ч хэсгийг сонгож үзээрэй. GS Auto Center дэх засвар,
            үйлчилгээний дэлгэрэнгүй нээгдэнэ.
          </p>
        </header>

        <div className="mt-10 flex items-end justify-between gap-4 border-b border-charcoal/60">
          <div className="flex">
            {(["lc200", "lx570"] as VehicleKey[]).map((k) => {
              const active = k === vehicleKey;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setVehicleKey(k)}
                  className={`relative px-5 py-4 text-left sm:px-7 sm:py-5 ${
                    active ? "text-paper" : "text-paper/55 hover:text-paper"
                  }`}
                >
                  <div className="text-[9.5px] font-medium uppercase tracking-[0.24em] text-gs-red">
                    {k === "lc200" ? "01" : "02"}
                  </div>
                  <div className="mt-1 font-wordmark text-base uppercase tracking-tight sm:text-lg">
                    {MODELS[k].label}
                  </div>
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 -bottom-px h-px origin-left transition-transform duration-300 ease-out ${
                      active ? "scale-x-100 bg-gs-red" : "scale-x-0 bg-gs-red/50"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <div className="hidden items-center gap-2 pb-5 text-[10px] uppercase tracking-[0.22em] text-graphite sm:flex">
            <span className="block size-1 bg-gs-red" />
            3D · Интерактив
          </div>
        </div>

        <div className="relative mt-2 border-x border-b border-charcoal/60 bg-gradient-to-b from-ink-raised to-ink">
          <Stage vehicleKey={vehicleKey} />
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-graphite">
          LC200 model: David_Holiday (CC-BY) · LX570 model: VladGolik (CC-BY)
        </p>
      </div>
    </section>
  );
}

useGLTF.preload("/models/lc200-ready.glb");
