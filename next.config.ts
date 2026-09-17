import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["xlsx", "@prisma/client", "prisma"],
};

export default nextConfig;
