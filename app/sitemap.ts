import type { MetadataRoute } from "next";
import { listMarketPains } from "@/lib/market/queries";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pains = await listMarketPains();
  const hubs = new Set<string>(["", "/privacy"]);
  for (const pain of pains) {
    hubs.add(`/${pain.category.slug}`);
    hubs.add(`/${pain.category.slug}/${pain.cluster.slug}`);
    hubs.add(pain.href);
  }
  return [...hubs].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path.split("/").length > 3 ? "weekly" : "daily",
    priority: path === "" ? 1 : 0.8,
  }));
}
