import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
