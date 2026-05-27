"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PhoneIcon } from "./icons";
import {
  BRANCH_1_HOURS,
  BRANCH_1_LOCATION,
  PHONE_DISPLAY,
  PHONE_HREF,
} from "@/lib/contact";

const LINKS = [
  { href: "#uilchilgee", label: "Үйлчилгээ" },
  { href: "#selbeg", label: "Сэлбэг" },
  { href: "#mashin", label: "Машинууд" },
  { href: "#bidnii-tuhai", label: "Бидний тухай" },
  { href: "#holboo-barih", label: "Холбоо барих" },
] as const;

/**
 * Mobile-only Client island: hamburger button + slide-in drawer.
 * Holds the only piece of React state that the Nav needs (drawer open/closed).
 * Renders nothing on desktop (lg:hidden / lg:flex hides the trigger).
 *
 * Split out from Nav.tsx so the rest of the navigation (logo, desktop links,
 * desktop CTA) renders as a Server Component — no hydration of the LCP-area
 * DOM tree.
 */
export default function NavMobileMenu() {
  const [open, setOpen] = useState(false);

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

      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
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
      className={`fixed inset-0 top-9 z-40 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
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

        {/* Header bar · matches main nav height */}
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
          <ul className="flex flex-col gap-7">
            {LINKS.map(({ href, label }, i) => (
              <li
                key={href}
                style={{
                  animation: open ? "var(--animate-rise)" : undefined,
                  animationDelay: `${120 + i * 60}ms`,
                }}
                className="flex items-baseline gap-4"
              >
                <span
                  aria-hidden
                  className="font-wordmark text-[10px] uppercase tracking-[0.24em] tabular-nums text-gs-red"
                >
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
          </ul>
        </nav>

        {/* Phone block · bottom */}
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
            <span>
              {BRANCH_1_HOURS} · {BRANCH_1_LOCATION.split(" · ")[1]}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
