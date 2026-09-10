import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedSearches } from "@/lib/db/schema";
import {
  filterBillboard,
  isBillboardView,
  type BillboardFilters,
  type BillboardRow,
  type BillboardView,
} from "@/lib/opportunities/board";
import { ensureWorkspaceTables } from "@/lib/workspace/db";

export type SavedSearchInput = BillboardFilters & {
  name: string;
  view: BillboardView;
};

export function searchHref(input: {
  view: string;
  category?: string | null;
  country?: string | null;
  products?: string | null;
  programmes?: string | null;
  minIntent?: number | null;
}) {
  const params = new URLSearchParams();
  if (input.view && input.view !== "pain") params.set("view", input.view);
  if (input.category) params.set("category", input.category);
  if (input.country) params.set("country", input.country);
  if (input.products && input.products !== "any") params.set("products", input.products);
  if (input.programmes && input.programmes !== "any") {
    params.set("programmes", input.programmes);
  }
  if (input.minIntent) params.set("minIntent", String(input.minIntent));
  const query = params.toString();
  return query ? `/top-pains?${query}` : "/top-pains";
}

export async function listSavedSearches(userId: string) {
  await ensureWorkspaceTables();
  return db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));
}

export async function createSavedSearch(userId: string, input: SavedSearchInput) {
  await ensureWorkspaceTables();
  const id = crypto.randomUUID();
  await db.insert(savedSearches).values({
    id,
    userId,
    name: input.name,
    view: input.view,
    category: input.category ?? null,
    country: input.country ?? null,
    products: input.products && input.products !== "any" ? input.products : null,
    programmes:
      input.programmes && input.programmes !== "any" ? input.programmes : null,
    minIntent: input.minIntent ?? null,
    createdAt: new Date(),
  });
  return id;
}

export async function deleteSavedSearch(id: string, userId: string) {
  await ensureWorkspaceTables();
  const [row] = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.id, id))
    .limit(1);
  if (!row || row.userId !== userId) return;
  await db.delete(savedSearches).where(eq(savedSearches.id, id));
}

export function searchMatches(row: typeof savedSearches.$inferSelect, graphs: BillboardRow[]) {
  const view = isBillboardView(row.view) ? row.view : "pain";
  return filterBillboard(graphs, {
    category: row.category ?? undefined,
    country: row.country ?? undefined,
    products:
      row.products === "none" || row.products === "some" ? row.products : "any",
    programmes:
      row.programmes === "none" || row.programmes === "some"
        ? row.programmes
        : "any",
    minIntent: row.minIntent ?? undefined,
  }).map((graph) => ({ graph, view }));
}
