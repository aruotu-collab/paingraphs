import { NextResponse } from "next/server";
import { runDiscoveryIngest } from "@/lib/discovery/ingest";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const hosted = process.env.VERCEL === "1";
  if (secret ? auth !== `Bearer ${secret}` : hosted) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const ingest = await runDiscoveryIngest();
    return NextResponse.json({ ok: true, ingest });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed.";
    console.error("Ingest failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
