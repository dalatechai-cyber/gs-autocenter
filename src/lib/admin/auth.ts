import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "gs_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function tokenFor(password: string): string {
  return createHash("sha256").update(`gs-admin:${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function isAdmin(): Promise<boolean> {
  const password = adminPassword();
  if (!password) return false;
  const store = await cookies();
  const session = store.get(ADMIN_COOKIE);
  if (!session) return false;
  return safeEqual(session.value, tokenFor(password));
}

export async function signIn(password: string): Promise<boolean> {
  const expected = adminPassword();
  if (!expected) return false;
  if (!safeEqual(password, expected)) return false;
  const store = await cookies();
  store.set(ADMIN_COOKIE, tokenFor(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return true;
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export function isAdminConfigured(): boolean {
  return adminPassword() !== null;
}
