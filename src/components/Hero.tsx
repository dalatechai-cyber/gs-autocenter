import { ArrowRight, PhoneIcon } from "./icons";
import { PHONE_HREF } from "@/lib/contact";

/* ---------------------------------------------------------------------------
   Hero: three layers of depth
   - background : engraved grid + drifting red glow + huge GS AUTO CENTER mark
   - midground  : rotating orbit ring + diagonal hairlines + scan-line sweeps
   - foreground : eyebrow / word-stack headline / meta strip / CTAs / scroll tick
   Animation is CSS-driven and server-rendered.
--------------------------------------------------------------------------- */

type Word = { text: string; tone?: "default" | "red"; delay: number };

const LINE_ONE: Word[] = [
  { text: "Бид",   delay: 220 },
  { text: "таныг", delay: 310 },
];
const LINE_TWO: Word[] = [
  { text: "аюулгүй",  tone: "red", delay: 430 },
  { text: "зорчиход", tone: "red", delay: 540 },
];
const LINE_THREE: Word[] = [
  { text: "туслана.", delay: 660 },
];

function HeadlineRow({ words }: { words: Word[] }) {
  return (
    <span className="word-row">
      {words.map((w, i) => (
        <span
          key={`${w.text}-${i}`}
          className="word"
          style={{ animationDelay: `${w.delay}ms` }}
        >
          <span className={w.tone === "red" ? "text-gs-red" : ""}>
            {w.text}
          </span>
          {i < words.length - 1 && <span aria-hidden>{" "}</span>}
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
      className="relative isolate flex min-h-[calc(100svh-2.25rem)] flex-col overflow-clip bg-ink pt-32 sm:pt-44"
    >
      {/* ===== BACKGROUND LAYER ============================================ */}
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-50"
      />
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute -left-1/4 top-1/3 h-[80vh] w-[90vw]"
      />
      <div
        aria-hidden
        className="vignette pointer-events-none absolute inset-0"
      />

      {/* Giant watermark, bleeds off the right edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none overflow-clip"
      >
        <span
          className="absolute -bottom-[6%] left-[-4%] block whitespace-nowrap font-wordmark uppercase text-paper/[0.035]"
          style={{
            fontSize: "clamp(7.5rem, 22vw, 22rem)",
            lineHeight: 0.82,
            letterSpacing: "-0.045em",
          }}
        >
          GS AUTO CENTER
        </span>
      </div>

      {/* ===== MIDGROUND LAYER ============================================= */}

      {/* Slowly rotating orbit ring, anchored to the right shoulder */}
      <svg
        aria-hidden
        viewBox="0 0 800 800"
        className="ring-orbit pointer-events-none absolute -right-[28%] top-1/2 hidden h-[140vh] -translate-y-1/2 opacity-[0.13] lg:block"
      >
        <defs>
          <linearGradient id="gsRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#DC0D01" stopOpacity="0" />
            <stop offset="50%" stopColor="#DC0D01" stopOpacity="1" />
            <stop offset="100%" stopColor="#DC0D01" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="400" cy="400" r="395" fill="none" stroke="url(#gsRingGrad)" strokeWidth="1" />
        <circle cx="400" cy="400" r="340" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="2 14" />
        <circle cx="400" cy="400" r="260" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="400" y1="5" x2="400" y2="60" stroke="#DC0D01" strokeWidth="2" />
      </svg>

      {/* Three scan lines drifting across at staggered intervals */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-clip">
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

      {/* Initial diagonal red wipe (runs once on load) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[64%] h-px w-[120%] origin-left -rotate-[12deg] bg-gs-red/45"
        style={{ animation: "wipe-right 900ms var(--ease-blade) 520ms both" }}
      />

      {/* Right side rail, desktop */}
      <div className="pointer-events-none absolute right-7 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
        <span aria-hidden className="block h-12 w-px bg-charcoal/80" />
        <span className="origin-center -rotate-90 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.32em] text-graphite">
          EST. 2011 · ULAANBAATAR
        </span>
        <span aria-hidden className="block h-12 w-px bg-charcoal/80" />
      </div>

      {/* Top-right VIN-style meta block, desktop only */}
      <div
        className="absolute right-16 top-32 hidden text-right font-wordmark text-[10px] uppercase tracking-[0.28em] text-graphite lg:block"
        style={{ animation: "var(--animate-rise)", animationDelay: "80ms" }}
      >
        <div className="flex items-center justify-end gap-3">
          <span className="block h-px w-6 bg-gs-red" />
          <span className="text-gs-red">N°01</span>
        </div>
        <div className="mt-2 text-paper/70">TOYOTA · LEXUS</div>
        <div className="mt-1 text-graphite">SERVICE / PARTS</div>
        <div className="mt-1 tabular-nums text-paper/50">UB · 2011 →</div>
      </div>

      {/* ===== FOREGROUND LAYER ============================================ */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 pb-24 sm:px-10 sm:pb-28 lg:px-16 lg:pr-28">
        {/* Eyebrow */}
        <div
          className="mb-7 flex items-center gap-4 sm:mb-9"
          style={{ animation: "var(--animate-rise)", animationDelay: "120ms" }}
        >
          <span aria-hidden className="block size-1.5 bg-gs-red animate-pulse-red" />
          <span aria-hidden className="block h-px w-10 bg-gs-red sm:w-14" />
          <span className="eyebrow">2011 оноос хойш · 13+ жилийн туршлага</span>
        </div>

        {/* Headline - word-stack reveal */}
        <h1
          className="font-sans font-black uppercase tracking-tight text-paper"
          style={{
            fontSize: "clamp(2.25rem, 9vw, 7rem)",
            lineHeight: 0.96,
            letterSpacing: "-0.03em",
            textWrap: "balance",
          }}
        >
          <HeadlineRow words={LINE_ONE} />
          <HeadlineRow words={LINE_TWO} />
          <HeadlineRow words={LINE_THREE} />
        </h1>

        {/* Meta strip — structured grid, no collision at any breakpoint */}
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
            Мэргэшсэн засвар үйлчилгээ
          </span>
          <span aria-hidden className="hidden h-5 w-px bg-charcoal sm:block" />
          <span className="inline-flex items-center gap-3 text-sm text-graphite">
            <span aria-hidden className="block size-1.5 bg-gs-red sm:hidden" />
            Оригинал сэлбэг
          </span>
        </div>

        {/* CTAs - primary shimmers, secondary translates */}
        <div
          className="mt-10 flex flex-col gap-3 sm:mt-14 sm:flex-row sm:gap-4"
          style={{ animation: "var(--animate-rise)", animationDelay: "1000ms" }}
        >
          <a
            href={PHONE_HREF}
            className="cta-shine pressable group/cta inline-flex items-center justify-center gap-3 bg-gs-red px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-snow transition-colors duration-150 ease-out hover:bg-gs-red-600 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-snow"
          >
            <PhoneIcon className="size-4" />
            Цаг захиалах
          </a>
          <a
            href="#uilchilgee"
            className="pressable group/cta inline-flex items-center justify-center gap-3 border border-charcoal px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper transition-colors duration-150 ease-out hover:border-paper"
          >
            Үйлчилгээ үзэх
            <ArrowRight className="size-4 text-gs-red transition-transform duration-150 ease-out group-hover/cta:translate-x-1" />
          </a>
        </div>
      </div>

      {/* Scroll indicator - bottom right, continuous tick */}
      <div
        className="pointer-events-none absolute bottom-8 right-6 hidden flex-col items-center gap-3 lg:flex"
        style={{ animation: "var(--animate-rise)", animationDelay: "1200ms" }}
      >
        <span
          className="text-[9px] font-medium uppercase tracking-[0.4em] text-graphite"
          style={{ writingMode: "vertical-rl" }}
        >
          Скролл
        </span>
        <span aria-hidden className="scroll-track block h-16 w-px bg-charcoal/60" />
      </div>

      {/* Bottom hairline */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-charcoal/60" />
    </section>
  );
}
