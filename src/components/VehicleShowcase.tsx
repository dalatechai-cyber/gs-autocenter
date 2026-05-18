import Image from "next/image";
import vehicles from "@/data/vehicles.json";
import { PHONE_HREF } from "@/lib/contact";
import { ArrowRight, PhoneIcon } from "./icons";

type Vehicle = {
  id: string;
  name: string;
  brand?: string;
  category: string;
  imageUrl: string;
  sideImageUrl?: string;
  featured: boolean;
};

const VEHICLES = vehicles as Vehicle[];

export default function VehicleShowcase() {
  const [primary, ...rest] = VEHICLES;

  return (
    <section
      id="mashin"
      aria-label="Бидний засдаг автомашинууд"
      className="relative overflow-hidden bg-ink py-24 sm:py-32 lg:py-40"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 block h-px bg-charcoal/60"
      />
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-25"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 select-none overflow-clip"
      >
        <span
          className="absolute -top-6 right-[-3%] block whitespace-nowrap font-wordmark uppercase text-paper/[0.025]"
          style={{
            fontSize: "clamp(8rem, 18vw, 18rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.04em",
          }}
        >
          JEEP CLASS
        </span>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
        <SectionHeader />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-20 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <PrimaryCard {...primary} index={1} />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:col-span-5 lg:gap-6">
            {rest.map((v, i) => (
              <SideCard key={v.id} {...v} index={i + 2} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <header className="reveal max-w-4xl">
      <div className="mb-7 flex items-center gap-4">
        <span aria-hidden className="block h-px w-12 bg-gs-red" />
        <span className="eyebrow">04 · Машинууд</span>
      </div>
      <h2
        className="font-sans font-black uppercase tracking-tight text-paper"
        style={{
          fontSize: "clamp(2rem, 5.5vw, 4.5rem)",
          lineHeight: 0.98,
          letterSpacing: "-0.025em",
        }}
      >
        Бидний засдаг
        <br />
        <span className="text-gs-red">автомашинууд</span>
      </h2>
      <p className="mt-6 flex max-w-prose flex-wrap items-center gap-x-3 gap-y-1 text-sm text-graphite sm:text-base">
        <span className="font-semibold tracking-wide text-paper">
          TOYOTA LAND CRUISER &amp; LEXUS LX
        </span>
        <span aria-hidden className="block size-1 bg-gs-red" />
        <span>Зөвхөн Jeep ангилал</span>
        <span aria-hidden className="block size-1 bg-gs-red" />
        <span>Дагнасан мэргэшил</span>
      </p>
    </header>
  );
}

function PrimaryCard({
  name,
  brand,
  category,
  imageUrl,
  index,
}: Vehicle & { index: number }) {
  const indexLabel = String(index).padStart(2, "0");
  return (
    <article
      aria-label={`${brand ?? ""} ${name} · ${category}`}
      className="group/card reveal relative flex h-full flex-col overflow-hidden border border-charcoal/60 bg-ink-raised transition-colors duration-200 ease-out hover:border-paper/30"
    >
      <div className="relative aspect-[16/11] overflow-hidden bg-snow lg:aspect-[16/12]">
        <div
          aria-hidden
          className="absolute -bottom-8 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full bg-gs-red/40 blur-3xl"
        />
        <Image
          src={imageUrl}
          alt={`${brand ?? ""} ${name}`.trim()}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-contain object-center p-8 transition-transform duration-500 ease-out group-hover/card:scale-[1.04] sm:p-12"
        />
        <span
          aria-hidden
          className="absolute left-6 top-6 font-wordmark text-[10px] uppercase tracking-[0.22em] tabular-nums text-gs-red"
        >
          {indexLabel} · Сонгомол
        </span>
        <span
          aria-hidden
          className="absolute right-6 top-6 text-[9px] font-medium uppercase tracking-[0.24em] text-charcoal"
        >
          {brand}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col gap-6 px-7 py-8 sm:px-9 sm:py-10">
        <span
          aria-hidden
          className="absolute inset-x-7 top-0 h-px origin-left scale-x-0 bg-gs-red transition-transform duration-500 ease-out group-hover/card:scale-x-100 sm:inset-x-9"
        />
        <div className="flex flex-col gap-3">
          <h3
            className="font-wordmark uppercase tracking-tight text-paper"
            style={{
              fontSize: "clamp(2rem, 3.2vw, 2.75rem)",
              lineHeight: 1,
              letterSpacing: "-0.015em",
            }}
          >
            {name}
          </h3>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-graphite">
            {category}
          </span>
        </div>

        <a
          href={PHONE_HREF}
          aria-label={`${name} · цаг захиалах +976 77-200-570`}
          className="group/cta mt-auto flex items-center justify-between gap-3 border-t border-charcoal/60 pt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper transition-colors duration-150 ease-out hover:text-gs-red focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gs-red"
        >
          <span className="flex items-center gap-2">
            <PhoneIcon className="size-3.5 text-gs-red" />
            Цаг захиалах
          </span>
          <ArrowRight className="size-3.5 text-gs-red transition-transform duration-150 ease-out group-hover/cta:translate-x-1" />
        </a>
      </div>
    </article>
  );
}

function SideCard({
  name,
  brand,
  category,
  imageUrl,
  index,
}: Vehicle & { index: number }) {
  const indexLabel = String(index).padStart(2, "0");
  return (
    <article
      aria-label={`${brand ?? ""} ${name} · ${category}`}
      className="group/card reveal relative flex flex-1 overflow-hidden border border-charcoal/60 bg-ink-raised transition-colors duration-200 ease-out hover:border-paper/30"
    >
      <div className="relative w-2/5 shrink-0 overflow-hidden bg-snow">
        <div
          aria-hidden
          className="absolute -bottom-4 left-1/2 h-16 w-4/5 -translate-x-1/2 rounded-full bg-gs-red/35 blur-2xl"
        />
        <Image
          src={imageUrl}
          alt={`${brand ?? ""} ${name}`.trim()}
          fill
          sizes="(max-width: 1024px) 40vw, 25vw"
          className="object-contain object-center p-4 transition-transform duration-500 ease-out group-hover/card:scale-[1.05]"
        />
      </div>

      <div className="relative flex flex-1 flex-col gap-3 px-5 py-6 sm:px-6 sm:py-7">
        <span
          aria-hidden
          className="absolute inset-y-6 left-0 w-px origin-top scale-y-0 bg-gs-red transition-transform duration-500 ease-out group-hover/card:scale-y-100"
        />
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-wordmark text-[10px] uppercase tracking-[0.22em] tabular-nums text-gs-red">
            {indexLabel}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-[0.24em] text-graphite">
            {brand}
          </span>
        </div>

        <h3
          className="font-wordmark uppercase tracking-tight text-paper"
          style={{
            fontSize: "clamp(1.25rem, 1.8vw, 1.5rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </h3>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-graphite">
          {category}
        </span>

        <a
          href={PHONE_HREF}
          aria-label={`${name} · цаг захиалах +976 77-200-570`}
          className="group/cta mt-auto flex items-center justify-between gap-2 border-t border-charcoal/60 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-paper transition-colors duration-150 ease-out hover:text-gs-red focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gs-red"
        >
          Цаг захиалах
          <ArrowRight className="size-3 text-gs-red transition-transform duration-150 ease-out group-hover/cta:translate-x-1" />
        </a>
      </div>
    </article>
  );
}
