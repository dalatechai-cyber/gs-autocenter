import Image from "next/image";
import vehicles from "@/data/vehicles.json";
import { PHONE_HREF } from "@/lib/contact";
import { ArrowRight, PhoneIcon } from "./icons";

type Vehicle = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  sideImageUrl?: string;
  featured: boolean;
};

const VEHICLES = vehicles as Vehicle[];

const CATEGORY_MN: Record<string, string> = {
  "Crossovers & SUV": "Кроссовер · SUV",
  "MPV-Van": "MPV · Микроавтобус",
  "Pickup Truck": "Пикап",
};

export default function VehicleShowcase() {
  const featured = VEHICLES.filter((v) => v.featured);
  const secondary = VEHICLES.filter((v) => !v.featured);

  return (
    <section
      id="mashin"
      aria-label="Бидний засдаг автомашинууд"
      className="relative overflow-hidden bg-ink py-20 sm:py-28 lg:py-36"
    >
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-30"
      />

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
        <SectionHeader />

        {/* Featured row */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:mt-16 lg:grid-cols-3">
          {featured.map((v, i) => (
            <FeaturedCard key={v.id} {...v} index={i + 1} />
          ))}
        </div>

        {/* Secondary block divider */}
        <div className="mb-8 mt-20 flex items-center gap-4 sm:mt-24">
          <span aria-hidden className="block h-px w-12 bg-gs-red" />
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
            Бусад загвар · {String(secondary.length).padStart(2, "0")}
          </span>
          <span aria-hidden className="block h-px flex-1 bg-charcoal/50" />
        </div>

        {/* Secondary row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {secondary.map((v, i) => (
            <SecondaryCard
              key={v.id}
              {...v}
              index={featured.length + i + 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <header className="max-w-4xl">
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
          TOYOTA &amp; LEXUS
        </span>
        <span aria-hidden className="block size-1 bg-gs-red" />
        <span>Jeep ангилал</span>
        <span aria-hidden className="block size-1 bg-gs-red" />
        <span>Мэргэшсэн үйлчилгээ</span>
      </p>
    </header>
  );
}

function FeaturedCard({
  name,
  category,
  imageUrl,
  index,
}: Vehicle & { index: number }) {
  const indexLabel = String(index).padStart(2, "0");
  return (
    <article
      aria-label={`${name} — ${CATEGORY_MN[category] ?? category}`}
      className="group/card relative flex flex-col overflow-hidden border border-charcoal/60 bg-ink-raised transition-colors duration-200 ease-out hover:border-paper/30"
    >
      {/* Image pedestal — light stage for the car */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-b from-snow via-snow to-paper-soft">
        {/* Ambient red ground glow */}
        <div
          aria-hidden
          className="absolute -bottom-6 left-1/2 h-20 w-3/4 -translate-x-1/2 rounded-full bg-gs-red/35 blur-3xl"
        />
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain object-center p-6 transition-transform duration-300 ease-out group-hover/card:scale-[1.04] sm:p-8"
        />
        {/* Index marker */}
        <span
          aria-hidden
          className="absolute left-5 top-5 font-wordmark text-[10px] uppercase tracking-[0.22em] tabular-nums text-gs-red"
        >
          {indexLabel}
        </span>
        {/* Featured badge */}
        <span
          aria-hidden
          className="absolute right-5 top-5 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.24em] text-charcoal"
        >
          <span className="block size-1 bg-gs-red" />
          Сонгомол
        </span>
      </div>

      {/* Info section */}
      <div className="relative flex flex-1 flex-col gap-5 px-6 py-7 sm:px-7 sm:py-8">
        {/* Red hairline on hover */}
        <span
          aria-hidden
          className="absolute inset-x-6 top-0 h-px origin-left scale-x-0 bg-gs-red transition-transform duration-300 ease-out group-hover/card:scale-x-100 sm:inset-x-7"
        />
        <div className="flex flex-col gap-2">
          <h3
            className="font-wordmark uppercase tracking-tight text-paper"
            style={{
              fontSize: "clamp(1.5rem, 2.4vw, 2rem)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            {name}
          </h3>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-graphite">
            {CATEGORY_MN[category] ?? category}
          </span>
        </div>

        <a
          href={PHONE_HREF}
          aria-label={`${name} — цаг захиалах +976 77-200-570`}
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

function SecondaryCard({
  name,
  category,
  imageUrl,
  index,
}: Vehicle & { index: number }) {
  const indexLabel = String(index).padStart(2, "0");
  return (
    <article
      aria-label={`${name} — ${CATEGORY_MN[category] ?? category}`}
      className="group/card relative flex flex-col overflow-hidden border border-charcoal/60 bg-ink-raised transition-colors duration-200 ease-out hover:border-paper/30"
    >
      <div className="relative aspect-[5/3] overflow-hidden bg-gradient-to-b from-snow via-snow to-paper-soft">
        <div
          aria-hidden
          className="absolute -bottom-4 left-1/2 h-12 w-2/3 -translate-x-1/2 rounded-full bg-gs-red/30 blur-2xl"
        />
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
          className="object-contain object-center p-4 transition-transform duration-300 ease-out group-hover/card:scale-[1.05]"
        />
        <span
          aria-hidden
          className="absolute left-3 top-3 font-wordmark text-[9px] uppercase tracking-[0.22em] tabular-nums text-gs-red"
        >
          {indexLabel}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col gap-3 px-4 py-5">
        <span
          aria-hidden
          className="absolute inset-x-4 top-0 h-px origin-left scale-x-0 bg-gs-red transition-transform duration-300 ease-out group-hover/card:scale-x-100"
        />
        <div className="flex flex-col gap-1">
          <h3 className="font-wordmark text-[15px] uppercase tracking-tight text-paper sm:text-base">
            {name}
          </h3>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-graphite">
            {CATEGORY_MN[category] ?? category}
          </span>
        </div>

        <a
          href={PHONE_HREF}
          aria-label={`${name} — цаг захиалах +976 77-200-570`}
          className="group/cta mt-auto flex items-center justify-between gap-2 border-t border-charcoal/60 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-paper transition-colors duration-150 ease-out hover:text-gs-red focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gs-red"
        >
          Цаг захиалах
          <ArrowRight className="size-3 text-gs-red transition-transform duration-150 ease-out group-hover/cta:translate-x-1" />
        </a>
      </div>
    </article>
  );
}
