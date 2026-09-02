import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      { source: "/radar", destination: "/", permanent: true },
      { source: "/opportunities", destination: "/", permanent: true },
      { source: "/opportunities/:slug", destination: "/", permanent: true },
      { source: "/product", destination: "/", permanent: true },
      { source: "/agent", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
