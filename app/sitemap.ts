import type { MetadataRoute } from "next";
import { listMarketPains } from "@/lib/market/queries";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "",
  "/privacy",
  "/for-affiliates",
  "/for-affiliates/demo",
  "/for-founders",
  "/for-founders/demo",
  "/how-it-works",
  "/pricing",
  "/lab",
  "/affiliate-opportunity-finder",
  "/find-profitable-affiliate-niches",
  "/find-underserved-markets",
  "/product-validation",
  "/reverse-product-research",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pains = await listMarketPains();
  const hubs = new Set<string>(STATIC_PATHS);
  for (const pain of pains) {
    hubs.add(`/${pain.category.slug}`);
    hubs.add(`/${pain.category.slug}/${pain.cluster.slug}`);
    hubs.add(pain.href);
  }
  return [...hubs].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path.split("/").length > 3 ? "weekly" : "daily",
    priority: path === "" ? 1 : path.startsWith("/for-") ? 0.9 : 0.8,
  }));
}
