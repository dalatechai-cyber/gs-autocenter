"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { href: "#uilchilgee", label: "Үйлчилгээ" },
  { href: "#selbeg", label: "Сэлбэг" },
  { href: "#mashin", label: "Машинууд" },
  { href: "#bidnii-tuhai", label: "Бидний тухай" },
  { href: "#holboo", label: "Холбоо барих" },
] as const;

const PHONE_HREF = "tel:+97677200570";
const PHONE_DISPLAY = "+976 77-200-570";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        data-scrolled={scrolled || undefined}
        className="group/nav fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[background-color,backdrop-filter,border-color] duration-300 ease-out data-[scrolled]:border-charcoal/60 data-[scrolled]:bg-ink/85 data-[scrolled]:backdrop-blur-md"
      >
        {/* Red hairline — wipes in on scroll */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gs-red transition-transform duration-500 ease-out group-data-[scrolled]/nav:scale-x-100"
        />

        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:h-20 sm:px-10 lg:px-16">
          {/* Logo */}
          <Link
            href="/"
            aria-label="GS Auto Center — нүүр хуудас"
            className="flex shrink-0 items-center"
          >
            <Image
              src="/logo/gs-logo-horizontal-white.png"
              alt="GS Auto Center"
              width={540}
              height={212}
              priority
              className="h-8 w-auto sm:h-9 lg:h-10"
            />
          </Link>

          {/* Desktop links */}
          <nav
            className="hidden items-center gap-9 lg:flex"
            aria-label="Үндсэн цэс"
          >
            {LINKS.map(({ href, label }) => (
              <NavLink key={href} href={href} label={label} />
            ))}
          </nav>

          {/* Desktop CTA */}
          <a
            href={PHONE_HREF}
            className="hidden items-center gap-2 bg-gs-red px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-snow transition-colors duration-150 ease-out hover:bg-gs-red-600 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-snow lg:inline-flex"
          >
            <PhoneIcon className="size-3.5" />
            Цаг захиалах
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={open ? "Цэс хаах" : "Цэс нээх"}
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((v) => !v)}
            className="relative flex size-10 items-center justify-center lg:hidden"
          >
            <span
              aria-hidden
              className={`absolute h-px w-7 bg-paper transition-transform duration-200 ease-out ${open ? "rotate-45" : "-translate-y-1.5"}`}
            />
            <span
              aria-hidden
              className={`absolute h-px w-7 bg-paper transition-opacity duration-150 ease-out ${open ? "opacity-0" : "opacity-100"}`}
            />
            <span
              aria-hidden
              className={`absolute h-px w-7 bg-paper transition-transform duration-200 ease-out ${open ? "-rotate-45" : "translate-y-1.5"}`}
            />
          </button>
        </div>
      </header>

      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group/link relative text-[12px] font-medium uppercase tracking-[0.16em] text-paper/85 transition-colors duration-150 ease-out hover:text-paper"
    >
      <span>{label}</span>
      <span
        aria-hidden
        className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-gs-red transition-transform duration-300 ease-out group-hover/link:scale-x-100"
      />
    </Link>
  );
}

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      id="mobile-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Үндсэн цэс"
      aria-hidden={!open}
      className={`fixed inset-0 z-40 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={`absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity duration-200 ease-out ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-[88vw] max-w-sm flex-col overflow-hidden border-l border-charcoal/60 bg-ink transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div
          aria-hidden
          className="grid-engraved pointer-events-none absolute inset-0 opacity-40"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gs-red"
        />

        {/* Header bar — matches main nav height */}
        <div className="relative flex h-16 items-center justify-between border-b border-charcoal/60 px-5 sm:h-20 sm:px-7">
          <span className="text-[10px] uppercase tracking-[0.24em] text-graphite">
            Цэс
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Цэс хаах"
            className="relative flex size-10 items-center justify-center text-paper"
          >
            <span aria-hidden className="absolute h-px w-7 rotate-45 bg-paper" />
            <span aria-hidden className="absolute h-px w-7 -rotate-45 bg-paper" />
          </button>
        </div>

        {/* Links */}
        <nav
          className="relative flex flex-1 flex-col px-5 pt-10 sm:px-7"
          aria-label="Үндсэн цэс"
        >
          <ol className="flex flex-col gap-7">
            {LINKS.map(({ href, label }, i) => (
              <li
                key={href}
                style={{
                  animation: open ? "var(--animate-rise)" : undefined,
                  animationDelay: `${120 + i * 60}ms`,
                }}
                className="flex items-baseline gap-4"
              >
                <span className="font-wordmark text-[10px] uppercase tracking-[0.24em] tabular-nums text-gs-red">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Link
                  href={href}
                  onClick={onClose}
                  className="font-sans text-2xl font-black uppercase tracking-tight text-paper transition-colors duration-150 ease-out hover:text-gs-red"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        {/* Phone block — bottom */}
        <div className="relative border-t border-charcoal/60 px-5 py-6 sm:px-7">
          <div className="text-[10px] uppercase tracking-[0.22em] text-graphite">
            Утсаар холбоо барих
          </div>
          <a
            href={PHONE_HREF}
            onClick={onClose}
            className="mt-2 flex items-center gap-3 font-sans text-2xl font-black tabular-nums text-paper transition-colors duration-150 ease-out hover:text-gs-red"
          >
            <PhoneIcon className="size-5 text-gs-red" />
            {PHONE_DISPLAY}
          </a>
          <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-graphite">
            <span aria-hidden className="block size-1.5 bg-gs-red" />
            <span>Өдөр бүр 09:00 – 19:00 · Салбар 1</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
      className={className}
    >
      <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}
