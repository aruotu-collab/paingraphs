export function merchantFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "shop";
  }
}

export function parseListingName(raw: string) {
  const name = raw.trim().replace(/\s+/g, " ").slice(0, 80);
  if (name.length < 2) return { error: "Name the product as sold." };
  if (/^https?:\/\//i.test(name)) {
    return { error: "Use the product name, not a URL." };
  }
  return { name };
}

export function listingGoHref(listingId: string, from?: string | null) {
  const path = `/go/listing/${listingId}`;
  if (!from || !from.startsWith("/") || from.startsWith("//")) return path;
  return `${path}?from=${encodeURIComponent(from.slice(0, 240))}`;
}
