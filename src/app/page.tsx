export default function Home() {
  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-ink text-paper">
      {/* Engraved blueprint grid */}
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-60"
      />
      <div
        aria-hidden
        className="vignette pointer-events-none absolute inset-0"
      />

      {/* Hero placeholder — Phase A: nav verification.
          Phase B replaces this section with the spec'd cinematic hero. */}
      <section className="relative z-10 mx-auto grid min-h-svh max-w-[1440px] grid-cols-12 items-center px-6 pb-20 pt-32 sm:px-10 sm:pb-24 sm:pt-40 lg:px-16">
        <div className="col-span-12 lg:col-span-9">
          <div
            className="mb-10 flex items-center gap-4"
            style={{ animation: "var(--animate-rise)", animationDelay: "60ms" }}
          >
            <span className="hairline-red block w-12" />
            <span className="eyebrow">
              2011 — оноос хойш · 13+ жилийн туршлага
            </span>
          </div>

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
            <span className="text-paper">туслана.</span>
          </h1>

          <p
            className="mt-10 max-w-[52ch] text-lg text-graphite sm:text-xl"
            style={{ animation: "var(--animate-rise)", animationDelay: "320ms" }}
          >
            TOYOTA болон LEXUS брэндийн жийп ангилалын автомашины засвар,
            үйлчилгээ, сэлбэгийн мэргэшсэн цогцолбор.
          </p>
        </div>
      </section>
    </main>
  );
}
