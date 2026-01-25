/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config options here
  
  // Skip ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip TypeScript errors during builds  
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;