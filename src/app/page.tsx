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

      {/* Top red hairline — the scalpel mark */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left bg-gs-red"
        style={{ animation: "var(--animate-wipe-right)" }}
      />

      {/* Status bar — like a control panel header */}
      <div className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8 lg:px-16">
        <div className="flex items-center gap-3 text-fog">
          <span className="block size-1.5 rounded-none bg-gs-red animate-pulse-red" />
          <span className="text-2xs uppercase">
            Улаанбаатар · Салбар 1 · 09:00 – 19:00
          </span>
        </div>
        <a
          href="tel:+97677200570"
          className="text-2xs uppercase tabular-nums text-paper transition-colors hover:text-gs-red"
        >
          +976 77-200-570
        </a>
      </div>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid min-h-[calc(100svh-72px)] max-w-[1440px] grid-cols-12 items-center px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="col-span-12 lg:col-span-9">
          {/* Eyebrow */}
          <div
            className="mb-10 flex items-center gap-4"
            style={{ animation: "var(--animate-rise)", animationDelay: "60ms" }}
          >
            <span className="hairline-red block w-12" />
            <span className="eyebrow">
              2011 — оноос хойш · 13+ жилийн туршлага
            </span>
          </div>

          {/* Latin wordmark — Audiowide, used only here */}
          <h1
            className="mb-8 font-wordmark text-2xl uppercase tracking-[0.18em] text-gs-red sm:text-3xl"
            style={{ animation: "var(--animate-rise)", animationDelay: "140ms" }}
          >
            GS Auto Center
          </h1>

          {/* Mongolian hero — Montserrat 900 */}
          <h2
            className="font-sans font-black uppercase tracking-tight text-paper"
            style={{
              animation: "var(--animate-rise)",
              animationDelay: "240ms",
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
          </h2>

          {/* Sub */}
          <p
            className="mt-10 max-w-[52ch] text-lg text-graphite sm:text-xl"
            style={{ animation: "var(--animate-rise)", animationDelay: "380ms" }}
          >
            TOYOTA болон LEXUS брэндийн жийп ангилалын автомашины засвар,
            үйлчилгээ, сэлбэгийн мэргэшсэн цогцолбор.
          </p>
        </div>
      </section>

      {/* Stat row — engraved bottom rail */}
      <section
        className="relative z-10 border-t border-charcoal/60"
        style={{ animation: "var(--animate-rise)", animationDelay: "560ms" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-10 px-6 py-10 sm:px-10 sm:py-12 md:grid-cols-4 lg:px-16">
          <Stat number="13+" label="жилийн туршлага" />
          <Stat number="8,000+" label="үйлчлүүлэгч" />
          <Stat number="2,000+" label="сэлбэгийн төрөл" />
          <Stat number="40+" label="мэргэжилтэн" />
        </div>
      </section>

      {/* Footer hairline + status */}
      <div className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-6 pb-8 sm:px-10 lg:px-16">
        <div className="flex items-center gap-3 text-graphite">
          <span className="block size-1.5 rounded-none bg-gs-red animate-pulse-red" />
          <span className="text-2xs uppercase">
            Цахим хуудас удахгүй нээгдэнэ
          </span>
        </div>
        <span className="text-2xs uppercase text-graphite">
          MNS 5025:2010 · JAPAN TOK
        </span>
      </div>
    </main>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-sans text-3xl font-black tabular-nums tracking-tight text-paper sm:text-4xl">
        {number}
      </span>
      <span className="text-xs uppercase tracking-[0.14em] text-graphite">
        {label}
      </span>
    </div>
  );
}
