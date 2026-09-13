import { eq, inArray } from "drizzle-orm";
import { ensureCatalog } from "@/lib/catalog/sync";
import { db } from "@/lib/db";
import { affiliateProgrammes, productFits } from "@/lib/db/schema";

export async function listProgrammesForProducts(productIds: string[]) {
  await ensureCatalog();
  if (productIds.length === 0) return [];
  return db
    .select()
    .from(affiliateProgrammes)
    .where(inArray(affiliateProgrammes.productId, productIds));
}

export async function programmeCounts() {
  await ensureCatalog();
  const rows = await db
    .select({
      painId: productFits.painId,
      name: affiliateProgrammes.name,
    })
    .from(productFits)
    .innerJoin(
      affiliateProgrammes,
      eq(affiliateProgrammes.productId, productFits.productId),
    );
  const names = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = names.get(row.painId) ?? new Set<string>();
    set.add(row.name);
    names.set(row.painId, set);
  }
  return new Map([...names].map(([painId, set]) => [painId, set.size]));
}

export function nextMonetisationAction(input: {
  affiliateScore: number;
  founderScore: number;
  destinations: number;
  programmes: number;
  clicks?: number;
  revenue?: number;
  paidAcquisition?: number | null;
  published?: boolean;
}) {
  if ((input.revenue ?? 0) > 0) return "Revenue recorded";
  if ((input.paidAcquisition ?? 0) >= 70 && input.published === false) {
    return "Improve landing page";
  }
  if ((input.paidAcquisition ?? 0) >= 70 && input.destinations > 0) {
    return "Build campaign";
  }
  if ((input.clicks ?? 0) > 0) return "Clicks live";
  if (input.destinations > 0) return "Destination live";
  if (input.programmes > 0) return "Find programme";
  if (input.affiliateScore >= 75) return "Add destination";
  if (input.founderScore >= 70) return "Build / watch";
  return "Watch";
}

export function effectiveProgrammeStatus(row: {
  status: string;
  ownerStatus?: string | null;
}) {
  return row.ownerStatus === "confirmed" ? "confirmed" : row.status;
}
