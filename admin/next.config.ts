import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
