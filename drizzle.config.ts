import { defineConfig } from "drizzle-kit";
import { loadLocalEnv } from "./lib/ingest/load-env";

loadLocalEnv();

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "file:./data/paingraphs.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: authToken ? "turso" : "sqlite",
  dbCredentials: authToken ? { url, authToken } : { url },
});
