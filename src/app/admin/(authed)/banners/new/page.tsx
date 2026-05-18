import { createBannerAction } from "../../../actions";
import BannerForm from "../BannerForm";

export const dynamic = "force-dynamic";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return toLocalInput(d);
}

function defaultEnd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  d.setMinutes(0, 0, 0);
  return toLocalInput(d);
}

export default function NewBannerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-10">
        <span className="text-[10px] uppercase tracking-[0.28em] text-graphite">
          Шинэ зарлал
        </span>
        <h1 className="mt-2 font-sans text-3xl font-black uppercase leading-tight tracking-tight text-paper sm:text-4xl">
          Зарлал үүсгэх
        </h1>
      </header>

      <BannerForm
        mode="create"
        action={createBannerAction}
        defaults={{
          isActive: true,
          startDate: defaultStart(),
          endDate: defaultEnd(),
        }}
      />
    </div>
  );
}
