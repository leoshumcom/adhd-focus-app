import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  // Prevent images from being optimized by Next.js
  images: {
    unoptimized: true,
  },
  
  // Enable React strict mode for development
  reactStrictMode: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
