import { NextResponse } from "next/server";
import { recordPageVisit } from "@/lib/admin/visits";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { path?: string; referrer?: string; landingReferrer?: string } = {};
  try {
    body = (await request.json()) as {
      path?: string;
      referrer?: string;
      landingReferrer?: string;
    };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const session = await auth.api.getSession({ headers: request.headers });
  try {
    await recordPageVisit({
      rawPath: String(body.path || "/"),
      referrer: body.referrer,
      landingReferrer: body.landingReferrer,
      headers: request.headers,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
    });
  } catch (error) {
    console.warn("Visit log failed:", error);
  }
  return NextResponse.json({ ok: true });
}
