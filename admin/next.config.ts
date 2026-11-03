import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production build = plain files in out/ served by nginx (no Node process).
  // `next dev` stays normal so any id works locally.
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  images: { unoptimized: true },
  // Pin the Turbopack root to this folder so a stray lockfile higher up
  // (e.g. in ~/) isn't picked as the workspace root.
  turbopack: {
    root: __dirname,
  },
  // `next dev` only lets localhost use its dev endpoints (the HMR websocket,
  // /_next/*). Allow the office LAN too, so another computer opening
  // http://192.168.10.x:3790 gets live updates instead of a websocket error.
  allowedDevOrigins: ["192.168.10.*"],
};

export default nextConfig;
