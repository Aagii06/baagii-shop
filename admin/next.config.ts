import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack root to this folder so a stray lockfile higher up
  // (e.g. in ~/) isn't picked as the workspace root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
