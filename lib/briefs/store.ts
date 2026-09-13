import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaignBriefs } from "@/lib/db/schema";
import {
  clickCounts,
  conversionTotals,
  productsForPain,
} from "@/lib/destinations/store";
import { getAnyPainGraph } from "@/lib/paingraph/queries";
import { ensureWorkspaceTables } from "@/lib/workspace/db";
import {
  buildCampaignBrief,
  isBriefObjective,
  type BriefObjective,
  type CampaignBriefBody,
} from "./build";

export async function listBriefs(userId: string) {
  await ensureWorkspaceTables();
  return db
    .select()
    .from(campaignBriefs)
    .where(eq(campaignBriefs.userId, userId))
    .orderBy(desc(campaignBriefs.createdAt));
}

export async function getBrief(id: string, userId: string) {
  await ensureWorkspaceTables();
  const [row] = await db
    .select()
    .from(campaignBriefs)
    .where(eq(campaignBriefs.id, id))
    .limit(1);
  if (!row || row.userId !== userId) return null;
  return {
    ...row,
    brief: JSON.parse(row.briefJson) as CampaignBriefBody,
  };
}

export async function createBrief(input: {
  userId: string;
  painId: string;
  country: string;
  destinationUrl?: string | null;
  dailyBudget?: string | null;
  objective: BriefObjective;
  includeDrafts?: boolean;
}) {
  await ensureWorkspaceTables();
  const graph = await getAnyPainGraph(input.painId);
  if (!graph) return { error: "PainGraph not found." };
  if (graph.status !== "published" && !input.includeDrafts) {
    return { error: "PainGraph not found." };
  }
  const [products, clicks, revenue] = await Promise.all([
    productsForPain(input.painId),
    clickCounts(),
    conversionTotals(),
  ]);
  const money = revenue.get(input.painId) ?? { amount: 0, count: 0 };
  const body = buildCampaignBrief({
    graph,
    country: input.country,
    destinationUrl: input.destinationUrl,
    dailyBudget: input.dailyBudget,
    objective: input.objective,
    productNames: products.map((item) => item.name),
    clicks: clicks.get(input.painId) ?? 0,
    revenue: money.amount,
    conversions: money.count,
  });
  const id = crypto.randomUUID();
  await db.insert(campaignBriefs).values({
    id,
    userId: input.userId,
    painId: input.painId,
    country: input.country,
    destinationUrl: input.destinationUrl ?? null,
    dailyBudget: input.dailyBudget ?? null,
    objective: input.objective,
    briefJson: JSON.stringify(body),
    createdAt: new Date(),
  });
  return { id };
}

export { isBriefObjective };
export type { BriefObjective, CampaignBriefBody };
