import { NextRequest, NextResponse } from "next/server";
import { geoFromHeaders } from "@/lib/admin/visits";
import { parseDestinationUrl } from "@/lib/destinations/url";
import { getListing, recordListingClick } from "@/lib/listings/store";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  const listing = await getListing(listingId);
  const parsed = listing ? parseDestinationUrl(listing.url) : { error: "missing" };
  if (!listing || "error" in parsed) {
    return new NextResponse("Listing not found", { status: 404 });
  }

  const geo = geoFromHeaders(request.headers);
  try {
    await recordListingClick({
      listingId: listing.id,
      painId: listing.painId,
      productId: listing.productId,
      visitorCountry: geo.country,
      sourcePath: sourcePath(request),
    });
  } catch (error) {
    console.warn("Listing click log failed:", error);
  }

  return NextResponse.redirect(parsed.url, 302);
}
