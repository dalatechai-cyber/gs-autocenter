import Image from "next/image";
import Link from "next/link";
import {
  BRANCH_1_ADDRESS_LINE,
  BRANCH_1_COORDS,
  BRANCH_1_HOURS,
  BRANCH_1_MAP_URL,
  PHONE_DISPLAY,
  PHONE_HREF,
} from "@/lib/contact";

const NAV_LINKS = [
  { href: "/#uilchilgee", label: "Үйлчилгээ" },
  { href: "/#selbeg", label: "Сэлбэг" },
  { href: "/#mashin", label: "Машинууд" },
  { href: "/#bidnii-tuhai", label: "Бидний тухай" },
  { href: "/#holboo-barih", label: "Холбоо барих" },
] as const;

export default function Footer() {
  return (
    <footer
      aria-labelledby="footer-title"
      className="relative isolate overflow-hidden border-t border-charcoal/70 bg-ink text-paper"
    >
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-[0.28]"
      />
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute -bottom-40 left-[-10%] h-[420px] w-[640px] opacity-40"
      />
      <div className="hairline-red absolute inset-x-0 top-0" aria-hidden />

      <h2 id="footer-title" className="sr-only">
        GS Auto Center · Холбоо барих, цэс, лиценз
      </h2>

      <div className="relative mx-auto max-w-[1440px] px-5 pb-10 pt-16 sm:px-10 sm:pb-12 sm:pt-20 lg:px-16 lg:pb-14 lg:pt-24">
        {/* Plate header — engraved label, machined wordmark */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-graphite">
          <span className="flex items-center gap-3">
            <span className="font-wordmark text-gs-red">00</span>
            <span aria-hidden className="block h-px w-10 bg-gs-red" />
            <span className="text-paper/85">Footer · Plate</span>
          </span>
          <span className="font-wordmark text-[10px] tracking-[0.28em] text-paper/60">
            GS · AUTO · MN
          </span>
        </div>

        <div className="hairline mt-6" aria-hidden />

        {/* Main grid */}
        <div className="mt-12 grid grid-cols-1 gap-12 sm:mt-14 sm:gap-14 lg:mt-16 lg:grid-cols-12 lg:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-5">
            <Link
              href="/"
              aria-label="GS Auto Center · нүүр хуудас"
              className="inline-flex items-center"
            >
              <Image
                src="/logo/gs-logo-horizontal-white.png"
                alt="GS Auto Center"
                width={540}
                height={212}
                className="h-10 w-auto sm:h-12"
              />
            </Link>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-fog">
              TOYOTA болон LEXUS брэндийн жийп ангилалын мэргэжлийн засвар
              үйлчилгээ. 2011 оноос Улаанбаатарт.
            </p>

            {/* JAPAN TOK badge */}
            <div className="mt-8 inline-flex items-stretch border border-charcoal/80 bg-ink-card">
              <div className="flex items-center border-r border-charcoal/80 bg-ink-raised px-4 py-3">
                <span className="font-wordmark text-xs uppercase tracking-[0.22em] text-paper">
                  JAPAN
                  <span className="ml-1 text-gs-red">TOK</span>
                </span>
              </div>
              <div className="flex flex-col justify-center px-4 py-2.5">
                <span className="text-[9px] uppercase tracking-[0.24em] text-graphite">
                  Албан ёсны дистрибьютер
                </span>
                <span className="mt-0.5 text-[11px] font-medium tracking-tight text-paper">
                  Official distributor · Mongolia
                </span>
              </div>
            </div>
          </div>

          {/* Nav column */}
          <nav aria-label="Хөл цэс" className="lg:col-span-3">
            <span className="eyebrow">Цэс</span>
            <ul className="mt-5 flex flex-col gap-3.5">
              {NAV_LINKS.map((link, i) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group/fl inline-flex items-baseline gap-3 text-sm font-medium text-paper/85 transition-colors duration-150 ease-out hover:text-paper"
                  >
                    <span
                      aria-hidden
                      className="font-wordmark text-[10px] tracking-[0.22em] tabular-nums text-gs-red/80"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="relative">
                      {link.label}
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-gs-red transition-transform duration-300 ease-out group-hover/fl:scale-x-100"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact column */}
          <div className="lg:col-span-4">
            <span className="eyebrow">Холбоо барих</span>

            <div className="mt-5 flex flex-col gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-graphite">
                  Утас
                </div>
                <a
                  href={PHONE_HREF}
                  className="mt-1.5 inline-flex items-baseline gap-2 font-sans text-xl font-bold tabular-nums tracking-tight text-paper transition-colors duration-150 ease-out hover:text-gs-red sm:text-2xl"
                >
                  {PHONE_DISPLAY}
                </a>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-graphite">
                  <span
                    aria-hidden
                    className="block size-1.5 animate-[bar-pulse_2.4s_ease-in-out_infinite] bg-gs-red"
                  />
                  Цагийн хуваарь
                </div>
                <div className="mt-1.5 text-sm font-medium tabular-nums text-paper">
                  {BRANCH_1_HOURS}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-graphite">
                  Хаяг
                </div>
                <a
                  href={BRANCH_1_MAP_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${BRANCH_1_ADDRESS_LINE} — Google Maps дээр нээх`}
                  className="group/addr mt-1.5 inline-flex flex-col gap-1"
                >
                  <span className="text-sm font-medium leading-snug text-paper transition-colors duration-150 ease-out group-hover/addr:text-gs-red">
                    Улаанбаатар, БГД, Нарны зам 6/2
                  </span>
                  <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-graphite transition-colors duration-150 ease-out group-hover/addr:text-paper">
                    <span>Газрын зураг дээр харах</span>
                    <span aria-hidden className="text-gs-red">
                      ↗
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Display wordmark — engraved nameplate */}
        <div className="relative mt-20 sm:mt-24 lg:mt-28">
          <div className="hairline mb-8" aria-hidden />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <span
              aria-hidden
              className="font-wordmark text-[clamp(2.5rem,11vw,8.5rem)] leading-[0.82] tracking-[-0.02em] text-paper/[0.06]"
            >
              GS AUTO CENTER
            </span>
            <span className="flex shrink-0 items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-graphite">
              <span
                aria-hidden
                className="block size-1.5 animate-[bar-pulse_2.4s_ease-in-out_infinite] bg-gs-red"
              />
              {BRANCH_1_COORDS.lat.toFixed(4)}° N ·{" "}
              {BRANCH_1_COORDS.lng.toFixed(4)}° E
            </span>
          </div>
        </div>

        {/* Legal strip */}
        <div className="mt-10 flex flex-col gap-4 border-t border-charcoal/70 pt-6 text-[11px] text-graphite sm:flex-row sm:items-center sm:justify-between">
          <span>
            © 2026{" "}
            <span className="text-paper">&quot;Гранд Сутай&quot; ХХК</span>.
            Бүх эрх хуулиар хамгаалагдсан.
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.24em] text-graphite">
              Гүйцэтгэсэн
            </span>
            <a
              href="https://dalatech.online/"
              target="_blank"
              rel="noreferrer noopener"
              className="group/dt inline-flex items-center gap-1.5 font-wordmark text-[11px] uppercase tracking-[0.24em] text-paper transition-colors duration-150 ease-out hover:text-gs-red"
            >
              <span>DalaTech</span>
              <span
                aria-hidden
                className="text-gs-red transition-transform duration-200 ease-out group-hover/dt:translate-x-0.5"
              >
                ↗
              </span>
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
