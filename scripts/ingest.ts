import { loadLocalEnv } from "../lib/ingest/load-env";

loadLocalEnv();

async function main() {
  const { runIngest } = await import("../lib/ingest/run");
  const mode = process.argv.includes("--cron") ? "cron" : "full";
  const stats = await runIngest(mode, {
    reset: process.argv.includes("--reset"),
  });
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
