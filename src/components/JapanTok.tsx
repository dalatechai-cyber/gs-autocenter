import CountUp from "./CountUp";

const PART_TYPES = [
  "Цаапны шаарик",
  "5 бул / 3 бул",
  "Гармушик резин",
  "Амортизатор",
  "Өндгөн тулгуур",
  "Босоо тэнцүүлэгч",
  "Тяг · Шарнер",
  "Тулк · Свеча",
  "Наклад",
];

const AIMAGS = [
  "Дархан-Уул",
  "Орхон",
  "Дорнод",
  "Баянхонгор",
  "Сэлэнгэ",
  "Өмнөговь",
  "Увс",
  "Завхан",
];

export default function JapanTok() {
  return (
    <section
      id="selbeg"
      aria-label="JAPAN TOK · Монгол улсын албан ёсны дистрибьютор"
      className="relative isolate overflow-hidden border-y border-charcoal/60 bg-[#0d0d0d]"
    >
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute -left-1/4 top-1/4 h-[60vh] w-[80vw]"
      />
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-40"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none overflow-clip"
      >
        <span
          className="absolute -top-6 left-[-3%] block whitespace-nowrap font-wordmark uppercase text-paper/[0.022]"
          style={{
            fontSize: "clamp(9rem, 22vw, 24rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.04em",
          }}
        >
          JAPAN TOK
        </span>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-10 sm:py-32 lg:px-16 lg:py-40">
        <div className="reveal mb-12 flex flex-wrap items-center gap-4">
          <span aria-hidden className="block h-px w-12 bg-gs-red" />
          <span className="eyebrow">03 · Сэлбэг</span>
          <span aria-hidden className="block h-px w-6 bg-charcoal/60" />
          <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-graphite">
            Албан ёсны дистрибьютор
          </span>
        </div>

        <div className="reveal max-w-[1100px]">
          <div className="flex items-baseline gap-5">
            <span
              className="font-wordmark text-gs-red tabular-nums"
              style={{
                fontSize: "clamp(2.25rem, 4.5vw, 4rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.02em",
              }}
            >
              2019
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-graphite">
              since
            </span>
          </div>

          <h2
            className="mt-8 font-sans font-black uppercase tracking-tight text-paper"
            style={{
              fontSize: "clamp(2rem, 5.5vw, 5rem)",
              lineHeight: 0.96,
              letterSpacing: "-0.03em",
              textWrap: "balance",
              wordBreak: "keep-all",
              overflowWrap: "break-word",
              hyphens: "auto",
            }}
          >
            <span className="font-wordmark text-gs-red">JAPAN TOK</span>{" "}
            Монголын албан ёсны{" "}
            <span className="text-gs-red">дистрибьютор.</span>
          </h2>

          <p className="mt-10 max-w-prose text-base leading-relaxed text-fog sm:text-lg">
            &ldquo;Гранд Сутай&rdquo; ХХК нь 2019 онд Япон улсын JAPAN TOK
            брэндийн албан ёсны дистрибьюторын эрхийг авч, Монголын зах
            зээлд гарал үүсэл нь тодорхой, чанар стандартыг хангасан, бүх
            төрлийн Япон суудлын автомашины явах эд ангийн сэлбэгийг
            импортлон худалдаалж байна.
          </p>
        </div>

        <div className="reveal reveal-delay-2 mt-14 grid grid-cols-1 gap-px overflow-hidden border border-charcoal/60 bg-charcoal/60 sm:grid-cols-3">
          <StatBlock
            value={70}
            suffix="+"
            label="борлуулалтын цэг"
            subtitle="Улаанбаатар хот"
          />
          <StatBlock value={10} suffix="+" label="аймаг" subtitle="Орон нутаг" />
          <StatBlock value={2000} suffix="+" separator label="сэлбэгийн нэр төрөл" subtitle="SKU" />
        </div>

        <div className="reveal mt-20">
          <div className="mb-6 flex items-center gap-4">
            <span aria-hidden className="block h-px w-12 bg-gs-red" />
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
              Сэлбэгийн төрөл
            </span>
            <span aria-hidden className="block h-px flex-1 bg-charcoal/50" />
          </div>
          <ul className="flex flex-wrap gap-2">
            {PART_TYPES.map((p) => (
              <li
                key={p}
                className="inline-flex items-center gap-2 border border-charcoal/60 bg-ink px-4 py-2.5 text-[11px] font-medium text-paper transition-colors duration-150 ease-out hover:border-gs-red"
              >
                <span aria-hidden className="block size-1 bg-gs-red" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal mt-12">
          <div className="mb-6 flex items-center gap-4">
            <span aria-hidden className="block h-px w-12 bg-gs-red" />
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
              Орон нутгийн борлуулагч
            </span>
            <span aria-hidden className="block h-px flex-1 bg-charcoal/50" />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {AIMAGS.map((a, i) => (
              <span key={a} className="flex items-baseline gap-3 text-paper">
                <span className="font-wordmark text-[10px] uppercase tracking-[0.22em] tabular-nums text-gs-red">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium sm:text-base">{a}</span>
              </span>
            ))}
            <span className="text-[10px] uppercase tracking-[0.2em] text-graphite">
              + бусад
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatBlock({
  value,
  suffix,
  separator,
  label,
  subtitle,
  variant,
}: {
  value: number;
  suffix?: string;
  separator?: boolean;
  label: string;
  subtitle: string;
  variant?: "lead";
}) {
  const isLead = variant === "lead";
  return (
    <div
      className={`flex items-end justify-between gap-5 bg-ink px-6 py-7 sm:px-8 sm:py-8 ${
        isLead ? "col-span-2 sm:py-10" : ""
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <span
          className="font-wordmark text-gs-red tabular-nums"
          style={{
            fontSize: isLead
              ? "clamp(3.25rem, 7vw, 5.5rem)"
              : "clamp(2rem, 3.6vw, 3rem)",
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
          }}
        >
          <CountUp to={value} suffix={suffix} separator={separator} />
        </span>
        <span
          className={`font-medium uppercase tracking-[0.2em] text-paper ${
            isLead ? "text-xs sm:text-sm" : "text-[10px] sm:text-[11px]"
          }`}
        >
          {label}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-[0.22em] text-graphite">
        {subtitle}
      </span>
    </div>
  );
}
