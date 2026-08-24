import type { NextConfig } from "next";

// Ensure DATABASE_URL is set (fallback for cloud deployment where .env may not be available)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./db/custom.db";
}

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
