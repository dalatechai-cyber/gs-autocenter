import { ArrowRight } from "./icons";

/* ---------------------------------------------------------------------------
   Manifesto · the mission, as a full-bleed editorial pull-quote
   - Massive Audiowide wordmark for "аюулгүй зорчиход тусална"
   - Three "principles" pulled from the company catalog
   - Single red caret accent on the eyebrow
--------------------------------------------------------------------------- */

const PRINCIPLES = [
  {
    code: "I",
    title: "Мэргэжлийн байх",
    body: "13 жилийн туршлагатай 40+ мэргэжилтэн. Дагнасан хөдөлгүүрийн цех, баталгаажуулсан инженерүүд.",
  },
  {
    code: "II",
    title: "Ил тод байх",
    body: "Үзлэг, оношилгооны үр дүн ил, баримтжуулсан. Сольсон сэлбэг бүхэн данс бүртгэлтэй.",
  },
  {
    code: "III",
    title: "Итгэл даах",
    body: "Алтан тариа, Монгол Даатгал, Шунхлайгаас 30+ байгууллагын тогтмол гэрээт түнш.",
  },
] as const;

export default function Manifesto() {
  return (
    <section
      id="erkhem-zorilgo"
      aria-label="Бидний эрхэм зорилго"
      className="relative isolate overflow-hidden bg-ink py-24 sm:py-32 lg:py-40"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-charcoal/60" />
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-1/2 h-[80vh] w-[70vw] -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(91, 7, 2, 0.55) 0%, rgba(91, 7, 2, 0) 60%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
        <div className="reveal mb-10 flex items-center gap-4 sm:mb-14">
          <span aria-hidden className="caret-up" />
          <span aria-hidden className="block h-px w-12 bg-gs-red" />
          <span className="eyebrow">02 · Эрхэм зорилго</span>
        </div>

        <div className="reveal reveal-delay-1 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <p className="mb-6 max-w-[28ch] text-lg leading-snug text-graphite sm:text-xl">
              Бид үйлчлүүлэгчдийнхээ техникийн бүрэн бүтэн байдлыг хангаж,
            </p>
            <h2
              className="display-wordmark"
              style={{
                fontSize: "clamp(2.5rem, 9vw, 8.5rem)",
                lineHeight: 0.86,
              }}
            >
              <span className="block text-paper">аюулгүй</span>
              <span className="block text-gs-red">зорчиход</span>
              <span className="block text-paper">тусална.</span>
            </h2>
          </div>

          <aside className="flex flex-col gap-8 border-l border-charcoal/60 pl-6 sm:pl-10 lg:col-span-4">
            <div>
              <span className="serial-block block text-gs-red">алсын хараа</span>
              <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-fog sm:text-base">
                Улсдаа хамгийн нэр хүндтэй, харилцагч, үйлчлүүлэгчдийнхээ
                итгэлтэй сонголт болсон авто үйлчилгээний цогцолбор байх.
              </p>
            </div>
            <span aria-hidden className="block h-px bg-charcoal/60" />
            <div>
              <span className="serial-block block text-gs-red">уриа</span>
              <p
                className="mt-3 font-wordmark uppercase text-paper"
                style={{
                  fontSize: "clamp(1.125rem, 1.8vw, 1.5rem)",
                  letterSpacing: "-0.005em",
                  lineHeight: 1.05,
                }}
              >
                Бид таныг аюулгүй зорчиход тусална.
              </p>
            </div>
          </aside>
        </div>

        <ol className="reveal reveal-delay-2 mt-20 grid grid-cols-1 gap-x-10 gap-y-12 border-t border-charcoal/60 pt-14 sm:mt-24 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <li key={p.code} className="relative">
              <span
                aria-hidden
                className="absolute left-0 top-0 block h-1.5 w-12 bg-gs-red"
              />
              <span
                className="mt-6 block font-wordmark text-gs-red"
                style={{
                  fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                }}
              >
                {p.code}
              </span>
              <h3
                className="mt-4 font-sans font-black uppercase tracking-tight text-paper"
                style={{
                  fontSize: "clamp(1.25rem, 2.2vw, 1.625rem)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                }}
              >
                {p.title}
              </h3>
              <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-graphite sm:text-base">
                {p.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="reveal reveal-delay-3 mt-16 flex flex-col items-start gap-6 border-t border-charcoal/60 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <span className="serial-block">
            <span className="text-gs-red">→</span> 2011 ОНООС · 2013 ОНД АВТО СЕРВИС
          </span>
          <a
            href="#uilchilgee"
            className="pressable group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:text-gs-red"
          >
            Үйлчилгээний жагсаалт
            <ArrowRight className="size-4 text-gs-red transition-transform duration-150 ease-out group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
