import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow builds to succeed even if ESLint errors are present
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow builds to succeed even if TypeScript errors are present
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
