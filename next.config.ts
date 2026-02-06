import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // If using local uploads, you don't need to configure anything
  },
  /* config options here */
   typescript: {
    // ⚠️ Dangerous: Ignores ALL TypeScript errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
