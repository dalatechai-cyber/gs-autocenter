const STATS = [
  { value: "13+", label: "жил" },
  { value: "8,000+", label: "үйлчлүүлэгч" },
  { value: "40+", label: "мэргэжилтэн" },
  { value: "2,000+", label: "сэлбэг" },
  { value: "MNS", small: "5025:2010", label: "улсын стандарт" },
] as const;

export default function TrustStrip() {
  return (
    <section
      aria-label="GS Auto Center — статистик ба стандарт"
      className="relative border-y border-charcoal/60 bg-ink"
    >
      {/* One red hairline per section — at the top edge */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 block h-px bg-gs-red"
      />
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-25"
      />

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-2 lg:grid-cols-5">
        {STATS.map((stat, i) => (
          <Stat key={stat.label} index={i} {...stat} />
        ))}
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  small,
  index,
}: {
  value: string;
  label: string;
  small?: string;
  index: number;
}) {
  // Border map:
  // Mobile (2-col grid): vertical line between cells in same row, horizontal
  // lines above rows 2 and 3. Last cell spans both columns on row 3.
  // Desktop (5-col): vertical lines between adjacent cells, no horizontals.
  const mobileBorders = [
    "",
    "border-l border-charcoal/50",
    "border-t border-charcoal/50",
    "border-l border-t border-charcoal/50",
    "col-span-2 border-t border-charcoal/50",
  ][index];

  const desktopBorders =
    index === 0
      ? "lg:border-l-0 lg:border-t-0"
      : "lg:border-l lg:border-t-0 lg:border-charcoal/50";

  return (
    <div
      className={`relative flex flex-col gap-3 px-5 py-9 sm:px-8 sm:py-12 lg:px-10 lg:py-14 ${mobileBorders} ${desktopBorders} ${index === 4 ? "lg:col-span-1" : ""}`}
    >
      {/* Cell index — decorative, hidden from screen readers */}
      <span
        aria-hidden
        className="font-wordmark text-[10px] uppercase tracking-[0.24em] tabular-nums text-gs-red"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Numeral — Audiowide red, oversized */}
      <span
        className="font-wordmark text-gs-red tabular-nums"
        style={{
          fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
        {small && (
          <span className="ml-2 align-top text-base font-medium tracking-normal text-paper sm:text-lg">
            {small}
          </span>
        )}
      </span>

      {/* Label — Montserrat Cyrillic */}
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-graphite sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}
