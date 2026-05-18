import { notFound } from "next/navigation";
import Link from "next/link";

import { getBanner } from "@/lib/admin/banners";
import {
  deleteBannerAction,
  updateBannerAction,
  type SaveState,
} from "../../../actions";
import BannerForm from "../BannerForm";

export const dynamic = "force-dynamic";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const banner = await getBanner(id);
  if (!banner) notFound();

  const boundAction = updateBannerAction.bind(null, id, {
    imageUrl: banner.imageUrl,
    imagePathname: banner.imagePathname,
  }) as (state: SaveState, formData: FormData) => Promise<SaveState>;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-10 flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.28em] text-graphite">
          Зарлал засах · {banner.id.slice(0, 8)}
        </span>
        <h1 className="font-sans text-3xl font-black uppercase leading-tight tracking-tight text-paper sm:text-4xl">
          {banner.title}
        </h1>
      </header>

      <BannerForm
        mode="edit"
        action={boundAction}
        defaults={{
          title: banner.title,
          body: banner.body,
          link: banner.link,
          startDate: toLocalInput(banner.startDate),
          endDate: toLocalInput(banner.endDate),
          isActive: banner.isActive,
          imageUrl: banner.imageUrl,
        }}
      />

      <section className="mt-12 border-t border-charcoal/60 pt-8">
        <h2 className="text-[10px] uppercase tracking-[0.24em] text-graphite">
          Аюултай бүс
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-fog">Энэ үйлдлийг буцаах боломжгүй.</p>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-[10px] uppercase tracking-[0.22em] text-graphite hover:text-paper"
            >
              Цуцлах
            </Link>
            <form action={deleteBannerAction}>
              <input type="hidden" name="id" value={banner.id} />
              <button
                type="submit"
                className="pressable border border-gs-red px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gs-red transition-colors duration-150 ease-out hover:bg-gs-red hover:text-snow"
              >
                Зарлалыг устгах
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
