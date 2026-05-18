import Link from "next/link";

import { readBanners } from "@/lib/admin/banners";
import type { Banner } from "@/lib/admin/types";
import { deleteBannerAction, toggleBannerActiveAction } from "../actions";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("mn-MN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

type Tone = "live" | "scheduled" | "ended" | "off";

function bannerStatus(b: Banner, now = Date.now()): { label: string; tone: Tone } {
  const start = Date.parse(b.startDate);
  const end = Date.parse(b.endDate);
  if (!b.isActive) return { label: "Идэвхгүй", tone: "off" };
  if (now < start) return { label: "Хүлээгдэж буй", tone: "scheduled" };
  if (now > end) return { label: "Хугацаа дууссан", tone: "ended" };
  return { label: "Шууд эфирт", tone: "live" };
}

export default async function AdminDashboardPage() {
  const banners = await readBanners();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.28em] text-graphite">
            Самбар · Banners
          </span>
          <h1 className="mt-2 font-sans text-3xl font-black uppercase leading-tight tracking-tight text-paper sm:text-4xl">
            Зарлалууд
          </h1>
          <p className="mt-2 max-w-xl text-sm text-graphite">
            Сайтын хамгийн дээд талын зарлалын мөрийг эндээс удирдана.
            Идэвхтэй болгосон зарлал нэн даруй харагдана.
          </p>
        </div>
        <Link
          href="/admin/banners/new"
          className="pressable cta-shine inline-flex items-center gap-2 bg-gs-red px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-snow transition-colors duration-150 ease-out hover:bg-gs-red-600"
        >
          + Шинэ зарлал
        </Link>
      </header>

      {banners.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {banners.map((b) => (
            <li key={b.id}>
              <BannerCard banner={b} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative border border-dashed border-charcoal/80 bg-ink-card px-6 py-16 text-center">
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-30"
      />
      <div className="relative">
        <span className="font-wordmark text-[10px] uppercase tracking-[0.28em] text-gs-red">
          Хоосон
        </span>
        <h2 className="mt-3 font-sans text-2xl font-black uppercase tracking-tight text-paper">
          Одоогоор зарлал алга
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-graphite">
          Эхний зарлалаа үүсгээд сайтын дээд талын мөрөнд гаргана уу.
        </p>
        <Link
          href="/admin/banners/new"
          className="pressable mt-6 inline-flex bg-gs-red px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-snow hover:bg-gs-red-600"
        >
          Эхний зарлалаа үүсгэх
        </Link>
      </div>
    </div>
  );
}

function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  const styles: Record<Tone, string> = {
    live: "border-gs-red text-gs-red",
    scheduled: "border-paper/40 text-paper",
    ended: "border-iron text-iron",
    off: "border-charcoal text-graphite",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] ${styles[tone]}`}
    >
      {tone === "live" ? (
        <span
          aria-hidden
          className="block size-1.5 animate-[bar-pulse_2.4s_ease-in-out_infinite] bg-gs-red"
        />
      ) : null}
      {label}
    </span>
  );
}

function BannerCard({ banner }: { banner: Banner }) {
  const status = bannerStatus(banner);
  return (
    <article className="relative border border-charcoal/80 bg-ink-card">
      <div className="grid grid-cols-1 gap-6 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={status.tone} label={status.label} />
            <span className="text-[10px] uppercase tracking-[0.22em] text-graphite">
              {dateFmt.format(new Date(banner.startDate))} —{" "}
              {dateFmt.format(new Date(banner.endDate))}
            </span>
          </div>
          <h2 className="font-sans text-xl font-bold leading-tight tracking-tight text-paper">
            {banner.title}
          </h2>
          <p className="line-clamp-2 max-w-xl text-sm text-fog">{banner.body}</p>
          {banner.link ? (
            <span className="truncate font-mono text-[11px] text-graphite">
              ↗ {banner.link}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          <Link
            href={`/admin/banners/${banner.id}`}
            className="pressable border border-charcoal/80 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-paper hover:border-paper"
          >
            Засах
          </Link>
          <form action={toggleBannerActiveAction}>
            <input type="hidden" name="id" value={banner.id} />
            <input
              type="hidden"
              name="nextActive"
              value={String(!banner.isActive)}
            />
            <button
              type="submit"
              className="pressable w-full border border-charcoal/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-paper hover:border-gs-red hover:text-gs-red"
            >
              {banner.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
            </button>
          </form>
          <form action={deleteBannerAction}>
            <input type="hidden" name="id" value={banner.id} />
            <button
              type="submit"
              className="pressable w-full border border-charcoal/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-paper hover:border-gs-red hover:text-gs-red"
            >
              Устгах
            </button>
          </form>
        </div>
      </div>

      {banner.imageUrl ? (
        <div className="border-t border-charcoal/60 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-graphite sm:px-6">
          <span className="text-iron">Зураг:</span>{" "}
          <a
            href={banner.imageUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-paper hover:text-gs-red"
          >
            нээх ↗
          </a>
        </div>
      ) : null}
    </article>
  );
}
