import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ensureIdentityTables } from "@/lib/identity/db";

let ready: Promise<void> | null = null;

export async function ensureAdminTables() {
  if (!ready) {
    ready = createTables().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function createTables() {
  await ensureIdentityTables();
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS page_visits (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      query TEXT,
      ip TEXT NOT NULL,
      country TEXT,
      city TEXT,
      user_agent TEXT,
      referrer TEXT,
      source TEXT,
      source_host TEXT,
      user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
      email TEXT,
      is_bot INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS page_visits_created_idx ON page_visits (created_at)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS page_visits_ip_idx ON page_visits (ip)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS page_visits_path_idx ON page_visits (path)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS page_events (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      path TEXT NOT NULL,
      pain_id TEXT,
      ip TEXT,
      user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
      email TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS page_events_kind_idx ON page_events (kind)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS page_events_pain_idx ON page_events (pain_id)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS page_events_path_idx ON page_events (path)
  `);
  for (const stmt of [
    sql`ALTER TABLE page_visits ADD COLUMN source TEXT`,
    sql`ALTER TABLE page_visits ADD COLUMN source_host TEXT`,
  ]) {
    try {
      await db.run(stmt);
    } catch {
      /* column already exists */
    }
  }
}
