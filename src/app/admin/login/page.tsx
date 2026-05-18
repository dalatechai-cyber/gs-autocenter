import { redirect } from "next/navigation";
import Link from "next/link";

import { isAdmin, isAdminConfigured } from "@/lib/admin/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const configured = isAdminConfigured();

  return (
    <main className="relative grid min-h-screen place-items-center bg-ink px-5 py-16 text-paper">
      <div
        aria-hidden
        className="grid-engraved pointer-events-none absolute inset-0 opacity-30"
      />
      <div
        aria-hidden
        className="vignette pointer-events-none absolute inset-0"
      />

      <section className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.28em] text-graphite hover:text-paper"
          >
            ← Нүүр хуудас
          </Link>
          <span className="font-wordmark text-[10px] uppercase tracking-[0.28em] text-gs-red">
            GS · ADMIN
          </span>
        </div>

        <div className="border border-charcoal/80 bg-ink-card">
          <div className="border-b border-charcoal/70 bg-ink-raised px-6 py-3">
            <span className="text-[10px] uppercase tracking-[0.24em] text-graphite">
              Маркетингийн самбар · нэвтрэх
            </span>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <h1 className="font-sans text-2xl font-black uppercase leading-tight tracking-tight text-paper sm:text-3xl">
              Зарлал удирдах
            </h1>
            <p className="mt-2 max-w-sm text-sm text-graphite">
              Нэвтрэхийн тулд танд GS-ээс өгсөн нууц үгийг оруулна уу.
            </p>

            <div className="mt-8">
              {configured ? (
                <LoginForm />
              ) : (
                <div className="border border-gs-red bg-gs-red/10 px-4 py-3 text-sm text-paper">
                  <strong className="block text-gs-red">
                    ADMIN_PASSWORD тохируулагдаагүй байна.
                  </strong>
                  Vercel төслийн Environment Variables хэсэгт
                  <code className="mx-1 bg-ink px-1 text-gs-red">
                    ADMIN_PASSWORD
                  </code>
                  нэмж тавиад дахин нэвтэрнэ үү.
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.24em] text-iron">
          Зөвхөн эрх бүхий ажилтанд зориулсан хэсэг
        </p>
      </section>
    </main>
  );
}
