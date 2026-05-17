"use client";

import { useEffect } from "react";
import { PHONE_HREF, PHONE_DISPLAY } from "@/lib/contact";

export type ModalContent = {
  id: string;
  name: string;
  subtitle: string;
  desc: string;
  bullets: string[];
  category?: string;
};

type Props = {
  open: boolean;
  content: ModalContent | null;
  vehicleLabel: string;
  onClose: () => void;
};

export default function PartModal({ open, content, vehicleLabel, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-6 transition-opacity duration-300 ease-out sm:px-8 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Хаах"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/85 backdrop-blur-md"
      />

      <div
        className={`relative z-10 flex max-h-[90vh] w-full max-w-[920px] flex-col overflow-hidden border border-charcoal/70 bg-ink-raised shadow-[0_40px_120px_-20px_rgba(220,13,1,0.4)] transition-[transform,opacity] duration-300 ease-[var(--ease-mech)] sm:flex-row ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.985] opacity-0"
        }`}
        style={{ borderRadius: "var(--radius-blade)" }}
      >
        <span aria-hidden className="pointer-events-none absolute left-3 top-3 z-10 size-5 border-l border-t border-gs-red/80" />
        <span aria-hidden className="pointer-events-none absolute right-3 top-3 z-10 size-5 border-r border-t border-gs-red/80" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 left-3 z-10 size-5 border-b border-l border-gs-red/80" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 z-10 size-5 border-b border-r border-gs-red/80" />

        <div className="relative h-56 w-full overflow-hidden border-b border-charcoal/60 bg-gradient-to-br from-ink to-ink-raised sm:h-auto sm:w-[44%] sm:border-b-0 sm:border-r">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "linear-gradient(to right,rgba(255,255,255,0.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.06) 1px,transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 30%,rgba(220,13,1,0.32),transparent 65%)",
            }}
          />
          <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-gs-red">
                {content?.category ?? "Үйлчилгээ"}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-graphite">
                {vehicleLabel}
              </div>
            </div>
            {content && (
              <div className="relative">
                <div
                  className="font-wordmark text-[clamp(2.5rem,8vw,4.5rem)] uppercase leading-[0.9] tracking-tight text-paper/15"
                  aria-hidden
                >
                  {content.name.split(" ")[0]}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-paper/70">
                  <span aria-hidden className="block size-1 animate-pulse bg-gs-red" />
                  3D · Интерактив
                </div>
              </div>
            )}
            <div
              aria-hidden
              className="absolute right-6 top-6 text-[9px] uppercase tracking-[0.22em] text-graphite/80"
            >
              {content?.id ?? ""}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <header className="flex items-start justify-between gap-4 border-b border-charcoal/60 px-6 py-6 sm:px-8 sm:py-7">
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gs-red">
                {content?.subtitle ?? "—"}
              </div>
              <h3 className="mt-2 font-wordmark text-[clamp(1.5rem,3.5vw,2.25rem)] uppercase leading-tight tracking-tight text-paper">
                {content?.name ?? ""}
              </h3>
            </div>
            <button
              type="button"
              aria-label="Хаах"
              onClick={onClose}
              className="relative size-10 shrink-0 border border-charcoal/70 text-paper transition-colors duration-150 hover:border-gs-red hover:text-gs-red focus-visible:border-gs-red focus-visible:text-gs-red"
            >
              <span aria-hidden className="absolute left-1/2 top-1/2 block h-px w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
              <span aria-hidden className="absolute left-1/2 top-1/2 block h-px w-4 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
            </button>
          </header>

          <div className="flex flex-1 flex-col gap-6 px-6 py-7 sm:px-8 sm:py-8">
            <div>
              <div className="eyebrow mb-3">GS Auto Center дээр</div>
              <p className="text-[15px] leading-relaxed text-paper/85 sm:text-base">
                {content?.desc ?? ""}
              </p>
            </div>

            {content?.bullets && content.bullets.length > 0 && (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-charcoal/60 pt-5">
                {content.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-[11px] uppercase tracking-[0.14em] text-paper/85"
                  >
                    <span aria-hidden className="mt-[5px] block size-1 bg-gs-red" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            <a
              href={PHONE_HREF}
              className="group/cta mt-auto flex items-center justify-between gap-3 border border-gs-red bg-gs-red px-5 py-4 text-snow transition-colors duration-150 hover:border-gs-red-600 hover:bg-gs-red-600"
            >
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">
                  Цаг захиалах
                </span>
                <span className="font-wordmark text-lg uppercase tracking-tight sm:text-xl">
                  {PHONE_DISPLAY}
                </span>
              </span>
              <span
                aria-hidden
                className="block size-2.5 origin-center rotate-45 border-r border-t border-snow transition-transform duration-150 group-hover/cta:translate-x-1"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
