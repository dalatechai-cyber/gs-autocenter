"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isAdmin, signIn, signOut } from "@/lib/admin/auth";
import {
  createBanner,
  deleteBanner,
  updateBanner,
  uploadBannerImage,
} from "@/lib/admin/banners";
import type { BannerInput } from "@/lib/admin/types";

export type LoginState = { error: string | null };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { error: "Нууц үг оруулна уу." };
  }
  const ok = await signIn(password);
  if (!ok) {
    return { error: "Нууц үг буруу байна." };
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/admin/login");
}

async function requireAdmin(): Promise<void> {
  const ok = await isAdmin();
  if (!ok) redirect("/admin/login");
}

function parseFormToBannerInput(
  formData: FormData,
  current?: {
    imageUrl?: string;
    imagePathname?: string;
  },
): BannerInput {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const linkRaw = String(formData.get("link") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  const removeImage = formData.get("removeImage") === "on";

  return {
    title,
    body,
    link: linkRaw || undefined,
    imageUrl: removeImage ? undefined : current?.imageUrl,
    imagePathname: removeImage ? undefined : current?.imagePathname,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    isActive,
  };
}

async function maybeUploadImage(
  formData: FormData,
): Promise<{ url: string; pathname: string } | null> {
  const file = formData.get("image");
  if (!(file instanceof File)) return null;
  if (file.size === 0) return null;
  return uploadBannerImage(file);
}

export type SaveState = { error: string | null };

function validateBannerInput(input: BannerInput): string | null {
  if (!input.title) return "Гарчиг оруулна уу.";
  if (!input.body) return "Үндсэн текстээ оруулна уу.";
  if (Number.isNaN(Date.parse(input.startDate)))
    return "Эхлэх огноо буруу байна.";
  if (Number.isNaN(Date.parse(input.endDate)))
    return "Дуусах огноо буруу байна.";
  if (Date.parse(input.endDate) < Date.parse(input.startDate))
    return "Дуусах огноо нь эхлэх огнооноос хойш байх ёстой.";
  return null;
}

export async function createBannerAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin();
  try {
    const upload = await maybeUploadImage(formData);
    const input = parseFormToBannerInput(formData, {
      imageUrl: upload?.url,
      imagePathname: upload?.pathname,
    });
    const err = validateBannerInput(input);
    if (err) return { error: err };
    await createBanner(input);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.",
    };
  }
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function updateBannerAction(
  id: string,
  current: { imageUrl?: string; imagePathname?: string },
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin();
  try {
    const upload = await maybeUploadImage(formData);
    const input = parseFormToBannerInput(formData, {
      imageUrl: upload?.url ?? current.imageUrl,
      imagePathname: upload?.pathname ?? current.imagePathname,
    });
    const err = validateBannerInput(input);
    if (err) return { error: err };

    const updated = await updateBanner(id, input);
    if (!updated) return { error: "Зарлал олдсонгүй." };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.",
    };
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/banners/${id}`);
  revalidatePath("/");
  redirect("/admin");
}

export async function toggleBannerActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nextActive = String(formData.get("nextActive") ?? "") === "true";
  if (!id) return;
  await updateBanner(id, { isActive: nextActive } as Partial<BannerInput>);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteBanner(id);
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}
