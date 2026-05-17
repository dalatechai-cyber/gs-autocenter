"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VEHICLES, type VehicleKey, type Part } from "./parts";
import PartModal, { type ModalContent } from "./PartModal";
import { PHONE_HREF, PHONE_DISPLAY } from "@/lib/contact";

const VEHICLE_KEYS: VehicleKey[] = ["lc200", "lx570"];

// Register the <model-viewer> custom element on the client. Dynamic import
// keeps it out of the SSR bundle.
let modelViewerLoaded = false;
function ensureModelViewer() {
  if (modelViewerLoaded) return;
  modelViewerLoaded = true;
  import("@google/model-viewer");
}

// TypeScript JSX intrinsic for the <model-viewer> custom element.
// React 19 / Next 16 uses React.JSX (not the legacy global JSX namespace).
type ModelViewerAttrs = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  alt?: string;
  "environment-image"?: string;
  "skybox-image"?: string;
  "shadow-intensity"?: string | number;
  "shadow-softness"?: string | number;
  exposure?: string | number;
  "tone-mapping"?: string;
  "camera-controls"?: boolean | "";
  "camera-orbit"?: string;
  "field-of-view"?: string;
  "min-camera-orbit"?: string;
  "max-camera-orbit"?: string;
  "interaction-prompt"?: string;
  "disable-zoom"?: boolean | "";
  "auto-rotate"?: boolean | "";
  "auto-rotate-delay"?: string | number;
  "rotation-per-second"?: string;
  poster?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual";
  ar?: boolean | "";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttrs;
    }
  }
}

