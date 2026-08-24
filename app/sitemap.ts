import type { MetadataRoute } from "next";
import { searchOpportunities } from "@/lib/opportunities";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const staticRoutes = [
  { path: "", changeFrequency: "daily" as const, priority: 1 },
  { path: "/radar", changeFrequency: "hourly" as const, priority: 0.9 },
  { path: "/opportunities", changeFrequency: "hourly" as const, priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let painEntries: MetadataRoute.Sitemap = [];
  try {
    const items = await searchOpportunities("");
    painEntries = items.map((item) => ({
      url: `${SITE_URL}/opportunities/${item.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch {
    // DB may be unavailable at build time
  }

  return [...staticEntries, ...painEntries];
}
