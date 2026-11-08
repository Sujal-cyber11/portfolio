import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
