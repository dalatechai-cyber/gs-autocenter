"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Bounds,
  useGLTF,
  Html,
  useProgress,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  VEHICLES,
  type VehicleKey,
  type Part,
} from "./parts";
import CarModel from "./CarModel";
import PartModal, { type ModalContent } from "./PartModal";
import { PHONE_HREF, PHONE_DISPLAY } from "@/lib/contact";

const VEHICLE_KEYS: VehicleKey[] = ["lc200", "lx570"];

function CanvasLoader() {
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

function Stage({
  vehicleKey,
  hoveredId,
  setHovered,
  pickedId,
  setPicked,
  hoodOpen,
  setHoodOpen,
  openDoors,
  setOpenDoors,
  onEngineBayPick,
}: {
  vehicleKey: VehicleKey;
  hoveredId: string | null;
  setHovered: (id: string | null) => void;
  pickedId: string | null;
  setPicked: (id: string | null) => void;
  hoodOpen: boolean;
  setHoodOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  openDoors: Set<string>;
  setOpenDoors: (updater: (prev: Set<string>) => Set<string>) => void;
  onEngineBayPick: (id: string) => void;
}) {
  const cfg = VEHICLES[vehicleKey];

  const handlePick = (id: string) => {
    setPicked(id);
    const part = cfg.parts.find((p) => p.id === id);
    if (part?.animates === "hood") {
      setHoodOpen((v) => !v);
    } else if (part?.animates === "door") {
      setOpenDoors((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const autoRotate = !hoveredId && !pickedId;

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [3.2, 1.4, cfg.cameraDistance], fov: 30 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      style={{ background: "transparent", touchAction: "none" }}
    >
      <Suspense fallback={null}>
        <Environment preset="warehouse" environmentIntensity={1.1} />
      </Suspense>

      <ambientLight intensity={0.18} />
      <directionalLight
        position={[5, 7, 6]}
        intensity={1.8}
        color={"#ffffff"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.55} color={"#8aa2ff"} />
      <spotLight
        position={[3, 3, -6]}
        angle={0.7}
        penumbra={0.9}
        intensity={4.5}
        color={"#ff3a1f"}
        distance={22}
      />
      <spotLight
        position={[-3, 3, -6]}
        angle={0.7}
        penumbra={0.9}
        intensity={3.2}
        color={"#ff3a1f"}
        distance={22}
      />
      <pointLight position={[0, -0.5, 5]} intensity={0.35} color={"#ffb88a"} distance={12} />

      <Suspense fallback={<CanvasLoader />}>
        <Bounds fit clip observe margin={1.05}>
          <CarModel
            key={vehicleKey}
            url={cfg.url}
            parts={cfg.parts}
            paintColor={cfg.paintColor}
            hoveredId={hoveredId}
            pickedId={pickedId}
            hoodOpen={hoodOpen}
            openDoors={openDoors}
            engineBay={cfg.engineBay}
            onHover={setHovered}
            onPick={handlePick}
            onEngineBayPick={onEngineBayPick}
            autoRotate={autoRotate}
          />
        </Bounds>
        <ContactShadows
          position={[0, -0.95, 0]}
          opacity={0.78}
          scale={12}
          blur={2.4}
          far={3.2}
          color={"#000000"}
          resolution={1024}
        />
      </Suspense>

      <OrbitControls
        enablePan={false}
        target={[0, 0, 0]}
        minDistance={3.2}
        maxDistance={12}
        minPolarAngle={Math.PI / 7}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
        dampingFactor={0.08}
      />

    </Canvas>
  );
}

function HudOverlay({
  vehicleKey,
  hoveredPart,
  hoodOpen,
  openDoorsCount,
}: {
  vehicleKey: VehicleKey;
  hoveredPart: Part | null;
  hoodOpen: boolean;
  openDoorsCount: number;
}) {
  const cfg = VEHICLES[vehicleKey];
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
          {cfg.tagline}
        </div>
      </div>

      <div className="pointer-events-none absolute right-5 top-5 z-10 max-w-[60%] text-right sm:right-7 sm:top-7">
        <div className="text-[9px] uppercase tracking-[0.22em] text-graphite">Хэсэг</div>
        <div
          className={`mt-1 font-wordmark text-base uppercase tracking-tight transition-colors duration-150 sm:text-lg ${
            hoveredPart ? "text-gs-red" : "text-paper/40"
          }`}
        >
          {hoveredPart?.name ?? "—"}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 z-10 flex flex-col gap-1.5 text-[9px] uppercase tracking-[0.22em] text-graphite sm:left-7 sm:bottom-7">
        <div className="flex items-center gap-2">
          <span className="block size-1 animate-pulse bg-gs-red" />
          Чирж эргүүл · Дугуйгаар томруул
        </div>
        {hoodOpen && (
          <div className="flex items-center gap-2 text-gs-red">
            <span className="block size-1 animate-pulse bg-gs-red" />
            Капот · нээлттэй
          </div>
        )}
        {openDoorsCount > 0 && (
          <div className="flex items-center gap-2 text-gs-red">
            <span className="block size-1 animate-pulse bg-gs-red" />
            {openDoorsCount} хаалга нээлттэй
          </div>
        )}
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

function PartChips({
  parts,
  activeId,
  hoveredId,
  onSelect,
}: {
  parts: Part[];
  activeId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-10 flex flex-wrap justify-center gap-1.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:gap-2">
      {parts.map((p) => {
        const isActive = p.id === activeId;
        const isHover = p.id === hoveredId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={`flex items-center gap-2 border px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.14em] backdrop-blur-md transition-colors duration-150 ease-out sm:text-[10px] ${
              isActive
                ? "border-gs-red bg-gs-red text-snow"
                : isHover
                  ? "border-gs-red/70 bg-ink/65 text-paper"
                  : "border-charcoal/60 bg-ink/55 text-paper/75 hover:border-gs-red/60 hover:text-paper"
            }`}
          >
            <span
              aria-hidden
              className={`block size-1 ${isActive ? "bg-snow" : "bg-gs-red"}`}
            />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}

export default function VehicleExplorerClient() {
  const [vehicleKey, setVehicleKey] = useState<VehicleKey>("lc200");
  const [hoveredId, setHovered] = useState<string | null>(null);
  const [pickedId, setPicked] = useState<string | null>(null);
  const [hoodOpen, setHoodOpenRaw] = useState(false);
  const [openDoors, setOpenDoorsRaw] = useState<Set<string>>(() => new Set());
  const [engineBayPicked, setEngineBayPicked] = useState<string | null>(null);

  const setHoodOpen = (v: boolean | ((p: boolean) => boolean)) => {
    setHoodOpenRaw(v);
  };
  const setOpenDoors = (updater: (prev: Set<string>) => Set<string>) => {
    setOpenDoorsRaw((prev) => updater(prev));
  };

  useEffect(() => {
    setHovered(null);
    setPicked(null);
    setHoodOpenRaw(false);
    setOpenDoorsRaw(new Set());
    setEngineBayPicked(null);
  }, [vehicleKey]);

  useEffect(() => {
    const other: VehicleKey = vehicleKey === "lc200" ? "lx570" : "lc200";
    const id = window.setTimeout(() => {
      useGLTF.preload(VEHICLES[other].url);
    }, 1500);
    return () => window.clearTimeout(id);
  }, [vehicleKey]);

  const cfg = VEHICLES[vehicleKey];

  const hoveredPart = useMemo(
    () => cfg.parts.find((p) => p.id === hoveredId) ?? null,
    [hoveredId, cfg.parts],
  );
  const pickedPart = useMemo(
    () => cfg.parts.find((p) => p.id === pickedId) ?? null,
    [pickedId, cfg.parts],
  );

  const engineBayPart = useMemo(() => {
    if (!engineBayPicked) return null;
    return cfg.engineBay.find((b) => b.id === engineBayPicked) ?? null;
  }, [engineBayPicked, cfg.engineBay]);

  const modalContent: ModalContent | null = useMemo(() => {
    if (engineBayPart) {
      return {
        id: engineBayPart.id,
        name: engineBayPart.name,
        subtitle: "Хөдөлгүүрийн тасалгаа",
        desc: engineBayPart.desc,
        bullets: [
          "Анхдагч эд анги",
          "Чанарын баталгаа",
          "Мэргэжлийн оношилгоо",
          "Шуурхай засвар",
        ],
        category: "Engine Bay",
      };
    }
    if (pickedPart) {
      return {
        id: pickedPart.id,
        name: pickedPart.name,
        subtitle: pickedPart.subtitle,
        desc: pickedPart.desc,
        bullets: pickedPart.bullets,
        category:
          pickedPart.category === "engine"
            ? "Хөдөлгүүр"
            : pickedPart.category === "door"
              ? "Хаалга"
              : pickedPart.category === "wheel"
                ? "Дугуй"
                : pickedPart.category === "light"
                  ? "Гэрэл"
                  : pickedPart.category === "glass"
                    ? "Шил"
                    : pickedPart.category === "body"
                      ? "Кузов"
                      : pickedPart.category === "chrome"
                        ? "Хром"
                        : "Үйлчилгээ",
      };
    }
    return null;
  }, [pickedPart, engineBayPart]);

  const modalOpen = modalContent !== null;

  const closeModal = () => {
    setPicked(null);
    setEngineBayPicked(null);
  };

  return (
    <section
      id="explorer"
      aria-label="Загварын судалгаа — 3D"
      className="relative overflow-hidden bg-ink py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 28%,rgba(220,13,1,0.20),transparent 60%),linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)",
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
            Машины аль ч хэсгийг товчилно уу — Капот нээгдэх, хаалга нээгдэх,
            эд анги бүрд тохирох үйлчилгээний дэлгэрэнгүй гарч ирнэ.
          </p>
        </header>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4 border-b border-charcoal/60">
          <div className="flex">
            {VEHICLE_KEYS.map((k) => {
              const active = k === vehicleKey;
              const v = VEHICLES[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setVehicleKey(k)}
                  className={`relative px-5 py-4 text-left transition-colors duration-150 sm:px-7 sm:py-5 ${
                    active ? "text-paper" : "text-paper/55 hover:text-paper"
                  }`}
                >
                  <div className="text-[9.5px] font-medium uppercase tracking-[0.24em] text-gs-red">
                    {k === "lc200" ? "01" : "02"}
                  </div>
                  <div className="mt-1 font-wordmark text-base uppercase tracking-tight sm:text-lg">
                    {v.label}
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-graphite">
                    {v.sub}
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
          <a
            href={PHONE_HREF}
            className="group/cta hidden items-center gap-3 pb-5 text-[10px] uppercase tracking-[0.22em] text-graphite transition-colors duration-150 hover:text-gs-red sm:flex"
          >
            <span className="block size-1 bg-gs-red" />
            <span>Цаг захиалах</span>
            <span className="font-wordmark text-sm normal-case text-paper transition-colors group-hover/cta:text-gs-red">
              {PHONE_DISPLAY}
            </span>
          </a>
        </div>

        <div className="relative mt-2 border-x border-b border-charcoal/60 bg-gradient-to-b from-ink-raised via-ink to-ink">
          <div className="relative h-[560px] w-full sm:h-[640px] lg:h-[720px]">
            <Stage
              vehicleKey={vehicleKey}
              hoveredId={hoveredId}
              setHovered={setHovered}
              pickedId={pickedId}
              setPicked={setPicked}
              hoodOpen={hoodOpen}
              setHoodOpen={setHoodOpen}
              openDoors={openDoors}
              setOpenDoors={setOpenDoors}
              onEngineBayPick={setEngineBayPicked}
            />
            <HudOverlay
              vehicleKey={vehicleKey}
              hoveredPart={hoveredPart}
              hoodOpen={hoodOpen}
              openDoorsCount={openDoors.size}
            />
            <PartChips
              parts={cfg.parts}
              activeId={pickedId}
              hoveredId={hoveredId}
              onSelect={setPicked}
            />
            {/* Cinematic vignette + red rim glow overlay (compensates for no postprocessing) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[5] mix-blend-normal"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 55%, transparent 0%, transparent 50%, rgba(0,0,0,0.55) 100%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[6] mix-blend-screen"
              style={{
                background:
                  "radial-gradient(ellipse 60% 30% at 50% 78%, rgba(220,13,1,0.18), transparent 70%)",
              }}
            />
          </div>
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-graphite">
          LC200 model: David_Holiday (CC-BY) · LX570 model: VladGolik (CC-BY) ·
          HDRI: Poly Haven CC0
        </p>
      </div>

      <PartModal
        open={modalOpen}
        content={modalContent}
        vehicleLabel={cfg.label}
        onClose={closeModal}
      />
    </section>
  );
}

useGLTF.preload(VEHICLES.lc200.url);
