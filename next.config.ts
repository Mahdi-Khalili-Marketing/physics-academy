import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Dev overlay badge covers the mobile bottom-nav "more" tab
  devIndicators: false,
};

export default nextConfig;
