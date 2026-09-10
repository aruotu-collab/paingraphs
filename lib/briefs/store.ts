import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaignBriefs } from "@/lib/db/schema";
import { productsForPain } from "@/lib/destinations/store";
import { getPainGraph } from "@/lib/paingraph/queries";
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
}) {
  await ensureWorkspaceTables();
  const graph = await getPainGraph(input.painId);
  if (!graph) return { error: "PainGraph not found." };
  const products = await productsForPain(input.painId);
  const body = buildCampaignBrief({
    graph,
    country: input.country,
    destinationUrl: input.destinationUrl,
    dailyBudget: input.dailyBudget,
    objective: input.objective,
    productNames: products.map((item) => item.name),
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
