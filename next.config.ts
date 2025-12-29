import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allows ALL external images
      },
    ],
    unoptimized: true, // Crucial for fixing "broken" images during dev
  },
};

export default nextConfig;