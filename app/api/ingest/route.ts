import { NextResponse } from "next/server";
import { runIngest } from "@/lib/ingest/run";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await runIngest();
  return NextResponse.json(stats);
}
