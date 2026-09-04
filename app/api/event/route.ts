import { NextResponse } from "next/server";
import { PAINGRAPH_CLICK, recordPageEvent } from "@/lib/admin/events";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { kind?: string; path?: string; painId?: string } = {};
  try {
    body = (await request.json()) as {
      kind?: string;
      path?: string;
      painId?: string;
    };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (body.kind !== PAINGRAPH_CLICK) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const session = await auth.api.getSession({ headers: request.headers });
  try {
    await recordPageEvent({
      kind: body.kind,
      path: String(body.path || "/"),
      painId: body.painId ? String(body.painId) : null,
      headers: request.headers,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
    });
  } catch (error) {
    console.warn("Event log failed:", error);
  }
  return NextResponse.json({ ok: true });
}
