import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Optional: Keep true if you want to save Vercel usage limits
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.google.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ],
  },
};

export default nextConfig;