import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Für den späteren DB-Layer (Kysely + Tedious) bereits vorgesehen:
  serverExternalPackages: ["tedious", "tarn", "kysely"],
  // Falls "Invalid Server Actions request" hinter dem App-Service-Proxy auftritt:
  // experimental: { serverActions: { allowedOrigins: ["<app>.azurewebsites.net"] } },
};

export default nextConfig;
