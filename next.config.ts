import type { NextConfig } from "next";
import path from "node:path";

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
    ],
  },
};

export default nextConfig;
