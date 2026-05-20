import { ArrowRight, PhoneIcon } from "./icons";
import { PHONE_HREF } from "@/lib/contact";
import ParticleField from "./ParticleField";
import MagneticButton from "./MagneticButton";

/* ---------------------------------------------------------------------------
   Hero · asymmetric editorial
   - LEFT  : eyebrow / massive word-stack headline / meta / CTAs
   - RIGHT : vertical virtue column (literal brand-book transcription)
   - BACK  : engraved grid + red horizon glow + GS watermark + mountain ridge
   - FORE  : tagline strip + corporate client ticker pinned to the bottom
--------------------------------------------------------------------------- */

type Word = { text: string; tone?: "default" | "red"; delay: number };

const LINE_ONE: Word[] = [
  { text: "Бид",   delay: 220 },
  { text: "таныг", delay: 310 },
];
const LINE_TWO: Word[] = [
  { text: "аюулгүй",  tone: "red", delay: 430 },
  { text: "зорчиход", delay: 540 },
];
const LINE_THREE: Word[] = [{ text: "тусална.", delay: 660 }];

const VIRTUES = [
  { code: "01", label: "хүчирхэг" },
  { code: "02", label: "Мэргэжлийн" },
  { code: "03", label: "тогтвортой" },
  { code: "04", label: "чанартай" },
] as const;

const CLIENTS = [
  "Алтан тариа",
  "Монгол Даатгал",
  "Шунхлай",
  "Түмэн шувуут",
  "Бевэртек Монголиа",
  "+30 байгууллага",
] as const;

