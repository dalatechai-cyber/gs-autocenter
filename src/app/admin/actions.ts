"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";

import { isAdmin, signIn, signOut } from "@/lib/admin/auth";
import {
  createBanner,
  deleteBanner,
  updateBanner,
  uploadBannerImage,
} from "@/lib/admin/banners";
import {
  checkLoginAllowed,
  recordLoginAttempt,
} from "@/lib/admin/loginThrottle";
import type { BannerInput } from "@/lib/admin/types";

// Banner field length caps — enforced server-side regardless of any
// client-side maxLength hint on the form inputs.
const MAX_TITLE = 120;
const MAX_BODY = 480;
const MAX_LINK = 400;

export type LoginState = { error: string | null };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // Per-IP brute-force gate. Returns a "try again later" message rather
  // than disclosing whether the password attempt was even read.
  const gate = await checkLoginAllowed();
  if (!gate.allowed) {
    const minutes = Math.ceil(gate.retryAfterSeconds / 60);
    return {
      error: `Хэт олон удаа буруу нэвтэрсэн байна. ${minutes} минутын дараа дахин оролдоно уу.`,
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { error: "Нууц үг оруулна уу." };
  }
  // Hard cap on password length to bound timing-safe comparison work.
  if (password.length > 256) {
    await recordLoginAttempt(false);
    return { error: "Нууц үг буруу байна." };
  }
  const ok = await signIn(password);
  await recordLoginAttempt(ok);
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
  if (input.title.length > MAX_TITLE)
    return `Гарчиг ${MAX_TITLE} тэмдэгтээс хэтэрсэн байна.`;
  if (!input.body) return "Үндсэн текстээ оруулна уу.";
  if (input.body.length > MAX_BODY)
    return `Үндсэн текст ${MAX_BODY} тэмдэгтээс хэтэрсэн байна.`;
  if (input.link) {
    if (input.link.length > MAX_LINK)
      return `Холбоосын урт ${MAX_LINK} тэмдэгтээс хэтэрсэн байна.`;
    // Permit only http(s) and same-origin paths. Rejects javascript:, data:,
    // file:, and other schemes that could XSS visitors.
    const okLink =
      input.link.startsWith("/") ||
      input.link.startsWith("http://") ||
      input.link.startsWith("https://");
    if (!okLink) return "Холбоосын формат буруу байна (http/https эсвэл / эхэлсэн зам).";
  }
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
  updateTag("banners");
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
  updateTag("banners");
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
  updateTag("banners");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteBanner(id);
  updateTag("banners");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}
