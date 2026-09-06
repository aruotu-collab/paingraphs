export const DESTINATION_COUNTRIES = [
  { code: "*", label: "Default / any country" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "IE", label: "Ireland" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "AU", label: "Australia" },
  { code: "CA", label: "Canada" },
] as const;

const COUNTRY_CODES = new Set<string>(DESTINATION_COUNTRIES.map((row) => row.code));

export function parseDestinationUrl(raw: string) {
  const value = raw.trim();
  if (!value) return { error: "Paste a real tracking URL, or clear the field." };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { error: "That is not a valid URL." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { error: "Only http or https destinations are allowed." };
  }
  return { url: url.toString() };
}

export function parseCountry(raw: string) {
  const value = raw.trim().toUpperCase();
  if (raw.trim() === "*") return "*";
  if (COUNTRY_CODES.has(value)) return value;
  return "*";
}

export function countryLabel(code: string | null | undefined) {
  const match = DESTINATION_COUNTRIES.find((row) => row.code === (code || "*"));
  return match?.label ?? code ?? "Default / any country";
}

export function goHref(destinationId: string) {
  return `/go/${destinationId}`;
}

export function pickPublicDestination<
  T extends { productId: string; country: string | null },
>(rows: T[], productId: string, visitorCountry?: string | null) {
  const list = rows.filter((row) => row.productId === productId);
  if (visitorCountry) {
    const exact = list.find(
      (row) => (row.country || "*").toUpperCase() === visitorCountry.toUpperCase(),
    );
    if (exact) return exact;
  }
  return list.find((row) => !row.country || row.country === "*") ?? list[0] ?? null;
}
