import { PhoneIcon } from "./icons";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/contact";

/**
 * Slim banner above the navigation. Will be CMS-driven in a future session;
 * for now a single Mongolian message is rendered as a marquee on narrow
 * viewports and as a centered notice on desktop. The component renders
 * server-side, CSS handles the motion.
 */
const ANNOUNCEMENT = {
  kicker: "Шинэ",
  body: "11-р сарын засварын үйлчилгээнд 15% хямдрал · урьдчилсан цаг захиалга нээлттэй",
  cta: "Цаг захиалах",
};

export default function AnnouncementBar() {
  const repeated = Array.from({ length: 4 });

  return (
    <div
      role="region"
      aria-label="Зарлал"
      className="fixed inset-x-0 top-0 z-[60] bg-gs-red text-snow"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 22px, rgba(255,255,255,0.12) 22px 23px)",
        }}
      />

      {/* Desktop: static notice with kicker on the left, contact on the right */}
      <div className="relative mx-auto hidden h-9 max-w-[1440px] items-center justify-between gap-6 px-6 text-[11px] font-medium uppercase tracking-[0.18em] sm:flex lg:px-10">
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-4 place-items-center bg-snow px-1.5 text-[9px] font-bold tracking-[0.2em] text-gs-red"
          >
            {ANNOUNCEMENT.kicker}
          </span>
          <span className="text-snow/95">{ANNOUNCEMENT.body}</span>
        </span>

        <a
          href={PHONE_HREF}
          className="group/aa inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] text-snow"
          aria-label={`${ANNOUNCEMENT.cta} · ${PHONE_DISPLAY}`}
        >
          <PhoneIcon className="size-3" />
          <span className="hidden md:inline">{PHONE_DISPLAY}</span>
          <span className="md:hidden">{ANNOUNCEMENT.cta}</span>
          <span
            aria-hidden
            className="ml-1 inline-block h-px w-6 origin-left scale-x-0 bg-snow transition-transform duration-300 ease-out group-hover/aa:scale-x-100"
          />
        </a>
      </div>

      {/* Mobile: continuous marquee */}
      <div className="ticker-pause relative flex h-9 items-center overflow-hidden sm:hidden">
        <div className="ticker-track">
          {repeated.map((_, i) => (
            <span
              key={i}
              className="flex shrink-0 items-center gap-3 text-[10.5px] font-medium uppercase tracking-[0.18em]"
            >
              <span
                aria-hidden
                className="grid h-4 place-items-center bg-snow px-1.5 text-[9px] font-bold tracking-[0.2em] text-gs-red"
              >
                {ANNOUNCEMENT.kicker}
              </span>
              <span>{ANNOUNCEMENT.body}</span>
              <span
                aria-hidden
                className="mx-2 block size-1 shrink-0 bg-snow"
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
