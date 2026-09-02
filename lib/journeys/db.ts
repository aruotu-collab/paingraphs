import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ready: Promise<void> | null = null;

export async function ensureJourneyTables() {
  if (!ready) {
    ready = createTables().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function createTables() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS product_scans (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      name TEXT NOT NULL,
      dna TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS product_scans_user_idx ON product_scans (user_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pain_hypotheses (
      id TEXT PRIMARY KEY,
      scan_id TEXT REFERENCES product_scans(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
      catalog_pain_id TEXT REFERENCES pains(id) ON DELETE SET NULL,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      h1 TEXT NOT NULL,
      problem TEXT NOT NULL,
      audience TEXT NOT NULL,
      analysis TEXT NOT NULL,
      unmet_need TEXT NOT NULL,
      questions TEXT NOT NULL,
      campaign_pack TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'hypothesis',
      origin TEXT NOT NULL DEFAULT 'inside-out',
      match_score INTEGER NOT NULL DEFAULT 0,
      is_public INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS pain_hypotheses_user_idx ON pain_hypotheses (user_id)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS pain_hypotheses_status_idx ON pain_hypotheses (status)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS hypothesis_metrics (
      id TEXT PRIMARY KEY,
      hypothesis_id TEXT NOT NULL REFERENCES pain_hypotheses(id) ON DELETE CASCADE,
      impressions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      visitors INTEGER NOT NULL DEFAULT 0,
      quiz_starts INTEGER NOT NULL DEFAULT 0,
      quiz_completed INTEGER NOT NULL DEFAULT 0,
      opt_ins INTEGER NOT NULL DEFAULT 0,
      has_problem INTEGER NOT NULL DEFAULT 0,
      consider_buy INTEGER NOT NULL DEFAULT 0,
      waitlist INTEGER NOT NULL DEFAULT 0,
      purchases INTEGER NOT NULL DEFAULT 0,
      spend_pence INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS hypothesis_answers (
      id TEXT PRIMARY KEY,
      hypothesis_id TEXT NOT NULL REFERENCES pain_hypotheses(id) ON DELETE CASCADE,
      answers TEXT NOT NULL,
      has_problem INTEGER NOT NULL DEFAULT 0,
      email TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS affiliate_offers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      network TEXT NOT NULL DEFAULT 'clickbank',
      name TEXT NOT NULL,
      sales_url TEXT NOT NULL,
      vendor TEXT,
      category TEXT,
      description TEXT NOT NULL,
      price TEXT,
      commission_type TEXT,
      commission_amount TEXT,
      recurring INTEGER NOT NULL DEFAULT 0,
      hop_link TEXT NOT NULL,
      gravity REAL,
      avg_payout TEXT,
      dna TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS affiliate_offers_user_idx ON affiliate_offers (user_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS offer_pain_matches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      offer_id TEXT NOT NULL REFERENCES affiliate_offers(id) ON DELETE CASCADE,
      pain_id TEXT REFERENCES pains(id) ON DELETE SET NULL,
      hypothesis_id TEXT REFERENCES pain_hypotheses(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      problem TEXT NOT NULL,
      pain_score INTEGER NOT NULL DEFAULT 0,
      money_score INTEGER NOT NULL DEFAULT 0,
      product_fit INTEGER NOT NULL DEFAULT 0,
      underserved_score INTEGER NOT NULL DEFAULT 0,
      performance_score INTEGER NOT NULL DEFAULT 0,
      recommendable INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'new',
      evidence_note TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS offer_pain_matches_user_idx ON offer_pain_matches (user_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS programme_leads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      pain_id TEXT REFERENCES pains(id) ON DELETE SET NULL,
      pain_title TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      network TEXT NOT NULL,
      commission TEXT NOT NULL,
      cookie TEXT NOT NULL,
      price TEXT NOT NULL,
      fit INTEGER NOT NULL DEFAULT 0,
      evidence TEXT NOT NULL,
      sources TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  const alters = [
    sql`ALTER TABLE offer_pain_matches ADD COLUMN intent_score INTEGER NOT NULL DEFAULT 0`,
    sql`ALTER TABLE offer_pain_matches ADD COLUMN draft_slug TEXT`,
    sql`ALTER TABLE offer_pain_matches ADD COLUMN pack_json TEXT`,
    sql`ALTER TABLE offer_pain_matches ADD COLUMN visitors INTEGER NOT NULL DEFAULT 0`,
    sql`ALTER TABLE offer_pain_matches ADD COLUMN quiz_completed INTEGER NOT NULL DEFAULT 0`,
    sql`ALTER TABLE offer_pain_matches ADD COLUMN affiliate_clicks INTEGER NOT NULL DEFAULT 0`,
    sql`ALTER TABLE offer_pain_matches ADD COLUMN sales INTEGER NOT NULL DEFAULT 0`,
    sql`ALTER TABLE offer_pain_matches ADD COLUMN commission_pence INTEGER NOT NULL DEFAULT 0`,
    sql`ALTER TABLE affiliate_offers ADD COLUMN assets TEXT`,
    sql`ALTER TABLE affiliate_offers ADD COLUMN countries TEXT`,
    sql`ALTER TABLE programme_leads ADD COLUMN pain_title TEXT NOT NULL DEFAULT ''`,
  ];
  for (const stmt of alters) {
    try {
      await db.run(stmt);
    } catch {
      /* column already exists */
    }
  }
}
