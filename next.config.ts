import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["kysely", "@better-auth/kysely-adapter", "better-auth", "@prisma/client", "prisma"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
