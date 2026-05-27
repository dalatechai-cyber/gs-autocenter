/**
 * Canonical site URL — environment-aware.
 *
 * Production deployments (Vercel VERCEL_ENV=production):
 *   → https://gs-autocenter.mn  (custom production domain)
 * Preview / dev / local:
 *   → https://gs-autocenter.vercel.app  (Vercel preview URL or local default)
 *
 * Used by:
 *   - layout.tsx metadataBase
 *   - page.tsx schema.org @id and URL fields
 *   - LC300CarouselSection.tsx schema.org @id, url, and image
 */
export const SITE_URL =
  process.env.VERCEL_ENV === 'production'
    ? 'https://gs-autocenter.mn'
    : 'https://gs-autocenter.vercel.app';
