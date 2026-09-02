import { loadLocalEnv } from "../lib/ingest/load-env";

loadLocalEnv();

async function main() {
  const { ingestRedditDiscover } = await import("../lib/ingest/reddit-discover");
  const stats = await ingestRedditDiscover();
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
