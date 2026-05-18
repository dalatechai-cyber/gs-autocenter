type Milestone = {
  year: string;
  title: string;
  body: string;
};

const TIMELINE: Milestone[] = [
  {
    year: "2011",
    title: "Гранд Сутай ХХК",
    body: "Япон улсаас автомашин импортлох, гадаад худалдааны чиглэлээр үүсгэн байгуулагдсан.",
  },
  {
    year: "2013",
    title: "200 & 570 авто сервис",
    body: "TOYOTA болон LEXUS брэндийн жийп ангилалын автомашины засвар үйлчилгээний цех байгуулсан.",
  },
  {
    year: "2019",
    title: "JAPAN TOK дистрибьютор",
    body: "Япон улсын JAPAN TOK брэндийн Монгол улсын албан ёсны дистрибьюторын эрхийг авсан.",
  },
  {
    year: "2023",
    title: "Хөдөлгүүрийн цех",
    body: "Хөдөлгүүрийн оношилгоо, засварын дагнасан мэргэжлийн 2 дахь салбараа байгуулсан.",
  },
  {
    year: "2025",
    title: "GS auto center",
    body: "Шинэ нэр, шинэ түвшин. Хөгжлийн дараагийн үе шатанд шилжсэн.",
  },
];

const VALUES = [
  {
    num: "01",
    title: "Үйлчлүүлэгч",
    body: "Үйлчлүүлэгчдийнхээ итгэлийг хадгалах нь бидний эхний амлалт. Аливаа үйлдэлдээ хариуцлагатай ханддаг.",
  },
  {
    num: "02",
    title: "Ажиллагсад",
    body: "Ажилчдын мэдлэг, чадварыг тасралтгүй сайжруулж, эрүүл аюулгүй ажиллах нөхцлийг бүрдүүлдэг.",
  },
  {
    num: "03",
    title: "Эх орон",
    body: "Хамтрагчдадаа үнэ цэнэ бий болгох замаар Монгол улсын хөгжилд хувь нэмэр оруулдаг.",
  },
];

const PRINCIPLES = [
  "Мэргэжлийн байх",
  "Ил тод байх",
  "Итгэл даах",
  "Хүндлэл ба хамтын ажиллагаа",
];

