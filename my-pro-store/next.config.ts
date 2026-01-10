import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      // ADD THIS NEW ENTRY FOR GOOGLE IMAGES:
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com', 
      },

      {
        protocol: 'https',
        hostname: '**.google.com', 
      }

    ],
  },
};

export default nextConfig;