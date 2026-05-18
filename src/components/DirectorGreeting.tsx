/**
 * Захирлын мэндчилгээ — Director's greeting.
 *
 * Name and photo are placeholders. The source material in
 * /docs/brand-extracted/ and /docs/catalog-extracted/ contains the company
 * history, mission, and values but does not list a director by name.
 * Marketing must replace the values below before launch.
 */
const PLACEHOLDER = {
  name: "[Захирлын нэрийг GS-ээс авах]",
  title: "Гүйцэтгэх захирал · GS Auto Center",
  body: "2011 онд гадаад худалдаагаар эхэлж, 2013 оноос TOYOTA, LEXUS жийпийн дагнасан үйлчилгээгээр өргөжсөнөөс хойш бид нэг л зорилгод үнэнч явсан. Үйлчлүүлэгчдийнхээ техникийн бүрэн бүтэн байдлыг хангаж, аюулгүй замдаа гаргах. Та бидэнд итгэснийг чин сэтгэлээсээ хүндэтгэж байна.",
};

export default function DirectorGreeting() {
  return (
    <section
      id="zahirliin-mendchilgee"
      aria-labelledby="zahirliin-mendchilgee-title"
      className="relative isolate overflow-hidden bg-ink-raised text-paper"
    >
      <div className="hairline absolute inset-x-0 top-0" aria-hidden />
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute left-[-20%] top-[-10%] h-[420px] w-[640px] opacity-30"
      />

      <div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-10 sm:py-28 lg:px-16 lg:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <aside className="reveal lg:col-span-4">
            <div className="relative">
              <CornerTicks />
              <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden border border-charcoal/80 bg-ink-card">
                <div className="grid-engraved absolute inset-0 opacity-50" aria-hidden />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <span
                    aria-hidden
                    className="font-wordmark text-7xl tracking-[-0.04em] text-paper/10"
                  >
                    GS
                  </span>
                  <span className="border border-gs-red px-3 py-1 text-[9px] font-bold uppercase tracking-[0.28em] text-gs-red">
                    Need photo from GS
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-graphite">
                    Director portrait · place here
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[9px] uppercase tracking-[0.28em] text-iron">
              Portrait · placeholder · replace before launch
            </p>
          </aside>

          <div className="reveal reveal-delay-1 lg:col-span-8">
            <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-graphite">
              <span className="font-wordmark text-gs-red">07</span>
              <span aria-hidden className="block h-px w-10 bg-gs-red" />
              <span className="text-paper/85">Захирлын мэндчилгээ</span>
            </span>

            <h2
              id="zahirliin-mendchilgee-title"
              className="mt-5 font-sans text-3xl font-black uppercase leading-[1.02] tracking-[-0.015em] text-paper sm:text-4xl lg:text-5xl"
            >
              13 жилийн турш
              <br />
              <span className="text-gs-red">нэг л зорилгод</span> үнэнч.
            </h2>

            <p className="mt-8 max-w-2xl text-base leading-[1.65] text-paper-soft sm:text-lg">
              {PLACEHOLDER.body}
            </p>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-sans text-2xl font-black tracking-tight text-paper sm:text-3xl"
                    data-placeholder
                  >
                    {PLACEHOLDER.name}
                  </span>
                  <span
                    aria-label="Placeholder content"
                    className="border border-gs-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-gs-red"
                  >
                    TODO
                  </span>
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-graphite">
                  {PLACEHOLDER.title}
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.24em] text-iron">
                <span aria-hidden className="block h-px w-12 bg-charcoal" />
                <span className="font-wordmark text-graphite">Signed · Ulaanbaatar</span>
              </div>
            </div>
          </div>
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