function HeadlineRow({ words }: { words: Word[] }) {
  return (
    <span className="word-row">
      {words.map((w, i) => (
        <span key={`${w.text}-${i}`} className="word-slot">
          <span
            className={`word${w.tone === "red" ? " text-gs-red" : ""}`}
            style={{ animationDelay: `${w.delay}ms` }}
          >
            {w.text}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  return (
    <section
      id="hero"
      aria-label="GS Auto Center · Toyota & Lexus засвар үйлчилгээ"
      className="relative isolate flex min-h-[calc(100svh-2.25rem)] flex-col overflow-clip bg-ink pt-28 sm:pt-36"
    >
      {/* ===== BACKGROUND LAYER ============================================ */}
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-50"
      />
      <div
        aria-hidden
        className="horizon-glow pointer-events-none absolute inset-x-0 bottom-0 h-[60vh]"
      />
      <div
        aria-hidden
        className="vignette pointer-events-none absolute inset-0"
      />

      {/* Distant mountain ridge — echoes the GS mountain mark. */}
      <svg
        aria-hidden
        viewBox="0 0 1600 220"
        preserveAspectRatio="none"
        className="mountain-rise pointer-events-none absolute inset-x-0 bottom-[24%] hidden h-[18vh] w-full md:block"
      >
        <polyline
          className="ridge-line"
          points="0,200 120,140 220,170 340,90 460,150 560,80 680,140 800,40 940,120 1060,70 1180,150 1300,90 1420,160 1540,110 1600,140"
        />
        <polyline
          className="ridge-line"
          style={{ opacity: 0.25 }}
          points="0,210 100,170 220,190 360,130 480,180 600,130 740,180 880,110 1020,170 1160,140 1300,180 1420,150 1540,180 1600,170"
        />
      </svg>

      {/* Giant watermark behind everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none overflow-clip"
      >
        <span
          className="absolute -bottom-[10%] left-[-2%] block whitespace-nowrap font-wordmark uppercase text-paper/[0.04]"
          style={{
            fontSize: "clamp(8rem, 26vw, 24rem)",
            lineHeight: 0.82,
            letterSpacing: "-0.045em",
          }}
        >
          GS AUTO
        </span>
      </div>

      <ParticleField />

      {/* ===== MIDGROUND LAYER ============================================= */}

      {/* Lane scan lines, staggered drift */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-clip"
      >
        <span
          className="lane-line left-0 top-[34%] w-[55%]"
          style={{ animationDelay: "0.4s", animationDuration: "8s" }}
        />
        <span
          className="lane-line left-[30%] top-[62%] w-[60%]"
          style={{ animationDelay: "2.6s", animationDuration: "11s", opacity: 0.6 }}
        />
        <span
          className="lane-line left-[10%] top-[80%] w-[50%]"
          style={{ animationDelay: "5.1s", animationDuration: "9.5s", opacity: 0.5 }}
        />
      </div>

      {/* Initial diagonal red wipe */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[64%] h-px w-[120%] origin-left -rotate-[12deg] bg-gs-red/45"
        style={{ animation: "wipe-right 900ms var(--ease-blade) 520ms both" }}
      />

      {/* ===== FOREGROUND LAYER ============================================ */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 pb-16 sm:px-10 sm:pb-20 lg:flex-row lg:items-center lg:gap-12 lg:px-16 lg:pb-24">
        {/* LEFT · headline column */}
        <div className="flex w-full max-w-[920px] flex-col lg:flex-1">
          <div
            className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mb-9"
            style={{ animation: "var(--animate-rise)", animationDelay: "120ms" }}
          >
            <span aria-hidden className="block size-1.5 bg-gs-red animate-pulse-red" />
            <span aria-hidden className="block h-px w-10 bg-gs-red sm:w-14" />
            <span className="eyebrow">N°01 · Гранд Сутай Авто Төв</span>
            <span aria-hidden className="hidden h-3 w-px bg-charcoal sm:block" />
            <span className="serial-block hidden sm:block">UB · 2011 →</span>
          </div>

          <h1
            className="font-sans font-black uppercase tracking-tight text-paper"
            style={{
              fontSize: "clamp(2.25rem, 9vw, 6.75rem)",
              lineHeight: 0.96,
              letterSpacing: "-0.03em",
              textWrap: "balance",
            }}
          >
            <HeadlineRow words={LINE_ONE} />
            <HeadlineRow words={LINE_TWO} />
            <HeadlineRow words={LINE_THREE} />
          </h1>

          <div
            className="mt-9 grid max-w-[60ch] grid-cols-1 gap-x-6 gap-y-3 sm:mt-12 sm:grid-cols-[auto_1px_auto_1px_auto] sm:items-center"
            style={{ animation: "var(--animate-rise)", animationDelay: "880ms" }}
          >
            <span className="inline-flex items-center gap-3 text-base font-semibold tracking-wide text-paper">
              <span aria-hidden className="block size-1.5 bg-gs-red sm:hidden" />
              TOYOTA &amp; LEXUS
            </span>
            <span aria-hidden className="hidden h-5 w-px bg-charcoal sm:block" />
            <span className="inline-flex items-center gap-3 text-sm text-graphite">
              <span aria-hidden className="block size-1.5 bg-gs-red sm:hidden" />
              Жийпийн дагнасан төв
            </span>
            <span aria-hidden className="hidden h-5 w-px bg-charcoal sm:block" />
            <span className="inline-flex items-center gap-3 text-sm text-graphite">
              <span aria-hidden className="block size-1.5 bg-gs-red sm:hidden" />
              MNS 5025:2010
            </span>
          </div>

          <div
            className="mt-10 flex flex-col gap-3 sm:mt-14 sm:flex-row sm:gap-4"
            style={{ animation: "var(--animate-rise)", animationDelay: "1000ms" }}
          >
            <MagneticButton
              href={PHONE_HREF}
              className="cta-shine pressable group/cta inline-flex items-center justify-center gap-3 bg-gs-red px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-snow transition-colors duration-150 ease-out hover:bg-gs-red-600 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-snow"
            >
              <PhoneIcon className="size-4" />
              77-200-570
            </MagneticButton>
            <a
              href="#uilchilgee"
              className="pressable group/cta inline-flex items-center justify-center gap-3 border border-charcoal px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper transition-colors duration-150 ease-out hover:border-paper"
            >
              Үйлчилгээ үзэх
              <ArrowRight className="size-4 text-gs-red transition-transform duration-150 ease-out group-hover/cta:translate-x-1" />
            </a>
          </div>
        </div>

        {/* RIGHT · 4 brand virtues from the brand book */}
        <aside
          aria-label="Бидний үнэт зүйлс"
          className="mt-14 flex w-full items-stretch gap-2 lg:mt-0 lg:w-auto lg:flex-shrink-0 lg:flex-col lg:gap-3"
          style={{ animation: "var(--animate-rise)", animationDelay: "1100ms" }}
        >
          {/* Desktop · vertical strip */}
          <div className="hidden flex-col gap-3 lg:flex">
            <span className="serial-block flex items-center justify-end gap-2 text-right">
              <span className="text-gs-red">→</span> үнэт зүйлс
            </span>
            <div className="flex h-[280px] gap-1.5 xl:h-[320px]">
              {VIRTUES.map((v) => (
                <div key={v.code} className="flex flex-col items-center">
                  <span aria-hidden className="caret-up mb-1" />
                  <span className="serial-block text-[9px] text-gs-red">{v.code}</span>
                  <div className="virtue-chip mt-1.5 flex-1">
                    <span className="label">{v.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile / tablet · vertical strips (mirrors brand book) */}
          <div className="grid w-full grid-cols-4 gap-1.5 lg:hidden">
            {VIRTUES.map((v) => (
              <div key={v.code} className="flex flex-col items-center">
                <span aria-hidden className="caret-up caret-up-xs mb-1" />
                <span className="serial-block text-[9px] text-gs-red">{v.code}</span>
                <div className="virtue-chip mt-1.5 h-32 w-full">
                  <span className="label">{v.label}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ===== BOTTOM STRIP · tagline + clients ticker ====================== */}
      <div className="relative z-10 mt-auto">
        <div className="border-y border-charcoal/70 bg-ink/85 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 py-3 sm:px-10 lg:px-16">
            <div className="flex items-center gap-3">
              <span aria-hidden className="caret-up caret-up-xs" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-paper sm:text-[11px]">
                Бид таныг аюулгүй зорчиход тусална
              </span>
            </div>
            <span
              aria-hidden
              className="hidden font-wordmark text-[10px] uppercase tracking-[0.32em] text-graphite sm:block"
            >
              GS · auto center
            </span>
          </div>
        </div>

        <div className="ticker-pause relative overflow-hidden bg-ink py-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-ink to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-ink to-transparent" />
          <div className="flex">
            {[0, 1].map((dup) => (
              <div key={dup} className="ticker-clients" aria-hidden={dup === 1}>
                {CLIENTS.map((c) => (
                  <span
                    key={`${c}-${dup}`}
                    className="inline-flex items-center gap-3 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.28em] text-graphite"
                  >
                    <span aria-hidden className="block size-1 bg-gs-red" />
                    {c}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
