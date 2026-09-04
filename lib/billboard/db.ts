import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ready: Promise<void> | null = null;

export async function ensureBillboardTables() {
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
    CREATE TABLE IF NOT EXISTS billboard_topics (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      problem TEXT NOT NULL,
      why_now TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      category_name TEXT NOT NULL,
      search_phrase TEXT NOT NULL,
      evidence TEXT NOT NULL,
      sources TEXT NOT NULL,
      heat INTEGER NOT NULL,
      intent INTEGER NOT NULL,
      pain INTEGER NOT NULL,
      rank INTEGER NOT NULL,
      days_on_chart INTEGER NOT NULL,
      chart_date TEXT NOT NULL,
      pain_id TEXT,
      first_seen_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS billboard_topics_rank_idx ON billboard_topics (rank)
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS billboard_favourites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      topic_id TEXT NOT NULL REFERENCES billboard_topics(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS billboard_fav_user_topic_idx
    ON billboard_favourites (user_id, topic_id)
  `);
}
