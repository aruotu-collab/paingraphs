import { NextRequest, NextResponse } from "next/server";
import { geoFromHeaders } from "@/lib/admin/visits";
import {
  getPlatformDestination,
  recordDestinationClick,
} from "@/lib/destinations/store";
import { parseDestinationUrl } from "@/lib/destinations/url";

export const dynamic = "force-dynamic";

function sourcePath(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  if (from?.startsWith("/") && !from.startsWith("//")) {
    return from.slice(0, 240);
  }
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return url.pathname.slice(0, 240) || "/";
  } catch {
    return null;
  }
}

function visitorSession(request: NextRequest) {
  const existing = request.cookies.get("pg_sid")?.value;
  if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) return existing;
  return crypto.randomUUID();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ destinationId: string }> },
) {
  const { destinationId } = await params;
  const destination = await getPlatformDestination(destinationId);
  const parsed = destination ? parseDestinationUrl(destination.url) : { error: "missing" };
  if (!destination || "error" in parsed) {
    return new NextResponse("Destination not found", { status: 404 });
  }

  const sessionId = visitorSession(request);
  const geo = geoFromHeaders(request.headers);
  try {
    await recordDestinationClick({
      destinationId: destination.id,
      painId: destination.painId,
      productId: destination.productId,
      country: destination.country,
      visitorCountry: geo.country,
      sourcePath: sourcePath(request),
      sessionId,
    });
  } catch (error) {
    console.warn("Destination click log failed:", error);
  }

  const response = NextResponse.redirect(parsed.url, 302);
  response.cookies.set("pg_sid", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
