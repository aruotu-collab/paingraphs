import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberProducts } from "@/lib/db/schema";
import { listPainGraphs } from "@/lib/paingraph/queries";
import { ensureWorkspaceTables } from "@/lib/workspace/db";
import { matchProductToPains, matchSummary } from "./match";

export async function listMemberProducts(userId: string) {
  await ensureWorkspaceTables();
  return db
    .select()
    .from(memberProducts)
    .where(eq(memberProducts.userId, userId))
    .orderBy(desc(memberProducts.createdAt));
}

export async function listOwnerProducts() {
  await ensureWorkspaceTables();
  return db
    .select()
    .from(memberProducts)
    .where(eq(memberProducts.ownerOwned, true))
    .orderBy(desc(memberProducts.updatedAt));
}

export async function getMemberProduct(id: string, userId?: string) {
  await ensureWorkspaceTables();
  const [row] = await db
    .select()
    .from(memberProducts)
    .where(eq(memberProducts.id, id))
    .limit(1);
  if (!row) return null;
  if (userId && row.userId !== userId && !row.ownerOwned) return null;
  return row;
}

export async function createMemberProduct(input: {
  userId: string;
  name: string;
  url: string;
  description: string;
  targetCustomer?: string | null;
  geography?: string | null;
  price?: string | null;
  categorySlug?: string | null;
  problemsSolved?: string | null;
  features?: string | null;
  positioning?: string | null;
  ownerOwned: boolean;
}) {
  await ensureWorkspaceTables();
  const now = new Date();
  const id = crypto.randomUUID();
  await db.insert(memberProducts).values({
    id,
    userId: input.userId,
    name: input.name,
    url: input.url,
    description: input.description,
    targetCustomer: input.targetCustomer ?? null,
    geography: input.geography ?? null,
    price: input.price ?? null,
    categorySlug: input.categorySlug ?? null,
    problemsSolved: input.problemsSolved ?? null,
    features: input.features ?? null,
    positioning: input.positioning ?? null,
    ownerOwned: input.ownerOwned,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function deleteMemberProduct(id: string, userId: string) {
  await ensureWorkspaceTables();
  const row = await getMemberProduct(id, userId);
  if (!row || row.userId !== userId) return;
  await db.delete(memberProducts).where(eq(memberProducts.id, id));
}

export async function productMatchesFor(userId: string) {
  const [products, graphs] = await Promise.all([
    listMemberProducts(userId),
    listPainGraphs(),
  ]);
  return products.map((product) => {
    const matches = matchProductToPains(product, graphs);
    return { product, matches, summary: matchSummary(matches) };
  });
}

export async function ownerMatchesByPain() {
  const [products, graphs] = await Promise.all([
    listOwnerProducts(),
    listPainGraphs(),
  ]);
  const byPain = new Map<string, string[]>();
  for (const product of products) {
    for (const match of matchProductToPains(product, graphs).slice(0, 8)) {
      const names = byPain.get(match.graph.id) ?? [];
      names.push(product.name);
      byPain.set(match.graph.id, names);
    }
  }
  return byPain;
}
