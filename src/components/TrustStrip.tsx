import CountUp from "./CountUp";

type Stat = {
  value: number;
  suffix?: string;
  small?: string;
  literal?: string;
  separator?: boolean;
  label: string;
  /** Optional supporting line shown only on the lead cell. */
  lead?: string;
};

const STATS: Stat[] = [
  { value: 13, suffix: "+", label: "жилийн туршлага", lead: "Since 2011" },
  { value: 8000, suffix: "+", separator: true, label: "үйлчлүүлэгч" },
  { value: 40, suffix: "+", label: "мэргэжилтэн" },
  { value: 2000, suffix: "+", separator: true, label: "сэлбэг" },
  { value: 0, literal: "MNS", small: "5025:2010", label: "улсын стандарт" },
];

export default function TrustStrip() {
  return (
    <section
      aria-label="GS Auto Center · статистик ба стандарт"
      className="relative border-y border-charcoal/60 bg-ink"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 block h-px bg-gs-red"
      />
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-25"
      />

      {/*
        Asymmetric grid: lead cell (13+) spans 2 cols on desktop so it
        carries more weight than the others. Breaks the "5 identical cells"
        template.
      */}
      <div className="relative mx-auto grid max-w-[1440px] grid-cols-2 lg:grid-cols-6">
        {STATS.map((stat, i) => (
          <StatCell key={stat.label} index={i} {...stat} />
        ))}
      </div>
    </section>
  );
}

function StatCell({
  value,
  suffix,
  literal,
  small,
  separator,
  label,
  lead,
  index,
}: Stat & { index: number }) {
  const isLead = index === 0;

  const mobileBorders = [
    "",
    "border-l border-charcoal/50",
    "border-t border-charcoal/50",
    "border-l border-t border-charcoal/50",
    "col-span-2 border-t border-charcoal/50",
  ][index];

  const desktopSpan = isLead ? "lg:col-span-2" : "lg:col-span-1";
  const desktopBorders = isLead
    ? "lg:border-l-0 lg:border-t-0"
    : "lg:border-l lg:border-t-0 lg:border-charcoal/50";

  const delayClass = [
    "reveal-delay-1",
    "reveal-delay-2",
    "reveal-delay-3",
    "reveal-delay-4",
    "reveal-delay-5",
  ][index];

  return (
    <div
      className={`reveal ${delayClass} ${desktopSpan} relative flex flex-col gap-3 px-5 py-9 sm:px-8 sm:py-12 lg:px-10 lg:py-16 ${mobileBorders} ${desktopBorders}`}
    >
      <span
        aria-hidden
        className="font-wordmark text-[10px] uppercase tracking-[0.24em] tabular-nums text-gs-red"
      >
        {String(index + 1).padStart(2, "0")}
        {lead ? <span className="ml-3 text-graphite">{lead}</span> : null}
      </span>

      <span
        className="font-wordmark text-gs-red tabular-nums"
        style={{
          fontSize: isLead
            ? "clamp(3.25rem, 8vw, 6rem)"
            : "clamp(2.25rem, 5vw, 3.75rem)",
          lineHeight: 0.92,
          letterSpacing: "-0.02em",
        }}
      >
        {literal ? (
          literal
        ) : (
          <CountUp to={value} suffix={suffix} separator={separator} />
        )}
        {small && (
          <span className="ml-2 align-top text-base font-medium tracking-normal text-paper sm:text-lg">
            {small}
          </span>
        )}
      </span>

      <span
        className={`font-medium uppercase tracking-[0.22em] text-graphite ${
          isLead ? "text-[11px] sm:text-xs" : "text-[10px] sm:text-[11px]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
