import type { NextConfig } from "next";

const isMobileExport = process.env.MOBILE_EXPORT === "1";

const nextConfig: NextConfig = {
  output: isMobileExport ? "export" : "standalone",
  trailingSlash: isMobileExport,
  images: {
    unoptimized: isMobileExport,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
