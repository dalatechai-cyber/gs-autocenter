import Image from "next/image";
import vehicles from "@/data/vehicles.json";
import { PHONE_HREF } from "@/lib/contact";
import { ArrowRight, PhoneIcon } from "./icons";

/* ---------------------------------------------------------------------------
   VehicleShowcase · cinematic lineup
   Two brand chapters (Toyota, Lexus). Each card is a billboard: photo fills
   16:11, dark gradient at the bottom, name sits in Audiowide over the
   gradient, brand tag top-left, chassis code top-right, hover lifts.
   Photos verified from toyota-mongolia.mn / Wikimedia / discoverlexus.com.
--------------------------------------------------------------------------- */

type Vehicle = {
  id: string;
  name: string;
  brand: string;
  code?: string;
  category: string;
  imageUrl: string;
  featured: boolean;
};

const VEHICLES = vehicles as Vehicle[];
const TOYOTAS = VEHICLES.filter((v) => v.brand === "Toyota");
const LEXUS = VEHICLES.filter((v) => v.brand === "Lexus");

export default function VehicleShowcase() {
  return (
    <section
      id="mashin"
      aria-label="Бидний засдаг автомашинууд"
      className="relative isolate overflow-hidden bg-ink py-24 sm:py-32 lg:py-40"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-charcoal/60" />
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
          LINEUP
        </span>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
        <SectionHeader total={VEHICLES.length} />

        <BrandChapter
          title="TOYOTA"
          subtitle="Жийп ангилал"
          count={TOYOTAS.length}
          index={1}
          vehicles={TOYOTAS}
          startIndex={1}
        />

        <BrandChapter
          title="LEXUS"
          subtitle="Premium ангилал"
          count={LEXUS.length}
          index={2}
          vehicles={LEXUS}
          startIndex={TOYOTAS.length + 1}
        />

        <div className="reveal mt-20 flex flex-col items-start gap-6 border-t border-charcoal/60 pt-10 sm:mt-24 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm leading-relaxed text-graphite sm:text-base">
            Жагсаалтад харуулаагүй TOYOTA эсвэл LEXUS жийп байна уу? Мэргэжилтэн
            үнэгүй зөвлөгөө өгнө.
          </p>
          <a
            href={PHONE_HREF}
            className="pressable group inline-flex items-center gap-3 bg-gs-red px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-snow transition-colors duration-150 ease-out hover:bg-gs-red-600"
          >
            <PhoneIcon className="size-4" />
            77-200-570
            <ArrowRight className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ total }: { total: number }) {
  return (
    <header className="reveal grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <div className="mb-7 flex items-center gap-4">
          <span aria-hidden className="caret-up" />
          <span aria-hidden className="block h-px w-12 bg-gs-red" />
          <span className="eyebrow">04 · Машинууд</span>
        </div>
        <h2
          className="font-sans font-black uppercase tracking-tight text-paper"
          style={{
            fontSize: "clamp(2rem, 5.5vw, 4.75rem)",
            lineHeight: 0.98,
            letterSpacing: "-0.025em",
          }}
        >
          Бидний засдаг
          <br />
          <span className="text-gs-red">автомашинууд</span>
        </h2>
      </div>

      <div className="lg:col-span-5 lg:pt-6">
        <p className="max-w-prose text-base leading-relaxed text-fog sm:text-lg">
          TOYOTA болон LEXUS жийпийн ангилалын{" "}
          <span className="text-paper">{total} загвар</span> бүхэн манай
          дагнасан мэргэжилтнүүдийн гарт орно. Хөдөлгүүр, явах эд анги,
          цахилгаан — бүх систем оригинал сэлбэгээр.
        </p>
        <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2">
          {["TOYOTA", "LEXUS", "JAPAN TOK сэлбэг"].map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-paper"
            >
              <span aria-hidden className="block size-1 bg-gs-red" />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

function BrandChapter({
  title,
  subtitle,
  count,
  index,
  vehicles,
  startIndex,
}: {
  title: string;
  subtitle: string;
  count: number;
  index: number;
  vehicles: Vehicle[];
  startIndex: number;
}) {
  return (
    <div className="mt-20 sm:mt-24">
      <div className="reveal mb-10 flex flex-col items-start gap-5 border-t border-charcoal/60 pt-10 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <span className="font-wordmark text-[10px] uppercase tracking-[0.28em] text-gs-red">
            {String(index).padStart(2, "0")}
          </span>
          <h3
            className="font-wordmark text-paper"
            style={{
              fontSize: "clamp(2.25rem, 4.5vw, 4rem)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-graphite sm:pb-2">
            {subtitle}
          </span>
        </div>
        <span className="font-wordmark text-[10px] uppercase tracking-[0.28em] text-graphite">
          {count} загвар
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-7">
        {vehicles.map((v, i) => (
          <li key={v.id} className="reveal" style={{ animationDelay: `${i * 60}ms` }}>
            <CinemaCard {...v} index={startIndex + i} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CinemaCard({
  name,
  brand,
  code,
  category,
  imageUrl,
}: Vehicle & { index: number }) {
  const fullName = name.toLowerCase().startsWith(brand.toLowerCase())
    ? name
    : `${brand} ${name}`;
  return (
    <article
      aria-label={`${fullName} · ${category}`}
      className="group/card relative block aspect-[16/11] w-full overflow-hidden border border-charcoal/60 bg-ink-raised transition-all duration-500 ease-out hover:border-gs-red/60 hover:shadow-[0_20px_60px_-20px_rgba(220,13,1,0.55)]"
    >
      <Image
        src={imageUrl}
        alt={fullName}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-[1.04]"
        unoptimized
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/0 to-ink"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-gs-red-deep/0 via-transparent to-gs-red/0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-30"
      />

      <div className="absolute inset-x-6 top-5 flex items-center justify-between sm:inset-x-8 sm:top-6">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-paper">
          <span aria-hidden className="block size-1.5 bg-gs-red" />
          {brand}
        </span>
        {code && (
          <span className="font-wordmark text-[10px] uppercase tracking-[0.24em] text-gs-red">
            ◤ {code}
          </span>
        )}
      </div>

      <div className="absolute inset-x-6 bottom-5 flex flex-col gap-3 sm:inset-x-8 sm:bottom-7">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-graphite">
          {category}
        </span>
        <h4
          className="font-wordmark uppercase tracking-tight text-paper"
          style={{
            fontSize: "clamp(1.875rem, 3.4vw, 2.875rem)",
            lineHeight: 0.94,
            letterSpacing: "-0.015em",
          }}
        >
          {name}
        </h4>

        <a
          href={PHONE_HREF}
          aria-label={`${name} · цаг захиалах +976 77-200-570`}
          className="group/cta mt-2 inline-flex w-fit items-center gap-3 border-t border-paper/20 pt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-paper transition-colors duration-150 ease-out hover:text-gs-red focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gs-red"
        >
          <PhoneIcon className="size-3.5 text-gs-red" />
          Цаг захиалах
          <ArrowRight className="size-3.5 text-gs-red transition-transform duration-150 ease-out group-hover/cta:translate-x-1" />
        </a>
      </div>

      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-gs-red transition-transform duration-500 ease-out group-hover/card:scale-y-100"
      />
    </article>
  );
}
