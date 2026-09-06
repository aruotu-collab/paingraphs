import { NextResponse } from "next/server";
import { runSavedPainAlerts } from "@/lib/alerts/run";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const alerts = await runSavedPainAlerts();
  return NextResponse.json({
    ok: true,
    alerts,
    reason: "Saved-pain alerts and daily opportunities. The old discovery pipeline stays removed.",
  });
}
