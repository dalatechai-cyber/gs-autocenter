import { ArrowRight, PhoneIcon } from "./icons";
import { PHONE_HREF } from "@/lib/contact";

type Service = {
  num: string;
  title: string;
  body: string;
};

const PRIMARY: Service[] = [
  {
    num: "01",
    title: "Иж бүрэн үзлэг, оношилгоо",
    body: "Компьютер оношилгоогоор хослуулсан, машины бүх системийн нарийвчилсан үнэлгээ.",
  },
  {
    num: "02",
    title: "Хөдөлгүүрийн засвар",
    body: "Дагнасан хөдөлгүүрийн цех (2023 онд байгуулагдсан), мэргэшсэн инженерүүдтэй.",
  },
  {
    num: "03",
    title: "Явах эд ангийн засвар",
    body: "Цаапны шаарик, амортизатор, өндгөн тулгуур, тяг. JAPAN TOK оригинал сэлбэгээр.",
  },
  {
    num: "04",
    title: "Цахилгааны оношилгоо, засвар",
    body: "Бүх төрлийн цахилгаан системийн алдаа илрүүлэх, шуурхай засвар үйлчилгээ.",
  },
  {
    num: "05",
    title: "Тос, тосолгооны үйлчилгээ",
    body: "БНСУ, Герман, Англи зэрэг улсын чанартай тос, тосолгооны материалаар.",
  },
  {
    num: "06",
    title: "Оригинал сэлбэгийн захиалга",
    body: "АНУ, Япон, Араб зэрэг орноос OEM шинэ, хуучин задаргаа, AfterMarket сэлбэг.",
  },
];

const SECONDARY = [
  "Тэнхлэг тохиргоо",
  "Тормосны пиланз өнгөлгөө",
  "Зуны эйркондишн цэнэглэх",
  "Өвлийн паар, халаалтын систем",
  "Авто химийн бүтээгдэхүүн",
  "Авто арчилгаа, дагалдах хэрэгсэл",
  "Гадна эд анги, кузов сэлбэг",
];

export default function Services() {
  return (
    <section
      id="uilchilgee"
      aria-label="GS Auto Center · үйлчилгээний жагсаалт"
      className="relative overflow-hidden bg-ink py-24 sm:py-32 lg:py-40"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 block h-px bg-charcoal/60"
      />
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-30"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none overflow-clip"
      >
        <span
          className="absolute bottom-[-8%] left-[-3%] block whitespace-nowrap font-wordmark uppercase text-paper/[0.025]"
          style={{
            fontSize: "clamp(8rem, 20vw, 20rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.04em",
          }}
        >
          SERVICE
        </span>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
        <header className="reveal grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="mb-7 flex items-center gap-4">
              <span aria-hidden className="block h-px w-12 bg-gs-red" />
              <span className="eyebrow">02 · Үйлчилгээ</span>
            </div>
            <h2
              className="font-sans font-black uppercase tracking-tight text-paper"
              style={{
                fontSize: "clamp(2rem, 5.5vw, 4.75rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.025em",
              }}
            >
              Үндсэн
              <br />
              <span className="text-gs-red">үйлчилгээний</span>
              <br />
              чиглэл.
            </h2>
          </div>

          <div className="lg:col-span-5 lg:pt-6">
            <p className="max-w-prose text-base leading-relaxed text-fog sm:text-lg">
              GS auto center нь Монгол улсын{" "}
              <span className="text-paper">MNS 5025:2010</span> авто
              үйлчилгээний стандартын шаардлагыг бүрэн хангасан, сүүлийн үеийн
              дэвшилтэт техник, тоног төхөөрөмжөөр бүрэн тоноглогдсон
              мэргэжлийн авто засварын төв юм.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["хүчирхэг", "Мэргэжлийн", "тогтвортой", "чанартай"].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 border border-charcoal/60 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-paper"
                >
                  <span aria-hidden className="block size-1 bg-gs-red" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Editorial rows: massive numeral / hairline separators / no enclosed cells */}
        <ol className="mt-20 sm:mt-24">
          {PRIMARY.map((s, i) => (
            <ServiceRow key={s.num} {...s} index={i} last={i === PRIMARY.length - 1} />
          ))}
        </ol>

        <div className="reveal mt-16 sm:mt-20">
          <div className="mb-7 flex items-center gap-4">
            <span aria-hidden className="block h-px w-12 bg-gs-red" />
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
              Нэмэлт үйлчилгээ · {String(SECONDARY.length).padStart(2, "0")}
            </span>
            <span aria-hidden className="block h-px flex-1 bg-charcoal/50" />
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {SECONDARY.map((s, i) => (
              <li
                key={s}
                className="group/chip flex items-baseline gap-3 text-paper"
              >
                <span
                  aria-hidden
                  className="font-wordmark text-[10px] uppercase tracking-[0.22em] tabular-nums text-gs-red"
                >
                  {String(i + 7).padStart(2, "0")}
                </span>
                <span className="text-[13px] font-medium sm:text-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal mt-16 flex flex-col items-start justify-between gap-6 border-t border-charcoal/60 pt-10 sm:mt-20 sm:flex-row sm:items-center">
          <p className="max-w-md text-sm text-graphite sm:text-base">
            Тантай нийцэх цаг, үйлчилгээний төрлийг манай мэргэжилтэн утсаар
            тодорхойлж өгнө.
          </p>
          <a
            href={PHONE_HREF}
            className="group/cta inline-flex items-center gap-3 bg-gs-red px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-snow transition-colors duration-150 ease-out hover:bg-gs-red-600 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-snow"
          >
            <PhoneIcon className="size-4" />
            Цаг захиалах
            <ArrowRight className="size-4 transition-transform duration-150 ease-out group-hover/cta:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}

function ServiceRow({
  num,
  title,
  body,
  index,
  last,
}: Service & { index: number; last: boolean }) {
  const delays = [
    "reveal-delay-1",
    "reveal-delay-2",
    "reveal-delay-3",
    "reveal-delay-1",
    "reveal-delay-2",
    "reveal-delay-3",
  ];
  const isLead = index === 0;
  return (
    <li
      className={`reveal ${delays[index]} group/svc relative grid grid-cols-[auto_1fr] items-baseline gap-x-6 border-t border-charcoal/60 py-10 transition-colors duration-200 ease-out hover:bg-ink-raised/40 sm:gap-x-12 sm:py-14 lg:grid-cols-[140px_1fr_auto] lg:gap-x-16 ${
        last ? "border-b border-charcoal/60" : ""
      }`}
    >
      <span
        className="font-wordmark text-gs-red tabular-nums"
        style={{
          fontSize: isLead
            ? "clamp(3.5rem, 8vw, 7rem)"
            : "clamp(2.75rem, 6vw, 5rem)",
          lineHeight: 0.88,
          letterSpacing: "-0.02em",
        }}
      >
        {num}
      </span>

      <div className="flex flex-col gap-3 lg:max-w-[64ch]">
        <h3
          className="font-sans font-black uppercase tracking-tight text-paper"
          style={{
            fontSize: isLead
              ? "clamp(1.5rem, 3.2vw, 2.5rem)"
              : "clamp(1.25rem, 2.4vw, 1.875rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </h3>
        <p
          className={`leading-relaxed text-graphite ${
            isLead ? "text-base sm:text-lg" : "text-sm sm:text-base"
          }`}
        >
          {body}
        </p>
      </div>

      <ArrowRight className="col-span-2 hidden size-5 text-paper/30 transition-all duration-300 ease-out group-hover/svc:translate-x-1 group-hover/svc:text-gs-red lg:col-span-1 lg:block" />
    </li>
  );
}
