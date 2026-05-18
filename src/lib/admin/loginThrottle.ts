// In-memory brute-force throttle for the admin login endpoint.
//
// Per Vercel serverless model this state is per-instance and is reset on
// cold starts, so it should be treated as a deterrent rather than an
// authoritative lock. For a single-tenant admin behind a strong password
// that's enough; we just want the cost of online guessing to be high.
//
// Rule: more than MAX_FAILS failed attempts inside WINDOW_MS from one IP
// locks that IP out for LOCK_MS. Any successful login clears its IP.

import { headers } from "next/headers";

const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCK_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

type Entry = {
  count: number;
  firstFailAt: number;
  lockedUntil: number;
};

const attempts = new Map<string, Entry>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of attempts.entries()) {
      const expired =
        now - entry.firstFailAt > WINDOW_MS && now > entry.lockedUntil;
      if (expired) attempts.delete(ip);
    }
  }, CLEANUP_INTERVAL);
  // Don't keep the event loop alive just for cleanup in serverless.
  cleanupTimer.unref?.();
}

async function clientIp(): Promise<string> {
  // Trust Vercel's x-forwarded-for. The first entry is the original client.
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") || "unknown";
}

export type LoginGate =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
      remainingAttempts: 0;
    };

export async function checkLoginAllowed(): Promise<LoginGate> {
  ensureCleanup();
  const ip = await clientIp();
  const entry = attempts.get(ip);
  if (!entry) return { allowed: true };
  const now = Date.now();
  if (entry.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
      remainingAttempts: 0,
    };
  }
  return { allowed: true };
}

export async function recordLoginAttempt(success: boolean): Promise<void> {
  ensureCleanup();
  const ip = await clientIp();
  if (success) {
    attempts.delete(ip);
    return;
  }
  const now = Date.now();
  const existing = attempts.get(ip);
  if (!existing || now - existing.firstFailAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstFailAt: now, lockedUntil: 0 });
    return;
  }
  existing.count += 1;
  if (existing.count >= MAX_FAILS) {
    existing.lockedUntil = now + LOCK_MS;
  }
  attempts.set(ip, existing);
}

export const LoginThrottleConfig = {
  MAX_FAILS,
  WINDOW_MS,
  LOCK_MS,
};
