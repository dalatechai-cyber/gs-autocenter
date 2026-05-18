import { del, list, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

import type { Banner, BannerInput } from "./types";

const BANNERS_FILE = "gs-banners.json";

function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function findBannersFileUrl(): Promise<string | null> {
  if (!isBlobConfigured()) return null;
  const { blobs } = await list({ prefix: BANNERS_FILE, limit: 1 });
  const match = blobs.find((b) => b.pathname === BANNERS_FILE);
  return match?.url ?? null;
}

export async function readBanners(): Promise<Banner[]> {
  const url = await findBannersFileUrl();
  if (!url) return [];
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  try {
    const data = (await res.json()) as Banner[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeBanners(banners: Banner[]): Promise<void> {
  if (!isBlobConfigured()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured. Set it in Vercel project settings.",
    );
  }
  await put(BANNERS_FILE, JSON.stringify(banners, null, 2), {
    access: "public",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

export async function getBanner(id: string): Promise<Banner | null> {
  const banners = await readBanners();
  return banners.find((b) => b.id === id) ?? null;
}

export async function createBanner(input: BannerInput): Promise<Banner> {
  const banners = await readBanners();
  const now = new Date().toISOString();
  const banner: Banner = {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  banners.unshift(banner);
  await writeBanners(banners);
  return banner;
}

export async function updateBanner(
  id: string,
  patch: Partial<BannerInput>,
): Promise<Banner | null> {
  const banners = await readBanners();
  const idx = banners.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const updated: Banner = {
    ...banners[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  banners[idx] = updated;
  await writeBanners(banners);
  return updated;
}

export async function deleteBanner(id: string): Promise<boolean> {
  const banners = await readBanners();
  const idx = banners.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  const [removed] = banners.splice(idx, 1);
  if (removed.imagePathname) {
    try {
      await del(removed.imagePathname);
    } catch {
      // image already gone — ignore
    }
  }
  await writeBanners(banners);
  return true;
}

export async function getActiveBanner(now: Date = new Date()): Promise<Banner | null> {
  const banners = await readBanners();
  const ts = now.getTime();
  const active = banners
    .filter((b) => b.isActive)
    .filter((b) => {
      const start = Date.parse(b.startDate);
      const end = Date.parse(b.endDate);
      if (Number.isNaN(start) || Number.isNaN(end)) return false;
      return start <= ts && ts <= end;
    });
  if (active.length === 0) {
    console.log(
      `[banner-active] result=null count=${banners.length} now=${new Date(ts).toISOString()} raw=${JSON.stringify(
        banners.map((b) => ({
          id: b.id.slice(0, 8),
          isActive: b.isActive,
          startDate: b.startDate,
          endDate: b.endDate,
        })),
      )}`,
    );
    return null;
  }
  active.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  console.log(
    `[banner-active] result=${active[0].id.slice(0, 8)} title="${active[0].title.slice(0, 30)}"`,
  );
  return active[0];
}

export async function uploadBannerImage(
  file: File,
): Promise<{ url: string; pathname: string }> {
  if (!isBlobConfigured()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured. Set it in Vercel project settings.",
    );
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const pathname = `gs-banner-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type || "application/octet-stream",
  });
  return { url: blob.url, pathname: blob.pathname };
}
