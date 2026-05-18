import { Suspense } from "react";

import { PhoneIcon } from "./icons";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/contact";
import { getActiveBanner } from "@/lib/admin/banners";
import type { Banner } from "@/lib/admin/types";

/**
 * Slim banner above the navigation.
 *
 * The visible shell renders during static prerender as a sync fallback so the
 * layout under Next 16 Cache Components stays valid; the live read from Vercel
 * Blob streams in inside a Suspense boundary on each request.
 */

const DEFAULT_ANNOUNCEMENT = {
  kicker: "Шинэ",
  body: "TOYOTA, LEXUS жийпийн засвар үйлчилгээ · урьдчилсан цаг захиалга нээлттэй",
  cta: "Цаг захиалах",
  link: PHONE_HREF,
} as const;

type Resolved = {
  kicker: string;
  body: string;
  cta: string;
  link: string;
  ariaLabel: string;
};

function resolveBanner(banner: Banner | null): Resolved {
  if (!banner) {
    return {
      kicker: DEFAULT_ANNOUNCEMENT.kicker,
      body: DEFAULT_ANNOUNCEMENT.body,
      cta: DEFAULT_ANNOUNCEMENT.cta,
      link: DEFAULT_ANNOUNCEMENT.link,
      ariaLabel: `${DEFAULT_ANNOUNCEMENT.cta} · ${PHONE_DISPLAY}`,
    };
  }
  const link = banner.link?.trim() || PHONE_HREF;
  const linksToPhone = link.startsWith("tel:");
  return {
    kicker: banner.title,
    body: banner.body,
    cta: linksToPhone ? "Цаг захиалах" : "Дэлгэрэнгүй",
    link,
    ariaLabel: linksToPhone
      ? `Цаг захиалах · ${PHONE_DISPLAY}`
      : `${banner.title}: ${banner.body}`,
  };
}

export default function AnnouncementBar() {
  return (
    <Suspense fallback={<Bar resolved={resolveBanner(null)} />}>
      <LiveBar />
    </Suspense>
  );
}

async function LiveBar() {
  const banner = await getActiveBanner().catch(() => null);
  return <Bar resolved={resolveBanner(banner)} />;
}

function Bar({ resolved: a }: { resolved: Resolved }) {
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

      {/* Desktop · static notice */}
      <div className="relative mx-auto hidden h-9 max-w-[1440px] items-center justify-between gap-6 px-6 text-[11px] font-medium uppercase tracking-[0.18em] sm:flex lg:px-10">
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-4 place-items-center bg-snow px-1.5 text-[9px] font-bold tracking-[0.2em] text-gs-red"
          >
            {a.kicker}
          </span>
          <span className="text-snow/95">{a.body}</span>
        </span>

        <a
          href={a.link}
          target={a.link.startsWith("http") ? "_blank" : undefined}
          rel={a.link.startsWith("http") ? "noreferrer noopener" : undefined}
          className="group/aa inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] text-snow"
          aria-label={a.ariaLabel}
        >
          <PhoneIcon className="size-3" />
          <span className="hidden md:inline">
            {a.link.startsWith("tel:") ? PHONE_DISPLAY : a.cta}
          </span>
          <span className="md:hidden">{a.cta}</span>
          <span
            aria-hidden
            className="ml-1 inline-block h-px w-6 origin-left scale-x-0 bg-snow transition-transform duration-300 ease-out group-hover/aa:scale-x-100"
          />
        </a>
      </div>

      {/* Mobile · marquee */}
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
                {a.kicker}
              </span>
              <span>{a.body}</span>
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
