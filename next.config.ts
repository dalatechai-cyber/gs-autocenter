import type { NextConfig } from "next";
import path from "node:path";

const chatbotOrigin =
  process.env.NEXT_PUBLIC_CHATBOT_URL?.replace(/\/$/, "") ??
  "https://gs-autocenter-chatbot.vercel.app";

// Content-Security-Policy — single source of truth, applied to every response.
//
// Trade-offs:
// - 'unsafe-inline' on script-src is required for Next.js App Router's
//   hydration inline scripts. Switching to a nonce-based policy needs a
//   request-time middleware; tracked for a follow-up.
// - 'unsafe-eval' is required by Next/Turbopack in production for some
//   client-side runtime checks.
// - frame-ancestors 'none' + X-Frame-Options: DENY block clickjacking in
//   modern AND legacy browsers.
// - The chatbot widget lives on a separate Vercel project — whitelist it
//   for script-src and connect-src via NEXT_PUBLIC_CHATBOT_URL.
// - Google Maps embed loads from www.google.com; whitelist it for
//   frame-src + img-src (map tiles).
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${chatbotOrigin} https://*.vercel-scripts.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://toyota-mongolia.mn https://*.public.blob.vercel-storage.com https://*.google.com https://*.gstatic.com https://*.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${chatbotOrigin} https://*.vercel-insights.com https://*.vercel-scripts.com`,
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  // Defence-in-depth clickjacking block; complements frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "picture-in-picture=()",
      "usb=()",
      "xr-spatial-tracking=()",
    ].join(", "),
  },
  // Vercel already sets HSTS, but pin it explicitly so it can't regress.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Block legacy IE/Edge MIME-guessing helpers that have known bypasses.
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "toyota-mongolia.mn",
        pathname: "/uploaded/images/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
