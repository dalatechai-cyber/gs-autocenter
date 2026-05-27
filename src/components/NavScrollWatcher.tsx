"use client";

import { useEffect } from "react";

/**
 * Tiny Client island that toggles `data-scrolled` on the site nav header
 * based on scroll position. Renders nothing — pure side-effect.
 *
 * Why this is split out of Nav.tsx: the Nav itself is a Server Component
 * (LCP-eligible elements live in static HTML, no hydration overhead). The
 * scroll behavior is the only piece that needs the client, and we keep it
 * stateless — direct DOM attribute manipulation rather than React state
 * means no re-renders, no reconciliation paint events that could update
 * the Lighthouse LCP timestamp.
 */
export default function NavScrollWatcher() {
  useEffect(() => {
    const header = document.getElementById("site-nav");
    if (!header) return;

    const apply = () => {
      if (window.scrollY > 24) {
        header.setAttribute("data-scrolled", "true");
      } else {
        header.removeAttribute("data-scrolled");
      }
    };

    apply();
    window.addEventListener("scroll", apply, { passive: true });
    return () => window.removeEventListener("scroll", apply);
  }, []);

  return null;
}
