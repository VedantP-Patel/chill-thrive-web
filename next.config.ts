import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Keep Unsplash
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',      // Add Supabase (Wildcard)
      },
    ],
  },
};

export default nextConfig;