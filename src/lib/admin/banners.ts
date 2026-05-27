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
  // ISR-friendly cache: refreshes every 60 s by default. Admin mutations
  // call `revalidateTag("banners")` for instant invalidation. Admin pages
  // marked `dynamic = "force-dynamic"` automatically bypass this cache.
  const res = await fetch(url, {
    next: { revalidate: 60, tags: ["banners"] },
  });
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
  if (active.length === 0) return null;
  active.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return active[0];
}

// Allow-list of image MIME types we'll accept from the admin panel.
// Anything outside this list is rejected before touching Vercel Blob.
const ALLOWED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);

// Canonical extension we'll write to the blob key — derived from the
// SNIFFED MIME, never from user-supplied file.name.
const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

// Magic-number sniff (first 12 bytes) to defeat MIME spoofing. Returns the
// canonical MIME we'll trust, or null if no signature matches.
function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // GIF: 47 49 46 38 (GIF8)
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  // WEBP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  // AVIF: ISO BMFF box "ftypavif" at offset 4..11.
  if (
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70 && // p
    bytes[8] === 0x61 && // a
    bytes[9] === 0x76 && // v
    bytes[10] === 0x69 && // i
    bytes[11] === 0x66 // f
  ) {
    return "image/avif";
  }
  return null;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadBannerImage(
  file: File,
): Promise<{ url: string; pathname: string }> {
  if (!isBlobConfigured()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured. Set it in Vercel project settings.",
    );
  }

  // 1. Size cap — refuse before reading bytes if we can.
  if (file.size <= 0) {
    throw new Error("Зургийн файл хоосон байна.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Зургийн хэмжээ 5 MB-аас бага байх ёстой.");
  }

  // 2. Header MIME check — refuse anything outside the image allow-list.
  if (file.type && !ALLOWED_IMAGE_MIME.has(file.type)) {
    throw new Error("Зөвхөн PNG, JPEG, WEBP, GIF, AVIF зураг байршуулна уу.");
  }

  // 3. Magic-number sniff on the first 12 bytes — beats spoofed
  // Content-Type. We trust ONLY this for the canonical mime/extension.
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const sniffedMime = sniffImageMime(head);
  if (!sniffedMime) {
    throw new Error("Файлын формат таних боломжгүй (зөвхөн зургийн файл).");
  }

  // 4. Canonical pathname — server-generated, no user-controlled chars,
  // so path-traversal is impossible (Date.now() + 8 hex chars only).
  const ext = MIME_TO_EXT[sniffedMime] ?? "bin";
  const pathname = `gs-banner-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: sniffedMime,
  });
  return { url: blob.url, pathname: blob.pathname };
}
