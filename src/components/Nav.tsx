import Link from "next/link";
import { PhoneIcon } from "./icons";
import { PHONE_HREF } from "@/lib/contact";
import NavScrollWatcher from "./NavScrollWatcher";
import NavMobileMenu from "./NavMobileMenu";

const LINKS = [
  { href: "#uilchilgee", label: "Үйлчилгээ" },
  { href: "#selbeg", label: "Сэлбэг" },
  { href: "#mashin", label: "Машинууд" },
  { href: "#bidnii-tuhai", label: "Бидний тухай" },
  { href: "#holboo-barih", label: "Холбоо барих" },
] as const;

/**
 * Site nav header.
 *
 * SERVER COMPONENT. The static content (logo, desktop links, desktop CTA,
 * layout flex container) renders as plain HTML — no hydration touches this
 * subtree, so the LCP-adjacent area (Hero text immediately below) is not
 * subject to late paint events from React reconciliation.
 *
 * Two small Client islands handle the only stateful pieces:
 *   - NavScrollWatcher — sets `data-scrolled` on this header via direct DOM
 *     manipulation in response to scroll position. No React state, renders
 *     null, no reconciliation paint events.
 *   - NavMobileMenu — hamburger button + slide-in drawer. Drawer open/close
 *     state lives entirely inside this island; doesn't reach the rest of Nav.
 */
export default function Nav() {
  return (
    <header
      id="site-nav"
      className="group/nav fixed inset-x-0 top-9 z-50 border-b border-transparent transition-[background-color,backdrop-filter,border-color] duration-300 ease-out data-[scrolled]:border-charcoal/60 data-[scrolled]:bg-ink/85 data-[scrolled]:backdrop-blur-md"
    >
      <NavScrollWatcher />

      {/* Red hairline · wipes in on scroll */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gs-red transition-transform duration-500 ease-out group-data-[scrolled]/nav:scale-x-100"
      />

      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:h-20 sm:px-10 lg:px-16">
        {/* Logo */}
        <Link
          href="/"
          aria-label="GS Auto Center · нүүр хуудас"
          className="flex shrink-0 items-center"
        >
          {/* Plain <img> (not next/image) on purpose — keeps the LCP image
              out of the React reconciliation tree. Next.js's image
              optimization endpoint is still used via the src/srcset URLs, so
              we get small variants at common DPRs without the runtime cost. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/_next/image?url=%2Flogo%2Fgs-logo-horizontal-white.png&w=256&q=75"
            srcSet="
              /_next/image?url=%2Flogo%2Fgs-logo-horizontal-white.png&w=128&q=75 1x,
              /_next/image?url=%2Flogo%2Fgs-logo-horizontal-white.png&w=256&q=75 2x
            "
            alt="GS Auto Center"
            width={540}
            height={212}
            fetchPriority="high"
            decoding="async"
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

        {/* Mobile hamburger + drawer (small Client island) */}
        <NavMobileMenu />
      </div>
    </header>
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
