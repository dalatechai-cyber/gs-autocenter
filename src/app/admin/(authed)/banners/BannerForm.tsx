"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { SaveState } from "../../actions";

type FormAction = (state: SaveState, formData: FormData) => Promise<SaveState>;

type Defaults = {
  title?: string;
  body?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  imageUrl?: string;
};

const INITIAL: SaveState = { error: null };

export default function BannerForm({
  mode,
  action,
  defaults = {},
}: {
  mode: "create" | "edit";
  action: FormAction;
  defaults?: Defaults;
}) {
  const [state, formAction] = useActionState<SaveState, FormData>(
    action,
    INITIAL,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaults.imageUrl ?? null,
  );
  const [removeImage, setRemoveImage] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setRemoveImage(false);
  }

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="flex flex-col gap-8"
      noValidate
    >
      <Field
        label="Гарчиг"
        hint="Хамгийн дээд талд гарах товч кикер (жишээ нь: Шинэ, Урамшуулал)."
      >
        <input
          name="title"
          type="text"
          required
          maxLength={64}
          defaultValue={defaults.title ?? ""}
          className="h-12 w-full border border-charcoal/80 bg-ink-card px-4 text-base text-paper outline-none transition-colors duration-150 ease-out focus:border-gs-red"
        />
      </Field>

      <Field
        label="Үндсэн текст"
        hint="Зарлалын утга. Хэт урт болохгүй, нэг өгүүлбэр ор."
      >
        <textarea
          name="body"
          required
          maxLength={240}
          rows={3}
          defaultValue={defaults.body ?? ""}
          className="w-full border border-charcoal/80 bg-ink-card px-4 py-3 text-base text-paper outline-none transition-colors duration-150 ease-out focus:border-gs-red"
        />
      </Field>

      <Field
        label="Холбоос (заавал биш)"
        hint="Жишээ нь: tel:+97677200570 эсвэл https://example.com/promo"
      >
        <input
          name="link"
          type="text"
          maxLength={300}
          defaultValue={defaults.link ?? ""}
          placeholder="tel:+97677200570"
          className="h-12 w-full border border-charcoal/80 bg-ink-card px-4 font-mono text-sm text-paper outline-none transition-colors duration-150 ease-out focus:border-gs-red"
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Эхлэх огноо">
          <input
            name="startDate"
            type="datetime-local"
            required
            defaultValue={defaults.startDate ?? ""}
            className="h-12 w-full border border-charcoal/80 bg-ink-card px-4 font-mono text-sm text-paper outline-none transition-colors duration-150 ease-out focus:border-gs-red"
          />
        </Field>
        <Field label="Дуусах огноо">
          <input
            name="endDate"
            type="datetime-local"
            required
            defaultValue={defaults.endDate ?? ""}
            className="h-12 w-full border border-charcoal/80 bg-ink-card px-4 font-mono text-sm text-paper outline-none transition-colors duration-150 ease-out focus:border-gs-red"
          />
        </Field>
      </div>

      <Field label="Зураг (заавал биш)" hint="JPG, PNG. Дээд тал 2 МБ.">
        <div className="flex flex-col gap-4">
          {previewUrl && !removeImage ? (
            <div className="relative h-32 w-full max-w-md overflow-hidden border border-charcoal/80 bg-ink-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Зарлалын зурагны урьдчилсан харагдац"
                className="size-full object-cover"
              />
            </div>
          ) : null}

          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block text-sm text-paper file:mr-4 file:border file:border-charcoal/80 file:bg-ink-raised file:px-3 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.22em] file:text-paper hover:file:border-gs-red"
          />

          {defaults.imageUrl ? (
            <label className="flex items-center gap-2 text-sm text-graphite">
              <input
                type="checkbox"
                name="removeImage"
                checked={removeImage}
                onChange={(e) => setRemoveImage(e.target.checked)}
                className="size-4 accent-gs-red"
              />
              Одоогийн зургийг хасах
            </label>
          ) : null}
        </div>
      </Field>

      <Field
        label="Идэвхтэй"
        hint="Идэвхтэй бөгөөд огнооны хүрээнд байгаа зарлал сайтад харагдана."
      >
        <label className="inline-flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={defaults.isActive ?? true}
            className="size-5 accent-gs-red"
          />
          <span className="text-sm text-paper">Сайтад харагдана</span>
        </label>
      </Field>

      {state.error ? (
        <p
          role="alert"
          className="bg-gs-red/10 px-3 py-2 text-sm text-gs-red"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4 border-t border-charcoal/60 pt-6">
        <Link
          href="/admin"
          className="text-[10px] uppercase tracking-[0.22em] text-graphite hover:text-paper"
        >
          ← Буцах
        </Link>
        <SubmitButton label={mode === "create" ? "Үүсгэх" : "Хадгалах"} />
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.24em] text-graphite">
          {label}
        </span>
        {hint ? <span className="text-xs text-iron">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable cta-shine bg-gs-red px-6 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-snow transition-colors duration-150 ease-out hover:bg-gs-red-600 disabled:opacity-60"
    >
      {pending ? "Хадгалж байна…" : label}
    </button>
  );
}
