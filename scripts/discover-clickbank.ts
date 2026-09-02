import { loadLocalEnv } from "../lib/ingest/load-env";

loadLocalEnv();

async function main() {
  const { ingestClickbankDiscover } = await import("../lib/ingest/clickbank-discover");
  const stats = await ingestClickbankDiscover();
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
