import { sql } from "drizzle-orm";
import { ensureCatalog } from "@/lib/catalog/sync";
import { db, sqlite } from "@/lib/db";

let ready: Promise<void> | null = null;

async function tryExecute(statement: string) {
  try {
    await sqlite.execute(statement);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/duplicate column|already exists/i.test(message)) {
      console.warn("Workspace schema:", message);
    }
  }
}

export async function ensureWorkspaceTables() {
  if (!ready) {
    ready = createTables().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function createTables() {
  await ensureCatalog();
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS member_products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT NOT NULL,
      target_customer TEXT,
      geography TEXT,
      price TEXT,
      category_slug TEXT,
      problems_solved TEXT,
      features TEXT,
      positioning TEXT,
      owner_owned INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS member_products_user_idx ON member_products (user_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS campaign_briefs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      country TEXT NOT NULL DEFAULT '*',
      destination_url TEXT,
      daily_budget TEXT,
      objective TEXT NOT NULL,
      brief_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS campaign_briefs_user_idx ON campaign_briefs (user_id)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS campaign_briefs_pain_idx ON campaign_briefs (pain_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      view TEXT NOT NULL,
      category TEXT,
      country TEXT,
      products TEXT,
      programmes TEXT,
      min_intent INTEGER,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS saved_searches_user_idx ON saved_searches (user_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS product_prices (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      pain_id TEXT REFERENCES pains(id) ON DELETE CASCADE,
      display TEXT NOT NULL,
      amount_pence INTEGER,
      currency TEXT NOT NULL DEFAULT 'GBP',
      source_label TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS product_prices_product_idx ON product_prices (product_id)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS product_prices_pain_idx ON product_prices (pain_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS price_watches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    )
  `);
  await tryExecute(
    "CREATE UNIQUE INDEX IF NOT EXISTS price_watches_user_product_pain_idx ON price_watches (user_id, product_id, pain_id)",
  );
  await tryExecute(
    "ALTER TABLE alert_preferences ADD COLUMN email_price_updates INTEGER NOT NULL DEFAULT 0",
  );
  await tryExecute(
    "ALTER TABLE alert_preferences ADD COLUMN email_search_updates INTEGER NOT NULL DEFAULT 0",
  );
  await tryExecute("ALTER TABLE discovery_sources ADD COLUMN feed_url TEXT");
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS recommendation_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      priorities_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await tryExecute(
    "CREATE UNIQUE INDEX IF NOT EXISTS recommendation_preferences_user_pain_idx ON recommendation_preferences (user_id, pain_id)",
  );
}
