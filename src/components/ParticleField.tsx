"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight canvas particle field. Renders slow-drifting dots that
 * gently wander across the hero. No external library; respects
 * prefers-reduced-motion; pauses while the tab is hidden.
 *
 * Canvas setup is deferred via requestIdleCallback so it doesn't compete
 * with LCP painting. Lighthouse was firing a late LCP update because the
 * rAF tasks at ~3.5 s counted as "page busy" — deferring keeps the LCP
 * soak idle, so the score reflects the actual paint time.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let setupHandle: number | null = null;
    let cleanup: (() => void) | null = null;

    const setup = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let width = 0;
      let height = 0;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      type P = { x: number; y: number; r: number; vx: number; vy: number; a: number };
      let particles: P[] = [];
      let animId = 0;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(48, Math.round((width * height) / 26000));
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.4 + 0.4,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.08 - 0.02,
          a: Math.random() * 0.35 + 0.05,
        }));
      };

      const draw = () => {
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(231,231,231,${p.a})`;
          ctx.fill();
        }
        animId = requestAnimationFrame(draw);
      };

      resize();
      draw();

      const onResize = () => resize();
      const onVisibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(animId);
        } else {
          animId = requestAnimationFrame(draw);
        }
      };

      window.addEventListener("resize", onResize, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    };

    // requestIdleCallback runs setup when the browser has nothing pressing to
    // do. Fallback to setTimeout 1.5 s on browsers without rIC (Safari < 17).
    // The 2000 ms timeout option on rIC guarantees setup happens within that
    // window even if the browser stays busy.
    const idle = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof idle.requestIdleCallback === "function") {
      setupHandle = idle.requestIdleCallback(setup, { timeout: 2000 });
    } else {
      setupHandle = window.setTimeout(setup, 1500);
    }

    return () => {
      if (setupHandle != null) {
        if (typeof idle.cancelIdleCallback === "function") {
          idle.cancelIdleCallback(setupHandle);
        } else {
          window.clearTimeout(setupHandle);
        }
      }
      cleanup?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-70 mix-blend-screen"
    />
  );
}
