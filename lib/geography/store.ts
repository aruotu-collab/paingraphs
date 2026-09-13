import { and, eq } from "drizzle-orm";
import { ensureAdminTables } from "@/lib/admin/db";
import { db } from "@/lib/db";
import { pageVisits } from "@/lib/db/schema";

export async function visitCountriesForPath(path: string) {
  await ensureAdminTables();
  const rows = await db
    .select({ country: pageVisits.country })
    .from(pageVisits)
    .where(and(eq(pageVisits.path, path), eq(pageVisits.isBot, false)))
    .catch(() => []);
  return rows.map((row) => row.country);
}
