import { sql } from "drizzle-orm";
import { db, sqlite } from "@/lib/db";

let ready: Promise<void> | null = null;

async function tryExecute(statement: string) {
  try {
    await sqlite.execute(statement);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/duplicate column|already exists/i.test(message)) {
      console.warn("Schema migrate:", message);
    }
  }
}

async function migrateAffiliateColumns() {
  await tryExecute("ALTER TABLE affiliate_programmes ADD COLUMN owner_status TEXT");
}

let extras: Promise<void> | null = null;

export async function ensureIdentityTables() {
  if (!ready) {
    ready = createTables().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
  if (!extras) {
    extras = tryExecute(
      "ALTER TABLE user_profiles ADD COLUMN stripe_cancel_at INTEGER",
    );
  }
  await extras;
}

async function createTables() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);
  await db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_unique_idx
    ON role_permissions (role_id, permission_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS user_roles_unique_idx
    ON user_roles (user_id, role_id)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS user_roles_user_idx ON user_roles (user_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
      consumer_enabled INTEGER NOT NULL DEFAULT 1,
      affiliate_enabled INTEGER NOT NULL DEFAULT 0,
      founder_enabled INTEGER NOT NULL DEFAULT 0,
      primary_mode TEXT NOT NULL DEFAULT 'solve',
      plan TEXT NOT NULL DEFAULT 'free',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs (actor_user_id)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS affiliate_destinations (
      id TEXT PRIMARY KEY,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT '*',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await tryExecute("ALTER TABLE affiliate_destinations ADD COLUMN country TEXT");
  await tryExecute(
    "UPDATE affiliate_destinations SET country = '*' WHERE country IS NULL OR country = ''",
  );
  await db.run(
    sql`DROP INDEX IF EXISTS affiliate_destinations_pain_product_idx`,
  );
  await tryExecute(
    "CREATE UNIQUE INDEX IF NOT EXISTS affiliate_destinations_pain_product_country_idx ON affiliate_destinations (pain_id, product_id, country)",
  );
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS affiliate_programmes (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      owner_status TEXT,
      country TEXT,
      join_url TEXT,
      note TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS affiliate_programmes_product_idx
    ON affiliate_programmes (product_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS destination_clicks (
      id TEXT PRIMARY KEY,
      destination_id TEXT NOT NULL REFERENCES affiliate_destinations(id) ON DELETE CASCADE,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      country TEXT,
      visitor_country TEXT,
      source_path TEXT,
      session_id TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS destination_clicks_pain_idx
    ON destination_clicks (pain_id)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS destination_clicks_destination_idx
    ON destination_clicks (destination_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS member_destinations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT '*',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS member_destinations_user_pain_product_country_idx
    ON member_destinations (user_id, pain_id, product_id, country)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS member_destinations_user_idx
    ON member_destinations (user_id)
  `);
  await migrateAffiliateColumns();
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS daily_opportunities (
      day TEXT NOT NULL,
      lens TEXT NOT NULL,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS daily_opportunities_day_lens_idx
    ON daily_opportunities (day, lens)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS daily_opportunities_lens_idx
    ON daily_opportunities (lens)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pain_graph_scores (
      pain_id TEXT PRIMARY KEY REFERENCES pains(id) ON DELETE CASCADE,
      demand_score REAL,
      growth_score REAL,
      buying_intent_score REAL,
      recurrence_score REAL,
      dissatisfaction_score REAL,
      reachability_score REAL,
      founder_score REAL,
      paid_acquisition_score REAL,
      confidence_score REAL,
      updated_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS alert_preferences (
      user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
      email_saved_updates INTEGER NOT NULL DEFAULT 0,
      email_opportunity INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pain_watch_snapshots (
      pain_id TEXT PRIMARY KEY REFERENCES pains(id) ON DELETE CASCADE,
      evidence_count INTEGER NOT NULL,
      destination_count INTEGER NOT NULL,
      product_count INTEGER NOT NULL,
      affiliate_score REAL NOT NULL,
      founder_score REAL NOT NULL,
      captured_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS member_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      pain_id TEXT REFERENCES pains(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      href TEXT NOT NULL,
      day TEXT NOT NULL,
      read_at INTEGER,
      emailed_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS member_alerts_user_kind_pain_day_idx
    ON member_alerts (user_id, kind, pain_id, day)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS member_alerts_user_idx
    ON member_alerts (user_id)
  `);
  await tryExecute("ALTER TABLE user_profiles ADD COLUMN stripe_customer_id TEXT");
  await tryExecute("ALTER TABLE user_profiles ADD COLUMN stripe_subscription_id TEXT");
  await tryExecute(
    "ALTER TABLE user_profiles ADD COLUMN stripe_subscription_status TEXT",
  );
  await tryExecute("ALTER TABLE user_profiles ADD COLUMN stripe_cancel_at INTEGER");
}
