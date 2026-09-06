import { PRODUCTS } from "@/lib/catalog/data";
import type { CatalogProgramme } from "@/lib/catalog/types";

const AMAZON_ASSOCIATES_UK = "https://affiliate-program.amazon.co.uk/";
const AWIN_PUBLISHERS_UK = "https://www.awin.com/gb/publishers";
const EBAY_PARTNER_NETWORK = "https://partnernetwork.ebay.com/";

const ALLOWED_JOIN_HOSTS = new Set([
  "affiliate-program.amazon.co.uk",
  "www.awin.com",
  "partnernetwork.ebay.com",
]);

export function allowedJoinUrl(raw: string | null) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (!ALLOWED_JOIN_HOSTS.has(url.host)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function programmesForProduct(productId: string): CatalogProgramme[] {
  return [
    {
      id: `${productId}-amazon-uk`,
      productId,
      name: "Amazon Associates",
      kind: "retailer",
      status: "merchant_needs_confirmation",
      country: "GB",
      joinUrl: AMAZON_ASSOCIATES_UK,
      note: "Amazon often sells this type of product in the UK. Confirm a specific listing, then create your tracking URL in Associates. Do not paste an Amazon search URL.",
    },
    {
      id: `${productId}-awin-uk`,
      productId,
      name: "Awin",
      kind: "network",
      status: "likely",
      country: "GB",
      joinUrl: AWIN_PUBLISHERS_UK,
      note: "UK retailers often run through Awin. Search for the brand after you pick a SKU. Join only if that advertiser is listed.",
    },
    {
      id: `${productId}-ebay-epn`,
      productId,
      name: "eBay Partner Network",
      kind: "network",
      status: "merchant_needs_confirmation",
      country: null,
      joinUrl: EBAY_PARTNER_NETWORK,
      note: "eBay often lists this type of product. Confirm a specific listing in Partner Network, then paste the tracking URL you create there. Do not paste an eBay search page.",
    },
    {
      id: `${productId}-brand`,
      productId,
      name: "Brand affiliate programme",
      kind: "brand",
      status: "sku_needs_confirmation",
      country: null,
      joinUrl: null,
      note: "Pick a specific model first. Then look up that brand’s official affiliate page. PainGraphs will not invent that URL.",
    },
  ];
}

export const PROGRAMMES: CatalogProgramme[] = PRODUCTS.flatMap((product) =>
  programmesForProduct(product.id),
);
