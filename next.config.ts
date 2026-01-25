import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   typescript: {
    // ⚠️ Dangerous: Ignores ALL TypeScript errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
