import { redirect } from "next/navigation";
import Link from "next/link";

import { isAdmin } from "@/lib/admin/auth";
import { logoutAction } from "../actions";

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="relative min-h-screen bg-ink text-paper">
      <header className="border-b border-charcoal/60 bg-ink-raised">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link
            href="/admin"
            className="flex items-center gap-3 text-paper hover:text-gs-red"
          >
            <span
              aria-hidden
              className="font-wordmark text-[11px] uppercase tracking-[0.28em] text-gs-red"
            >
              GS · ADMIN
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.24em] text-graphite sm:block">
              Зарлал удирдлага
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[10px] uppercase tracking-[0.22em] text-graphite hover:text-paper"
            >
              Сайт харах ↗
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="pressable border border-charcoal/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-paper transition-colors duration-150 ease-out hover:border-gs-red hover:text-gs-red"
              >
                Гарах
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>
    </div>
  );
}
