import { loadLocalEnv } from "../lib/ingest/load-env";

loadLocalEnv();

async function main() {
  const { createClient } = await import("@libsql/client");
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./data/paingraphs.db";
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const statements = [
    `DROP TABLE IF EXISTS recommended_actions`,
    `DROP TABLE IF EXISTS matches`,
    `DROP TABLE IF EXISTS product_profiles`,
    `DROP TABLE IF EXISTS saved_markets`,
    `DROP TABLE IF EXISTS solution_problems`,
    `DROP TABLE IF EXISTS solutions`,
    `DROP TABLE IF EXISTS providers`,
    `DROP TABLE IF EXISTS workarounds`,
    `DROP TABLE IF EXISTS problem_scores`,
    `DROP TABLE IF EXISTS problem_links`,
    `DROP TABLE IF EXISTS pain_signals`,
    `DROP TABLE IF EXISTS raw_documents`,
    `DROP TABLE IF EXISTS problems`,
    `DROP TABLE IF EXISTS sources`,
    `DROP TABLE IF EXISTS personas`,
    `DROP TABLE IF EXISTS countries`,
    `DROP TABLE IF EXISTS niches`,
    `DROP TABLE IF EXISTS industries`,
    `DROP TABLE IF EXISTS watchlists`,
    `DROP TABLE IF EXISTS assessments`,
    `DROP TABLE IF EXISTS product_fits`,
    `DROP TABLE IF EXISTS products`,
    `DROP TABLE IF EXISTS criteria`,
    `DROP TABLE IF EXISTS pains`,
    `DROP TABLE IF EXISTS pain_clusters`,
    `DROP TABLE IF EXISTS categories`,
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      summary TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS pain_clusters (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      summary TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS pain_clusters_category_slug_idx ON pain_clusters (category_id, slug)`,
    `CREATE TABLE IF NOT EXISTS pains (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL REFERENCES pain_clusters(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      h1 TEXT NOT NULL,
      problem TEXT NOT NULL,
      analysis TEXT NOT NULL,
      why_now TEXT,
      strategy TEXT NOT NULL,
      stage INTEGER NOT NULL DEFAULT 3,
      pain_score REAL NOT NULL,
      intent_score REAL NOT NULL,
      competition_score REAL NOT NULL,
      product_gap REAL NOT NULL,
      affiliate_score REAL NOT NULL,
      organic_score REAL NOT NULL,
      opportunity REAL NOT NULL,
      trend REAL NOT NULL,
      sensitive INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      updated_at INTEGER NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS pains_cluster_slug_idx ON pains (cluster_id, slug)`,
    `CREATE TABLE IF NOT EXISTS pain_signals (
      id TEXT PRIMARY KEY,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      raw_quote TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      source_label TEXT NOT NULL,
      source_url TEXT,
      published_at INTEGER,
      created_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS pain_signals_pain_idx ON pain_signals (pain_id)`,
    `CREATE TABLE IF NOT EXISTS criteria (
      id TEXT PRIMARY KEY,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      detail TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS criteria_pain_idx ON criteria (pain_id)`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      summary TEXT NOT NULL,
      who_for TEXT NOT NULL,
      search_query TEXT NOT NULL,
      price_band TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS product_fits (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      scores TEXT NOT NULL,
      note TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS product_fits_unique_idx ON product_fits (product_id, pain_id)`,
    `CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      priorities TEXT NOT NULL,
      email TEXT,
      consent_report INTEGER NOT NULL DEFAULT 0,
      consent_marketing INTEGER NOT NULL DEFAULT 0,
      consent_sensitive INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS assessments_pain_idx ON assessments (pain_id)`,
    `CREATE TABLE IF NOT EXISTS watchlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS watchlists_user_pain_idx ON watchlists (user_id, pain_id)`,
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }
  console.log("v2 tables ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
