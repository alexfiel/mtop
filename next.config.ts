import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["kysely", "@better-auth/kysely-adapter", "better-auth"],
};

export default nextConfig;