export default function VehicleExplorerClient() {
  useEffect(() => {
    ensureModelViewer();
  }, []);

  const [vehicleKey, setVehicleKey] = useState<VehicleKey>("lc200");
  const [pickedId, setPicked] = useState<string | null>(null);
  const viewerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [vehicleKey]);

  /**
   * Once each GLB loads, frame it consistently regardless of the model's
   * underlying unit scale (LC200 uses mm, LX570 may use meters, etc).
   *
   * 1. Read the auto-computed camera orbit (model-viewer's default fit) and
   *    pull the radius in by 35% so the car commands the frame.
   * 2. Re-anchor the look-at target on the model's bbox center + raise Y by
   *    ~25% of the bbox height so the car sits visually centered, not
   *    sinking toward the bottom of the canvas.
   */
  useEffect(() => {
    const mv = viewerRef.current as
      | (HTMLElement & {
          getCameraOrbit: () => { theta: number; phi: number; radius: number };
          getCameraTarget: () => { x: number; y: number; z: number };
          getDimensions: () => { x: number; y: number; z: number };
          cameraOrbit: string;
          cameraTarget: string;
        })
      | null;
    if (!mv) return;

    let cancelled = false;

    // Per-vehicle body paint color. The GLBs are baked with light gray
    // materials from the Blender prep script (rgb 0.78,0.78,0.80) which
    // model-viewer renders as chalky white. Override per-material at
    // runtime so the body reads as a proper dark metallic.
    const paintByVehicle: Record<VehicleKey, [number, number, number, number]> = {
      lc200: [0.040, 0.050, 0.062, 1], // obsidian dark navy
      lx570: [0.520, 0.540, 0.560, 1], // Lexus atomic silver
    };
    const paint = paintByVehicle[vehicleKey];

    const overrideMaterials = () => {
      const model = (mv as unknown as { model?: { materials: unknown[] } }).model;
      if (!model) return;
      for (const m of model.materials) {
        const mat = m as {
          name?: string;
          pbrMetallicRoughness: {
            setBaseColorFactor: (rgba: [number, number, number, number]) => void;
            setMetallicFactor: (v: number) => void;
            setRoughnessFactor: (v: number) => void;
          };
        };
        const name = (mat.name ?? "").toLowerCase();
        // Glass / windows / lights — leave whatever the GLB had.
        if (
          name.includes("glass") ||
          name.includes("window") ||
          name.includes("headlight") ||
          name.includes("taillight") ||
          name.includes("lamp") ||
          name.includes("led")
        ) {
          continue;
        }
        // Tires / rubber — matte dark.
        if (name.includes("tire") || name.includes("gum") || name.includes("rubber")) {
          mat.pbrMetallicRoughness.setBaseColorFactor([0.035, 0.035, 0.037, 1]);
          mat.pbrMetallicRoughness.setMetallicFactor(0);
          mat.pbrMetallicRoughness.setRoughnessFactor(0.92);
          continue;
        }
        // Wheel rims / chrome — bright polished metal.
        if (
          name.includes("rim") ||
          name.includes("wheel") ||
          name.includes("chrome") ||
          name.includes("brake")
        ) {
          mat.pbrMetallicRoughness.setBaseColorFactor([0.68, 0.69, 0.71, 1]);
          mat.pbrMetallicRoughness.setMetallicFactor(1);
          mat.pbrMetallicRoughness.setRoughnessFactor(0.22);
          continue;
        }
        // Default = body paint. Metallic dialed back so the dark base color
        // contributes more diffuse — pure-metal would look mirror-silver
        // under the studio HDRI regardless of base.
        mat.pbrMetallicRoughness.setBaseColorFactor(paint);
        mat.pbrMetallicRoughness.setMetallicFactor(0.55);
        mat.pbrMetallicRoughness.setRoughnessFactor(0.42);
      }
    };

    const onLoad = () => {
      if (cancelled) return;
      const orbit = mv.getCameraOrbit();
      const target = mv.getCameraTarget();
      const dim = mv.getDimensions();
      const tightRadius = orbit.radius * 0.65;
      const targetYLifted = target.y + dim.y * 0.25;
      mv.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${tightRadius}m`;
      mv.cameraTarget = `${target.x}m ${targetYLifted}m ${target.z}m`;
      overrideMaterials();
    };

    mv.addEventListener("load", onLoad);
    // If the model is already loaded by the time this effect runs (the
    // `key` swap remount may complete fast enough), apply once immediately.
    if ((mv as unknown as { loaded?: boolean }).loaded) onLoad();

    return () => {
      cancelled = true;
      mv.removeEventListener("load", onLoad);
    };
  }, [vehicleKey]);

  const cfg = VEHICLES[vehicleKey];

  const pickedPart = useMemo(
    () => cfg.parts.find((p) => p.id === pickedId) ?? null,
    [pickedId, cfg.parts],
  );

  const modalContent: ModalContent | null = useMemo(() => {
    if (!pickedPart) return null;
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
  }, [pickedPart]);

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
            Машины аль ч хэсэгийг товчилно уу — эд анги бүрд тохирох
            үйлчилгээний дэлгэрэнгүй гарч ирнэ.
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
          <div className="relative h-[70vh] min-h-[600px] w-full sm:min-h-[640px] lg:min-h-[720px]">
            <model-viewer
              ref={viewerRef as React.RefObject<HTMLElement>}
              key={vehicleKey}
              src={cfg.url}
              alt={cfg.label}
              environment-image="/hdri/studio.hdr"
              shadow-intensity="2"
              shadow-softness="0.85"
              exposure="0.85"
              tone-mapping="aces"
              camera-controls
              camera-orbit="-25deg 78deg auto"
              field-of-view="22deg"
              camera-target="auto auto auto"
              interaction-prompt="none"
              loading="eager"
              reveal="auto"
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "transparent",
                ["--poster-color" as string]: "transparent",
              }}
            />

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

            <div className="pointer-events-none absolute bottom-5 left-5 z-10 flex flex-col gap-1.5 text-[9px] uppercase tracking-[0.22em] text-graphite sm:left-7 sm:bottom-7">
              <div className="flex items-center gap-2">
                <span className="block size-1 animate-pulse bg-gs-red" />
                Чирж эргүүл · Дугуйгаар томруул
              </div>
            </div>

            <span aria-hidden className="pointer-events-none absolute left-3 top-3 z-10 size-5 border-l border-t border-gs-red/70" />
            <span aria-hidden className="pointer-events-none absolute right-3 top-3 z-10 size-5 border-r border-t border-gs-red/70" />
            <span aria-hidden className="pointer-events-none absolute left-3 bottom-3 z-10 size-5 border-l border-b border-gs-red/70" />
            <span aria-hidden className="pointer-events-none absolute right-3 bottom-3 z-10 size-5 border-r border-b border-gs-red/70" />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[5]"
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

            <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-10 flex flex-wrap justify-center gap-1.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:gap-2">
              {cfg.parts.map((p) => {
                const isActive = p.id === pickedId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPicked(p.id)}
                    className={`flex items-center gap-2 border px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.14em] backdrop-blur-md transition-colors duration-150 ease-out sm:text-[10px] ${
                      isActive
                        ? "border-gs-red bg-gs-red text-snow"
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
          </div>
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-graphite">
          LC200 model: David_Holiday (CC-BY) · LX570 model: VladGolik (CC-BY) ·
          HDRI: Poly Haven CC0
        </p>
      </div>

      <PartModal
        open={modalContent !== null}
        content={modalContent}
        vehicleLabel={cfg.label}
        onClose={() => setPicked(null)}
      />
    </section>
  );
}

// Touch unused symbol so the Part type import isn't dropped by tooling — keeps
// the type chain stable.
export type _Part = Part;
