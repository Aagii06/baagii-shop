import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack project root to this folder. A stray package-lock.json
  // in ~/ was making Turbopack pick /Users/admin as the root, so its file
  // watcher covered the whole home dir and edits stopped hot-reloading.
  turbopack: {
    root: __dirname,
  },
  // Keep `next build` out of the `.next` dir that a running `next dev` uses,
  // otherwise a production build mid-session corrupts the dev server's state
  // and Fast Refresh silently stops picking up edits. `npm run build` sets
  // NEXT_DIST_DIR; `next dev` falls back to the default `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // eshop-service file service (see src/lib/api/files.ts)
        protocol: "http",
        hostname: "202.179.6.67",
        port: "5501",
        pathname: "/api/file/file/**",
      },
    ],
  },
};

export default nextConfig;