export default function About() {
  return (
    <section
      id="bidnii-tuhai"
      aria-label="Бидний тухай · Гранд Сутай ХХК / GS auto center"
      className="relative overflow-hidden bg-ink py-24 sm:py-32 lg:py-40"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 block h-px bg-charcoal/60"
      />
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-25"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none overflow-clip"
      >
        <span
          className="absolute bottom-[-12%] right-[-2%] block whitespace-nowrap font-wordmark uppercase text-paper/[0.022]"
          style={{
            fontSize: "clamp(10rem, 30vw, 32rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.04em",
          }}
        >
          2011
        </span>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <header className="reveal lg:col-span-5">
            <div className="mb-7 flex items-center gap-4">
              <span aria-hidden className="block h-px w-12 bg-gs-red" />
              <span className="eyebrow">05 · Бидний тухай</span>
            </div>
            <h2
              className="font-sans font-black uppercase tracking-tight text-paper"
              style={{
                fontSize: "clamp(2rem, 5.5vw, 4.75rem)",
                lineHeight: 0.96,
                letterSpacing: "-0.025em",
              }}
            >
              13 жилийн
              <br />
              <span className="text-gs-red">мэргэшил.</span>
              <br />
              Нэг чиглэл.
            </h2>

            <p className="mt-8 max-w-prose text-base leading-relaxed text-fog sm:text-lg">
              Гранд Сутай ХХК нь 2011 онд гадаад худалдаа, Япон улсаас автомашин
              импортлох чиглэлээр үүсгэн байгуулагдаж, өнөөдөр TOYOTA болон
              LEXUS брэндийн жийп ангилалын автомашин дагнасан, мэргэжлийн авто
              үйлчилгээний цогцолбор болоод байна.
            </p>
          </header>

          <aside className="reveal reveal-delay-2 relative lg:col-span-7 lg:pt-6">
            <div className="mb-6 flex items-center gap-4">
              <span aria-hidden className="block h-px w-12 bg-gs-red" />
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gs-red">
                Эрхэм зорилго
              </p>
            </div>
            <blockquote
              className="font-sans font-bold uppercase tracking-tight text-paper"
              style={{
                fontSize: "clamp(1.5rem, 3.4vw, 2.75rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.015em",
              }}
            >
              Бид үйлчлүүлэгчдийнхээ техникийн{" "}
              <span className="text-graphite">бүрэн бүтэн байдлыг хангаж,</span>{" "}
              <span className="text-gs-red">аюулгүй зорчиход нь туслана.</span>
            </blockquote>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {PRINCIPLES.map((p, i) => (
                <span
                  key={p}
                  className="flex items-baseline gap-2 text-paper"
                >
                  <span className="font-wordmark text-[10px] tabular-nums text-gs-red">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em]">
                    {p}
                  </span>
                </span>
              ))}
            </div>
          </aside>
        </div>

        <div className="reveal mt-24 sm:mt-32">
          <div className="mb-10 flex items-center gap-4">
            <span aria-hidden className="block h-px w-12 bg-gs-red" />
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
              Цаг хугацааны зурвас
            </span>
            <span aria-hidden className="block h-px flex-1 bg-charcoal/50" />
          </div>

          <ol className="relative grid grid-cols-1 gap-0 border-l border-charcoal/60 sm:grid-cols-5 sm:gap-px sm:border-l-0 sm:border-t sm:bg-charcoal/60">
            {TIMELINE.map((m, i) => {
              const delays = ["reveal-delay-1", "reveal-delay-2", "reveal-delay-3", "reveal-delay-4", "reveal-delay-5"];
              return (
                <li
                  key={m.year}
                  className={`reveal ${delays[i]} relative bg-ink p-7 pl-10 sm:p-7 sm:pl-7 lg:p-9`}
                >
                  <span
                    aria-hidden
                    className="absolute left-[-5px] top-9 size-2.5 rotate-45 bg-gs-red sm:hidden"
                  />
                  <span
                    aria-hidden
                    className="absolute left-7 top-[-5px] hidden size-2.5 rotate-45 bg-gs-red sm:block lg:left-9"
                  />
                  <span
                    className="font-wordmark text-gs-red tabular-nums"
                    style={{
                      fontSize: "clamp(1.75rem, 2.8vw, 2.5rem)",
                      lineHeight: 0.9,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {m.year}
                  </span>
                  <h3 className="mt-5 text-[13px] font-bold uppercase tracking-[0.04em] text-paper sm:text-sm">
                    {m.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-graphite">
                    {m.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-24 sm:mt-32">
          <div className="reveal mb-10 flex items-center gap-4">
            <span aria-hidden className="block h-px w-12 bg-gs-red" />
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
              Бидний үнэт зүйлс
            </span>
            <span aria-hidden className="block h-px flex-1 bg-charcoal/50" />
          </div>

          <ol>
            {VALUES.map((v, i) => {
              const delay = ["reveal-delay-1", "reveal-delay-2", "reveal-delay-3"][i];
              return (
                <li
                  key={v.num}
                  className={`reveal ${delay} group/val relative grid grid-cols-[auto_1fr] items-baseline gap-x-6 border-t border-charcoal/60 py-10 sm:gap-x-12 sm:py-14 lg:grid-cols-[160px_minmax(0,1fr)_auto] lg:gap-x-16 ${
                    i === VALUES.length - 1 ? "border-b border-charcoal/60" : ""
                  }`}
                >
                  <span
                    className="font-wordmark text-gs-red tabular-nums"
                    style={{
                      fontSize: "clamp(3rem, 7vw, 6rem)",
                      lineHeight: 0.88,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {v.num}
                  </span>

                  <div className="flex flex-col gap-3 lg:max-w-[58ch]">
                    <h3
                      className="font-sans font-black uppercase tracking-tight text-paper"
                      style={{
                        fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                        lineHeight: 1.04,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {v.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-graphite sm:text-base">
                      {v.body}
                    </p>
                  </div>

                  <span className="col-span-2 mt-2 hidden text-[9px] font-medium uppercase tracking-[0.28em] text-graphite lg:col-span-1 lg:mt-0 lg:block lg:self-start lg:pt-3">
                    Value · {v.num}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
