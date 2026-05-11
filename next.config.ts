import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages deployment requires output: 'export' or opennext adapter
  // Using @opennextjs/cloudflare for server-side rendering on the edge
  
  // Prevent images from being optimized by Next.js (use direct img tags)
  images: {
    unoptimized: true,
  },
  
  // Enable React strict mode for development
  reactStrictMode: true,
  
  // Compress responses
  compress: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
