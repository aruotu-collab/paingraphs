import type { MetadataRoute } from "next";
import { listPainGraphs } from "@/lib/paingraph/queries";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "",
  "/top-pains",
  "/affiliates",
  "/founders",
  "/pricing",
  "/privacy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const graphs = await listPainGraphs();
  const hubs = new Set<string>(STATIC_PATHS);
  for (const graph of graphs) {
    hubs.add(`/${graph.category.slug}`);
    hubs.add(`/${graph.category.slug}/${graph.subcategory.slug}`);
    hubs.add(graph.href);
  }
  return [...hubs].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
}
