import {
  BRANCH_1_ADDRESS,
  BRANCH_1_ADDRESS_LINE,
  BRANCH_1_COORDS,
  BRANCH_1_HOURS,
  BRANCH_1_MAP_EMBED,
  BRANCH_1_MAP_URL,
  PHONE_HREF,
  PHONE_NUMBERS,
} from "@/lib/contact";
import { PhoneIcon } from "./icons";

const MAP_SRC = BRANCH_1_MAP_EMBED;
const MAP_LINK = BRANCH_1_MAP_URL;

const HOURS_ROWS = [
  { label: "Даваа — Баасан", value: "09:00 — 19:00" },
  { label: "Бямба — Ням", value: "09:00 — 19:00" },
  { label: "Нийтийн амралт", value: "Урьдчилан мэдэгдэнэ" },
];

export default function Contact() {
  return (
    <section
      id="holboo-barih"
      aria-labelledby="holboo-barih-title"
      className="relative isolate overflow-hidden bg-ink text-paper"
    >
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-[0.35]"
      />
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute right-[-12%] top-[18%] h-[420px] w-[640px] opacity-50"
      />
      <div className="hairline absolute inset-x-0 top-0" aria-hidden />

      <div className="relative mx-auto max-w-[1440px] px-5 pb-28 pt-24 sm:px-10 sm:pb-32 sm:pt-28 lg:px-16 lg:pb-40 lg:pt-36">
        <header className="reveal flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-graphite">
              <span className="font-wordmark text-gs-red">06</span>
              <span aria-hidden className="block h-px w-10 bg-gs-red" />
              <span className="text-paper/85">Холбоо барих · Салбар нэг</span>
            </span>
            <h2
              id="holboo-barih-title"
              className="font-sans text-4xl font-black uppercase leading-[0.95] tracking-[-0.02em] text-paper sm:text-5xl lg:text-6xl"
            >
              Бид Нарны замд
              <br />
              <span className="text-gs-red">хүлээж байна.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-fog">
            Машинаа авч ирэхэд бэлэн боллоо гэвэл шууд утсаар холбогдоорой.
            Цахим маягт байхгүй, утсаар л захиална.
          </p>
        </header>

        <div className="hairline mt-12 sm:mt-16" aria-hidden />

        <div className="mt-12 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-12 lg:gap-10">
          {/* LEFT · machinist plate with address, phones, hours, CTA */}
          <article className="reveal reveal-delay-1 relative lg:col-span-5">
            <div className="relative border border-charcoal/80 bg-ink-card">
              <div className="flex items-center justify-between border-b border-charcoal/70 bg-ink-raised px-5 py-3 sm:px-7">
                <span className="text-[10px] uppercase tracking-[0.24em] text-graphite">
                  Хаяг · Branch 01
                </span>
                <span className="font-wordmark text-[10px] uppercase tracking-[0.24em] text-paper/70">
                  GS · UB · 01
                </span>
              </div>

              <div className="space-y-10 px-5 py-8 sm:px-7 sm:py-10">
                <div>
                  <span className="eyebrow">Хаяг</span>
                  <address className="not-italic mt-3 space-y-1 text-paper">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-graphite">
                      {BRANCH_1_ADDRESS.city} · {BRANCH_1_ADDRESS.district}
                    </div>
                    <div className="font-sans text-2xl font-black leading-tight tracking-tight text-paper sm:text-3xl">
                      {BRANCH_1_ADDRESS.street}
                    </div>
                    <div className="text-sm text-fog">
                      {BRANCH_1_ADDRESS.khoroo}
                    </div>
                  </address>

                  <a
                    href={MAP_LINK}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group/dir mt-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/85 transition-colors duration-150 ease-out hover:text-gs-red"
                  >
                    <span>Чиглэл харах</span>
                    <span
                      aria-hidden
                      className="inline-block h-px w-8 bg-paper/40 transition-colors duration-150 ease-out group-hover/dir:bg-gs-red"
                    />
                    <span aria-hidden className="text-gs-red">
                      ↗
                    </span>
                  </a>
                </div>

                <div className="hairline" aria-hidden />

                <div>
                  <span className="eyebrow">Утас</span>
                  <ul className="mt-3 divide-y divide-charcoal/60">
                    {PHONE_NUMBERS.map((p, i) => (
                      <li key={p.href} className="py-3 first:pt-0 last:pb-0">
                        <a
                          href={p.href}
                          className="group/phone flex items-baseline justify-between gap-4"
                        >
                          <span className="flex items-baseline gap-3">
                            <span className="font-wordmark text-[10px] uppercase tracking-[0.24em] text-gs-red">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="font-sans text-xl font-bold tabular-nums tracking-tight text-paper transition-colors duration-150 ease-out group-hover/phone:text-gs-red sm:text-2xl">
                              +976 {p.display}
                            </span>
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.22em] text-graphite">
                            {p.label}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="hairline" aria-hidden />

                <div>
                  <span className="eyebrow">Цагийн хуваарь</span>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {HOURS_ROWS.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-baseline justify-between gap-4 text-sm"
                      >
                        <span className="text-graphite">{row.label}</span>
                        <span className="font-medium tabular-nums text-paper">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-fog">
                    <span
                      aria-hidden
                      className="block size-1.5 animate-[bar-pulse_2.4s_ease-in-out_infinite] bg-gs-red"
                    />
                    <span>{BRANCH_1_HOURS}</span>
                  </div>
                </div>
              </div>

              <a
                href={PHONE_HREF}
                aria-label="Цаг захиалах · +976 77-200-570"
                className="pressable cta-shine group/cta relative flex items-center justify-between gap-4 border-t border-gs-red bg-gs-red px-5 py-5 text-snow transition-colors duration-150 ease-out hover:bg-gs-red-600 sm:px-7 sm:py-6"
              >
                <span className="flex items-center gap-3">
                  <PhoneIcon className="size-4" />
                  <span className="font-sans text-base font-bold uppercase tracking-[0.18em]">
                    Цаг захиалах
                  </span>
                </span>
                <span className="font-sans text-sm font-semibold tabular-nums tracking-tight text-snow/90 sm:text-base">
                  +976 77-200-570
                  <span
                    aria-hidden
                    className="ml-2 inline-block transition-transform duration-300 ease-out group-hover/cta:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </a>
            </div>

            <div className="mt-3 flex items-center justify-between text-[9px] uppercase tracking-[0.28em] text-iron">
              <span>Plate · 200&570</span>
              <span className="font-wordmark text-graphite">EST · 2013</span>
            </div>
          </article>

          {/* RIGHT · live map, framed by a hairline and corner ticks */}
          <figure className="reveal reveal-delay-2 relative lg:col-span-7">
            <div className="relative">
              <CornerTicks />
              <div className="relative aspect-[4/5] w-full overflow-hidden border border-charcoal/80 bg-ink-card sm:aspect-[5/4] lg:aspect-auto lg:h-full lg:min-h-[560px]">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-charcoal/60 bg-ink/85 px-5 py-3 backdrop-blur-md sm:px-7">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-paper/85">
                    Байршил · Live map
                  </span>
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-graphite">
                    <span
                      aria-hidden
                      className="block size-1.5 animate-[bar-pulse_2.4s_ease-in-out_infinite] bg-gs-red"
                    />
                    {BRANCH_1_COORDS.lat.toFixed(4)}° N ·{" "}
                    {BRANCH_1_COORDS.lng.toFixed(4)}° E
                  </span>
                </div>

                <iframe
                  title="GS Auto Center · Газрын зураг"
                  src={MAP_SRC}
                  className="absolute inset-0 size-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 border-t border-charcoal/60 bg-ink/85 px-5 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <span className="text-[11px] tracking-tight text-paper">
                    {BRANCH_1_ADDRESS_LINE}
                  </span>
                  <a
                    href={MAP_LINK}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="pointer-events-auto inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gs-red transition-colors duration-150 ease-out hover:text-paper"
                  >
                    Шинэ цонхонд нээх
                    <span aria-hidden>↗</span>
                  </a>
                </div>
              </div>
            </div>

            <figcaption className="sr-only">
              GS Auto Center, Салбар 1: {BRANCH_1_ADDRESS_LINE}
            </figcaption>
          </figure>
        </div>
      </div>

      <div className="hairline absolute inset-x-0 bottom-0" aria-hidden />
    </section>
  );
}

function CornerTicks() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-20">
      <span className="absolute left-0 top-0 size-3 border-l border-t border-gs-red" />
      <span className="absolute right-0 top-0 size-3 border-r border-t border-gs-red" />
      <span className="absolute bottom-0 left-0 size-3 border-b border-l border-gs-red" />
      <span className="absolute bottom-0 right-0 size-3 border-b border-r border-gs-red" />
    </span>
  );
}
