"use client";

import { useEffect, useRef } from "react";

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
  /** Maximum pixel displacement under cursor. Default 10. */
  strength?: number;
};

/**
 * Anchor that pulls toward the cursor while hovered, then springs back.
 * Disabled on touch / coarse pointers and when reduced-motion is requested.
 */
export default function MagneticButton({
  href,
  className,
  children,
  strength = 10,
}: Props) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const fine = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    let rafId = 0;
    let tx = 0;
    let ty = 0;

    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      tx = Math.max(-1, Math.min(1, dx)) * strength;
      ty = Math.max(-1, Math.min(1, dy)) * strength;
      schedule();
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
      schedule();
    };

    const schedule = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        node.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(rafId);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      node.style.transform = "";
    };
  }, [strength]);

  return (
    <a
      ref={ref}
      href={href}
      className={className}
      style={{ transition: "transform 320ms cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {children}
    </a>
  );
}
