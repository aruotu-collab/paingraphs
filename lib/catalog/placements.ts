import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, painClusters } from "@/lib/db/schema";
import { slugify } from "@/lib/discovery/text";
import { RESERVED_PATHS } from "./data";
import { ensureCatalog } from "./sync";

export type PlacementOption = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  label: string;
};

function safeSlug(value: string) {
  const slug = slugify(value);
  return RESERVED_PATHS.has(slug) ? `${slug}-pains` : slug;
}

export async function listPlacementOptions(): Promise<PlacementOption[]> {
  await ensureCatalog();
  const rows = await db
    .select({
      cluster: painClusters,
      category: categories,
    })
    .from(painClusters)
    .innerJoin(categories, eq(painClusters.categoryId, categories.id))
    .orderBy(categories.name, painClusters.name);
  return rows.map(({ cluster, category }) => ({
    id: cluster.id,
    slug: cluster.slug,
    name: cluster.name,
    categoryId: category.id,
    categorySlug: category.slug,
    categoryName: category.name,
    label: `${category.name} / ${cluster.name}`,
  }));
}

export type PlacementGroup = {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  clusters: PlacementOption[];
};

export async function listPlacementGroups(): Promise<PlacementGroup[]> {
  const options = await listPlacementOptions();
  const groups = new Map<string, PlacementGroup>();
  for (const option of options) {
    const existing = groups.get(option.categoryId);
    if (existing) {
      existing.clusters.push(option);
      continue;
    }
    groups.set(option.categoryId, {
      categoryId: option.categoryId,
      categorySlug: option.categorySlug,
      categoryName: option.categoryName,
      clusters: [option],
    });
  }
  return [...groups.values()];
}

export async function getPlacement(clusterId: string) {
  await ensureCatalog();
  const [row] = await db
    .select({
      cluster: painClusters,
      category: categories,
    })
    .from(painClusters)
    .innerJoin(categories, eq(painClusters.categoryId, categories.id))
    .where(eq(painClusters.id, clusterId))
    .limit(1);
  return row ?? null;
}

export async function ensurePlacement(input: {
  categoryName: string;
  clusterName?: string | null;
  summary?: string | null;
}) {
  await ensureCatalog();
  const categoryName = input.categoryName.trim().replace(/\s+/g, " ").slice(0, 80);
  const clusterName = (input.clusterName?.trim() || categoryName)
    .replace(/\s+/g, " ")
    .slice(0, 80);
  if (categoryName.length < 2) return { error: "Category name is too short." };

  const categorySlug = safeSlug(categoryName);
  const [existingCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);
  const category = existingCategory ?? {
    id: `cat-${categorySlug}`,
    slug: categorySlug,
    name: categoryName,
    summary: input.summary?.trim() || `Pains in ${categoryName}.`,
  };
  if (!existingCategory) {
    await db.insert(categories).values(category);
  }

  const clusterSlug = safeSlug(clusterName);
  const [existingCluster] = await db
    .select()
    .from(painClusters)
    .where(
      and(
        eq(painClusters.categoryId, category.id),
        eq(painClusters.slug, clusterSlug),
      ),
    )
    .limit(1);
  const cluster = existingCluster ?? {
    id: `cl-${categorySlug}-${clusterSlug}`.slice(0, 80),
    categoryId: category.id,
    slug: clusterSlug,
    name: clusterName,
    summary:
      input.summary?.trim() || `${clusterName} pains in ${category.name}.`,
  };
  if (!existingCluster) {
    await db.insert(painClusters).values(cluster);
  }

  return { category, cluster };
}

export async function resolvePlacement(input: {
  clusterId?: string | null;
  categoryName?: string | null;
  clusterName?: string | null;
  fallbackClusterSlug?: string | null;
}) {
  if (input.categoryName?.trim()) {
    return ensurePlacement({
      categoryName: input.categoryName,
      clusterName: input.clusterName,
    });
  }
  if (input.clusterId) {
    const found = await getPlacement(input.clusterId);
    if (found) return found;
  }
  if (input.fallbackClusterSlug) {
    const match = (await listPlacementOptions()).find(
      (item) => item.slug === input.fallbackClusterSlug,
    );
    if (match) {
      const found = await getPlacement(match.id);
      if (found) return found;
    }
  }
  return { error: "Choose a cluster or add a category." };
}
