import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      { source: "/workspace", destination: "/home", permanent: false },
      { source: "/workspace/:path*", destination: "/home", permanent: false },
      { source: "/watchlist", destination: "/home", permanent: false },
      { source: "/billboard", destination: "/top-pains", permanent: false },
      { source: "/billboard/:path*", destination: "/top-pains", permanent: false },
      { source: "/for-affiliates", destination: "/affiliates", permanent: true },
      { source: "/for-affiliates/:path*", destination: "/affiliates", permanent: true },
      { source: "/for-founders", destination: "/founders", permanent: true },
      { source: "/for-founders/:path*", destination: "/founders", permanent: true },
      { source: "/how-it-works", destination: "/", permanent: true },
      { source: "/lab", destination: "/", permanent: true },
      { source: "/affiliate-opportunity-finder", destination: "/affiliates", permanent: true },
      { source: "/find-profitable-affiliate-niches", destination: "/affiliates", permanent: true },
      { source: "/find-underserved-markets", destination: "/founders", permanent: true },
      { source: "/product-validation", destination: "/founders", permanent: true },
      { source: "/reverse-product-research", destination: "/founders", permanent: true },
      { source: "/radar", destination: "/", permanent: true },
      { source: "/opportunities", destination: "/top-pains", permanent: true },
      { source: "/opportunities/:slug", destination: "/top-pains", permanent: true },
      { source: "/product", destination: "/", permanent: true },
      { source: "/agent", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
