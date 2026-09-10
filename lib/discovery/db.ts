import { sql } from "drizzle-orm";
import { ensureCatalog } from "@/lib/catalog/sync";
import { db, sqlite } from "@/lib/db";
import { ensureWorkspaceTables } from "@/lib/workspace/db";

let ready: Promise<void> | null = null;

async function tryExecute(statement: string) {
  try {
    await sqlite.execute(statement);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/duplicate column|already exists/i.test(message)) {
      console.warn("Discovery schema:", message);
    }
  }
}

export async function ensureDiscoveryTables() {
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
    CREATE TABLE IF NOT EXISTS discovery_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      access_method TEXT NOT NULL,
      commercial_use TEXT NOT NULL,
      terms_notes TEXT,
      attribution TEXT,
      retention TEXT,
      rate_limit TEXT,
      frequency_hours INTEGER NOT NULL DEFAULT 24,
      quality_score REAL,
      trust_score REAL,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_ingested_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS discovery_signals (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES discovery_sources(id) ON DELETE CASCADE,
      raw_text TEXT NOT NULL,
      source_url TEXT,
      persona TEXT,
      geography TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      matched_pain_id TEXT REFERENCES pains(id) ON DELETE SET NULL,
      candidate_id TEXT,
      confidence REAL,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS discovery_signals_status_idx
    ON discovery_signals (status)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS discovery_signals_source_idx
    ON discovery_signals (source_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pain_candidates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      problem TEXT NOT NULL,
      persona TEXT,
      category_slug TEXT,
      cluster_slug TEXT,
      countries TEXT,
      products_detected TEXT,
      evidence_count INTEGER NOT NULL DEFAULT 0,
      source_types TEXT,
      confidence REAL,
      buying_intent REAL,
      severity REAL,
      founder_opportunity REAL,
      affiliate_opportunity REAL,
      related_pain_id TEXT REFERENCES pains(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'new',
      origin TEXT NOT NULL DEFAULT 'manual',
      source_id TEXT REFERENCES discovery_sources(id) ON DELETE SET NULL,
      pain_id TEXT REFERENCES pains(id) ON DELETE SET NULL,
      review_note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      reviewed_at INTEGER
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS pain_candidates_status_idx ON pain_candidates (status)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS pain_candidates_origin_idx ON pain_candidates (origin)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pain_candidate_signals (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES pain_candidates(id) ON DELETE CASCADE,
      raw_quote TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      source_label TEXT NOT NULL,
      source_url TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS pain_candidate_signals_candidate_idx
    ON pain_candidate_signals (candidate_id)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pain_rank_snapshots (
      day TEXT NOT NULL,
      view TEXT NOT NULL,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      rank INTEGER NOT NULL,
      score REAL NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  await tryExecute(
    "CREATE UNIQUE INDEX IF NOT EXISTS pain_rank_snapshots_day_view_pain_idx ON pain_rank_snapshots (day, view, pain_id)",
  );
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS pain_rank_snapshots_day_view_idx
    ON pain_rank_snapshots (day, view)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ingest_runs (
      id TEXT PRIMARY KEY,
      ok INTEGER NOT NULL DEFAULT 1,
      summary TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS ingest_runs_started_idx ON ingest_runs (started_at)
  `);
  await tryExecute("ALTER TABLE discovery_sources ADD COLUMN feed_url TEXT");
  await tryExecute("ALTER TABLE discovery_signals ADD COLUMN fingerprint TEXT");
  await tryExecute("ALTER TABLE discovery_signals ADD COLUMN extracted_json TEXT");
  await tryExecute("ALTER TABLE discovery_signals ADD COLUMN extracted_at INTEGER");
  await tryExecute("ALTER TABLE pain_candidates ADD COLUMN workaround TEXT");
  await tryExecute("ALTER TABLE pain_candidates ADD COLUMN trigger_text TEXT");
  await tryExecute("ALTER TABLE pain_candidates ADD COLUMN job_to_be_done TEXT");
  await tryExecute("ALTER TABLE pain_candidates ADD COLUMN extraction_json TEXT");
  await tryExecute(
    "CREATE INDEX IF NOT EXISTS discovery_signals_fingerprint_idx ON discovery_signals (fingerprint)",
  );
  await ensureWorkspaceTables();
}
