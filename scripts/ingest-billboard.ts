import { loadLocalEnv } from "../lib/ingest/load-env";

loadLocalEnv();

async function main() {
  const { ingestBillboard } = await import("../lib/billboard/ingest");
  const stats = await ingestBillboard();
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
