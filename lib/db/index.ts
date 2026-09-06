import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "file:./data/paingraphs.db";

if (url.startsWith("file:")) {
  mkdirSync(dirname(url.replace(/^file:/, "")), { recursive: true });
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const sqlite = client;
export const db = drizzle(client, { schema });
