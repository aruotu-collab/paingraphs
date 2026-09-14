import {
  DESTINATION_COUNTRIES,
  countryLabel,
} from "@/lib/destinations/url";

const ALIASES: Record<string, string> = {
  UK: "GB",
  GBR: "GB",
  USA: "US",
  UNITEDKINGDOM: "GB",
  UNITEDSTATES: "US",
};

const KNOWN = new Set<string>(
  DESTINATION_COUNTRIES.filter((row) => row.code !== "*").map((row) => row.code),
);

export function normalizeCountry(raw: string | null | undefined) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "*" || trimmed.toUpperCase() === "XX") return null;
  const compact = trimmed.toUpperCase().replace(/[^A-Z]/g, "");
  const code = ALIASES[compact] ?? (compact.length === 2 ? compact : null);
  if (!code || !KNOWN.has(code)) return null;
  return code;
}

export function uniqueCountries(values: Array<string | null | undefined>) {
  return [...new Set(values.map(normalizeCountry).filter(Boolean))] as string[];
}

export function formatCountryCodes(codes: string[]) {
  if (codes.length === 0) return "—";
  return codes.map((code) => countryLabel(code)).join(" · ");
}
