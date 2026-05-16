import { ArrowRight, PhoneIcon } from "./icons";

const PHONE_HREF = "tel:+97677200570";

export default function Hero() {
  return (
    <section
      id="hero"
      aria-label="GS Auto Center — Toyota & Lexus засвар үйлчилгээ"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-ink"
    >
      {/* Engraved blueprint grid */}
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-60"
      />
      {/* Radial vignette — pulls focus toward centre */}
      <div
        aria-hidden
        className="vignette pointer-events-none absolute inset-0"
      />

      {/* Background watermark — TOYOTA · LEXUS in Audiowide, bleeds off-screen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      >
        <span
          className="absolute bottom-[-6%] left-[-4%] block whitespace-nowrap font-wordmark uppercase text-paper/[0.03]"
          style={{
            fontSize: "clamp(11rem, 26vw, 26rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.04em",
          }}
        >
          TOYOTA · LEXUS
        </span>
      </div>

      {/* Diagonal red hairline — wipes across after content arrives */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[58%] h-px w-[120%] origin-left -rotate-[12deg] bg-gs-red/40"
        style={{
          animation:
            "wipe-right 900ms cubic-bezier(0.22, 1, 0.36, 1) 520ms both",
        }}
      />

      {/* Right side rail — desktop only */}
      <div className="pointer-events-none absolute right-7 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
        <span aria-hidden className="block h-12 w-px bg-charcoal/80" />
        <span className="origin-center -rotate-90 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.32em] text-graphite">
          EST. 2011 · ULAANBAATAR
        </span>
        <span aria-hidden className="block h-12 w-px bg-charcoal/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 pb-24 pt-28 sm:px-10 sm:pb-28 sm:pt-36 lg:px-16 lg:pr-28">
        {/* Eyebrow */}
        <div
          className="mb-9 flex items-center gap-4"
          style={{ animation: "var(--animate-rise)", animationDelay: "80ms" }}
        >
          <span
            aria-hidden
            className="block size-1.5 bg-gs-red animate-pulse-red"
          />
          <span aria-hidden className="block h-px w-12 bg-gs-red" />
          <span className="eyebrow">
            2011 — оноос хойш · 13+ жилийн туршлага
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-sans font-black uppercase tracking-tight text-paper"
          style={{
            animation: "var(--animate-rise)",
            animationDelay: "180ms",
            fontSize: "clamp(2.5rem, 8vw, 7rem)",
            lineHeight: 0.94,
            letterSpacing: "-0.03em",
          }}
        >
          Бид таныг
          <br />
          <span className="text-gs-red">аюулгүй зорчиход</span>
          <br />
          туслана.
        </h1>

        {/* Subheadline */}
        <div
          className="mt-10 flex max-w-[58ch] flex-wrap items-center gap-x-3 gap-y-2 text-graphite"
          style={{ animation: "var(--animate-rise)", animationDelay: "320ms" }}
        >
          <span className="text-base font-semibold tracking-wide text-paper sm:text-lg">
            TOYOTA &amp; LEXUS
          </span>
          <span aria-hidden className="block size-1 rounded-none bg-gs-red" />
          <span className="text-sm sm:text-base">
            Мэргэшсэн засвар үйлчилгээ
          </span>
          <span aria-hidden className="block size-1 rounded-none bg-gs-red" />
          <span className="text-sm sm:text-base">Оригинал сэлбэг</span>
        </div>

        {/* CTAs */}
        <div
          className="mt-12 flex flex-col gap-3 sm:flex-row sm:gap-4"
          style={{ animation: "var(--animate-rise)", animationDelay: "440ms" }}
        >
          <a
            href={PHONE_HREF}
            className="group/cta inline-flex items-center justify-center gap-3 bg-gs-red px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-snow transition-colors duration-150 ease-out hover:bg-gs-red-600 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-snow"
          >
            <PhoneIcon className="size-4" />
            Цаг захиалах
          </a>
          <a
            href="#uilchilgee"
            className="group/cta inline-flex items-center justify-center gap-3 border border-charcoal px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper transition-colors duration-150 ease-out hover:border-paper"
          >
            Үйлчилгээ үзэх
            <ArrowRight className="size-4 text-gs-red transition-transform duration-150 ease-out group-hover/cta:translate-x-1" />
          </a>
        </div>
      </div>

      {/* Scroll indicator — bottom right, desktop only */}
      <div
        className="pointer-events-none absolute bottom-8 right-6 hidden flex-col items-center gap-3 lg:flex"
        style={{ animation: "var(--animate-rise)", animationDelay: "700ms" }}
      >
        <span
          className="text-[9px] font-medium uppercase tracking-[0.4em] text-graphite"
          style={{ writingMode: "vertical-rl" }}
        >
          Скролл
        </span>
        <span
          aria-hidden
          className="block h-12 w-px bg-gradient-to-b from-gs-red to-transparent"
        />
      </div>
    </section>
  );
}
